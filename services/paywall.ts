/**
 * Custom error for paywall gating
 */
export class PaywallError extends Error {
  constructor(message: string = 'This feature requires SpotCheck Pro') {
    super(message);
    this.name = 'PaywallError';
  }
}
