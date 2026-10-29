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
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  private readonly STORAGE_KEY = 'electrical_vibers_sites_v2';
  private readonly EMPLOYEES_STORAGE_KEY = 'electrical_vibers_employees_v2';
  private readonly ALLOCATIONS_STORAGE_KEY = 'electrical_vibers_allocations_v2';
  private readonly PAYOUTS_STORAGE_KEY = 'electrical_vibers_wage_payouts_v2';

  private sitesSubject = new BehaviorSubject<SiteProject[]>([]);
  public sites$: Observable<SiteProject[]> = this.sitesSubject.asObservable();

  private employeesSubject = new BehaviorSubject<ElectricianEmployee[]>([]);
  public employees$: Observable<ElectricianEmployee[]> = this.employeesSubject.asObservable();

  private allocationsSubject = new BehaviorSubject<SiteWorkAllocation[]>([]);
  public allocations$: Observable<SiteWorkAllocation[]> = this.allocationsSubject.asObservable();

  private payoutsSubject = new BehaviorSubject<WorkerWagePayout[]>([]);
  public payouts$: Observable<WorkerWagePayout[]> = this.payoutsSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.purgeLegacyDummyData();
    this.loadSites();
    this.loadEmployees();
    this.loadAllocations();
    this.loadPayouts();
    this.initCloudSync();
  }

  
  private isDummySite(s: any): boolean {
    if (!s) return false;
    const dummyIds = ['site-101', 'site-102', 'site-103'];
    return dummyIds.includes(s.id) ||
      (s.siteName && s.siteName.includes('Green Meadows')) ||
      (s.clientName && s.clientName.includes('Sundararajan'));
  }

  private isDummyEmployee(e: any): boolean {
    if (!e) return false;
    const dummyIds = ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6'];
    const dummyNames = ['Murugan S.', 'Suresh Kumar', 'Vignesh P.', 'Karthikeyan M.', 'Manikandan R.', 'Senthil Nathan'];
    return dummyIds.includes(e.id) && dummyNames.includes(e.fullName);
  }

  private isDummyAllocation(a: any): boolean {
    if (!a) return false;
    const dummyIds = ['alloc-1', 'alloc-2', 'alloc-3', 'alloc-4', 'alloc-5', 'alloc-6', 'alloc-7', 'alloc-8'];
    return dummyIds.includes(a.id) ||
      a.siteId === 'site-101' ||
      (a.siteName && a.siteName.includes('Green Meadows')) ||
      (a.clientName && a.clientName.includes('Sundararajan'));
  }

  private isDummyPayout(p: any): boolean {
    if (!p) return false;
    const dummyIds = ['pay-1', 'pay-2', 'pay-3'];
    return dummyIds.includes(p.id) ||
      (p.employeeName && (p.employeeName.includes('Murugan') || p.employeeName.includes('Suresh')));
  }

  private purgeLegacyDummyData(): void {
    const legacyKeys = [
      'voltmaster_sites_v1',
      'voltmaster_employees_v1',
      'voltmaster_allocations_v1',
      'voltmaster_wage_payouts_v1'
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const dummyAllocIds = ['alloc-1', 'alloc-2', 'alloc-3', 'alloc-4', 'alloc-5', 'alloc-6', 'alloc-7', 'alloc-8'];
    dummyAllocIds.forEach(id => {
      this.firebaseService.deleteDocument('allocations', id).catch(() => {});
    });

    const dummySiteIds = ['site-101', 'site-102', 'site-103'];
    dummySiteIds.forEach(id => {
      this.firebaseService.deleteDocument('sites', id).catch(() => {});
    });

    const dummyEmpIds = ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6'];
    dummyEmpIds.forEach(id => {
      this.firebaseService.deleteDocument('employees', id).catch(() => {});
    });

    const dummyPayoutIds = ['pay-1', 'pay-2', 'pay-3'];
    dummyPayoutIds.forEach(id => {
      this.firebaseService.deleteDocument('wage_payouts', id).catch(() => {});
    });
  }

  private initCloudSync(): void {
    // 1. Sites sync
    this.firebaseService.listenToCollection<SiteProject>('sites', (remoteSites) => {
      if (remoteSites && remoteSites.length > 0) {
        const clean = remoteSites.filter(s => {
          if (this.isDummySite(s)) {
            this.firebaseService.deleteDocument('sites', s.id).catch(() => {});
            return false;
          }
          return true;
        });
        this.saveSites(clean, false);
      }
    });

    // 2. Employees sync
    this.firebaseService.listenToCollection<ElectricianEmployee>('employees', (remoteEmps) => {
      if (remoteEmps && remoteEmps.length > 0) {
        const clean = remoteEmps.filter(e => {
          if (this.isDummyEmployee(e)) {
            this.firebaseService.deleteDocument('employees', e.id).catch(() => {});
            return false;
          }
          return true;
        });
        this.saveEmployees(clean, false);
      }
    });

    // 3. Allocations sync
    this.firebaseService.listenToCollection<SiteWorkAllocation>('allocations', (remoteAllocations) => {
      if (remoteAllocations && remoteAllocations.length > 0) {
        const clean = remoteAllocations.filter(a => {
          if (this.isDummyAllocation(a)) {
            this.firebaseService.deleteDocument('allocations', a.id).catch(() => {});
            return false;
          }
          return true;
        });
        this.saveAllocations(clean, false);
      }
    });

    // 4. Wage Payouts sync
    this.firebaseService.listenToCollection<WorkerWagePayout>('wage_payouts', (remotePayouts) => {
      if (remotePayouts && remotePayouts.length > 0) {
        const clean = remotePayouts.filter(p => {
          if (this.isDummyPayout(p)) {
            this.firebaseService.deleteDocument('wage_payouts', p.id).catch(() => {});
            return false;
          }
          return true;
        });
        this.savePayouts(clean, false);
      }
    });
  }

  // --- Sites Management ---
  private loadSites(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SiteProject[]; const clean = Array.isArray(parsed) ? parsed.filter(s => !this.isDummySite(s)) : []; this.sitesSubject.next(clean);
        return;
      } catch (e) {
        console.error('Failed to parse saved sites:', e);
      }
    }
    this.saveSites([]);
  }

  private saveSites(sites: SiteProject[], syncCloud = true): void {
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
    this.firebaseService.setDocument('sites', newSite.id, newSite).catch(err => {
      console.warn('Could not save site to Firestore:', err);
    });
    return newSite;
  }

  updateSite(id: string, updates: Partial<SiteProject>): void {
    let modifiedSite: SiteProject | undefined;
    const updated = this.sitesSubject.getValue().map(site => {
      if (site.id === id) {
        const merged = { ...site, ...updates, updatedAt: new Date().toISOString() };
        merged.pendingBalance = Math.max(0, merged.contractAmount - merged.totalReceived);
        merged.profitOrMargin = merged.totalReceived - merged.totalExpenses;
        modifiedSite = merged;
        return merged;
      }
      return site;
    });
    this.saveSites(updated);

    if (modifiedSite) {
      this.firebaseService.setDocument('sites', id, modifiedSite).catch(err => {
        console.warn('Could not update site in Firestore:', err);
      });
    }
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
    this.firebaseService.deleteDocument('sites', siteId).catch(err => {
      console.warn('Could not delete site in Firestore:', err);
    });
  }

  // --- Employees & Workforce Management ---
  private loadEmployees(): void {
    const saved = localStorage.getItem(this.EMPLOYEES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ElectricianEmployee[]; const clean = Array.isArray(parsed) ? parsed.filter(e => !this.isDummyEmployee(e)) : []; this.employeesSubject.next(clean);
        this.recalculateAllEmployeesWages();
        return;
      } catch (e) {
        console.error('Failed to parse saved employees:', e);
      }
    }
    this.saveEmployees([]);
  }

  private saveEmployees(emps: ElectricianEmployee[], syncCloud = true): void {
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
    this.firebaseService.setDocument('employees', newEmp.id, newEmp).catch(err => {
      console.warn('Could not save employee to Firestore:', err);
    });
    return newEmp;
  }

  updateEmployee(id: string, updates: Partial<ElectricianEmployee>): void {
    let modifiedEmp: ElectricianEmployee | undefined;
    const updated = this.employeesSubject.getValue().map(emp => {
      if (emp.id === id) {
        const merged = { ...emp, ...updates };
        modifiedEmp = merged;
        return merged;
      }
      return emp;
    });
    this.saveEmployees(updated);
    this.recalculateAllEmployeesWages();

    if (modifiedEmp) {
      this.firebaseService.setDocument('employees', id, modifiedEmp).catch(err => {
        console.warn('Could not update employee in Firestore:', err);
      });
    }
  }

  deleteEmployee(id: string): void {
    const updated = this.employeesSubject.getValue().filter(e => e.id !== id);
    this.saveEmployees(updated);
    this.firebaseService.deleteDocument('employees', id).catch(err => {
      console.warn('Could not delete employee in Firestore:', err);
    });
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
        const parsed = JSON.parse(saved) as SiteWorkAllocation[]; const clean = Array.isArray(parsed) ? parsed.filter(a => !this.isDummyAllocation(a)) : []; this.allocationsSubject.next(clean);
        return;
      } catch (e) {
        console.error('Failed to parse saved allocations:', e);
      }
    }
    this.saveAllocations([]);
  }

  private saveAllocations(allocations: SiteWorkAllocation[], syncCloud = true): void {
    localStorage.setItem(this.ALLOCATIONS_STORAGE_KEY, JSON.stringify(allocations));
    this.allocationsSubject.next(allocations);
    this.recalculateAllEmployeesWages();

    if (syncCloud) {
      allocations.forEach(alloc => {
        this.firebaseService.setDocument('allocations', alloc.id, alloc).catch(() => {});
      });
    }
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
    this.firebaseService.deleteDocument('allocations', id).catch(err => {
      console.warn('Could not delete allocation from Firestore:', err);
    });
  }


  // --- Wage Payouts Management ---
  private loadPayouts(): void {
    const saved = localStorage.getItem(this.PAYOUTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WorkerWagePayout[]; const clean = Array.isArray(parsed) ? parsed.filter(p => !this.isDummyPayout(p)) : []; this.payoutsSubject.next(clean);
        return;
      } catch (e) {
        console.error('Failed to parse saved payouts:', e);
      }
    }
    this.savePayouts([]);
  }

  private savePayouts(payouts: WorkerWagePayout[], syncCloud = true): void {
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

    this.firebaseService.setDocument('wage_payouts', newPayout.id, newPayout).catch(err => {
      console.warn('Could not save wage payout to Firestore:', err);
    });

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
      return `*ELECTRICAL VIBERS - DAILY DUTY ROSTER*\nDate: ${date}\n\nNo site duties scheduled for this date.`;
    }

    let text = `*ELECTRICAL VIBERS - DAILY DUTY ROSTER*\nDate: ${date}\n\n`;
    text += `அனைத்து எலக்ட்ரீஷியன்களும் கீழே கொடுக்கப்பட்டுள்ள சைட் மற்றும் வேலைகளுக்கு குறித்த நேரத்தில் செல்லவும்:\n\n`;

    allocations.forEach((alloc, index) => {
      text += `*${index + 1}. ${alloc.assignedEmployeeName.toUpperCase()}*\n`;
      text += `*Site:* ${alloc.siteName}\n`;
      text += `*Address:* ${alloc.siteAddress}\n`;
      text += `*Client:* ${alloc.clientName} (${alloc.clientPhone})\n`;
      text += `*Task:* ${alloc.taskDescription}\n`;
      text += `*Shift:* ${alloc.shift === 'full_day' ? 'Full Day (9 AM - 6 PM)' : alloc.shift === 'half_day' ? 'Half Day' : 'Night Shift / Overtime'}\n`;
      text += `------------------------------------\n`;
    });

    text += `\nசந்தேகங்களுக்கு உடனே அட்மினை தொடர்பு கொள்ளவும். Best of Luck Team!`;
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
