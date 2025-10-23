import React from 'react';
import { Card, Button } from '../ui';
import { Users, Stethoscope, Star } from 'lucide-react';

interface TeamSectionProps {
  maxDoctors?: number;
  showBookingIntegration?: boolean;
  showAvailability?: boolean;
  className?: string;
}

const TeamSection: React.FC<TeamSectionProps> = ({ className = '' }) => {
  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Our Team
        </h2>
        <p className="text-gray-600 mt-2">Meet our experienced dental professionals.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1,2,3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium">Doctor {i}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    4.{i} rating
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4">View Profile</Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;