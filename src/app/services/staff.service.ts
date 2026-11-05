import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  ElectricianEmployee, 
  SiteWorkAllocation, 
  StaffLeaveRequest, 
  StaffSalarySlip, 
  WorkerWagePayout,
  StaffClaimRequest,
  ClaimStatus
} from '../models/site.model';
import { SiteService } from './site.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly SESSION_KEY = 'electrical_vibers_staff_session_v1';
  private readonly LEAVES_KEY = 'electrical_vibers_staff_leaves_v1';
  private readonly CLAIMS_KEY = 'electrical_vibers_staff_claims_v1';

  private siteService = inject(SiteService);
  private firebaseService = inject(FirebaseService);

  private currentStaffSubject = new BehaviorSubject<ElectricianEmployee | null>(null);
  public currentStaff$: Observable<ElectricianEmployee | null> = this.currentStaffSubject.asObservable();

  private leavesSubject = new BehaviorSubject<StaffLeaveRequest[]>([]);
  public leaves$: Observable<StaffLeaveRequest[]> = this.leavesSubject.asObservable();

  private claimsSubject = new BehaviorSubject<StaffClaimRequest[]>([]);
  public claims$: Observable<StaffClaimRequest[]> = this.claimsSubject.asObservable();

  constructor() {
    this.loadSession();
    this.loadLeaves();
    this.loadClaims();
    this.initCloudSync();
  }

  private loadSession(): void {
    const saved = localStorage.getItem(this.SESSION_KEY);
    if (saved) {
      try {
        const emp: ElectricianEmployee = JSON.parse(saved);
        this.currentStaffSubject.next(emp);
      } catch (e) {
        console.error('Failed to parse staff session:', e);
      }
    }
  }

  private loadLeaves(): void {
    const saved = localStorage.getItem(this.LEAVES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.leavesSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to load leaves:', e);
      }
    }
    this.leavesSubject.next([]);
  }

  private saveLeaves(leaves: StaffLeaveRequest[], syncToCloud = true): void {
    localStorage.setItem(this.LEAVES_KEY, JSON.stringify(leaves));
    this.leavesSubject.next(leaves);

    if (syncToCloud) {
      leaves.forEach(l => {
        this.firebaseService.setDocument('leave_requests', l.id, l).catch(() => {});
      });
    }
  }

  private loadClaims(): void {
    const saved = localStorage.getItem(this.CLAIMS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.claimsSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to load claims:', e);
      }
    }
    this.claimsSubject.next([]);
  }

  private saveClaims(claims: StaffClaimRequest[], syncToCloud = true): void {
    localStorage.setItem(this.CLAIMS_KEY, JSON.stringify(claims));
    this.claimsSubject.next(claims);

    if (syncToCloud) {
      claims.forEach(c => {
        this.firebaseService.setDocument('staff_claims', c.id, c).catch(() => {});
      });
    }
  }

  private initCloudSync(): void {
    this.firebaseService.listenToCollection<StaffLeaveRequest>('leave_requests', (remoteLeaves) => {
      if (remoteLeaves && remoteLeaves.length > 0) {
        this.saveLeaves(remoteLeaves, false);
      }
    });

    this.firebaseService.listenToCollection<StaffClaimRequest>('staff_claims', (remoteClaims) => {
      if (remoteClaims && remoteClaims.length > 0) {
        this.saveClaims(remoteClaims, false);
      }
    });
  }

  loginWithPhoneOrId(credential: string): { success: boolean; message: string; employee?: ElectricianEmployee } {
    const clean = credential.trim().replace(/\D/g, '');
    const employees = this.siteService.getEmployees();

    const matched = employees.find(e => {
      const empPhoneClean = e.phone.replace(/\D/g, '');
      return empPhoneClean === clean || 
             (clean.length >= 10 && empPhoneClean.includes(clean)) ||
             e.id.toLowerCase() === credential.trim().toLowerCase();
    });

    if (matched) {
      this.currentStaffSubject.next(matched);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(matched));
      return { success: true, message: `Welcome back, ${matched.name}!`, employee: matched };
    }

    return { 
      success: false, 
      message: 'Mobile number or Staff ID not found in staff directory. Please contact contractor admin.' 
    };
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentStaffSubject.next(null);
  }

  getCurrentStaff(): ElectricianEmployee | null {
    return this.currentStaffSubject.getValue();
  }

  // --- Workload & Duty Allocations ---
  getStaffWorkload(employeeId: string): SiteWorkAllocation[] {
    const all = this.siteService.getAllocations();
    return all.filter(a => a.assignedEmployeeId === employeeId);
  }

  updateTaskStatus(allocationId: string, status: 'in_progress' | 'completed', completionNotes?: string, completionPhoto?: string): void {
    this.siteService.updateAllocationStatus(allocationId, status as any, completionNotes, completionPhoto);
  }

  carryForwardTask(allocationId: string, nextDate: string, reason: string): SiteWorkAllocation | null {
    return this.siteService.carryForwardTask(allocationId, nextDate, reason);
  }

  recordSiteCheckIn(
    allocationId: string, 
    checkIn: { 
      checkInTime: string; 
      checkInPhoto?: string; 
      checkInLocation?: { lat: number; lng: number; accuracy?: number; timestamp?: string } 
    }
  ): void {
    this.siteService.recordSiteCheckIn(allocationId, checkIn);
  }

  // --- Leave Tracker ---
  applyForLeave(req: Omit<StaffLeaveRequest, 'id' | 'status' | 'appliedAt'>): StaffLeaveRequest {
    const newLeave: StaffLeaveRequest = {
      ...req,
      id: 'leave-' + Date.now(),
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    const updated = [newLeave, ...this.leavesSubject.getValue()];
    this.saveLeaves(updated, true);
    return newLeave;
  }

  getStaffLeaves(employeeId: string): StaffLeaveRequest[] {
    return this.leavesSubject.getValue().filter(l => l.employeeId === employeeId);
  }

  getAllLeaves(): StaffLeaveRequest[] {
    return this.leavesSubject.getValue();
  }

  updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', reviewNotes?: string): void {
    const leaves = this.leavesSubject.getValue().map(l => {
      if (l.id === leaveId) {
        return {
          ...l,
          status,
          reviewNotes: reviewNotes || (status === 'approved' ? 'Approved by Master Contractor' : 'Declined due to work site commitments')
        };
      }
      return l;
    });

    this.saveLeaves(leaves, true);

    // If approved and the leave is ongoing today, optionally set the employee status to on_leave
    if (status === 'approved') {
      const target = leaves.find(l => l.id === leaveId);
      if (target) {
        const today = new Date().toISOString().split('T')[0];
        if (target.startDate <= today && target.endDate >= today) {
          const emp = this.siteService.getEmployees().find(e => e.id === target.employeeId);
          if (emp && emp.status !== 'on_leave') {
            this.siteService.toggleEmployeeStatus(emp.id);
          }
        }
      }
    }
  }

  deleteLeaveRequest(leaveId: string): void {
    const updated = this.leavesSubject.getValue().filter(l => l.id !== leaveId);
    this.saveLeaves(updated, true);
    this.firebaseService.deleteDocument('leave_requests', leaveId).catch(() => {});
  }

  // --- On-Site Material & Wage Advance Claims ---
  submitClaim(req: Omit<StaffClaimRequest, 'id' | 'status' | 'appliedAt'>): StaffClaimRequest {
    const newClaim: StaffClaimRequest = {
      ...req,
      amount: Number(req.amount),
      id: 'claim-' + Date.now(),
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    const updated = [newClaim, ...this.claimsSubject.getValue()];
    this.saveClaims(updated, true);
    return newClaim;
  }

  getStaffClaims(employeeId: string): StaffClaimRequest[] {
    return this.claimsSubject.getValue().filter(c => c.employeeId === employeeId);
  }

  getAllClaims(): StaffClaimRequest[] {
    return this.claimsSubject.getValue();
  }

  updateClaimStatus(claimId: string, status: ClaimStatus, reviewNotes?: string): void {
    const target = this.claimsSubject.getValue().find(c => c.id === claimId);
    const updated = this.claimsSubject.getValue().map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Master Contractor Admin',
          reviewNotes: reviewNotes || (status === 'approved' ? 'Approved by Contractor' : 'Rejected by Contractor')
        };
      }
      return c;
    });

    this.saveClaims(updated, true);

    // If approved and it is a wage advance, automatically record a payout in SiteService!
    if (status === 'approved' && target && target.claimType === 'wage_advance') {
      this.siteService.recordWagePayout({
        employeeId: target.employeeId,
        date: new Date().toISOString().split('T')[0],
        amount: target.amount,
        paymentMode: 'cash',
        notes: `Wage Advance: ${target.reason}`
      });
    }
  }

  deleteClaim(claimId: string): void {
    const updated = this.claimsSubject.getValue().filter(c => c.id !== claimId);
    this.saveClaims(updated, true);
    this.firebaseService.deleteDocument('staff_claims', claimId).catch(() => {});
  }

  // --- Salary Slips & Wage Payouts ---
  getStaffPayouts(employeeId: string): WorkerWagePayout[] {
    const payouts = this.siteService.getPayouts();
    return payouts.filter(p => p.employeeId === employeeId);
  }

  generateSalarySlip(emp: ElectricianEmployee, monthYear?: string): StaffSalarySlip {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthYear || `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const gross = emp.totalWagesEarned || (emp.dailyWage * (emp.totalDaysWorked || 0));
    const paid = emp.totalWagesPaid || 0;
    const net = Math.max(0, gross - paid);

    return {
      id: 'slip-' + emp.id + '-' + Date.now(),
      slipNumber: 'EV-SLIP-' + Math.floor(1000 + Math.random() * 9000),
      employeeId: emp.id,
      employeeName: emp.name,
      phone: emp.phone,
      role: emp.role,
      monthYear: currentMonth,
      dailyWageRate: emp.dailyWage,
      daysWorked: emp.totalDaysWorked || 0,
      grossWagesEarned: gross,
      advancesPaid: paid,
      netPayableAmount: net,
      generatedDate: now.toISOString().split('T')[0]
    };
  }
}
