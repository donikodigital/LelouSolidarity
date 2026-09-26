//backend/src/access-codes/access-codes.controller.ts
// v1.1 — ajout de la modification (PATCH) et de la suppression (DELETE)
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccessCodesService } from './access-codes.service';
import { GenerateAccessCodeDto } from './dto/generate-code.dto';
import { UpdateAccessCodeDto } from './dto/update-code.dto';

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccessCodeDto) {
    return this.service.update(id, dto.email);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}