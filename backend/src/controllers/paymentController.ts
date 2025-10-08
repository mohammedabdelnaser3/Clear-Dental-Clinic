import { Request, Response } from 'express';
import { Payment, Billing } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse
} from '../utils/helpers';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';
import { createAndSendNotification } from '../utils/notificationHelpers';
import { StripeService } from '../services/StripeService';
import { PayPalService } from '../services/PayPalService';

// Create payment intent
export const createPaymentIntent = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { billingId, paymentMethod, paymentProvider = 'stripe' } = req.body;

  // Get billing record
  const billing = await (Billing as any).findById(billingId).populate('patientId');
  if (!billing) {
    throw createNotFoundError('Billing record');
  }

  // Check if payment already exists for this billing
  const existingPayment = await (Payment as any).findOne({ 
    billingId, 
    status: { $in: ['pending', 'processing', 'completed'] } 
  });
  
  if (existingPayment && existingPayment.status === 'completed') {
    throw createValidationError('payment', 'This invoice has already been paid');
  }

  let paymentData: any = {
    billingId,
    patientId: billing.patientId._id,
    clinicId: billing.clinicId,
    amount: billing.totalAmount,
    currency: 'USD',
    paymentMethod,
    paymentProvider,
    description: `Payment for invoice ${billing.invoiceNumber}`,
    createdBy: req.user._id
  };

  let paymentIntent: any = null;

  try {
    if (paymentProvider === 'stripe' && paymentMethod === 'card') {
      const stripeService = new StripeService();
      paymentIntent = await stripeService.createPaymentIntent({
        amount: billing.totalAmount,
        currency: 'USD',
        metadata: {
          billingId: billingId,
          patientId: billing.patientId._id.toString(),
          clinicId: billing.clinicId.toString()
        }
      });

      paymentData.paymentIntentId = paymentIntent.id;
      paymentData.gatewayResponse = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } else if (paymentProvider === 'paypal') {
      const paypalService = new PayPalService();
      paymentIntent = await paypalService.createOrder({
        amount: billing.totalAmount,
        currency: 'USD',
        description: `Payment for invoice ${billing.invoiceNumber}`
      });

      paymentData.paymentIntentId = paymentIntent.id;
      paymentData.gatewayResponse = {
        orderId: paymentIntent.id,
        approvalUrl: paymentIntent.links?.find((link: any) => link.rel === 'approve')?.href
      };
    }

    // Create payment record
    const payment = await (Payment as any).create(paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        payment,
        ...(paymentIntent && { paymentIntent })
      }
    });

  } catch (error: any) {
    throw new AppError(`Payment processing error: ${error.message}`, 400);
  }
});

// Confirm payment
export const confirmPayment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentId } = req.params;
  const { paymentIntentId, transactionId } = req.body;

  const payment = await (Payment as any).findById(paymentId);
  if (!payment) {
    throw createNotFoundError('Payment');
  }

  if (payment.status === 'completed') {
    throw createValidationError('payment', 'Payment is already completed');
  }

  try {
    let confirmed = false;
    let gatewayResponse: any = {};

    if (payment.paymentProvider === 'stripe') {
      const stripeService = new StripeService();
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        confirmed = true;
        gatewayResponse = {
          paymentIntentId: paymentIntent.id,
          transactionId: (paymentIntent as any).charges?.data[0]?.id,
          receiptUrl: (paymentIntent as any).charges?.data[0]?.receipt_url
        };
        
        // Extract card details if available
        const paymentMethodObj = (paymentIntent as any).charges?.data[0]?.payment_method_details?.card;
        if (paymentMethodObj) {
          payment.cardDetails = {
            last4: paymentMethodObj.last4,
            brand: paymentMethodObj.brand,
            expiryMonth: paymentMethodObj.exp_month,
            expiryYear: paymentMethodObj.exp_year,
            fingerprint: paymentMethodObj.fingerprint
          };
        }
      }
    } else if (payment.paymentProvider === 'paypal') {
      const paypalService = new PayPalService();
      const order = await paypalService.captureOrder(paymentIntentId);
      
      if (order.status === 'COMPLETED') {
        confirmed = true;
        gatewayResponse = {
          orderId: order.id,
          transactionId: order.purchase_units[0]?.payments?.captures[0]?.id
        };
      }
    }

    if (confirmed) {
      payment.status = 'completed';
      payment.transactionId = gatewayResponse.transactionId || transactionId;
      payment.gatewayResponse = { ...payment.gatewayResponse, ...gatewayResponse };
      payment.receiptUrl = gatewayResponse.receiptUrl;
      payment.paidAt = new Date();
      payment.updatedBy = req.user._id;

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
          amount: payment.amount,
          invoiceNumber: billing?.invoiceNumber
        }
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: { payment }
      });
    } else {
      throw new AppError('Payment confirmation failed', 400);
    }

  } catch (error: any) {
    // Mark payment as failed
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.gatewayResponse = { 
      ...payment.gatewayResponse, 
      error: error.message 
    };
    await payment.save();

    throw new AppError(`Payment confirmation failed: ${error.message}`, 400);
  }
});

// Process manual payment (cash, check, etc.)
export const processManualPayment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { billingId, paymentMethod, amount, notes, receiptNumber } = req.body;

  // Get billing record
  const billing = await (Billing as any).findById(billingId);
  if (!billing) {
    throw createNotFoundError('Billing record');
  }

  // Create manual payment
  const payment = await (Payment as any).create({
    billingId,
    patientId: billing.patientId,
    clinicId: billing.clinicId,
    amount: amount || billing.totalAmount,
    currency: 'USD',
    paymentMethod,
    paymentProvider: 'manual',
    status: 'completed',
    description: notes || `Manual ${paymentMethod} payment for invoice ${billing.invoiceNumber}`,
    transactionId: receiptNumber,
    paidAt: new Date(),
    createdBy: req.user._id
  });

  // Update billing status
  billing.paymentStatus = 'paid';
  billing.paidAmount = payment.amount;
  billing.paidDate = new Date();
  await billing.save();

  // Send notification to patient
  await createAndSendNotification({
    userId: billing.patientId.toString(),
    title: 'Payment Received',
    message: `Your ${paymentMethod} payment of $${payment.amount} has been received`,
    type: 'payment_success',
    link: `/billing/invoices/${billing.invoiceNumber}`,
    metadata: {
      paymentId: payment._id,
      amount: payment.amount,
      paymentMethod
    }
  });

  res.status(201).json({
    success: true,
    message: 'Manual payment processed successfully',
    data: { payment }
  });
});

// Get payments for a billing record
export const getPaymentsByBilling = catchAsync(async (req: Request, res: Response) => {
  const { billingId } = req.params;

  const payments = await (Payment as any).findByBilling(billingId);

  res.json({
    success: true,
    data: { payments }
  });
});

// Get patient payments
export const getPatientPayments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);

  const [payments, total] = await Promise.all([
    (Payment as any).findByPatient(patientId, { skip, limit }),
    (Payment as any).countDocuments({ patientId })
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(payments, total, page, limit)
  });
});

// Get clinic payments
export const getClinicPayments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { clinicId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);
  const { status, startDate, endDate } = req.query;

  const query: any = { clinicId };
  
  if (status) {
    query.status = status;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate as string);
    }
  }

  const [payments, total] = await Promise.all([
    (Payment as any).find(query)
      .populate('patientId', 'firstName lastName')
      .populate('billingId', 'invoiceNumber totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    (Payment as any).countDocuments(query)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(payments, total, page, limit)
  });
});

// Get payment by ID
export const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payment = await (Payment as any).findById(id)
    .populate('patientId', 'firstName lastName email')
    .populate('billingId', 'invoiceNumber totalAmount')
    .populate('clinicId', 'name')
    .populate('createdBy', 'firstName lastName')
    .populate('refunds.refundedBy', 'firstName lastName');

  if (!payment) {
    throw createNotFoundError('Payment');
  }

  res.json({
    success: true,
    data: { payment }
  });
});

// Refund payment
export const refundPayment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const payment = await (Payment as any).findById(id).populate('billingId');
  if (!payment) {
    throw createNotFoundError('Payment');
  }

  if (payment.status !== 'completed') {
    throw createValidationError('payment', 'Only completed payments can be refunded');
  }

  const currentRefunded = payment.refunds?.reduce((total, refund) => total + refund.amount, 0) || 0;
  const refundableAmount = Math.max(0, payment.amount - currentRefunded);
  
  if (amount > refundableAmount) {
    throw createValidationError('amount', 'Refund amount exceeds refundable amount');
  }

  try {
    let refundId: string = '';

    if (payment.paymentProvider === 'stripe') {
      const stripeService = new StripeService();
      const refund = await stripeService.createRefund({
        paymentIntentId: payment.paymentIntentId!,
        amount,
        reason
      });
      refundId = refund.id;
    } else if (payment.paymentProvider === 'paypal') {
      const paypalService = new PayPalService();
      const refund = await paypalService.refundCapture({
        captureId: payment.transactionId!,
        amount,
        reason
      });
      refundId = refund.id;
    } else {
      // Manual refund
      refundId = `manual_${Date.now()}`;
    }

    // Add refund to payment
    await (payment as any).addRefund({
      amount,
      reason,
      refundId,
      refundedBy: req.user._id
    });

    // Update billing if fully refunded
    const billing = await (Billing as any).findById(payment.billingId);
    if (billing && (payment as any).refunds?.length > 0) {
      (billing as any).paymentStatus = 'refunded';
      await billing.save();
    }

    // Send notification to patient
    await createAndSendNotification({
      userId: payment.patientId.toString(),
      title: 'Payment Refunded',
      message: `A refund of $${amount} has been processed for your payment`,
      type: 'payment_success',
      metadata: {
        paymentId: payment._id,
        refundAmount: amount,
        reason
      }
    });

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: { payment }
    });

  } catch (error: any) {
    throw new AppError(`Refund processing failed: ${error.message}`, 400);
  }
});

// Get payment statistics
export const getPaymentStatistics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { clinicId } = req.query;

  const stats = await (Payment as any).getPaymentStats(clinicId as string);

  // Calculate additional metrics
  const totalStats = {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    pendingPayments: 0,
    pendingAmount: 0,
    failedPayments: 0,
    refundedAmount: 0
  };

  stats.forEach((stat: any) => {
    totalStats.totalPayments += stat.count;
    totalStats.totalAmount += stat.totalAmount;

    switch (stat._id) {
      case 'completed':
        totalStats.completedPayments = stat.count;
        totalStats.completedAmount = stat.totalAmount;
        break;
      case 'pending':
      case 'processing':
        totalStats.pendingPayments += stat.count;
        totalStats.pendingAmount += stat.totalAmount;
        break;
      case 'failed':
        totalStats.failedPayments += stat.count;
        break;
      case 'refunded':
      case 'partially_refunded':
        totalStats.refundedAmount += stat.totalAmount;
        break;
    }
  });

  res.json({
    success: true,
    data: {
      summary: totalStats,
      breakdown: stats
    }
  });
});
