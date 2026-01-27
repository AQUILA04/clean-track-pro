import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDefinitionDto } from './create-service-definition.dto';

export class UpdateServiceDefinitionDto extends PartialType(CreateServiceDefinitionDto) { }
