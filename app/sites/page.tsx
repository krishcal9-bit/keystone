import type { Metadata } from 'next';
import { SiteFinder } from '@/components/sites/SiteFinder';

export const metadata: Metadata = { title: 'Site Finder' };

export default function SitesPage() {
  return <SiteFinder />;
}
