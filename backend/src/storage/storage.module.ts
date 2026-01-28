import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { StorageSlot } from './entities/storage-slot.entity';
import { RlsModule } from '../shared/database/rls/rls.module';

@Module({
    imports: [TypeOrmModule.forFeature([StorageSlot]), RlsModule],
    controllers: [StorageController],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule { }
