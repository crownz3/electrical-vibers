import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CustomerService, CustomerProfile, SavedAddress } from '../../services/customer.service';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  customerService = inject(CustomerService);
  orderService = inject(OrderService);
  cartService = inject(CartService);
  authService = inject(AuthService);
  configService = inject(ConfigService);
  router = inject(Router);

  activeTab: 'orders' | 'edit' | 'addresses' | 'preferences' = 'orders';

  // Customer Profile Model for Editing
  profile: CustomerProfile = this.customerService.getProfile();
  
  // Edit Form Fields
  editName = '';
  editPhone = '';
  editEmail = '';
  editStreet = '';
  editCity = 'Chennai';
  editPincode = '';
  editLandmark = '';
  editCompany = '';
  editGstin = '';

  // Preferences Form Fields
  prefWhatsapp = true;
  prefSms = true;
  prefEmail = true;

  // New Address Form Modal
  showNewAddressModal = false;
  newAddressLabel: 'Home' | 'Work/Site' | 'Office' | 'Other' = 'Home';
  newAddressStreet = '';
  newAddressCity = 'Chennai';
  newAddressPincode = '';
  newAddressLandmark = '';
  newAddressIsDefault = false;

  // Orders State
  orders: Order[] = [];
  orderFilter: 'ALL' | OrderStatus = 'ALL';
  orderSearchQuery = '';

  // Invoice Slip Modal
  selectedOrderForInvoice: Order | null = null;
  showInvoiceModal = false;

  // Toast feedback
  toastMessage = '';
  toastType: 'success' | 'info' | 'error' = 'success';
  private toastTimeout: any;

  ngOnInit(): void {
    this.customerService.profile$.subscribe(prof => {
      this.profile = prof;
      this.syncFormFields(prof);
    });

    this.orderService.orders$.subscribe(allOrders => {
      this.orders = allOrders;
    });
  }

  private syncFormFields(prof: CustomerProfile): void {
    this.editName = prof.name;
    this.editPhone = prof.phone;
    this.editEmail = prof.email;
    this.editStreet = prof.street;
    this.editCity = prof.city;
    this.editPincode = prof.pincode;
    this.editLandmark = prof.landmark || '';
    this.editCompany = prof.companyName || '';
    this.editGstin = prof.gstin || '';
    this.prefWhatsapp = prof.preferences?.whatsappUpdates ?? true;
    this.prefSms = prof.preferences?.smsAlerts ?? true;
    this.prefEmail = prof.preferences?.emailInvoices ?? true;
  }

  // --- Filtered Orders ---
  get filteredOrders(): Order[] {
    const q = this.orderSearchQuery.trim().toLowerCase();
    return this.orders.filter(o => {
      // Show orders matching customer or all sample orders
      const matchesPhone = !this.profile.phone || 
        o.customerPhone.replace(/\s+/g, '') === this.profile.phone.replace(/\s+/g, '') ||
        o.customerName.toLowerCase() === this.profile.name.toLowerCase() ||
        this.orders.length <= 4; // allow viewing recent orders
      
      const matchesFilter = this.orderFilter === 'ALL' || o.orderStatus === this.orderFilter;
      
      const matchesSearch = !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some(i => i.product.name.toLowerCase().includes(q) || i.product.brand.toLowerCase().includes(q));

      return matchesPhone && matchesFilter && matchesSearch;
    });
  }

  get totalSpent(): number {
    return this.filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  get activeDeliveriesCount(): number {
    return this.filteredOrders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'confirmed' || o.orderStatus === 'dispatched').length;
  }

  // --- Account Actions ---
  saveProfileChanges(): void {
    if (!this.editName.trim() || !this.editPhone.trim()) {
      this.showToast('Please enter your full name and phone number', 'error');
      return;
    }

    this.customerService.updateProfile({
      name: this.editName.trim(),
      phone: this.editPhone.trim(),
      email: this.editEmail.trim(),
      street: this.editStreet.trim(),
      city: this.editCity.trim(),
      pincode: this.editPincode.trim(),
      landmark: this.editLandmark.trim(),
      companyName: this.editCompany.trim(),
      gstin: this.editGstin.trim().toUpperCase(),
      preferences: {
        whatsappUpdates: this.prefWhatsapp,
        smsAlerts: this.prefSms,
        emailInvoices: this.prefEmail
      }
    });

    this.showToast('Profile and billing details saved successfully!', 'success');
  }

  resetForm(): void {
    this.syncFormFields(this.profile);
    this.showToast('Changes reverted to saved details', 'info');
  }

  // --- Saved Addresses Actions ---
  openAddAddressModal(): void {
    this.newAddressLabel = 'Home';
    this.newAddressStreet = '';
    this.newAddressCity = 'Chennai';
    this.newAddressPincode = '';
    this.newAddressLandmark = '';
    this.newAddressIsDefault = false;
    this.showNewAddressModal = true;
  }

  saveNewAddress(): void {
    if (!this.newAddressStreet.trim() || !this.newAddressPincode.trim()) {
      this.showToast('Please provide street address and pincode', 'error');
      return;
    }

    this.customerService.addAddress({
      label: this.newAddressLabel,
      street: this.newAddressStreet.trim(),
      city: this.newAddressCity.trim(),
      pincode: this.newAddressPincode.trim(),
      landmark: this.newAddressLandmark.trim(),
      isDefault: this.newAddressIsDefault
    });

    this.showNewAddressModal = false;
    this.showToast('New delivery location added!', 'success');
  }

  setDefaultAddress(addr: SavedAddress): void {
    this.customerService.setDefaultAddress(addr.id);
    this.showToast(`Set "${addr.label}" as default delivery address`, 'success');
  }

  deleteAddress(addr: SavedAddress): void {
    if (confirm(`Remove "${addr.label}" from saved addresses?`)) {
      this.customerService.deleteAddress(addr.id);
      this.showToast('Address removed', 'info');
    }
  }

  // --- Order Actions ---
  reorderItems(order: Order): void {
    for (const item of order.items) {
      this.cartService.addToCart(item.product, item.quantity, false);
    }
    this.showToast(`${order.items.length} items added to your shopping cart!`, 'success');
    this.cartService.openDrawer();
  }

  trackOrder(order: Order): void {
    this.router.navigate(['/track-order'], { queryParams: { id: order.id } });
  }

  contactWhatsAppForOrder(order: Order): void {
    const link = this.orderService.generateWhatsAppOrderLink(order);
    window.open(link, '_blank');
  }

  openInvoiceModal(order: Order): void {
    this.selectedOrderForInvoice = order;
    this.showInvoiceModal = true;
  }

  printInvoice(): void {
    window.print();
  }

  copyOrderId(id: string): void {
    navigator.clipboard?.writeText(id);
    this.showToast(`Copied Order ID: ${id}`, 'info');
  }

  showToast(msg: string, type: 'success' | 'info' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }
}
