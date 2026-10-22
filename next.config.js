/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "@react-pdf/renderer"],
    outputFileTracingIncludes: {
      "/api/admin/invoices/[id]/pdf": [
        "./node_modules/pdfkit/js/**/*",
        "./assets/fonts/**/*",
        "./public/**/*",
      ],
      "/api/invoices/[token]/pdf": [
        "./node_modules/pdfkit/js/**/*",
        "./assets/fonts/**/*",
        "./public/**/*",
      ],
    },
  },
};

module.exports = nextConfig;
