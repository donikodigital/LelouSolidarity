//web/app/admin/(dashboard)/profil/page.tsx
// Page « Mon profil » du gérant : identité, informations, sécurité, préférences,
// export des données. Une colonne sur mobile, deux sur grand écran.
'use client';

import { AboutCard } from '@/components/admin/profile/AboutCard';
import { DataCard } from '@/components/admin/profile/DataCard';
import { InfoForm } from '@/components/admin/profile/InfoForm';
import { InstallCard } from '@/components/admin/profile/InstallCard';
import { PreferencesCard } from '@/components/admin/profile/PreferencesCard';
import { ProfileHeader } from '@/components/admin/profile/ProfileHeader';
import { SecurityCard } from '@/components/admin/profile/SecurityCard';

export default function ProfilePage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
      <ProfileHeader />
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <InfoForm delay={80} />
        <SecurityCard delay={140} />
        <PreferencesCard delay={200} />
        <InstallCard delay={230} />
        <DataCard delay={260} />
        <AboutCard delay={320} />
      </div>
    </div>
  );
}
