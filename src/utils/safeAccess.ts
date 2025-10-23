/**
 * Safe data access utilities
 * Provides safe property access and array validation helpers
 */

export interface SafeAccessOptions {
  fallback?: any;
  logError?: boolean;
}

/**
 * Safely access nested properties in an object
 * @param obj - The object to access
 * @param path - The property path (e.g., 'user.profile.name' or ['user', 'profile', 'name'])
 * @param options - Configuration options
 * @returns The value at the path or the fallback value
 */
export function safeAccess<T = any>(
  obj: any,
  path: string | string[],
  options: SafeAccessOptions = {}
): T | undefined {
  const { fallback, logError = false } = options;
  
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
    if (logError) {
      console.warn('safeAccess: Invalid object provided', { obj, path });
    }
    return fallback;
  }
  
  try {
    const pathArray = Array.isArray(path) ? path : path.split('.');
    let current = obj;
    
    for (const key of pathArray) {
      if (current == null || typeof current !== 'object') {
        if (logError) {
          console.warn('safeAccess: Path not found', { path, key, current });
        }
        return fallback;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : fallback;
  } catch (error) {
    if (logError) {
      console.error('safeAccess: Error accessing path', { path, error });
    }
    return fallback;
  }
}

/**
 * Safely get a property with optional chaining fallback
 * @param obj - The object to access
 * @param accessor - Function that accesses the property
 * @param fallback - Fallback value if access fails
 * @returns The accessed value or fallback
 */
export function safeGet<T = any>(
  obj: any,
  accessor: (obj: any) => T,
  fallback?: T
): T | undefined {
  try {
    if (!obj) return fallback;
    const result = accessor(obj);
    return result !== undefined && result !== null ? result : fallback;
  } catch (_error) {
    return fallback;
  }
}

/**
 * Check if a value is a valid array
 * @param value - The value to check
 * @returns True if the value is a valid array
 */
export function isValidArray(value: any): value is any[] {
  return Array.isArray(value) && value !== null && value !== undefined;
}

/**
 * Safely access array elements with bounds checking
 * @param array - The array to access
 * @param index - The index to access
 * @param fallback - Fallback value if access fails
 * @returns The array element or fallback
 */
export function safeArrayAccess<T = any>(
  array: any,
  index: number,
  fallback?: T
): T | undefined {
  if (!isValidArray(array)) {
    return fallback;
  }
  
  if (index < 0 || index >= array.length) {
    return fallback;
  }
  
  return array[index] !== undefined ? array[index] : fallback;
}

/**
 * Safely get array length
 * @param array - The array to check
 * @param fallback - Fallback length (default: 0)
 * @returns The array length or fallback
 */
export function safeArrayLength(array: any, fallback: number = 0): number {
  return isValidArray(array) ? array.length : fallback;
}

/**
 * Safely map over an array
 * @param array - The array to map
 * @param mapper - The mapping function
 * @param fallback - Fallback array if input is invalid
 * @returns Mapped array or fallback
 */
export function safeArrayMap<T, R>(
  array: any,
  mapper: (item: T, index: number) => R,
  fallback: R[] = []
): R[] {
  if (!isValidArray(array)) {
    return fallback;
  }
  
  try {
    return array.map(mapper);
  } catch (error) {
    console.warn('safeArrayMap: Error during mapping', error);
    return fallback;
  }
}

/**
 * Safely filter an array
 * @param array - The array to filter
 * @param predicate - The filter predicate
 * @param fallback - Fallback array if input is invalid
 * @returns Filtered array or fallback
 */
export function safeArrayFilter<T>(
  array: any,
  predicate: (item: T, index: number) => boolean,
  fallback: T[] = []
): T[] {
  if (!isValidArray(array)) {
    return fallback;
  }
  
  try {
    return array.filter(predicate);
  } catch (error) {
    console.warn('safeArrayFilter: Error during filtering', error);
    return fallback;
  }
}

/**
 * Safely find an element in an array
 * @param array - The array to search
 * @param predicate - The search predicate
 * @param fallback - Fallback value if not found
 * @returns Found element or fallback
 */
export function safeArrayFind<T>(
  array: any,
  predicate: (item: T, index: number) => boolean,
  fallback?: T
): T | undefined {
  if (!isValidArray(array)) {
    return fallback;
  }
  
  try {
    const result = array.find(predicate);
    return result !== undefined ? result : fallback;
  } catch (error) {
    console.warn('safeArrayFind: Error during search', error);
    return fallback;
  }
}

/**
 * Validate that a response has the expected structure
 * @param response - The response to validate
 * @param expectedStructure - Object describing expected structure
 * @returns True if structure is valid
 */
export function validateResponseStructure(
  response: any,
  expectedStructure: Record<string, string>
): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  for (const [key, type] of Object.entries(expectedStructure)) {
    const value = safeAccess(response, key);
    
    if (type === 'array' && !isValidArray(value)) {
      return false;
    }
    
    if (type !== 'array' && typeof value !== type) {
      return false;
    }
  }
  
  return true;
}

/**
 * Safely parse JSON with fallback
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = any>(
  jsonString: string,
  fallback?: T
): T | undefined {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('safeJsonParse: Failed to parse JSON', { jsonString, error });
    return fallback;
  }
}

/**
 * Safely stringify an object
 * @param obj - The object to stringify
 * @param fallback - Fallback string if stringification fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('safeJsonStringify: Failed to stringify object', { obj, error });
    return fallback;
  }
}

/**
 * Check if a value exists and is not null/undefined
 * @param value - The value to check
 * @returns True if value exists
 */
export function exists(value: any): boolean {
  return value !== null && value !== undefined;
}

/**
 * Get a safe default value based on type
 * @param type - The expected type
 * @returns Default value for the type
 */
export function getDefaultValue(type: 'string' | 'number' | 'boolean' | 'array' | 'object'): any {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}