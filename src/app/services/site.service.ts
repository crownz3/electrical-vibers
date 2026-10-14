import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SiteProject, SiteExpense, SitePayment, SiteWorkerAssignment, ExpenseCategory } from '../models/site.model';

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  private readonly STORAGE_KEY = 'voltmaster_sites_v1';

  // Seed sample realistic sites for the electrician
  private initialSites: SiteProject[] = [
    {
      id: 'site-101',
      siteName: 'Green Meadows Luxury Villa - 3BHK Wiring',
      clientName: 'Dr. S. Sundararajan',
      clientPhone: '+91 98840 11223',
      siteAddress: 'Plot 42, 3rd Avenue, Injambakkam, ECR',
      city: 'Chennai',
      status: 'ongoing',
      startDate: '2026-10-01',
      expectedCompletionDate: '2026-10-25',
      contractAmount: 185000,
      totalReceived: 90000,
      pendingBalance: 95000, // 185000 - 90000
      totalExpenses: 48600,
      profitOrMargin: 41400, // 90000 received - 48600 expenses
      assignedElectricians: ['Murugan (Lead)', 'Suresh', 'Vignesh'],
      description: 'Complete concealed PVC piping, 1100V copper wiring, distribution board assembly, VRV AC circuiting, home theatre wiring, and terrace garden decorative lighting.',
      progressPercentage: 65,
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-12T08:30:00Z',
      expenses: [
        {
          id: 'exp-1',
          date: '2026-10-02',
          title: 'Finolex 2.5mm & 1.5mm Wire Coils (8 Coils)',
          category: 'material',
          amount: 22400,
          notes: 'Purchased from Royal Electricals wholesale with bill #4829',
          recordedBy: 'Admin'
        },
        {
          id: 'exp-2',
          date: '2026-10-04',
          title: 'Precision 25mm Heavy Duty PVC Pipes & Metal Junction Boxes',
          category: 'material',
          amount: 8200,
          notes: 'Ground floor and first floor conduit fittings',
          recordedBy: 'Murugan (Lead)'
        },
        {
          id: 'exp-3',
          date: '2026-10-07',
          title: 'Weekly Labor Wages (Suresh & Vignesh - Chipping & Wall Cutting)',
          category: 'labor',
          amount: 14000,
          notes: 'Wall grooving and conduit insertion labor',
          recordedBy: 'Admin'
        },
        {
          id: 'exp-4',
          date: '2026-10-11',
          title: 'Team Tea, Lunch & Van Transport for Materials',
          category: 'travel_food',
          amount: 4000,
          notes: 'Material dispatch to ECR site and daily food allowance',
          recordedBy: 'Murugan (Lead)'
        }
      ],
      payments: [
        {
          id: 'pay-1',
          date: '2026-10-01',
          amount: 50000,
          paymentMode: 'bank_transfer',
          receiptNo: 'REC-001',
          notes: 'Initial work commencement advance via NEFT'
        },
        {
          id: 'pay-2',
          date: '2026-10-08',
          amount: 40000,
          paymentMode: 'gpay_upi',
          receiptNo: 'REC-002',
          notes: 'Second milestone: Concealed piping & box fixing completed'
        }
      ],
      dailyLogs: [
        {
          id: 'log-1',
          date: '2026-10-10',
          workerName: 'Murugan (Lead)',
          workDescription: 'Distribution Box (DB) neutral busbar wiring & MCB sorting on 1st Floor.'
        },
        {
          id: 'log-2',
          date: '2026-10-11',
          workerName: 'Suresh',
          workDescription: 'Wire pulling completed for Bed Room 1 & Living Room profile light grooves.'
        },
        {
          id: 'log-3',
          date: '2026-10-12',
          workerName: 'Vignesh',
          workDescription: 'Earthing pit chemical salt compound dumping and copper strip testing.'
        }
      ]
    },
    {
      id: 'site-102',
      siteName: 'Trends Boutique & Showroom - Track Lighting & DB Upgrade',
      clientName: 'Mrs. Jayashree Kumar',
      clientPhone: '+91 94443 77889',
      siteAddress: 'Shop 14, Usman Road, T. Nagar',
      city: 'Chennai',
      status: 'ongoing',
      startDate: '2026-10-08',
      expectedCompletionDate: '2026-10-18',
      contractAmount: 75000,
      totalReceived: 35000,
      pendingBalance: 40000, // 75000 - 35000
      totalExpenses: 21500,
      profitOrMargin: 13500,
      assignedElectricians: ['Ravi', 'Kuppusamy'],
      description: 'Commercial showroom aesthetic track light installation, display counter spotlights, 63A TP MCB DB setup, and 10kVA stabilizer connection.',
      progressPercentage: 40,
      createdAt: '2026-10-08T10:00:00Z',
      updatedAt: '2026-10-12T07:15:00Z',
      expenses: [
        {
          id: 'exp-5',
          date: '2026-10-09',
          title: 'Aluminum Track Rails (12m) & High-CRI 20W COB Spotlights',
          category: 'material',
          amount: 16500,
          recordedBy: 'Admin'
        },
        {
          id: 'exp-6',
          date: '2026-10-10',
          title: 'Night Shift Overtime Allowance for 2 Electricians',
          category: 'labor',
          amount: 5000,
          notes: 'Mall restrictions: Work conducted from 9:30 PM to 4:00 AM',
          recordedBy: 'Ravi'
        }
      ],
      payments: [
        {
          id: 'pay-3',
          date: '2026-10-08',
          amount: 35000,
          paymentMode: 'gpay_upi',
          receiptNo: 'REC-003',
          notes: 'Advance 50% booking payment'
        }
      ],
      dailyLogs: [
        {
          id: 'log-4',
          date: '2026-10-11',
          workerName: 'Ravi',
          workDescription: 'Track rails aligned with laser level and secured to false ceiling channel.'
        }
      ]
    },
    {
      id: 'site-103',
      siteName: 'AeroTech Office Floor - Server Room UPS & Redundant Power',
      clientName: 'Mr. Rajesh Menon (Facilities Mgr)',
      clientPhone: '+91 99620 44556',
      siteAddress: 'Module 4A, Olympia Tech Park, Guindy',
      city: 'Chennai',
      status: 'completed',
      startDate: '2026-09-15',
      expectedCompletionDate: '2026-09-28',
      contractAmount: 120000,
      totalReceived: 120000,
      pendingBalance: 0,
      totalExpenses: 68000,
      profitOrMargin: 52000,
      assignedElectricians: ['Murugan (Lead)', 'Ravi'],
      description: 'Dual UPS power bus duct connection, server rack PDU sockets, surge protection device (SPD) installation, and phase load balancing.',
      progressPercentage: 100,
      createdAt: '2026-09-15T09:00:00Z',
      updatedAt: '2026-09-29T16:00:00Z',
      expenses: [],
      payments: [
        {
          id: 'pay-4',
          date: '2026-09-15',
          amount: 60000,
          paymentMode: 'bank_transfer',
          receiptNo: 'REC-004'
        },
        {
          id: 'pay-5',
          date: '2026-09-29',
          amount: 60000,
          paymentMode: 'bank_transfer',
          receiptNo: 'REC-005',
          notes: 'Final settlement after inspection signoff'
        }
      ],
      dailyLogs: []
    }
  ];

  private sitesSubject = new BehaviorSubject<SiteProject[]>([]);
  public sites$: Observable<SiteProject[]> = this.sitesSubject.asObservable();

  constructor() {
    this.loadSites();
  }

  private loadSites(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.sitesSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved sites:', e);
      }
    }
    this.saveSites(this.initialSites);
  }

  private saveSites(sites: SiteProject[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sites));
    this.sitesSubject.next(sites);
  }

  getSites(): SiteProject[] {
    return this.sitesSubject.getValue();
  }

  getSiteById(id: string): SiteProject | undefined {
    return this.sitesSubject.getValue().find(s => s.id === id);
  }

  createSite(siteData: Partial<SiteProject>): SiteProject {
    const contractAmount = Number(siteData.contractAmount || 0);
    const initialAdvance = Number(siteData.totalReceived || 0);

    const initialPayments: SitePayment[] = initialAdvance > 0 ? [{
      id: 'pay-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount: initialAdvance,
      paymentMode: 'cash',
      receiptNo: 'REC-ADV-' + Math.floor(100 + Math.random() * 900),
      notes: 'Initial site booking advance'
    }] : [];

    const newSite: SiteProject = {
      id: 'site-' + Date.now(),
      siteName: siteData.siteName || 'New Electrical Site',
      clientName: siteData.clientName || '',
      clientPhone: siteData.clientPhone || '',
      siteAddress: siteData.siteAddress || '',
      city: siteData.city || 'Chennai',
      status: 'ongoing',
      startDate: siteData.startDate || new Date().toISOString().split('T')[0],
      expectedCompletionDate: siteData.expectedCompletionDate || '',
      contractAmount: contractAmount,
      totalReceived: initialAdvance,
      pendingBalance: Math.max(0, contractAmount - initialAdvance),
      totalExpenses: 0,
      profitOrMargin: initialAdvance,
      assignedElectricians: siteData.assignedElectricians || [],
      description: siteData.description || '',
      expenses: [],
      payments: initialPayments,
      dailyLogs: [],
      progressPercentage: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newSite, ...this.sitesSubject.getValue()];
    this.saveSites(updated);
    return newSite;
  }

  updateSite(id: string, updates: Partial<SiteProject>): void {
    const updated = this.sitesSubject.getValue().map(site => {
      if (site.id === id) {
        const merged = { ...site, ...updates, updatedAt: new Date().toISOString() };
        // Recalculate financial balances
        merged.pendingBalance = Math.max(0, merged.contractAmount - merged.totalReceived);
        merged.profitOrMargin = merged.totalReceived - merged.totalExpenses;
        return merged;
      }
      return site;
    });
    this.saveSites(updated);
  }

  addExpense(siteId: string, expense: Omit<SiteExpense, 'id'>): void {
    const site = this.getSiteById(siteId);
    if (!site) return;

    const newExpense: SiteExpense = {
      ...expense,
      id: 'exp-' + Date.now(),
      amount: Number(expense.amount)
    };

    const updatedExpenses = [newExpense, ...site.expenses];
    const totalExpenses = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);

    this.updateSite(siteId, {
      expenses: updatedExpenses,
      totalExpenses
    });
  }

  addPayment(siteId: string, payment: Omit<SitePayment, 'id'>): void {
    const site = this.getSiteById(siteId);
    if (!site) return;

    const newPayment: SitePayment = {
      ...payment,
      id: 'pay-' + Date.now(),
      amount: Number(payment.amount)
    };

    const updatedPayments = [newPayment, ...site.payments];
    const totalReceived = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    this.updateSite(siteId, {
      payments: updatedPayments,
      totalReceived
    });
  }

  addDailyLog(siteId: string, log: Omit<SiteWorkerAssignment, 'id'>): void {
    const site = this.getSiteById(siteId);
    if (!site) return;

    const newLog: SiteWorkerAssignment = {
      ...log,
      id: 'log-' + Date.now()
    };

    const updatedLogs = [newLog, ...site.dailyLogs];
    this.updateSite(siteId, {
      dailyLogs: updatedLogs
    });
  }

  assignWorkers(siteId: string, workers: string[]): void {
    this.updateSite(siteId, { assignedElectricians: workers });
  }

  deleteSite(siteId: string): void {
    const updated = this.sitesSubject.getValue().filter(s => s.id !== siteId);
    this.saveSites(updated);
  }

  // Aggregate stats across all sites for admin dashboard
  getOverallStats() {
    const sites = this.sitesSubject.getValue();
    const ongoingSites = sites.filter(s => s.status === 'ongoing');
    const totalContractValue = sites.reduce((sum, s) => sum + s.contractAmount, 0);
    const totalCollected = sites.reduce((sum, s) => sum + s.totalReceived, 0);
    const totalPending = sites.reduce((sum, s) => sum + s.pendingBalance, 0);
    const totalExpenses = sites.reduce((sum, s) => sum + s.totalExpenses, 0);

    return {
      totalSites: sites.length,
      ongoingSitesCount: ongoingSites.length,
      totalContractValue,
      totalCollected,
      totalPending,
      totalExpenses,
      netProfit: totalCollected - totalExpenses
    };
  }
}
