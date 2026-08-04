import { IsBoolean, IsIn, IsNumber, IsObject, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { POPULAR_CURRENCY_CODES } from '../constants/currencies';

class ExpressVisibilityDto {
  @IsBoolean()
  showTTC: boolean;

  @IsBoolean()
  allowDiscounts: boolean;

  @IsBoolean()
  showInventory: boolean;
}

export class UpdateTenantConfigDto {
  @IsNumber()
  @Min(1.0)
  express_multiplier: number;

  @IsNumber()
  @Min(1)
  express_sla_hours: number;

  @IsBoolean()
  express_enabled: boolean;

  @IsString()
  @IsIn([...POPULAR_CURRENCY_CODES], {
    message: `currency must be one of: ${POPULAR_CURRENCY_CODES.join(', ')}`,
  })
  currency: string;

  @IsString()
  weight_unit: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ExpressVisibilityDto)
  express_visibility: ExpressVisibilityDto;
}
