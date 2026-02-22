import { GlobalOutlined } from '@ant-design/icons';
import './CountryFlag.css';

interface CountryFlagProps {
  code?: string | null;
  size?: 'small' | 'medium' | 'large';
}

export function CountryFlag({ code, size = 'medium' }: CountryFlagProps) {
  if (!code) {
    return <GlobalOutlined className="country-flag-fallback" />;
  }

  return (
    <span
      className={`fi fi-${code.toLowerCase()} country-flag country-flag--${size}`}
    />
  );
}
