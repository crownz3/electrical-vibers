import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Booking, BookingStatus, ServiceCategory } from '../models/booking.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly BOOKINGS_KEY = 'voltmaster_bookings_v1';
  private readonly SERVICES_KEY = 'voltmaster_services_v1';

  private defaultServices: ServiceCategory[] = [
    {
      id: 'house-wiring',
      title: 'Complete House & Villa Wiring',
      tamilTitle: 'முழு வீடு மற்றும் வில்லா வயரிங்',
      icon: 'electric_bolt',
      description: 'Conduit laying, point marking, copper wire pulling, DB fixing, and load testing for new buildings and renovations.',
      startingPrice: 3500,
      popular: true
    },
    {
      id: 'switchboard-repair',
      title: 'Switchboard & Socket Fixing',
      tamilTitle: 'சுவிட்ச்போர்டு & சாக்கெட் பழுதுபார்த்தல்',
      icon: 'toggle_on',
      description: 'Burned switch replacement, spark fixing, loose connection check, and modular board upgrades.',
      startingPrice: 199,
      popular: true
    },
    {
      id: 'mcb-tripping',
      title: 'MCB Tripping & Short Circuit Diagnosis',
      tamilTitle: 'MCB டிரிப்பிங் & ஷார்ட் சர்க்யூட் சரிசெய்தல்',
      icon: 'power_off',
      description: 'Precision insulation testing, earth leakage detection, neutral fault clearing, and fuse replacement.',
      startingPrice: 399,
      popular: true
    },
    {
      id: 'fan-appliance',
      title: 'Fan, Light & Chandelier Fitting',
      tamilTitle: 'ஃபேன், விளக்கு & அப்ளையன்ஸ் பொருத்துதல்',
      icon: 'mode_fan',
      description: 'Ceiling fan mounting with hook check, decorative chandelier install, exhaust fan fitting, and profile LED lights.',
      startingPrice: 249,
      popular: false
    },
    {
      id: 'inverter-ups',
      title: 'Inverter & Battery Wiring Setup',
      tamilTitle: 'இன்வெர்ட்டர் & பேட்டரி வயரிங் அமைப்பு',
      icon: 'battery_charging_full',
      description: 'Safe separate neutral loop wiring, inverter bypass switch setup, battery trolley assembly, and backup load distribution.',
      startingPrice: 499,
      popular: true
    },
    {
      id: 'earthing',
      title: 'Chemical Earthing & Surge Protection',
      tamilTitle: 'எர்த்திங் & சர்ஜ் பாதுகாப்பு',
      icon: 'shield',
      description: 'Copper/GI chemical earthing pit excavation, bentonite compound filling, and lightning surge protection testing.',
      startingPrice: 1800,
      popular: false
    }
  ];

  private initialBookings: Booking[] = [
    {
      id: 'BK-1001',
      customerId: 'cust-1',
      customerName: 'Karthik Subramanian',
      customerPhone: '+91 98401 23456',
      customerAddress: 'Flat 3B, Sunshine Apartments, 2nd Cross Street',
      city: 'Anna Nagar, Chennai',
      landmark: 'Near Roundtana',
      serviceCategory: 'mcb-tripping',
      serviceTitle: 'MCB Tripping & Short Circuit Diagnosis',
      problemDescription: 'Main MCB trips whenever AC and Geyser are turned on together. Burning smell near main distribution box.',
      preferredDate: '2026-10-14',
      preferredTimeSlot: 'Morning 10:00 AM - 01:00 PM',
      status: 'assigned',
      assignedTechnician: 'Murugan (Senior Tech)',
      technicianPhone: '+91 94441 55667',
      estimatedCost: 650,
      createdAt: new Date().toISOString()
    },
    {
      id: 'BK-1002',
      customerId: 'cust-2',
      customerName: 'Priya Ramesh',
      customerPhone: '+91 97910 88990',
      customerAddress: 'No 45, Velachery Main Road',
      city: 'Velachery, Chennai',
      landmark: 'Opposite Grand Mall',
      serviceCategory: 'inverter-ups',
      serviceTitle: 'Inverter & Battery Wiring Setup',
      problemDescription: 'Bought new Luminous 900VA Inverter. Need full household backup wiring connection.',
      preferredDate: '2026-10-15',
      preferredTimeSlot: 'Afternoon 02:00 PM - 05:00 PM',
      status: 'pending',
      estimatedCost: 800,
      createdAt: new Date().toISOString()
    }
  ];

  private servicesSubject = new BehaviorSubject<ServiceCategory[]>([]);
  public services$: Observable<ServiceCategory[]> = this.servicesSubject.asObservable();

  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$: Observable<Booking[]> = this.bookingsSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.loadServices();
    this.loadBookings();
    this.initCloudSync();
  }

  private initCloudSync(): void {
    // Listen to real-time bookings
    this.firebaseService.listenToCollection<Booking>('bookings', (remoteBookings) => {
      if (remoteBookings && remoteBookings.length > 0) {
        const localMap = new Map<string, Booking>();
        this.bookingsSubject.getValue().forEach(b => localMap.set(b.id, b));
        remoteBookings.forEach(b => localMap.set(b.id, b));
        const merged = Array.from(localMap.values()).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.saveBookings(merged);
      } else {
        // Seed initial bookings to Firestore
        const current = this.bookingsSubject.getValue();
        if (current.length > 0) {
          current.forEach(booking => {
            this.firebaseService.setDocument('bookings', booking.id, booking);
          });
        }
      }
    });

    // Listen to real-time service categories
    this.firebaseService.listenToCollection<ServiceCategory>('services', (remoteServices) => {
      if (remoteServices && remoteServices.length > 0) {
        const sanitized = remoteServices.map(s => s.icon === 'grounding' ? { ...s, icon: 'shield' } : s);
        this.saveServices(sanitized);
      } else {
        const current = this.servicesSubject.getValue();
        if (current.length > 0) {
          current.forEach(srv => {
            this.firebaseService.setDocument('services', srv.id, srv);
          });
        }
      }
    });
  }

  // --- Dynamic Services Management ---
  private loadServices(): void {
    const saved = localStorage.getItem(this.SERVICES_KEY);
    if (saved) {
      try {
        const parsed: ServiceCategory[] = JSON.parse(saved);
        let migrated = false;
        parsed.forEach(s => {
          if (s.icon === 'grounding') {
            s.icon = 'shield';
            migrated = true;
          }
        });
        if (migrated) {
          this.saveServices(parsed);
        } else {
          this.servicesSubject.next(parsed);
        }
        return;
      } catch (e) {
        console.error('Failed to parse saved services:', e);
      }
    }
    this.saveServices(this.defaultServices);
  }

  private saveServices(services: ServiceCategory[]): void {
    localStorage.setItem(this.SERVICES_KEY, JSON.stringify(services));
    this.servicesSubject.next(services);
  }

  getServices(): ServiceCategory[] {
    return this.servicesSubject.getValue();
  }

  getServiceById(id: string): ServiceCategory | undefined {
    return this.servicesSubject.getValue().find(s => s.id === id);
  }

  addService(service: Omit<ServiceCategory, 'id'>): ServiceCategory {
    const newService: ServiceCategory = {
      ...service,
      id: 'srv-' + Date.now()
    };
    const updated = [...this.servicesSubject.getValue(), newService];
    this.saveServices(updated);
    this.firebaseService.setDocument('services', newService.id, newService).catch(err => {
      console.warn('Could not save service to Firestore:', err);
    });
    return newService;
  }

  updateService(id: string, updates: Partial<ServiceCategory>): void {
    const updated = this.servicesSubject.getValue().map(s => {
      if (s.id === id) {
        return { ...s, ...updates };
      }
      return s;
    });
    this.saveServices(updated);
    this.firebaseService.updateDocument('services', id, updates).catch(err => {
      console.warn('Could not update service in Firestore:', err);
    });
  }

  deleteService(id: string): void {
    const updated = this.servicesSubject.getValue().filter(s => s.id !== id);
    this.saveServices(updated);
    this.firebaseService.deleteDocument('services', id).catch(err => {
      console.warn('Could not delete service from Firestore:', err);
    });
  }

  // --- Bookings ---
  private loadBookings(): void {
    const saved = localStorage.getItem(this.BOOKINGS_KEY);
    if (saved) {
      try {
        this.bookingsSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved bookings:', e);
      }
    }
    this.saveBookings(this.initialBookings);
  }

  private saveBookings(bookings: Booking[]): void {
    localStorage.setItem(this.BOOKINGS_KEY, JSON.stringify(bookings));
    this.bookingsSubject.next(bookings);
  }

  getBookings(): Booking[] {
    return this.bookingsSubject.getValue();
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookingsSubject.getValue().find(b => b.id === id);
  }

  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const newBooking: Booking = {
      ...booking,
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const updated = [newBooking, ...this.bookingsSubject.getValue()];
    this.saveBookings(updated);

    // Persist to Cloud Firestore
    this.firebaseService.setDocument('bookings', newBooking.id, newBooking).catch(err => {
      console.warn('Could not save booking to Firestore:', err);
    });

    return newBooking;
  }

  updateBookingStatus(id: string, status: BookingStatus, assignedTechnician?: string, finalCost?: number): void {
    const changes: Partial<Booking> = {
      status,
      ...(assignedTechnician ? { assignedTechnician } : {}),
      ...(finalCost !== undefined ? { finalCost } : {}),
      ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {})
    };

    const updated = this.bookingsSubject.getValue().map(b => {
      if (b.id === id) {
        return { ...b, ...changes };
      }
      return b;
    });
    this.saveBookings(updated);

    // Persist status change to Firestore
    this.firebaseService.updateDocument('bookings', id, changes).catch(err => {
      console.warn('Could not update booking in Firestore:', err);
    });
  }

  generateWhatsAppLink(booking: Booking): string {
    const text = encodeURIComponent(
      `⚡ *Electrical Vibers Service Booking*\n\n` +
      `*Booking ID:* ${booking.id}\n` +
      `*Customer:* ${booking.customerName} (${booking.customerPhone})\n` +
      `*Service:* ${booking.serviceTitle} (${booking.serviceCategory})\n` +
      `*Schedule:* ${booking.preferredDate} at ${booking.preferredTimeSlot}\n` +
      `*Address:* ${booking.customerAddress}, ${booking.city}\n` +
      `*Status:* ${booking.status.toUpperCase()}\n` +
      `*Estimated Cost:* ₹${booking.estimatedCost || 149}`
    );
    return `https://wa.me/919876543210?text=${text}`;
  }
}
