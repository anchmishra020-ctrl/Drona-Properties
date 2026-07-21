/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property } from '../types';
import { safeStorage } from './storage';

const DB_NAME = 'real_estate_inventory_db';
const DB_VERSION = 1;
const STORE_NAME = 'properties';

// Seed data is now empty to start with a fresh, clean database
const SEED_PROPERTIES: Property[] = [];

class PropertyDB {
  private db: IDBDatabase | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event);
        reject(new Error('Failed to open database'));
      };
    });
  }

  async getAllProperties(): Promise<Property[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          let properties = request.result as Property[];
          // Filter out any old seed data
          properties = properties.filter((p) => !p.id.startsWith('seed-'));

          if (properties.length === 0) {
            // First time seeding
            this.seedDatabase().then((seeded) => resolve(seeded.filter((p) => !p.id.startsWith('seed-')))).catch(reject);
          } else {
            // Sort by creation date descending
            properties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(properties);
          }
        };

        request.onerror = () => reject(new Error('Failed to get properties'));
      });
    } catch (e) {
      console.warn('Falling back to local storage due to IndexedDB error:', e);
      const local = safeStorage.getItem(STORE_NAME);
      if (local) {
        try {
          const parsed = JSON.parse(local) as Property[];
          return parsed.filter((p) => !p.id.startsWith('seed-'));
        } catch (err) {
          return [];
        }
      }
      safeStorage.setItem(STORE_NAME, JSON.stringify(SEED_PROPERTIES));
      return SEED_PROPERTIES;
    }
  }

  private async seedDatabase(): Promise<Property[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      SEED_PROPERTIES.forEach((prop) => store.put(prop));

      transaction.oncomplete = () => {
        resolve(SEED_PROPERTIES);
      };

      transaction.onerror = () => {
        reject(new Error('Failed to seed database'));
      };
    });
  }

  async addProperty(property: Omit<Property, 'id' | 'createdAt'>): Promise<Property> {
    const newProperty: Property = {
      ...property,
      id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(newProperty);

        request.onsuccess = () => resolve(newProperty);
        request.onerror = () => reject(new Error('Failed to add property'));
      });
    } catch (e) {
      const props = await this.getAllProperties();
      props.unshift(newProperty);
      safeStorage.setItem(STORE_NAME, JSON.stringify(props));
      return newProperty;
    }
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    try {
      const db = await this.initDB();
      const current = await this.getPropertyById(id);
      if (!current) throw new Error('Property not found');

      const updated: Property = { ...current, ...updates };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(updated);

        request.onsuccess = () => resolve(updated);
        request.onerror = () => reject(new Error('Failed to update property'));
      });
    } catch (e) {
      const props = await this.getAllProperties();
      const idx = props.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Property not found');
      props[idx] = { ...props[idx], ...updates };
      safeStorage.setItem(STORE_NAME, JSON.stringify(props));
      return props[idx];
    }
  }

  async deleteProperty(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete property'));
      });
    } catch (e) {
      let props = await this.getAllProperties();
      props = props.filter((p) => p.id !== id);
      safeStorage.setItem(STORE_NAME, JSON.stringify(props));
    }
  }

  async clearAllData(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          safeStorage.removeItem(STORE_NAME);
          resolve();
        };
        request.onerror = () => reject(new Error('Failed to clear properties database'));
      });
    } catch (e) {
      safeStorage.removeItem(STORE_NAME);
    }
  }

  private async getPropertyById(id: string): Promise<Property | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to fetch property'));
    });
  }
}

export const propertyDb = new PropertyDB();
