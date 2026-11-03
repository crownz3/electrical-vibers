import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { SiteService } from '../../services/site.service';
import { FirebaseService } from '../../services/firebase.service';
import { 
  ElectricianEmployee, 
  SiteWorkAllocation, 
  StaffLeaveRequest, 
  StaffSalarySlip, 
  WorkerWagePayout, 
  LeaveType 
} from '../../models/site.model';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff.page.html',
  styleUrls: ['./staff.page.scss']
})
export class StaffPage implements OnInit {
  staffService = inject(StaffService);
  siteService = inject(SiteService);
  firebaseService = inject(FirebaseService);

  isOffline = !navigator.onLine;

  // Site Check-in (GPS & Photo Proof)
  showCheckInModal = false;
  activeCheckInTask: SiteWorkAllocation | null = null;
  checkInPhotoUrl = '';
  isUploadingCheckInPhoto = false;
  checkInGpsLocation: { lat: number; lng: number; accuracy?: number } | null = null;
  gpsDetecting = false;
  gpsError = '';

  activeTab: 'workload' | 'leaves' | 'salary' = 'workload';

  // Login form
  loginPhoneOrId = '';
  loginError = '';

  // Current Staff Session
  currentStaff: ElectricianEmployee | null = null;
  allStaffList: ElectricianEmployee[] = [];

  // Workload data
  workload: SiteWorkAllocation[] = [];
  todayStr = new Date().toISOString().split('T')[0];
  tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Incomplete Task Resolution Modal State
  showIncompleteModal = false;
  activeIncompleteTask: SiteWorkAllocation | null = null;
  incompleteNextDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  incompleteReason = 'Material / Cable shortage at site';
  incompleteNotes = '';

  commonIncompleteReasons = [
    { label: 'Material / Cable Shortage (பொருட்கள் பற்றாக்குறை)', value: 'Material / Cable shortage at site' },
    { label: 'Power Cut / Site Locked (மின்வெட்டு / தளம் மூடல்)', value: 'Power cut / Site locked by customer' },
    { label: 'Civil / Painting Incomplete (சிமெண்ட் / பெயிண்டிங் பாக்கி)', value: 'Civil or painting work pending' },
    { label: 'Customer Not Available (வாடிக்கையாளர் இல்லை)', value: 'Customer unavailable for access' },
    { label: 'Rain / Bad Weather (மழை / வானிலை)', value: 'Inclement weather / Rain disruption' },
    { label: 'Extended Scope / High Workload (கூடுதல் நேரம் தேவை)', value: 'Work scope requires additional day' }
  ];

  get overdueTasks(): SiteWorkAllocation[] {
    return this.workload.filter(w => w.date < this.todayStr && w.status !== 'completed' && w.status !== 'carried_forward');
  }

  get todayTasks(): SiteWorkAllocation[] {
    return this.workload.filter(w => w.date === this.todayStr && w.status !== 'carried_forward');
  }

  get upcomingTasks(): SiteWorkAllocation[] {
    return this.workload.filter(w => w.date > this.todayStr && w.status !== 'carried_forward');
  }

  get completedTasks(): SiteWorkAllocation[] {
    return this.workload.filter(w => w.status === 'completed');
  }

  // Leave Tracker form
  showLeaveModal = false;
  leaveStartDate = new Date().toISOString().split('T')[0];
  leaveEndDate = new Date().toISOString().split('T')[0];
  leaveType: LeaveType = 'casual';
  leaveReason = '';
  leaves: StaffLeaveRequest[] = [];

  // Salary Slip Modal
  showSalaryModal = false;
  activeSalarySlip: StaffSalarySlip | null = null;
  payouts: WorkerWagePayout[] = [];

  // Feedback Toast
  toastMessage = '';
  private toastTimeout?: any;

  ngOnInit(): void {
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);
    this.staffService.currentStaff$.subscribe(staff => {
      this.currentStaff = staff;
      if (staff) {
        this.loadStaffData(staff);
      }
    });

    this.siteService.employees$.subscribe(emps => {
      this.allStaffList = emps;
      // Refresh current staff state if updated in admin
      if (this.currentStaff) {
        const refreshed = emps.find(e => e.id === this.currentStaff!.id);
        if (refreshed) {
          this.currentStaff = refreshed;
          this.loadStaffData(refreshed);
        }
      }
    });

    this.staffService.leaves$.subscribe(() => {
      if (this.currentStaff) {
        this.leaves = this.staffService.getStaffLeaves(this.currentStaff.id);
      }
    });
  }

  private loadStaffData(staff: ElectricianEmployee): void {
    this.workload = this.staffService.getStaffWorkload(staff.id);
    this.leaves = this.staffService.getStaffLeaves(staff.id);
    this.payouts = this.staffService.getStaffPayouts(staff.id);
  }

  // --- Auth & Demo Login ---
  login(): void {
    this.loginError = '';
    if (!this.loginPhoneOrId.trim()) {
      this.loginError = 'Please enter your registered mobile number or staff ID.';
      return;
    }

    const res = this.staffService.loginWithPhoneOrId(this.loginPhoneOrId);
    if (res.success && res.employee) {
      this.showToast(res.message);
      this.loginPhoneOrId = '';
    } else {
      this.loginError = res.message;
    }
  }

  quickDemoLogin(emp: ElectricianEmployee): void {
    this.loginPhoneOrId = emp.phone;
    this.login();
  }

  logout(): void {
    this.staffService.logout();
    this.showToast('You have signed out from the Staff Portal.');
  }

  // --- Workload Actions ---
  markTaskStarted(alloc: SiteWorkAllocation): void {
    this.staffService.updateTaskStatus(alloc.id, 'in_progress');
    this.showToast(`Started work at ${alloc.siteName}!`);
    if (this.currentStaff) {
      this.workload = this.staffService.getStaffWorkload(this.currentStaff.id);
    }
  }

  markTaskCompleted(alloc: SiteWorkAllocation): void {
    const notes = prompt('Add any notes or completed tasks summary for today:');
    this.staffService.updateTaskStatus(alloc.id, 'completed', notes || undefined);
    this.showToast(`Great work! Day completed for ${alloc.siteName}.`);
    if (this.currentStaff) {
      this.workload = this.staffService.getStaffWorkload(this.currentStaff.id);
    }
  }

  // --- Incomplete & Rollover Actions ---
  openIncompleteModal(task: SiteWorkAllocation): void {
    this.activeIncompleteTask = task;
    this.incompleteNextDate = this.tomorrowStr;
    this.incompleteReason = 'Material / Cable shortage at site';
    this.incompleteNotes = '';
    this.showIncompleteModal = true;
  }

  selectIncompleteReason(reason: string): void {
    this.incompleteReason = reason;
  }

  confirmCarryForward(): void {
    if (!this.activeIncompleteTask) return;
    if (!this.incompleteNextDate) {
      alert('Please select a target date to carry forward this task.');
      return;
    }

    const fullReason = this.incompleteNotes.trim()
      ? `${this.incompleteReason} - ${this.incompleteNotes.trim()}`
      : this.incompleteReason;

    this.staffService.carryForwardTask(
      this.activeIncompleteTask.id,
      this.incompleteNextDate,
      fullReason
    );

    this.showIncompleteModal = false;
    this.activeIncompleteTask = null;

    if (this.currentStaff) {
      this.workload = this.staffService.getStaffWorkload(this.currentStaff.id);
    }

    this.showToast(`Task rolled over to ${this.incompleteNextDate}. Supervisor notified.`);
  }

  quickCarryForwardToTomorrow(task: SiteWorkAllocation): void {
    this.staffService.carryForwardTask(
      task.id,
      this.tomorrowStr,
      'Work pending from scheduled day, carried forward to tomorrow'
    );

    if (this.currentStaff) {
      this.workload = this.staffService.getStaffWorkload(this.currentStaff.id);
    }

    this.showToast(`Task rolled over to tomorrow (${this.tomorrowStr})!`);
  }

  
  // --- Site Check-in (GPS & Photo Proof) ---
  openCheckInModal(task: SiteWorkAllocation): void {
    this.activeCheckInTask = task;
    this.checkInPhotoUrl = '';
    this.isUploadingCheckInPhoto = false;
    this.checkInGpsLocation = null;
    this.gpsError = '';
    this.showCheckInModal = true;
    this.detectGpsLocation();
  }

  detectGpsLocation(): void {
    if (!navigator.geolocation) {
      this.gpsError = 'Geolocation is not supported by your browser/device.';
      return;
    }

    this.gpsDetecting = true;
    this.gpsError = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.checkInGpsLocation = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy)
        };
        this.gpsDetecting = false;
      },
      (err) => {
        console.warn('GPS location error:', err);
        this.gpsError = 'Could not get exact GPS (tap to retry). You can still check in with photo.';
        this.gpsDetecting = false;
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  async onCheckInPhotoSelected(event: any): Promise<void> {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.isUploadingCheckInPhoto = true;
    try {
      const url = await this.firebaseService.uploadFile('staff_checkins', file);
      if (url) {
        this.checkInPhotoUrl = url;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.checkInPhotoUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.checkInPhotoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } finally {
      this.isUploadingCheckInPhoto = false;
    }
  }

  confirmCheckIn(): void {
    if (!this.activeCheckInTask) return;

    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.staffService.recordSiteCheckIn(this.activeCheckInTask.id, {
      checkInTime,
      checkInPhoto: this.checkInPhotoUrl || undefined,
      checkInLocation: this.checkInGpsLocation ? {
        lat: this.checkInGpsLocation.lat,
        lng: this.checkInGpsLocation.lng,
        accuracy: this.checkInGpsLocation.accuracy,
        timestamp: new Date().toISOString()
      } : undefined
    });

    this.showCheckInModal = false;
    this.activeCheckInTask = null;
    this.showToast(`Site check-in verified at ${checkInTime}! Status: In Progress.`);

    if (this.currentStaff) {
      this.workload = this.staffService.getStaffWorkload(this.currentStaff.id);
    }
  }

  openGoogleMaps(siteAddress: string, siteName: string): void {
    const dest = encodeURIComponent((siteAddress || siteName).trim() + ', Tamil Nadu, India');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  }

  callClient(phone: string): void {
    window.open(`tel:${phone}`, '_self');
  }

  openWhatsApp(phone: string, clientName: string, siteName: string): void {
    const text = encodeURIComponent(`Hello ${clientName}, this is ${this.currentStaff?.name} from Electrical Vibers. I am assigned for your electrical work at ${siteName}.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  }

  // --- Leave Tracker Actions ---
  openApplyLeaveModal(): void {
    this.leaveStartDate = new Date().toISOString().split('T')[0];
    this.leaveEndDate = new Date().toISOString().split('T')[0];
    this.leaveType = 'casual';
    this.leaveReason = '';
    this.showLeaveModal = true;
  }

  submitLeaveRequest(): void {
    if (!this.currentStaff) return;
    if (!this.leaveStartDate || !this.leaveEndDate) {
      alert('Please select both start and end dates.');
      return;
    }
    if (!this.leaveReason.trim()) {
      alert('Please provide a brief reason for your leave request.');
      return;
    }

    const start = new Date(this.leaveStartDate);
    const end = new Date(this.leaveEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    this.staffService.applyForLeave({
      employeeId: this.currentStaff.id,
      employeeName: this.currentStaff.name,
      startDate: this.leaveStartDate,
      endDate: this.leaveEndDate,
      daysCount: Math.max(1, days),
      leaveType: this.leaveType,
      reason: this.leaveReason.trim()
    });

    this.showLeaveModal = false;
    this.showToast(`Leave application submitted for ${days} day(s). Contractor supervisor will review.`);
  }

  // --- Salary Slip & Payout Actions ---
  viewSalarySlip(): void {
    if (!this.currentStaff) return;
    this.activeSalarySlip = this.staffService.generateSalarySlip(this.currentStaff);
    this.showSalaryModal = true;
  }

  printSalarySlip(): void {
    window.print();
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage = '', 3500);
  }
}

