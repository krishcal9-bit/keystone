import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parcelById, parcels } from '@/lib/data';
import { SiteDetail } from '@/components/site/SiteDetail';

export function generateStaticParams() { return parcels.map((p) => ({ id: p.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = parcelById(id);
  return { title: p ? p.displayName : 'Site' };
}

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parcel = parcelById(id);
  if (!parcel) notFound();
  return <SiteDetail parcel={parcel} />;
}
