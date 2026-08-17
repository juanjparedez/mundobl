'use client';

import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import { useTheme } from '@/lib/providers/ThemeProvider';
import './AnnouncementBodyEditor.css';

// La libreria manipula el DOM directamente (CodeMirror) -> sin SSR.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface AnnouncementBodyEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Wrapper que adapta @uiw/react-md-editor al patron value/onChange de
 * Form.Item de antd, y respeta el tema claro/oscuro activo del proyecto
 * (ver AnnouncementBodyEditor.css para el puenteo de variables).
 */
export function AnnouncementBodyEditor({
  value,
  onChange,
}: AnnouncementBodyEditorProps) {
  const { theme } = useTheme();

  return (
    <div className="announcement-body-editor" data-color-mode={theme}>
      <MDEditor
        value={value ?? ''}
        onChange={(next) => onChange?.(next ?? '')}
        height={220}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  );
}
