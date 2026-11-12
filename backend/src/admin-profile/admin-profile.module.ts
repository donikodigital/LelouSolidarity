//backend/src/admin-profile/admin-profile.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';

@Module({
  // AuthModule exporte JwtModule (signature des nouveaux jetons)
  imports: [AuthModule, MailModule, UploadsModule],
  controllers: [AdminProfileController],
  providers: [AdminProfileService],
})
export class AdminProfileModule {}
