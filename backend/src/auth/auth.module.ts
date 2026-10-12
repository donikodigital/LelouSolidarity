import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        // Sans secret, on refuse de démarrer. Un secret court est toléré (pour ne
        // pas bloquer un déploiement existant) mais signalé dans les logs.
        if (!secret) {
          throw new Error('JWT_SECRET est obligatoire (longue chaine aleatoire).');
        }
        if (secret.length < 32) {
          new Logger('Auth').warn(
            'JWT_SECRET contient moins de 32 caracteres : remplace-le par une chaine aleatoire plus longue.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '12h') },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
