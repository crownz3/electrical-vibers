import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  SiteProject, 
  SiteExpense, 
  SitePayment, 
  SiteWorkerAssignment, 
  ExpenseCategory,
  ElectricianEmployee,
  SiteWorkAllocation,
  WorkerWagePayout,
  SiteProfitReport,
  ShiftType,
  AllocationStatus
} from '../models/site.model';

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  private readonly STORAGE_KEY = 'voltmaster_sites_v1';
  private readonly EMPLOYEES_STORAGE_KEY = 'voltmaster_employees_v1';
  private readonly ALLOCATIONS_STORAGE_KEY = 'voltmaster_allocations_v1';
  private readonly PAYOUTS_STORAGE_KEY = 'voltmaster_wage_payouts_v1';

  // Seed sample realistic sites for the electrical contractor
  private initialSites: SiteProject[] = [
    {
      id: 'site-101',
      siteName: 'Green Meadows Luxury Villa - 3BHK Wiring',
      clientName: 'Dr. S. Sundararajan',
      clientPhone: '+91 98840 11223',
      siteAddress: 'Plot 42, 3rd Avenue, Injambakkam, ECR',
      city: 'Chennai',
      contractType: 'with_material',
      estimatedLaborDays: 24,
      plannedWorkersCount: 3,
      materialBudget: 65000,
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
      contractType: 'with_material',
      estimatedLaborDays: 14,
      plannedWorkersCount: 2,
      materialBudget: 28000,
      status: 'ongoing',
      startDate: '2026-10-08',
      expectedCompletionDate: '2026-10-25',
      contractAmount: 75000,
      totalReceived: 35000,
      pendingBalance: 40000, // 75000 - 35000
      totalExpenses: 21500,
      profitOrMargin: 13500,
      assignedElectricians: ['Ravi', 'Kuppusamy'],
      description: 'Commercial showroom aesthetic track light installation, display counter spotlights, 63A TP MCB DB setup, and 10kVA stabilizer connection.',
      progressPercentage: 55,
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
      contractType: 'labor_only',
      estimatedLaborDays: 20,
      plannedWorkersCount: 2,
      materialBudget: 0,
      status: 'completed',
      startDate: '2026-09-15',
      expectedCompletionDate: '2026-09-28',
      contractAmount: 120000,
      totalReceived: 120000,
      pendingBalance: 0,
      totalExpenses: 68000,
      profitOrMargin: 52000,
      assignedElectricians: ['Murugan (Lead)', 'Ravi'],
      description: 'Dual UPS power bus duct connection, server rack PDU sockets, surge protection device (SPD) installation, and phase load balancing (Labor Only contract - Client provided bus duct materials).',
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

  // Realistic seed employees (Electricians, Wiremen, Helpers)
  private initialEmployees: ElectricianEmployee[] = [
    {
      id: 'emp-1',
      name: 'Murugan S.',
      phone: '+91 98841 23456',
      role: 'Lead Master Electrician',
      dailyWage: 1200,
      status: 'active',
      joiningDate: '2024-02-15',
      upiId: 'murugan.elec@okaxis',
      specialty: '3-Phase DB Dressing & Inverter/Solar Sync',
      totalDaysWorked: 18,
      totalWagesEarned: 21600,
      totalWagesPaid: 15000,
      pendingWageBalance: 6600
    },
    {
      id: 'emp-2',
      name: 'Suresh Kumar',
      phone: '+91 97910 88765',
      role: 'Senior Wireman',
      dailyWage: 950,
      status: 'active',
      joiningDate: '2024-05-10',
      upiId: 'sureshwireman@ybl',
      specialty: 'Concealed Conduit & Profile Lighting Grooves',
      totalDaysWorked: 16,
      totalWagesEarned: 15200,
      totalWagesPaid: 12000,
      pendingWageBalance: 3200
    },
    {
      id: 'emp-3',
      name: 'Ravi Shankar',
      phone: '+91 94445 11982',
      role: 'DB & Switchgear Specialist',
      dailyWage: 1000,
      status: 'active',
      joiningDate: '2024-08-01',
      upiId: 'ravi.tech@oksbi',
      specialty: 'Commercial Track Lights & Industrial Starters',
      totalDaysWorked: 12,
      totalWagesEarned: 12000,
      totalWagesPaid: 10000,
      pendingWageBalance: 2000
    },
    {
      id: 'emp-4',
      name: 'Kuppusamy M.',
      phone: '+91 90031 44552',
      role: 'Junior Electrician',
      dailyWage: 800,
      status: 'active',
      joiningDate: '2025-01-12',
      upiId: 'kuppu.elec@icici',
      specialty: 'Modular Switch Plate Mounting & Megger Earthing',
      totalDaysWorked: 14,
      totalWagesEarned: 11200,
      totalWagesPaid: 9000,
      pendingWageBalance: 2200
    },
    {
      id: 'emp-5',
      name: 'Vignesh P.',
      phone: '+91 91762 33441',
      role: 'Chipping & Conduit Helper',
      dailyWage: 650,
      status: 'active',
      joiningDate: '2025-03-20',
      upiId: 'vigneshhelper@paytm',
      specialty: 'Wall Grooving Chipping, Pipe Laying & Wire Pulling',
      totalDaysWorked: 15,
      totalWagesEarned: 9750,
      totalWagesPaid: 7500,
      pendingWageBalance: 2250
    }
  ];

  // Pre-scheduled Daily Work Allocations (Roster)
  private initialAllocations: SiteWorkAllocation[] = [
    {
      id: 'alloc-1',
      siteId: 'site-101',
      siteName: 'Green Meadows Luxury Villa - 3BHK Wiring',
      clientName: 'Dr. S. Sundararajan',
      clientPhone: '+91 98840 11223',
      siteAddress: 'Plot 42, 3rd Avenue, Injambakkam, ECR',
      date: new Date().toISOString().split('T')[0], // Today
      taskDescription: '1st Floor Master Bedroom DB wiring & AC 4.0 sq.mm cable pulling',
      shift: 'full_day',
      assignedEmployeeId: 'emp-1',
      assignedEmployeeName: 'Murugan S.',
      employeeDailyWage: 1200,
      wageMultiplier: 1.0,
      calculatedWage: 1200,
      status: 'in_progress',
      createdAt: '2026-10-18T10:00:00Z',
      notes: 'Ensure proper phase load balancing on Legrand 8-way TPN DB'
    },
    {
      id: 'alloc-2',
      siteId: 'site-101',
      siteName: 'Green Meadows Luxury Villa - 3BHK Wiring',
      clientName: 'Dr. S. Sundararajan',
      clientPhone: '+91 98840 11223',
      siteAddress: 'Plot 42, 3rd Avenue, Injambakkam, ECR',
      date: new Date().toISOString().split('T')[0], // Today
      taskDescription: 'Living Room concealed aluminum profile light groove wiring & driver installation',
      shift: 'full_day',
      assignedEmployeeId: 'emp-2',
      assignedEmployeeName: 'Suresh Kumar',
      employeeDailyWage: 950,
      wageMultiplier: 1.0,
      calculatedWage: 950,
      status: 'in_progress',
      createdAt: '2026-10-18T10:00:00Z'
    },
    {
      id: 'alloc-3',
      siteId: 'site-101',
      siteName: 'Green Meadows Luxury Villa - 3BHK Wiring',
      clientName: 'Dr. S. Sundararajan',
      clientPhone: '+91 98840 11223',
      siteAddress: 'Plot 42, 3rd Avenue, Injambakkam, ECR',
      date: new Date().toISOString().split('T')[0], // Today
      taskDescription: 'Wall chipping for staircase 2-way switch conduit & kitchen chimney 16A point',
      shift: 'full_day',
      assignedEmployeeId: 'emp-5',
      assignedEmployeeName: 'Vignesh P.',
      employeeDailyWage: 650,
      wageMultiplier: 1.0,
      calculatedWage: 650,
      status: 'scheduled',
      createdAt: '2026-10-18T10:00:00Z'
    },
    {
      id: 'alloc-4',
      siteId: 'site-102',
      siteName: 'Trends Boutique & Showroom - Track Lighting & DB Upgrade',
      clientName: 'Mrs. Jayashree Kumar',
      clientPhone: '+91 94443 77889',
      siteAddress: 'Shop 14, Usman Road, T. Nagar',
      date: new Date().toISOString().split('T')[0], // Today
      taskDescription: 'Ceiling track rail alignment and 20W COB warm-white spotlight aiming',
      shift: 'full_day',
      assignedEmployeeId: 'emp-3',
      assignedEmployeeName: 'Ravi Shankar',
      employeeDailyWage: 1000,
      wageMultiplier: 1.0,
      calculatedWage: 1000,
      status: 'scheduled',
      createdAt: '2026-10-19T09:00:00Z'
    },
    {
      id: 'alloc-5',
      siteId: 'site-101',
      siteName: 'Green Meadows Luxury Villa - 3BHK Wiring',
      clientName: 'Dr. S. Sundararajan',
      clientPhone: '+91 98840 11223',
      siteAddress: 'Plot 42, 3rd Avenue, Injambakkam, ECR',
      date: getTomorrowDateString(), // Tomorrow
      taskDescription: 'Terrace solar inverter dual-source changeover switchboard installation & copper earthing test',
      shift: 'full_day',
      assignedEmployeeId: 'emp-1',
      assignedEmployeeName: 'Murugan S.',
      employeeDailyWage: 1200,
      wageMultiplier: 1.0,
      calculatedWage: 1200,
      status: 'scheduled',
      createdAt: '2026-10-19T11:00:00Z'
    },
    {
      id: 'alloc-6',
      siteId: 'site-102',
      siteName: 'Trends Boutique & Showroom - Track Lighting & DB Upgrade',
      clientName: 'Mrs. Jayashree Kumar',
      clientPhone: '+91 94443 77889',
      siteAddress: 'Shop 14, Usman Road, T. Nagar',
      date: getTomorrowDateString(), // Tomorrow
      taskDescription: 'Cash counter 1.5kVA UPS socket wiring & 40A 4-Pole MCB line hookup',
      shift: 'full_day',
      assignedEmployeeId: 'emp-4',
      assignedEmployeeName: 'Kuppusamy M.',
      employeeDailyWage: 800,
      wageMultiplier: 1.0,
      calculatedWage: 800,
      status: 'scheduled',
      createdAt: '2026-10-19T11:00:00Z'
    }
  ];

  // Wage payouts history
  private initialPayouts: WorkerWagePayout[] = [
    {
      id: 'payw-1',
      employeeId: 'emp-1',
      employeeName: 'Murugan S.',
      date: '2026-10-15',
      amount: 15000,
      paymentMode: 'gpay_upi',
      notes: 'Bi-weekly labor wage settlement',
      receiptRef: 'UPI-WAGE-98421'
    },
    {
      id: 'payw-2',
      employeeId: 'emp-2',
      employeeName: 'Suresh Kumar',
      date: '2026-10-15',
      amount: 12000,
      paymentMode: 'cash',
      notes: 'Cash wage disbursement at ECR site office',
      receiptRef: 'CASH-REC-102'
    }
  ];

  private sitesSubject = new BehaviorSubject<SiteProject[]>([]);
  public sites$: Observable<SiteProject[]> = this.sitesSubject.asObservable();

  private employeesSubject = new BehaviorSubject<ElectricianEmployee[]>([]);
  public employees$: Observable<ElectricianEmployee[]> = this.employeesSubject.asObservable();

  private allocationsSubject = new BehaviorSubject<SiteWorkAllocation[]>([]);
  public allocations$: Observable<SiteWorkAllocation[]> = this.allocationsSubject.asObservable();

  private payoutsSubject = new BehaviorSubject<WorkerWagePayout[]>([]);
  public payouts$: Observable<WorkerWagePayout[]> = this.payoutsSubject.asObservable();

  constructor() {
    this.loadSites();
    this.loadEmployees();
    this.loadAllocations();
    this.loadPayouts();
  }

  // --- Sites Management ---
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
      contractType: siteData.contractType || 'with_material',
      estimatedLaborDays: Number(siteData.estimatedLaborDays || 15),
      plannedWorkersCount: Number(siteData.plannedWorkersCount || 2),
      materialBudget: Number(siteData.materialBudget || 0),
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

  // --- Employees & Workforce Management ---
  private loadEmployees(): void {
    const saved = localStorage.getItem(this.EMPLOYEES_STORAGE_KEY);
    if (saved) {
      try {
        this.employeesSubject.next(JSON.parse(saved));
        this.recalculateAllEmployeesWages();
        return;
      } catch (e) {
        console.error('Failed to parse saved employees:', e);
      }
    }
    this.saveEmployees(this.initialEmployees);
  }

  private saveEmployees(emps: ElectricianEmployee[]): void {
    localStorage.setItem(this.EMPLOYEES_STORAGE_KEY, JSON.stringify(emps));
    this.employeesSubject.next(emps);
  }

  getEmployees(): ElectricianEmployee[] {
    return this.employeesSubject.getValue();
  }

  getEmployeeById(id: string): ElectricianEmployee | undefined {
    return this.employeesSubject.getValue().find(e => e.id === id);
  }

  addEmployee(empData: Omit<ElectricianEmployee, 'id'>): ElectricianEmployee {
    const newEmp: ElectricianEmployee = {
      ...empData,
      id: 'emp-' + Date.now(),
      dailyWage: Number(empData.dailyWage),
      totalDaysWorked: 0,
      totalWagesEarned: 0,
      totalWagesPaid: 0,
      pendingWageBalance: 0
    };
    const updated = [...this.employeesSubject.getValue(), newEmp];
    this.saveEmployees(updated);
    return newEmp;
  }

  updateEmployee(id: string, updates: Partial<ElectricianEmployee>): void {
    const updated = this.employeesSubject.getValue().map(emp => {
      if (emp.id === id) {
        return { ...emp, ...updates };
      }
      return emp;
    });
    this.saveEmployees(updated);
    this.recalculateAllEmployeesWages();
  }

  deleteEmployee(id: string): void {
    const updated = this.employeesSubject.getValue().filter(e => e.id !== id);
    this.saveEmployees(updated);
  }

  toggleEmployeeStatus(id: string): void {
    const emp = this.getEmployeeById(id);
    if (!emp) return;
    const newStatus = emp.status === 'active' ? 'on_leave' : 'active';
    this.updateEmployee(id, { status: newStatus });
  }

  // Recalculates earned wages and balance from completed allocations and payouts
  recalculateAllEmployeesWages(): void {
    const allocations = this.allocationsSubject.getValue();
    const payouts = this.payoutsSubject.getValue();
    const emps = this.employeesSubject.getValue();

    const updated = emps.map(emp => {
      // Completed allocations
      const workerAllocations = allocations.filter(
        a => a.assignedEmployeeId === emp.id && (a.status === 'completed' || a.status === 'in_progress')
      );
      const totalDaysWorked = workerAllocations.length;
      const totalWagesEarned = workerAllocations.reduce((sum, a) => sum + (a.calculatedWage || 0), 0);

      // Payouts
      const workerPayouts = payouts.filter(p => p.employeeId === emp.id);
      const totalWagesPaid = workerPayouts.reduce((sum, p) => sum + p.amount, 0);

      const pendingWageBalance = Math.max(0, totalWagesEarned - totalWagesPaid);

      return {
        ...emp,
        totalDaysWorked,
        totalWagesEarned,
        totalWagesPaid,
        pendingWageBalance
      };
    });

    localStorage.setItem(this.EMPLOYEES_STORAGE_KEY, JSON.stringify(updated));
    this.employeesSubject.next(updated);
  }

  // --- Work Allocation & Daily Duty Roster ---
  private loadAllocations(): void {
    const saved = localStorage.getItem(this.ALLOCATIONS_STORAGE_KEY);
    if (saved) {
      try {
        this.allocationsSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved allocations:', e);
      }
    }
    this.saveAllocations(this.initialAllocations);
  }

  private saveAllocations(allocations: SiteWorkAllocation[]): void {
    localStorage.setItem(this.ALLOCATIONS_STORAGE_KEY, JSON.stringify(allocations));
    this.allocationsSubject.next(allocations);
    this.recalculateAllEmployeesWages();
  }

  getAllocations(): SiteWorkAllocation[] {
    return this.allocationsSubject.getValue();
  }

  getAllocationsForDate(date: string): SiteWorkAllocation[] {
    return this.allocationsSubject.getValue().filter(a => a.date === date);
  }

  createAllocation(data: {
    siteId: string;
    date: string;
    taskDescription: string;
    shift: ShiftType;
    assignedEmployeeId: string;
    notes?: string;
  }): SiteWorkAllocation {
    const site = this.getSiteById(data.siteId);
    const employee = this.getEmployeeById(data.assignedEmployeeId);

    const wageMultiplier = data.shift === 'half_day' ? 0.5 : (data.shift === 'night_shift' || data.shift === 'overtime' ? 1.5 : 1.0);
    const dailyWage = employee ? employee.dailyWage : 800;
    const calculatedWage = Math.round(dailyWage * wageMultiplier);

    const newAllocation: SiteWorkAllocation = {
      id: 'alloc-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      siteId: data.siteId,
      siteName: site ? site.siteName : 'Electrical Site',
      clientName: site ? site.clientName : '',
      clientPhone: site ? site.clientPhone : '',
      siteAddress: site ? site.siteAddress : '',
      date: data.date,
      taskDescription: data.taskDescription,
      shift: data.shift,
      assignedEmployeeId: data.assignedEmployeeId,
      assignedEmployeeName: employee ? employee.name : 'Unassigned',
      employeeDailyWage: dailyWage,
      wageMultiplier,
      calculatedWage,
      status: 'scheduled',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    const updated = [newAllocation, ...this.allocationsSubject.getValue()];
    this.saveAllocations(updated);

    // Also link worker name to site's assignedElectricians if not already there
    if (site && employee && !site.assignedElectricians.includes(employee.name)) {
      this.assignWorkers(site.id, [...site.assignedElectricians, employee.name]);
    }

    return newAllocation;
  }

  // Quick 1-click Re-assign when worker is absent or missing
  reassignWorker(allocationId: string, newEmployeeId: string, reason: string): void {
    const newEmployee = this.getEmployeeById(newEmployeeId);
    if (!newEmployee) return;

    const updated = this.allocationsSubject.getValue().map(alloc => {
      if (alloc.id === allocationId) {
        const oldId = alloc.assignedEmployeeId;
        const oldName = alloc.assignedEmployeeName;
        const wageMultiplier = alloc.wageMultiplier || 1.0;
        const calculatedWage = Math.round(newEmployee.dailyWage * wageMultiplier);

        return {
          ...alloc,
          assignedEmployeeId: newEmployee.id,
          assignedEmployeeName: newEmployee.name,
          employeeDailyWage: newEmployee.dailyWage,
          calculatedWage,
          reassignedFromId: oldId,
          reassignedFromName: oldName,
          reassignedReason: reason || 'Technician unavailable / Reassigned by contractor',
          status: 'scheduled' as AllocationStatus
        };
      }
      return alloc;
    });

    this.saveAllocations(updated);
  }

  // Reschedule site work date (e.g. if site postponed or rain delayed)
  rescheduleDate(allocationId: string, newDate: string, reason?: string): void {
    const updated = this.allocationsSubject.getValue().map(alloc => {
      if (alloc.id === allocationId) {
        return {
          ...alloc,
          date: newDate,
          notes: (alloc.notes ? alloc.notes + ' | ' : '') + `Rescheduled from ${alloc.date} to ${newDate}${reason ? ': ' + reason : ''}`
        };
      }
      return alloc;
    });
    this.saveAllocations(updated);
  }

  updateAllocationStatus(allocationId: string, status: AllocationStatus): void {
    const updated = this.allocationsSubject.getValue().map(alloc => {
      if (alloc.id === allocationId) {
        const completedAt = status === 'completed' ? new Date().toISOString() : alloc.completedAt;
        return { ...alloc, status, completedAt };
      }
      return alloc;
    });
    this.saveAllocations(updated);

    // If marked completed, add to site daily log automatically if not exists
    const completedItem = updated.find(a => a.id === allocationId);
    if (completedItem && status === 'completed') {
      this.addDailyLog(completedItem.siteId, {
        date: completedItem.date,
        workerName: completedItem.assignedEmployeeName,
        workDescription: completedItem.taskDescription,
        wageAmount: completedItem.calculatedWage
      });

      // Also record labor wage as site expense if not already present
      this.addExpense(completedItem.siteId, {
        date: completedItem.date,
        title: `Labor Wage - ${completedItem.assignedEmployeeName} (${completedItem.shift})`,
        category: 'labor',
        amount: completedItem.calculatedWage,
        notes: completedItem.taskDescription,
        recordedBy: 'Duty Roster Automation'
      });
    }
  }

  // Carry-Forward incomplete task to next working day (User Audio Feature)
  carryForwardTask(allocationId: string, nextDate: string, reason: string): SiteWorkAllocation | null {
    const existing = this.allocationsSubject.getValue().find(a => a.id === allocationId);
    if (!existing) return null;

    // 1. Mark existing allocation as carried forward
    this.updateAllocationStatus(allocationId, 'carried_forward');
    const updatedWithReason = this.allocationsSubject.getValue().map(alloc => {
      if (alloc.id === allocationId) {
        return {
          ...alloc,
          status: 'carried_forward' as AllocationStatus,
          carryForwardToDate: nextDate,
          incompleteReason: reason || 'Work unfinished on scheduled date / Carried forward'
        };
      }
      return alloc;
    });
    this.saveAllocations(updatedWithReason);

    // 2. Spawn new allocation on the next working date with carried forward badge
    const newAllocation: SiteWorkAllocation = {
      id: 'alloc-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      siteId: existing.siteId,
      siteName: existing.siteName,
      clientName: existing.clientName,
      clientPhone: existing.clientPhone,
      siteAddress: existing.siteAddress,
      date: nextDate,
      dayNumber: existing.dayNumber,
      taskDescription: `[REMAINING / நிலுவை] ` + existing.taskDescription,
      shift: existing.shift,
      assignedEmployeeId: existing.assignedEmployeeId,
      assignedEmployeeName: existing.assignedEmployeeName,
      employeeDailyWage: existing.employeeDailyWage,
      wageMultiplier: existing.wageMultiplier,
      calculatedWage: existing.calculatedWage,
      status: 'scheduled',
      isCarriedForward: true,
      carriedFromDate: existing.date,
      incompleteReason: reason,
      notes: `Carried forward from ${existing.date} due to: ${reason || 'Incomplete previous work'}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newAllocation, ...this.allocationsSubject.getValue()];
    this.saveAllocations(updated);
    return newAllocation;
  }

  // Complete task with optional Overtime / Extra Work bonus calculation
  completeTaskWithOvertime(allocationId: string, overtimeHours: number = 0, notes?: string): void {
    const alloc = this.allocationsSubject.getValue().find(a => a.id === allocationId);
    if (!alloc) return;

    let totalWage = alloc.calculatedWage;
    let extraNotes = notes || '';

    if (overtimeHours > 0) {
      // Overtime rate: (dailyWage / 8 hours) * overtimeHours * 1.5 multiplier
      const hourlyRate = (alloc.employeeDailyWage || 800) / 8;
      const overtimePay = Math.round(hourlyRate * overtimeHours * 1.5);
      totalWage += overtimePay;
      extraNotes += ` [Includes ${overtimeHours} hrs Overtime bonus: +₹${overtimePay}]`;
    }

    const updated = this.allocationsSubject.getValue().map(item => {
      if (item.id === allocationId) {
        return {
          ...item,
          status: 'completed' as AllocationStatus,
          isOvertime: overtimeHours > 0,
          overtimeHours: overtimeHours,
          calculatedWage: totalWage,
          notes: extraNotes.trim(),
          completedAt: new Date().toISOString()
        };
      }
      return item;
    });

    this.saveAllocations(updated);

    // Sync into Site Daily Log
    this.addDailyLog(alloc.siteId, {
      date: alloc.date,
      workerName: alloc.assignedEmployeeName,
      workDescription: alloc.taskDescription + (overtimeHours > 0 ? ` (+${overtimeHours}h OT)` : ''),
      wageAmount: totalWage
    });

    // Sync into Site Expenses
    this.addExpense(alloc.siteId, {
      date: alloc.date,
      title: `Labor Wage - ${alloc.assignedEmployeeName} (${alloc.shift}${overtimeHours > 0 ? ` +${overtimeHours}h OT` : ''})`,
      category: 'labor',
      amount: totalWage,
      notes: alloc.taskDescription,
      recordedBy: 'Duty Roster Automation'
    });
  }

  // Pre-define Day-by-Day site project schedule (Audio Feature)
  // Given site start date, pre-populates day 1, day 2, day 3... skipping Sundays!
  autoGenerateDayByDaySchedule(siteId: string, options?: { workType?: string; preferredWorkerIds?: string[] }): SiteWorkAllocation[] {
    const site = this.getSiteById(siteId);
    if (!site) return [];

    const workers = this.getEmployees().filter(e => e.status === 'active');
    if (workers.length === 0) return [];

    const defaultDayMilestones = [
      { day: 1, desc: 'Wall marking, laser levels & electrical conduit path chalking', role: 'Lead Master Electrician' },
      { day: 2, desc: 'Chipping & grooving brick walls for heavy-duty 25mm PVC conduits', role: 'Chipping & Conduit Helper' },
      { day: 3, desc: 'Mounting metal concealed junction boxes & DB enclosure fixing', role: 'Senior Wireman' },
      { day: 4, desc: 'Conduit pipe laying, cement bonding & drop box clearing', role: 'Chipping & Conduit Helper' },
      { day: 5, desc: 'Finolex 2.5mm power circuits & 1.5mm lighting wire pulling', role: 'Senior Wireman' },
      { day: 6, desc: 'Concealed profile lighting channel groove fixing & driver wiring', role: 'Senior Wireman' },
      { day: 7, desc: 'Main Distribution Board (DB) neutral busbar dressing & MCB sorting', role: 'Lead Master Electrician' },
      { day: 8, desc: 'Modular switch plates, 6A/16A sockets & fan regulator assembly', role: 'Senior Wireman' },
      { day: 9, desc: 'Copper strip earthing pit salt compound dumping & megger bonding test', role: 'Junior Electrician' },
      { day: 10, desc: 'Inverter / Solar changeover switchboard installation & load testing', role: 'Lead Master Electrician' },
      { day: 11, desc: 'Decorative wall sconces, spotlights & final quality signoff with client', role: 'Senior Wireman' }
    ];

    const generated: SiteWorkAllocation[] = [];
    const startDate = new Date(site.startDate || new Date().toISOString().split('T')[0]);
    let currentDate = new Date(startDate);
    let dayCount = 1;

    for (const milestone of defaultDayMilestones) {
      // If current day is Sunday (0), skip Sunday as holiday
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const dateStr = currentDate.toISOString().split('T')[0];

      // Pick suitable worker
      let worker = workers.find(w => w.role.includes(milestone.role.split(' ')[0])) || workers[dayCount % workers.length];
      const dailyWage = worker.dailyWage || 900;

      const alloc: SiteWorkAllocation = {
        id: 'alloc-' + Date.now() + '-' + dayCount + '-' + Math.floor(Math.random() * 100),
        siteId: site.id,
        siteName: site.siteName,
        clientName: site.clientName,
        clientPhone: site.clientPhone,
        siteAddress: site.siteAddress,
        date: dateStr,
        dayNumber: dayCount,
        taskDescription: `[Day ${dayCount}] ` + milestone.desc,
        shift: 'full_day',
        assignedEmployeeId: worker.id,
        assignedEmployeeName: worker.name,
        employeeDailyWage: dailyWage,
        wageMultiplier: 1.0,
        calculatedWage: dailyWage,
        status: 'scheduled',
        notes: `Pre-defined project timeline for ${site.siteName}`,
        createdAt: new Date().toISOString()
      };

      generated.push(alloc);

      // Increment day for next milestone
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }

    const currentAllocations = this.allocationsSubject.getValue();
    this.saveAllocations([...generated, ...currentAllocations]);

    // Also link worker names to site assigned list
    const workerNames = Array.from(new Set(generated.map(g => g.assignedEmployeeName)));
    this.assignWorkers(site.id, Array.from(new Set([...site.assignedElectricians, ...workerNames])));

    return generated;
  }

  // Get tasks requiring immediate contractor attention (overdue, incomplete, or carried forward)
  getPendingAttentionTasks(): {
    overdue: SiteWorkAllocation[];
    incomplete: SiteWorkAllocation[];
    carriedForward: SiteWorkAllocation[];
  } {
    const today = new Date().toISOString().split('T')[0];
    const all = this.allocationsSubject.getValue();

    const overdue = all.filter(a => a.date < today && (a.status === 'scheduled' || a.status === 'in_progress'));
    const incomplete = all.filter(a => a.status === 'incomplete');
    const carriedForward = all.filter(a => a.isCarriedForward && a.status !== 'completed');

    return { overdue, incomplete, carriedForward };
  }

  deleteAllocation(id: string): void {
    const updated = this.allocationsSubject.getValue().filter(a => a.id !== id);
    this.saveAllocations(updated);
  }


  // --- Wage Payouts Management ---
  private loadPayouts(): void {
    const saved = localStorage.getItem(this.PAYOUTS_STORAGE_KEY);
    if (saved) {
      try {
        this.payoutsSubject.next(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved payouts:', e);
      }
    }
    this.savePayouts(this.initialPayouts);
  }

  private savePayouts(payouts: WorkerWagePayout[]): void {
    localStorage.setItem(this.PAYOUTS_STORAGE_KEY, JSON.stringify(payouts));
    this.payoutsSubject.next(payouts);
    this.recalculateAllEmployeesWages();
  }

  getPayouts(): WorkerWagePayout[] {
    return this.payoutsSubject.getValue();
  }

  recordWagePayout(data: {
    employeeId: string;
    amount: number;
    paymentMode: 'cash' | 'gpay_upi' | 'bank_transfer';
    notes?: string;
    date?: string;
  }): WorkerWagePayout {
    const employee = this.getEmployeeById(data.employeeId);
    const newPayout: WorkerWagePayout = {
      id: 'payw-' + Date.now(),
      employeeId: data.employeeId,
      employeeName: employee ? employee.name : 'Electrician',
      date: data.date || new Date().toISOString().split('T')[0],
      amount: Number(data.amount),
      paymentMode: data.paymentMode,
      notes: data.notes || 'Weekly / Milestone Wage Payout',
      receiptRef: 'WAGE-' + Math.floor(1000 + Math.random() * 9000)
    };

    const updated = [newPayout, ...this.payoutsSubject.getValue()];
    this.savePayouts(updated);
    return newPayout;
  }

  // --- Financial & Site Profit Calculations ---
  getSiteProfitReport(siteId: string): SiteProfitReport | null {
    const site = this.getSiteById(siteId);
    if (!site) return null;

    const contractAmount = site.contractAmount || 0;
    const totalReceived = site.totalReceived || 0;
    const pendingFromClient = Math.max(0, contractAmount - totalReceived);

    const materialExpenses = site.expenses
      .filter(e => e.category === 'material' || e.category === 'tools')
      .reduce((sum, e) => sum + e.amount, 0);

    const laborWages = site.expenses
      .filter(e => e.category === 'labor')
      .reduce((sum, e) => sum + e.amount, 0);

    const otherExpenses = site.expenses
      .filter(e => e.category === 'travel_food' || e.category === 'other')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = materialExpenses + laborWages + otherExpenses;
    const netProfit = totalReceived - totalExpenses;
    const profitMarginPercent = totalReceived > 0 ? Math.round((netProfit / totalReceived) * 100) : 0;
    const actualLaborDaysWorked = site.dailyLogs.length || 
      this.allocationsSubject.getValue().filter(a => a.siteId === siteId && a.status === 'completed').length;

    return {
      siteId: site.id,
      siteName: site.siteName,
      clientName: site.clientName,
      contractType: site.contractType || 'with_material',
      contractAmount,
      totalReceived,
      pendingFromClient,
      materialExpenses,
      laborWages,
      otherExpenses,
      totalExpenses,
      netProfit,
      profitMarginPercent,
      estimatedLaborDays: site.estimatedLaborDays || 0,
      actualLaborDaysWorked
    };

  }

  getAllSitesProfitReports(): SiteProfitReport[] {
    const sites = this.sitesSubject.getValue();
    return sites.map(s => this.getSiteProfitReport(s.id)!).filter(Boolean);
  }

  // WhatsApp Roster Broadcaster generator
  generateWhatsAppRosterText(date: string): string {
    const allocations = this.getAllocationsForDate(date);
    if (allocations.length === 0) {
      return `⚡ *ELECTRICAL VIBERS - DAILY DUTY ROSTER*\n📅 Date: ${date}\n\nNo site duties scheduled for this date.`;
    }

    let text = `⚡ *ELECTRICAL VIBERS - DAILY DUTY ROSTER*\n📅 Date: ${date}\n\n`;
    text += `அனைத்து எலக்ட்ரீஷியன்களும் கீழே கொடுக்கப்பட்டுள்ள சைட் மற்றும் வேலைகளுக்கு குறித்த நேரத்தில் செல்லவும்:\n\n`;

    allocations.forEach((alloc, index) => {
      text += `*${index + 1}. ${alloc.assignedEmployeeName.toUpperCase()}*\n`;
      text += `📍 *Site:* ${alloc.siteName}\n`;
      text += `🏢 *Address:* ${alloc.siteAddress}\n`;
      text += `📞 *Client:* ${alloc.clientName} (${alloc.clientPhone})\n`;
      text += `🔧 *Task:* ${alloc.taskDescription}\n`;
      text += `⏰ *Shift:* ${alloc.shift === 'full_day' ? 'Full Day (9 AM - 6 PM)' : alloc.shift === 'half_day' ? 'Half Day' : 'Night Shift / Overtime'}\n`;
      text += `------------------------------------\n`;
    });

    text += `\nசந்தேகங்களுக்கு உடனே அட்மினை தொடர்பு கொள்ளவும். Best of Luck Team! ⚡`;
    return text;
  }

  // Aggregate stats across all sites for admin dashboard
  getOverallStats() {
    const sites = this.sitesSubject.getValue();
    const ongoingSites = sites.filter(s => s.status === 'ongoing');
    const totalContractValue = sites.reduce((sum, s) => sum + s.contractAmount, 0);
    const totalCollected = sites.reduce((sum, s) => sum + s.totalReceived, 0);
    const totalPending = sites.reduce((sum, s) => sum + s.pendingBalance, 0);
    const totalExpenses = sites.reduce((sum, s) => sum + s.totalExpenses, 0);

    const employees = this.employeesSubject.getValue();
    const totalWagesPending = employees.reduce((sum, e) => sum + (e.pendingWageBalance || 0), 0);

    return {
      totalSites: sites.length,
      ongoingSitesCount: ongoingSites.length,
      totalContractValue,
      totalCollected,
      totalPending,
      totalExpenses,
      netProfit: totalCollected - totalExpenses,
      totalTechnicians: employees.length,
      totalWagesPending
    };
  }
}

function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
