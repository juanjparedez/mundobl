'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { SearchOutlined, LoginOutlined } from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './LandingPage.css';

export function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLocale();

  return (
    <div className="landing">
      <div className="landing__hero">
        <Image
          src="/images/landing.png"
          alt="MundoBL"
          width={360}
          height={360}
          priority
          sizes="(max-width: 768px) 220px, 360px"
          quality={78}
        />
      </div>

      <p className="landing__subtitle">{t('landing.subtitle')}</p>

      <div className="landing__actions">
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={() => router.push(ROUTES.CATALOGO)}
        >
          {t('landing.exploreCatalog')}
        </Button>

        {!session?.user && (
          <Button
            size="large"
            icon={<LoginOutlined />}
            onClick={() => signIn('google', { callbackUrl: ROUTES.CATALOGO })}
          >
            {t('landing.signIn')}
          </Button>
        )}
      </div>
    </div>
  );
}
