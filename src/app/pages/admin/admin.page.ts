import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteService } from '../../services/site.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { BookingService } from '../../services/booking.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { 
  SiteProject, 
  ExpenseCategory, 
  ElectricianEmployee, 
  SiteWorkAllocation, 
  WorkerWagePayout, 
  SiteProfitReport, 
  ShiftType, 
  AllocationStatus, 
  EmployeeRole,
  ContractType
} from '../../models/site.model';

import { Product } from '../../models/product.model';
import { Order, OrderStatus } from '../../models/order.model';
import { Booking, ServiceCategory } from '../../models/booking.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  activeTab: 'roster' | 'workforce' | 'sites' | 'products' | 'categories' | 'services' | 'offers' | 'settings' | 'orders' | 'bookings' = 'roster';
  Math = Math;


  // Google Authentication State
  showGoogleAccountModal = false;
  showCustomEmailInput = false;
  customGoogleEmail = '';
  customGoogleName = '';
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
  newEmpPhone = '';
  newEmpRole: EmployeeRole = 'Senior Wireman';
  newEmpDailyWage = 950;
  newEmpUpi = '';
  newEmpSpecialty = '';

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
  newSiteClient = '';
  newSitePhone = '';
  newSiteAddress = '';
  newSiteContractType: ContractType = 'with_material';
  newSiteEstimatedLaborDays = 15;
  newSitePlannedWorkers = 2;
  newSiteMaterialBudget = 45000;
  newSiteContractAmount = 100000;
  newSiteInitialAdvance = 30000;
  newSiteWorkers = 'Murugan, Suresh';

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
  prodBrand = '';
  prodPrice = 0;
  prodMrp = 0;
  prodStock = 10;
  prodUnit = 'Piece';
  prodImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  prodDesc = '';

  // Category form
  newCategoryName = '';
  editingCategoryOldName = '';
  editingCategoryNewName = '';

  // Service form
  serviceTitle = '';
  serviceTamilTitle = '';
  servicePrice = 299;
  serviceIcon = 'electric_bolt';
  serviceDesc = '';
  servicePopular = false;

  // Offer form
  offerTitle = '';
  offerCode = '';
  offerDiscount = 15;
  offerDesc = '';
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
  }


  // --- Google Sign-In Actions ---
  async handleGoogleSignIn(): Promise<void> {
    try {
      const res = await this.authService.signInWithGoogle();
      if (!res.success && res.error !== 'Google Sign-In was cancelled.') {
        this.showGoogleAccountModal = true;
      }
    } catch {
      this.showGoogleAccountModal = true;
    }
  }

  selectGoogleAccount(email: string, name: string): void {
    const res = this.authService.validateAndAuthorize(email, name);
    if (res.success) {
      this.showGoogleAccountModal = false;
      this.showCustomEmailInput = false;
    }
  }

  submitCustomGoogleEmail(): void {
    if (!this.customGoogleEmail.trim()) return;
    this.selectGoogleAccount(this.customGoogleEmail.trim(), this.customGoogleName.trim() || 'Google User');
    this.customGoogleEmail = '';
    this.customGoogleName = '';
  }

  addAdminEmail(): void {
    if (!this.newAdminEmail.trim()) return;
    const res = this.authService.addAuthorizedEmail(this.newAdminEmail);
    alert(res.message);
    if (res.success) {
      this.newAdminEmail = '';
    }
  }

  removeAdminEmail(email: string): void {
    if (confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
      const res = this.authService.removeAuthorizedEmail(email);
      alert(res.message);
    }
  }

  // --- Category Management ---
  addNewCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.productService.addCategory(this.newCategoryName);
    this.newCategoryName = '';
  }

  deleteCategory(cat: string): void {
    if (confirm(`Are you sure you want to delete category "${cat}"?`)) {
      this.productService.deleteCategory(cat);
    }
  }

  startEditCategory(cat: string): void {
    const updated = prompt('Edit Category Name:', cat);
    if (updated && updated.trim() && updated !== cat) {
      this.productService.updateCategory(cat, updated.trim());
    }
  }

  // --- Service Management ---
  openNewServiceModal(): void {
    this.serviceTitle = '';
    this.serviceTamilTitle = '';
    this.servicePrice = 299;
    this.serviceIcon = 'electric_bolt';
    this.serviceDesc = '';
    this.servicePopular = false;
    this.showNewServiceModal = true;
  }

  saveNewService(): void {
    if (!this.serviceTitle.trim() || !this.servicePrice) {
      alert('Please fill in service title and starting price');
      return;
    }

    this.bookingService.addService({
      title: this.serviceTitle,
      tamilTitle: this.serviceTamilTitle || this.serviceTitle,
      startingPrice: Number(this.servicePrice),
      icon: this.serviceIcon || 'electric_bolt',
      description: this.serviceDesc || 'Expert electrical inspection and repair.',
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

  deleteService(id: string): void {
    if (confirm('Are you sure you want to delete this service?')) {
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

  saveBannerConfig(): void {
    this.configService.updateConfig({
      showBannerOffer: this.config.showBannerOffer,
      bannerOfferText: this.config.bannerOfferText
    });
    alert('Banner offer announcement updated successfully! Active across website.');
  }

  saveDealOfTheDayConfig(): void {
    this.configService.updateConfig({
      showDealOfTheDay: this.config.showDealOfTheDay,
      dealOfTheDayProductId: this.config.dealOfTheDayProductId,
      dealOfTheDayTitle: this.config.dealOfTheDayTitle,
      dealOfTheDaySubtitle: this.config.dealOfTheDaySubtitle,
      dealOfTheDayEndHours: this.config.dealOfTheDayEndHours
    });
    alert('⚡ Deal of the Day configuration saved successfully! Spotlight updated on website.');
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
    this.prodDesc = '';
    this.showNewProductModal = true;
  }

  saveNewProduct(): void {
    if (!this.prodName.trim() || !this.prodPrice) {
      alert('Please fill in product name and price');
      return;
    }

    this.productService.addProduct({
      name: this.prodName,
      tamilName: this.prodTamilName,
      category: this.prodCategory,
      brand: this.prodBrand || 'Electrical Vibers Genuine',
      price: Number(this.prodPrice),
      mrp: Number(this.prodMrp || this.prodPrice),
      stock: Number(this.prodStock),
      unit: this.prodUnit || 'Piece',
      images: [this.prodImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
      description: this.prodDesc || 'Genuine electrical supply with full warranty.',
      specs: { 'Brand': this.prodBrand || 'Genuine' },
      inStock: this.prodStock > 0
    });

    this.showNewProductModal = false;
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id);
    }
  }

  // --- Offers & Promotions ---
  openNewOfferModal(): void {
    this.offerTitle = '';
    this.offerCode = '';
    this.offerDiscount = 15;
    this.offerDesc = '';
    this.offerValidTill = '2026-12-31';
    this.showNewOfferModal = true;
  }

  saveNewOffer(): void {
    if (!this.offerTitle.trim() || !this.offerCode.trim()) {
      alert('Please fill in offer title and promo code');
      return;
    }

    this.configService.addOffer({
      title: this.offerTitle,
      code: this.offerCode.toUpperCase(),
      discountPercentage: Number(this.offerDiscount),
      description: this.offerDesc,
      validTill: this.offerValidTill,
      active: true
    });

    this.showNewOfferModal = false;
  }

  toggleOfferActive(offer: StoreOffer): void {
    this.configService.updateOffer(offer.id, { active: !offer.active });
  }

  deleteOffer(id: string): void {
    if (confirm('Delete this promotion offer?')) {
      this.configService.deleteOffer(id);
    }
  }

  // --- Store & Contact Settings ---
  saveSettings(): void {
    this.configService.updateConfig(this.config);
    alert('Settings updated successfully! Changes are live across all pages.');
  }

  // --- Sites Management ---
  openNewSiteModal(): void {
    this.newSiteName = '';
    this.newSiteClient = '';
    this.newSitePhone = '';
    this.newSiteAddress = '';
    this.newSiteContractType = 'with_material';
    this.newSiteEstimatedLaborDays = 15;
    this.newSitePlannedWorkers = 2;
    this.newSiteMaterialBudget = 45000;
    this.newSiteContractAmount = 100000;
    this.newSiteInitialAdvance = 30000;
    this.newSiteWorkers = 'Murugan, Suresh';
    this.showNewSiteModal = true;
  }

  saveNewSite(): void {
    if (!this.newSiteName.trim() || !this.newSiteClient.trim()) {
      alert('Please fill in Site Name and Client Name');
      return;
    }

    const workerList = this.newSiteWorkers
      .split(',')
      .map(w => w.trim())
      .filter(w => !!w);

    const site = this.siteService.createSite({
      siteName: this.newSiteName,
      clientName: this.newSiteClient,
      clientPhone: this.newSitePhone,
      siteAddress: this.newSiteAddress,
      contractType: this.newSiteContractType,
      estimatedLaborDays: Number(this.newSiteEstimatedLaborDays),
      plannedWorkersCount: Number(this.newSitePlannedWorkers),
      materialBudget: Number(this.newSiteMaterialBudget),
      contractAmount: Number(this.newSiteContractAmount),
      totalReceived: Number(this.newSiteInitialAdvance),
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
    this.showAddExpenseModal = true;
  }

  onMaterialRateOrQtyChange(): void {
    if (this.expenseMaterialQty && this.expenseMaterialUnitRate) {
      this.expenseAmount = Math.round(Number(this.expenseMaterialQty) * Number(this.expenseMaterialUnitRate));
    }
  }

  saveExpense(): void {
    if (!this.activeSiteForAction || (!this.expenseTitle.trim() && !this.expenseMaterialName.trim()) || !this.expenseAmount) {
      alert('Please specify the expense / material description and amount');
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

  savePayment(): void {
    if (!this.activeSiteForAction || !this.paymentAmount) {
      alert('Please enter payment amount received');
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

  saveWorkLog(): void {
    if (!this.activeSiteForAction || !this.logDescription.trim()) {
      alert('Please describe today\'s work done');
      return;
    }

    this.siteService.addDailyLog(this.activeSiteForAction.id, {
      date: new Date().toISOString().split('T')[0],
      workerName: this.logWorkerName,
      workDescription: this.logDescription
    });

    this.showWorkLogModal = false;
  }

  openAssignWorkerModal(site: SiteProject): void {
    const promptWorkers = prompt('Update assigned electricians for today (separated by comma):', site.assignedElectricians.join(', '));
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

  saveScheduleWork(): void {
    if (!this.schedSiteId || !this.schedEmployeeId || !this.schedTask.trim()) {
      alert('Please select a site, an electrician, and enter task details.');
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
  autoGenerateSiteTimeline(site: SiteProject): void {
    if (confirm(`Auto-generate Day-by-Day project schedule for "${site.siteName}" starting from ${site.startDate} (Sundays excluded)?`)) {
      const generated = this.siteService.autoGenerateDayByDaySchedule(site.id);
      alert(`Success! Generated ${generated.length} pre-defined project work milestones for ${site.siteName}.`);
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

  saveReassignWorker(): void {
    if (!this.activeAllocationForAction || !this.reassignEmployeeId) return;

    this.siteService.reassignWorker(
      this.activeAllocationForAction.id,
      this.reassignEmployeeId,
      this.reassignReason
    );

    this.showReassignModal = false;
    alert('Worker reassigned successfully! Roster updated.');
  }

  // Reschedule Date
  openRescheduleModal(alloc: SiteWorkAllocation): void {
    this.activeAllocationForAction = alloc;
    this.rescheduleDateVal = alloc.date;
    this.rescheduleReason = 'Postponed due to client site readiness / rain';
    this.showRescheduleModal = true;
  }

  saveRescheduleDate(): void {
    if (!this.activeAllocationForAction || !this.rescheduleDateVal) return;

    this.siteService.rescheduleDate(
      this.activeAllocationForAction.id,
      this.rescheduleDateVal,
      this.rescheduleReason
    );

    this.showRescheduleModal = false;
    alert(`Work task rescheduled to ${this.rescheduleDateVal}!`);
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

  saveCarryForwardTask(): void {
    if (!this.activeAllocationForAction || !this.carryForwardNextDate) return;

    this.siteService.carryForwardTask(
      this.activeAllocationForAction.id,
      this.carryForwardNextDate,
      this.carryForwardReason
    );

    this.showCarryForwardModal = false;
    alert(`Task carried forward to ${this.carryForwardNextDate} successfully!`);
  }

  // Complete with Overtime Modal
  openCompleteOvertimeModal(alloc: SiteWorkAllocation): void {
    this.activeAllocationForAction = alloc;
    this.overtimeHours = 0;
    this.overtimeNotes = '';
    this.showCompleteOvertimeModal = true;
  }

  saveCompleteWithOvertime(): void {
    if (!this.activeAllocationForAction) return;

    this.siteService.completeTaskWithOvertime(
      this.activeAllocationForAction.id,
      Number(this.overtimeHours || 0),
      this.overtimeNotes
    );

    this.showCompleteOvertimeModal = false;
    alert('Task marked as Completed! Labor wage and site log recorded automatically.');
  }

  toggleAllocationStatus(alloc: SiteWorkAllocation, newStatus: AllocationStatus): void {
    if (newStatus === 'completed') {
      this.openCompleteOvertimeModal(alloc);
    } else {
      this.siteService.updateAllocationStatus(alloc.id, newStatus);
    }
  }

  deleteAllocation(id: string): void {
    if (confirm('Delete this scheduled work item?')) {
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
    this.newEmpPhone = '';
    this.newEmpRole = 'Senior Wireman';
    this.newEmpDailyWage = 950;
    this.newEmpUpi = '';
    this.newEmpSpecialty = '';
    this.showNewEmployeeModal = true;
  }

  saveNewEmployee(): void {
    if (!this.newEmpName.trim() || !this.newEmpDailyWage) {
      alert('Please fill in Employee Name and Daily Wage Rate.');
      return;
    }

    this.siteService.addEmployee({
      name: this.newEmpName.trim(),
      phone: this.newEmpPhone.trim(),
      role: this.newEmpRole,
      dailyWage: Number(this.newEmpDailyWage),
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      upiId: this.newEmpUpi.trim(),
      specialty: this.newEmpSpecialty.trim()
    });

    this.showNewEmployeeModal = false;
    alert('New technician added to workforce directory successfully!');
  }

  deleteEmployee(id: string): void {
    if (confirm('Are you sure you want to remove this employee?')) {
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

  saveRecordPayout(): void {
    if (!this.activeEmployeeForPayout || !this.payoutAmount) {
      alert('Please enter wage payout amount.');
      return;
    }

    this.siteService.recordWagePayout({
      employeeId: this.activeEmployeeForPayout.id,
      amount: Number(this.payoutAmount),
      paymentMode: this.payoutMode,
      notes: this.payoutNotes
    });

    this.showRecordPayoutModal = false;
    alert(`Wage payout of ₹${this.payoutAmount} recorded for ${this.activeEmployeeForPayout.name}!`);
  }

  // Share Employee Wage Slip via WhatsApp
  shareEmployeeWageWhatsApp(emp: ElectricianEmployee): void {
    const text = `⚡ *ELECTRICAL VIBERS - TECHNICIAN WAGE SUMMARY*\n` +
      `👤 *Name:* ${emp.name} (${emp.role})\n` +
      `📞 *Phone:* ${emp.phone}\n` +
      `💰 *Daily Rate:* ₹${emp.dailyWage}/day\n` +
      `📅 *Days / Shifts Worked:* ${emp.totalDaysWorked || 0} Days\n` +
      `💵 *Total Wages Earned:* ₹${(emp.totalWagesEarned || 0).toLocaleString()}\n` +
      `✅ *Total Wages Paid Out:* ₹${(emp.totalWagesPaid || 0).toLocaleString()}\n` +
      `⏳ *Pending Wage Balance:* ₹${(emp.pendingWageBalance || 0).toLocaleString()}\n` +
      `📱 *UPI ID:* ${emp.upiId || 'N/A'}\n\n` +
      `Electrical Vibers Operations Office, Chennai.`;
    window.open(`https://api.whatsapp.com/send?phone=${emp.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(text)}`, '_blank');
  }

  // --- Site Profit & Financial Analytics Report ---
  openProfitReportModal(site: SiteProject): void {
    this.activeSiteProfitReport = this.siteService.getSiteProfitReport(site.id);
    this.showProfitReportModal = true;
  }

  shareProfitReportWhatsApp(report: SiteProfitReport): void {
    const typeLabel = report.contractType === 'labor_only' ? '🛠️ Labour Only (லேபர் மட்டும்)' : '📦 With Material + Labour (மெட்டீரியலுடன்)';
    const text = `⚡ *ELECTRICAL VIBERS - SITE FINANCIAL & PROFIT REPORT*\n` +
      `🏢 *Site:* ${report.siteName}\n` +
      `👤 *Client:* ${report.clientName}\n` +
      `📝 *Contract Type:* ${typeLabel}\n` +
      `------------------------------------\n` +
      `💼 *Total Contract Value:* ₹${report.contractAmount.toLocaleString()}\n` +
      `💰 *Client Payment Received:* ₹${report.totalReceived.toLocaleString()}\n` +
      `⏳ *Pending from Client:* ₹${report.pendingFromClient.toLocaleString()}\n` +
      `------------------------------------\n` +
      `📦 *Material Purchases:* ₹${report.materialExpenses.toLocaleString()}\n` +
      `👷 *Labor Wages Incurred:* ₹${report.laborWages.toLocaleString()} (${report.actualLaborDaysWorked} Man-Days)\n` +
      `🚗 *Travel & Site Food:* ₹${report.otherExpenses.toLocaleString()}\n` +
      `🔴 *Total Site Costs:* ₹${report.totalExpenses.toLocaleString()}\n` +
      `------------------------------------\n` +
      `✨ *NET PROFIT (நிகர லாபம்):* ₹${report.netProfit.toLocaleString()}\n` +
      `📈 *Profit Margin:* ${report.profitMarginPercent}%\n` +
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
}

