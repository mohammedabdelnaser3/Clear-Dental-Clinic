import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { IUser } from '../types';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

interface SocketData {
  userId: string;
  role: string;
  clinicIds: string[];
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, AuthenticatedSocket>(); // socketId -> socket

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication failed: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication failed: Invalid user'));
        }

        socket.user = user as any;
        socket.data = {
          userId: user._id.toString(),
          role: user.role,
          clinicIds: user.assignedClinics?.map(id => id.toString()) || []
        } as SocketData;

        next();
      } catch (error) {
        next(new Error('Authentication failed: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.user) return;

      const userId = socket.user._id.toString();
      
      // Store user connection
      this.connectedUsers.set(userId, socket.id);
      this.userSockets.set(socket.id, socket);

      console.log(`User ${socket.user.firstName} ${socket.user.lastName} connected (${socket.id})`);

      // Join user-specific room
      socket.join(`user:${userId}`);
      
      // Join role-specific room
      socket.join(`role:${socket.user.role}`);
      
      // Join clinic-specific rooms
      if (socket.user.assignedClinics && socket.user.assignedClinics.length > 0) {
        socket.user.assignedClinics.forEach(clinicId => {
          socket.join(`clinic:${clinicId}`);
        });
      }

      // Handle real-time events
      socket.on('join-appointment-room', (appointmentId: string) => {
        socket.join(`appointment:${appointmentId}`);
      });

      socket.on('leave-appointment-room', (appointmentId: string) => {
        socket.leave(`appointment:${appointmentId}`);
      });

      socket.on('join-clinic-room', (clinicId: string) => {
        // Verify user has access to this clinic
        if (socket.data?.clinicIds.includes(clinicId) || socket.user?.role === 'admin' || socket.user?.role === 'super_admin') {
          socket.join(`clinic:${clinicId}`);
        }
      });

      socket.on('mark-notification-read', async (notificationId: string) => {
        try {
          // Emit to user's room that notification was read
          this.io.to(`user:${userId}`).emit('notification-read', { notificationId });
        } catch (error) {
          console.error('Error handling mark-notification-read:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.user?.firstName} ${socket.user?.lastName} disconnected (${socket.id})`);
        
        // Clean up connections
        this.connectedUsers.delete(userId);
        this.userSockets.delete(socket.id);
      });
    });
  }

  // Public methods for sending notifications
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  public sendToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public sendToClinic(clinicId: string, event: string, data: any) {
    this.io.to(`clinic:${clinicId}`).emit(event, data);
  }

  public sendToAppointment(appointmentId: string, event: string, data: any) {
    this.io.to(`appointment:${appointmentId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  // Notification-specific methods
  public sendNotification(userId: string, notification: any) {
    return this.sendToUser(userId, 'new-notification', notification);
  }

  public sendBulkNotifications(userIds: string[], notification: any) {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.sendToUser(userId, 'new-notification', notification)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  // Appointment-specific methods
  public sendAppointmentUpdate(appointmentId: string, update: any) {
    this.sendToAppointment(appointmentId, 'appointment-updated', update);
  }

  public sendAppointmentReminder(userId: string, appointment: any) {
    this.sendToUser(userId, 'appointment-reminder', appointment);
  }

  // Inventory-specific methods
  public sendInventoryAlert(clinicId: string, alert: any) {
    this.sendToClinic(clinicId, 'inventory-alert', alert);
  }

  public sendLowStockAlert(clinicId: string, items: any[]) {
    this.sendToClinic(clinicId, 'low-stock-alert', { items });
  }

  // System-wide announcements
  public sendSystemAnnouncement(announcement: any) {
    this.broadcastToAll('system-announcement', announcement);
  }
}

export default WebSocketService;

