import type { Metadata } from 'next';
import { AskView } from '@/components/ask/AskView';

export const metadata: Metadata = { title: 'Ask Keystone', description: 'Questions about SB 4 and Habitat partnerships, answered only from the law’s facts.' };

export default function AskPage() {
  return <AskView />;
}
