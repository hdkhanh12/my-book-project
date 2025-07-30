/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'books.google.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080', // Chỉ định port của backend
        pathname: '/images/**', // Cho phép tất cả các ảnh trong thư mục images
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }, 
    ],
  },
};

export default nextConfig;
