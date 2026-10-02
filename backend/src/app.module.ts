//backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccessCodesModule } from './access-codes/access-codes.module';
import { FormRequestsModule } from './form-requests/form-requests.module';
import { MembersModule } from './members/members.module';
import { UploadsModule } from './uploads/uploads.module';
import { CardsModule } from './cards/cards.module';
import { VerifyModule } from './verify/verify.module';
import { MailModule } from './mail/mail.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        // Limite par défaut appliquée à TOUTES les routes (y compris
        // /auth/login, contre le bruteforce). Les routes publiques
        // sensibles (soumission de formulaire, vérification QR, demande de
        // formulaire) ont en plus leur propre limite, plus stricte, via @Throttle().
        ttl: 60_000,
        limit: 20,
      },
    ]),
    PrismaModule,
    AuthModule,
    AccessCodesModule,
    FormRequestsModule,
    MembersModule,
    UploadsModule,
    CardsModule,
    VerifyModule,
    MailModule,
    SchedulerModule,
  ],
  providers: [
    // Sans ce guard global, les décorateurs @Throttle() posés sur les
    // controllers n'ont aucun effet : c'est lui qui applique réellement
    // la limitation de débit à chaque requête.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}