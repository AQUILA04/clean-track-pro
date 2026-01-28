import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StorageSlotStatus } from '../entities/storage-slot.entity';

export class CreateStorageSlotDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(StorageSlotStatus)
    @IsOptional()
    status?: StorageSlotStatus;

    @IsUUID()
    @IsNotEmpty()
    site_id: string;
}
