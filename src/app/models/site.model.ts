export type ExpenseCategory = 'material' | 'labor' | 'travel_food' | 'tools' | 'other';
export type SiteStatus = 'ongoing' | 'completed' | 'on_hold';

export interface SiteExpense {
  id: string;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
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

export interface SiteProject {
  id: string;
  siteName: string;
  clientName: string;
  clientPhone: string;
  siteAddress: string;
  city: string;
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
