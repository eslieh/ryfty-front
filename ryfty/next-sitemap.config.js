/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://ryfty.net', // replace with your actual domain
    generateRobotsTxt: true,      // (optional) generates robots.txt too
    sitemapSize: 7000,
    exclude: ['/404'],            // exclude error or admin routes if any
  };
  