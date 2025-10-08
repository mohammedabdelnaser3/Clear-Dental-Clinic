import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Check, AlertCircle, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

// Mock Data Structure
interface Branch {
  id: string;
  name: string;
  operatingHours: {
    [key: number]: { isOpen: boolean; openTime: string; closeTime: string };
  };
}

interface DoctorSchedule {
  doctorId: string;
  doctorName: string;
  branchId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string;
  endTime: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
}

// Mock Branches
const BRANCHES: Branch[] = [
  {
    id: 'fayoum',
    name: 'Clear - Fayoum Branch',
    operatingHours: {
      0: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Sunday
      1: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Monday
      2: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Tuesday
      3: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Wednesday
      4: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Thursday
      5: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Friday
      6: { isOpen: true, openTime: '11:00', closeTime: '23:00' }, // Saturday
    },
  },
  {
    id: 'atesa',
    name: 'Atesa Branch',
    operatingHours: {
      0: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
      1: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
      2: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
      3: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
      4: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
      5: { isOpen: false, openTime: '', closeTime: '' }, // Closed Friday
      6: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
    },
  },
  {
    id: 'minya',
    name: 'Minya Branch',
    operatingHours: {
      0: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      1: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      2: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      3: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      4: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
      5: { isOpen: false, openTime: '', closeTime: '' }, // Closed Friday
      6: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
    },
  },
];

// Mock Doctor Schedules
const DOCTOR_SCHEDULES: DoctorSchedule[] = [
  // Dr. Jamal - Fayoum
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'fayoum', dayOfWeek: 0, startTime: '19:00', endTime: '23:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'fayoum', dayOfWeek: 2, startTime: '19:00', endTime: '23:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'fayoum', dayOfWeek: 4, startTime: '11:00', endTime: '19:00' },
  
  // Dr. Momen - Fayoum
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'fayoum', dayOfWeek: 5, startTime: '11:00', endTime: '23:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'fayoum', dayOfWeek: 0, startTime: '11:00', endTime: '19:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'fayoum', dayOfWeek: 2, startTime: '11:00', endTime: '19:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'fayoum', dayOfWeek: 4, startTime: '19:00', endTime: '23:00' },
  
  // Doctor 3 - Fayoum
  { doctorId: 'doctor3', doctorName: 'Dr. Ahmed', branchId: 'fayoum', dayOfWeek: 6, startTime: '11:00', endTime: '23:00' },
  { doctorId: 'doctor3', doctorName: 'Dr. Ahmed', branchId: 'fayoum', dayOfWeek: 1, startTime: '11:00', endTime: '23:00' },
  { doctorId: 'doctor3', doctorName: 'Dr. Ahmed', branchId: 'fayoum', dayOfWeek: 3, startTime: '11:00', endTime: '23:00' },
  
  // Dr. Jamal - Atesa
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'atesa', dayOfWeek: 0, startTime: '12:00', endTime: '19:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'atesa', dayOfWeek: 2, startTime: '12:00', endTime: '19:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'atesa', dayOfWeek: 4, startTime: '19:00', endTime: '23:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'atesa', dayOfWeek: 6, startTime: '12:00', endTime: '23:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'atesa', dayOfWeek: 1, startTime: '12:00', endTime: '23:00' },
  { doctorId: 'jamal', doctorName: 'Dr. Jamal', branchId: 'atesa', dayOfWeek: 3, startTime: '12:00', endTime: '23:00' },
  
  // Dr. Momen - Minya
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'minya', dayOfWeek: 0, startTime: '11:00', endTime: '19:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'minya', dayOfWeek: 2, startTime: '11:00', endTime: '19:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'minya', dayOfWeek: 4, startTime: '19:00', endTime: '23:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'minya', dayOfWeek: 6, startTime: '11:00', endTime: '23:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'minya', dayOfWeek: 1, startTime: '11:00', endTime: '23:00' },
  { doctorId: 'momen', doctorName: 'Dr. Momen', branchId: 'minya', dayOfWeek: 3, startTime: '11:00', endTime: '23:00' },
  
  // Doctor 4 - Minya
  { doctorId: 'doctor4', doctorName: 'Dr. Sarah', branchId: 'minya', dayOfWeek: 0, startTime: '19:00', endTime: '23:00' },
  { doctorId: 'doctor4', doctorName: 'Dr. Sarah', branchId: 'minya', dayOfWeek: 2, startTime: '19:00', endTime: '23:00' },
  { doctorId: 'doctor4', doctorName: 'Dr. Sarah', branchId: 'minya', dayOfWeek: 4, startTime: '11:00', endTime: '19:00' },
];

// Mock existing appointments (simulating some booked slots)
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', doctorId: 'jamal', date: '2025-10-05', time: '19:30', duration: 30 }, // Sunday
  { id: '2', doctorId: 'momen', date: '2025-10-05', time: '14:00', duration: 30 },
  { id: '3', doctorId: 'doctor3', date: '2025-10-06', time: '15:00', duration: 30 }, // Monday
];

const MultiBranchBookingPrototype: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSchedule | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableDoctors, setAvailableDoctors] = useState<DoctorSchedule[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [conflictCheck, setConflictCheck] = useState<{ available: boolean; message: string } | null>(null);

  // Get day name
  const getDayName = (date: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
  };

  // When date changes, find available doctors
  useEffect(() => {
    if (selectedBranch && selectedDate) {
      const dayOfWeek = new Date(selectedDate).getDay();
      const branchHours = selectedBranch.operatingHours[dayOfWeek];
      
      if (!branchHours.isOpen) {
        setAvailableDoctors([]);
        return;
      }
      
      const doctors = DOCTOR_SCHEDULES.filter(
        schedule => schedule.branchId === selectedBranch.id && schedule.dayOfWeek === dayOfWeek
      );
      
      setAvailableDoctors(doctors);
      setSelectedDoctor(null);
      setSelectedTime('');
      setConflictCheck(null);
    }
  }, [selectedBranch, selectedDate]);

  // When doctor selected, generate available time slots
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const slots = generateTimeSlots(
        selectedDoctor.startTime,
        selectedDoctor.endTime,
        30, // 30-minute slots
        selectedDoctor.doctorId,
        selectedDate
      );
      setAvailableTimeSlots(slots);
      setSelectedTime('');
      setConflictCheck(null);
    }
  }, [selectedDoctor, selectedDate]);

  // Check for conflicts when time is selected
  useEffect(() => {
    if (selectedDoctor && selectedDate && selectedTime) {
      const hasConflict = checkForConflicts(selectedDoctor.doctorId, selectedDate, selectedTime, 30);
      
      if (hasConflict) {
        setConflictCheck({
          available: false,
          message: 'This time slot is already booked. Please select another time.'
        });
      } else {
        setConflictCheck({
          available: true,
          message: 'Time slot is available!'
        });
      }
    }
  }, [selectedDoctor, selectedDate, selectedTime]);

  // Generate time slots
  const generateTimeSlots = (
    startTime: string,
    endTime: string,
    intervalMinutes: number,
    doctorId: string,
    date: string
  ): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Check if slot is available
      const isBooked = MOCK_APPOINTMENTS.some(
        apt => apt.doctorId === doctorId && apt.date === date && apt.time === timeStr
      );
      
      if (!isBooked) {
        slots.push(timeStr);
      }
      
      currentMin += intervalMinutes;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }
    
    return slots;
  };

  // Check for appointment conflicts
  const checkForConflicts = (
    doctorId: string,
    date: string,
    time: string,
    duration: number
  ): boolean => {
    const [hour, min] = time.split(':').map(Number);
    const appointmentStart = hour * 60 + min;
    const appointmentEnd = appointmentStart + duration;
    
    return MOCK_APPOINTMENTS.some(apt => {
      if (apt.doctorId !== doctorId || apt.date !== date) return false;
      
      const [aptHour, aptMin] = apt.time.split(':').map(Number);
      const aptStart = aptHour * 60 + aptMin;
      const aptEnd = aptStart + apt.duration;
      
      // Check for overlap
      return (
        (appointmentStart >= aptStart && appointmentStart < aptEnd) ||
        (appointmentEnd > aptStart && appointmentEnd <= aptEnd) ||
        (appointmentStart <= aptStart && appointmentEnd >= aptEnd)
      );
    });
  };

  const handleBooking = () => {
    if (conflictCheck?.available) {
      alert(`Appointment booked successfully!\n\nBranch: ${selectedBranch?.name}\nDoctor: ${selectedDoctor?.doctorName}\nDate: ${selectedDate} (${getDayName(selectedDate)})\nTime: ${selectedTime}\n\nThis is a prototype - no actual booking was made.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏥 Multi-Branch Booking System
          </h1>
          <p className="text-lg text-gray-600">Prototype - Smart Clinic</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Interactive Prototype - No data will be saved</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Branch Selection */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-bold text-gray-900">Select Branch</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BRANCHES.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranch(branch);
                      setSelectedDate('');
                      setSelectedDoctor(null);
                      setSelectedTime('');
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedBranch?.id === branch.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow'
                    }`}
                  >
                    <MapPin className={`h-6 w-6 mx-auto mb-2 ${
                      selectedBranch?.id === branch.id ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <div className="font-semibold text-gray-900">{branch.name}</div>
                    {selectedBranch?.id === branch.id && (
                      <Check className="h-5 w-5 text-blue-500 mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Step 2: Date Selection */}
            {selectedBranch && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Select Date</h2>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  />
                  
                  {selectedDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Calendar className="h-5 w-5" />
                        <span className="font-semibold">{getDayName(selectedDate)}</span>
                      </div>
                      {selectedBranch.operatingHours[new Date(selectedDate).getDay()].isOpen ? (
                        <p className="text-sm text-blue-600 mt-1">
                          Open: {selectedBranch.operatingHours[new Date(selectedDate).getDay()].openTime} - 
                          {selectedBranch.operatingHours[new Date(selectedDate).getDay()].closeTime}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1 font-semibold">
                          ❌ Branch is closed on this day
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Step 3: Doctor Selection */}
            {selectedDate && availableDoctors.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Select Doctor</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableDoctors.map((schedule, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDoctor(schedule)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        selectedDoctor === schedule
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <User className={`h-8 w-8 ${
                          selectedDoctor === schedule ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className="font-semibold text-gray-900">{schedule.doctorName}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        </div>
                      </div>
                      {selectedDoctor === schedule && (
                        <Check className="h-5 w-5 text-blue-500 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Step 4: Time Slot Selection */}
            {selectedDoctor && availableTimeSlots.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Select Time Slot</h2>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableTimeSlots.map((time, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTime(time)}
                      className={`px-3 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedTime === time
                          ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                          : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Conflict Check & Booking */}
            {conflictCheck && (
              <Card className={`p-6 border-2 ${
                conflictCheck.available ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  {conflictCheck.available ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      conflictCheck.available ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {conflictCheck.message}
                    </p>
                    {conflictCheck.available && (
                      <Button
                        onClick={handleBooking}
                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Complete Booking
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Branch</div>
                  <div className="font-semibold text-gray-900">
                    {selectedBranch?.name || 'Not selected'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Date</div>
                  <div className="font-semibold text-gray-900">
                    {selectedDate ? `${selectedDate} (${getDayName(selectedDate)})` : 'Not selected'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Doctor</div>
                  <div className="font-semibold text-gray-900">
                    {selectedDoctor?.doctorName || 'Not selected'}
                  </div>
                  {selectedDoctor && (
                    <div className="text-xs text-gray-600 mt-1">
                      Available: {selectedDoctor.startTime} - {selectedDoctor.endTime}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Time</div>
                  <div className="font-semibold text-gray-900">
                    {selectedTime || 'Not selected'}
                  </div>
                </div>
                
                {availableTimeSlots.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-2">Available Slots Today</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {availableTimeSlots.length}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Legend */}
            <Card className="p-6 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>Unavailable/Booked</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiBranchBookingPrototype;

