import mongoose from "mongoose";
import { setTimeout } from "timers/promises";

export const connectDB = async (): Promise<void> => {
  
	try {
		const mongoURI =
			process.env.MONGODB_URI ||
			"mongodb+srv://mohamedabdelnasser0123:pyyd9JSaA2wTUYzT@cluster0.ohipm4r.mongodb.net/smartclinic?retryWrites=true&w=majority&appName=Cluster0";

		const options = {} as any; // Using any to avoid type issues with mongoose connection options

		// Add retry logic
		let retryCount = 0;
		const maxRetries = 5;
		let conn: typeof mongoose;
    while (retryCount < maxRetries) {
			try {
				conn = await mongoose.connect(mongoURI, options);
				console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
				console.log(`📊 Database: ${conn.connection.name}`);
				// Reset retry count on success
				retryCount = 0;
				break;
					} catch (error) {
			
			console.error(
			`❌ MongoDB connection attempt ${retryCount + 1} failed:`,
			error
		);
				retryCount++;
				if (retryCount >= maxRetries) {
					throw new Error("Max retries reached for MongoDB connection");
				}
				await setTimeout(5000 * retryCount); // Exponential backoff
			}
		}

		// Handle connection events
		mongoose.connection.on("error", (err) => {
			console.error("❌ MongoDB connection error:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("⚠️ MongoDB disconnected");
		});

		mongoose.connection.on("reconnected", () => {
			console.log("✅ MongoDB reconnected");
		});

		// Graceful shutdown
		process.on("SIGINT", async () => {
			try {
				await mongoose.connection.close();
				console.log("📴 MongoDB connection closed through app termination");
				process.exit(0);
			} catch (err) {
				console.error("❌ Error closing MongoDB connection:", err);
				process.exit(1);
			}
		});
	} catch (error) {
		console.error(
			"⚠️ MongoDB connection failed, running in mock mode:",
			error instanceof Error ? error.message : String(error)
		);
		console.log(
			"🔧 To use full functionality, please start MongoDB or configure a cloud database"
		);
		// Don't exit, allow server to run without database for development
	}
};

// Database health check
export const checkDBHealth = async (): Promise<boolean> => {
	try {
		const state = mongoose.connection.readyState;
		return state === 1; // 1 = connected
	} catch (error) {
		console.error("Database health check failed:", error);
		return false;
	}
};

// Get database statistics
export const getDBStats = async () => {
	try {
		if (!mongoose.connection.db) {
			throw new Error("Database connection not established");
		}
		const stats = await mongoose.connection.db.stats();
		return {
			collections: stats.collections,
			dataSize: stats.dataSize,
			indexSize: stats.indexSize,
			storageSize: stats.storageSize,
		};
	} catch (error) {
		console.error("Error getting database stats:", error);
		return null;
	}
};
