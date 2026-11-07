import { LandingShell } from '@/components/landing/LandingShell';
import { HeroStatic } from '@/components/scenes/HeroStatic';

export default function Home() {
  return <LandingShell hero={<HeroStatic />} />;
}
