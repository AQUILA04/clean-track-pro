import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignOrderDto {
    @ApiProperty({ description: 'The ID of the order to assign', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    order_id: string;

    @ApiProperty({ description: 'The ID of the shelf slot', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsNotEmpty()
    @IsUUID()
    shelf_slot_id: string;
}
