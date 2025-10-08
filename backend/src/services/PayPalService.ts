import axios from 'axios';

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class PayPalService {
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseURL = process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

    this.clientId = process.env.PAYPAL_CLIENT_ID!;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal client ID and secret are required');
    }
  }

  /**
   * Get access token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post<PayPalTokenResponse>(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

      return this.accessToken;
    } catch (error: any) {
      throw new Error(`PayPal token generation failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Make authenticated request to PayPal API
   */
  private async makeRequest(method: string, endpoint: string, data?: any) {
    const token = await this.getAccessToken();
    
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      throw new Error(`PayPal API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create an order
   */
  async createOrder(params: {
    amount: number;
    currency: string;
    description?: string;
    invoiceId?: string;
  }) {
    const { amount, currency, description, invoiceId } = params;

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: invoiceId || `order_${Date.now()}`,
        description: description || 'Payment for services',
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2)
        }
      }],
      application_context: {
        brand_name: process.env.CLINIC_NAME || 'Smart Clinic',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`
      }
    };

    return await this.makeRequest('POST', '/v2/checkout/orders', orderData);
  }

  /**
   * Capture an order
   */
  async captureOrder(orderId: string) {
    return await this.makeRequest('POST', `/v2/checkout/orders/${orderId}/capture`);
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string) {
    return await this.makeRequest('GET', `/v2/checkout/orders/${orderId}`);
  }

  /**
   * Refund a captured payment
   */
  async refundCapture(params: {
    captureId: string;
    amount?: number;
    currency?: string;
    reason?: string;
  }) {
    const { captureId, amount, currency = 'USD', reason } = params;

    const refundData: any = {
      note_to_payer: reason || 'Refund processed'
    };

    if (amount) {
      refundData.amount = {
        value: amount.toFixed(2),
        currency_code: currency.toUpperCase()
      };
    }

    return await this.makeRequest('POST', `/v2/payments/captures/${captureId}/refund`, refundData);
  }

  /**
   * Get capture details
   */
  async getCapture(captureId: string) {
    return await this.makeRequest('GET', `/v2/payments/captures/${captureId}`);
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string) {
    return await this.makeRequest('GET', `/v2/payments/refunds/${refundId}`);
  }

  /**
   * Create a subscription plan
   */
  async createSubscriptionPlan(params: {
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: 'MONTH' | 'YEAR';
  }) {
    const { name, description, amount, currency, interval } = params;

    const planData = {
      product_id: await this.createProduct({ name, description }),
      name,
      description,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: {
          interval_unit: interval,
          interval_count: 1
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite cycles
        pricing_scheme: {
          fixed_price: {
            value: amount.toFixed(2),
            currency_code: currency.toUpperCase()
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    };

    return await this.makeRequest('POST', '/v1/billing/plans', planData);
  }

  /**
   * Create a product (required for subscription plans)
   */
  private async createProduct(params: { name: string; description: string }) {
    const { name, description } = params;

    const productData = {
      name,
      description,
      type: 'SERVICE',
      category: 'HEALTHCARE'
    };

    const product = await this.makeRequest('POST', '/v1/catalogs/products', productData);
    return product.id;
  }

  /**
   * Create a subscription
   */
  async createSubscription(params: {
    planId: string;
    subscriberName?: string;
    subscriberEmail?: string;
  }) {
    const { planId, subscriberName, subscriberEmail } = params;

    const subscriptionData = {
      plan_id: planId,
      start_time: new Date().toISOString(),
      subscriber: {
        name: {
          given_name: subscriberName?.split(' ')[0] || 'Subscriber',
          surname: subscriberName?.split(' ')[1] || ''
        },
        email_address: subscriberEmail
      },
      application_context: {
        brand_name: process.env.CLINIC_NAME || 'Smart Clinic',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.FRONTEND_URL}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancelled`
      }
    };

    return await this.makeRequest('POST', '/v1/billing/subscriptions', subscriptionData);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    return await this.makeRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string) {
    const cancelData = {
      reason: reason || 'Cancelled by user'
    };

    return await this.makeRequest('POST', `/v1/billing/subscriptions/${subscriptionId}/cancel`, cancelData);
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(params: {
    authAlgo: string;
    transmission_id: string;
    cert_id: string;
    payload: string;
    transmission_time: string;
    webhook_id: string;
    webhook_event: any;
  }) {
    const verifyData = {
      auth_algo: params.authAlgo,
      transmission_id: params.transmission_id,
      cert_id: params.cert_id,
      raw_body: params.payload,
      transmission_time: params.transmission_time,
      webhook_id: params.webhook_id,
      webhook_event: params.webhook_event
    };

    return await this.makeRequest('POST', '/v1/notifications/verify-webhook-signature', verifyData);
  }
}
