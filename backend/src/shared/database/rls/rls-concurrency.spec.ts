
import { Test } from '@nestjs/testing';
import { RlsService } from './rls.service';
import { ClsModule, ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';

describe('RLS Concurrency', () => {
    let rlsService: RlsService;
    let clsService: ClsService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [ClsModule.forRoot({ global: true, middleware: { mount: true } })],
            providers: [
                RlsService,
                {
                    provide: DataSource,
                    useValue: {
                        transaction: jest.fn(async (cb) => cb({ query: jest.fn() })),
                    },
                },
            ],
        }).compile();

        rlsService = module.get(RlsService);
        clsService = module.get(ClsService);
    });

    it('should maintain separate contexts for concurrent operations', async () => {
        const runInContext = (tenantId: string, delay: number) => {
            return new Promise<string | undefined>((resolve) => {
                clsService.run(async () => {
                    clsService.set('tenantId', tenantId);
                    // Simulate work (wait)
                    await new Promise(r => setTimeout(r, delay));
                    resolve(rlsService.getTenantId());
                });
            });
        };

        const [res1, res2] = await Promise.all([
            runInContext('tenant-A', 100),
            runInContext('tenant-B', 10),
        ]);

        expect(res1).toBe('tenant-A');
        expect(res2).toBe('tenant-B');
    });
});
