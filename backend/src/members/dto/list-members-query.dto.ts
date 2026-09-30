//backend/src/members/dto/list-members-query.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { CardStatus, MemberStatus } from '@prisma/client';

export class ListMembersQueryDto {
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsEnum(CardStatus)
  cardStatus?: CardStatus;
}
