// Live editing: rebuilds the plugin when a source of its colors is saved, and keeps this folder
// loaded in the running Orca as a development plugin, which stands in for the installed copy
// and reloads on each build. Ctrl-C unloads the folder, and the installed copy is back.

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const build = resolve(root, 'scripts/build-theme.mjs')

function run(command, args) {
  return spawn(command, args, { cwd: root, stdio: 'inherit' })
}

// node --watch follows what the build imports: src/, and the two theme files it is pointed at
const builder = run(process.execPath, [
  '--watch',
  '--watch-preserve-output',
  '--experimental-strip-types',
  '--disable-warning=ExperimentalWarning',
  build,
  ...process.argv.slice(2),
])
const orca = run('orca', ['plugin', 'dev', 'watch', root])

// Ctrl-C reaches both. Orca's watcher unloads the folder before it exits, so wait for it.
process.on('SIGINT', () => {})
process.on('SIGTERM', () => orca.kill('SIGINT'))
orca.on('exit', (code) => {
  builder.kill()
  process.exit(code ?? 0)
})
builder.on('exit', () => orca.kill('SIGINT'))
