'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Form, Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { PanelModal } from '@/components/design-system';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './CompanyEditButton.css';

interface CompanyEditButtonProps {
  companyId: number;
  name: string;
}

interface EditValues {
  name: string;
}

/** Editar el nombre desde la ficha, sin ir a /admin/productoras. */
export function CompanyEditButton({ companyId, name }: CompanyEditButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const message = useMessage();
  const { t } = useLocale();
  const [form] = Form.useForm<EditValues>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const role = session?.user?.role;
  if (role !== 'ADMIN' && role !== 'MODERATOR') return null;

  const handleSubmit = async (values: EditValues) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/production-companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || t('adminProductionCompanies.saveError'));
      }
      message.success(t('adminProductionCompanies.updateSuccess'));
      setOpen(false);
      router.refresh();
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t('adminProductionCompanies.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        className="company-edit-button"
        icon={<EditOutlined />}
        size="small"
        onClick={() => {
          form.setFieldsValue({ name });
          setOpen(true);
        }}
      >
        {t('adminProductionCompanies.actionEdit')}
      </Button>
      <PanelModal
        title={t('adminProductionCompanies.modalEditTitle')}
        size="sm"
        open={open}
        onClose={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={t('adminProductionCompanies.save')}
        cancelText={t('adminProductionCompanies.cancel')}
        confirmLoading={saving}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t('adminProductionCompanies.fieldName')}
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: t('adminProductionCompanies.requiredName'),
              },
            ]}
          >
            <Input placeholder={t('adminProductionCompanies.hintName')} />
          </Form.Item>
        </Form>
      </PanelModal>
    </>
  );
}
