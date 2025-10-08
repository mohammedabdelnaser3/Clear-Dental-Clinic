/**
 * React utilities for better component handling and avoiding common warnings
 */
import React from 'react';

/**
 * Generates a stable key for React list items
 * Helps avoid "Each child in a list should have a unique key prop" warnings
 */
export const generateKey = (item: any, index: number, prefix: string = 'item'): string => {
  // Try to use a unique identifier from the item
  if (item && typeof item === 'object') {
    if (item.id) return `${prefix}-${item.id}`;
    if (item._id) return `${prefix}-${item._id}`;
    if (item.key) return `${prefix}-${item.key}`;
    if (item.uuid) return `${prefix}-${item.uuid}`;
  }
  
  // Fallback to index with prefix
  return `${prefix}-${index}`;
};

/**
 * Safe key generator for arrays of primitives
 */
export const generatePrimitiveKey = (value: string | number, index: number, prefix: string = 'item'): string => {
  return `${prefix}-${value}-${index}`;
};

/**
 * Memoized component wrapper to prevent unnecessary re-renders
 */
export const withMemo = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  areEqual?: (prevProps: T, nextProps: T) => boolean
) => {
  return React.memo(Component, areEqual);
};

/**
 * Safe props spreader that filters out undefined values
 */
export const safeProps = <T extends Record<string, any>>(props: T): Partial<T> => {
  const filtered = {} as Partial<T>;
  
  Object.keys(props).forEach(key => {
    const value = props[key];
    if (value !== undefined && value !== null) {
      filtered[key as keyof T] = value;
    }
  });
  
  return filtered;
};

/**
 * Component display name helper for better debugging
 */
export const setDisplayName = (Component: React.ComponentType<any>, name: string) => {
  Component.displayName = name;
  return Component;
};

/**
 * Safe event handler that prevents default and stops propagation
 */
export const createSafeHandler = (
  handler: (event?: React.SyntheticEvent) => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
) => {
  return (event: React.SyntheticEvent) => {
    if (options.preventDefault) {
      event.preventDefault();
    }
    if (options.stopPropagation) {
      event.stopPropagation();
    }
    
    try {
      handler(event);
    } catch (error) {
      console.error('Event handler error:', error);
    }
  };
};

/**
 * Debounced state setter to prevent excessive updates
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] => {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return [value, setValue, debouncedValue];
};

/**
 * Safe array renderer that handles empty arrays and provides keys
 */
export const renderArray = <T>(
  array: T[] | undefined | null,
  renderItem: (item: T, index: number) => React.ReactNode,
  options: {
    keyPrefix?: string;
    emptyMessage?: React.ReactNode;
    keyExtractor?: (item: T, index: number) => string;
  } = {}
): React.ReactNode => {
  if (!array || array.length === 0) {
    return options.emptyMessage || null;
  }
  
  return array.map((item, index) => {
    const key = options.keyExtractor 
      ? options.keyExtractor(item, index)
      : generateKey(item, index, options.keyPrefix);
    
    return React.createElement(
      React.Fragment,
      { key },
      renderItem(item, index)
    );
  });
};

/**
 * Conditional class name helper
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export default {
  generateKey,
  generatePrimitiveKey,
  withMemo,
  safeProps,
  setDisplayName,
  createSafeHandler,
  useDebouncedState,
  renderArray,
  cn
};
