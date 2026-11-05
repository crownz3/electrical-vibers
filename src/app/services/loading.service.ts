import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.isLoadingSubject.next(true);
    }
  }

  hide(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    if (this.activeRequests === 0) {
      this.isLoadingSubject.next(false);
    }
  }

  reset(): void {
    this.activeRequests = 0;
    this.isLoadingSubject.next(false);
  }

  get isLoading(): boolean {
    return this.isLoadingSubject.getValue();
  }

  async wrap<T>(operation: Promise<T>): Promise<T> {
    this.show();
    try {
      return await operation;
    } finally {
      this.hide();
    }
  }
}

