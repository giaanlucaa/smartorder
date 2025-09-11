// Browser-kompatible DataTrans-Implementierung
import type { PaymentProvider } from "..";

// Browser-kompatible Crypto-Funktionen für DataTrans
async function createHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Browser-kompatible Fetch mit Fehlerbehandlung
async function browserFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch-Fehler:', error);
    throw error;
  }
}

export const browserDataTransProvider: PaymentProvider = {
  async createCheckout({ orderId, amount, currency, description, successUrl, failureUrl }) {
    const merchantId = process.env.NEXT_PUBLIC_DATATRANS_MERCHANT_ID || '';
    const apiPassword = process.env.NEXT_PUBLIC_DATATRANS_API_PASSWORD || '';
    const useSandbox = process.env.NEXT_PUBLIC_DATATRANS_USE_SANDBOX === 'true';
    
    if (!merchantId || !apiPassword) {
      throw new Error('DataTrans-Konfiguration fehlt');
    }
    
    const baseUrl = useSandbox 
      ? 'https://api.sandbox.datatrans.com' 
      : 'https://api.datatrans.com';
    
    const requestData = {
      merchantId,
      amount: Math.round(amount * 100), // DataTrans erwartet Cent
      currency: currency.toUpperCase(),
      refno: orderId,
      sign: '', // Wird später berechnet
      successUrl,
      errorUrl: failureUrl,
      cancelUrl: failureUrl,
      webhookUrl: `${window.location.origin}/api/payments/webhook`,
      option: {
        createAlias: false,
        returnCustomerCountry: true
      }
    };
    
    try {
      // Signatur berechnen (vereinfacht für Browser)
      const signString = `${merchantId}${requestData.amount}${requestData.currency}${orderId}`;
      const signature = await createHmacSha256(signString, apiPassword);
      requestData.sign = signature;
      
      const res = await browserFetch(`${baseUrl}/v1/transactions`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${merchantId}:${apiPassword}`)}`
        },
        body: JSON.stringify(requestData),
      });

      const json: any = await res.json();
      
      if (!json.transactionId) {
        throw new Error("DataTrans: missing transaction ID");
      }
      
      // Redirect-URL für DataTrans erstellen
      const redirectUrl = `${baseUrl}/v1/transactions/${json.transactionId}/redirect`;
      
      return { 
        redirectUrl, 
        providerRef: json.transactionId 
      };
    } catch (error) {
      console.error('DataTrans Checkout-Fehler:', error);
      throw error;
    }
  },

  async verifyWebhook(rawBody: string, headers: Record<string, string>) {
    const apiPassword = process.env.NEXT_PUBLIC_DATATRANS_API_PASSWORD || '';
    
    if (!apiPassword) {
      console.warn('DataTrans API Password nicht konfiguriert');
      return { ok: false, providerEventId: null, orderId: null, amount: null, status: 'FAILED', raw: {} };
    }
    
    const signature = headers["authorization"] || headers["x-datatrans-signature"];
    
    if (!signature) {
      console.warn('Keine Signatur in Webhook-Headers gefunden');
      return { ok: false, providerEventId: null, orderId: null, amount: null, status: 'FAILED', raw: {} };
    }
    
    try {
      // Vereinfachte Signatur-Verifikation für Browser
      const computed = await createHmacSha256(rawBody, apiPassword);
      const ok = signature.includes(computed);

      let parsed: any = {};
      try { 
        parsed = JSON.parse(rawBody); 
      } catch (e) {
        console.error('JSON-Parse-Fehler:', e);
      }

      const transactionId = parsed?.transactionId;
      const orderId = parsed?.refno;
      const amount = parsed?.amount ? Number(parsed.amount) / 100 : undefined;
      const status = (parsed?.status || "").toUpperCase();

      let mapped: string;
      if (status === "AUTHORIZED" || status === "SETTLED") {
        mapped = "SETTLED";
      } else if (status === "CANCELED") {
        mapped = "CANCELED";
      } else {
        mapped = "FAILED";
      }

      return { 
        ok, 
        providerEventId: transactionId, 
        orderId, 
        amount, 
        status: mapped, 
        raw: parsed 
      };
    } catch (error) {
      console.error('DataTrans Webhook-Verifikation-Fehler:', error);
      return { ok: false, providerEventId: null, orderId: null, amount: null, status: 'FAILED', raw: {} };
    }
  },
};
