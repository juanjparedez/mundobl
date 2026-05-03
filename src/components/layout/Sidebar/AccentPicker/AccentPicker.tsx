'use client';

import { Tooltip } from 'antd';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { ACCENT_PRESETS, type AccentPresetKey } from '@/lib/theme.config';
import './AccentPicker.css';

const ACCENT_KEYS = Object.keys(ACCENT_PRESETS) as AccentPresetKey[];

export function AccentPicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="accent-picker" role="group" aria-label="Color theme">
      {ACCENT_KEYS.map((key) => {
        const preset = ACCENT_PRESETS[key];
        const isActive = key === accent;
        return (
          <Tooltip key={key} title={preset.name} placement="top">
            <button
              className={`accent-picker__swatch${isActive ? ' accent-picker__swatch--active' : ''}`}
              style={{ '--swatch-color': preset.swatch } as React.CSSProperties}
              onClick={() => setAccent(key)}
              aria-label={preset.name}
              aria-pressed={isActive}
            />
          </Tooltip>
        );
      })}
    </div>
  );
}
