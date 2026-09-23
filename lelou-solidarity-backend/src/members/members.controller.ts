import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
import { ListMembersQueryDto } from './dto/list-members-query.dto';

@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  // --- Formulaire public (protege par code d'acces, pas par JWT) ---
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
      throw new BadRequestException("La photo d'identite est obligatoire.");
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
}
