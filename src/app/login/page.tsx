import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  if (isDemoMode()) {
    redirect('/');
  }
  return <LoginForm />;
}
