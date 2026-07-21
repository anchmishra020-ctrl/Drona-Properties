/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SafeStorage {
  private memoryStore: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return this.memoryStore[key] || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      this.memoryStore[key] = value;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete this.memoryStore[key];
    }
  }
}

export const safeStorage = new SafeStorage();
