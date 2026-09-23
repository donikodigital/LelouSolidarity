import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // Tourne chaque jour a 7h (heure du serveur - Render fonctionne en UTC).
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleExpirationChecks() {
    await this.sendUpcomingReminders();
    await this.markExpiredCards();
  }

  private async sendUpcomingReminders() {
    const reminderDays = this.config.get<number>('CARD_REMINDER_DAYS_BEFORE', 30);
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + Number(reminderDays));

    const members = await this.prisma.member.findMany({
      where: {
        cardStatus: 'ACTIVE',
        reminderSentAt: null,
        cardExpiresAt: { lte: threshold, gt: now },
      },
    });

    for (const member of members) {
      try {
        await this.mail.sendExpirationReminder(
          member.email,
          member.firstName,
          member.cardExpiresAt as Date,
        );
        await this.prisma.member.update({
          where: { id: member.id },
          data: { cardStatus: 'EXPIRING_SOON', reminderSentAt: new Date() },
        });
      } catch (err) {
        this.logger.error(
          `Echec de l'envoi du rappel d'expiration a ${member.email}: ${(err as Error).message}`,
        );
      }
    }

    if (members.length) {
      this.logger.log(`${members.length} rappel(s) d'expiration envoye(s).`);
    }
  }

  private async markExpiredCards() {
    const now = new Date();

    const members = await this.prisma.member.findMany({
      where: {
        cardStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        cardExpiresAt: { lte: now },
      },
    });

    for (const member of members) {
      try {
        await this.mail.sendCardExpired(member.email, member.firstName);
        await this.prisma.member.update({
          where: { id: member.id },
          data: { cardStatus: 'EXPIRED', expiredNotifiedAt: new Date() },
        });
      } catch (err) {
        this.logger.error(
          `Echec de la notification d'expiration a ${member.email}: ${(err as Error).message}`,
        );
      }
    }

    if (members.length) {
      this.logger.log(`${members.length} carte(s) marquee(s) comme expiree(s).`);
    }
  }
}
