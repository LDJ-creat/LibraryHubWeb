import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sns-webpic-qc.xhscdn.com',
        port: '',
        pathname: '/**',
      },
      { // 添加这个对象以允许 randomuser.me 的头像
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'data-isbn.oss-cn-hangzhou.aliyuncs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'libraryhub.oss-cn-guangzhou.aliyuncs.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
