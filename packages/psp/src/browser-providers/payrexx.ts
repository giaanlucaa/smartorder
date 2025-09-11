// Browser-kompatible Payrexx-Implementierung
import type { PaymentProvider } from "..";

// Browser-kompatible Crypto-Funktionen
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

export const browserPayrexxProvider: PaymentProvider = {
  async createCheckout({ orderId, amount, currency, description, successUrl, failureUrl }) {
    const instance = process.env.NEXT_PUBLIC_PAYREXX_INSTANCE || '';
    const apiKey = process.env.NEXT_PUBLIC_PAYREXX_API_KEY || '';
    
    if (!instance || !apiKey) {
      throw new Error('Payrexx-Konfiguration fehlt');
    }
    
    const body = new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency,
      referenceId: orderId,
      purpose: description,
      successRedirectUrl: successUrl,
      failedRedirectUrl: failureUrl,
    });

    try {
      const res = await browserFetch(`https://${instance}.payrexx.com/api/v1.0/Payment`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body,
      });

      const json: any = await res.json();
      const link = json?.data?.[0]?.link ?? json?.link;
      const id = json?.data?.[0]?.id ?? json?.id;
      
      if (!link) {
        throw new Error("Payrexx: missing redirect link");
      }
      
      return { redirectUrl: link, providerRef: String(id) };
    } catch (error) {
      console.error('Payrexx Checkout-Fehler:', error);
      throw error;
    }
  },

  async verifyWebhook(rawBody: string, headers: Record<string, string>) {
    const sigSecret = process.env.NEXT_PUBLIC_PAYREXX_SIGNATURE_SECRET || '';
    
    if (!sigSecret) {
      console.warn('Payrexx Signature Secret nicht konfiguriert');
      return { ok: false, providerEventId: null, orderId: null, amount: null, status: 'FAILED', raw: {} };
    }
    
    const signature = headers["x-signature"] || headers["x-payrexx-signature"];
    
    if (!signature) {
      console.warn('Keine Signatur in Webhook-Headers gefunden');
      return { ok: false, providerEventId: null, orderId: null, amount: null, status: 'FAILED', raw: {} };
    }
    
    try {
      const computed = await createHmacSha256(rawBody, sigSecret);
      const ok = signature === computed;

      let parsed: any = {};
      try { 
        parsed = JSON.parse(rawBody); 
      } catch (e) {
        console.error('JSON-Parse-Fehler:', e);
      }

      const data = parsed?.data?.[0] ?? parsed;
      const providerEventId = data?.transaction?.uuid || data?.id;
      const orderId = data?.referenceId || data?.transaction?.referenceId;
      const amount = data?.amount ? Number(data.amount) / 100 : undefined;
      const status = (data?.status || "").toUpperCase();

      let mapped: string;
      if (status === "CONFIRMED" || status === "AUTHORIZED" || status === "COMPLETED") {
        mapped = "SETTLED";
      } else if (status === "CANCELED") {
        mapped = "CANCELED";
      } else {
        mapped = "FAILED";
      }

      return { ok, providerEventId, orderId, amount, status: mapped, raw: parsed };
    } catch (error) {
      console.error('Webhook-Verifikation-Fehler:', error);
      return { ok: false, providerEventId: null, orderId: null, amount: null, status: 'FAILED', raw: {} };
    }
  },
};
