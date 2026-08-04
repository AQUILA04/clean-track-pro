import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExpensesService } from './expenses.service';
import { ExpenseType } from './entities/expense-type.entity';
import { Expense } from './entities/expense.entity';

describe('ExpensesService', () => {
    let service: ExpensesService;

    const mockTypeRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn((dto) => dto),
        save: jest.fn((e) => Promise.resolve({ id: 'type-1', ...e })),
    };

    const mockExpenseRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn((dto) => dto),
        save: jest.fn((e) => Promise.resolve({ id: 'exp-1', ...e })),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockManager = {
        query: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn((_entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve({ id: 'type-1', ...data })),
    };

    const mockDataSource = {
        transaction: jest.fn((cb) => cb(mockManager)),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockDataSource.transaction.mockImplementation((cb) => cb(mockManager));
        mockManager.create.mockImplementation((_entity, data) => data);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExpensesService,
                { provide: getRepositoryToken(ExpenseType), useValue: mockTypeRepo },
                { provide: getRepositoryToken(Expense), useValue: mockExpenseRepo },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get(ExpensesService);
    });

    describe('ensureDefaultTypes', () => {
        it('creates the four default types when none exist', async () => {
            mockManager.findOne.mockResolvedValue(null);

            await service.ensureDefaultTypes('11111111-1111-1111-1111-111111111111');

            expect(mockManager.query).toHaveBeenCalledWith(
                expect.stringContaining('SET LOCAL'),
            );
            expect(mockManager.save).toHaveBeenCalledTimes(4);
            expect(mockManager.create).toHaveBeenCalledWith(
                ExpenseType,
                expect.objectContaining({ name: 'Loyer', is_system: true }),
            );
        });

        it('is idempotent when types already exist', async () => {
            mockManager.findOne.mockResolvedValue({
                id: 't1',
                name: 'Loyer',
                is_system: true,
            });

            await service.ensureDefaultTypes('11111111-1111-1111-1111-111111111111');

            expect(mockManager.save).not.toHaveBeenCalled();
        });

        it('rejects invalid tenant id', async () => {
            await expect(service.ensureDefaultTypes('bad')).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });
    });

    describe('createType', () => {
        it('creates a type when name is unique', async () => {
            mockTypeRepo.findOne.mockResolvedValue(null);
            const result = await service.createType({ name: 'Marketing' }, 'tenant-1');
            expect(result.name).toBe('Marketing');
            expect(mockTypeRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ is_system: false }),
            );
        });

        it('rejects duplicate names', async () => {
            mockTypeRepo.findOne.mockResolvedValue({ id: 'x', name: 'Loyer' });
            await expect(service.createType({ name: 'Loyer' }, 'tenant-1')).rejects.toBeInstanceOf(
                ConflictException,
            );
        });
    });

    describe('updateType', () => {
        it('blocks renaming system types', async () => {
            mockTypeRepo.findOne.mockResolvedValue({
                id: 't1',
                name: 'Loyer',
                is_system: true,
            });
            await expect(
                service.updateType('t1', { name: 'Rent' }, 'tenant-1'),
            ).rejects.toBeInstanceOf(BadRequestException);
        });
    });

    describe('listExpenses', () => {
        it('returns paginated data with meta', async () => {
            const qb = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                clone: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(45),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([{ id: 'e1' }]),
            };
            mockExpenseRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.listExpenses('tenant-1', { page: 2, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.meta).toEqual({
                total: 45,
                page: 2,
                limit: 20,
                totalPages: 3,
            });
            expect(qb.skip).toHaveBeenCalledWith(20);
            expect(qb.take).toHaveBeenCalledWith(20);
        });
    });

    describe('createExpense', () => {
        it('requires site id', async () => {
            await expect(
                service.createExpense(
                    {
                        expense_type_id: 't1',
                        description: 'Test',
                        amount: 10,
                        expense_date: '2026-07-31',
                    },
                    'tenant-1',
                    'user-1',
                ),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('rejects inactive type', async () => {
            mockTypeRepo.findOne.mockResolvedValue(null);
            await expect(
                service.createExpense(
                    {
                        expense_type_id: 't1',
                        description: 'Test',
                        amount: 10,
                        expense_date: '2026-07-31',
                    },
                    'tenant-1',
                    'user-1',
                    'site-1',
                ),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('creates expense with active type', async () => {
            mockTypeRepo.findOne.mockResolvedValue({
                id: 't1',
                name: 'Fournitures',
                is_active: true,
            });
            const result = await service.createExpense(
                {
                    expense_type_id: 't1',
                    description: 'Detergent',
                    amount: 42.5,
                    expense_date: '2026-07-31',
                },
                'tenant-1',
                'user-1',
                'site-1',
            );
            expect(result.id).toBe('exp-1');
            expect(mockExpenseRepo.save).toHaveBeenCalled();
        });
    });

    describe('deleteExpense', () => {
        it('throws when missing', async () => {
            mockExpenseRepo.findOne.mockResolvedValue(null);
            await expect(service.deleteExpense('x', 'tenant-1')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });
});
