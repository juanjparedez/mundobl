'use client';

import { createContext } from 'react';

/** Optional dashboard-wide summary size; standalone lists keep their own limit. */
export const ListCountContext = createContext<number | null>(null);
