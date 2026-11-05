import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type DialogType = 'primary' | 'danger' | 'warning' | 'info' | 'success';
export type DialogMode = 'confirm' | 'alert' | 'prompt';

export interface ConfirmDialogData {
  mode?: DialogMode;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: string;
  placeholder?: string;
  defaultValue?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="custom-mat-dialog-wrap" [ngClass]="data.type || 'primary'">
      <div class="dialog-header">
        <div class="dialog-icon-circle" [ngClass]="data.type || 'primary'">
          <mat-icon>{{ getIconName() }}</mat-icon>
        </div>
        <div class="dialog-title-box">
          <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
        </div>
      </div>

      <mat-dialog-content class="dialog-content">
        <p class="dialog-message">{{ data.message }}</p>

        <!-- Prompt Input Field for edit/notes/reasons -->
        <div *ngIf="data.mode === 'prompt'" class="prompt-input-container">
          <input 
            type="text" 
            [(ngModel)]="inputValue" 
            (keyup.enter)="onConfirm()"
            class="prompt-text-input" 
            [placeholder]="data.placeholder || 'Enter value...'" 
            autofocus
          />
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions" align="end">
        <button 
          *ngIf="data.mode !== 'alert'" 
          mat-button 
          type="button" 
          class="btn-dialog-cancel" 
          (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>

        <button 
          mat-flat-button 
          type="button" 
          class="btn-dialog-confirm" 
          [ngClass]="data.type || 'primary'" 
          (click)="onConfirm()">
          {{ data.confirmText || (data.mode === 'alert' ? 'OK' : 'Confirm') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .custom-mat-dialog-wrap {
      padding: 8px 4px;
      color: #f1f5f9;
      background: transparent;
      min-width: 290px;
      max-width: 440px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 12px;
    }

    .dialog-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.primary {
        background: rgba(2, 132, 199, 0.18);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.35);
      }
      &.danger {
        background: rgba(239, 68, 68, 0.18);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.35);
      }
      &.warning {
        background: rgba(245, 158, 11, 0.18);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.35);
      }
      &.info {
        background: rgba(14, 165, 233, 0.18);
        color: #38bdf8;
        border: 1px solid rgba(14, 165, 233, 0.35);
      }
      &.success {
        background: rgba(16, 185, 129, 0.18);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.35);
      }
    }

    .dialog-title {
      margin: 0 !important;
      padding: 0 !important;
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.3;
    }

    .dialog-content {
      padding: 0 0 16px 0 !important;
      margin: 0 !important;
      overflow: visible;
    }

    .dialog-message {
      color: #94a3b8;
      font-size: 0.92rem;
      line-height: 1.5;
      margin: 0;
      white-space: pre-line;
    }

    .prompt-input-container {
      margin-top: 14px;

      .prompt-text-input {
        width: 100%;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        padding: 10px 14px;
        color: #f8fafc;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.2s ease;

        &:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
        }
      }
    }

    .dialog-actions {
      padding: 12px 0 0 0 !important;
      margin: 0 !important;
      gap: 10px;

      .btn-dialog-cancel {
        color: #94a3b8;
        border-radius: 8px;
        font-weight: 600;

        &:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }
      }

      .btn-dialog-confirm {
        border-radius: 8px;
        font-weight: 700;
        padding: 0 18px;
        height: 38px;

        &.primary {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          color: #ffffff;
        }
        &.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
        }
        &.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #0b1120;
        }
        &.info {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #ffffff;
        }
        &.success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  inputValue = this.data.defaultValue || '';

  getIconName(): string {
    if (this.data.icon) return this.data.icon;
    switch (this.data.type) {
      case 'danger': return 'error_outline';
      case 'warning': return 'warning_amber';
      case 'success': return 'check_circle';
      case 'info': return 'info';
      default:
        return this.data.mode === 'prompt' ? 'edit_note' : 'help_outline';
    }
  }

  onConfirm(): void {
    if (this.data.mode === 'prompt') {
      this.dialogRef.close(this.inputValue);
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    if (this.data.mode === 'prompt') {
      this.dialogRef.close(null);
    } else {
      this.dialogRef.close(false);
    }
  }
}

