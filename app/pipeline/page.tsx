import type { Metadata } from 'next';
import { PipelineView } from '@/components/pipeline/PipelineView';

export const metadata: Metadata = { title: 'Pipeline', description: 'Every Keystone site from first contact to groundbreaking.' };

export default function PipelinePage() {
  return <PipelineView />;
}
