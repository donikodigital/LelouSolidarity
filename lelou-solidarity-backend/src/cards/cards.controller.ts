import { Controller, Get, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CardsService } from './cards.service';
import { MembersService } from '../members/members.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/members/:id/card')
export class CardsController {
  constructor(
    private readonly cards: CardsService,
    private readonly members: MembersService,
  ) {}

  // Generation (ou regeneration) manuelle de la carte, a l'initiative de
  // l'administrateur uniquement.
  @Post('generate')
  generate(@Param('id') id: string) {
    return this.cards.generateCard(id);
  }

  // Redirige vers le PDF stocke sur Cloudinary pour telechargement/impression.
  @Get('download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const member = await this.members.findOne(id);
    if (!member.cardPdfUrl) {
      throw new NotFoundException("Aucune carte generee pour ce membre pour l'instant.");
    }
    return res.redirect(302, member.cardPdfUrl);
  }
}
