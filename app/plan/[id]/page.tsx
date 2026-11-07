import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parcelById, parcels } from '@/lib/data';
import { PlanStudio } from '@/components/plan/PlanStudio';

export function generateStaticParams() { return parcels.map((p) => ({ id: p.id })); }
export const metadata: Metadata = { title: 'Plan Studio' };

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ keep?: string }> }) {
  const { id } = await params;
  const { keep } = await searchParams;
  const parcel = parcelById(id);
  if (!parcel) notFound();
  const k = keep != null && Number.isFinite(Number(keep)) ? Number(keep) : undefined;
  return <PlanStudio parcel={parcel} initialKeep={k} />;
}
