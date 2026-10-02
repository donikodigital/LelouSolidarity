//backend/src/form-requests/form-requests.module.ts
import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { AccessCodesModule } from '../access-codes/access-codes.module';
import { FormRequestsController } from './form-requests.controller';
import { FormRequestsService } from './form-requests.service';

@Module({
  imports: [MailModule, AccessCodesModule],
  controllers: [FormRequestsController],
  providers: [FormRequestsService],
})
export class FormRequestsModule {}