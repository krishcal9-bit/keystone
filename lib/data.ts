import parcelsJson from '@/data/parcels.json';
import type { Parcel } from './sb4';

export const parcels = parcelsJson as unknown as Parcel[];
export const parcelById = (id: string): Parcel | undefined => parcels.find((p) => p.id === id);
export const DEMO_PARCEL_ID = parcels[0].id;
export const cities = Array.from(new Set(parcels.map((p) => p.city))).sort();
