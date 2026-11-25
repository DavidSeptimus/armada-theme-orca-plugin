// Cuts a release: commits the files the plugin ships to `main` and tags that commit.
// `main` holds only those files, because Orca's directory reads every file at the tag.
// Nothing is pushed.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SHIPPED = ['orca-plugin.json', 'themes', 'terminal', 'screenshots', 'LICENSE', 'CHANGELOG.md']
// Pictures of settings pages, in either theme's folder. They are for comparing the two themes
// while working on them; neither the plugin's page nor the release's readme shows them.
const NOT_SHIPPED = /^screenshots\/(?:[^/]+\/)*settings-[^/]*\.png$/
// The readme of the release branch is for people who use the theme. This branch's is about the build.
const RELEASE_README = 'README.main.md'
const SOURCE_BRANCH = 'develop'
const RELEASE_BRANCH = 'main'

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options }).trim()
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
if (branch !== SOURCE_BRANCH) fail(`Release from ${SOURCE_BRANCH}, not ${branch}.`)
if (git(['status', '--porcelain'])) fail('Commit or stash your changes first.')

const { name, version } = JSON.parse(readFileSync('orca-plugin.json', 'utf8'))
const tag = `v${version}`
if (git(['tag', '--list', tag])) fail(`${tag} already exists. Raise the version in package.json and rebuild.`)

const work = mkdtempSync(join(tmpdir(), 'armada-release-'))
try {
  const env = { ...process.env, GIT_INDEX_FILE: join(work, 'index') }
  const readme = git(['ls-tree', 'HEAD', '--', RELEASE_README]).replace(RELEASE_README, 'README.md')
  if (!readme) fail(`${RELEASE_README} is missing.`)
  // A line of ls-tree is `<mode> <type> <object>\t<path>`
  const shipped = git(['ls-tree', '-r', 'HEAD', '--', ...SHIPPED])
    .split('\n')
    .filter((line) => !NOT_SHIPPED.test(line.slice(line.indexOf('\t') + 1)))
    .join('\n')
  // A picture the plugin's page or the release's readme shows must be in the release
  const manifest = JSON.parse(readFileSync('orca-plugin.json', 'utf8'))
  const shown = [
    manifest.cover?.path,
    ...(manifest.screenshots ?? []).map((picture) => picture.path),
    ...[...readFileSync(RELEASE_README, 'utf8').matchAll(/\]\((screenshots\/[^)\s]+)\)/g)].map((link) => link[1]),
  ].filter(Boolean)
  const missing = shown.filter((path) => !shipped.split('\n').some((line) => line.endsWith(`\t${path}`)))
  if (missing.length > 0) fail(`The release would lack pictures that are shown: ${missing.join(', ')}`)
  const entries = `${shipped}\n${readme}`
  git(['update-index', '--add', '--index-info'], { env, input: `${entries}\n` })
  const tree = git(['write-tree'], { env })

  const parent = git(['rev-parse', '--verify', RELEASE_BRANCH])
  if (git(['rev-parse', `${parent}^{tree}`]) === tree) fail(`${RELEASE_BRANCH} already has these files.`)
  const commit = git(['commit-tree', tree, '-p', parent, '-m', `${name} ${version}`])

  const checkout = join(work, 'plugin')
  git(['worktree', 'add', '--detach', checkout, commit])
  try {
    execFileSync('orca', ['plugin', 'validate', checkout], { stdio: 'inherit' })
  } finally {
    git(['worktree', 'remove', '--force', checkout])
  }

  git(['update-ref', `refs/heads/${RELEASE_BRANCH}`, commit, parent])
  git(['tag', '-a', tag, '-m', tag, commit])
  console.log(`${RELEASE_BRANCH} is at ${commit.slice(0, 7)}, tagged ${tag}. To publish:`)
  console.log(`  git push origin ${SOURCE_BRANCH} ${RELEASE_BRANCH} ${tag}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
