//lelou-solidarity-frontend/app/admin/(auth)/forgot-password/page.tsx
import { ForgotPasswordForm } from '@/components/admin/ForgotPasswordForm';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.admin.auth.forgotMeta };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}