#!/usr/bin/env node
/**
 * scripts/bundle-remotion.mjs
 *
 * Gera o bundle estático do Remotion e salva o caminho em .remotion-bundle.json.
 * Execute antes do deploy: npm run bundle-remotion
 *
 * REQUISITOS:
 *   npm install @remotion/bundler @remotion/cli
 *
 * O bundle é gerado em .remotion/bundle/ (não commitado — veja .gitignore).
 * Em produção (Railway/Fly.io), inclua este script no Dockerfile/build step.
 */

import { bundle } from '@remotion/bundler'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT      = resolve(__dirname, '..')

async function main() {
  const entryPoint = join(ROOT, 'remotion', 'Root.tsx')
  const outDir     = join(ROOT, '.remotion', 'bundle')

  console.log('⚙️  Bundling Remotion...')
  console.log('   Entry:', entryPoint)

  const bundlePath = await bundle({
    entryPoint,
    outDir,
    // Webpack overrides podem ser adicionados aqui se necessário
    webpackOverride: (config) => config,
  })

  const manifest = { bundlePath, builtAt: new Date().toISOString() }
  writeFileSync(join(ROOT, '.remotion-bundle.json'), JSON.stringify(manifest, null, 2))

  console.log('✅  Bundle gerado em:', bundlePath)
  console.log('   Manifest salvo em: .remotion-bundle.json')
}

main().catch((err) => {
  console.error('❌  Bundle falhou:', err.message ?? err)
  process.exit(1)
})
