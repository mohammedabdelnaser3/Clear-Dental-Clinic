import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import path from "path";
import { connectDB } from "./config/database";
import routes from "./routes";
import { errorHandler, notFound, AppError } from "./middleware/errorHandler";
import { testEmailConfiguration } from "./utils/email";
import { Server } from 'socket.io';

// Create Express app
const app = express();

// Connect to MongoDB
console.log("mongoURI");
connectDB();

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"],
			},
		},
	})
);

// CORS configuration
const corsOptions = {
	origin: function (
		origin: string | undefined,
		callback: (err: Error | null, allow?: boolean) => void
	) {
		// Allow requests with no origin (mobile apps, Postman, etc.)
		if (!origin) return callback(null, true);

		const allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5174",
			"http://127.0.0.1:5175",
			process.env.FRONTEND_URL,
		].filter(Boolean);

		console.log('CORS Check - Origin:', origin, 'Allowed:', allowedOrigins.includes(origin || ''));
		console.log('CORS allowedOrigins:', allowedOrigins);

		if (allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			console.log('CORS blocked origin:', origin);
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// General rate limiter with logging
const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === "production" ? 100 : 1000,
	message: {
		success: false,
		message: "Too many requests from this IP, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req: any, res: any) => {
		console.log('General rate limit hit for IP:', req.ip, 'Path:', req.path);
		res.status(429).json({
			success: false,
			message: "Too many requests from this IP, please try again later.",
		});
	},
});

app.use(generalLimiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === "production" ? 5 : 50, // More lenient in development
	message: {
		success: false,
		message: "Too many authentication attempts, please try again later.",
	},
	skipSuccessfulRequests: true,
	handler: (req: any, res: any) => {
		console.log('Auth rate limit hit for IP:', req.ip, 'Path:', req.path);
		res.status(429).json({
			success: false,
			message: "Too many authentication attempts, please try again later.",
		});
	},
});

app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/request-password-reset", authLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(
	hpp({
		whitelist: ["sort", "fields", "page", "limit"],
	})
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
} else {
	app.use(morgan("combined"));
}

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Debug middleware to log requests
app.use((req, res, next) => {
	console.log(`🔍 Request: ${req.method} ${req.path}`);
	next();
});

// Debug route for testing
// app.get("/debug", (req, res) => {
// 	console.log("✅ Debug route hit!");
// 	res.json({
// 		message: "Debug route working",
// 		timestamp: new Date().toISOString(),
// 	});
// });

// API routes
app.use("/", routes);

// Handle undefined routes
app.all("*", (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("👋 SIGTERM received. Shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("👋 SIGINT received. Shutting down gracefully...");
	process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
	console.log("💥 UNHANDLED REJECTION! Shutting down...");
	console.log(err.name, err.message);
	process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
	console.log("💥 UNCAUGHT EXCEPTION! Shutting down...");
	console.log(err.name, err.message);
	process.exit(1);
});

// Test email configuration on startup (development only)
if (process.env.NODE_ENV === "development") {
	testEmailConfiguration().catch((err) => {
		console.warn("⚠️  Email configuration test failed:", err.message);
	});
}

const server = app.listen(process.env.PORT || 5000, () => {
	console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 10000,
  pingInterval: 5000
});

io.on('connection', (socket) => {
  console.info('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.info('🔌 Client disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('🔌 Socket error:', error);
  });
});

export default app;
