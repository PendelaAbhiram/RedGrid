import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Role, AccountStatus } from '@prisma/client';
import { config, isOriginAllowed } from './config';
import { verifyAuthToken, JwtAuthPayload } from './utils/jwt';
import { prisma } from './prisma';

export interface AuthenticatedSocketUser {
  id: string;
  role: Role;
  email: string;
  name: string;
  organizationId?: string | null;
}

export interface CustomSocket extends Socket {
  data: {
    user?: AuthenticatedSocketUser;
  };
}

let ioInstance: SocketIOServer | null = null;

/**
 * Initializes and binds Socket.IO to the Node.js HTTP server.
 */
export function initSocketServer(httpServer: http.Server): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        if (isOriginAllowed(requestOrigin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS_ORIGIN_NOT_ALLOWED'), false);
        }
      },
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // 1. Authentication Middleware
  io.use(async (socket: CustomSocket, next) => {
    try {
      // Extract token from auth object or authorization headers
      let token: string | undefined = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization) {
        const header = socket.handshake.headers.authorization;
        token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
      }

      if (!token) {
        return next(new Error('AUTHENTICATION_ERROR: Missing authentication token'));
      }

      // Verify JWT signature and expiration
      let payload: JwtAuthPayload;
      try {
        payload = verifyAuthToken(token);
      } catch (jwtErr: any) {
        return next(new Error(`AUTHENTICATION_ERROR: Invalid or expired token (${jwtErr.message})`));
      }

      if (!payload || !payload.userId) {
        return next(new Error('AUTHENTICATION_ERROR: Malformed token payload'));
      }

      // Check database to ensure account is active (not suspended/banned)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          managedOrganizations: {
            select: { id: true, status: true },
          },
        },
      });

      if (!user) {
        return next(new Error('AUTHENTICATION_ERROR: User account not found'));
      }

      if (user.status === AccountStatus.BANNED || user.status === AccountStatus.SUSPENDED) {
        return next(new Error(`AUTHENTICATION_ERROR: Account is ${user.status}`));
      }

      let organizationId: string | null = null;
      if (user.managedOrganizations && user.managedOrganizations.length > 0) {
        organizationId = user.managedOrganizations[0].id;
      }

      // Attach authenticated user identity to socket session
      socket.data.user = {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        organizationId,
      };

      next();
    } catch (err: any) {
      console.error('Socket authentication error:', err);
      next(new Error('AUTHENTICATION_ERROR: Internal handshake authentication failure'));
    }
  });

  // 2. Connection and Room Management
  io.on('connection', (socket: CustomSocket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // A. Join user-specific private room
    const userRoom = `user:${user.id}`;
    socket.join(userRoom);

    // B. Join organization room if applicable
    if (user.organizationId) {
      const orgRoom = `organization:${user.organizationId}`;
      socket.join(orgRoom);
    }

    // C. Join role-specific broadcast room if SUPER_ADMIN
    if (user.role === Role.SUPER_ADMIN) {
      socket.join('role:SUPER_ADMIN');
    }

    // D. Allow client to join/leave specific emergency requirement rooms
    socket.on('join:emergency', async (emergencyId: string, callback?: (res: any) => void) => {
      if (!emergencyId || typeof emergencyId !== 'string') {
        if (callback) callback({ success: false, message: 'Invalid emergency ID' });
        return;
      }

      try {
        const alert = await prisma.emergencyAlert.findUnique({
          where: { id: emergencyId },
          select: { id: true, organizationId: true, createdById: true },
        });

        if (!alert) {
          if (callback) callback({ success: false, message: 'Emergency not found' });
          return;
        }

        // Hospital/Blood Bank cannot subscribe to another hospital's private emergency room
        if (user.role === Role.HOSPITAL || user.role === Role.BLOOD_BANK) {
          const isOwner = (user.organizationId && alert.organizationId === user.organizationId) || alert.createdById === user.id;
          if (!isOwner) {
            if (callback) callback({ success: false, message: 'UNAUTHORIZED: Cannot subscribe to another organization emergency room' });
            return;
          }
        }

        socket.join(`emergency:${emergencyId}`);
        if (callback) callback({ success: true, room: `emergency:${emergencyId}` });
      } catch (err: any) {
        if (callback) callback({ success: false, message: 'Failed to join emergency room' });
      }
    });

    socket.on('leave:emergency', (emergencyId: string, callback?: (res: any) => void) => {
      if (emergencyId && typeof emergencyId === 'string') {
        socket.leave(`emergency:${emergencyId}`);
        if (callback) callback({ success: true });
      }
    });

    socket.on('disconnect', (reason) => {
      // Clean teardown handled by socket.io automatically
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Access the active Socket.IO server instance.
 */
export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Real-time event broadcasters
 */

export interface SafeEmergencyCreatedPayload {
  emergencyId: string;
  bloodGroup: string;
  bloodType: string;
  bagsNeeded: number;
  bagsRequired: number;
  urgency: string;
  category: string;
  hospitalName: string;
  department: string;
  address: string;
  description: string;
  criticalNote?: string | null;
  patientInitials?: string;
  patientAge?: number;
  contactPhone?: string;
  distance?: string;
  status: string;
  createdAt: string;
}

/**
 * Emits emergency:created targeted strictly to potential matching donors,
 * the issuing organization, and Super Admin.
 */
export function emitEmergencyCreated(
  alertPayload: any,
  potentialMatchingDonorUserIds: string[]
): void {
  const io = getIO();
  if (!io) return;

  const safeEvent: SafeEmergencyCreatedPayload = {
    emergencyId: alertPayload.id,
    bloodGroup: alertPayload.bloodGroup || alertPayload.bloodType,
    bloodType: alertPayload.bloodType || alertPayload.bloodGroup,
    bagsNeeded: alertPayload.bagsNeeded || alertPayload.bagsRequired,
    bagsRequired: alertPayload.bagsNeeded || alertPayload.bagsRequired,
    urgency: alertPayload.urgency,
    category: alertPayload.category,
    hospitalName: alertPayload.hospitalName,
    department: alertPayload.department || 'Trauma Bay',
    address: alertPayload.address,
    description: alertPayload.description,
    criticalNote: alertPayload.criticalNote,
    patientInitials: alertPayload.patientInitials,
    patientAge: alertPayload.patientAge,
    contactPhone: alertPayload.contactPhone,
    distance: alertPayload.distance || '0.9 km',
    status: alertPayload.status || 'ACTIVE',
    createdAt: alertPayload.createdAt || new Date().toISOString(),
  };

  // 1. Target matching donors exclusively
  potentialMatchingDonorUserIds.forEach((donorUserId) => {
    io.to(`user:${donorUserId}`).emit('emergency:created', {
      ...safeEvent,
      isTargetedMatch: true,
    });
  });

  // 2. Notify issuing organization room
  if (alertPayload.organizationId) {
    io.to(`organization:${alertPayload.organizationId}`).emit('emergency:created', safeEvent);
  }

  // 3. Notify Super Admin audit room
  io.to('role:SUPER_ADMIN').emit('emergency:created', {
    ...safeEvent,
    matchedDonorsCount: potentialMatchingDonorUserIds.length,
  });
}

export interface SafeDonorResponsePayload {
  id: string;
  emergencyId: string;
  donorUserId: string;
  donorName: string;
  bloodGroup: string;
  status: string;
  rawStatus: string;
  distance: string;
  eta: string;
  etaMinutes: number;
  phone?: string;
  targetAlert: string;
  respondedAt: string;
  time?: string;
}

/**
 * Emits emergency:donor-response to the organization owning the emergency,
 * the emergency room, and Super Admin.
 */
export function emitEmergencyDonorResponse(
  alert: any,
  responsePayload: SafeDonorResponsePayload
): void {
  const io = getIO();
  if (!io) return;

  const targetRoom = alert.organizationId ? `organization:${alert.organizationId}` : `user:${alert.createdById}`;
  
  // 1. Emit to hospital / blood bank organization
  io.to(targetRoom).emit('emergency:donor-response', {
    emergencyId: alert.id,
    response: responsePayload,
    hospitalName: alert.hospitalName,
  });

  // 2. Emit to emergency specific room
  io.to(`emergency:${alert.id}`).emit('emergency:donor-response', {
    emergencyId: alert.id,
    response: responsePayload,
    hospitalName: alert.hospitalName,
  });

  // 3. Emit to Super Admin
  io.to('role:SUPER_ADMIN').emit('emergency:donor-response', {
    emergencyId: alert.id,
    response: responsePayload,
    hospitalName: alert.hospitalName,
  });
}

/**
 * Emits emergency:updated (e.g. status change to FULFILLED, CANCELLED, or bags updated)
 */
export function emitEmergencyUpdated(
  alertPayload: any,
  organizationId?: string | null
): void {
  const io = getIO();
  if (!io) return;

  const eventData = {
    emergencyId: alertPayload.id,
    id: alertPayload.id,
    status: alertPayload.status,
    bagsNeeded: alertPayload.bagsNeeded || alertPayload.bagsRequired,
    bagsFulfilled: alertPayload.bagsFulfilled || 0,
    respondingDonorsCount: alertPayload.respondingDonorsCount,
    urgency: alertPayload.urgency,
    category: alertPayload.category,
    hospitalName: alertPayload.hospitalName,
    updatedAt: new Date().toISOString(),
  };

  // Broadcast to emergency room
  io.to(`emergency:${alertPayload.id}`).emit('emergency:updated', eventData);

  // Broadcast to organization room
  if (organizationId) {
    io.to(`organization:${organizationId}`).emit('emergency:updated', eventData);
  }

  // Broadcast to Super Admin
  io.to('role:SUPER_ADMIN').emit('emergency:updated', eventData);

  // Broadcast to all connected clients (so public emergency cards reflect FULFILLED / CANCELLED status)
  io.emit('emergency:updated', eventData);
}

export interface InventoryUpdatedPayload {
  organizationId: string;
  organizationName: string;
  bloodGroup: string;
  newQuantity?: number;
  quantity?: number;
  delta?: number;
  previousQuantity?: number;
  totalBags: number;
  inventory?: Record<string, number>;
  orgInventory?: Record<string, number>;
  networkTotals?: Record<string, number>;
}

/**
 * Emits inventory:updated when stock levels change
 */
export function emitInventoryUpdated(
  payloadOrOrgId: string | InventoryUpdatedPayload,
  organizationName?: string,
  bloodGroup?: string,
  newQuantity?: number,
  delta?: number,
  orgInventory?: Record<string, number>,
  totalBags?: number,
  networkTotals?: Record<string, number>
): void {
  const io = getIO();
  if (!io) return;

  let eventData: any;
  let targetOrgId: string;

  if (typeof payloadOrOrgId === 'string') {
    targetOrgId = payloadOrOrgId;
    eventData = {
      organizationId: payloadOrOrgId,
      organizationName: organizationName || '',
      bloodGroup: bloodGroup || '',
      quantity: newQuantity || 0,
      newQuantity: newQuantity || 0,
      delta: delta || 0,
      totalBags: totalBags || 0,
      inventory: orgInventory,
      networkTotals,
      updatedAt: new Date().toISOString(),
    };
  } else {
    targetOrgId = payloadOrOrgId.organizationId;
    eventData = {
      organizationId: payloadOrOrgId.organizationId,
      organizationName: payloadOrOrgId.organizationName,
      bloodGroup: payloadOrOrgId.bloodGroup,
      quantity: payloadOrOrgId.quantity ?? payloadOrOrgId.newQuantity ?? 0,
      newQuantity: payloadOrOrgId.newQuantity ?? payloadOrOrgId.quantity ?? 0,
      delta: payloadOrOrgId.delta ?? 0,
      previousQuantity: payloadOrOrgId.previousQuantity,
      totalBags: payloadOrOrgId.totalBags,
      inventory: payloadOrOrgId.inventory ?? payloadOrOrgId.orgInventory,
      networkTotals: payloadOrOrgId.networkTotals,
      updatedAt: new Date().toISOString(),
    };
  }

  // 1. Emit full inventory details to organization room
  if (targetOrgId) {
    io.to(`organization:${targetOrgId}`).emit('inventory:updated', eventData);
  }

  // 2. Emit to Super Admin
  io.to('role:SUPER_ADMIN').emit('inventory:updated', eventData);

  // 3. Broadcast aggregate network stock update if available
  if (eventData.networkTotals) {
    io.emit('network-stock:updated', {
      networkTotals: eventData.networkTotals,
      updatedAt: new Date().toISOString(),
    });
  }
}

export interface NotificationSocketPayload {
  id: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

/**
 * Emits notification:new to the specific user's private room.
 */
export function emitNotificationNew(notification: NotificationSocketPayload): void {
  const io = getIO();
  if (!io) return;

  // Emit to recipient's private user room
  io.to(`user:${notification.recipientUserId}`).emit('notification:new', notification);
}

/**
 * Emits notification:updated when a notification's status (such as isRead) changes.
 */
export function emitNotificationUpdated(notification: NotificationSocketPayload): void {
  const io = getIO();
  if (!io) return;

  io.to(`user:${notification.recipientUserId}`).emit('notification:updated', notification);
}

/**
 * Emits notification:all-read when a user marks all their notifications as read.
 */
export function emitNotificationAllRead(userId: string): void {
  const io = getIO();
  if (!io) return;

  io.to(`user:${userId}`).emit('notification:all-read', {
    userId,
    readAt: new Date().toISOString(),
  });
}

/**
 * Gracefully terminates the Socket.IO instance and closes all active client sockets.
 */
export async function closeSocketServer(): Promise<void> {
  if (ioInstance) {
    await new Promise<void>((resolve) => {
      ioInstance!.close(() => {
        ioInstance = null;
        resolve();
      });
    });
  }
}

