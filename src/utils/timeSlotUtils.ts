/**
 * Time Slot Utilities
 * Generates and manages appointment time slots based on doctor schedules
 */

import { type DoctorSchedule } from '../services/doctorScheduleService';

// Add explicit types so TimeSlot and BookedSlot are defined for the module
export type TimeSlot = {
  time: string;
  available: boolean;
  isPeak?: boolean;
  // optional: identify which schedule produced the slot
  scheduleId?: string;
};

export type BookedSlot = string; // simple representation; can be expanded to { time: string; ... } if needed

/**
 * Generate time slots from a doctor's schedule
 * @param schedule - Doctor's schedule for the day
 * @param bookedSlots - Array of already booked time slots (HH:MM format)
 * @returns Array of time slot objects with availability info
 */
export const generateTimeSlotsFromSchedule = (
  schedule: DoctorSchedule,
  bookedSlots: string[] = []
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  
  const { startTime, endTime, slotDuration } = schedule;
  
  // Convert HH:MM to minutes from midnight
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  
  // Generate slots
  for (let time = startInMinutes; time + slotDuration <= endInMinutes; time += slotDuration) {
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Check if this slot is already booked
    const isBooked = bookedSlots.includes(timeString);
    
    // Determine if this is a peak time (example: 5 PM - 9 PM)
    const isPeak = hour >= 17 && hour < 21;
    
    slots.push({
      time: timeString,
      available: !isBooked,
      isPeak,
      scheduleId: (schedule as any).id // optional, harmless if id doesn't exist
    });
  }
  
  return slots;
};

/**
 * Generate time slots from multiple schedules (for when doctor has multiple blocks)
 * @param schedules - Array of doctor's schedules for the day
 * @param bookedSlots - Array of already booked time slots
 * @returns Combined array of time slots
 */
export const generateTimeSlotsFromMultipleSchedules = (
  schedules: DoctorSchedule[],
  bookedSlots: BookedSlot[] = []
): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  const seen = new Set<string>();
  
  if (!schedules?.length) {
    console.warn('No valid schedules provided to generateTimeSlotsFromMultipleSchedules');
    return [];
  }

  schedules.forEach(schedule => {
    console.log('🔍 Processing schedule:', schedule);
    if (!schedule?.startTime || !schedule?.endTime) {
      console.warn('Invalid schedule found:', schedule);
      return;
    }
    
    // Set default slot duration if not provided (30 minutes)
    const slotDuration = schedule.slotDuration || 30;
    console.log('⏰ Schedule details:', { startTime: schedule.startTime, endTime: schedule.endTime, slotDuration });
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const duration = slotDuration;

    for (let time = startInMinutes; time + duration <= endInMinutes; time += duration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      if (seen.has(timeString)) continue;
      seen.add(timeString);

      const isBooked = bookedSlots.includes(timeString);
      const isPeak = hour >= 17 && hour < 21;

      timeSlots.push({
        time: timeString,
        available: !isBooked,
        isPeak,
        // dentistId is not a property of TimeSlot, so we remove it to fix the lint error
        scheduleId: (schedule as any).id
      });
    }
  });

  // Sort by time ascending
  timeSlots.sort((a, b) => a.time.localeCompare(b.time));

  return timeSlots;
};

/**
 * Format time from 24-hour to 12-hour format
 * @param time - Time in HH:MM format
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime12Hour = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format time slot for display with availability indicator
 * @param slot - Time slot object
 * @returns Formatted display string
 */
export const formatTimeSlotDisplay = (slot: { time: string; available: boolean; isPeak?: boolean }): string => {
  const formatted = formatTime12Hour(slot.time);
  if (!slot.available) {
    return `${formatted} (Booked)`;
  }
  if (slot.isPeak) {
    return `${formatted} ⭐`;
  }
  return formatted;
};

/**
 * Group time slots by morning, afternoon, evening
 * @param slots - Array of time slots
 * @returns Grouped time slots
 */
export const groupTimeSlotsByPeriod = (
  slots: { time: string; available: boolean; isPeak?: boolean }[]
): {
  morning: typeof slots;
  afternoon: typeof slots;
  evening: typeof slots;
} => {
  const morning: typeof slots = [];
  const afternoon: typeof slots = [];
  const evening: typeof slots = [];
  
  slots.forEach(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    
    if (hour < 12) {
      morning.push(slot);
    } else if (hour < 17) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });
  
  return { morning, afternoon, evening };
};

/**
 * Get the first available time slot
 * @param slots - Array of time slots
 * @returns First available slot or null
 */
export const getFirstAvailableSlot = (
  slots: { time: string; available: boolean }[]
): { time: string; available: boolean } | null => {
  return slots.find(slot => slot.available) || null;
};

/**
 * Get next N available slots
 * @param slots - Array of time slots
 * @param count - Number of slots to return
 * @returns Array of available slots
 */
export const getNextAvailableSlots = (
  slots: { time: string; available: boolean }[],
  count: number = 5
): { time: string; available: boolean }[] => {
  return slots.filter(slot => slot.available).slice(0, count);
};

/**
 * Check if a specific time is within a schedule's range
 * @param time - Time to check (HH:MM)
 * @param schedule - Doctor's schedule
 * @returns True if time is within schedule
 */
export const isTimeInSchedule = (time: string, schedule: DoctorSchedule): boolean => {
  const [hour, minute] = time.split(':').map(Number);
  const timeInMinutes = hour * 60 + minute;
  
  const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
  
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  
  return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
};

/**
 * Calculate duration between two times
 * @param startTime - Start time (HH:MM)
 * @param endTime - End time (HH:MM)
 * @returns Duration in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  
  return endInMinutes - startInMinutes;
};

/**
 * Add minutes to a time string
 * @param time - Time in HH:MM format
 * @param minutes - Minutes to add
 * @returns New time string
 */
export const addMinutesToTime = (time: string, minutes: number): string => {
  const [hour, minute] = time.split(':').map(Number);
  const totalMinutes = hour * 60 + minute + minutes;
  
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  
  return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
};

