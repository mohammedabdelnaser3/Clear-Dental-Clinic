import { useEffect, useRef, useCallback, useState } from 'react';
import type { DependencyList } from 'react';

/**
 * Custom hook to handle async operations in useEffect safely
 * Prevents memory leaks and handles cleanup properly
 */
export const useAsyncEffect = (
  asyncFn: () => Promise<void> | void,
  deps: DependencyList,
  cleanup?: () => void
) => {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | undefined>(cleanup);

  // Update cleanup function ref
  cleanupRef.current = cleanup;

  const safeAsyncFn = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        await asyncFn();
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Async effect error:', error);
      }
    }
  }, deps);

  useEffect(() => {
    safeAsyncFn();

    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [safeAsyncFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
};

/**
 * Hook to safely check if component is still mounted
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
};

/**
 * Hook to handle async operations with loading and error states
 */
export const useAsyncOperation = <T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = []
) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const isMounted = useIsMounted();

  const execute = useCallback(async () => {
    if (!isMounted()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFn();
      if (isMounted()) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (error) {
      if (isMounted()) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error : new Error(String(error))
        }));
      }
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
};

export default {
  useAsyncEffect,
  useIsMounted,
  useAsyncOperation
};
