import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { MailModule } from '../mail/mail.module';
import { MembersModule } from '../members/members.module';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [UploadsModule, MailModule, MembersModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
