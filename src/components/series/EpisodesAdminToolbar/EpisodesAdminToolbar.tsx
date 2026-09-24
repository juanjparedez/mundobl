'use client';

import { Button, Checkbox, Collapse, Space, Tooltip } from 'antd';
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './EpisodesAdminToolbar.css';

interface EpisodesAdminToolbarProps {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onBulkToggleWatched: (markAsWatched: boolean) => void;
  onBulkDelete: () => void;
  bulkDeleting: boolean;
  generating: boolean;
  onGenerate: () => void;
  onAddEpisode: () => void;
}

/**
 * Acciones de curaduria sobre la lista de episodios (T12).
 *
 * Viven en un Collapse cerrado porque la misma tabla la usan Flor editando
 * el catalogo y un usuario comun marcando lo que vio: seleccion multiple,
 * borrado masivo y generacion de episodios no tienen por que competir con
 * el gesto de "vi este capitulo".
 */
export function EpisodesAdminToolbar({
  allSelected,
  someSelected,
  selectedCount,
  onSelectAll,
  onBulkToggleWatched,
  onBulkDelete,
  bulkDeleting,
  generating,
  onGenerate,
  onAddEpisode,
}: EpisodesAdminToolbarProps) {
  const { t } = useLocale();

  return (
    <Collapse
      className="episodes-admin-toolbar"
      size="small"
      items={[
        {
          key: 'admin',
          label: (
            <span className="episodes-admin-toolbar__label">
              <ToolOutlined /> {t('episodesList.adminTools')}
            </span>
          ),
          children: (
            <div className="episodes-admin-toolbar__body">
              <div className="episodes-admin-toolbar__selection">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onSelectAll}
                >
                  {t('episodesList.colEpisode')}
                </Checkbox>
                {selectedCount > 0 && (
                  <span className="episodes-admin-toolbar__count">
                    {interpolateMessage(t('episodesList.selectedCount'), {
                      n: String(selectedCount),
                    })}
                  </span>
                )}
              </div>

              <Space size="small" wrap>
                <Tooltip title={t('episodesList.tooltipWatched')}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    disabled={selectedCount === 0}
                    onClick={() => onBulkToggleWatched(true)}
                  >
                    {t('episodesList.bulkWatched')}
                  </Button>
                </Tooltip>
                <Tooltip title={t('episodesList.tooltipUnwatched')}>
                  <Button
                    size="small"
                    icon={<EyeInvisibleOutlined />}
                    disabled={selectedCount === 0}
                    onClick={() => onBulkToggleWatched(false)}
                  >
                    {t('episodesList.bulkUnwatched')}
                  </Button>
                </Tooltip>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={bulkDeleting}
                  disabled={selectedCount === 0}
                  onClick={onBulkDelete}
                >
                  {t('episodesList.bulkDelete')}
                </Button>
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={onGenerate}
                  loading={generating}
                >
                  {t('episodesList.generateButton')}
                </Button>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={onAddEpisode}
                >
                  {t('episodesList.addButton')}
                </Button>
              </Space>
            </div>
          ),
        },
      ]}
    />
  );
}
