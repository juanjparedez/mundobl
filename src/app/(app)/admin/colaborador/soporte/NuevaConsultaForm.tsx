'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, message as antMessage } from 'antd';

export function NuevaConsultaForm() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/soporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: body.trim() }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'No se pudo abrir la consulta.');
      }
      const created = (await response.json()) as { id: number };
      antMessage.success('Consulta enviada. Te avisamos cuando respondamos.');
      setSubject('');
      setBody('');
      router.push(`/admin/colaborador/soporte/${created.id}`);
    } catch (error: unknown) {
      antMessage.error(
        error instanceof Error ? error.message : 'Error al enviar.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="colaborador-form">
      <Input
        placeholder="Asunto"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={140}
        showCount
      />
      <Input.TextArea
        rows={4}
        placeholder="Contanos qué necesitás. Si es sobre una serie tuya, pegá el link."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        showCount
      />
      <Button
        type="primary"
        loading={sending}
        disabled={!subject.trim() || !body.trim()}
        onClick={submit}
        style={{ alignSelf: 'flex-end' }}
      >
        Abrir consulta
      </Button>
    </div>
  );
}
