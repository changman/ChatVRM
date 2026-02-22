const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.BASE_PATH || "",
  basePath: process.env.BASE_PATH || "",
  trailingSlash: true,
  publicRuntimeConfig: {
    root: process.env.BASE_PATH || "",
  },
  optimizeFonts: false,
  i18n,

  // onnxruntime-web의 동적 require로 인한 Critical dependency 경고 억제
  // 해당 라이브러리는 브라우저 환경에서 정상 동작하므로 경고를 무시해도 안전합니다.
  webpack: (config, { isServer }) => {
    // 서버 사이드에서 onnxruntime-web 관련 모듈 제외
    if (isServer) {
      config.externals = [...(config.externals || []), 'onnxruntime-web'];
    }

    // onnxruntime-web의 동적 require 경고를 무시하는 규칙 추가
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/onnxruntime-web/,
        message: /Critical dependency/,
      },
    ];

    // .wasm 파일을 정적 리소스로 처리
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = nextConfig;
