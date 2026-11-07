'use client';
import { useT } from '@/lib/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { StatusPage } from '@/components/layout/StatusPage';

export default function NotFound() {
  const { t } = useT();
  return <StatusPage title={t('nf.title')} body={t('nf.body')} action={<ButtonLink href="/sites" size="lg">{t('nf.cta')}</ButtonLink>} />;
}
