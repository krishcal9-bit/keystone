import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { parcelById } from '@/lib/data';
import { defaultKeepSpaces } from '@/lib/sb4';
import { PitchKit } from '@/components/pitch/PitchKit';

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ keep?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const parcel = parcelById(id);
  return { title: parcel ? `Pitch Kit · ${parcel.displayName}` : 'Pitch Kit' };
}

export default async function PitchPage({ params, searchParams }: Params) {
  const { id } = await params;
  const parcel = parcelById(id);
  if (!parcel) notFound();
  const { keep } = await searchParams;
  const parsed = Number.parseInt(keep ?? '', 10);
  const keepSpaces = Number.isFinite(parsed) ? Math.min(Math.max(0, parsed), parcel.parkingSpaces) : defaultKeepSpaces(parcel);
  return <PitchKit parcel={parcel} initialKeepSpaces={keepSpaces} />;
}
