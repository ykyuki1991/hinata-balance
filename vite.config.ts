import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import {readFileSync} from 'node:fs';
const version=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
const base=process.env.VITE_BASE_PATH||'/';
export default defineConfig({base,define:{__APP_VERSION__:JSON.stringify(version)},plugins:[react(),VitePWA({injectRegister:false,registerType:'prompt',includeAssets:['fallback.svg','icon-192.png','icon-512.png'],manifest:{lang:'ja',id:base,name:'ひなたバランス',short_name:'ひなたバランス',description:'全員積めるか？',theme_color:'#edf9ff',background_color:'#edf9ff',display:'standalone',orientation:'portrait',start_url:base,scope:base,icons:[{src:`${base}icon-192.png`,sizes:'192x192',type:'image/png'},{src:`${base}icon-512.png`,sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{navigateFallbackDenylist:[/\/shonin-defense(?:\/|$)/],cleanupOutdatedCaches:true,clientsClaim:true,globPatterns:['**/*.{js,css,html,png,svg,webp}'],maximumFileSizeToCacheInBytes:4000000}})]});
