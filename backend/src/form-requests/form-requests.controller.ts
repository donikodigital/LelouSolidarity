//backend/src/form-requests/form-requests.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FormRequestsService } from './form-requests.service';
import { CreateFormRequestDto } from './dto/create-form-request.dto';

@Controller()
export class FormRequestsController {
  constructor(private readonly service: FormRequestsService) {}

  // --- Public : demande de formulaire depuis la page d'accueil ---
  // 5 demandes par heure et par adresse IP : empêche d'inonder la boîte des administrateurs.
  @Post('public/form-requests')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  create(@Body() dto: CreateFormRequestDto) {
    return this.service.create(dto);
  }

  // --- Espace administrateur ---
  @UseGuards(JwtAuthGuard)
  @Get('admin/form-requests')
  list() {
    return this.service.list();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/form-requests/:id/send-form')
  sendForm(@Param('id') id: string) {
    return this.service.sendForm(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/form-requests/:id/handled')
  markHandled(@Param('id') id: string) {
    return this.service.markHandled(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/form-requests/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}