import { STATUS_COLORS } from '../config/constants';
import type { AppointmentStatus } from '../types';

/**
 * Format a name to title case
 * @param name Name to format
 * @returns Formatted name
 */
export const formatName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return '';
  
  const formattedFirstName = firstName ? firstName.trim() : '';
  const formattedLastName = lastName ? lastName.trim() : '';
  
  return `${formattedFirstName} ${formattedLastName}`.trim();
};

/**
 * Format a currency amount
 * @param amount Amount to format
 * @param currency Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a phone number
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else {
    // If it doesn't match expected formats, return the original
    return phone;
  }
};

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Get color for appointment status
 * @param status Appointment status
 * @returns Color for the status
 */
export const getStatusColor = (status: AppointmentStatus): string => {
  return STATUS_COLORS[status] || 'gray';
};

/**
 * Format file size
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get initials from name
 * @param firstName First name
 * @param lastName Last name
 * @returns Initials (up to 2 characters)
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return '';
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}`;
};

/**
 * Format a duration in minutes to hours and minutes
 * @param minutes Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

/**
 * Format an address to a single line
 * @param address Address object
 * @returns Formatted address string
 */
export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): string => {
  if (!address) return '';
  
  const { street, city, state, zipCode, country } = address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  
  return parts.join(', ');
};