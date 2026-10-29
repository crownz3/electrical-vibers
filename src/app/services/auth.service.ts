import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from './firebase.service';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'admin' | 'customer' | 'technician';
  provider: 'google' | 'guest';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'voltmaster_user_v1';
  private readonly WHITELIST_KEY = 'voltmaster_admin_whitelist_v1';

  // Initial whitelist specified by user
  private readonly DEFAULT_WHITELIST: string[] = ['mohamedibrahim010425@gmail.com'];

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  private whitelistSubject = new BehaviorSubject<string[]>(this.DEFAULT_WHITELIST);
  public whitelist$: Observable<string[]> = this.whitelistSubject.asObservable();

  private authErrorSubject = new BehaviorSubject<string | null>(null);
  public authError$: Observable<string | null> = this.authErrorSubject.asObservable();

  public isAuthenticating = false;

  constructor(private firebaseService: FirebaseService) {
    this.loadWhitelist();
    this.loadUser();
    this.initCloudSync();
  }

  private initCloudSync(): void {
    // Real-time Firestore sync for admin whitelist
    this.firebaseService.listenToDocument<{ list: string[] }>('app_metadata', 'admin_whitelist', (data) => {
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        const merged = Array.from(new Set([...this.DEFAULT_WHITELIST, ...data.list]));
        this.saveWhitelist(merged, false);
      } else {
        this.firebaseService.setDocument('app_metadata', 'admin_whitelist', { list: this.whitelistSubject.getValue() }).catch(err => {
          console.warn('Could not seed admin whitelist to Firestore:', err);
        });
      }
    });
  }

  // --- Whitelist Management ---
  private loadWhitelist(): void {
    const saved = localStorage.getItem(this.WHITELIST_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure mohamedibrahim010425@gmail.com is always present
          const merged = Array.from(new Set([...this.DEFAULT_WHITELIST, ...parsed]));
          this.whitelistSubject.next(merged);
          return;
        }
      } catch (e) {
        console.error('Failed to parse admin whitelist:', e);
      }
    }
    this.saveWhitelist(this.DEFAULT_WHITELIST);
  }

  private saveWhitelist(list: string[], syncCloud = true): void {
    localStorage.setItem(this.WHITELIST_KEY, JSON.stringify(list));
    this.whitelistSubject.next(list);

    if (syncCloud) {
      this.firebaseService.setDocument('app_metadata', 'admin_whitelist', { list }).catch(err => {
        console.warn('Could not update admin whitelist in Firestore:', err);
      });
    }
  }

  getAuthorizedEmails(): string[] {
    return this.whitelistSubject.getValue();
  }

  isEmailAuthorized(email: string): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return this.getAuthorizedEmails().some(e => e.trim().toLowerCase() === normalized);
  }

  addAuthorizedEmail(email: string): { success: boolean; message: string } {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, message: 'Please enter a valid Google email address.' };
    }

    const current = this.getAuthorizedEmails();
    if (current.map(e => e.toLowerCase()).includes(trimmed)) {
      return { success: false, message: 'This email is already in the authorized admin list.' };
    }

    const updated = [...current, trimmed];
    this.saveWhitelist(updated, true);
    return { success: true, message: `Successfully added ${trimmed} as an authorized administrator.` };
  }

  removeAuthorizedEmail(email: string): { success: boolean; message: string } {
    const trimmed = email.trim().toLowerCase();
    if (trimmed === 'mohamedibrahim010425@gmail.com') {
      return { success: false, message: 'Primary master administrator (mohamedibrahim010425@gmail.com) cannot be removed.' };
    }

    const current = this.getAuthorizedEmails();
    const updated = current.filter(e => e.toLowerCase() !== trimmed);
    this.saveWhitelist(updated, true);
    return { success: true, message: `Removed ${trimmed} from authorized administrators.` };
  }

  // --- User Session ---
  private loadUser(): void {
    const saved = localStorage.getItem(this.USER_KEY);
    if (saved) {
      try {
        const user: UserProfile = JSON.parse(saved);
        // Re-verify that user's email is still on whitelist if role is admin
        if (user.role === 'admin' && !this.isEmailAuthorized(user.email)) {
          this.logout();
          return;
        }
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
  }

  // --- Google Sign-In Execution ---
  async signInWithGoogle(explicitEmail?: string, explicitName?: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    this.authErrorSubject.next(null);
    this.isAuthenticating = true;

    try {
      let email = explicitEmail;
      let displayName = explicitName || 'Mohamed Ibrahim';
      let photoURL = 'https://lh3.googleusercontent.com/a/default-user';

      // If no explicit account selected, attempt real Firebase Google Auth popup on web
      if (!explicitEmail && !Capacitor.isNativePlatform()) {
        try {
          const app = getApps().length > 0 ? getApp() : initializeApp(environment.firebase);
          const auth = getAuth(app);
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const result = await signInWithPopup(auth, provider);
          if (result.user && result.user.email) {
            email = result.user.email;
            displayName = result.user.displayName || displayName;
            photoURL = result.user.photoURL || photoURL;
          }
        } catch (fbErr: any) {
          console.warn('Firebase popup unavailable or using fallback credentials:', fbErr);
          // If popup closed intentionally by user
          if (fbErr.code === 'auth/popup-closed-by-user') {
            this.isAuthenticating = false;
            const msg = 'Google Sign-In was cancelled.';
            this.authErrorSubject.next(msg);
            return { success: false, error: msg };
          }
          throw fbErr;
        }
      }

      if (!email) {
        this.isAuthenticating = false;
        return { success: false, error: 'NO_ACCOUNT_SELECTED' };
      }

      return this.validateAndAuthorize(email, displayName, photoURL);
    } catch (err: any) {
      this.isAuthenticating = false;
      return { success: false, error: err?.message || 'GOOGLE_SIGNIN_PROMPT' };
    }
  }

  validateAndAuthorize(email: string, displayName: string, photoURL?: string): { success: boolean; error?: string; user?: UserProfile } {
    this.isAuthenticating = false;
    const cleanEmail = email.trim().toLowerCase();

    // Whitelist Verification
    if (!this.isEmailAuthorized(cleanEmail)) {
      const errorMsg = `Access Denied: "${email}" is not registered as an authorized administrator. Only authorized Google accounts (mohamedibrahim010425@gmail.com) can access this contractor portal.`;
      this.authErrorSubject.next(errorMsg);
      this.logout();
      return { success: false, error: errorMsg };
    }

    const adminUser: UserProfile = {
      uid: 'google-' + Math.floor(100000 + Math.random() * 900000),
      email: cleanEmail,
      displayName: displayName || (cleanEmail === 'mohamedibrahim010425@gmail.com' ? 'Mohamed Ibrahim' : cleanEmail.split('@')[0]),
      photoURL: photoURL || 'https://lh3.googleusercontent.com/a/default-user',
      phone: '+91 98765 43210',
      role: 'admin',
      provider: 'google'
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(adminUser));
    this.currentUserSubject.next(adminUser);
    this.authErrorSubject.next(null);

    // Sync admin user profile to Firestore
    this.firebaseService.setDocument('admins', adminUser.uid, adminUser).catch(err => {
      console.warn('Could not record admin session in Firestore:', err);
    });

    return { success: true, user: adminUser };
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.authErrorSubject.next(null);
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.getValue();
    return user?.role === 'admin' && this.isEmailAuthorized(user.email);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }
}
