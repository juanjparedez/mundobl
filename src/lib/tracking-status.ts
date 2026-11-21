import type { WatchStatus } from '@prisma/client';
import type { TrackingStatus } from './tracking-core';

/** MundoBL's stored enum <-> the tracking core's statuses. One place, both ways. */
const TO_CORE: Record<WatchStatus, TrackingStatus> = {
  SIN_VER: 'none',
  QUIERO_VER: 'planned',
  VIENDO: 'watching',
  VISTA: 'completed',
  RETOMAR: 'paused',
  ABANDONADA: 'dropped',
};

const FROM_CORE: Record<TrackingStatus, WatchStatus> = {
  none: 'SIN_VER',
  planned: 'QUIERO_VER',
  watching: 'VIENDO',
  completed: 'VISTA',
  paused: 'RETOMAR',
  dropped: 'ABANDONADA',
};

export function toCoreStatus(status: WatchStatus): TrackingStatus {
  return TO_CORE[status];
}

export function fromCoreStatus(status: TrackingStatus): WatchStatus {
  return FROM_CORE[status];
}
