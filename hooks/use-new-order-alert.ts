import { useState, useEffect, useRef } from 'react';
import { playOrderAlert, stopOrderAlert } from '../lib/audio';
import { api } from '../lib/api-client';
import { triggerHaptic } from '../lib/haptic';

interface OrderAlertData {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  createdAt: string;
  items: any[];
  address?: any;
}

export function useNewOrderAlert(enabled = true) {
  const [pendingOrders, setPendingOrders] = useState<OrderAlertData[]>([]);
  const [activeAlertOrder, setActiveAlertOrder] = useState<OrderAlertData | null>(null);
  const acknowledgedIds = useRef<Set<string>>(new Set());

  const fetchPendingOrders = async () => {
    try {
      // Fetch all active/pending orders from api
      const data = await api.get('/orders?all=true');
      if (Array.isArray(data)) {
        const pending = data.filter((o: any) => o.status === 'PENDING');
        setPendingOrders(pending);
      }
    } catch (e) {
      console.warn('[NewOrderAlert] Failed to fetch pending orders:', e);
    }
  };

  // Poll for new orders every 10 seconds if enabled
  useEffect(() => {
    if (!enabled) return;

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 10000);

    return () => {
      clearInterval(interval);
      stopOrderAlert();
    };
  }, [enabled]);

  // Determine active alert order based on pending list and acknowledged IDs
  useEffect(() => {
    if (!enabled || pendingOrders.length === 0) {
      setActiveAlertOrder(null);
      stopOrderAlert();
      return;
    }

    // Find the first pending order that has not been acknowledged yet
    const nextAlert = pendingOrders.find(o => !acknowledgedIds.current.has(o.id));

    if (nextAlert) {
      setActiveAlertOrder(nextAlert);
      playOrderAlert();
      triggerHaptic('warning');
    } else {
      setActiveAlertOrder(null);
      stopOrderAlert();
    }
  }, [pendingOrders, enabled]);

  const acknowledgeAlert = (orderId: string) => {
    acknowledgedIds.current.add(orderId);
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    triggerHaptic('light');
  };

  const acceptOrder = async (orderId: string) => {
    try {
      // Advance status from PENDING to CONFIRMED
      await api.patch(`/orders/${orderId}`, { status: 'CONFIRMED' });
      acknowledgeAlert(orderId);
      triggerHaptic('success');
      return true;
    } catch (e: any) {
      console.warn('[NewOrderAlert] Failed to accept order:', e);
      return false;
    }
  };

  return {
    activeAlertOrder,
    acknowledgeAlert,
    acceptOrder,
    refreshAlerts: fetchPendingOrders,
  };
}
