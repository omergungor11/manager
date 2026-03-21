import { PartialType } from '@nestjs/swagger';
import { CreateServiceDefinitionDto } from './create-service-definition.dto';

export class UpdateServiceDefinitionDto extends PartialType(CreateServiceDefinitionDto) {}
