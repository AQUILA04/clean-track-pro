export const TEMPLATE_ORDER_READY_PICKUP = 'ORDER_READY_PICKUP';

export interface NotifyPayload {
    orderId?: string;
    templateKey: string;
    email?: string | null;
    phone?: string | null;
    subject: string;
    body: string;
    smsBody?: string;
}
