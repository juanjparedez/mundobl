'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, App, Button, Checkbox, Input, Select } from 'antd';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import { SupportPage } from '../SupportPage/SupportPage';
import { useSupportLabels } from '../useSupportLabels';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  parseSupportContent,
  type SupportContent,
  type SupportMethod,
} from '@/lib/support-input';
import './SupportAdmin.css';
interface SupportAdminState {
  draft: SupportContent;
  version: number;
  enabled: boolean;
  updatedAt: string | null;
}
export function SupportAdmin({ initial }: { initial: SupportAdminState }) {
  const { t } = useLocale();
  const labels = useSupportLabels(t);
  const { message } = App.useApp();
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [draft, setDraft] = useState(initial.draft);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const edit = (next: SupportContent) => {
    setDraft(next);
    setDirty(true);
  };
  const methodEdit = (index: number, change: Partial<SupportMethod>) =>
    edit({
      ...draft,
      methods: draft.methods.map((m, i) =>
        i === index ? { ...m, ...change } : m
      ),
    });
  const move = (index: number, delta: number) => {
    const methods = [...draft.methods];
    [methods[index], methods[index + delta]] = [
      methods[index + delta],
      methods[index],
    ];
    edit({ ...draft, methods });
  };
  const submit = async (action: 'save' | 'publish' | 'hide') => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/patrocinio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          version: state.version,
          ...(action === 'save' ? { content: draft } : {}),
        }),
      });
      if (!response.ok) {
        setError(response.status === 409 ? labels.conflict : labels.error);
        return;
      }
      const result = (await response.json()) as SupportAdminState;
      setState(result);
      if (action === 'save') {
        setDraft(result.draft);
        setDirty(false);
      }
      message.success(labels.saved);
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  };
  const reload = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/patrocinio', {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error();
      const result = (await response.json()) as SupportAdminState;
      setState(result);
      setDraft(result.draft);
      setDirty(false);
      setError('');
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  };
  let ready = true;
  try {
    parseSupportContent(draft, true);
  } catch {
    ready = false;
  }
  const demo = !draft.intro && !draft.purpose && draft.methods.length === 0;
  const preview = demo
    ? {
        intro: labels.intro,
        purpose: labels.purpose,
        thanks: labels.thanks,
        methods: [
          {
            kind: 'link' as const,
            label: labels.link,
            enabled: true,
            url: '',
            alias: '',
            holder: '',
            bank: '',
            currency: '',
          },
        ],
      }
    : draft;
  return (
    <div className="support-admin">
      <h1>{labels.admin}</h1>
      <Alert
        type="info"
        title={state.enabled ? labels.live : labels.hidden}
        description={labels.instructions}
      />
      {error && (
        <Alert
          type="error"
          title={error}
          action={
            <Button onClick={reload} disabled={busy}>
              {labels.reload}
            </Button>
          }
        />
      )}
      <fieldset disabled={busy} className="support-admin__fields">
        <PanelCard>
          {(['intro', 'purpose', 'thanks'] as const).map((key) => (
            <label key={key} className="support-admin__field">
              {labels[`${key}Label`]}
              <Input.TextArea
                value={draft[key]}
                maxLength={key === 'thanks' ? 1000 : 2000}
                onChange={(e) => edit({ ...draft, [key]: e.target.value })}
                rows={3}
              />
            </label>
          ))}
          {draft.methods.map((method, index) => (
            <PanelCard key={index}>
              <div className="support-admin__actions">
                <Select
                  aria-label={labels.add}
                  value={method.kind}
                  options={[
                    { value: 'link', label: labels.link },
                    { value: 'transfer', label: labels.transfer },
                  ]}
                  onChange={(kind: 'link' | 'transfer') =>
                    methodEdit(index, { kind })
                  }
                />
                <Checkbox
                  checked={method.enabled}
                  onChange={(e) =>
                    methodEdit(index, { enabled: e.target.checked })
                  }
                >
                  {labels.enabled}
                </Checkbox>
              </div>
              {(
                [
                  'label',
                  ...(method.kind === 'link'
                    ? ['url']
                    : ['alias', 'holder', 'bank', 'currency']),
                ] as const
              ).map((field) => {
                const key = field as
                  | 'label'
                  | 'url'
                  | 'alias'
                  | 'holder'
                  | 'bank'
                  | 'currency';
                return (
                  <label className="support-admin__field" key={key}>
                    {labels[key]}
                    <Input
                      value={method[key]}
                      maxLength={
                        key === 'url'
                          ? 500
                          : key === 'holder'
                            ? 150
                            : key === 'currency'
                              ? 10
                              : 100
                      }
                      onChange={(e) =>
                        methodEdit(index, { [key]: e.target.value })
                      }
                    />
                  </label>
                );
              })}
              <div className="support-admin__actions">
                <Button
                  disabled={index === 0 || busy}
                  onClick={() => move(index, -1)}
                >
                  {labels.up}
                </Button>
                <Button
                  disabled={index === draft.methods.length - 1 || busy}
                  onClick={() => move(index, 1)}
                >
                  {labels.down}
                </Button>
                <Button
                  danger
                  onClick={() =>
                    edit({
                      ...draft,
                      methods: draft.methods.filter((_, i) => i !== index),
                    })
                  }
                >
                  {labels.remove}
                </Button>
              </div>
            </PanelCard>
          ))}
          <Button
            disabled={draft.methods.length >= 8 || busy}
            onClick={() =>
              edit({
                ...draft,
                methods: [
                  ...draft.methods,
                  {
                    kind: 'link',
                    label: '',
                    enabled: true,
                    url: '',
                    alias: '',
                    holder: '',
                    bank: '',
                    currency: '',
                  },
                ],
              })
            }
          >
            {labels.add}
          </Button>
        </PanelCard>
      </fieldset>
      <div className="support-admin__actions">
        <Button
          type="primary"
          disabled={busy || !dirty}
          onClick={() => submit('save')}
        >
          {labels.save}
        </Button>
        <Button
          disabled={busy || dirty || !ready}
          onClick={() => submit('publish')}
        >
          {labels.publish}
        </Button>
        <Button
          disabled={busy || !state.enabled}
          onClick={() => submit('hide')}
        >
          {labels.hide}
        </Button>
      </div>
      <h2>{labels.preview}</h2>
      <SupportPage content={preview} labels={labels} demo={demo} preview />
    </div>
  );
}
