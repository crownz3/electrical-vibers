import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let service: DialogService;
  let mockMatDialog: any;

  beforeEach(() => {
    mockMatDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true)
      })
    };

    TestBed.configureTestingModule({
      providers: [
        DialogService,
        { provide: MatDialog, useValue: mockMatDialog }
      ]
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open confirm dialog with string parameter', async () => {
    const res = await service.confirm('Are you sure?', 'Confirm Title', 'danger');
    expect(mockMatDialog.open).toHaveBeenCalled();
    expect(res).toBe(true);
  });

  it('should open confirm dialog with options object', async () => {
    const res = await service.confirm({
      title: 'Delete Item',
      message: 'Will delete permanently',
      confirmText: 'Delete',
      type: 'danger'
    });
    expect(mockMatDialog.open).toHaveBeenCalled();
    expect(res).toBe(true);
  });

  it('should return false if dialog is dismissed', async () => {
    mockMatDialog.open.mockReturnValueOnce({
      afterClosed: () => of(false)
    });
    const res = await service.confirm('Proceed?');
    expect(res).toBe(false);
  });

  it('should open alert dialog with string and options', async () => {
    await service.alert('Operation successful', 'Success', 'success');
    expect(mockMatDialog.open).toHaveBeenCalled();

    await service.alert({
      title: 'Alert Notice',
      message: 'Alert message'
    });
    expect(mockMatDialog.open).toHaveBeenCalledTimes(2);
  });

  it('should open prompt dialog and return input', async () => {
    mockMatDialog.open.mockReturnValueOnce({
      afterClosed: () => of('user input text')
    });
    const res = await service.prompt('Enter remark', 'Reason:');
    expect(res).toBe('user input text');
  });

  it('should open prompt dialog with options object and return null when cancelled', async () => {
    mockMatDialog.open.mockReturnValueOnce({
      afterClosed: () => of(undefined)
    });
    const res = await service.prompt({
      title: 'Decline Reason',
      message: 'Why decline?'
    });
    expect(res).toBeNull();
  });
});

