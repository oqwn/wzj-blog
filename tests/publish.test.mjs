import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createPost } from '../scripts/lib/post-writer.mjs';
import { publishPost } from '../scripts/lib/publisher.mjs';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

// A clone of a local bare "origin", with one unrelated change staged and one unstaged.
async function repository(t) {
  const directory = await mkdtemp(join(tmpdir(), 'wzj-blog-publish-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const origin = join(directory, 'origin.git');
  const repo = join(directory, 'repo');
  git(directory, 'init', '--quiet', '--bare', '--initial-branch=main', origin);
  git(directory, 'clone', '--quiet', origin, repo);
  git(repo, 'config', 'user.name', 'Test');
  git(repo, 'config', 'user.email', 'test@example.com');
  await writeFile(join(repo, 'README.md'), 'readme\n');
  git(repo, 'add', 'README.md');
  git(repo, 'commit', '--quiet', '-m', 'init');
  git(repo, 'push', '--quiet', 'origin', 'main');
  const root = join(repo, 'content/posts');
  await createPost({
    root, slug: 'rates', category: 'finance',
    zh: { title: '利率', body: '## 一\n\n正文' }, en: { title: 'Rates', body: '## One\n\nBody' },
  });
  await writeFile(join(repo, 'README.md'), 'staged work in progress\n');
  git(repo, 'add', 'README.md');
  await writeFile(join(repo, 'notes.txt'), 'unstaged\n');
  return { origin, repo, root };
}

test('publishing commits and pushes only the two post files, with draft turned off', async (t) => {
  const { origin, repo, root } = await repository(t);
  const { commit, paths } = await publishPost({ repo, root, slug: 'rates', validate: async () => {} });
  assert.deepEqual(paths, ['content/posts/zh/rates.md', 'content/posts/en/rates.md']);
  assert.equal(git(origin, 'rev-parse', '--short', 'main'), commit);
  assert.deepEqual(git(origin, 'show', '--name-only', '--format=', 'main').split('\n').sort(), [...paths].sort());
  for (const path of paths) assert.match(git(origin, 'show', `main:${path}`), /^draft: false$/m);
  // Other work stays exactly where it was.
  assert.equal(git(origin, 'show', 'main:README.md'), 'readme');
  assert.match(git(repo, 'status', '--short'), /^M  README\.md$/m);
  assert.match(git(repo, 'status', '--short'), /^\?\? notes\.txt$/m);
});

test('a failed build check restores the drafts and commits nothing', async (t) => {
  const { origin, repo, root } = await repository(t);
  const before = await readFile(join(root, 'zh/rates.md'), 'utf8');
  await assert.rejects(publishPost({ repo, root, slug: 'rates', validate: async () => { throw new Error('build failed'); } }), /build failed/);
  assert.equal(await readFile(join(root, 'zh/rates.md'), 'utf8'), before);
  assert.equal(git(origin, 'rev-list', '--count', 'main'), '1');
});

test('publishing refuses missing translations and other branches', async (t) => {
  const { repo, root } = await repository(t);
  await rm(join(root, 'en/rates.md'));
  await assert.rejects(publishPost({ repo, root, slug: 'rates', validate: async () => {} }), /中英文两份都存在/);
  await createPost({ root, slug: 'other', category: 'finance', zh: { title: 'a', body: 'b' }, en: { title: 'a', body: 'b' } });
  git(repo, 'switch', '--quiet', '-c', 'feature');
  await assert.rejects(publishPost({ repo, root, slug: 'other', validate: async () => {} }), /只有 main 会部署/);
});
