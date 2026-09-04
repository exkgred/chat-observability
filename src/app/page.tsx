import { isDemoMode } from '@/lib/auth';
import { DashboardView } from '@/components/dashboard-view';

export default function HomePage() {
  return <DashboardView demo={isDemoMode()} />;
}
