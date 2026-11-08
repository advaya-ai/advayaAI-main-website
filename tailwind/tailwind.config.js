// Tailwind build config for index.html (replaces the runtime CDN).
// Rebuild after changing classes in index.html:
//   npx tailwindcss@3.4.17 -c tailwind/tailwind.config.js -i tailwind/input.css -o assets/tailwind.css --minify
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        slate: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B',
                 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617' },
        brand: { blue: '#2563EB', blueDark: '#1D4ED8', navy: '#0F172A', emerald: '#059669', emeraldLight: '#ECFDF5' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
};
