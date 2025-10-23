/**
 * Tests for safe access utilities
 * Covers all safe property access and array validation helpers
 */

import {
  safeAccess,
  safeGet,
  isValidArray,
  safeArrayAccess,
  safeArrayLength,
  safeArrayMap,
  safeArrayFilter,
  safeArrayFind,
  validateResponseStructure,
  safeJsonParse,
  safeJsonStringify,
  exists,
  getDefaultValue
} from '../safeAccess';

describe('safeAccess', () => {
  const testObject = {
    user: {
      profile: {
        name: 'John Doe',
        age: 30,
        settings: {
          theme: 'dark'
        }
      },
      contacts: ['email@test.com', 'phone@test.com']
    },
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  };

  describe('basic property access', () => {
    it('should access nested properties with string path', () => {
      expect(safeAccess(testObject, 'user.profile.name')).toBe('John Doe');
      expect(safeAccess(testObject, 'user.profile.age')).toBe(30);
      expect(safeAccess(testObject, 'user.profile.settings.theme')).toBe('dark');
    });

    it('should access nested properties with array path', () => {
      expect(safeAccess(testObject, ['user', 'profile', 'name'])).toBe('John Doe');
      expect(safeAccess(testObject, ['user', 'profile', 'settings', 'theme'])).toBe('dark');
    });

    it('should return fallback for non-existent paths', () => {
      expect(safeAccess(testObject, 'user.profile.nonexistent')).toBeUndefined();
      expect(safeAccess(testObject, 'user.profile.nonexistent', { fallback: 'default' })).toBe('default');
      expect(safeAccess(testObject, 'nonexistent.path', { fallback: null })).toBe(null);
    });

    it('should handle null/undefined objects', () => {
      expect(safeAccess(null, 'user.name')).toBeUndefined();
      expect(safeAccess(undefined, 'user.name')).toBeUndefined();
      expect(safeAccess(null, 'user.name', { fallback: 'default' })).toBe('default');
    });

    it('should handle invalid object types', () => {
      expect(safeAccess('string', 'property')).toBeUndefined();
      expect(safeAccess(123, 'property')).toBeUndefined();
      expect(safeAccess(true, 'property')).toBeUndefined();
    });

    it('should log errors when logError is true', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      safeAccess(null, 'user.name', { logError: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        'safeAccess: Invalid object provided',
        { obj: null, path: 'user.name' }
      );
      
      safeAccess(testObject, 'user.nonexistent.deep', { logError: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        'safeAccess: Path not found',
        expect.objectContaining({ path: 'user.nonexistent.deep' })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle circular references gracefully', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      // This should not throw an error
      expect(() => safeAccess(circularObj, 'name')).not.toThrow();
      expect(safeAccess(circularObj, 'name')).toBe('test');
    });

    it('should handle getter properties that throw errors', () => {
      const errorObj = {
        get throwingProperty() {
          throw new Error('Property access error');
        }
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(safeAccess(errorObj, 'throwingProperty')).toBeUndefined();
      expect(safeAccess(errorObj, 'throwingProperty', { fallback: 'safe' })).toBe('safe');
      
      consoleErrorSpy.mockRestore();
    });
  });
});

describe('safeGet', () => {
  const testObject = {
    user: {
      name: 'John',
      profile: null
    }
  };

  it('should safely access properties using accessor function', () => {
    expect(safeGet(testObject, obj => obj.user.name)).toBe('John');
    expect(safeGet(testObject, obj => obj.user.profile?.settings, 'default')).toBe('default');
  });

  it('should handle null/undefined objects', () => {
    expect(safeGet(null, obj => obj.user.name)).toBeUndefined();
    expect(safeGet(null, obj => obj.user.name, 'fallback')).toBe('fallback');
  });

  it('should handle accessor function errors', () => {
    expect(safeGet(testObject, obj => obj.nonexistent.property)).toBeUndefined();
    expect(safeGet(testObject, obj => obj.nonexistent.property, 'safe')).toBe('safe');
  });
});

describe('isValidArray', () => {
  it('should return true for valid arrays', () => {
    expect(isValidArray([])).toBe(true);
    expect(isValidArray([1, 2, 3])).toBe(true);
    expect(isValidArray(['a', 'b'])).toBe(true);
  });

  it('should return false for invalid arrays', () => {
    expect(isValidArray(null)).toBe(false);
    expect(isValidArray(undefined)).toBe(false);
    expect(isValidArray('string')).toBe(false);
    expect(isValidArray(123)).toBe(false);
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
    expect(safeArrayLength(['a'])).toBe(1);
  });

  it('should return fallback for invalid arrays', () => {
    expect(safeArrayLength(null)).toBe(0);
    expect(safeArrayLength(undefined)).toBe(0);
    expect(safeArrayLength('string')).toBe(0);
    expect(safeArrayLength(null, 5)).toBe(5);
  });
});

describe('safeArrayMap', () => {
  const testArray = [1, 2, 3];
  const mapper = (x: number) => x * 2;

  it('should map valid arrays', () => {
    expect(safeArrayMap(testArray, mapper)).toEqual([2, 4, 6]);
    expect(safeArrayMap(['a', 'b'], (x: string) => x.toUpperCase())).toEqual(['A', 'B']);
  });

  it('should return fallback for invalid arrays', () => {
    expect(safeArrayMap(null, mapper)).toEqual([]);
    expect(safeArrayMap(undefined, mapper)).toEqual([]);
    expect(safeArrayMap(null, mapper, [99])).toEqual([99]);
  });

  it('should handle mapper function errors', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorMapper = () => { throw new Error('Mapper error'); };
    
    expect(safeArrayMap(testArray, errorMapper)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'safeArrayMap: Error during mapping',
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });
});

describe('safeArrayFilter', () => {
  const testArray = [1, 2, 3, 4, 5];
  const predicate = (x: number) => x > 3;

  it('should filter valid arrays', () => {
    expect(safeArrayFilter(testArray, predicate)).toEqual([4, 5]);
    expect(safeArrayFilter(['a', 'bb', 'ccc'], (x: string) => x.length > 1)).toEqual(['bb', 'ccc']);
  });

  it('should return fallback for invalid arrays', () => {
    expect(safeArrayFilter(null, predicate)).toEqual([]);
    expect(safeArrayFilter(undefined, predicate)).toEqual([]);
    expect(safeArrayFilter(null, predicate, [99])).toEqual([99]);
  });

  it('should handle predicate function errors', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorPredicate = () => { throw new Error('Predicate error'); };
    
    expect(safeArrayFilter(testArray, errorPredicate)).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'safeArrayFilter: Error during filtering',
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });
});

describe('safeArrayFind', () => {
  const testArray = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
  const predicate = (x: any) => x.id === 2;

  it('should find elements in valid arrays', () => {
    expect(safeArrayFind(testArray, predicate)).toEqual({ id: 2, name: 'b' });
    expect(safeArrayFind(testArray, (x: any) => x.id === 99)).toBeUndefined();
  });

  it('should return fallback for invalid arrays', () => {
    expect(safeArrayFind(null, predicate)).toBeUndefined();
    expect(safeArrayFind(null, predicate, 'fallback')).toBe('fallback');
  });

  it('should handle predicate function errors', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorPredicate = () => { throw new Error('Find error'); };
    
    expect(safeArrayFind(testArray, errorPredicate)).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'safeArrayFind: Error during search',
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });
});

describe('validateResponseStructure', () => {
  it('should validate correct response structures', () => {
    const response = {
      data: [1, 2, 3],
      message: 'success',
      count: 3
    };
    
    const structure = {
      data: 'array',
      message: 'string',
      count: 'number'
    };
    
    expect(validateResponseStructure(response, structure)).toBe(true);
  });

  it('should reject invalid response structures', () => {
    const response = {
      data: 'not an array',
      message: 123,
      count: 'not a number'
    };
    
    const structure = {
      data: 'array',
      message: 'string',
      count: 'number'
    };
    
    expect(validateResponseStructure(response, structure)).toBe(false);
  });

  it('should handle null/undefined responses', () => {
    expect(validateResponseStructure(null, { data: 'array' })).toBe(false);
    expect(validateResponseStructure(undefined, { data: 'array' })).toBe(false);
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON strings', () => {
    expect(safeJsonParse('{"name": "test"}')).toEqual({ name: 'test' });
    expect(safeJsonParse('[1, 2, 3]')).toEqual([1, 2, 3]);
    expect(safeJsonParse('null')).toBe(null);
  });

  it('should return fallback for invalid JSON', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    expect(safeJsonParse('invalid json')).toBeUndefined();
    expect(safeJsonParse('invalid json', 'default')).toBe('default');
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });
});

describe('safeJsonStringify', () => {
  it('should stringify valid objects', () => {
    expect(safeJsonStringify({ name: 'test' })).toBe('{"name":"test"}');
    expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
    expect(safeJsonStringify(null)).toBe('null');
  });

  it('should return fallback for unstringifiable objects', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const circularObj: any = {};
    circularObj.self = circularObj;
    
    expect(safeJsonStringify(circularObj)).toBe('{}');
    expect(safeJsonStringify(circularObj, '{"error": true}')).toBe('{"error": true}');
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
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
  it('should return correct default values for each type', () => {
    expect(getDefaultValue('string')).toBe('');
    expect(getDefaultValue('number')).toBe(0);
    expect(getDefaultValue('boolean')).toBe(false);
    expect(getDefaultValue('array')).toEqual([]);
    expect(getDefaultValue('object')).toEqual({});
  });

  it('should return null for unknown types', () => {
    expect(getDefaultValue('unknown' as any)).toBe(null);
  });
});