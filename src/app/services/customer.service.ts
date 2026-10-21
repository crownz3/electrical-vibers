import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private readonly STORAGE_KEY = 'voltmaster_customer_profile_v1';

  private readonly DEFAULT_PROFILE: CustomerProfile = {
    id: 'CUST-88301',
    name: 'Karthik Subramanian',
    phone: '+91 98401 23456',
    email: 'karthik.subbu@gmail.com',
    street: 'Plot No. 42, 3rd Main Road, Anna Nagar West',
    city: 'Chennai',
    pincode: '600040',
    landmark: 'Near Tower Park Roundabout',
    companyName: 'Subramanian Electrical & Interiors',
    gstin: '33AABCS1429B1Z8',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    savedAddresses: [
      {
        id: 'addr-1',
        label: 'Home',
        street: 'Plot No. 42, 3rd Main Road, Anna Nagar West',
        city: 'Chennai',
        pincode: '600040',
        landmark: 'Near Tower Park Roundabout',
        isDefault: true
      },
      {
        id: 'addr-2',
        label: 'Work/Site',
        street: 'Site #18, OMR IT Expressway, Sholinganallur',
        city: 'Chennai',
        pincode: '600119',
        landmark: 'Near ELCOT SEZ Main Gate',
        isDefault: false
      },
      {
        id: 'addr-3',
        label: 'Office',
        street: 'No. 5, North Usman Road, T. Nagar',
        city: 'Chennai',
        pincode: '600017',
        landmark: 'Opposite GRT Grand',
        isDefault: false
      }
    ],
    preferences: {
      whatsappUpdates: true,
      smsAlerts: true,
      emailInvoices: true
    }
  };

  private profileSubject = new BehaviorSubject<CustomerProfile>(this.DEFAULT_PROFILE);
  public profile$: Observable<CustomerProfile> = this.profileSubject.asObservable();

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.profileSubject.next({ ...this.DEFAULT_PROFILE, ...parsed });
        return;
      } catch (e) {
        console.error('Failed to parse saved customer profile:', e);
      }
    }
    this.saveProfile(this.DEFAULT_PROFILE);
  }

  public saveProfile(profile: CustomerProfile): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    this.profileSubject.next(profile);
  }

  public getProfile(): CustomerProfile {
    return this.profileSubject.getValue();
  }

  public updateProfile(changes: Partial<CustomerProfile>): CustomerProfile {
    const current = this.getProfile();
    const updated: CustomerProfile = {
      ...current,
      ...changes,
      preferences: {
        ...current.preferences,
        ...(changes.preferences || {})
      }
    };
    this.saveProfile(updated);
    return updated;
  }

  public addAddress(address: Omit<SavedAddress, 'id'>): void {
    const current = this.getProfile();
    const newAddress: SavedAddress = {
      ...address,
      id: 'addr-' + Date.now()
    };

    let addresses = [...current.savedAddresses];
    if (newAddress.isDefault) {
      addresses = addresses.map(a => ({ ...a, isDefault: false }));
    }
    addresses.push(newAddress);

    this.updateProfile({ savedAddresses: addresses });
  }

  public deleteAddress(id: string): void {
    const current = this.getProfile();
    const addresses = current.savedAddresses.filter(a => a.id !== id);
    if (addresses.length > 0 && !addresses.some(a => a.isDefault)) {
      addresses[0].isDefault = true;
    }
    this.updateProfile({ savedAddresses: addresses });
  }

  public setDefaultAddress(id: string): void {
    const current = this.getProfile();
    const target = current.savedAddresses.find(a => a.id === id);
    if (!target) return;

    const addresses = current.savedAddresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));

    this.updateProfile({
      savedAddresses: addresses,
      street: target.street,
      city: target.city,
      pincode: target.pincode,
      landmark: target.landmark || ''
    });
  }
}
