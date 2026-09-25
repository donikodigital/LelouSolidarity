//lelou-solidarity-frontend/app/admin/(auth)/reset-password/[token]/page.tsx
import { ResetPasswordForm } from '@/components/admin/ResetPasswordForm';

export const metadata = { title: 'Nouveau mot de passe - Espace administrateur' };

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return <ResetPasswordForm token={params.token} />;
}