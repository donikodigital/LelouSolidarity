//lelou-solidarity-frontend/app/admin/(auth)/reset-password/[token]/page.tsx
import { ResetPasswordForm } from '@/components/admin/ResetPasswordForm';

export const metadata = { title: 'Nouveau mot de passe - Espace administrateur' };

// Next.js 15 : `params` est une promesse
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
