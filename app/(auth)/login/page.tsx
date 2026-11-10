import { AuthForm } from '@/components/AuthForm';
import { login } from '@/lib/actions';

export default function LoginPage({ searchParams }: { searchParams: { expired?: string } }) {
  return <AuthForm mode="login" action={login} notice={searchParams.expired ? 'Your session ended. Please log in again.' : undefined} />;
}
