'use client';

import { useState, useRef } from 'react';
import { Button, Space, Tabs, Divider } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  LinkOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import MDIt from 'markdown-it';
import './markdown-editor.css';

const md = new MDIt({
  html: false,
  linkify: true,
  breaks: true,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 8,
  placeholder = 'Escribe aquí (Markdown soportado)',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'Texto';

    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Re-focus y posicionar cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Ingresa la URL:');
    if (url) {
      insertMarkdown('[Texto del link](', `${url})`);
    }
  };

  const renderedHtml = md.render(value);

  return (
    <div className="markdown-editor">
      <Tabs
        defaultValue="edit"
        value={activeTab}
        onChange={(key) => setActiveTab(key as 'edit' | 'preview')}
        tabBarExtraContent={
          <Space size="small" className="markdown-editor__toolbar">
            <Button
              size="small"
              icon={<BoldOutlined />}
              onClick={() => insertMarkdown('**', '**')}
              title="Bold"
            />
            <Button
              size="small"
              icon={<ItalicOutlined />}
              onClick={() => insertMarkdown('_', '_')}
              title="Italic"
            />
            <Button
              size="small"
              icon={<CodeOutlined />}
              onClick={() => insertMarkdown('`', '`')}
              title="Código"
            />
            <Divider type="vertical" style={{ margin: '0 4px' }} />
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
              onClick={() => insertMarkdown('\n- ', '')}
              title="Lista sin orden"
            />
            <Button
              size="small"
              icon={<OrderedListOutlined />}
              onClick={() => insertMarkdown('\n1. ', '')}
              title="Lista ordenada"
            />
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={insertLink}
              title="Link"
            />
          </Space>
        }
      >
        <Tabs.TabPane key="edit" label="Editar">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="markdown-editor__textarea"
            style={{ height: `${rows * 1.5}rem` }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane key="preview" label="Vista Previa">
          <div
            className="markdown-editor__preview"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </Tabs.TabPane>
      </Tabs>

      <div className="markdown-editor__hint">
        💡 Soporta <strong>Markdown</strong>: **negrita**, _cursiva_, `código`,
        [link](url), listas, etc.
      </div>
    </div>
  );
}
