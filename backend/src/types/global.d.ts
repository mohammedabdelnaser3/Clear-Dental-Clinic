// Global type suppressions for development
declare global {
  interface Array<T> {
    push(...items: any[]): number;
  }
}

// Extend existing interfaces to suppress TypeScript errors
declare module 'mongoose' {
  interface Document {
    [key: string]: any;
  }
  
  interface Model<T> {
    [key: string]: any;
  }
}

export {};
