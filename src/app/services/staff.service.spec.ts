import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StaffService } from './staff.service';
import { SiteService } from './site.service';
import { FirebaseService } from './firebase.service';
import { ElectricianEmployee } from '../models/site.model';

describe('StaffService', () => {
  let service: StaffService;
  let mockFirebaseService: any;
  let mockSiteService: any;

  const mockEmployee: ElectricianEmployee = {
    id: 'emp-spec-1',
    name: 'Muthu Wireman',
    phone: '9876543210',
    role: 'Senior Wireman',
    dailyWage: 950,
    status: 'active',
    joiningDate: '2025-01-01',
    totalDaysWorked: 10,
    totalWagesEarned: 9500,
    totalWagesPaid: 3000,
    pendingWageBalance: 6500
  };

  beforeEach(() => {
    localStorage.clear();

    mockFirebaseService = {
      listenToCollection: (_col: string, _cb: any) => {},
      setDocument: vi.fn().mockResolvedValue(true),
      deleteDocument: vi.fn().mockResolvedValue(true)
    };

    mockSiteService = {
      getEmployees: () => [mockEmployee],
      getAllocations: () => [],
      getPayouts: () => [],
      toggleEmployeeStatus: vi.fn(),
      updateAllocationStatus: vi.fn(),
      carryForwardTask: vi.fn().mockReturnValue({ id: 'alloc-new-1', date: '2026-11-15', status: 'scheduled' }),
      recordSiteCheckIn: vi.fn(),
      recordWagePayout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        StaffService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: SiteService, useValue: mockSiteService }
      ]
    });

    service = TestBed.inject(StaffService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should authenticate staff by valid mobile phone number', () => {
    const res = service.loginWithPhoneOrId('9876543210');
    expect(res.success).toBe(true);
    expect(res.employee?.id).toBe('emp-spec-1');
    expect(service.getCurrentStaff()?.name).toBe('Muthu Wireman');
  });

  it('should authenticate staff by Staff ID', () => {
    const res = service.loginWithPhoneOrId('emp-spec-1');
    expect(res.success).toBe(true);
    expect(res.employee?.phone).toBe('9876543210');
  });

  it('should reject invalid credentials', () => {
    const res = service.loginWithPhoneOrId('0000000000');
    expect(res.success).toBe(false);
    expect(service.getCurrentStaff()).toBeNull();
  });

  it('should submit leave request and track in pending status', () => {
    const leave = service.applyForLeave({
      employeeId: 'emp-spec-1',
      employeeName: 'Muthu Wireman',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      daysCount: 3,
      leaveType: 'casual',
      reason: 'Family function in hometown'
    });

    expect(leave.id).toBeTruthy();
    expect(leave.status).toBe('pending');

    const empLeaves = service.getStaffLeaves('emp-spec-1');
    expect(empLeaves.length).toBe(1);
    expect(empLeaves[0].daysCount).toBe(3);
  });

  it('should allow contractor to approve or reject leave request', () => {
    const leave = service.applyForLeave({
      employeeId: 'emp-spec-1',
      employeeName: 'Muthu Wireman',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      daysCount: 3,
      leaveType: 'sick',
      reason: 'Viral fever'
    });

    service.updateLeaveStatus(leave.id, 'approved', 'Get well soon, approved.');
    const updated = service.getAllLeaves().find(l => l.id === leave.id);
    expect(updated?.status).toBe('approved');
    expect(updated?.reviewNotes).toBe('Get well soon, approved.');
  });

  it('should generate accurate salary slip calculations', () => {
    const slip = service.generateSalarySlip(mockEmployee, 'November 2026');
    expect(slip.employeeId).toBe('emp-spec-1');
    expect(slip.dailyWageRate).toBe(950);
    expect(slip.daysWorked).toBe(10);
    expect(slip.grossWagesEarned).toBe(9500);
    expect(slip.advancesPaid).toBe(3000);
    expect(slip.netPayableAmount).toBe(6500);
    expect(slip.slipNumber).toContain('EV-SLIP-');
  });

  it('should carry forward incomplete task to next working date', () => {
    const res = service.carryForwardTask('alloc-1', '2026-11-15', 'Material shortage');
    expect(mockSiteService.carryForwardTask).toHaveBeenCalledWith('alloc-1', '2026-11-15', 'Material shortage');
    expect(res?.id).toBe('alloc-new-1');
  });

  it('should record staff site arrival check-in with GPS and photo proof', () => {
    service.recordSiteCheckIn('alloc-1', {
      checkInTime: '09:15 AM',
      checkInPhoto: 'https://storage.googleapis.com/test-photo.jpg',
      checkInLocation: { lat: 9.9252, lng: 78.1198, accuracy: 5 }
    });
    expect(mockSiteService.recordSiteCheckIn).toHaveBeenCalledWith('alloc-1', {
      checkInTime: '09:15 AM',
      checkInPhoto: 'https://storage.googleapis.com/test-photo.jpg',
      checkInLocation: { lat: 9.9252, lng: 78.1198, accuracy: 5 }
    });
  });

  it('should update task status with work completion photo and notes', () => {
    service.updateTaskStatus('alloc-1', 'completed', 'DB dressed properly', 'https://storage.googleapis.com/db.jpg');
    expect(mockSiteService.updateAllocationStatus).toHaveBeenCalledWith(
      'alloc-1', 
      'completed', 
      'DB dressed properly', 
      'https://storage.googleapis.com/db.jpg'
    );
  });

  it('should submit on-site expense claim and allow admin approval', () => {
    const claim = service.submitClaim({
      employeeId: 'emp-spec-1',
      employeeName: 'Muthu Wireman',
      claimType: 'material_reimbursement',
      amount: 450,
      reason: '10m 2.5mm copper cable',
      billPhoto: 'https://storage.googleapis.com/bill.jpg'
    });

    expect(claim.id).toBeTruthy();
    expect(claim.status).toBe('pending');
    expect(claim.amount).toBe(450);

    const empClaims = service.getStaffClaims('emp-spec-1');
    expect(empClaims.length).toBe(1);

    service.updateClaimStatus(claim.id, 'approved', 'Reimbursed in cash');
    const updated = service.getAllClaims().find(c => c.id === claim.id);
    expect(updated?.status).toBe('approved');
    expect(updated?.reviewNotes).toBe('Reimbursed in cash');
  });
});
