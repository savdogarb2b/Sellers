import './globals.css';
import Providers from '@/components/Providers';

const SITE_URL = 'https://nurseles.uz';
const SITE_NAME = 'NurSeles — Sotuv Boshqaruv Tizimi';
const SITE_DESCRIPTION = 'NurSeles — O\'zbekistondagi eng zamonaviy CRM tizimi. Sun\'iy intellekt (AI) bilan sotuvlarni boshqaring, xodimlar samaradorligini kuzating, KPI va moliyaviy tahlillarni real vaqtda oling. Bepul sinov mavjud!';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s | NurSeles CRM',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'CRM',
    'CRM tizimi',
    'sotuv boshqaruvi',
    'sales management',
    'SalesCRM',
    'NurSeles',
    'O\'zbekiston CRM',
    'biznes boshqaruv',
    'xodimlar boshqaruvi',
    'KPI monitoring',
    'sotuv analitika',
    'AI CRM',
    'sun\'iy intellekt CRM',
    'moliyaviy tahlil',
    'lidlar boshqaruvi',
    'lead management',
    'savdo voronkasi',
    'sales funnel',
    'SaaS CRM',
    'premium CRM',
    'bepul CRM',
    'Uzbekistan CRM',
    'sotuvchi monitoring',
    'bonus jarima tizimi',
  ],
  authors: [{ name: 'NurSeles', url: SITE_URL }],
  creator: 'NurSeles',
  publisher: 'NurSeles',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: 'NurSeles',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'NurSeles — Zamonaviy CRM Tizimi',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console verification (o'zgartiring)
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'technology',
  classification: 'CRM Software',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NurSeles CRM',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'UZS',
    description: 'Bepul sinov davri mavjud',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '150',
    bestRating: '5',
  },
  featureList: [
    'Sun\'iy intellekt (AI) bilan sotuv analitikasi',
    'Real-time KPI monitoring',
    'Xodimlar samaradorlik kuzatuvi',
    'Moliyaviy tahlil va hisobotlar',
    'Savdo voronkasi (Sales Funnel)',
    'Bonus va jarima tizimi',
    'Premium dark dizayn',
  ],
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NurSeles',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'O\'zbekistonda zamonaviy CRM va sotuv boshqaruv platformasi',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'UZ',
    addressRegion: 'Toshkent',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Uzbek', 'Russian'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
