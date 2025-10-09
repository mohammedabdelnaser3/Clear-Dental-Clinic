import {
  validateEmail,
  validatePhone,
  validateRequired,
  validatePassword,
  validatePasswordMatch,
  validateDate,
  validateZipCode
} from './validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.uk').isValid).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('invalid').isValid).toBe(false);
      expect(validateEmail('test@').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('1234567890').isValid).toBe(true);
      expect(validatePhone('+1 (234) 567-8900').isValid).toBe(true);
      expect(validatePhone('123-456-7890').isValid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123').isValid).toBe(false);
      expect(validatePhone('12345678901234567890').isValid).toBe(false);
    });

    it('should allow empty phone numbers', () => {
      expect(validatePhone('').isValid).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty values', () => {
      expect(validateRequired('test', 'Field').isValid).toBe(true);
    });

    it('should reject empty values', () => {
      expect(validateRequired('', 'Field').isValid).toBe(false);
      expect(validateRequired('   ', 'Field').isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with 8+ characters', () => {
      expect(validatePassword('password123').isValid).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('pass').isValid).toBe(false);
      expect(validatePassword('').isValid).toBe(false);
    });
  });

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      expect(validatePasswordMatch('password', 'password').isValid).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      expect(validatePasswordMatch('password1', 'password2').isValid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate correct dates', () => {
      expect(validateDate('2000-01-01', 'Date').isValid).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid', 'Date').isValid).toBe(false);
    });

    it('should reject future dates for date of birth', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(validateDate(futureDate.toISOString().split('T')[0], 'Date of birth').isValid).toBe(false);
    });

    it('should allow empty dates', () => {
      expect(validateDate('', 'Date').isValid).toBe(true);
    });
  });

  describe('validateZipCode', () => {
    it('should validate correct ZIP codes', () => {
      expect(validateZipCode('12345').isValid).toBe(true);
      expect(validateZipCode('12345-6789').isValid).toBe(true);
      expect(validateZipCode('A1A 1A1').isValid).toBe(true);
    });

    it('should reject invalid ZIP codes', () => {
      expect(validateZipCode('1').isValid).toBe(false);
      expect(validateZipCode('12').isValid).toBe(false);
    });

    it('should allow empty ZIP codes', () => {
      expect(validateZipCode('').isValid).toBe(true);
    });
  });
});
