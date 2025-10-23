import { useState, useCallback, useRef, useEffect } from 'react';
import { logError, logInfo } from '../utils/logger';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  logOperationName?: string;
}

export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
    logOperationName = 'async operation'
  } = options;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    if (!isMountedRef.current) return null;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    const startTime = Date.now();
    logInfo(`Starting ${logOperationName}`);

    try {
      const result = await operation();
      
      if (!isMountedRef.current) return null;

      const duration = Date.now() - startTime;
      logInfo(`${logOperationName} completed successfully`, { duration });

      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      retryCountRef.current = 0;
      onSuccess?.(result);
      
      return result;
    } catch (error) {
      if (!isMountedRef.current) return null;

      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      logError(`${logOperationName} failed`, errorObj, { 
        duration,
        retryAttempt: retryCountRef.current,
        maxRetries: retryCount
      });

      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        logInfo(`Retrying ${logOperationName}`, { 
          attempt: retryCountRef.current, 
          maxRetries: retryCount 
        });
        
        setTimeout(() => {
          if (isMountedRef.current) {
            execute();
          }
        }, retryDelay);
        
        return null;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj
      }));

      onError?.(errorObj);
      return null;
    }
  }, [operation, onSuccess, onError, retryCount, retryDelay, logOperationName]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    execute();
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
    retryCountRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    isRetrying: retryCountRef.current > 0
  };
}

// Specialized hook for data fetching
export function useAsyncData<T = any>(
  fetchFunction: () => Promise<T>,
  options: AsyncOperationOptions & {
    autoFetch?: boolean;
    dependencies?: any[];
  } = {}
) {
  const { autoFetch = true, dependencies = [], ...operationOptions } = options;
  
  const asyncOp = useAsyncOperation(fetchFunction, {
    ...operationOptions,
    logOperationName: operationOptions.logOperationName || 'data fetch'
  });

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch) {
      asyncOp.execute();
    }
  }, [autoFetch, ...dependencies]);

  return asyncOp;
}

// Hook for form submissions
export function useAsyncSubmit<T = any>(
  submitFunction: (data: any) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const dataRef = useRef<any>(null);
  const asyncOp = useAsyncOperation(
    () => submitFunction(dataRef.current),
    {
      ...options,
      logOperationName: options.logOperationName || 'form submission'
    }
  );

  const submit = useCallback(async (data: any): Promise<T | null> => {
    dataRef.current = data;
    return asyncOp.execute();
  }, [asyncOp]);

  return {
    ...asyncOp,
    submit
  };
}

export default useAsyncOperation;