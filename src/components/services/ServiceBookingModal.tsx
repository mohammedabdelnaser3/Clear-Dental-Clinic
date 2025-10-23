import React, { useState } from 'react';
import type { Service } from '../../types/services';
import { Button, Card } from '../ui';
import { useServiceBooking } from '../../hooks/useServiceBooking';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ServiceBookingModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  isOpen,
  onClose
}) => {
  const [selectedLocation, setSelectedLocation] = useState(service.availableAt[0] || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingMethod, setBookingMethod] = useState<'online' | 'phone' | 'whatsapp'>('online');

  const {
    isBooking,
    bookingError,
    bookService,
    contactForService,
    navigateToBooking: _navigateToBooking
  } = useServiceBooking();

  if (!isOpen) return null;

  const handleBookNow = async () => {
    if (bookingMethod === 'online') {
      await bookService(service, {
        clinicLocation: selectedLocation,
        preferredDate: preferredDate ? new Date(preferredDate) : undefined,
        preferredTime,
        notes
      });
    } else {
      contactForService(service, bookingMethod);
    }
  };

  const handleQuickContact = (method: 'phone' | 'whatsapp') => {
    contactForService(service, method);
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                {service.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{service.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{service.rating}</span>
                  </div>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{service.reviewCount} reviews</span>
                  {service.isPopular && (
                    <>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-orange-600 font-medium">Popular</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Service Details */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">{service.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{service.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{service.availableAt.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{service.price}</span>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">What's Included:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {service.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How would you like to book?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setBookingMethod('online')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  bookingMethod === 'online'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Online Booking</div>
                <div className="text-sm text-gray-600">Schedule instantly</div>
              </button>

              <button
                onClick={() => setBookingMethod('phone')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  bookingMethod === 'phone'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Phone className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-medium text-gray-900">Call to Book</div>
                <div className="text-sm text-gray-600">Speak with our team</div>
              </button>

              <button
                onClick={() => setBookingMethod('whatsapp')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  bookingMethod === 'whatsapp'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-medium text-gray-900">WhatsApp</div>
                <div className="text-sm text-gray-600">Quick messaging</div>
              </button>
            </div>
          </div>

          {/* Online Booking Form */}
          {bookingMethod === 'online' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Booking Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Location Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {service.availableAt.map((location) => (
                      <option key={location} value={location}>
                        {location} Branch
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific requirements or questions..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {bookingError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{bookingError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {bookingMethod === 'online' ? (
              <Button
                onClick={handleBookNow}
                disabled={isBooking}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleBookNow}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {bookingMethod === 'phone' ? (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          </div>

          {/* Quick Contact Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Or contact us directly:</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickContact('phone')}
                className="flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                +201017848825
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickContact('whatsapp')}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServiceBookingModal;