import type { Metadata } from 'next';
import { parcelById } from '@/lib/data';
import { ScanClient } from '@/components/scan/ScanClient';

export const metadata: Metadata = { title: 'Lot Scan' };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ parcel?: string | string[] }> }) {
  const sp = await searchParams;
  const id = Array.isArray(sp.parcel) ? sp.parcel[0] : sp.parcel;
  const parcel = id ? parcelById(id) ?? null : null;
  return <ScanClient parcel={parcel} />;
}
