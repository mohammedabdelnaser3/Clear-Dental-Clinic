import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    customerId?: string;
    paymentMethodTypes?: string[];
  }) {
    try {
      const { amount, currency, metadata, customerId, paymentMethodTypes = ['card'] } = params;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method_types: paymentMethodTypes,
        metadata: metadata || {},
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return paymentIntent;
    } catch (error: any) {
      throw new Error(`Stripe Payment Intent creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges', 'charges.data.payment_method_details']
      });
    } catch (error: any) {
      throw new Error(`Stripe Payment Intent retrieval failed: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string) {
    try {
      const params: any = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      return await this.stripe.paymentIntents.confirm(paymentIntentId, params);
    } catch (error: any) {
      throw new Error(`Stripe Payment Intent confirmation failed: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }) {
    try {
      const { paymentIntentId, amount, reason } = params;

      // First get the payment intent to find the charge
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges']
      });

      const charge = (paymentIntent as any).charges?.data[0];
      if (!charge) {
        throw new Error('No charge found for this payment intent');
      }

      const refundParams: any = {
        charge: charge.id,
        reason: reason || 'requested_by_customer'
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      return await this.stripe.refunds.create(refundParams);
    } catch (error: any) {
      throw new Error(`Stripe refund creation failed: ${error.message}`);
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(params: {
    email?: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      return await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata || {}
      });
    } catch (error: any) {
      throw new Error(`Stripe customer creation failed: ${error.message}`);
    }
  }

  /**
   * Update a customer
   */
  async updateCustomer(customerId: string, params: {
    email?: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      return await this.stripe.customers.update(customerId, {
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata
      });
    } catch (error: any) {
      throw new Error(`Stripe customer update failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a customer
   */
  async retrieveCustomer(customerId: string) {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error: any) {
      throw new Error(`Stripe customer retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(customerId: string, paymentMethodTypes: string[] = ['card']) {
    try {
      return await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        usage: 'off_session'
      });
    } catch (error: any) {
      throw new Error(`Stripe Setup Intent creation failed: ${error.message}`);
    }
  }

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string, type: string = 'card') {
    try {
      return await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type as any
      });
    } catch (error: any) {
      throw new Error(`Stripe payment methods retrieval failed: ${error.message}`);
    }
  }

  /**
   * Detach a payment method
   */
  async detachPaymentMethod(paymentMethodId: string) {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error: any) {
      throw new Error(`Stripe payment method detachment failed: ${error.message}`);
    }
  }

  /**
   * Handle webhook events
   */
  constructEvent(payload: string | Buffer, signature: string, secret: string) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error: any) {
      throw new Error(`Stripe webhook verification failed: ${error.message}`);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
  }) {
    try {
      return await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });
    } catch (error: any) {
      throw new Error(`Stripe subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Get subscription
   */
  async retrieveSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: any) {
      throw new Error(`Stripe subscription retrieval failed: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error: any) {
      throw new Error(`Stripe subscription cancellation failed: ${error.message}`);
    }
  }

  /**
   * Get balance
   */
  async getBalance() {
    try {
      return await this.stripe.balance.retrieve();
    } catch (error: any) {
      throw new Error(`Stripe balance retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get dashboard URL for Express accounts
   */
  async createLoginLink(accountId: string) {
    try {
      return await this.stripe.accounts.createLoginLink(accountId);
    } catch (error: any) {
      throw new Error(`Stripe login link creation failed: ${error.message}`);
    }
  }
}
