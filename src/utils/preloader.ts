// Preloader utility for critical resources

interface PreloadOptions {
  as?: 'image' | 'font' | 'script' | 'style';
  crossorigin?: 'anonymous' | 'use-credentials';
  type?: string;
}

export const preloadResource = (href: string, options: PreloadOptions = {}) => {
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    
    if (options.as) link.as = options.as;
    if (options.crossorigin) link.crossOrigin = options.crossorigin;
    if (options.type) link.type = options.type;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload ${href}`));
    
    document.head.appendChild(link);
  });
};

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const preloadImages = async (sources: string[]): Promise<HTMLImageElement[]> => {
  try {
    const promises = sources.map(src => preloadImage(src));
    return await Promise.all(promises);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
    return [];
  }
};

// Critical resource preloader for hero section
export const preloadHeroResources = async () => {
  const criticalResources = [
    '/images/image1.jpg',
    '/images/image1.webp', // WebP version if available
  ];
  
  try {
    await preloadImages(criticalResources);
    console.log('Hero resources preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some hero resources:', error);
  }
};

// Font preloader
export const preloadFonts = async (fontUrls: string[]) => {
  const promises = fontUrls.map(url => 
    preloadResource(url, { as: 'font', crossorigin: 'anonymous' })
  );
  
  try {
    await Promise.all(promises);
    console.log('Fonts preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some fonts:', error);
  }
};

// Critical CSS preloader
export const preloadCriticalCSS = async (cssUrls: string[]) => {
  const promises = cssUrls.map(url => 
    preloadResource(url, { as: 'style' })
  );
  
  try {
    await Promise.all(promises);
    console.log('Critical CSS preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some CSS:', error);
  }
};

// Resource hints for better performance
export const addResourceHints = () => {
  // DNS prefetch for external domains
  const dnsPrefetchDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'www.google-analytics.com'
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
  
  // Preconnect to critical domains
  const preconnectDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `https://${domain}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = async () => {
  // Add resource hints
  addResourceHints();
  
  // Preload critical resources
  await Promise.all([
    preloadHeroResources(),
    // Add other critical resource preloading here
  ]);
  
  console.log('Performance optimizations initialized');
};