import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Service, ServiceBookingData } from '../types/services';
import { servicesService } from '../services/servicesService';
import { useAuth } from './useAuth';

interface UseServiceBookingReturn {
  isBooking: boolean;
  bookingError: string | null;
  bookService: (service: Service, bookingData?: Partial<ServiceBookingData>) => Promise<void>;
  quickBook: (serviceId: string) => Promise<void>;
  contactForService: (service: Service, method?: 'phone' | 'whatsapp' | 'form') => void;
  navigateToBooking: (service: Service) => void;
  isServiceAvailable: (serviceId: string, location?: string) => boolean;
}

export const useServiceBooking = (): UseServiceBookingReturn => {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user: _user, isAuthenticated } = useAuth();

  const bookService = useCallback(async (
    service: Service, 
    bookingData: Partial<ServiceBookingData> = {}
  ) => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Store booking intent and redirect to login
        localStorage.setItem('pendingBooking', JSON.stringify({
          serviceId: service.id,
          serviceName: service.title,
          ...bookingData
        }));
        navigate('/login', { 
          state: { 
            returnTo: '/appointments/book',
            message: 'Please log in to book an appointment'
          }
        });
        return;
      }

      // Prepare booking data
      const fullBookingData: ServiceBookingData = {
        serviceId: service.id,
        serviceName: service.title,
        duration: service.duration,
        price: service.price,
        ...bookingData
      };

      // Call the booking service
      const result = await servicesService.bookServiceAppointment(fullBookingData);

      if (result.success) {
        // Navigate to booking confirmation or appointment page
        navigate('/appointments/book', {
          state: {
            service,
            bookingData: fullBookingData,
            bookingId: result.bookingId
          }
        });
      } else {
        setBookingError(result.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError('An error occurred while booking the appointment');
    } finally {
      setIsBooking(false);
    }
  }, [isAuthenticated, navigate]);

  const quickBook = useCallback(async (serviceId: string) => {
    const service = servicesService.getServiceById(serviceId);
    if (!service) {
      setBookingError('Service not found');
      return;
    }

    await bookService(service);
  }, [bookService]);

  const contactForService = useCallback((
    service: Service, 
    method: 'phone' | 'whatsapp' | 'form' = 'phone'
  ) => {
    const phoneNumber = '+201017848825';
    const message = `Hello, I'm interested in ${service.title}. Could you please provide more information?`;

    switch (method) {
      case 'phone':
        window.open(`tel:${phoneNumber}`, '_self');
        break;
      
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        break;
      
      case 'form':
        navigate('/contact', {
          state: {
            service: service.title,
            message: `I'm interested in ${service.title}. Please contact me with more information.`
          }
        });
        break;
    }
  }, [navigate]);

  const navigateToBooking = useCallback((service: Service) => {
    navigate('/appointments/book', {
      state: {
        preselectedService: service
      }
    });
  }, [navigate]);

  const isServiceAvailable = useCallback((serviceId: string, location?: string) => {
    if (!location) return true;
    return servicesService.isServiceAvailableAt(serviceId, location);
  }, []);

  return {
    isBooking,
    bookingError,
    bookService,
    quickBook,
    contactForService,
    navigateToBooking,
    isServiceAvailable
  };
};