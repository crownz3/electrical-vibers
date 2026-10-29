import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work/Site' | 'Office' | 'Other';
  street: string;
  city: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  pincode: string;
  landmark?: string;
  companyName?: string;
  gstin?: string;
  avatarUrl?: string;
  savedAddresses: SavedAddress[];
  preferences: {
    whatsappUpdates: boolean;
    smsAlerts: boolean;
    emailInvoices: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly STORAGE_KEY = 'electrical_vibers_customer_profile_v1';

  private readonly EMPTY_PROFILE: CustomerProfile = {
    id: '',
    name: '',
    phone: '',
    email: '',
    street: '',
    city: 'Chennai',
    pincode: '',
    landmark: '',
    companyName: '',
    gstin: '',
    avatarUrl: '',
    savedAddresses: [],
    preferences: {
      whatsappUpdates: true,
      smsAlerts: true,
      emailInvoices: true
    }
  };

  private profileSubject = new BehaviorSubject<CustomerProfile>(this.EMPTY_PROFILE);
  public profile$: Observable<CustomerProfile> = this.profileSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.loadProfile();
    this.initCloudSync();
  }

  private initCloudSync(): void {
    const current = this.profileSubject.getValue();
    if (current && current.id) {
      this.attachRemoteListener(current.id);
    }
  }

  private attachRemoteListener(customerId: string): void {
    this.firebaseService.listenToDocument<CustomerProfile>('customers', customerId, (remote) => {
      if (remote && remote.id) {
        this.saveProfileLocal(remote);
      }
    });
  }

  private loadProfile(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed: CustomerProfile = JSON.parse(saved);
        // If legacy dummy profile Karthik Subramanian was stored, clean it out
        if (parsed.name === 'Karthik Subramanian' && parsed.phone === '+91 98401 23456') {
          this.profileSubject.next(this.EMPTY_PROFILE);
          localStorage.removeItem(this.STORAGE_KEY);
          return;
        }
        this.profileSubject.next({ ...this.EMPTY_PROFILE, ...parsed });
        return;
      } catch (e) {
        console.error('Failed to parse customer profile:', e);
      }
    }
    this.profileSubject.next(this.EMPTY_PROFILE);
  }

  private saveProfileLocal(profile: CustomerProfile): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    this.profileSubject.next(profile);
  }

  getProfile(): CustomerProfile {
    return this.profileSubject.getValue();
  }

  updateProfile(updates: Partial<CustomerProfile>): void {
    const current = this.profileSubject.getValue();
    const id = current.id || 'CUST-' + Math.floor(10000 + Math.random() * 90000);
    const updated: CustomerProfile = {
      ...current,
      ...updates,
      id
    };

    this.saveProfileLocal(updated);

    // Persist real customer profile to Firestore
    this.firebaseService.setDocument('customers', id, updated).catch(err => {
      console.warn('Could not save customer profile to Firestore:', err);
    });

    if (!current.id) {
      this.attachRemoteListener(id);
    }
  }

  addSavedAddress(address: Omit<SavedAddress, 'id'>): void {
    const current = this.profileSubject.getValue();
    const newAddress: SavedAddress = {
      ...address,
      id: 'addr-' + Date.now()
    };

    let updatedAddresses = [...current.savedAddresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddress);

    this.updateProfile({ savedAddresses: updatedAddresses });
  }

  addAddress(address: Omit<SavedAddress, 'id'>): void {
    this.addSavedAddress(address);
  }

  removeSavedAddress(id: string): void {
    const current = this.profileSubject.getValue();
    const updatedAddresses = current.savedAddresses.filter(a => a.id !== id);
    if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }
    this.updateProfile({ savedAddresses: updatedAddresses });
  }

  deleteAddress(id: string): void {
    this.removeSavedAddress(id);
  }

  setDefaultAddress(id: string): void {
    const current = this.profileSubject.getValue();
    const updatedAddresses = current.savedAddresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    this.updateProfile({ savedAddresses: updatedAddresses });
  }
}
