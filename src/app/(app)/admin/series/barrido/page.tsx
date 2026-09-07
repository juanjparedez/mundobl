import { Metadata } from 'next';
import { BarridoClient } from './BarridoClient';

export const metadata: Metadata = {
  title: 'Barrido de canal',
};

export default function BarridoPage() {
  return <BarridoClient />;
}
