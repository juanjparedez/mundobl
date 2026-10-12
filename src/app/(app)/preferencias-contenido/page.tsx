import { ContentGate } from '@/components/content/ContentGate/ContentGate';

export const metadata = { robots: { index: false, follow: false } };

export default function ContentPreferencesPage() {
  return <ContentGate settings />;
}
