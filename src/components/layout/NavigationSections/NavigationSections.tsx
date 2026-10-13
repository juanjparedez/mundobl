'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Collapse } from 'antd';
import './NavigationSections.css';

export interface NavigationSection {
  key: string;
  label: string;
  entries: {
    key: string;
    label: string;
    path: string;
    icon: ReactNode;
    active: boolean;
  }[];
}

interface NavigationSectionsProps {
  sections: NavigationSection[];
  initialSection?: string;
  onNavigate: () => void;
}

/** Shared drawer contents: every destination remains a real, accessible link. */
export function NavigationSections({
  sections,
  initialSection,
  onNavigate,
}: NavigationSectionsProps) {
  const activeSection = sections.find((section) =>
    section.entries.some((entry) => entry.active)
  );
  return (
    <Collapse
      className="navigation-sections"
      ghost
      defaultActiveKey={[
        initialSection ?? activeSection?.key ?? sections[0]?.key ?? '',
      ]}
      items={sections.map((section) => ({
        key: section.key,
        label: (
          <span className="navigation-sections__heading">
            <strong>{section.label}</strong>
            <span className="navigation-sections__summary">
              {section.entries.map((entry) => entry.label).join(' · ')}
            </span>
          </span>
        ),
        children: (
          <ul className="navigation-sections__list">
            {section.entries.map((entry) => (
              <li key={entry.key}>
                <Link
                  href={entry.path}
                  prefetch={false}
                  className="navigation-sections__link"
                  aria-current={entry.active ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <span aria-hidden="true">{entry.icon}</span>
                  <span>{entry.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  );
}
