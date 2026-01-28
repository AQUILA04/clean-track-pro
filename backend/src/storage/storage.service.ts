import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageSlot } from './entities/storage-slot.entity';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { RlsService } from '../shared/database/rls/rls.service';

@Injectable()
export class StorageService {
    constructor(
        @InjectRepository(StorageSlot)
        private readonly storageSlotRepository: Repository<StorageSlot>,
        private readonly rls: RlsService,
    ) { }

    async create(createStorageSlotDto: CreateStorageSlotDto): Promise<StorageSlot> {
        return this.rls.wrapTransaction(async (manager) => {
            const slot = manager.create(StorageSlot, createStorageSlotDto);
            const tenantId = this.rls.getTenantId();
            if (tenantId) {
                slot.tenant_id = tenantId;
            }

            try {
                return await manager.save(StorageSlot, slot);
            } catch (error: any) {
                if (error.code === '23505') { // Unique violation
                    throw new ConflictException('Slot with this name already exists in this site.');
                }
                throw error;
            }
        });
    }

    async findAll(siteId: string): Promise<StorageSlot[]> {
        return this.rls.wrapTransaction(async (manager) => {
            return manager.find(StorageSlot, {
                where: { site_id: siteId }
            });
        });
    }
}
