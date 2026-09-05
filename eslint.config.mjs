import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ignores:['dist/**','.cache/**','node_modules/**','public/**']},js.configs.recommended,...ts.configs.recommended,{files:['src/**/*.{ts,tsx}','tests/**/*.ts','scripts/**/*.ts','vite.config.ts'],rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}],'no-empty':['error',{allowEmptyCatch:true}]}});
