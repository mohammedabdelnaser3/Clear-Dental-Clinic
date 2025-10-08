import cron from 'node-cron';
import logger from './logger';
import { scheduleDailyReminderBatch, getQueueStats } from './jobQueue';
import mongoose from 'mongoose';

class CronService {
  private static instance: CronService;
  private tasks: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  // Initialize all cron jobs
  public async initialize() {
    logger.info('Initializing cron service...');

    try {
      // Daily reminder batch - runs at 6:00 AM every day
      this.scheduleDailyReminderBatch();
      
      // Queue cleanup - runs every 4 hours
      this.scheduleQueueCleanup();
      
      // Queue monitoring - runs every 30 minutes
      this.scheduleQueueMonitoring();
      
      // Database maintenance - runs at 2:00 AM every day
      this.scheduleDatabaseMaintenance();
      
      logger.info('All cron jobs scheduled successfully');
    } catch (error: any) {
      logger.error('Failed to initialize cron service:', error.message);
    }
  }

  // Schedule daily reminder batch processing
  private scheduleDailyReminderBatch() {
    const task = cron.schedule(
      '0 6 * * *', // Every day at 6:00 AM
      async () => {
        try {
          logger.info('Starting daily reminder batch processing...');
          
          // Schedule reminders for tomorrow's appointments
          await scheduleDailyReminderBatch();
          
          logger.info('Daily reminder batch scheduling completed');
        } catch (error: any) {
          logger.error('Error in daily reminder batch processing:', error.message);
        }
      },
      {
        timezone: process.env.TIMEZONE || 'UTC'
      }
    );

    this.tasks.set('dailyReminderBatch', task);
    logger.info('Daily reminder batch job scheduled (6:00 AM daily)');
  }

  // Schedule queue cleanup to remove old completed/failed jobs
  private scheduleQueueCleanup() {
    const task = cron.schedule(
      '0 */4 * * *', // Every 4 hours
      async () => {
        try {
          logger.info('Starting queue cleanup...');
          
          const stats = await getQueueStats();
          if (stats) {
            logger.info(`Queue stats before cleanup: ${JSON.stringify(stats)}`);
          }
          
          // Queue cleanup is handled by Bull's built-in mechanisms
          // but we can add custom logic here if needed
          
          const statsAfter = await getQueueStats();
          if (statsAfter) {
            logger.info(`Queue stats after cleanup: ${JSON.stringify(statsAfter)}`);
          }
          
        } catch (error: any) {
          logger.error('Error in queue cleanup:', error.message);
        }
      },
      {
        timezone: process.env.TIMEZONE || 'UTC'
      }
    );

    this.tasks.set('queueCleanup', task);
    logger.info('Queue cleanup job scheduled (every 4 hours)');
  }

  // Schedule queue monitoring and health checks
  private scheduleQueueMonitoring() {
    const task = cron.schedule(
      '*/30 * * * *', // Every 30 minutes
      async () => {
        try {
          const stats = await getQueueStats();
          if (stats) {
            logger.info(`Queue health check - Total jobs: ${stats.total}, Active: ${stats.active}, Failed: ${stats.failed}, Delayed: ${stats.delayed}`);
            
            // Alert if there are too many failed jobs
            if (stats.failed > 50) {
              logger.warn(`High number of failed jobs detected: ${stats.failed}`);
            }
            
            // Alert if queue seems stalled
            if (stats.active === 0 && stats.waiting > 0) {
              logger.warn(`Queue appears stalled - ${stats.waiting} jobs waiting but none active`);
            }
          }
        } catch (error: any) {
          logger.error('Error in queue monitoring:', error.message);
        }
      },
      {
        timezone: process.env.TIMEZONE || 'UTC'
      }
    );

    this.tasks.set('queueMonitoring', task);
    logger.info('Queue monitoring job scheduled (every 30 minutes)');
  }

  // Schedule database maintenance tasks
  private scheduleDatabaseMaintenance() {
    const task = cron.schedule(
      '0 2 * * *', // Every day at 2:00 AM
      async () => {
        try {
          logger.info('Starting database maintenance...');
          
          // Clean up old notifications (older than 30 days)
          const Notification = mongoose.model('Notification');
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const deletedNotifications = await (Notification as any).deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            read: true
          });
          
          if (deletedNotifications.deletedCount > 0) {
            logger.info(`Cleaned up ${deletedNotifications.deletedCount} old notifications`);
          }
          
          // Update appointment statuses for past appointments
          const Appointment = mongoose.model('Appointment');
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(23, 59, 59, 999);
          
          const outdatedAppointments = await Appointment.updateMany(
            {
              date: { $lt: yesterday },
              status: { $in: ['scheduled', 'confirmed'] }
            },
            { 
              status: 'no-show',
              $set: { updatedAt: new Date() }
            }
          );
          
          if (outdatedAppointments.modifiedCount > 0) {
            logger.info(`Updated ${outdatedAppointments.modifiedCount} past appointments to no-show status`);
          }
          
          // Log database statistics
          const appointmentStats = await (Appointment as any).aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ]);
          
          logger.info('Appointment status distribution:', appointmentStats);
          
          logger.info('Database maintenance completed');
        } catch (error: any) {
          logger.error('Error in database maintenance:', error.message);
        }
      },
      {
        timezone: process.env.TIMEZONE || 'UTC'
      }
    );

    this.tasks.set('databaseMaintenance', task);
    logger.info('Database maintenance job scheduled (2:00 AM daily)');
  }

  // Stop a specific cron job
  public stopTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      this.tasks.delete(taskName);
      logger.info(`Stopped cron task: ${taskName}`);
      return true;
    }
    return false;
  }

  // Start a specific cron job
  public startTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      logger.info(`Started cron task: ${taskName}`);
      return true;
    }
    return false;
  }

  // Stop all cron jobs
  public stopAll() {
    logger.info('Stopping all cron jobs...');
    
    this.tasks.forEach((task, taskName) => {
      task.stop();
      logger.info(`Stopped cron task: ${taskName}`);
    });
    
    this.tasks.clear();
    logger.info('All cron jobs stopped');
  }

  // Get status of all cron jobs
  public getStatus() {
    const status: Record<string, boolean> = {};
    
    this.tasks.forEach((task, taskName) => {
      status[taskName] = task.getStatus() === 'scheduled';
    });
    
    return status;
  }

  // Manual trigger for daily reminder batch (for testing)
  public async triggerDailyBatch(targetDate?: Date, clinicIds?: string[]) {
    try {
      logger.info('Manually triggering daily reminder batch...');
      await scheduleDailyReminderBatch(targetDate, clinicIds);
      logger.info('Daily reminder batch triggered successfully');
      return true;
    } catch (error: any) {
      logger.error('Failed to trigger daily reminder batch:', error.message);
      return false;
    }
  }
}

export default CronService;





