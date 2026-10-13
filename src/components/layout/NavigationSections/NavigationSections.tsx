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
  onNavigate?: () => void;
}

/** Inline groups; destinations stay in the same navigation surface. */
export function NavigationSections({
  sections,
  initialSection,
  onNavigate,
}: NavigationSectionsProps) {
  const activeSection = sections.find((section) =>
    section.entries.some((entry) => entry.active)
  );
  const links = (section: NavigationSection) => (
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
  );
  return (
    <div className="navigation-sections">
      {sections.map((section) =>
        section.entries.length === 1 ? (
          <div key={section.key}>{links(section)}</div>
        ) : (
          <Collapse
            key={section.key}
            ghost
            defaultActiveKey={
              section.key === (initialSection ?? activeSection?.key)
                ? [section.key]
                : []
            }
            items={[
              {
                key: section.key,
                label: (
                  <span className="navigation-sections__heading">
                    {section.label}
                  </span>
                ),
                children: links(section),
              },
            ]}
          />
        )
      )}
    </div>
  );
}
