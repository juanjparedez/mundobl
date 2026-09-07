'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UnorderedListOutlined,
  CloudUploadOutlined,
  ReadOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import './colaborador.css';

// Nav local del area reducida de COLLABORATOR — a diferencia de AdminNav
// (todo el arbol de /admin, vetado para este rol por src/proxy.ts), solo
// lista las rutas a las que este rol realmente tiene acceso.
export function ColaboradorNav() {
  const pathname = usePathname();

  const links = [
    {
      href: '/admin/colaborador',
      label: 'Mis series',
      icon: <UnorderedListOutlined />,
      active: pathname === '/admin/colaborador',
    },
    {
      href: '/admin/colaborador/importar',
      label: 'Importar desde YouTube',
      icon: <CloudUploadOutlined />,
      active: pathname === '/admin/colaborador/importar',
    },
    {
      href: '/admin/colaborador/guia',
      label: 'Guía de carga',
      icon: <ReadOutlined />,
      active: pathname === '/admin/colaborador/guia',
    },
    {
      href: '/admin/colaborador/soporte',
      label: 'Soporte',
      icon: <MessageOutlined />,
      active: pathname.startsWith('/admin/colaborador/soporte'),
    },
  ];

  return (
    <nav className="colaborador-nav" aria-label="Panel de colaborador">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`colaborador-nav__link${link.active ? ' colaborador-nav__link--active' : ''}`}
        >
          {link.icon}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
