export type BookingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceCategory {
  id: string;
  title: string;
  tamilTitle: string;
  icon: string;
  description: string;
  startingPrice: number;
  popular?: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  landmark?: string;
  serviceCategory: string;
  serviceTitle: string;
  problemDescription: string;
  preferredDate: string;
  preferredTimeSlot: string; // e.g. "Morning 09:00 AM - 12:00 PM"
  status: BookingStatus;
  assignedTechnician?: string;
  technicianPhone?: string;
  estimatedCost?: number;
  finalCost?: number;
  photos?: string[];
  createdAt: string;
  completedAt?: string;
  adminNotes?: string;
}
