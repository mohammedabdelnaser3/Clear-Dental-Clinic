/**
 * Cache Manager for profile data and API responses
 * Implements memory and localStorage caching with TTL support
 */

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  storage?: 'memory' | 'localStorage' | 'both';
  maxSize?: number; // Maximum number of items in memory cache
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxMemorySize = 100;

  /**
   * Set an item in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param options - Cache options
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = this.defaultTTL,
      storage = 'both',
      maxSize = this.maxMemorySize
    } = options;

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    // Store in memory cache
    if (storage === 'memory' || storage === 'both') {
      // Remove oldest items if cache is full
      if (this.memoryCache.size >= maxSize) {
        const oldestKey = this.memoryCache.keys().next().value;
        if (oldestKey) {
          this.memoryCache.delete(oldestKey);
        }
      }
      this.memoryCache.set(key, cacheItem);
    }

    // Store in localStorage
    if (storage === 'localStorage' || storage === 'both') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
    }
  }

  /**
   * Get an item from cache
   * @param key - Cache key
   * @param options - Cache options
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const { storage = 'both' } = options;

    // Try memory cache first
    if (storage === 'memory' || storage === 'both') {
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && this.isValid(memoryItem)) {
        return memoryItem.data as T;
      }
      if (memoryItem) {
        this.memoryCache.delete(key); // Remove expired item
      }
    }

    // Try localStorage
    if (storage === 'localStorage' || storage === 'both') {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const cacheItem: CacheItem<T> = JSON.parse(stored);
          if (this.isValid(cacheItem)) {
            // Restore to memory cache if using both
            if (storage === 'both') {
              this.memoryCache.set(key, cacheItem);
            }
            return cacheItem.data;
          } else {
            localStorage.removeItem(`cache_${key}`); // Remove expired item
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    return null;
  }

  /**
   * Check if a cache item is still valid
   * @param item - Cache item to check
   * @returns True if valid, false if expired
   */
  private isValid(item: CacheItem): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Remove an item from cache
   * @param key - Cache key to remove
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clear all cache items
   * @param storage - Which storage to clear
   */
  clear(storage: 'memory' | 'localStorage' | 'both' = 'both'): void {
    if (storage === 'memory' || storage === 'both') {
      this.memoryCache.clear();
    }

    if (storage === 'localStorage' || storage === 'both') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns Object with cache statistics
   */
  getStats(): {
    memorySize: number;
    localStorageSize: number;
    memoryKeys: string[];
    localStorageKeys: string[];
  } {
    const localStorageKeys: string[] = [];
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorageKeys.push(key.replace('cache_', ''));
        }
      });
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize: localStorageKeys.length,
      memoryKeys: Array.from(this.memoryCache.keys()),
      localStorageKeys
    };
  }

  /**
   * Clean up expired items from both caches
   */
  cleanup(): void {
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValid(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const cacheItem: CacheItem = JSON.parse(stored);
              if (!this.isValid(cacheItem)) {
                localStorage.removeItem(key);
              }
            }
          } catch (_error) {
            // Remove corrupted items
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Profile-specific cache utilities
export const profileCache = {
  /**
   * Cache dentist profile data
   * @param dentistId - Dentist ID
   * @param data - Profile data
   */
  setDentistProfile: (dentistId: string, data: any) => {
    cacheManager.set(`dentist_profile_${dentistId}`, data, {
      ttl: 10 * 60 * 1000, // 10 minutes for profile data
      storage: 'both'
    });
  },

  /**
   * Get cached dentist profile data
   * @param dentistId - Dentist ID
   * @returns Cached profile data or null
   */
  getDentistProfile: (dentistId: string) => {
    return cacheManager.get(`dentist_profile_${dentistId}`);
  },

  /**
   * Cache patient profile data
   * @param patientId - Patient ID
   * @param data - Profile data
   */
  setPatientProfile: (patientId: string, data: any) => {
    cacheManager.set(`patient_profile_${patientId}`, data, {
      ttl: 10 * 60 * 1000, // 10 minutes for profile data
      storage: 'both'
    });
  },

  /**
   * Get cached patient profile data
   * @param patientId - Patient ID
   * @returns Cached profile data or null
   */
  getPatientProfile: (patientId: string) => {
    return cacheManager.get(`patient_profile_${patientId}`);
  },

  /**
   * Cache appointments data
   * @param userId - User ID
   * @param data - Appointments data
   */
  setAppointments: (userId: string, data: any) => {
    cacheManager.set(`appointments_${userId}`, data, {
      ttl: 2 * 60 * 1000, // 2 minutes for appointments (more dynamic)
      storage: 'memory' // Only memory for frequently changing data
    });
  },

  /**
   * Get cached appointments data
   * @param userId - User ID
   * @returns Cached appointments data or null
   */
  getAppointments: (userId: string) => {
    return cacheManager.get(`appointments_${userId}`);
  },

  /**
   * Cache clinic data
   * @param clinicId - Clinic ID
   * @param data - Clinic data
   */
  setClinic: (clinicId: string, data: any) => {
    cacheManager.set(`clinic_${clinicId}`, data, {
      ttl: 30 * 60 * 1000, // 30 minutes for clinic data (relatively static)
      storage: 'both'
    });
  },

  /**
   * Get cached clinic data
   * @param clinicId - Clinic ID
   * @returns Cached clinic data or null
   */
  getClinic: (clinicId: string) => {
    return cacheManager.get(`clinic_${clinicId}`);
  },

  /**
   * Invalidate user-related caches
   * @param userId - User ID
   */
  invalidateUserCaches: (userId: string) => {
    cacheManager.remove(`dentist_profile_${userId}`);
    cacheManager.remove(`patient_profile_${userId}`);
    cacheManager.remove(`appointments_${userId}`);
  },

  /**
   * Clear all profile caches
   */
  clearAll: () => {
    cacheManager.clear();
  }
};

// Auto cleanup every 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);

export default cacheManager;
export { cacheManager };