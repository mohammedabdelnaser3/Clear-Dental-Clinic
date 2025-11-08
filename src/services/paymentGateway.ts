// Lightweight payment gateway abstraction for tokenization and processing
// NOTE: In production, replace with a trusted PCI-compliant provider (e.g., Stripe/Braintree).

export interface TokenizeParams {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export interface TokenizeResult {
  success: boolean;
  token?: string;
  last4?: string;
  brand?: string;
  message?: string;
}

export interface ProcessParams {
  amount: number;
  method: string;
  token: string;
}

export interface ProcessResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

const randomId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const detectBrand = (pan: string) => {
  if (/^4\d{12,18}$/.test(pan)) return 'visa';
  if (/^5[1-5]\d{14}$/.test(pan)) return 'mastercard';
  if (/^3[47]\d{13}$/.test(pan)) return 'amex';
  return 'card';
};

export const paymentGateway = {
  async tokenizeCard(params: TokenizeParams): Promise<TokenizeResult> {
    try {
      // Simulate secure tokenization: never return PAN/CVV
      const last4 = params.cardNumber.slice(-4);
      const brand = detectBrand(params.cardNumber);
      const token = randomId('tok');
      await new Promise(r => setTimeout(r, 400));
      return { success: true, token, last4, brand };
    } catch (e) {
      return { success: false, message: 'Tokenization failed' };
    }
  },

  async processPayment(params: ProcessParams): Promise<ProcessResult> {
    try {
      // Simulate 90% success rate
      await new Promise(r => setTimeout(r, 800));
      const ok = Math.random() > 0.1;
      if (!ok) return { success: false, message: 'Payment declined' };
      return { success: true, transactionId: randomId('txn') };
    } catch (e) {
      return { success: false, message: 'Gateway error' };
    }
  }
};