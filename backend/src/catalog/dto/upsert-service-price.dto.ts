import { IsUUID, IsNumber, Min } from 'class-validator';

export class UpsertServicePriceDto {
    @IsUUID()
    article_type_id: string;

    @IsUUID()
    service_definition_id: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;
}
