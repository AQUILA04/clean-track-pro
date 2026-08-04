import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from '../dto/create-subscription-plan.dto';
import { validatePlanLimits } from '../utils/plan-limits.util';

@Injectable()
export class SubscriptionPlanService {
    constructor(
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
    ) {}

    findAll(): Promise<SubscriptionPlan[]> {
        return this.planRepository.find({ order: { price: 'ASC' } });
    }

    findByName(name: string): Promise<SubscriptionPlan | null> {
        return this.planRepository.findOne({ where: { name } });
    }

    findById(id: string): Promise<SubscriptionPlan | null> {
        return this.planRepository.findOne({ where: { id } });
    }

    async update(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
        const plan = await this.planRepository.findOne({ where: { id } });
        if (!plan) {
            throw new NotFoundException(`Plan ${id} not found`);
        }

        // ValidationPipe(transform) yields a DTO instance with undefined for omitted
        // optional fields — strip them so Object.assign does not wipe existing values
        // (which would then be omitted from the JSON response and break the admin UI).
        const patch = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
        ) as Partial<SubscriptionPlan>;

        if (patch.limits) {
            patch.limits = validatePlanLimits(patch.limits as Record<string, unknown>);
        }

        Object.assign(plan, patch);
        return this.planRepository.save(plan);
    }

    create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
        const limits = validatePlanLimits(dto.limits);
        const plan = this.planRepository.create({
            ...dto,
            limits,
            currency: dto.currency ?? 'EUR',
            is_public: dto.is_public ?? true,
            is_active: dto.is_active ?? true,
            is_free: dto.is_free ?? false,
            auto_approve_signups: dto.auto_approve_signups ?? false,
            stripe_price_id: dto.stripe_price_id ?? null,
            features: dto.features ?? {},
        });
        return this.planRepository.save(plan);
    }
}
