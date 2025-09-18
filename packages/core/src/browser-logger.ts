export interface OrderLogEntry {
  timestamp: string;
  action: string;
  orderId?: string;
  venueId?: string;
  tableId?: string;
  tableToken?: string;
  details: any;
  success: boolean;
  error?: string;
}

export class BrowserOrderLogger {
  private logs: OrderLogEntry[] = [];

  log(entry: Omit<OrderLogEntry, 'timestamp'>): void {
    const logEntry: OrderLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);
    
    // Log zur Browser-Konsole
    console.log(`[ORDER LOG] ${entry.action}: ${entry.success ? 'SUCCESS' : 'FAILED'}`, entry.details);
    
    // Speichere in localStorage für Debugging (nur im Browser)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('smartorder_logs') || '[]');
        existingLogs.push(logEntry);
        localStorage.setItem('smartorder_logs', JSON.stringify(existingLogs));
      } catch (error) {
        console.error('Failed to save log to localStorage:', error);
      }
    }
  }

  getLogs(): OrderLogEntry[] {
    return this.logs;
  }

  getLogsFromStorage(): OrderLogEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('smartorder_logs') || '[]');
      } catch (error) {
        console.error('Failed to load logs from localStorage:', error);
        return [];
      }
    }
    return [];
  }

  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('smartorder_logs');
    }
  }

  // Hilfsmethoden für Bestellungs-Logs
  logOrderCreation(orderId: string, venueId: string, tableId: string, tableToken: string, success: boolean, error?: string): void {
    this.log({
      action: 'ORDER_CREATED',
      orderId,
      venueId,
      tableId,
      tableToken,
      details: { orderId, venueId, tableId, tableToken },
      success,
      error
    });
  }

  logOrderItemAdded(orderId: string, itemId: string, qty: number, success: boolean, error?: string): void {
    this.log({
      action: 'ORDER_ITEM_ADDED',
      orderId,
      details: { itemId, qty },
      success,
      error
    });
  }

  logPaymentProcessed(orderId: string, paymentMethod: string, amount: number, success: boolean, error?: string): void {
    this.log({
      action: 'PAYMENT_PROCESSED',
      orderId,
      details: { paymentMethod, amount },
      success,
      error
    });
  }

  logCheckoutError(error: string, details: any): void {
    this.log({
      action: 'CHECKOUT_ERROR',
      details,
      success: false,
      error
    });
  }

  logCheckoutSuccess(orderId: string, details: any): void {
    this.log({
      action: 'CHECKOUT_SUCCESS',
      orderId,
      details,
      success: true
    });
  }

  logOrderForAccounting(orderData: {
    orderId: string;
    venueId: string;
    tableId: string;
    tableLabel: string;
    total: number;
    taxTotal: number;
    tipAmount: number;
    currency: string;
    items: any[];
    payments: any[];
    createdAt: string;
    status: string;
  }): void {
    this.log({
      action: 'ORDER_ACCOUNTING_DATA',
      orderId: orderData.orderId,
      venueId: orderData.venueId,
      tableId: orderData.tableId,
      details: {
        tableLabel: orderData.tableLabel,
        total: orderData.total,
        taxTotal: orderData.taxTotal,
        tipAmount: orderData.tipAmount,
        currency: orderData.currency,
        itemCount: orderData.items.length,
        paymentCount: orderData.payments.length,
        status: orderData.status,
        createdAt: orderData.createdAt,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.qty
        })),
        payments: orderData.payments.map(payment => ({
          provider: payment.provider,
          status: payment.status,
          amount: payment.amount
        }))
      },
      success: true
    });
  }
}

// Singleton-Instanz für Browser
export const browserOrderLogger = new BrowserOrderLogger();
