import Razorpay from 'razorpay'
import crypto from 'crypto'

/**
 * Get Razorpay instance with credentials
 */
export function getRazorpayInstance(keyId: string, keySecret: string) {
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

/**
 * Verify Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Signature from Razorpay
 * @param secret - Razorpay key secret
 * @returns true if signature is valid
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`
    const generated = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex')
    return generated === signature
  } catch (error) {
    console.error('Error verifying payment signature:', error)
    return false
  }
}

/**
 * Verify Razorpay webhook signature
 * @param body - Raw request body
 * @param signature - Signature from webhook header
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const generated = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return generated === signature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Calculate payment amount based on settings
 * @param baseAmount - Base booking amount
 * @param advancePercent - Percentage to charge in advance (0-100)
 * @returns Amount to charge
 */
export function calculatePaymentAmount(
  baseAmount: number,
  advancePercent: number
): number {
  if (advancePercent <= 0) return 0
  if (advancePercent >= 100) return baseAmount
  return Math.round((baseAmount * advancePercent) / 100)
}

/**
 * Calculate refund amount based on settings
 * @param paidAmount - Amount that was paid
 * @param refundPercent - Percentage to refund (0-100)
 * @returns Amount to refund
 */
export function calculateRefundAmount(
  paidAmount: number,
  refundPercent: number
): number {
  if (refundPercent <= 0) return 0
  if (refundPercent >= 100) return paidAmount
  return Math.round((paidAmount * refundPercent) / 100)
}

/**
 * Convert amount to paise (Razorpay uses paise)
 * @param amount - Amount in rupees
 * @returns Amount in paise
 */
export function toPaise(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convert paise to rupees
 * @param paise - Amount in paise
 * @returns Amount in rupees
 */
export function toRupees(paise: number): number {
  return paise / 100
}
