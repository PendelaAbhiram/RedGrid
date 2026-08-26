import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { EmergencyAlert, BloodGroup, UserRole, AppNotification } from '../types';
import { WS_BASE_URL } from '../lib/api';

export interface UseSocketOptions {
  isLoggedIn: boolean;
  userRole: UserRole;
  activeOrgId?: string;
  onEmergencyCreated?: (emergency: EmergencyAlert) => void;
  onEmergencyUpdated?: (emergency: Partial<EmergencyAlert> & { id: string }) => void;
  onDonorResponse?: (response: any) => void;
  onInventoryUpdated?: (data: {
    organizationId: string;
    organizationName: string;
    bloodGroup: string;
    quantity: number;
    delta: number;
    previousQuantity: number;
    newQuantity: number;
    totalBags: number;
    inventory?: Record<string, number>;
  }) => void;
  onNotificationNew?: (notification: AppNotification) => void;
  onNotificationUpdated?: (notification: AppNotification) => void;
  onNotificationAllRead?: (data: { userId: string; readAt: string }) => void;
  onReconnect?: () => void;
}

export function useSocket({
  isLoggedIn,
  userRole,
  activeOrgId,
  onEmergencyCreated,
  onEmergencyUpdated,
  onDonorResponse,
  onInventoryUpdated,
  onNotificationNew,
  onNotificationUpdated,
  onNotificationAllRead,
  onReconnect,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');

  // Keep references to latest callbacks to avoid unnecessary socket reconnects
  const callbacksRef = useRef({
    onEmergencyCreated,
    onEmergencyUpdated,
    onDonorResponse,
    onInventoryUpdated,
    onNotificationNew,
    onNotificationUpdated,
    onNotificationAllRead,
    onReconnect,
  });

  useEffect(() => {
    callbacksRef.current = {
      onEmergencyCreated,
      onEmergencyUpdated,
      onDonorResponse,
      onInventoryUpdated,
      onNotificationNew,
      onNotificationUpdated,
      onNotificationAllRead,
      onReconnect,
    };
  });

  useEffect(() => {
    if (!isLoggedIn) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('redgrid_token');
    if (!token) return;

    // Create single socket instance (environment-aware for local or remote backend)
    const socket = WS_BASE_URL
      ? io(WS_BASE_URL, {
          auth: { token },
          query: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        })
      : io({
          auth: { token },
          query: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on('upgrade', (rawTransport) => {
        setTransport(rawTransport.name);
      });

      // Join rooms
      if (activeOrgId) {
        socket.emit('subscribe:organization', activeOrgId);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      if (activeOrgId) {
        socket.emit('subscribe:organization', activeOrgId);
      }
      if (callbacksRef.current.onReconnect) {
        callbacksRef.current.onReconnect();
      }
    });

    // Real-time Event Listeners
    socket.on('emergency:created', (data) => {
      if (callbacksRef.current.onEmergencyCreated) {
        callbacksRef.current.onEmergencyCreated(data);
      }
    });

    socket.on('emergency:updated', (data) => {
      if (callbacksRef.current.onEmergencyUpdated) {
        callbacksRef.current.onEmergencyUpdated(data);
      }
    });

    socket.on('emergency:donor-response', (data) => {
      if (callbacksRef.current.onDonorResponse) {
        callbacksRef.current.onDonorResponse(data);
      }
    });

    socket.on('inventory:updated', (data) => {
      if (callbacksRef.current.onInventoryUpdated) {
        callbacksRef.current.onInventoryUpdated(data);
      }
    });

    socket.on('notification:new', (data) => {
      if (callbacksRef.current.onNotificationNew) {
        callbacksRef.current.onNotificationNew(data);
      }
    });

    socket.on('notification:updated', (data) => {
      if (callbacksRef.current.onNotificationUpdated) {
        callbacksRef.current.onNotificationUpdated(data);
      }
    });

    socket.on('notification:all-read', (data) => {
      if (callbacksRef.current.onNotificationAllRead) {
        callbacksRef.current.onNotificationAllRead(data);
      }
    });


    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isLoggedIn, activeOrgId]);

  // Allow manual room subscription if needed
  const subscribeToEmergency = useCallback((emergencyId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe:emergency', emergencyId);
    }
  }, []);

  const unsubscribeFromEmergency = useCallback((emergencyId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unsubscribe:emergency', emergencyId);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    transport,
    subscribeToEmergency,
    unsubscribeFromEmergency,
  };
}
