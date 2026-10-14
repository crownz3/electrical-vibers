import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteService } from '../../services/site.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { BookingService } from '../../services/booking.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ConfigService, AppConfig, StoreOffer } from '../../services/config.service';
import { SiteProject, ExpenseCategory } from '../../models/site.model';
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

  activeTab: 'sites' | 'products' | 'categories' | 'services' | 'offers' | 'settings' | 'orders' | 'bookings' = 'sites';

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

  // Modals state
  showNewSiteModal = false;
  showAddExpenseModal = false;
  showAddPaymentModal = false;
  showWorkLogModal = false;
  showNewProductModal = false;
  showEditProductModal = false;
  showNewServiceModal = false;
  showEditServiceModal = false;
  showNewOfferModal = false;

  activeSiteForAction: SiteProject | null = null;
  editingProduct: Product | null = null;
  editingService: ServiceCategory | null = null;

  // New Site form
  newSiteName = '';
  newSiteClient = '';
  newSitePhone = '';
  newSiteAddress = '';
  newSiteContractAmount = 100000;
  newSiteInitialAdvance = 30000;
  newSiteWorkers = 'Murugan, Suresh';

  // Expense form
  expenseCategory: ExpenseCategory = 'material';
  expenseTitle = '';
  expenseAmount = 0;
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

  ngOnInit(): void {
    this.siteService.sites$.subscribe(s => this.sites = s);
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
      brand: this.prodBrand || 'VoltMaster Genuine',
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

    this.siteService.createSite({
      siteName: this.newSiteName,
      clientName: this.newSiteClient,
      clientPhone: this.newSitePhone,
      siteAddress: this.newSiteAddress,
      contractAmount: Number(this.newSiteContractAmount),
      totalReceived: Number(this.newSiteInitialAdvance),
      assignedElectricians: workerList
    });

    this.showNewSiteModal = false;
  }

  openAddExpenseModal(site: SiteProject): void {
    this.activeSiteForAction = site;
    this.expenseTitle = '';
    this.expenseAmount = 0;
    this.expenseNotes = '';
    this.showAddExpenseModal = true;
  }

  saveExpense(): void {
    if (!this.activeSiteForAction || !this.expenseTitle.trim() || !this.expenseAmount) {
      alert('Please specify the expense description and amount');
      return;
    }

    this.siteService.addExpense(this.activeSiteForAction.id, {
      date: new Date().toISOString().split('T')[0],
      title: this.expenseTitle,
      category: this.expenseCategory,
      amount: Number(this.expenseAmount),
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

  // --- Orders & Bookings ---
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.orderService.updateOrderStatus(orderId, status);
  }

  saveBookingAssignment(booking: Booking): void {
    this.bookingService.updateBookingStatus(booking.id, booking.status, booking.assignedTechnician);
  }
}
