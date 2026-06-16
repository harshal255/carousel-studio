import { SavedDraft } from '../types';

class DraftDB {
  private dbName = 'CarouselStudioDB';
  private activeStore = 'active_draft';
  private listStore = 'saved_drafts';

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.activeStore)) {
          db.createObjectStore(this.activeStore);
        }
        if (!db.objectStoreNames.contains(this.listStore)) {
          db.createObjectStore(this.listStore);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveActive(state: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.activeStore, 'readwrite');
      const store = tx.objectStore(this.activeStore);
      store.put(state, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getActive(): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.activeStore, 'readonly');
      const store = tx.objectStore(this.activeStore);
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async clearActive(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.activeStore, 'readwrite');
      const store = tx.objectStore(this.activeStore);
      store.delete('current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveDraft(draft: SavedDraft): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.listStore, 'readwrite');
      const store = tx.objectStore(this.listStore);
      store.put(draft, draft.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSavedDrafts(): Promise<SavedDraft[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.listStore, 'readonly');
      const store = tx.objectStore(this.listStore);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as SavedDraft[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteDraft(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.listStore, 'readwrite');
      const store = tx.objectStore(this.listStore);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getDraft(id: string): Promise<SavedDraft | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.listStore, 'readonly');
      const store = tx.objectStore(this.listStore);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const draftDb = new DraftDB();

