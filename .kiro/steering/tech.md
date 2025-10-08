---
inclusion: always
---

# Technology Stack

## Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **i18n**: i18next (English and Arabic support)
- **Real-time**: Socket.io client
- **UI Libraries**: Heroicons, Lucide React
- **Notifications**: React Hot Toast

## Backend

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, express-rate-limit, express-mongo-sanitize, HPP
- **Email**: Nodemailer
- **File Upload**: Multer
- **Job Queue**: Bull with Redis
- **Validation**: Express Validator

## Development Tools

- **Linting**: ESLint with TypeScript support
- **Testing**: Jest with React Testing Library
- **Package Manager**: npm

## Common Commands

### Frontend
```bash
npm run dev          # Start development server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Backend
```bash
cd backend
npm run dev          # Start development server with nodemon (port 3001)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm test             # Run tests
npm run seed         # Seed database with sample data
```

## Environment Variables

### Frontend (.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:3001/api/v1)
- `VITE_FIREBASE_*`: Firebase configuration for authentication

### Backend (.env)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing
- `JWT_EXPIRES_IN`: Token expiration time
- `FRONTEND_URL`: Frontend URL for CORS
- Email configuration (SMTP_HOST, SMTP_PORT, etc.)

## Path Aliases

### Frontend
- `@/`: Maps to `./src/`

### Backend
- `@/`: Maps to `./src/`
- `@/models/*`, `@/controllers/*`, `@/middleware/*`, etc.
