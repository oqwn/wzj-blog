import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir, rm, stat, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { languages, slugPattern, PostError } from './post-writer.mjs';

const run = promisify(execFile);
// Never wait on a credential prompt nobody can answer.
const gitEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

async function git(repo, args) {
  try {
    const { stdout } = await run('git', args, { cwd: repo, env: gitEnv, maxBuffer: 10 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    throw new PostError(`git ${args[0]} 失败：${(error.stderr || error.message).trim()}`);
  }
}

/** Build the site into a scratch directory and run the link, feed and draft checks. */
export async function buildCheck(repo) {
  const outDir = await mkdtemp(join(tmpdir(), 'wzj-blog-publish-'));
  try {
    const options = { cwd: repo, env: { ...process.env, BUILD_DIR: outDir }, maxBuffer: 50 * 1024 * 1024 };
    await run(process.execPath, [join(repo, 'node_modules/astro/bin/astro.mjs'), 'build', '--outDir', outDir], options);
    await run(process.execPath, [join(repo, 'scripts/check-build.mjs')], options);
  } catch (error) {
    const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n');
    throw new PostError(`构建检查未通过，文章未发布：\n${output || error.message}`);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}

// Serialize publishes that share this repo, e.g. two terminals at once.
async function withLock(repo, action) {
  const lock = join(repo, '.git', 'wzj-blog-publish.lock');
  for (let attempt = 0; ; attempt += 1) {
    try {
      await mkdir(lock);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const age = Date.now() - (await stat(lock).catch(() => ({ mtimeMs: Date.now() }))).mtimeMs;
      if (age > 10 * 60_000) await rm(lock, { recursive: true, force: true });
      else if (attempt > 120) throw new PostError('另一篇文章正在发布，请稍后重试。');
      else await new Promise((done) => setTimeout(done, 1000));
    }
  }
  try {
    return await action();
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

/**
 * Publish one post: set draft to false in both language versions, check the
 * build, commit only those two files and push them to main. Other local
 * changes, staged or not, are left out of the commit.
 */
export function publishPost({ repo, root, slug, branch = 'main', remote = 'origin', validate = buildCheck }) {
  if (!slugPattern.test(slug ?? '')) throw new PostError('文件名只能使用小写英文字母、数字和连字符。');
  return withLock(repo, async () => {
    const files = languages.map((lang) => resolve(root, lang, `${slug}.md`));
    const paths = files.map((file) => relative(repo, file));
    const originals = [];
    for (const [index, file] of files.entries()) {
      const content = await readFile(file, 'utf8').catch(() => {
        throw new PostError(`缺少 ${paths[index]}：中英文两份都存在才能发布。`);
      });
      if (!/^draft: (?:true|false)\s*$/m.test(content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '')) {
        throw new PostError(`${paths[index]} 的 frontmatter 中没有 draft 字段。`);
      }
      originals.push(content);
    }

    const current = await git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (current !== branch) throw new PostError(`仓库当前在 ${current} 分支，只有 ${branch} 会部署。请先切回 ${branch}。`);
    await git(repo, ['fetch', '--quiet', remote, branch]);
    if (await git(repo, ['rev-list', '--count', `HEAD..${remote}/${branch}`]) !== '0') {
      await git(repo, ['merge', '--ff-only', '--quiet', `${remote}/${branch}`]);
    }

    const published = originals.map((content) => content.replace(/^draft: true\s*$/m, 'draft: false'));
    await Promise.all(files.map((file, index) => writeFile(file, published[index])));
    try {
      await validate(repo);
    } catch (error) {
      await Promise.all(files.map((file, index) => writeFile(file, originals[index])));
      throw error;
    }

    const title = originals[0].match(/^title: (.*)$/m)?.[1] ?? slug;
    // A pathspec commit records only these files, whatever else is staged.
    await git(repo, ['add', '--', ...paths]);
    if (await git(repo, ['diff', '--cached', '--name-only', 'HEAD', '--', ...paths]) === '') {
      throw new PostError('这篇文章已经发布，线上内容与本地一致，无需重复提交。');
    }
    await git(repo, ['commit', '--quiet', '-m', `content: publish ${slug}`, '-m', `Title: ${title}`, '--', ...paths]);
    const commit = await git(repo, ['rev-parse', '--short', 'HEAD']);
    try {
      await git(repo, ['push', '--quiet', remote, `HEAD:${branch}`]);
    } catch (error) {
      throw new PostError(`已在本地提交 ${commit}，但推送失败，线上尚未更新：${error.message}`);
    }
    return { commit, paths };
  });
}
