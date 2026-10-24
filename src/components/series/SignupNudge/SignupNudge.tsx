'use client';

import { Button } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import './SignupNudge.css';

interface SignupNudgeProps {
  title: string;
  body: string;
  action: string;
  dismiss: string;
  onAction: () => void;
  onDismiss: () => void;
}

/**
 * Para que sirve una cuenta, dicho una vez y en el momento en que importa:
 * despues de usar el seguimiento sin ella. Nunca un modal ni un bloqueo:
 * todo sigue funcionando sin cuenta.
 */
export function SignupNudge({
  title,
  body,
  action,
  dismiss,
  onAction,
  onDismiss,
}: SignupNudgeProps) {
  return (
    <aside className="signup-nudge" aria-label={title}>
      <p className="signup-nudge__title">
        <CloudSyncOutlined aria-hidden /> {title}
      </p>
      <p className="signup-nudge__body">{body}</p>
      <div className="signup-nudge__actions">
        <Button type="primary" onClick={onAction}>
          {action}
        </Button>
        <Button type="text" onClick={onDismiss}>
          {dismiss}
        </Button>
      </div>
    </aside>
  );
}
