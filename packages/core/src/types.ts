export type Money = number;

export interface CartItemInput {
  itemId: string;
  qty: number;
  modifiers?: Record<string, unknown>;
}

export interface PSPIntent {
  redirectUrl: string;
  providerRef?: string;
}
