'use client';
import { useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { StatusPage } from '@/components/layout/StatusPage';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  useEffect(() => { console.error('[keystone] route error', error); }, [error]);
  return (
    <StatusPage
      title={t('err.title')}
      body={t('err.body')}
      detail={error.digest ? `ref ${error.digest}` : undefined}
      action={<Button size="lg" onClick={() => reset()}>{t('err.reload')}</Button>}
    />
  );
}
