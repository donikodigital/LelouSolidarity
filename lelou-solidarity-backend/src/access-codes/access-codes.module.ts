import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { AccessCodesController } from './access-codes.controller';
import { AccessCodesService } from './access-codes.service';

@Module({
  imports: [MailModule],
  controllers: [AccessCodesController],
  providers: [AccessCodesService],
  exports: [AccessCodesService],
})
export class AccessCodesModule {}
