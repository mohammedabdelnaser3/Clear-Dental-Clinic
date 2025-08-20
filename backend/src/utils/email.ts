import nodemailer from 'nodemailer';
import { createPasswordResetURL, createEmailVerificationURL } from './auth';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Dental Clinic'} <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  const subject = 'Welcome to Our Dental Clinic!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Our Dental Clinic!</h1>
            </div>
            <div class="content">
                <h2>Hello ${firstName}!</h2>
                <p>Thank you for joining our dental clinic management system. We're excited to have you on board!</p>
                <p>You can now:</p>
                <ul>
                    <li>Schedule appointments online</li>
                    <li>View your treatment history</li>
                    <li>Manage your profile</li>
                    <li>Receive appointment reminders</li>
                </ul>
                <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Dental Clinic Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  const text = `
    Welcome to Our Dental Clinic!
    
    Hello ${firstName}!
    
    Thank you for joining our dental clinic management system. We're excited to have you on board!
    
    You can now:
    - Schedule appointments online
    - View your treatment history
    - Manage your profile
    - Receive appointment reminders
    
    If you have any questions, please don't hesitate to contact us.
    
    Best regards,
    The Dental Clinic Team
  `;

  return await sendEmail({ to: email, subject, text, html });
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetURL = createPasswordResetURL(resetToken);
  const subject = 'Password Reset Request';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>You have requested a password reset for your account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetURL}" class="button">Reset Password</a>
                <div class="warning">
                    <strong>Important:</strong>
                    <ul>
                        <li>This link will expire in 1 hour</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>For security, this link can only be used once</li>
                    </ul>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetURL}</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Dental Clinic Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  const text = `
    Password Reset Request
    
    You have requested a password reset for your account.
    
    Click the link below to reset your password:
    ${resetURL}
    
    Important:
    - This link will expire in 1 hour
    - If you didn't request this reset, please ignore this email
    - For security, this link can only be used once
    
    Best regards,
    The Dental Clinic Team
  `;

  return await sendEmail({ to: email, subject, text, html });
};

// Send appointment confirmation email
export const sendAppointmentConfirmationEmail = async (
  email: string,
  patientName: string,
  appointmentDetails: {
    date: string;
    time: string;
    dentist: string;
    clinic: string;
    service: string;
  }
) => {
  const subject = 'Appointment Confirmation';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Appointment Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Appointment Confirmed</h1>
            </div>
            <div class="content">
                <h2>Hello ${patientName}!</h2>
                <p>Your appointment has been confirmed. Here are the details:</p>
                
                <div class="appointment-details">
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span>${appointmentDetails.date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time:</span>
                        <span>${appointmentDetails.time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dentist:</span>
                        <span>${appointmentDetails.dentist}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Clinic:</span>
                        <span>${appointmentDetails.clinic}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span>${appointmentDetails.service}</span>
                    </div>
                </div>
                
                <p><strong>Please note:</strong></p>
                <ul>
                    <li>Arrive 15 minutes early for check-in</li>
                    <li>Bring a valid ID and insurance card</li>
                    <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
                </ul>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Dental Clinic Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  const text = `
    Appointment Confirmed
    
    Hello ${patientName}!
    
    Your appointment has been confirmed. Here are the details:
    
    Date: ${appointmentDetails.date}
    Time: ${appointmentDetails.time}
    Dentist: ${appointmentDetails.dentist}
    Clinic: ${appointmentDetails.clinic}
    Service: ${appointmentDetails.service}
    
    Please note:
    - Arrive 15 minutes early for check-in
    - Bring a valid ID and insurance card
    - If you need to reschedule, please contact us at least 24 hours in advance
    
    Best regards,
    The Dental Clinic Team
  `;

  return await sendEmail({ to: email, subject, text, html });
};

// Send appointment reminder email
export const sendAppointmentReminderEmail = async (
  email: string,
  patientName: string,
  appointmentDetails: {
    date: string;
    time: string;
    dentist: string;
    clinic: string;
  }
) => {
  const subject = 'Appointment Reminder - Tomorrow';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Appointment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .reminder-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 Appointment Reminder</h1>
            </div>
            <div class="content">
                <h2>Hello ${patientName}!</h2>
                <div class="reminder-box">
                    <p><strong>This is a friendly reminder about your upcoming appointment:</strong></p>
                    <p><strong>Tomorrow, ${appointmentDetails.date} at ${appointmentDetails.time}</strong></p>
                    <p>Dentist: ${appointmentDetails.dentist}<br>
                    Location: ${appointmentDetails.clinic}</p>
                </div>
                
                <p>Please remember to:</p>
                <ul>
                    <li>Arrive 15 minutes early</li>
                    <li>Bring your ID and insurance card</li>
                    <li>Contact us if you need to reschedule</li>
                </ul>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Dental Clinic Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  const text = `
    Appointment Reminder
    
    Hello ${patientName}!
    
    This is a friendly reminder about your upcoming appointment:
    
    Tomorrow, ${appointmentDetails.date} at ${appointmentDetails.time}
    Dentist: ${appointmentDetails.dentist}
    Location: ${appointmentDetails.clinic}
    
    Please remember to:
    - Arrive 15 minutes early
    - Bring your ID and insurance card
    - Contact us if you need to reschedule
    
    Best regards,
    The Dental Clinic Team
  `;

  return await sendEmail({ to: email, subject, text, html });
};

// Send appointment cancellation email
export const sendAppointmentCancellationEmail = async (
  email: string,
  patientName: string,
  appointmentDetails: {
    date: string;
    time: string;
    reason?: string;
  }
) => {
  const subject = 'Appointment Cancelled';
  
  const reasonText = appointmentDetails.reason 
    ? `<p><strong>Reason:</strong> ${appointmentDetails.reason}</p>`
    : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Appointment Cancelled</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Appointment Cancelled</h1>
            </div>
            <div class="content">
                <h2>Hello ${patientName}!</h2>
                <p>We regret to inform you that your appointment scheduled for <strong>${appointmentDetails.date} at ${appointmentDetails.time}</strong> has been cancelled.</p>
                ${reasonText}
                <p>We apologize for any inconvenience this may cause. Please contact us to reschedule your appointment.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Dental Clinic Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  const text = `
    Appointment Cancelled
    
    Hello ${patientName}!
    
    We regret to inform you that your appointment scheduled for ${appointmentDetails.date} at ${appointmentDetails.time} has been cancelled.
    
    ${appointmentDetails.reason ? `Reason: ${appointmentDetails.reason}` : ''}
    
    We apologize for any inconvenience this may cause. Please contact us to reschedule your appointment.
    
    Best regards,
    The Dental Clinic Team
  `;

  return await sendEmail({ to: email, subject, text, html });
};

// Test email configuration
export const testEmailConfiguration = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};