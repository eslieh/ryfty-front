/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://ryfty.net', // replace with your actual domain
    generateRobotsTxt: true,      // (optional) generates robots.txt too
    sitemapSize: 7000,
    exclude: ['/404', '/checkin/auth'], // exclude error or admin routes if any
    additionalPaths: async (config) => [
      await config.transform(config, '/host-experience'),
      await config.transform(config, '/host-experience/pricing'),
      await config.transform(config, '/auth'),
      await config.transform(config, '/checkin'),
      await config.transform(config, '/provider'),
      await config.transform(config, '/profile'),
      await config.transform(config, '/reservations'),
      await config.transform(config, '/terms-of-use'),
      await config.transform(config, '/privacy-policy'),
    ],
    robotsTxtOptions: {
      policies: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/checkin/auth', '/api/'],
        },
      ],
      additionalSitemaps: [
        'https://ryfty.net/sitemap.xml',
      ],
    },
  };
  