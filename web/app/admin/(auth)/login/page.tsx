import { LoginForm } from '@/components/admin/LoginForm';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.admin.auth.loginMeta };
}

export default function AdminLoginPage() {
  return <LoginForm />;
}
