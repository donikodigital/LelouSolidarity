//lelou-solidarity-frontend/app/admin/(auth)/reset-password/[token]/page.tsx
import { ResetPasswordForm } from '@/components/admin/ResetPasswordForm';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.admin.auth.resetMeta };
}

// Next.js 15 : `params` est une promesse
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
