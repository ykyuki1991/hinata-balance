import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['fallback.svg','icon-192.png','icon-512.png'],manifest:{name:'ひなたバランス',short_name:'ひなたバランス',description:'全員積めるか？',theme_color:'#edf9ff',background_color:'#edf9ff',display:'standalone',orientation:'portrait',start_url:'/',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,png,svg,webp}'],maximumFileSizeToCacheInBytes:4000000}})]});
