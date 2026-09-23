import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CardStatusBadge, MemberStatusBadge } from '@/components/ui/Badge';
import { formatDateShort } from '@/lib/format';
import { Member } from '@/lib/types';

export function MemberListCard({ member }: { member: Member }) {
  return (
    <Link href={`/admin/membres/${member.id}`}>
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-card-hover">
        <img
          src={member.photoUrl}
          alt={`${member.firstName} ${member.lastName}`}
          className="h-14 w-14 flex-shrink-0 rounded-full border border-ocean-100 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-ocean-800">
              {member.firstName} {member.lastName}
            </p>
            {member.memberCode && (
              <span className="text-xs font-medium text-ocean-300">{member.memberCode}</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ocean-400">
            {member.email} &middot; recu le {formatDateShort(member.createdAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MemberStatusBadge status={member.status} />
            <CardStatusBadge status={member.cardStatus} />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-ocean-300" />
      </Card>
    </Link>
  );
}
