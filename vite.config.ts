import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Apply neutral branding only to the separate demo build.
function demoBranding() {
  const enabled = process.env.VITE_DEMO_MODE === 'true'
  return {
    name: 'demo-branding',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (enabled && (id.endsWith('/companyLogo.png') || id.endsWith('/first_page_image.png'))) return path.resolve(__dirname, 'src/assets/demoLogo.png')
    },
    transform(source: string, id: string) {
      if (!enabled || !id.includes('/src/') || !/\.[jt]sx?$/.test(id)) return null
      return source.replace(/nova nest/gi, 'Estate CRM Demo').replace(/\bNova\b/g, 'Estate').replace(/\bNest\b/g, 'Demo')
    },
  }
}

export default defineConfig({
  plugins: [
    demoBranding(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
