export type ExpenseCategory = 'material' | 'labor' | 'travel_food' | 'tools' | 'other';
export type SiteStatus = 'ongoing' | 'completed' | 'on_hold';

export interface SiteExpense {
  id: string;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  materialItemName?: string;
  quantity?: number;
  unitRate?: number;
  invoiceNo?: string;
  billPhoto?: string;
  notes?: string;
  recordedBy: string;
}


export interface SitePayment {
  id: string;
  date: string;
  amount: number;
  paymentMode: 'cash' | 'gpay_upi' | 'bank_transfer' | 'cheque';
  receiptNo?: string;
  notes?: string;
}

export interface SiteWorkerAssignment {
  id: string;
  date: string;
  workerName: string;
  workDescription: string;
  hoursWorked?: number;
  wageAmount?: number;
}

export type EmployeeRole = 
  | 'Lead Master Electrician' 
  | 'Senior Wireman' 
  | 'Junior Electrician' 
  | 'Chipping & Conduit Helper' 
  | 'DB & Switchgear Specialist'
  | 'Site Supervisor';

export interface ElectricianEmployee {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  dailyWage: number; // e.g. 1000, 850, 600
  status: 'active' | 'on_leave' | 'inactive';
  joiningDate: string;
  upiId?: string;
  specialty?: string;
  totalDaysWorked?: number;
  totalWagesEarned?: number;
  totalWagesPaid?: number;
  pendingWageBalance?: number;
}

export type AllocationStatus = 'scheduled' | 'in_progress' | 'completed' | 'incomplete' | 'carried_forward' | 'cancelled' | 'reassigned';
export type ShiftType = 'full_day' | 'half_day' | 'night_shift' | 'overtime';

export interface SiteWorkAllocation {
  id: string;
  siteId: string;
  siteName: string;
  clientName: string;
  clientPhone: string;
  siteAddress: string;
  date: string; // YYYY-MM-DD
  dayNumber?: number; // e.g. Day 1, Day 2
  taskDescription: string; // e.g. "Main DB neutral wiring & 2.5mm conduit drawing"
  shift: ShiftType;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  employeeDailyWage: number;
  wageMultiplier: number; // 1 for full_day, 0.5 for half_day, 1.5 for night_shift / overtime
  calculatedWage: number;
  status: AllocationStatus;
  reassignedFromId?: string;
  reassignedFromName?: string;
  reassignedReason?: string;
  isOvertime?: boolean;
  overtimeHours?: number;
  isCarriedForward?: boolean;
  carriedFromDate?: string;
  carryForwardToDate?: string;
  incompleteReason?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}


export interface WorkerWagePayout {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  amount: number;
  paymentMode: 'cash' | 'gpay_upi' | 'bank_transfer';
  notes?: string;
  receiptRef?: string;
}

export type ContractType = 'labor_only' | 'with_material';

export interface SiteProfitReport {
  siteId: string;
  siteName: string;
  clientName: string;
  contractType: ContractType;
  contractAmount: number;
  totalReceived: number;
  pendingFromClient: number;
  materialExpenses: number;
  laborWages: number;
  otherExpenses: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  estimatedLaborDays?: number;
  actualLaborDaysWorked: number;
}

export interface SiteProject {
  id: string;
  siteName: string;
  clientName: string;
  clientPhone: string;
  siteAddress: string;
  city: string;
  contractType: ContractType; // 'labor_only' | 'with_material'
  estimatedLaborDays?: number; // Planned total labor man-days
  plannedWorkersCount?: number; // How many workers deployed daily
  materialBudget?: number; // Estimated material purchase budget
  status: SiteStatus;
  startDate: string;
  expectedCompletionDate?: string;
  contractAmount: number;
  totalReceived: number;
  pendingBalance: number; // calculated: contractAmount - totalReceived
  totalExpenses: number;  // sum of expenses
  profitOrMargin: number; // totalReceived - totalExpenses
  assignedElectricians: string[]; // List of worker names
  description: string;
  expenses: SiteExpense[];
  payments: SitePayment[];
  dailyLogs: SiteWorkerAssignment[];
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}


