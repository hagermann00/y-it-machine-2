import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split providers into separate chunks - only loaded on demand
            if (id.includes('GeminiProvider.ts')) {
              return 'provider-gemini';
            }
            if (id.includes('AnthropicProvider.ts')) {
              return 'provider-anthropic';
            }
            if (id.includes('OpenAIProvider.ts')) {
              return 'provider-openai';
            }
            // Split PDF export utilities
            if (id.includes('pdfExport.ts')) {
              return 'pdf-export';
            }
            // Split vendor LLM libraries
            if (id.includes('node_modules/openai')) {
              return 'vendor-openai';
            }
            if (id.includes('node_modules/@anthropic-ai/sdk')) {
              return 'vendor-anthropic';
            }
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-gemini';
            }
            // Split Recharts with its dependencies
            if (id.includes('node_modules/recharts')) {
              return 'vendor-recharts';
            }
            // Keep React and related in vendor
            if (id.includes('node_modules/react')) {
              return 'vendor-react';
            }
            // jsPDF and related
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
              return 'pdf-deps';
            }
          }
        }
      },
      // Increase chunk size warnings threshold since we're optimizing
      chunkSizeWarningLimit: 1000
    }
  };
});
