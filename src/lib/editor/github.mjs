import { articlePath, parseArticle, encodeContent, decodeContent } from './document.mjs';

const API = 'https://api.github.com';
const REPOSITORY = '/repos/oqwn/wzj-blog';
const OWNER_ID = 81278910;

export class GitHubError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export class GitHubEditor {
  #token = '';
  #fetch;
  #saving = false;

  constructor(fetcher = globalThis.fetch.bind(globalThis)) { this.#fetch = fetcher; }
  get connected() { return Boolean(this.#token); }
  disconnect() { this.#token = ''; }

  async #request(path, options = {}, token = this.#token) {
    let response;
    try {
      response = await this.#fetch(`${API}${path}`, {
        ...options,
        redirect: 'error',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
    } catch {
      throw new GitHubError(options.method === 'PUT' ? '保存结果未确认。请先查看 GitHub 提交记录，保留当前内容，避免重复保存。' : '无法连接 GitHub，请检查网络后重试。');
    }
    if (!response.ok) {
      const messages = {
        401: 'GitHub 授权已失效，请重新连接。',
        403: 'GitHub 拒绝请求。请检查令牌的仓库 Contents 写权限或 API 额度。',
        404: '未找到文章或仓库，或令牌没有访问权限。',
        409: '远端文章已变化，本次没有覆盖。请下载当前内容后，重新载入远端版本再合并。',
        422: 'GitHub 未接受保存。文件可能已存在，或仓库规则要求通过 Pull Request 修改。',
      };
      if (response.status === 401) this.disconnect();
      throw new GitHubError(messages[response.status] || `GitHub 请求失败（${response.status}）。请保留当前内容并查看提交记录。`, response.status);
    }
    return response.json();
  }

  async connect(candidate) {
    this.disconnect();
    const token = candidate.trim();
    if (!token) throw new Error('请填写 GitHub 写入令牌。');
    const user = await this.#request('/user', {}, token);
    if (user.id !== OWNER_ID) throw new Error('此编辑器仅供温智钧的 GitHub 账号 oqwn 使用。');
    const repo = await this.#request(REPOSITORY, {}, token);
    if (repo.owner?.id !== OWNER_ID || !repo.permissions?.push) throw new Error('当前账号没有这个仓库的写权限。');
    this.#token = token;
    return user.login;
  }

  async list() {
    const result = await this.#request(`${REPOSITORY}/git/trees/main?recursive=1`);
    if (result.truncated) throw new Error('仓库文件较多，请从文章页的“编辑”入口打开指定文章。');
    return result.tree.filter((entry) => entry.type === 'blob' && entry.mode === '100644' && entry.path.startsWith('content/posts/') && entry.path.endsWith('.md')).map((entry) => entry.path).sort();
  }

  async load(path) {
    path = articlePath(path);
    const result = await this.#request(`${REPOSITORY}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=main`);
    if (result.type !== 'file' || result.encoding !== 'base64' || result.size > 500_000) throw new Error('无法在网页中编辑该文件，请使用本地编辑器。');
    return { path, sha: result.sha, source: decodeContent(result.content) };
  }

  async save(path, source, sha) {
    if (!this.connected) throw new Error('请先连接作者的 GitHub 账号。');
    if (this.#saving) throw new Error('正在保存，请稍候。');
    path = articlePath(path);
    const { data } = parseArticle(source);
    if (sha !== undefined && !/^[a-f0-9]{40}$/.test(sha)) throw new Error('文章版本无效，请重新载入。');
    this.#saving = true;
    try {
      const result = await this.#request(`${REPOSITORY}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `docs: ${sha ? 'update' : 'add'} ${data.title}`,
          branch: 'main', content: encodeContent(source), ...(sha ? { sha } : {}),
        }),
      });
      return { sha: result.content.sha, commit: result.commit.sha };
    } finally { this.#saving = false; }
  }
}
