import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripePaymentService {
    private readonly logger = new Logger(StripePaymentService.name);
    private readonly stripe: Stripe | null;

    constructor(private readonly configService: ConfigService) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.stripe = secretKey ? new Stripe(secretKey) : null;
    }

    isConfigured(): boolean {
        return this.stripe !== null;
    }

    async createCheckoutSession(params: {
        signupRequestId: string;
        planName: string;
        priceInCents: number;
        /** ISO 4217 lowercase for Stripe: eur | usd */
        currency: 'eur' | 'usd';
        customerEmail: string;
        billingCycle: 'MONTHLY' | 'YEARLY';
    }): Promise<{ sessionId: string; url: string }> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

        const session = await this.stripe.checkout.sessions.create({
            mode: 'payment',
            customer_email: params.customerEmail,
            line_items: [
                {
                    price_data: {
                        currency: params.currency,
                        product_data: { name: `CleanTrack Pro — ${params.planName} (${params.billingCycle === 'YEARLY' ? 'annuel' : 'mensuel'})` },
                        unit_amount: params.priceInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                signup_request_id: params.signupRequestId,
                billing_cycle: params.billingCycle,
                billing_currency: params.currency,
            },
            success_url: `${frontendUrl}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/signup?cancelled=1`,
        });

        return { sessionId: session.id, url: session.url! };
    }

    async verifyCheckoutSession(sessionId: string): Promise<{ paid: boolean; signupRequestId?: string; billingCycle?: 'MONTHLY' | 'YEARLY' }> {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        const session = await this.stripe.checkout.sessions.retrieve(sessionId);
        const paid = session.payment_status === 'paid';
        const signupRequestId = session.metadata?.signup_request_id;
        const billingCycle = session.metadata?.billing_cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';

        return { paid, signupRequestId, billingCycle };
    }
}
