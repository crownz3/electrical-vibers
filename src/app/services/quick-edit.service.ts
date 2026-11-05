import { Injectable, signal } from '@angular/core';

export type QuickEditType = 
  | 'hero' 
  | 'banner' 
  | 'product' 
  | 'service' 
  | 'offer' 
  | 'stats' 
  | 'values' 
  | 'deal' 
  | 'footer';

@Injectable({
  providedIn: 'root'
})
export class QuickEditService {
  // Modal visibility and state
  public isOpen = signal<boolean>(false);
  public activeType = signal<QuickEditType | null>(null);
  public editData = signal<any>(null);

  // Toggle visual markers (pencils, badges) across the site
  public showEditMarkers = signal<boolean>(true);

  open(type: QuickEditType, data: any = null): void {
    this.activeType.set(type);
    this.editData.set(data ? JSON.parse(JSON.stringify(data)) : null);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.activeType.set(null);
    this.editData.set(null);
  }

  toggleEditMarkers(): void {
    this.showEditMarkers.update(v => !v);
  }
}

