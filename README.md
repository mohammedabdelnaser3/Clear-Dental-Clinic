# DentalPro Manager 🦷

**A modern, full-stack dental clinic management system** named DentalPro that provides a comprehensive web interface for managing patients and medical appointments. It includes a Patient Dashboard for booking appointments, managing medical files, and electronic payments.

Live Demo: _Coming Soon (Deploying on Vercel)_  
(Currently running on localhost:5173 – Demo available upon request)

## 🚀 Features

- **Secure Authentication** (Login / Register with JWT)
- **Patient Dashboard**
  - Book & reschedule dental appointments with clinic selection
  - View and update treatment plans
  - Manage invoices & online payments
  - Insurance information management
  - Chat/messages with clinic staff
  - Notification system for upcoming appointments
- **Appointments Management**
  - List of upcoming and recent appointments with details (date, time, service, dentist, status)
  - Quick actions: View, Complete, Cancel, Reschedule
  - Search by patient, service, or date
- **Fully Responsive** – Works perfectly on mobile, tablet, and desktop
- **Clean & Modern UI** with Tailwind CSS and intuitive booking progress

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6-CA4245?logo=react-router)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-4.7-green?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Authentication-blue)

### Tools
- ESLint • React Icons • Zod (planning to add)

## 📸 Screenshots

### Login Page
![Login Page](screenshots/login.png)

### Patient Dashboard (Mobile View)
![Dashboard Welcome Mobile](screenshots/dashboard-welcome-mobile.png)![](screenshots/dashboard-upcoming-mobile.png),![](screenshots/dashboard-upcoming-mobile-2.png)

### Appointments List (Mobile View)
![Appointments List Mobile](screenshots/appointments-list-mobile-1.png)![](screenshots/appointments-list-mobile-2.png)

### Create Appointment (Mobile View)
![Create Appointment Clinic Mobile](screenshots/create-appointment-clinic-mobile-1.png)![](screenshots/create-appointment-clinic-mobile-2.png)![](screenshots/create-appointment-clinic-mobile-3.png)![](screenshots/create-appointment-clinic-mobile-4.png)

### Dashboard (Desktop View)
![Dashboard Desktop](screenshots/dashboard-desktop-1.png)![](screenshots/dashboard-desktop-2.png)

### Appointments Table (Desktop View)
![Appointments Table Desktop](screenshots/appointments-table-desktop.png)

### Create Appointment Services (Desktop View)
![Create Appointment Services Desktop](screenshots/create-appointment-services-desktop-1.png)![](screenshots/create-appointment-services-desktop-1.png)

## 🚧 Status: In Active Development
- 85% Frontend Complete (Responsive design fully implemented)
- Backend API 100% Functional
- Payment Integration (in progress with Paymob/Stripe)
- Admin/Doctor Panel (next phase)

## 🔜 Upcoming Features
- Doctor/Admin dashboard for managing patients and schedules
- Stripe/Paymob payment gateway
- Email/SMS notifications
- Deployment on Vercel/Netlify

## 🏃‍♂️ How to Run Locally

```bash
git clone https://github.com/mohammedabdelnaser3/dentapro-eg.git
cd dentapro-eg

# Frontend
cd client
npm install
npm run dev

# Backend (if in separate folder)
cd server
npm install
npm start
