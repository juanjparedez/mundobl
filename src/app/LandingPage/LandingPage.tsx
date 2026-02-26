'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { SearchOutlined, LoginOutlined } from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import './LandingPage.css';

export function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="landing">
      <div className="landing__hero">
        <Image
          src="/images/landing.png"
          alt="MundoBL"
          width={360}
          height={360}
          priority
        />
      </div>

      <p className="landing__subtitle">
        Tu catálogo personal de series BL y más.
      </p>

      <div className="landing__actions">
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={() => router.push(ROUTES.CATALOGO)}
        >
          Explorar Catálogo
        </Button>

        {!session?.user && (
          <Button
            size="large"
            icon={<LoginOutlined />}
            onClick={() => signIn('google', { callbackUrl: ROUTES.CATALOGO })}
          >
            Iniciar Sesión
          </Button>
        )}
      </div>
    </div>
  );
}
