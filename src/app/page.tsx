'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push(ROUTES.CATALOGO);
  }, [router]);

  return null;
}
