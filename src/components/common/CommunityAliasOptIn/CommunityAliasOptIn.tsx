'use client';

import { Switch, Button, Tag, Tooltip } from 'antd';
import { SyncOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useCommunityAlias } from '@/hooks/useCommunityAlias';
import './CommunityAliasOptIn.css';

/**
 * Control de participación comunitaria y visualización/cambio de Alias seudónimo (Nivel 2).
 * Respeta privacidad total: por defecto inactivo, con cambio de seudónimo en un clic.
 */
export function CommunityAliasOptIn() {
  const { t } = useLocale();
  const {
    aliasName,
    optedIn,
    isLoggedIn,
    rerolling,
    cooldown,
    setOptIn,
    reroll,
  } = useCommunityAlias();

  return (
    <div className="community-alias-optin">
      <div className="community-alias-optin__header">
        <Switch
          checked={optedIn}
          onChange={setOptIn}
          aria-describedby="community-alias-optin-hint"
        />
        <div className="community-alias-optin__title-box">
          <p className="community-alias-optin__label">
            {t('communityAlias.optInLabel')}
          </p>
          <p
            id="community-alias-optin-hint"
            className="community-alias-optin__hint"
          >
            {optedIn
              ? t('communityAlias.optInHintOn', { alias: aliasName })
              : t('communityAlias.optInHintOff')}
          </p>
        </div>
      </div>

      <div className="community-alias-optin__card">
        <div className="community-alias-optin__alias-info">
          <span className="community-alias-optin__alias-caption">
            {t('communityAlias.yourAlias')}
          </span>
          <span className="community-alias-optin__alias-name">
            «{aliasName}»
          </span>
          <Tag
            icon={isLoggedIn ? <UserOutlined /> : <GlobalOutlined />}
            color={isLoggedIn ? 'blue' : 'default'}
          >
            {isLoggedIn
              ? t('communityAlias.accountBadge')
              : t('communityAlias.visitorBadge')}
          </Tag>
        </div>

        <Tooltip title={cooldown ? t('communityAlias.cooldown') : undefined}>
          <Button
            size="small"
            icon={<SyncOutlined spin={rerolling} />}
            loading={rerolling}
            disabled={cooldown}
            onClick={() => void reroll()}
          >
            {t('communityAlias.change')}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
