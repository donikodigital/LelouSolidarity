import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccessCodesService } from './access-codes.service';
import { GenerateAccessCodeDto } from './dto/generate-code.dto';

// Reserve a l'administrateur : c'est lui qui declenche l'envoi
// du code d'acces par e-mail a un futur membre.
@UseGuards(JwtAuthGuard)
@Controller('admin/access-codes')
export class AccessCodesController {
  constructor(private readonly service: AccessCodesService) {}

  @Post()
  generate(@Body() dto: GenerateAccessCodeDto) {
    return this.service.generateAndSend(dto.email);
  }

  @Get()
  list() {
    return this.service.list();
  }
}
