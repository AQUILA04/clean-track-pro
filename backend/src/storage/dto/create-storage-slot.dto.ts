import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StorageSlotStatus, SlotType } from '../entities/storage-slot.entity';

export class CreateStorageSlotDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(StorageSlotStatus)
    @IsOptional()
    status?: StorageSlotStatus;

    @IsEnum(SlotType)
    @IsOptional()
    slot_type?: SlotType;

    @IsUUID()
    @IsNotEmpty()
    site_id: string;
}
