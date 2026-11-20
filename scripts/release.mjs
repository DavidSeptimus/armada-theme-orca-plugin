// Cuts a release: commits the files the plugin ships to `main` and tags that commit.
// `main` holds only those files, because Orca's directory reads every file at the tag.
// Nothing is pushed.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SHIPPED = ['orca-plugin.json', 'themes', 'terminal', 'screenshots', 'README.md', 'LICENSE']
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
  const entries = git(['ls-tree', '-r', 'HEAD', '--', ...SHIPPED])
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
