import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { 
  ConfirmDialogComponent, 
  ConfirmDialogData, 
  DialogType 
} from '../components/dialogs/confirm-dialog.component';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: string;
}

export interface AlertDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  type?: DialogType;
  icon?: string;
}

export interface PromptDialogOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog);

  /**
   * Opens a Material confirmation dialog (Yes / Cancel).
   * Supports either an options object or (message, title?, type?) arguments.
   * Replaces native window.confirm().
   */
  async confirm(
    paramOrMessage: string | ConfirmDialogOptions,
    title?: string,
    type?: DialogType
  ): Promise<boolean> {
    const opts: ConfirmDialogOptions = typeof paramOrMessage === 'string'
      ? { title: title || 'Confirmation', message: paramOrMessage, type: type || 'primary' }
      : { title: paramOrMessage.title || 'Confirmation', ...paramOrMessage };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        mode: 'confirm',
        title: opts.title || 'Confirmation',
        message: opts.message,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        type: opts.type || 'primary',
        icon: opts.icon
      } as ConfirmDialogData,
      width: '440px',
      panelClass: 'custom-mat-dialog-panel',
      disableClose: false
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return !!result;
  }

  /**
   * Opens a Material alert dialog (OK).
   * Supports either an options object or (message, title?, type?) arguments.
   * Replaces native window.alert().
   */
  async alert(
    paramOrMessage: string | AlertDialogOptions,
    title?: string,
    type?: DialogType
  ): Promise<void> {
    const opts: AlertDialogOptions = typeof paramOrMessage === 'string'
      ? { title: title || 'Notice', message: paramOrMessage, type: type || 'info' }
      : { title: paramOrMessage.title || 'Notice', ...paramOrMessage };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        mode: 'alert',
        title: opts.title || 'Notice',
        message: opts.message,
        confirmText: opts.confirmText || 'OK',
        type: opts.type || 'info',
        icon: opts.icon
      } as ConfirmDialogData,
      width: '420px',
      panelClass: 'custom-mat-dialog-panel',
      disableClose: false
    });

    await firstValueFrom(dialogRef.afterClosed());
  }

  /**
   * Opens a Material prompt dialog with an input field.
   * Supports either an options object or (title, message?, defaultValue?) arguments.
   * Replaces native window.prompt().
   */
  async prompt(
    paramOrTitle: string | PromptDialogOptions,
    message?: string,
    defaultValue?: string
  ): Promise<string | null> {
    const opts: PromptDialogOptions = typeof paramOrTitle === 'string'
      ? { title: paramOrTitle, message: message || '', defaultValue: defaultValue || '' }
      : paramOrTitle;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        mode: 'prompt',
        title: opts.title,
        message: opts.message || '',
        placeholder: opts.placeholder || 'Enter value...',
        defaultValue: opts.defaultValue || '',
        confirmText: opts.confirmText || 'Save',
        cancelText: opts.cancelText || 'Cancel',
        type: 'primary',
        icon: opts.icon || 'edit_note'
      } as ConfirmDialogData,
      width: '450px',
      panelClass: 'custom-mat-dialog-panel',
      disableClose: false
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result !== undefined ? result : null;
  }
}
