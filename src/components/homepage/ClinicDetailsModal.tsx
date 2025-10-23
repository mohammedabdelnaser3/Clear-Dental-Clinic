import React from 'react';
import { X, Star, MapPin, Clock, Phone, Users } from 'lucide-react';
import { Button, Card } from '../ui';

interface ClinicDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic?: {
    name?: string;
    address?: string;
    phone?: string;
    hours?: string;
    rating?: number;
  } | null;
}

const ClinicDetailsModal: React.FC<ClinicDetailsModalProps> = ({ isOpen, onClose, clinic }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{clinic?.name || 'Clinic Details'}</h2>
            <p className="text-sm text-gray-500">Overview and information</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="w-5 h-5" />
              <span>{clinic?.address || 'Address not available'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 mt-3">
              <Phone className="w-5 h-5" />
              <span>{clinic?.phone || 'Phone not available'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 mt-3">
              <Clock className="w-5 h-5" />
              <span>{clinic?.hours || 'Hours not available'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 mt-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{clinic?.rating != null ? clinic.rating.toFixed(1) : 'No rating'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 mt-3">
              <Users className="w-5 h-5" />
              <span>Team information coming soon</span>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 bg-gray-50 px-6 py-4 border-t">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailsModal;