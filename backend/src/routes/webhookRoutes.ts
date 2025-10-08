import { Router, Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { PayPalService } from '../services/PayPalService';
import { Payment, Billing } from '../models';
import { createAndSendNotification } from '../utils/notificationHelpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Stripe webhook handler
router.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!signature || !webhookSecret) {
    res.status(400).json({
      success: false,
      message: 'Missing stripe signature or webhook secret'
    });
    return;
  }
  
  try {
    const stripeService = new StripeService();
    const event = stripeService.constructEvent(req.body, signature, webhookSecret);

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleStripeDispute(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleStripeSubscriptionPayment(event.data.object);
        break;
      
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error.message);
    res.status(400).json({
      success: false,
      message: `Webhook error: ${error.message}`
    });
  }
});

// PayPal webhook handler
router.post('/paypal', async (req: Request, res: Response) => {
  try {
    const headers = req.headers;
    const body = req.body;

    // Verify PayPal webhook signature
    const paypalService = new PayPalService();
    
    const verificationData = {
      authAlgo: headers['paypal-auth-algo'] as string,
      transmission_id: headers['paypal-transmission-id'] as string,
      cert_id: headers['paypal-cert-id'] as string,
      payload: JSON.stringify(body),
      transmission_time: headers['paypal-transmission-time'] as string,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID!,
      webhook_event: body
    };

    if (process.env.NODE_ENV === 'production') {
      const verification = await paypalService.verifyWebhookSignature(verificationData);
      if (verification.verification_status !== 'SUCCESS') {
        throw new Error('PayPal webhook verification failed');
      }
    }

    console.log(`PayPal webhook received: ${body.event_type}`);

    switch (body.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handlePayPalOrderApproved(body.resource);
        break;
      
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePayPalPaymentCompleted(body.resource);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePayPalPaymentFailed(body.resource);
        break;
      
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handlePayPalSubscriptionActivated(body.resource);
        break;
      
      default:
        console.log(`Unhandled PayPal event type: ${body.event_type}`);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('PayPal webhook error:', error.message);
    res.status(400).json({
      success: false,
      message: `Webhook error: ${error.message}`
    });
  }
});

// Stripe event handlers
async function handleStripePaymentSuccess(paymentIntent: any) {
  try {
    const payment = await (Payment as any).findOne({ paymentIntentId: paymentIntent.id });
    if (!payment) {
      console.error(`Payment not found for Stripe PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = paymentIntent.charges?.data[0]?.id;
    payment.paidAt = new Date();
    
    if (paymentIntent.receipt_url) {
      payment.receiptUrl = paymentIntent.receipt_url;
    }

    await payment.save();

    // Update billing status
    const billing = await (Billing as any).findById(payment.billingId);
    if (billing) {
      billing.paymentStatus = 'paid';
      billing.paidAmount = payment.amount;
        billing.paidDate = new Date();
      await billing.save();
    }

    // Send notification to patient
    await createAndSendNotification({
      userId: payment.patientId.toString(),
      title: 'Payment Successful',
      message: `Your payment of $${payment.amount} has been processed successfully`,
      type: 'payment_success',
      link: `/billing/invoices/${billing?.invoiceNumber}`,
      metadata: {
        paymentId: payment._id,
        amount: payment.amount
      }
    });

  } catch (error) {
    console.error('Error handling Stripe payment success:', error);
  }
}

async function handleStripePaymentFailed(paymentIntent: any) {
  try {
    const payment = await (Payment as any).findOne({ paymentIntentId: paymentIntent.id });
    if (!payment) {
      console.error(`Payment not found for Stripe PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      error: paymentIntent.last_payment_error?.message || 'Payment failed'
    };

    await payment.save();

    // Send notification to patient
    await createAndSendNotification({
      userId: payment.patientId.toString(),
      title: 'Payment Failed',
      message: `Your payment of $${payment.amount} could not be processed. Please try again.`,
      type: 'payment_failed',
      metadata: {
        paymentId: payment._id,
        amount: payment.amount,
        error: paymentIntent.last_payment_error?.message
      }
    });

  } catch (error) {
    console.error('Error handling Stripe payment failure:', error);
  }
}

async function handleStripeDispute(charge: any) {
  try {
    const payment = await (Payment as any).findOne({ transactionId: charge.id });
    if (payment) {
      // Send notification to admin about dispute
      await createAndSendNotification({
        userId: 'admin', // You might want to get actual admin user IDs
        title: 'Payment Dispute',
        message: `A dispute has been created for payment $${payment.amount}`,
        type: 'system',
        metadata: {
          paymentId: payment._id,
          disputeId: charge.id
        }
      });
    }
  } catch (error) {
    console.error('Error handling Stripe dispute:', error);
  }
}

async function handleStripeSubscriptionPayment(invoice: any) {
  // Handle subscription payments if you implement subscription features
  console.log('Stripe subscription payment received:', invoice.id);
}

// PayPal event handlers
async function handlePayPalOrderApproved(resource: any) {
  console.log('PayPal order approved:', resource.id);
  // Handle order approval if needed
}

async function handlePayPalPaymentCompleted(resource: any) {
  try {
    const payment = await (Payment as any).findOne({ paymentIntentId: resource.supplementary_data?.related_ids?.order_id });
    if (!payment) {
      console.error(`Payment not found for PayPal capture: ${resource.id}`);
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = resource.id;
    payment.paidAt = new Date();
    
    await payment.save();

    // Update billing status
    const billing = await (Billing as any).findById(payment.billingId);
    if (billing) {
      billing.paymentStatus = 'paid';
      billing.paidAmount = payment.amount;
        billing.paidDate = new Date();
      await billing.save();
    }

    // Send notification to patient
    await createAndSendNotification({
      userId: payment.patientId.toString(),
      title: 'Payment Successful',
      message: `Your PayPal payment of $${payment.amount} has been processed successfully`,
      type: 'payment_success',
      link: `/billing/invoices/${billing?.invoiceNumber}`,
      metadata: {
        paymentId: payment._id,
        amount: payment.amount
      }
    });

  } catch (error) {
    console.error('Error handling PayPal payment completion:', error);
  }
}

async function handlePayPalPaymentFailed(resource: any) {
  try {
    const payment = await (Payment as any).findOne({ paymentIntentId: resource.supplementary_data?.related_ids?.order_id });
    if (!payment) {
      console.error(`Payment not found for PayPal capture: ${resource.id}`);
      return;
    }

    // Update payment status
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      error: 'PayPal payment denied'
    };

    await payment.save();

    // Send notification to patient
    await createAndSendNotification({
      userId: payment.patientId.toString(),
      title: 'Payment Failed',
      message: `Your PayPal payment of $${payment.amount} was denied. Please try again.`,
      type: 'payment_failed',
      metadata: {
        paymentId: payment._id,
        amount: payment.amount
      }
    });

  } catch (error) {
    console.error('Error handling PayPal payment failure:', error);
  }
}

async function handlePayPalSubscriptionActivated(resource: any) {
  // Handle subscription activation if you implement subscription features
  console.log('PayPal subscription activated:', resource.id);
}

export default router;
