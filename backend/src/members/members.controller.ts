//backend/src/members/members.controller.ts
// v1.1 — ajout de GET public/access-codes/:code/status : le formulaire public
// vérifie qu'un lien est valide avant de s'afficher (et refuse un lien déjà utilisé).
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MembersService } from './members.service';
import { SubmitMemberDto } from './dto/submit-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  // --- Formulaire public (protégé par code d'accès, pas par JWT) ---

  // Vérifie l'état d'un lien avant d'afficher le formulaire. Limité en débit
  // pour empêcher de tester des codes en masse.
  @Get('public/access-codes/:code/status')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  accessCodeStatus(@Param('code') code: string) {
    return this.members.checkAccessCode(code);
  }

  @Post('public/members/submit')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  submit(
    @Body() dto: SubmitMemberDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!photo) {
      throw new BadRequestException('La photo d’identité est obligatoire.');
    }
    return this.members.submit(dto, photo);
  }

  // --- Espace administrateur ---
  @UseGuards(JwtAuthGuard)
  @Get('admin/members')
  findAll(@Query() query: ListMembersQueryDto) {
    return this.members.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/members/:id')
  findOne(@Param('id') id: string) {
    return this.members.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/members/:id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/members/:id')
  remove(@Param('id') id: string) {
    return this.members.remove(id);
  }
}