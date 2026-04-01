import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'SalesCRM — Sotuv boshqaruv tizimi',
  description: 'Tashkilotlar, xodimlar, sotuvlar va KPI boshqarish uchun zamonaviy CRM tizimi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
