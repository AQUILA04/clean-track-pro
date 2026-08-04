import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ExpenseType } from './entities/expense-type.entity';
import { Expense } from './entities/expense.entity';
import { CreateExpenseTypeDto, UpdateExpenseTypeDto } from './dto/expense-type.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { DEFAULT_EXPENSE_TYPES } from './constants/default-expense-types';

export type ExpenseListMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type ExpenseListResult = {
    data: Expense[];
    meta: ExpenseListMeta;
};

export type ExpenseCategoryStat = {
    typeId: string;
    name: string;
    total: number;
    count: number;
};

export type ExpenseStatsResult = {
    total: number;
    count: number;
    byCategory: ExpenseCategoryStat[];
};

@Injectable()
export class ExpensesService {
    private readonly logger = new Logger(ExpensesService.name);

    constructor(
        @InjectRepository(ExpenseType)
        private readonly typeRepo: Repository<ExpenseType>,
        @InjectRepository(Expense)
        private readonly expenseRepo: Repository<Expense>,
        private readonly dataSource: DataSource,
    ) {}

    // --- Types ---

    /**
     * Idempotent seed of the 4 default categories for a tenant.
     * Uses SET LOCAL for RLS (same pattern as site bootstrap).
     */
    async ensureDefaultTypes(tenantId: string): Promise<void> {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new BadRequestException('Invalid tenant ID');
        }

        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SET LOCAL "app.current_tenant" = '${tenantId}'`);

            for (const def of DEFAULT_EXPENSE_TYPES) {
                const existing = await manager.findOne(ExpenseType, {
                    where: { tenant_id: tenantId, name: def.name },
                });
                if (existing) {
                    if (!existing.is_system) {
                        existing.is_system = true;
                        if (!existing.description) {
                            existing.description = def.description;
                        }
                        await manager.save(ExpenseType, existing);
                    }
                    continue;
                }

                const type = manager.create(ExpenseType, {
                    tenant_id: tenantId,
                    name: def.name,
                    description: def.description,
                    is_active: true,
                    is_system: true,
                });
                await manager.save(ExpenseType, type);
            }
        });

        this.logger.log(`Default expense types ensured for tenant ${tenantId}`);
    }

    async listTypes(tenantId: string, activeOnly = false): Promise<ExpenseType[]> {
        const where: { tenant_id: string; is_active?: boolean } = { tenant_id: tenantId };
        if (activeOnly) where.is_active = true;
        return this.typeRepo.find({
            where,
            order: { is_system: 'DESC', name: 'ASC' },
        });
    }

    async createType(dto: CreateExpenseTypeDto, tenantId: string): Promise<ExpenseType> {
        const name = dto.name.trim();
        const existing = await this.typeRepo.findOne({ where: { tenant_id: tenantId, name } });
        if (existing) {
            throw new ConflictException('Un type de dépense avec ce nom existe déjà.');
        }
        const type = this.typeRepo.create({
            tenant_id: tenantId,
            name,
            description: dto.description?.trim() || null,
            is_active: true,
            is_system: false,
        });
        return this.typeRepo.save(type);
    }

    async updateType(id: string, dto: UpdateExpenseTypeDto, tenantId: string): Promise<ExpenseType> {
        const type = await this.typeRepo.findOne({ where: { id, tenant_id: tenantId } });
        if (!type) throw new NotFoundException('Type de dépense introuvable.');

        if (dto.name !== undefined) {
            if (type.is_system) {
                throw new BadRequestException(
                    'Les catégories système (Loyer, Fournitures, Salaires, Autres) ne peuvent pas être renommées.',
                );
            }
            const name = dto.name.trim();
            const clash = await this.typeRepo.findOne({ where: { tenant_id: tenantId, name } });
            if (clash && clash.id !== id) {
                throw new ConflictException('Un type de dépense avec ce nom existe déjà.');
            }
            type.name = name;
        }
        if (dto.description !== undefined) {
            type.description = dto.description?.trim() || null;
        }
        if (dto.is_active !== undefined) {
            type.is_active = dto.is_active;
        }
        return this.typeRepo.save(type);
    }

    async deactivateType(id: string, tenantId: string): Promise<ExpenseType> {
        return this.updateType(id, { is_active: false }, tenantId);
    }

    // --- Expenses ---

    async createExpense(
        dto: CreateExpenseDto,
        tenantId: string,
        userId: string,
        sessionSiteId?: string,
    ): Promise<Expense> {
        const siteId = dto.site_id || sessionSiteId;
        if (!siteId) {
            throw new BadRequestException('Site ID required to create expense');
        }

        const type = await this.typeRepo.findOne({
            where: { id: dto.expense_type_id, tenant_id: tenantId, is_active: true },
        });
        if (!type) {
            throw new BadRequestException('Type de dépense invalide ou inactif.');
        }

        const expense = this.expenseRepo.create({
            tenant_id: tenantId,
            site_id: siteId,
            expense_type_id: type.id,
            description: dto.description.trim(),
            amount: dto.amount,
            expense_date: dto.expense_date,
            receipt_url: dto.receipt_url || null,
            created_by: userId,
        });

        return this.expenseRepo.save(expense);
    }

    async listExpenses(
        tenantId: string,
        options: {
            siteId?: string;
            startDate?: string;
            endDate?: string;
            typeId?: string;
            page?: number;
            limit?: number;
        } = {},
    ): Promise<ExpenseListResult> {
        const page = Math.max(1, options.page ?? 1);
        const limit = Math.min(Math.max(1, options.limit ?? 20), 100);
        const skip = (page - 1) * limit;

        const qb = this.expenseRepo
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.expense_type', 'expense_type')
            .where('expense.tenant_id = :tenantId', { tenantId });

        if (options.siteId) {
            qb.andWhere('expense.site_id = :siteId', { siteId: options.siteId });
        }
        if (options.typeId) {
            qb.andWhere('expense.expense_type_id = :typeId', { typeId: options.typeId });
        }
        if (options.startDate && options.endDate) {
            qb.andWhere('expense.expense_date BETWEEN :start AND :end', {
                start: options.startDate,
                end: options.endDate,
            });
        }

        const total = await qb.clone().getCount();
        const data = await qb
            .orderBy('expense.expense_date', 'DESC')
            .addOrderBy('expense.created_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async getStats(
        tenantId: string,
        options: { siteId?: string; startDate?: string; endDate?: string } = {},
    ): Promise<ExpenseStatsResult> {
        const qb = this.expenseRepo
            .createQueryBuilder('expense')
            .leftJoin('expense.expense_type', 'expense_type')
            .select('COALESCE(SUM(expense.amount), 0)', 'total')
            .addSelect('COUNT(expense.id)', 'count')
            .addSelect('expense.expense_type_id', 'typeId')
            .addSelect('expense_type.name', 'name')
            .where('expense.tenant_id = :tenantId', { tenantId })
            .groupBy('expense.expense_type_id')
            .addGroupBy('expense_type.name');

        if (options.siteId) {
            qb.andWhere('expense.site_id = :siteId', { siteId: options.siteId });
        }
        if (options.startDate && options.endDate) {
            qb.andWhere('expense.expense_date BETWEEN :start AND :end', {
                start: options.startDate,
                end: options.endDate,
            });
        }

        const rows = await qb.getRawMany();

        const byCategory: ExpenseCategoryStat[] = rows
            .map((row) => ({
                typeId: String(row.typeId ?? ''),
                name: String(row.name ?? '—'),
                total: row.total ? parseFloat(row.total) : 0,
                count: row.count ? parseInt(row.count, 10) : 0,
            }))
            .filter((c) => c.typeId)
            .sort((a, b) => b.total - a.total);

        const total = byCategory.reduce((sum, c) => sum + c.total, 0);
        const count = byCategory.reduce((sum, c) => sum + c.count, 0);

        return { total, count, byCategory };
    }

    /**
     * Daily expense totals for an arbitrary date range (filled gaps = 0).
     */
    async getTimeseries(
        tenantId: string,
        options: { siteId?: string; startDate: string; endDate: string },
    ): Promise<Array<{ date: string; label: string; total: number; count: number }>> {
        const qb = this.expenseRepo
            .createQueryBuilder('expense')
            .select(`TO_CHAR(expense.expense_date, 'YYYY-MM-DD')`, 'date')
            .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
            .addSelect('COUNT(expense.id)', 'count')
            .where('expense.tenant_id = :tenantId', { tenantId })
            .andWhere('expense.expense_date BETWEEN :start AND :end', {
                start: options.startDate,
                end: options.endDate,
            })
            .groupBy(`TO_CHAR(expense.expense_date, 'YYYY-MM-DD')`)
            .orderBy('date', 'ASC');

        if (options.siteId) {
            qb.andWhere('expense.site_id = :siteId', { siteId: options.siteId });
        }

        const raw = await qb.getRawMany();
        const byDate = new Map(
            raw.map((r) => [
                String(r.date),
                {
                    total: parseFloat(r.total) || 0,
                    count: parseInt(r.count, 10) || 0,
                },
            ]),
        );

        const days: Array<{ date: string; label: string; total: number; count: number }> = [];
        const cursor = new Date(options.startDate + 'T12:00:00Z');
        const end = new Date(options.endDate + 'T12:00:00Z');
        while (cursor <= end) {
            const dateStr = cursor.toISOString().split('T')[0];
            const existing = byDate.get(dateStr);
            days.push({
                date: dateStr,
                label: dateStr.slice(5),
                total: existing?.total ?? 0,
                count: existing?.count ?? 0,
            });
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        return days;
    }

    /** @deprecated Prefer getStats — kept for callers that only need total/count */
    async getTotal(
        tenantId: string,
        options: { siteId?: string; startDate?: string; endDate?: string } = {},
    ): Promise<{ total: number; count: number }> {
        const stats = await this.getStats(tenantId, options);
        return { total: stats.total, count: stats.count };
    }

    async deleteExpense(id: string, tenantId: string, siteId?: string): Promise<void> {
        const where: { id: string; tenant_id: string; site_id?: string } = {
            id,
            tenant_id: tenantId,
        };
        if (siteId) where.site_id = siteId;

        const expense = await this.expenseRepo.findOne({ where });
        if (!expense) throw new NotFoundException('Dépense introuvable.');
        await this.expenseRepo.remove(expense);
    }
}
