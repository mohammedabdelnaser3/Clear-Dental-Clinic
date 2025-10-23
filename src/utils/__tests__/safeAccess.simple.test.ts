/**
 * Simplified tests for safe access utilities
 * Focuses on core functionality without complex mocking
 */

import {
  safeAccess,
  isValidArray,
  safeArrayAccess,
  safeArrayLength,
  exists,
  getDefaultValue
} from '../safeAccess';

describe('Safe Access Utilities', () => {
  const testObject = {
    user: {
      profile: {
        name: 'John Doe',
        age: 30
      }
    },
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  };

  describe('safeAccess', () => {
    it('should access nested properties safely', () => {
      expect(safeAccess(testObject, 'user.profile.name')).toBe('John Doe');
      expect(safeAccess(testObject, 'user.profile.age')).toBe(30);
    });

    it('should return fallback for non-existent paths', () => {
      expect(safeAccess(testObject, 'user.profile.nonexistent')).toBeUndefined();
      expect(safeAccess(testObject, 'user.profile.nonexistent', { fallback: 'default' })).toBe('default');
    });

    it('should handle null/undefined objects', () => {
      expect(safeAccess(null, 'user.name')).toBeUndefined();
      expect(safeAccess(undefined, 'user.name')).toBeUndefined();
      expect(safeAccess(null, 'user.name', { fallback: 'default' })).toBe('default');
    });

    it('should handle invalid object types', () => {
      expect(safeAccess('string', 'property')).toBeUndefined();
      expect(safeAccess(123, 'property')).toBeUndefined();
    });
  });

  describe('isValidArray', () => {
    it('should return true for valid arrays', () => {
      expect(isValidArray([])).toBe(true);
      expect(isValidArray([1, 2, 3])).toBe(true);
    });

    it('should return false for invalid arrays', () => {
      expect(isValidArray(null)).toBe(false);
      expect(isValidArray(undefined)).toBe(false);
      expect(isValidArray('string')).toBe(false);
      expect(isValidArray({})).toBe(false);
    });
  });

  describe('safeArrayAccess', () => {
    const testArray = ['a', 'b', 'c'];

    it('should access valid array indices', () => {
      expect(safeArrayAccess(testArray, 0)).toBe('a');
      expect(safeArrayAccess(testArray, 1)).toBe('b');
      expect(safeArrayAccess(testArray, 2)).toBe('c');
    });

    it('should return fallback for invalid indices', () => {
      expect(safeArrayAccess(testArray, -1)).toBeUndefined();
      expect(safeArrayAccess(testArray, 5)).toBeUndefined();
      expect(safeArrayAccess(testArray, -1, 'fallback')).toBe('fallback');
    });

    it('should handle invalid arrays', () => {
      expect(safeArrayAccess(null, 0)).toBeUndefined();
      expect(safeArrayAccess('string', 0)).toBeUndefined();
      expect(safeArrayAccess(null, 0, 'fallback')).toBe('fallback');
    });
  });

  describe('safeArrayLength', () => {
    it('should return correct length for valid arrays', () => {
      expect(safeArrayLength([])).toBe(0);
      expect(safeArrayLength([1, 2, 3])).toBe(3);
    });

    it('should return fallback for invalid arrays', () => {
      expect(safeArrayLength(null)).toBe(0);
      expect(safeArrayLength(undefined)).toBe(0);
      expect(safeArrayLength('string')).toBe(0);
      expect(safeArrayLength(null, 5)).toBe(5);
    });
  });

  describe('exists', () => {
    it('should return true for existing values', () => {
      expect(exists('string')).toBe(true);
      expect(exists(0)).toBe(true);
      expect(exists(false)).toBe(true);
      expect(exists([])).toBe(true);
      expect(exists({})).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(exists(null)).toBe(false);
      expect(exists(undefined)).toBe(false);
    });
  });

  describe('getDefaultValue', () => {
    it('should return correct default values', () => {
      expect(getDefaultValue('string')).toBe('');
      expect(getDefaultValue('number')).toBe(0);
      expect(getDefaultValue('boolean')).toBe(false);
      expect(getDefaultValue('array')).toEqual([]);
      expect(getDefaultValue('object')).toEqual({});
    });
  });
});