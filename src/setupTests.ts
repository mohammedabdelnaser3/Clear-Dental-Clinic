import '@testing-library/jest-dom';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  default: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    custom: jest.fn(),
  },
  error: jest.fn(),
  success: jest.fn(),
  loading: jest.fn(),
  custom: jest.fn(),
  Toaster: jest.fn(() => null),
}));

// Mock import.meta for Vite environment variables
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000/api'
      }
    }
  },
  writable: true
});

// Alternative approach - mock the constants module directly
jest.mock('./config/constants', () => ({
  API_URL: 'http://localhost:3000/api'
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  
  observe() {
    return null;
  }
  
  disconnect() {
    return null;
  }
  
  unobserve() {
    return null;
  }
  
  takeRecords() {
    return [];
  }
} as any;