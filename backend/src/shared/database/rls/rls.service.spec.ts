
import { Test, TestingModule } from '@nestjs/testing';
import { RlsService } from './rls.service';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';

describe('RlsService', () => {
    let service: RlsService;
    let clsService: ClsService;
    let dataSource: DataSource;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RlsService,
                {
                    provide: ClsService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        transaction: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RlsService>(RlsService);
        clsService = module.get<ClsService>(ClsService);
        dataSource = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getTenantId should retrieve from CLS', () => {
        (clsService.get as jest.Mock).mockReturnValue('tenant-123');
        expect(service.getTenantId()).toBe('tenant-123');
        expect(clsService.get).toHaveBeenCalledWith('tenantId');
    });

    it('wrapTransaction should set local variable and run callback', async () => {
        const mockManager = {
            query: jest.fn(),
        };
        const mockResult = 'success';
        const mockCallback = jest.fn().mockResolvedValue(mockResult);

        (dataSource.transaction as jest.Mock).mockImplementation(async (cb) => {
            return await cb(mockManager);
        });

        (clsService.get as jest.Mock).mockImplementation((key) => {
            if (key === 'tenantId') return '123e4567-e89b-12d3-a456-426614174000'; // valid uuid
            if (key === 'userRole') return 'superadmin';
        });

        const result = await service.wrapTransaction(mockCallback);

        expect(result).toBe(mockResult);
        expect(dataSource.transaction).toHaveBeenCalled();
        expect(mockManager.query).toHaveBeenCalledWith("SET LOCAL \"app.current_tenant\" = '123e4567-e89b-12d3-a456-426614174000'");
        expect(mockManager.query).toHaveBeenCalledWith("SET LOCAL \"app.current_role\" = 'superadmin'");
        expect(mockCallback).toHaveBeenCalledWith(mockManager);
    });

    it('wrapTransaction should NOT set invalid tenantId (sql injection prevention)', async () => {
        const mockManager = { query: jest.fn() };
        (dataSource.transaction as jest.Mock).mockImplementation(async (cb) => cb(mockManager));
        (clsService.get as jest.Mock).mockReturnValue("' OR 1=1; --"); // Malicious payload

        await service.wrapTransaction(async () => { });

        expect(mockManager.query).not.toHaveBeenCalledWith(expect.stringContaining('SET LOCAL "app.current_tenant"'));
    });
});
