import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { MailModule } from '../mail/mail.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [UploadsModule, MailModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
