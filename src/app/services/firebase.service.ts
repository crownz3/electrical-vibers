import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  Unsubscribe 
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export type CloudSyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private db: Firestore | null = null;

  private syncStatusSubject = new BehaviorSubject<CloudSyncStatus>('offline');
  public syncStatus$: Observable<CloudSyncStatus> = this.syncStatusSubject.asObservable();

  private lastSyncTimeSubject = new BehaviorSubject<Date | null>(null);
  public lastSyncTime$: Observable<Date | null> = this.lastSyncTimeSubject.asObservable();

  constructor() {
    this.app = getApps().length > 0 ? getApp() : initializeApp(environment.firebase);
    try {
      this.db = getFirestore(this.app);
      this.syncStatusSubject.next('connected');
    } catch (err) {
      console.warn('Firestore initialization fallback to offline cache mode:', err);
      this.syncStatusSubject.next('offline');
    }
  }

  get firestore(): Firestore | null {
    return this.db;
  }

  isCloudReady(): boolean {
    return this.db !== null && navigator.onLine;
  }

  /**
   * Listen to real-time changes on a Firestore collection.
   * Returns an unsubscribe function.
   */
  listenToCollection<T extends { id: string }>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe | null {
    if (!this.db) {
      return null;
    }

    try {
      const colRef = collection(this.db, collectionName);
      const q = query(colRef);

      return onSnapshot(
        q,
        (snapshot) => {
          this.syncStatusSubject.next('connected');
          this.lastSyncTimeSubject.next(new Date());

          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({ ...data, id: docSnap.id } as T);
          });

          onData(items);
        },
        (error) => {
          console.warn(`Firestore listener on [${collectionName}] warning:`, error.message);
          this.syncStatusSubject.next('offline');
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.warn(`Could not attach listener to [${collectionName}]:`, e);
      return null;
    }
  }

  /**
   * Fetch all documents from a collection once.
   */
  async getCollectionDocs<T extends { id: string }>(collectionName: string): Promise<T[] | null> {
    if (!this.db) return null;

    try {
      this.syncStatusSubject.next('syncing');
      const colRef = collection(this.db, collectionName);
      const snapshot = await getDocs(colRef);
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id } as T);
      });
      this.syncStatusSubject.next('connected');
      this.lastSyncTimeSubject.next(new Date());
      return items;
    } catch (err: any) {
      console.warn(`Error fetching docs from [${collectionName}]:`, err?.message);
      this.syncStatusSubject.next('offline');
      return null;
    }
  }

  /**
   * Listen to a single document in real-time.
   */
  listenToDocument<T>(
    collectionName: string,
    docId: string,
    onData: (data: T | null) => void
  ): Unsubscribe | null {
    if (!this.db) return null;

    try {
      const docRef = doc(this.db, collectionName, docId);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            onData(snap.data() as T);
          } else {
            onData(null);
          }
        },
        (err) => {
          console.warn(`Document listener on [${collectionName}/${docId}] error:`, err?.message);
        }
      );
    } catch (e) {
      return null;
    }
  }

  /**
   * Write / Overwrite a document in Firestore.
   */
  async setDocument(collectionName: string, docId: string, data: any): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.syncStatusSubject.next('syncing');
      const docRef = doc(this.db, collectionName, docId);
      // Clean undefined values which Firestore rejects
      const sanitized = JSON.parse(JSON.stringify(data));
      await setDoc(docRef, sanitized, { merge: true });
      this.syncStatusSubject.next('connected');
      this.lastSyncTimeSubject.next(new Date());
      return true;
    } catch (err: any) {
      console.warn(`Firestore setDoc error on [${collectionName}/${docId}]:`, err?.message);
      this.syncStatusSubject.next('offline');
      return false;
    }
  }

  /**
   * Update specific fields in a document.
   */
  async updateDocument(collectionName: string, docId: string, partialData: any): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.syncStatusSubject.next('syncing');
      const docRef = doc(this.db, collectionName, docId);
      const sanitized = JSON.parse(JSON.stringify(partialData));
      await updateDoc(docRef, sanitized);
      this.syncStatusSubject.next('connected');
      this.lastSyncTimeSubject.next(new Date());
      return true;
    } catch (err: any) {
      console.warn(`Firestore updateDoc error on [${collectionName}/${docId}]:`, err?.message);
      return false;
    }
  }

  /**
   * Delete a document in Firestore.
   */
  async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.syncStatusSubject.next('syncing');
      const docRef = doc(this.db, collectionName, docId);
      await deleteDoc(docRef);
      this.syncStatusSubject.next('connected');
      this.lastSyncTimeSubject.next(new Date());
      return true;
    } catch (err: any) {
      console.warn(`Firestore deleteDoc error on [${collectionName}/${docId}]:`, err?.message);
      return false;
    }
  }
}
