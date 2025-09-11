export interface PaymentProvider {
  createCheckout(params: {
    orderId: string;
    amount: number;
    currency: string;
    description: string;
    successUrl: string;
    failureUrl: string;
  }): Promise<{ redirectUrl: string; providerRef?: string }>;

  verifyWebhook(rawBody: string, headers: Record<string, string>): {
    ok: boolean;
    providerEventId?: string;
    orderId?: string;
    amount?: number;
    status?: "SETTLED" | "FAILED" | "CANCELED";
    raw: any;
  };
}

export function getProvider(): PaymentProvider {
  const p = process.env.NEXT_PUBLIC_PSP_PROVIDER;
  if (p === "datatrans") return require("./browser-providers/datatrans").browserDataTransProvider;
  return require("./browser-providers/payrexx").browserPayrexxProvider;
}
