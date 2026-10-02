//web/components/admin/MemberListCard.tsx
// v1.1 — carte moderne : soulèvement et lueur dorée au survol, photo cerclée,
// flèche animée, texte qui ne déborde plus ; accents rétablis.
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CardStatusBadge, MemberStatusBadge } from '@/components/ui/Badge';
import { formatDateShort } from '@/lib/format';
import { Member } from '@/lib/types';

export function MemberListCard({ member }: { member: Member }) {
  return (
    <Link href={`/admin/membres/${member.id}`} className="group block min-w-0">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-xl2 border border-ocean-100/60 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-[#D8B65C]/60 hover:shadow-card-hover active:scale-[0.98]">
        {/* Liseré doré qui apparaît au survol */}
        <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#F3E2A9] to-[#9A7B2F] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <img
          src={member.photoUrl}
          alt={`${member.firstName} ${member.lastName}`}
          className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-white object-cover shadow-md ring-2 ring-ocean-100 transition-all duration-300 group-hover:scale-105 group-hover:ring-[#D8B65C]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <p className="truncate text-sm font-bold text-ocean-800">
              {member.firstName} {member.lastName}
            </p>
            {member.memberCode && (
              <span className="text-xs font-medium text-ocean-300">{member.memberCode}</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ocean-400">
            {member.email} &middot; reçu le {formatDateShort(member.createdAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MemberStatusBadge status={member.status} />
            <CardStatusBadge status={member.cardStatus} />
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-ocean-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#9A7B2F]" />
      </div>
    </Link>
  );
}