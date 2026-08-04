import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from '../orders/entities/order.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { SessionStatus } from '../cash-register/enums/session-status.enum';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        private readonly dataSource: DataSource,
    ) {}

    async create(
        dto: CreatePaymentDto,
        tenantId: string,
        userId: string,
        siteId: string,
    ): Promise<Payment> {
        if (dto.amount <= 0) {
            throw new BadRequestException('Payment amount must be greater than 0');
        }

        return this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: dto.order_id, tenant_id: tenantId },
            });
            if (!order) {
                throw new BadRequestException('Order not found');
            }

            const balanceDue = Number(order.total_price) - Number(order.amount_paid);
            if (dto.amount > balanceDue + 0.01) {
                throw new BadRequestException(
                    `Payment amount (${dto.amount}) exceeds balance due (${balanceDue})`,
                );
            }

            // Find open cash register session for this operator
            const session = await manager.findOne(CashRegisterSession, {
                where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.OPEN },
            });
            if (!session) {
                throw new BadRequestException(
                    'Vous devez ouvrir votre caisse avant d\'encaisser un paiement.',
                );
            }

            const payment = manager.create(Payment, {
                tenant_id: tenantId,
                order_id: dto.order_id,
                amount: dto.amount,
                payment_method: dto.payment_method,
                payment_phase: dto.payment_phase,
                collected_by: userId,
                site_id: siteId,
                session_id: session.id,
                reference: dto.reference,
                notes: dto.notes,
            });
            const savedPayment = await manager.save(Payment, payment);

            // Update order amount_paid and payment_status
            const newAmountPaid = Number(order.amount_paid) + dto.amount;
            order.amount_paid = Number(newAmountPaid.toFixed(2));

            if (newAmountPaid >= Number(order.total_price) - 0.01) {
                order.payment_status = PaymentStatus.PAID;
            } else if (newAmountPaid > 0) {
                order.payment_status = PaymentStatus.PARTIAL;
            }
            await manager.save(Order, order);

            // Update session expected_cash if payment is CASH
            if (dto.payment_method === PaymentMethod.CASH) {
                session.expected_cash = Number(
                    (Number(session.expected_cash) + dto.amount).toFixed(2),
                );
                await manager.save(CashRegisterSession, session);
            }

            this.logger.log(
                `Payment ${savedPayment.id} created: ${dto.amount} for order ${dto.order_id}`,
            );
            return savedPayment;
        });
    }

    async findByOrder(orderId: string, tenantId: string): Promise<Payment[]> {
        return this.paymentRepo.find({
            where: { order_id: orderId, tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });
    }

    async findBySession(sessionId: string, tenantId: string): Promise<Payment[]> {
        return this.paymentRepo.find({
            where: { session_id: sessionId, tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });
    }
}
