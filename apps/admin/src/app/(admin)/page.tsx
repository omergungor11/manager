import { redirect } from 'next/navigation';

// Root / → go to dashboard
export default function AdminRootPage() {
  redirect('/dashboard');
}
