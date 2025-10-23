import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui';
import OptimizedImage from '../ui/OptimizedImage';
import { HeroSkeleton, LoadingOverlay } from '../ui/LoadingStates';
import { usePerformanceMonitor, useCoreWebVitals } from '../../hooks/usePerformanceMonitor';
import {
  Calendar,
  ArrowRight,
  PlayCircle,
  Heart,
  CheckCircle,
  Shield,
  Award,
  Star,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'
import { trackEvent } from '../../utils/analytics'

interface HeroSectionProps {
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const navigate = useNavigate()
  
  // Performance monitoring
  const { measureInteraction } = usePerformanceMonitor('HeroSection');
  useCoreWebVitals();

  useEffect(() => {
    setIsLoaded(true);
    measureInteraction('component_mounted');
  }, [measureInteraction]);

  // Memoize particle positions for better performance
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3
    })), []
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    // Throttle mouse move events for better performance
    requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    });
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    measureInteraction('hero_image_loaded');
    trackEvent('hero_image_loaded')
  };

  const handleCTAClick = (action: 'book' | 'learn_more' | 'book_appointment' | 'watch_story') => {
    setIsBookDialogOpen(action === 'book')
    trackEvent('hero_cta_click', { action })
    if (action === 'book') {
      navigate('/appointments/create')
    } else {
      navigate('/services')
    }
  };

  return (
    <LoadingOverlay isLoading={!isLoaded && !imageLoaded} fallback={<HeroSkeleton />}>
      <section 
        className={`relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 md:py-32 overflow-hidden ${className}`} 
        role="banner"
        onMouseMove={handleMouseMove}
        style={{ willChange: 'transform' }}
      >
      {/* Enhanced Background Pattern with Animated Particles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-indigo-600/20 animate-pulse"></div>

      {/* Enhanced Floating Elements with Interactive Animation */}
      <div 
        className="absolute top-20 left-10 w-20 h-20 bg-blue-400 rounded-full opacity-20 transition-all duration-1000 ease-out"
        style={{ 
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
          animation: 'float 4s ease-in-out infinite'
        }}
      ></div>
      <div 
        className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400 rounded-full opacity-20 transition-all duration-1000 ease-out"
        style={{ 
          transform: `translate(${-mousePosition.x * 15}px, ${-mousePosition.y * 15}px)`,
          animation: 'float 5s ease-in-out infinite 1s'
        }}
      ></div>
      <div 
        className="absolute top-1/3 right-1/4 w-16 h-16 bg-cyan-400 rounded-full opacity-15 transition-all duration-1000 ease-out"
        style={{ 
          transform: `translate(${mousePosition.x * 25}px, ${-mousePosition.y * 25}px)`,
          animation: 'float 3.5s ease-in-out infinite 2s'
        }}
      ></div>
      <div 
        className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-purple-400 rounded-full opacity-15 transition-all duration-1000 ease-out"
        style={{ 
          transform: `translate(${-mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
          animation: 'float 4.5s ease-in-out infinite 1.5s'
        }}
      ></div>

      {/* Additional Sparkle Elements */}
      <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-yellow-300 rounded-full opacity-40 animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-pink-300 rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-2/3 left-1/5 w-4 h-4 bg-green-300 rounded-full opacity-30 animate-ping" style={{ animationDelay: '2.5s' }}></div>

      {/* Optimized Particle Animation Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              willChange: 'opacity'
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Split-Screen Layout */}
        <div className="flex flex-col lg:flex-row items-center gap-12 min-h-[600px]">
          
          {/* Left Side - Content */}
          <div className={`lg:w-1/2 text-center lg:text-left space-y-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Trust Badge with Enhanced Animation */}
            <div className={`inline-flex items-center bg-blue-500/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-105 ${isLoaded ? 'animate-fade-in animate-delay-200' : ''}`}>
              <Heart className="w-5 h-5 text-red-400 mr-3 animate-pulse" />
              <Sparkles className="w-4 h-4 text-yellow-300 mr-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="text-blue-100 text-sm font-medium">Serving Fayoum & Attsa communities since 2015</span>
            </div>

            {/* Enhanced Typography Hierarchy with Staggered Animation */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                <span className={`block mb-2 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.3s' }}>
                  Advanced Dental Care
                </span>
                <span className={`block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-100 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.5s' }}>
                  <span className="inline-block animate-pulse">With Laser Technology</span>
                </span>
              </h1>

              <p className={`text-xl md:text-2xl text-blue-100 leading-relaxed max-w-2xl mx-auto lg:mx-0 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.7s' }}>
                Experience exceptional dental care at Clear Dental Centers with state-of-the-art laser technology, 
                expert specialists, and personalized treatment plans tailored to your needs.
              </p>
            </div>

            {/* Enhanced Call-to-Action Buttons with Advanced Interactions */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.9s' }}>
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 group relative overflow-hidden"
                onClick={() => handleCTAClick('book_appointment')}
                onMouseEnter={(e) => {
                  // Optimized ripple effect with requestAnimationFrame
                  requestAnimationFrame(() => {
                    const ripple = document.createElement('span');
                    ripple.className = 'absolute inset-0 bg-blue-100 rounded-lg opacity-30 animate-ping';
                    e.currentTarget.appendChild(ripple);
                    setTimeout(() => {
                      if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                      }
                    }, 600);
                  });
                }}
              >
                <Calendar className="w-5 h-5 mr-2 group-hover:animate-bounce transition-all duration-300" />
                Book Appointment
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-all duration-300" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 group relative overflow-hidden"
                onClick={() => handleCTAClick('watch_story')}
                onMouseEnter={(e) => {
                  // Optimized ripple effect with requestAnimationFrame
                  requestAnimationFrame(() => {
                    const ripple = document.createElement('span');
                    ripple.className = 'absolute inset-0 bg-white/20 rounded-lg opacity-50 animate-ping';
                    e.currentTarget.appendChild(ripple);
                    setTimeout(() => {
                      if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                      }
                    }, 600);
                  });
                }}
              >
                <PlayCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-all duration-500" />
                Watch Our Story
              </Button>
            </div>

            {/* Enhanced Trust Indicators with Staggered Animation */}
            <div className={`flex flex-wrap items-center gap-4 pt-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '1.1s' }}>
              <div className={`flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 transform ${isLoaded ? 'animate-fade-in' : ''}`} style={{ animationDelay: '1.2s' }}>
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 animate-pulse" />
                <span className="text-blue-100 text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className={`flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 transform ${isLoaded ? 'animate-fade-in' : ''}`} style={{ animationDelay: '1.4s' }}>
                <Shield className="w-4 h-4 text-blue-300 mr-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <span className="text-blue-100 text-sm font-medium">ADA Certified</span>
              </div>
              <div className={`flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 transform ${isLoaded ? 'animate-fade-in' : ''}`} style={{ animationDelay: '1.6s' }}>
                <Award className="w-4 h-4 text-yellow-400 mr-2 animate-pulse" style={{ animationDelay: '1s' }} />
                <span className="text-blue-100 text-sm font-medium">15+ Years Experience</span>
              </div>
            </div>
          </div>

          {/* Right Side - Visual Content */}
          <div className={`lg:w-1/2 flex justify-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '0.4s' }}>
            <div className="relative max-w-lg w-full group">
              
              {/* Enhanced Glow Effect */}
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 rounded-3xl blur-3xl opacity-30 animate-pulse"></div>
              
              {/* Optimized Main Hero Image */}
              <div className="relative">
                <OptimizedImage
                  src="/images/image1.jpg"
                  alt="Modern dental office with advanced laser technology and happy patient receiving treatment"
                  className="relative rounded-3xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-500 border-4 border-white/20"
                  width={600}
                  height={400}
                  priority={true}
                  placeholder="blur"
                  fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjI0Ij5Nb2Rlcm4gRGVudGFsIE9mZmljZTwvdGV4dD4KPC9zdmc+"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  onLoad={handleImageLoad}
                  loading="eager"
                />
              </div>

              {/* Enhanced Floating Stats Cards with Advanced Animations */}
              <div className={`absolute -bottom-8 -left-8 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 ${isLoaded ? 'animate-slide-up' : ''}`} style={{ animationDelay: '1.8s' }}>
                <div className="flex items-center gap-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-5 h-5 fill-current transition-all duration-300 hover:scale-125 cursor-pointer" 
                        style={{ 
                          animation: `pulse 2s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s` 
                        }} 
                      />
                    ))}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 animate-pulse">4.9/5</div>
                    <div className="text-sm text-gray-600 font-medium">2,500+ Reviews</div>
                  </div>
                </div>
              </div>

              <div className={`absolute -top-8 -right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:-rotate-1 ${isLoaded ? 'animate-slide-down' : ''}`} style={{ animationDelay: '2s' }}>
                <div className="text-center">
                  <div className="text-3xl font-bold animate-pulse">24/7</div>
                  <div className="text-sm opacity-90 font-medium">Emergency Care</div>
                </div>
              </div>

              {/* Additional Floating Element - Patient Count */}
              <div className={`absolute top-1/2 -left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-110 ${isLoaded ? 'animate-slide-right' : ''}`} style={{ animationDelay: '2.2s' }}>
                <div className="text-center">
                  <div className="text-xl font-bold animate-pulse">10K+</div>
                  <div className="text-xs opacity-90">Happy Patients</div>
                </div>
              </div>

              {/* New Floating Trust Badge */}
              <div className={`absolute bottom-1/4 -right-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:rotate-12 ${isLoaded ? 'animate-scale-up' : ''}`} style={{ animationDelay: '2.4s' }}>
                <CheckCircle className="w-6 h-6 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/10 to-transparent"></div>
      </section>
    </LoadingOverlay>
  );
};

export default HeroSection;