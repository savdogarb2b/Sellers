export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/superadmin/',
          '/employee/',
          '/login',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/login'],
        disallow: ['/api/', '/admin/', '/superadmin/', '/employee/'],
      },
    ],
    sitemap: 'https://nurseles.uz/sitemap.xml',
  };
}
