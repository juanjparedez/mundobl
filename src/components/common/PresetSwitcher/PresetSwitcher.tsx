'use client';

import { useTheme } from '@/lib/providers/ThemeProvider';
import { VIEW_PRESETS, type ViewPresetKey } from '@/types/presets.types';
import { Tooltip } from 'antd';
import './PresetSwitcher.css';

interface PresetSwitcherProps {
  compact?: boolean;
  className?: string;
}

const PRESET_KEYS: ViewPresetKey[] = [
  'cinema',
  'tracker',
  'encyclopedia',
  'blind',
];

export function PresetSwitcher({
  compact = false,
  className = '',
}: PresetSwitcherProps) {
  const { preset, setPreset } = useTheme();

  return (
    <div
      className={`preset-switcher ${compact ? 'preset-switcher--compact' : ''} ${className}`}
      role="radiogroup"
      aria-label="Modo de experiencia y visualización"
    >
      {PRESET_KEYS.map((key) => {
        const config = VIEW_PRESETS[key];
        const isActive = preset === key;

        return (
          <Tooltip
            key={key}
            title={
              <div className="preset-switcher__tooltip">
                <div className="preset-switcher__tooltip-title">
                  {config.emoji} {config.nameFallback}
                </div>
                <div className="preset-switcher__tooltip-desc">
                  {config.taglineFallback}
                </div>
              </div>
            }
            placement="bottom"
          >
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setPreset(key)}
              className={`preset-switcher__btn ${
                isActive ? 'preset-switcher__btn--active' : ''
              }`}
            >
              <span className="preset-switcher__emoji" aria-hidden="true">
                {config.emoji}
              </span>
              {!compact && (
                <span className="preset-switcher__label">
                  {config.nameFallback.split(' ')[0]}
                </span>
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
