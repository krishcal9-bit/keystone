import type { Metadata } from 'next';
import { JudgeGuide } from '@/components/judges/JudgeGuide';

export const metadata: Metadata = { title: 'Judge Guide' };

export default function JudgesPage() {
  return <JudgeGuide />;
}
