import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SiteService } from '../../services/site.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { BookingService } from '../../services/booking.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { FirebaseService } from '../../services/firebase.service';
import { StaffService } from '../../services/staff.service';
import { DialogService } from '../../services/dialog.service';
import { LanguageService } from '../../services/language.service';
import { 
  SiteProject,
  SiteExpense,
  ExpenseCategory, 
  ElectricianEmployee, 
  SiteWorkAllocation, 
  WorkerWagePayout, 
  SiteProfitReport, 
  ShiftType, 
  AllocationStatus, 
  EmployeeRole,
  ContractType,
  StaffLeaveRequest,
  StaffClaimRequest
} from '../../models/site.model';

import { Product } from '../../models/product.model';
import { Order, OrderStatus } from '../../models/order.model';
import { Booking, ServiceCategory } from '../../models/booking.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss']
})
export class AdminPage implements OnInit {
  siteService = inject(SiteService);
  productService = inject(ProductService);
  orderService = inject(OrderService);
  bookingService = inject(BookingService);
  authService = inject(AuthService);
  configService = inject(ConfigService);
  firebaseService = inject(FirebaseService);
  staffService = inject(StaffService);
  dialogService = inject(DialogService);
  langService = inject(LanguageService);

  // --- Staff Leave Review ---
  async approveLeave(leaveId: string): Promise<void> {
    const note = await this.dialogService.prompt({
      title: 'Approve Leave Request',
      message: 'Add an optional approval remark for the technician:',
      placeholder: 'e.g. Approved by Master Contractor',
      confirmText: 'Approve Leave'
    });
    if (note !== null) {
      this.staffService.updateLeaveStatus(leaveId, 'approved', note.trim() || undefined);
      await this.dialogService.alert({
        title: 'Leave Approved',
        message: 'Leave application approved successfully.',
        type: 'success'
      });
    }
  }

  async rejectLeave(leaveId: string): Promise<void> {
    const reason = await this.dialogService.prompt({
      title: 'Decline Leave Request',
      message: 'Specify reason for declining technician leave:',
      placeholder: 'e.g. Work commitments on scheduled dates',
      confirmText: 'Decline'
    });
    if (reason !== null) {
      this.staffService.updateLeaveStatus(leaveId, 'rejected', reason.trim() || undefined);
      await this.dialogService.alert({
        title: 'Leave Declined',
        message: 'Leave request has been declined.',
        type: 'info'
      });
    }
  }

  async deleteLeave(leaveId: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Leave Record',
      message: 'Are you sure you want to permanently delete this leave application record?',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      this.staffService.deleteLeaveRequest(leaveId);
    }
  }

  // --- Staff On-Site Expense & Advance Claims Review ---
  async approveClaim(claimId: string): Promise<void> {
    const note = await this.dialogService.prompt({
      title: 'Approve Claim',
      message: 'Add an optional approval note for the technician:',
      placeholder: 'e.g. Reimbursed in cash on site',
      confirmText: 'Approve & Settle'
    });
    if (note !== null) {
      this.staffService.updateClaimStatus(claimId, 'approved', note.trim() || undefined);
      await this.dialogService.alert({
        title: 'Claim Approved',
        message: 'Claim approved successfully. If this was a wage advance, wage deduction/payout has been logged into payroll automatically.',
        type: 'success'
      });
    }
  }

  async rejectClaim(claimId: string): Promise<void> {
    const reason = await this.dialogService.prompt({
      title: 'Decline Claim Request',
      message: 'Specify reason for declining claim:',
      placeholder: 'e.g. Bill receipt missing or duplicate request',
      confirmText: 'Decline Claim'
    });
    if (reason !== null) {
      this.staffService.updateClaimStatus(claimId, 'rejected', reason.trim() || undefined);
      await this.dialogService.alert({
        title: 'Claim Declined',
        message: 'Claim request has been declined.',
        type: 'info'
      });
    }
  }

  async deleteClaim(claimId: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Claim Record',
      message: 'Are you sure you want to delete this on-site expense claim record?',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      this.staffService.deleteClaim(claimId);
    }
  }

  // --- File & Challan Upload ---
  async onExpenseBillFileSelected(event: any): Promise<void> {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.isUploadingFile = true;
    try {
      const url = await this.firebaseService.uploadFile('site_expenses_challans', file);
      if (url) {
        this.expenseBillPhotoUrl = url;
      } else {
        await this.dialogService.alert({
          title: 'Upload Notice',
          message: 'Could not upload photo to cloud storage. Please check connection.',
          type: 'warning'
        });
      }
    } catch (err: any) {
      await this.dialogService.alert({
        title: 'Upload Error',
        message: 'Upload failed: ' + (err?.message || 'Error uploading file'),
        type: 'danger'
      });
    } finally {
      this.isUploadingFile = false;
    }
  }

  // --- Accounting & Data Export ---
  private downloadCsvFile(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportExpensesCsv(specificSite?: SiteProject): void {
    const expensesToExport: { siteName: string; exp: SiteExpense }[] = [];
    if (specificSite) {
      specificSite.expenses.forEach(exp => expensesToExport.push({ siteName: specificSite.siteName, exp }));
    } else {
      this.sites.forEach(s => {
        s.expenses.forEach(exp => expensesToExport.push({ siteName: s.siteName, exp }));
      });
    }

    if (expensesToExport.length === 0) {
      this.dialogService.alert({ title: 'Export Notice', message: 'No expenses recorded to export.', type: 'info' });
      return;
    }

    const headers = ['Site Name', 'Date', 'Category', 'Item / Title', 'Quantity', 'Unit Rate (INR)', 'Total Amount (INR)', 'Invoice / Bill No', 'Recorded By', 'Notes'];
    const rows = expensesToExport.map(({ siteName, exp }) => [
      `"${siteName.replace(/"/g, '""')}"`,
      `"${exp.date}"`,
      `"${exp.category}"`,
      `"${(exp.title || exp.materialItemName || '').replace(/"/g, '""')}"`,
      exp.quantity || '',
      exp.unitRate || '',
      exp.amount || 0,
      `"${(exp.invoiceNo || '').replace(/"/g, '""')}"`,
      `"${(exp.recordedBy || '').replace(/"/g, '""')}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    this.downloadCsvFile(`Electrical_Vibers_Site_Expenses_${dateStr}.csv`, csvContent);
  }

  exportWagePayoutsCsv(): void {
    if (this.payouts.length === 0) {
      this.dialogService.alert({ title: 'Export Notice', message: 'No wage disbursements recorded to export.', type: 'info' });
      return;
    }

    const headers = ['Receipt Ref', 'Date', 'Technician Name', 'Role', 'Amount (INR)', 'Payment Mode', 'Notes'];
    const rows = this.payouts.map(p => [
      `"${p.receiptRef || ''}"`,
      `"${p.date}"`,
      `"${(p.employeeName || '').replace(/"/g, '""')}"`,
      `"${((this.employees.find(e => e.id === p.employeeId)?.role) || '').replace(/"/g, '""')}"`,
      p.amount || 0,
      `"${p.paymentMode}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    this.downloadCsvFile(`Electrical_Vibers_Wage_Disbursements_${dateStr}.csv`, csvContent);
  }

  exportOrdersCsv(): void {
    if (this.orders.length === 0) {
      this.dialogService.alert({ title: 'Export Notice', message: 'No customer orders found to export.', type: 'info' });
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Item Count', 'Total Amount (INR)', 'Payment Method', 'Payment Status', 'Order Status'];
    const rows = this.orders.map(o => [
      `"${o.id}"`,
      `"${o.orderDate || ''}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
      `"${((o.deliveryAddress?.street || '') + ' ' + (o.deliveryAddress?.city || '') + ' ' + (o.deliveryAddress?.pincode || '')).replace(/"/g, '""')}"`,
      o.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      o.totalAmount || 0,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus}"`,
      `"${o.orderStatus}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    this.downloadCsvFile(`Electrical_Vibers_Customer_Orders_${dateStr}.csv`, csvContent);
  }

  activeTab: 'roster' | 'workforce' | 'sites' | 'products' | 'categories' | 'services' | 'offers' | 'settings' | 'orders' | 'bookings' = 'roster';
  Math = Math;

  // Modern Sidenav State
  sidebarCollapsed = false;
  mobileSidebarOpen = false;
  showQuickAddMenu = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  selectTab(tab: 'roster' | 'workforce' | 'sites' | 'products' | 'categories' | 'services' | 'offers' | 'settings' | 'orders' | 'bookings'): void {
    this.activeTab = tab;
    this.mobileSidebarOpen = false;
  }

  get currentModuleMeta(): { title: string; subtitle: string; icon: string } {
    switch (this.activeTab) {
      case 'roster': return { title: 'Duty Roster & Timeline', subtitle: 'தினசரி வேலை ஒதுக்கீடு & பணிகள்', icon: 'calendar_month' };
      case 'workforce': return { title: 'Electrician Workforce & Wages', subtitle: 'பணியாளர்கள் & தினசரி கூலி மேலாண்மை', icon: 'badge' };
      case 'sites': return { title: 'Construction Sites & Finance', subtitle: 'கட்டுமான தளங்கள் & வரவு செலவு', icon: 'engineering' };
      case 'products': return { title: 'Products & Live Pricing', subtitle: 'மின்சாதன பொருட்கள் & ஸ்டாக் நிலவரம்', icon: 'inventory_2' };
      case 'categories': return { title: 'Product Categories & Catalog', subtitle: 'பொருட்கள் பிரிவுகள் & வகைகள்', icon: 'category' };
      case 'services': return { title: 'Electrician Services & Rate Card', subtitle: 'மின்சார சேவை கட்டண பட்டியல்', icon: 'handyman' };
      case 'offers': return { title: 'Promotional Offers & Banners', subtitle: 'தள்ளுபடி கூப்பன்கள் & சலுகைகள்', icon: 'loyalty' };
      case 'orders': return { title: 'Customer Orders Pipeline', subtitle: 'வாடிக்கையாளர் ஆர்டர்கள் & டெலிவரி', icon: 'local_shipping' };
      case 'bookings': return { title: 'Electrician Service Bookings', subtitle: 'சேவை முன்பதிவுகள் & தொழில்நுட்ப வருகை', icon: 'calendar_today' };
      case 'settings': return { title: 'Global Website Settings', subtitle: 'தள அமைப்புகள் & அறிவிப்புகள்', icon: 'tune' };
      default: return { title: 'Admin Workspace', subtitle: 'நிர்வாக கட்டுப்பாட்டு அறை', icon: 'dashboard' };
    }
  }

  // Google Authentication State
  leaveRequests: StaffLeaveRequest[] = [];
  staffClaims: StaffClaimRequest[] = [];
  expenseBillPhotoUrl = '';
  isUploadingFile = false;
  whitelist: string[] = [];
  newAdminEmail = '';

  get currentUser(): UserProfile | null {
    return this.authService.getCurrentUser();
  }

  // Core Data States
  sites: SiteProject[] = [];
  employees: ElectricianEmployee[] = [];
  allocations: SiteWorkAllocation[] = [];
  payouts: WorkerWagePayout[] = [];
  products: Product[] = [];
  categories: string[] = [];
  services: ServiceCategory[] = [];
  offers: StoreOffer[] = [];
  orders: Order[] = [];
  bookings: Booking[] = [];
  config: AppConfig = this.configService.getConfig();

  // Filter states for admin products
  adminProductSearch = '';
  adminProductCategory = 'ALL';

  // Daily Duty Roster Filter & States
  rosterSelectedDate: string = new Date().toISOString().split('T')[0];
  rosterStatusFilter: string = 'ALL';
  rosterSearch: string = '';


  // Modals state
  showScheduleWorkModal = false;
  showReassignModal = false;
  showRescheduleModal = false;
  showNewEmployeeModal = false;
  showRecordPayoutModal = false;
  showProfitReportModal = false;

  showNewSiteModal = false;
  showAddExpenseModal = false;
  showAddPaymentModal = false;
  showWorkLogModal = false;
  showNewProductModal = false;
  showEditProductModal = false;
  showNewServiceModal = false;
  showEditServiceModal = false;
  showNewOfferModal = false;

  activeAllocationForAction: SiteWorkAllocation | null = null;
  activeEmployeeForPayout: ElectricianEmployee | null = null;
  activeSiteProfitReport: SiteProfitReport | null = null;
  activeSiteForAction: SiteProject | null = null;
  editingProduct: Product | null = null;
  editingService: ServiceCategory | null = null;

  // New Work Schedule Form
  schedSiteId = '';
  schedDate = new Date().toISOString().split('T')[0];
  schedTask = '';
  schedShift: ShiftType = 'full_day';
  schedEmployeeId = '';
  schedNotes = '';

  // Re-assign form
  reassignEmployeeId = '';
  reassignReason = 'Previous technician unwell / absent';

  // Reschedule form
  rescheduleDateVal = '';
  rescheduleReason = 'Postponed due to client site readiness / rain';

  // New Employee form
  newEmpName = '';
  newEmpTamilName = '';
  newEmpPhone = '';
  newEmpRole: EmployeeRole = 'Senior Wireman';
  newEmpTamilRole = '';
  newEmpDailyWage = 950;
  newEmpUpi = '';
  newEmpSpecialty = '';
  newEmpTamilSpecialty = '';

  // Wage Payout Form
  payoutAmount = 0;
  payoutMode: 'cash' | 'gpay_upi' | 'bank_transfer' = 'gpay_upi';
  payoutNotes = 'Weekly wage settlement';


  // Carry Forward Form
  showCarryForwardModal = false;
  carryForwardNextDate = '';
  carryForwardReason = 'Work unfinished / Postponed to next working day';

  // Overtime / Extra Work Form
  showCompleteOvertimeModal = false;
  overtimeHours = 0;
  overtimeNotes = '';

  // New Site form
  newSiteName = '';
  newSiteTamilName = '';
  newSiteClient = '';
  newSitePhone = '';
  newSiteAddress = '';
  newSiteTamilAddress = '';
  newSiteContractType: ContractType = 'with_material';
  newSiteEstimatedLaborDays = 15;
  newSitePlannedWorkers = 2;
  newSiteMaterialBudget = 45000;
  newSiteContractAmount = 100000;
  newSiteInitialAdvance = 30000;
  newSiteWorkers = 'Murugan, Suresh';
  newSiteTamilDesc = '';

  // Expense form (Enhanced for Material Procurement Tracking)
  expenseCategory: ExpenseCategory = 'material';
  expenseTitle = '';
  expenseAmount = 0;
  expenseMaterialName = '';
  expenseMaterialQty = 1;
  expenseMaterialUnitRate = 0;
  expenseInvoiceNo = '';
  expenseRecordedBy = 'Admin';
  expenseNotes = '';


  // Payment form
  paymentAmount = 0;
  paymentMode: 'cash' | 'gpay_upi' | 'bank_transfer' | 'cheque' = 'gpay_upi';
  paymentNotes = '';

  // Work log form
  logWorkerName = 'Murugan (Lead)';
  logDescription = '';

  // Product form
  prodName = '';
  prodTamilName = '';
  prodCategory = 'Wires & Cables';
  prodTamilCategory = '';
  prodBrand = '';
  prodPrice = 0;
  prodMrp = 0;
  prodStock = 10;
  prodUnit = 'Piece';
  prodTamilUnit = 'எண்ணிக்கை';
  prodImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  prodDesc = '';
  prodTamilDesc = '';

  // Category form
  newCategoryName = '';
  newCategoryTamilName = '';
  editingCategoryOldName = '';
  editingCategoryNewName = '';
  editingCategoryNewTamilName = '';

  // Service form
  serviceTitle = '';
  serviceTamilTitle = '';
  servicePrice = 299;
  serviceIcon = 'electric_bolt';
  serviceDesc = '';
  serviceTamilDesc = '';
  servicePopular = false;

  // Offer form
  offerTitle = '';
  offerTamilTitle = '';
  offerCode = '';
  offerDiscount = 15;
  offerDesc = '';
  offerTamilDesc = '';
  offerValidTill = '2026-12-31';

  get stats() {
    return this.siteService.getOverallStats();
  }

  get filteredAdminProducts(): Product[] {
    return this.products.filter(p => {
      const matchesCat = this.adminProductCategory === 'ALL' || p.category === this.adminProductCategory;
      const matchesSearch = !this.adminProductSearch.trim() ||
        p.name.toLowerCase().includes(this.adminProductSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(this.adminProductSearch.toLowerCase()) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(this.adminProductSearch.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }

  get filteredAllocations(): SiteWorkAllocation[] {
    return this.allocations.filter(alloc => {
      const matchesDate = !this.rosterSelectedDate || alloc.date === this.rosterSelectedDate;
      const matchesStatus = this.rosterStatusFilter === 'ALL' || alloc.status === this.rosterStatusFilter;
      const matchesSearch = !this.rosterSearch.trim() ||
        alloc.assignedEmployeeName.toLowerCase().includes(this.rosterSearch.toLowerCase()) ||
        alloc.siteName.toLowerCase().includes(this.rosterSearch.toLowerCase()) ||
        alloc.taskDescription.toLowerCase().includes(this.rosterSearch.toLowerCase());
      return matchesDate && matchesStatus && matchesSearch;
    });
  }

  get todayAllocations(): SiteWorkAllocation[] {
    const today = new Date().toISOString().split('T')[0];
    return this.allocations.filter(a => a.date === today);
  }

  get totalWagesPending(): number {
    return this.employees.reduce((sum, e) => sum + (e.pendingWageBalance || 0), 0);
  }

  get pendingLeavesCount(): number {
    return this.leaveRequests.filter(l => l.status === 'pending').length;
  }

  ngOnInit(): void {
    this.siteService.sites$.subscribe(s => this.sites = s);
    this.siteService.employees$.subscribe(e => this.employees = e);
    this.siteService.allocations$.subscribe(a => this.allocations = a);
    this.siteService.payouts$.subscribe(p => this.payouts = p);
    this.productService.products$.subscribe(p => this.products = p);
    this.productService.categories$.subscribe(c => this.categories = c);
    this.bookingService.services$.subscribe(srv => this.services = srv);
    this.configService.offers$.subscribe(off => this.offers = off);
    this.configService.config$.subscribe(cfg => this.config = { ...cfg });
    this.orderService.orders$.subscribe(o => this.orders = o);
    this.bookingService.bookings$.subscribe(b => this.bookings = b);
    this.authService.whitelist$.subscribe(wl => this.whitelist = wl);
    this.staffService.leaves$.subscribe(l => this.leaveRequests = l);
    this.staffService.claims$.subscribe(c => this.staffClaims = c);
  }


  // --- Google Sign-In Actions ---
  async handleGoogleSignIn(): Promise<void> {
    try {
      const res = await this.authService.signInWithGoogle();
      if (!res.success && res.error) {
        console.warn('Google sign-in:', res.error);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
    }
  }

  async addAdminEmail(): Promise<void> {
    if (!this.newAdminEmail.trim()) return;
    const res = this.authService.addAuthorizedEmail(this.newAdminEmail);
    await this.dialogService.alert({
      title: 'Admin Access',
      message: res.message,
      type: res.success ? 'success' : 'warning'
    });
    if (res.success) {
      this.newAdminEmail = '';
    }
  }

  async removeAdminEmail(email: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Revoke Admin Access',
      message: `Are you sure you want to revoke admin access for ${email}?`,
      confirmText: 'Revoke Access',
      type: 'danger'
    });
    if (confirmed) {
      const res = this.authService.removeAuthorizedEmail(email);
      await this.dialogService.alert({
        title: 'Access Revoked',
        message: res.message,
        type: 'info'
      });
    }
  }

  // --- Category Management ---
  addNewCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.productService.addCategory(this.newCategoryName, this.newCategoryTamilName);
    this.newCategoryName = '';
    this.newCategoryTamilName = '';
  }

  async deleteCategory(cat: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat}"? Products in this category will remain available.`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      this.productService.deleteCategory(cat);
    }
  }

  async startEditCategory(cat: string): Promise<void> {
    const currentTamil = this.productService.getCategoryTamil(cat);
    const updated = await this.dialogService.prompt({
      title: 'Edit Category Name (English)',
      message: `Current Tamil name: ${currentTamil}`,
      defaultValue: cat,
      confirmText: 'Continue'
    });
    if (!updated || !updated.trim()) return;

    const updatedTa = await this.dialogService.prompt({
      title: 'Edit Category Name (Tamil / தமிழ்)',
      message: `English Name: ${updated.trim()}`,
      defaultValue: currentTamil,
      confirmText: 'Save Changes'
    });

    this.productService.updateCategory(cat, updated.trim(), updatedTa || undefined);
  }

  // --- Service Management ---
  openNewServiceModal(): void {
    this.serviceTitle = '';
    this.serviceTamilTitle = '';
    this.servicePrice = 299;
    this.serviceIcon = 'electric_bolt';
    this.serviceDesc = '';
    this.serviceTamilDesc = '';
    this.servicePopular = false;
    this.showNewServiceModal = true;
  }

  availableServiceIcons: { icon: string; label: string }[] = [
    { icon: 'electric_bolt', label: 'Wiring' },
    { icon: 'shield', label: 'Surge/Earthing' },
    { icon: 'toggle_on', label: 'Switches' },
    { icon: 'power_off', label: 'MCB Tripping' },
    { icon: 'mode_fan', label: 'Fan/Light' },
    { icon: 'battery_charging_full', label: 'Inverter/UPS' },
    { icon: 'lightbulb', label: 'Lighting' },
    { icon: 'solar_power', label: 'Solar Rooftop' },
    { icon: 'electrical_services', label: 'General Electrical' },
    { icon: 'precision_manufacturing', label: '3-Phase Machinery' },
    { icon: 'home_repair_service', label: 'Home Repair' },
    { icon: 'flash_on', label: 'Emergency' },
    { icon: 'tune', label: 'Custom Panel' },
    { icon: 'build', label: 'Maintenance' }
  ];

  setServiceIcon(icon: string): void {
    this.serviceIcon = icon;
  }

  setEditingServiceIcon(icon: string): void {
    if (this.editingService) {
      this.editingService.icon = icon;
    }
  }

  convertBookingToService(bk: Booking): void {
    this.serviceTitle = bk.serviceTitle;
    this.serviceTamilTitle = bk.serviceTitle;
    this.servicePrice = bk.estimatedCost || 499;
    this.serviceIcon = 'electrical_services';
    this.serviceDesc = bk.problemDescription || 'Professional custom electrical service.';
    this.servicePopular = false;
    this.showNewServiceModal = true;
    this.activeTab = 'services';
  }

  async saveNewService(): Promise<void> {
    if (!this.serviceTitle.trim() || !this.servicePrice) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: 'Please fill in service title and starting price.',
        type: 'warning'
      });
      return;
    }

    this.bookingService.addService({
      title: this.serviceTitle.trim(),
      tamilTitle: this.serviceTamilTitle.trim() || this.serviceTitle.trim(),
      startingPrice: Number(this.servicePrice),
      icon: this.serviceIcon || 'electric_bolt',
      description: this.serviceDesc.trim() || 'Expert electrical inspection and repair.',
      tamilDescription: this.serviceTamilDesc.trim() || undefined,
      popular: this.servicePopular
    });

    this.showNewServiceModal = false;
  }

  openEditServiceModal(srv: ServiceCategory): void {
    this.editingService = { ...srv };
    this.showEditServiceModal = true;
  }

  saveEditService(): void {
    if (!this.editingService) return;
    this.bookingService.updateService(this.editingService.id, this.editingService);
    this.showEditServiceModal = false;
  }

  async deleteService(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Service',
      message: 'Are you sure you want to delete this electrical service category?',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      this.bookingService.deleteService(id);
    }
  }

  toggleServicePopular(srv: ServiceCategory): void {
    this.bookingService.updateService(srv.id, { popular: !srv.popular });
  }

  // --- Product Editing & Inline Pricing ---
  updateProductInline(product: Product): void {
    this.productService.updateProduct(product.id, {
      price: Number(product.price),
      mrp: Number(product.mrp || product.price),
      stock: Number(product.stock),
      inStock: Number(product.stock) > 0
    });
  }

  updateProductStock(product: Product): void {
    this.updateProductInline(product);
  }

  toggleProductStockStatus(product: Product): void {
    const newStatus = !product.inStock;
    product.inStock = newStatus;
    this.productService.updateProduct(product.id, { inStock: newStatus });
  }

  getProductCategoryCount(cat: string): number {
    return this.products.filter(p => p.category === cat).length;
  }

  async saveBannerConfig(): Promise<void> {
    this.configService.updateConfig({
      showBannerOffer: this.config.showBannerOffer,
      bannerOfferText: this.config.bannerOfferText,
      tamilBannerOfferText: this.config.tamilBannerOfferText
    });
    await this.dialogService.alert({
      title: 'Banner Updated',
      message: 'Banner offer announcement updated successfully! Active across website.',
      type: 'success'
    });
  }

  async saveDealOfTheDayConfig(): Promise<void> {
    this.configService.updateConfig({
      showDealOfTheDay: this.config.showDealOfTheDay,
      dealOfTheDayProductId: this.config.dealOfTheDayProductId,
      dealOfTheDayTitle: this.config.dealOfTheDayTitle,
      dealOfTheDayTamilTitle: this.config.dealOfTheDayTamilTitle,
      dealOfTheDaySubtitle: this.config.dealOfTheDaySubtitle,
      dealOfTheDayTamilSubtitle: this.config.dealOfTheDayTamilSubtitle,
      dealOfTheDayEndHours: this.config.dealOfTheDayEndHours
    });
    await this.dialogService.alert({
      title: 'Deal Updated',
      message: 'Deal of the Day configuration saved successfully! Spotlight updated on website.',
      type: 'success'
    });
  }

  openEditProductModal(product: Product): void {
    this.editingProduct = { ...product };
    this.showEditProductModal = true;
  }

  saveEditProduct(): void {
    if (!this.editingProduct) return;
    this.productService.updateProduct(this.editingProduct.id, this.editingProduct);
    this.showEditProductModal = false;
  }

  openNewProductModal(): void {
    this.prodName = '';
    this.prodTamilName = '';
    this.prodBrand = '';
    this.prodPrice = 0;
    this.prodMrp = 0;
    this.prodStock = 10;
    this.prodUnit = 'Piece';
    this.prodTamilUnit = 'எண்ணிக்கை';
    this.prodDesc = '';
    this.prodTamilDesc = '';
    this.prodTamilCategory = '';
    this.showNewProductModal = true;
  }

  async saveNewProduct(): Promise<void> {
    if (!this.prodName.trim() || !this.prodPrice) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: 'Please fill in product name and price.',
        type: 'warning'
      });
      return;
    }

    this.productService.addProduct({
      name: this.prodName.trim(),
      tamilName: this.prodTamilName.trim() || undefined,
      category: this.prodCategory,
      tamilCategory: this.prodTamilCategory.trim() || this.productService.getCategoryTamil(this.prodCategory),
      brand: this.prodBrand || 'Electrical Vibers Genuine',
      price: Number(this.prodPrice),
      mrp: Number(this.prodMrp || this.prodPrice),
      stock: Number(this.prodStock),
      unit: this.prodUnit || 'Piece',
      tamilUnit: this.prodTamilUnit.trim() || 'எண்ணிக்கை',
      images: [this.prodImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
      description: this.prodDesc || 'Genuine electrical supply with full warranty.',
      tamilDescription: this.prodTamilDesc.trim() || undefined,
      specs: { 'Brand': this.prodBrand || 'Genuine' },
      inStock: this.prodStock > 0
    });

    this.showNewProductModal = false;
  }

  async deleteProduct(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to permanently delete this product from store?',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      this.productService.deleteProduct(id);
    }
  }

  // --- Offers & Promotions ---
  openNewOfferModal(): void {
    this.offerTitle = '';
    this.offerTamilTitle = '';
    this.offerCode = '';
    this.offerDiscount = 15;
    this.offerDesc = '';
    this.offerTamilDesc = '';
    this.offerValidTill = '2026-12-31';
    this.showNewOfferModal = true;
  }

  async saveNewOffer(): Promise<void> {
    if (!this.offerTitle.trim() || !this.offerCode.trim()) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: 'Please fill in offer title and promo code.',
        type: 'warning'
      });
      return;
    }

    this.configService.addOffer({
      title: this.offerTitle.trim(),
      tamilTitle: this.offerTamilTitle.trim() || undefined,
      code: this.offerCode.trim().toUpperCase(),
      discountPercentage: Number(this.offerDiscount),
      description: this.offerDesc.trim(),
      tamilDescription: this.offerTamilDesc.trim() || undefined,
      validTill: this.offerValidTill,
      active: true
    });

    this.showNewOfferModal = false;
  }

  toggleOfferActive(offer: StoreOffer): void {
    this.configService.updateOffer(offer.id, { active: !offer.active });
  }

  async deleteOffer(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Delete Promo Offer',
      message: 'Are you sure you want to delete this promotion offer?',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      this.configService.deleteOffer(id);
    }
  }

  // --- Store & Contact Settings ---
  async saveSettings(): Promise<void> {
    this.configService.updateConfig(this.config);
    await this.dialogService.alert({
      title: 'Settings Saved',
      message: 'Global website settings updated successfully! Changes are live across all pages.',
      type: 'success'
    });
  }

  // --- Purge All Mock / Dummy Data ---
  async purgeAllDummyData(): Promise<void> {
    const ok = await this.dialogService.confirm(
      'Are you sure you want to completely purge and reset all stored mock products, projects, duty allocations, and employee data? The application will reset to a clean state ready for live production use.',
      'Purge All Mock Data',
      'danger'
    );
    if (!ok) return;

    this.productService.clearAllProducts();
    localStorage.removeItem('electrical_vibers_products_v2');
    localStorage.removeItem('electrical_vibers_sites_v2');
    localStorage.removeItem('electrical_vibers_allocations_v2');
    localStorage.removeItem('electrical_vibers_wage_payouts_v2');
    localStorage.removeItem('electrical_vibers_orders_v1');
    localStorage.removeItem('electrical_vibers_bookings_v1');
    localStorage.removeItem('voltmaster_products_v1');
    localStorage.removeItem('voltmaster_sites_v1');
    localStorage.removeItem('voltmaster_allocations_v1');

    window.location.reload();
  }

  // --- Sites Management ---
  openNewSiteModal(): void {
    this.newSiteName = '';
    this.newSiteTamilName = '';
    this.newSiteClient = '';
    this.newSitePhone = '';
    this.newSiteAddress = '';
    this.newSiteTamilAddress = '';
    this.newSiteContractType = 'with_material';
    this.newSiteEstimatedLaborDays = 15;
    this.newSitePlannedWorkers = 2;
    this.newSiteMaterialBudget = 45000;
    this.newSiteContractAmount = 100000;
    this.newSiteInitialAdvance = 30000;
    this.newSiteWorkers = 'Murugan, Suresh';
    this.newSiteTamilDesc = '';
    this.showNewSiteModal = true;
  }

  async saveNewSite(): Promise<void> {
    if (!this.newSiteName.trim() || !this.newSiteClient.trim()) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: 'Please fill in Site Name and Client Name.',
        type: 'warning'
      });
      return;
    }

    const workerList = this.newSiteWorkers
      .split(',')
      .map(w => w.trim())
      .filter(w => !!w);

    const site = this.siteService.createSite({
      siteName: this.newSiteName.trim(),
      tamilSiteName: this.newSiteTamilName.trim() || this.newSiteName.trim(),
      clientName: this.newSiteClient.trim(),
      clientPhone: this.newSitePhone.trim(),
      siteAddress: this.newSiteAddress.trim(),
      tamilSiteAddress: this.newSiteTamilAddress.trim() || this.newSiteAddress.trim(),
      contractType: this.newSiteContractType,
      estimatedLaborDays: Number(this.newSiteEstimatedLaborDays),
      plannedWorkersCount: Number(this.newSitePlannedWorkers),
      materialBudget: Number(this.newSiteMaterialBudget),
      contractAmount: Number(this.newSiteContractAmount),
      totalReceived: Number(this.newSiteInitialAdvance),
      description: `Contract: ${this.newSiteContractType === 'with_material' ? 'With Material + Labor' : 'Labor Only'}. Plan: ${this.newSiteEstimatedLaborDays} days.`,
      tamilDescription: this.newSiteTamilDesc.trim() || undefined,
      assignedElectricians: workerList
    });

    // Automatically generate pre-defined project day-by-day timeline for convenience!
    this.siteService.autoGenerateDayByDaySchedule(site.id);

    this.showNewSiteModal = false;
  }

  openAddExpenseModal(site: SiteProject): void {
    this.activeSiteForAction = site;
    this.expenseTitle = '';
    this.expenseAmount = 0;
    this.expenseMaterialName = '';
    this.expenseMaterialQty = 1;
    this.expenseMaterialUnitRate = 0;
    this.expenseInvoiceNo = '';
    this.expenseNotes = '';
    this.expenseBillPhotoUrl = '';
    this.isUploadingFile = false;
    this.showAddExpenseModal = true;
  }

  onMaterialRateOrQtyChange(): void {
    if (this.expenseMaterialQty && this.expenseMaterialUnitRate) {
      this.expenseAmount = Math.round(Number(this.expenseMaterialQty) * Number(this.expenseMaterialUnitRate));
    }
  }

  async saveExpense(): Promise<void> {
    if (!this.activeSiteForAction || (!this.expenseTitle.trim() && !this.expenseMaterialName.trim()) || !this.expenseAmount) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: 'Please specify the expense / material description and amount.',
        type: 'warning'
      });
      return;
    }

    const title = this.expenseCategory === 'material' && this.expenseMaterialName.trim()
      ? `${this.expenseMaterialName.trim()} (${this.expenseMaterialQty} pcs @ ₹${this.expenseMaterialUnitRate})`
      : this.expenseTitle.trim();

    this.siteService.addExpense(this.activeSiteForAction.id, {
      date: new Date().toISOString().split('T')[0],
      title: title,
      category: this.expenseCategory,
      amount: Number(this.expenseAmount),
      materialItemName: this.expenseMaterialName,
      quantity: Number(this.expenseMaterialQty),
      unitRate: Number(this.expenseMaterialUnitRate),
      invoiceNo: this.expenseInvoiceNo,
      billPhoto: this.expenseBillPhotoUrl || undefined,
      recordedBy: this.expenseRecordedBy,
      notes: this.expenseNotes
    });

    this.showAddExpenseModal = false;
  }


  openAddPaymentModal(site: SiteProject): void {
    this.activeSiteForAction = site;
    this.paymentAmount = 0;
    this.paymentNotes = '';
    this.showAddPaymentModal = true;
  }

  async savePayment(): Promise<void> {
    if (!this.activeSiteForAction || !this.paymentAmount) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: 'Please enter payment amount received.',
        type: 'warning'
      });
      return;
    }

    this.siteService.addPayment(this.activeSiteForAction.id, {
      date: new Date().toISOString().split('T')[0],
      amount: Number(this.paymentAmount),
      paymentMode: this.paymentMode,
      notes: this.paymentNotes
    });

    this.showAddPaymentModal = false;
  }

  openDailyWorkLogModal(site: SiteProject): void {
    this.activeSiteForAction = site;
    this.logDescription = '';
    this.showWorkLogModal = true;
  }

  async saveWorkLog(): Promise<void> {
    if (!this.activeSiteForAction || !this.logDescription.trim()) {
      await this.dialogService.alert({
        title: 'Required Information',
        message: "Please describe today's work done.",
        type: 'warning'
      });
      return;
    }

    this.siteService.addDailyLog(this.activeSiteForAction.id, {
      date: new Date().toISOString().split('T')[0],
      workerName: this.logWorkerName,
      workDescription: this.logDescription
    });

    this.showWorkLogModal = false;
  }

  async openAssignWorkerModal(site: SiteProject): Promise<void> {
    const promptWorkers = await this.dialogService.prompt({
      title: 'Assign Electricians',
      message: 'Update assigned electricians for today (separated by comma):',
      defaultValue: site.assignedElectricians.join(', ')
    });
    if (promptWorkers !== null) {
      const updated = promptWorkers.split(',').map(w => w.trim()).filter(w => !!w);
      this.siteService.assignWorkers(site.id, updated);
    }
  }

  toggleSiteStatus(site: SiteProject): void {
    const nextStatus = site.status === 'ongoing' ? 'completed' : 'ongoing';
    this.siteService.updateSite(site.id, { status: nextStatus });
  }

  // --- Attention Alerts & Notifications ---
  get attentionAlerts() {
    return this.siteService.getPendingAttentionTasks();
  }

  // --- Daily Duty Roster & Work Allocation ---
  quickSetRosterDate(type: 'today' | 'tomorrow' | 'all'): void {
    if (type === 'today') {
      this.rosterSelectedDate = new Date().toISOString().split('T')[0];
    } else if (type === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      this.rosterSelectedDate = d.toISOString().split('T')[0];
    } else {
      this.rosterSelectedDate = '';
    }
  }

  openScheduleWorkModal(): void {
    if (this.sites.length > 0 && !this.schedSiteId) {
      this.schedSiteId = this.sites[0].id;
    }
    if (this.employees.length > 0 && !this.schedEmployeeId) {
      this.schedEmployeeId = this.employees[0].id;
    }
    this.schedDate = new Date().toISOString().split('T')[0];
    this.schedTask = '';
    this.schedShift = 'full_day';
    this.schedNotes = '';
    this.showScheduleWorkModal = true;
  }

  async saveScheduleWork(): Promise<void> {
    if (!this.schedSiteId || !this.schedEmployeeId || !this.schedTask.trim()) {
      await this.dialogService.alert('Please select a site, an electrician, and enter task details.', 'Incomplete Assignment', 'warning');
      return;
    }

    this.siteService.createAllocation({
      siteId: this.schedSiteId,
      date: this.schedDate,
      taskDescription: this.schedTask.trim(),
      shift: this.schedShift,
      assignedEmployeeId: this.schedEmployeeId,
      notes: this.schedNotes.trim()
    });

    this.showScheduleWorkModal = false;
  }

  // 1-Click Auto Generate Full Project Schedule Template
  async autoGenerateSiteTimeline(site: SiteProject): Promise<void> {
    const ok = await this.dialogService.confirm(
      `Auto-generate Day-by-Day project schedule for "${site.siteName}" starting from ${site.startDate} (Sundays excluded)?`,
      'Generate Timeline'
    );
    if (ok) {
      const generated = this.siteService.autoGenerateDayByDaySchedule(site.id);
      await this.dialogService.alert(`Success! Generated ${generated.length} pre-defined project work milestones for ${site.siteName}.`, 'Schedule Generated', 'success');
    }
  }

  // 1-Click Quick Reassign Worker
  openReassignModal(alloc: SiteWorkAllocation): void {
    this.activeAllocationForAction = alloc;
    // Default to first available employee not currently assigned
    const alt = this.employees.find(e => e.id !== alloc.assignedEmployeeId && e.status === 'active');
    this.reassignEmployeeId = alt ? alt.id : (this.employees[0]?.id || '');
    this.reassignReason = 'Previous technician unwell / absent';
    this.showReassignModal = true;
  }

  async saveReassignWorker(): Promise<void> {
    if (!this.activeAllocationForAction || !this.reassignEmployeeId) return;

    this.siteService.reassignWorker(
      this.activeAllocationForAction.id,
      this.reassignEmployeeId,
      this.reassignReason
    );

    this.showReassignModal = false;
    await this.dialogService.alert('Worker reassigned successfully! Roster updated.', 'Technician Reassigned', 'success');
  }

  // Reschedule Date
  openRescheduleModal(alloc: SiteWorkAllocation): void {
    this.activeAllocationForAction = alloc;
    this.rescheduleDateVal = alloc.date;
    this.rescheduleReason = 'Postponed due to client site readiness / rain';
    this.showRescheduleModal = true;
  }

  async saveRescheduleDate(): Promise<void> {
    if (!this.activeAllocationForAction || !this.rescheduleDateVal) return;

    this.siteService.rescheduleDate(
      this.activeAllocationForAction.id,
      this.rescheduleDateVal,
      this.rescheduleReason
    );

    this.showRescheduleModal = false;
    await this.dialogService.alert(`Work task rescheduled to ${this.rescheduleDateVal}!`, 'Task Rescheduled', 'success');
  }

  // Carry Forward to Next Working Day (User Audio Feature)
  openCarryForwardModal(alloc: SiteWorkAllocation): void {
    this.activeAllocationForAction = alloc;
    // Suggest tomorrow's date
    const d = new Date(alloc.date);
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Skip Sunday
    this.carryForwardNextDate = d.toISOString().split('T')[0];
    this.carryForwardReason = 'Work unfinished on scheduled date / Carried forward';
    this.showCarryForwardModal = true;
  }

  async saveCarryForwardTask(): Promise<void> {
    if (!this.activeAllocationForAction || !this.carryForwardNextDate) return;

    this.siteService.carryForwardTask(
      this.activeAllocationForAction.id,
      this.carryForwardNextDate,
      this.carryForwardReason
    );

    this.showCarryForwardModal = false;
    await this.dialogService.alert(`Task carried forward to ${this.carryForwardNextDate} successfully!`, 'Task Carried Forward', 'success');
  }

  // Complete with Overtime Modal
  openCompleteOvertimeModal(alloc: SiteWorkAllocation): void {
    this.activeAllocationForAction = alloc;
    this.overtimeHours = 0;
    this.overtimeNotes = '';
    this.showCompleteOvertimeModal = true;
  }

  async saveCompleteWithOvertime(): Promise<void> {
    if (!this.activeAllocationForAction) return;

    this.siteService.completeTaskWithOvertime(
      this.activeAllocationForAction.id,
      Number(this.overtimeHours || 0),
      this.overtimeNotes
    );

    this.showCompleteOvertimeModal = false;
    await this.dialogService.alert('Task marked as Completed! Labor wage and site log recorded automatically.', 'Work Completed', 'success');
  }

  toggleAllocationStatus(alloc: SiteWorkAllocation, newStatus: AllocationStatus): void {
    if (newStatus === 'completed') {
      this.openCompleteOvertimeModal(alloc);
    } else {
      this.siteService.updateAllocationStatus(alloc.id, newStatus);
    }
  }

  async deleteAllocation(id: string): Promise<void> {
    const ok = await this.dialogService.confirm('Delete this scheduled work item?', 'Confirm Delete', 'danger');
    if (ok) {
      this.siteService.deleteAllocation(id);
    }
  }

  // 1-Click Broadcast Daily Roster to Team WhatsApp
  broadcastRosterWhatsApp(date?: string): void {
    const targetDate = date || this.rosterSelectedDate || new Date().toISOString().split('T')[0];
    const text = this.siteService.generateWhatsAppRosterText(targetDate);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  // --- Workforce & Employee Directory Management ---
  openNewEmployeeModal(): void {
    this.newEmpName = '';
    this.newEmpTamilName = '';
    this.newEmpPhone = '';
    this.newEmpRole = 'Senior Wireman';
    this.newEmpTamilRole = '';
    this.newEmpDailyWage = 950;
    this.newEmpUpi = '';
    this.newEmpSpecialty = '';
    this.newEmpTamilSpecialty = '';
    this.showNewEmployeeModal = true;
  }

  async saveNewEmployee(): Promise<void> {
    if (!this.newEmpName.trim() || !this.newEmpDailyWage) {
      await this.dialogService.alert('Please fill in Employee Name and Daily Wage Rate.', 'Validation Error', 'warning');
      return;
    }

    this.siteService.addEmployee({
      name: this.newEmpName.trim(),
      tamilName: this.newEmpTamilName.trim() || this.newEmpName.trim(),
      phone: this.newEmpPhone.trim(),
      role: this.newEmpRole,
      tamilRole: this.newEmpTamilRole.trim() || undefined,
      dailyWage: Number(this.newEmpDailyWage),
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      upiId: this.newEmpUpi.trim(),
      specialty: this.newEmpSpecialty.trim(),
      tamilSpecialty: this.newEmpTamilSpecialty.trim() || undefined
    });

    this.showNewEmployeeModal = false;
    await this.dialogService.alert('New technician added to workforce directory successfully!', 'Technician Added', 'success');
  }

  async deleteEmployee(id: string): Promise<void> {
    const ok = await this.dialogService.confirm('Are you sure you want to remove this employee?', 'Remove Employee', 'danger');
    if (ok) {
      this.siteService.deleteEmployee(id);
    }
  }

  toggleEmployeeStatus(id: string): void {
    this.siteService.toggleEmployeeStatus(id);
  }

  // Wage Payout
  openRecordPayoutModal(emp: ElectricianEmployee): void {
    this.activeEmployeeForPayout = emp;
    this.payoutAmount = emp.pendingWageBalance || emp.dailyWage;
    this.payoutMode = 'gpay_upi';
    this.payoutNotes = `Weekly labor wage payout for ${emp.name}`;
    this.showRecordPayoutModal = true;
  }

  async saveRecordPayout(): Promise<void> {
    if (!this.activeEmployeeForPayout || !this.payoutAmount) {
      await this.dialogService.alert('Please enter wage payout amount.', 'Validation Error', 'warning');
      return;
    }

    this.siteService.recordWagePayout({
      employeeId: this.activeEmployeeForPayout.id,
      amount: Number(this.payoutAmount),
      paymentMode: this.payoutMode,
      notes: this.payoutNotes
    });

    this.showRecordPayoutModal = false;
    await this.dialogService.alert(`Wage payout of ₹${this.payoutAmount} recorded for ${this.activeEmployeeForPayout.name}!`, 'Payout Recorded', 'success');
  }

  // Share Employee Wage Slip via WhatsApp
  shareEmployeeWageWhatsApp(emp: ElectricianEmployee): void {
    const text = `*ELECTRICAL VIBERS - TECHNICIAN WAGE SUMMARY*\n` +
      `*Name:* ${emp.name} (${emp.role})\n` +
      `*Phone:* ${emp.phone}\n` +
      `*Daily Rate:* ₹${emp.dailyWage}/day\n` +
      `*Days / Shifts Worked:* ${emp.totalDaysWorked || 0} Days\n` +
      `*Total Wages Earned:* ₹${(emp.totalWagesEarned || 0).toLocaleString()}\n` +
      `*Total Wages Paid Out:* ₹${(emp.totalWagesPaid || 0).toLocaleString()}\n` +
      `*Pending Wage Balance:* ₹${(emp.pendingWageBalance || 0).toLocaleString()}\n` +
      `*UPI ID:* ${emp.upiId || 'N/A'}\n\n` +
      `Electrical Vibers Operations Office, Chennai.`;
    window.open(`https://api.whatsapp.com/send?phone=${emp.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(text)}`, '_blank');
  }

  // Option 3: 1-Click WhatsApp Staff Dispatch
  async dispatchStaffWhatsApp(alloc: SiteWorkAllocation): Promise<void> {
    const emp = this.employees.find(e => e.id === alloc.assignedEmployeeId);
    const rawPhone = (emp?.phone || '').replace(/\D/g, '');
    const phone = rawPhone.slice(-10);
    if (!phone) {
      await this.dialogService.alert('Technician phone number not found.', 'Missing Contact', 'warning');
      return;
    }

    const encodedAddr = encodeURIComponent((alloc.siteAddress || alloc.siteName).trim() + ', Tamil Nadu');
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddr}`;
    const message = 
      `*ELECTRICAL VIBERS - பணி ஒதுக்கீடு விவரம்*\n\n` +
      `வணக்கம் ${alloc.assignedEmployeeName},\n` +
      `உங்களுக்கு கீழ்க்கண்ட வேலை ஒதுக்கப்பட்டுள்ளது:\n\n` +
      `*தளம்*: ${alloc.siteName}\n` +
      `*முகவரி*: ${alloc.siteAddress}\n` +
      `*வாடிக்கையாளர்*: ${alloc.clientName} (${alloc.clientPhone})\n` +
      `*பணி*: ${alloc.taskDescription}\n` +
      `*தேதி*: ${alloc.date} (${alloc.shift})\n` +
      `*Google Maps வழித்தடம்*:\n${mapsLink}\n\n` +
      `பணியிடத்திற்கு சென்றதும் Staff App-ல் Site Check-in செய்யவும். வாழ்த்துகள்!`;

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // Option 3: 1-Click WhatsApp Customer Order Update
  async sendOrderWhatsAppUpdate(order: Order): Promise<void> {
    const rawPhone = (order.customerPhone || '').replace(/\D/g, '');
    const phone = rawPhone.slice(-10);
    if (!phone) {
      await this.dialogService.alert('Customer phone number not available.', 'Missing Contact', 'warning');
      return;
    }

    const trackingLink = `${window.location.origin}/track-order?id=${order.id}`;
    const message = 
      `*ELECTRICAL VIBERS - Order Update*\n\n` +
      `Hello ${order.customerName},\n` +
      `Your electrical order *#${order.id}* status is now: *${order.orderStatus.toUpperCase()}*.\n\n` +
      `Items: ${order.items?.length || 0} product(s)\n` +
      `Total Amount: ₹${order.totalAmount}\n` +
      `Track Live Status:\n${trackingLink}\n\n` +
      `Thank you for choosing Electrical Vibers! Reach us at +91 98765 43210 for support.`;

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // --- Site Profit & Financial Analytics Report ---
  openProfitReportModal(site: SiteProject): void {
    this.activeSiteProfitReport = this.siteService.getSiteProfitReport(site.id);
    this.showProfitReportModal = true;
  }

  shareProfitReportWhatsApp(report: SiteProfitReport): void {
    const typeLabel = report.contractType === 'labor_only' ? 'Labour Only (லேபர் மட்டும்)' : 'With Material + Labour (மெட்டீரியலுடன்)';
    const text = `*ELECTRICAL VIBERS - SITE FINANCIAL & PROFIT REPORT*\n` +
      `*Site:* ${report.siteName}\n` +
      `*Client:* ${report.clientName}\n` +
      `*Contract Type:* ${typeLabel}\n` +
      `------------------------------------\n` +
      `*Total Contract Value:* ₹${report.contractAmount.toLocaleString()}\n` +
      `*Client Payment Received:* ₹${report.totalReceived.toLocaleString()}\n` +
      `*Pending from Client:* ₹${report.pendingFromClient.toLocaleString()}\n` +
      `------------------------------------\n` +
      `*Material Purchases:* ₹${report.materialExpenses.toLocaleString()}\n` +
      `*Labor Wages Incurred:* ₹${report.laborWages.toLocaleString()} (${report.actualLaborDaysWorked} Man-Days)\n` +
      `*Travel & Site Food:* ₹${report.otherExpenses.toLocaleString()}\n` +
      `*Total Site Costs:* ₹${report.totalExpenses.toLocaleString()}\n` +
      `------------------------------------\n` +
      `*NET PROFIT (நிகர லாபம்):* ₹${report.netProfit.toLocaleString()}\n` +
      `*Profit Margin:* ${report.profitMarginPercent}%\n` +
      `------------------------------------\n` +
      `Verified by Electrical Vibers Contracting Management.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }

  // --- Orders & Bookings ---
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.orderService.updateOrderStatus(orderId, status);
  }

  saveBookingAssignment(booking: Booking): void {
    this.bookingService.updateBookingStatus(booking.id, booking.status, booking.assignedTechnician);
  }

  async scheduleBookingToRoster(booking: Booking): Promise<void> {
    if (!booking.assignedTechnician) {
      await this.dialogService.alert('Please select an electrician from the dropdown first before scheduling to duty roster.', 'Technician Required', 'warning');
      return;
    }

    // Match employee
    const emp = this.employees.find(e => 
      booking.assignedTechnician?.includes(e.name) || e.name === booking.assignedTechnician
    );

    if (!emp) {
      await this.dialogService.alert('Selected electrician was not found in active employee records.', 'Electrician Not Found', 'warning');
      return;
    }

    // Check if site already exists or create one for this service job
    let site = this.sites.find(s => s.clientPhone === booking.customerPhone || s.siteName.includes(booking.customerName));
    if (!site) {
      site = this.siteService.createSite({
        siteName: `${booking.serviceTitle} - ${booking.customerName}`,
        clientName: booking.customerName,
        clientPhone: booking.customerPhone,
        siteAddress: `${booking.customerAddress}, ${booking.city}`,
        city: booking.city || 'Chennai',
        contractType: 'labor_only',
        status: 'ongoing',
        startDate: booking.preferredDate || new Date().toISOString().split('T')[0],
        contractAmount: booking.finalCost || booking.estimatedCost || 1200,
        description: `Service Booking: ${booking.serviceTitle} - ${booking.problemDescription || ''}`,
        assignedElectricians: [emp.name]
      });
    }

    if (!site) {
      await this.dialogService.alert('Could not initialize service site project.', 'Error', 'danger');
      return;
    }

    // Check if allocation already exists
    const dateToSchedule = booking.preferredDate || new Date().toISOString().split('T')[0];
    const existing = this.siteService.getAllocations().find(a => 
      a.siteId === site.id && a.assignedEmployeeId === emp!.id && a.date === dateToSchedule
    );

    if (!existing) {
      this.siteService.createAllocation({
        siteId: site.id,
        date: dateToSchedule,
        taskDescription: `${booking.serviceTitle} [Slot: ${booking.preferredTimeSlot || 'Anytime'}] - ${booking.problemDescription || 'Electrical troubleshooting & service'}`,
        shift: 'full_day',
        assignedEmployeeId: emp.id,
        notes: `Customer: ${booking.customerName} (${booking.customerPhone}) | Address: ${booking.customerAddress}, ${booking.city}`
      });
    }

    booking.status = 'assigned';
    this.saveBookingAssignment(booking);

    // Offer instant WhatsApp dispatch to wireman
    const confirmWa = await this.dialogService.confirm(
      `Booking successfully bridged to Staff Duty Roster!\n\n${emp.name} will now see this task in their Staff Portal under Today's / Upcoming duties.\n\nWould you like to dispatch work details to ${emp.name} via WhatsApp now?`,
      'Bridged to Duty Roster'
    );
    if (confirmWa) {
      const waText = 
        `*ELECTRICAL VIBERS - SERVICE DISPATCH WORK ORDER*\n` +
        `------------------------------------\n` +
        `*Technician:* ${emp.name} (${emp.role})\n` +
        `*Date & Slot:* ${booking.preferredDate} (${booking.preferredTimeSlot})\n` +
        `*Service:* ${booking.serviceTitle}\n` +
        `*Customer:* ${booking.customerName}\n` +
        `*Customer Phone:* ${booking.customerPhone}\n` +
        `*Address:* ${booking.customerAddress}, ${booking.city}\n` +
        `*Problem Details:* ${booking.problemDescription || 'Standard electrical repair'}\n` +
        `*Google Maps:* https://maps.google.com/?q=${encodeURIComponent(booking.customerAddress + ', ' + booking.city)}\n` +
        `------------------------------------\n` +
        `Please open your Staff Portal to check in when you arrive on site.`;

      const cleanPhone = emp.phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(waText)}`, '_blank');
    }
  }
}

