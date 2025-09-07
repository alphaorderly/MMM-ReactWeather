/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './mmm-reactweather.js',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false // MagicMirror 환경의 global CSS 리셋과 충돌 방지
  },
  plugins: []
};
