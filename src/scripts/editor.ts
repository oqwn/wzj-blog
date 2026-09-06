import { GitHubEditor } from '../lib/editor/github.mjs';
import { articlePath, newArticle, newArticlePath, parseArticle } from '../lib/editor/document.mjs';
import { previewDocument, escapeHTML } from '../lib/editor/preview.mjs';

function startEditor() {
  const root = document.querySelector<HTMLElement>('#editor-app')!;
  if (window.top !== window.self) {
    root.textContent = '请在独立页面打开写作页面。';
    return;
  }
  const client = new GitHubEditor();
  const source = document.querySelector<HTMLTextAreaElement>('#markdown-source')!;
  const preview = document.querySelector<HTMLIFrameElement>('#markdown-preview')!;
  const tokenInput = document.querySelector<HTMLInputElement>('#github-token')!;
  const connectForm = document.querySelector<HTMLFormElement>('#connect-form')!;
  const connectButton = document.querySelector<HTMLButtonElement>('#connect-button')!;
  const connectionPanel = document.querySelector<HTMLDetailsElement>('#connection')!;
  const connectionStatus = document.querySelector<HTMLElement>('#connection-status')!;
  const disconnectButton = document.querySelector<HTMLButtonElement>('#disconnect')!;
  const selector = document.querySelector<HTMLSelectElement>('#post-select')!;
  const filename = document.querySelector<HTMLInputElement>('#post-name')!;
  const location = document.querySelector<HTMLElement>('#file-location')!;
  const newButton = document.querySelector<HTMLButtonElement>('#new-post')!;
  const reloadButton = document.querySelector<HTMLButtonElement>('#reload-post')!;
  const saveButton = document.querySelector<HTMLButtonElement>('#save-post')!;
  const downloadButton = document.querySelector<HTMLButtonElement>('#download-post')!;
  const deployLink = document.querySelector<HTMLAnchorElement>('#deploy-status')!;
  const status = document.querySelector<HTMLElement>('#editor-status')!;
  let path = '';
  let sha: string | undefined;
  let baseline = '';
  let baselineName = '';
  let busy = false;
  let previewTimer: ReturnType<typeof setTimeout>;
  let sessionGeneration = 0;

  function dirty() { return source.value !== baseline || filename.value !== baselineName; }
  function message(text: string, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }
  function syncControls() {
    source.disabled = busy;
    selector.disabled = busy;
    filename.disabled = busy || Boolean(path);
    for (const button of [connectButton, disconnectButton, newButton, downloadButton]) button.disabled = busy;
    tokenInput.disabled = busy;
    reloadButton.disabled = busy || !path;
    saveButton.disabled = busy || !client.connected;
    disconnectButton.hidden = !client.connected;
    connectionStatus.textContent = client.connected ? '已连接 oqwn' : '未连接 GitHub';
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    busy = true;
    syncControls();
    try { await action(); } catch (error) { message(error instanceof Error ? error.message : '操作未完成，请保留当前内容后重试。', true); }
    finally { busy = false; syncControls(); }
  }
  function renderPreview() {
    try { preview.srcdoc = previewDocument(source.value, path || 'content/posts/new.md'); }
    catch (error) {
      const text = error instanceof Error ? error.message : '暂时无法预览。';
      preview.srcdoc = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'"><p>${escapeHTML(text)}</p>`;
    }
  }
  function remember() { baseline = source.value; baselineName = filename.value; }
  function mayReplace() { return !dirty() || window.confirm('当前修改还没有保存。放弃修改并切换文章？'); }
  function updateURL() {
    const url = new URL(window.location.href);
    if (path) url.searchParams.set('file', path); else url.searchParams.delete('file');
    history.replaceState(null, '', url);
  }
  function addOption(value: string) {
    if (![...selector.options].some((option) => option.value === value)) selector.add(new Option(value.slice('content/posts/'.length), value));
  }
  function reset() {
    path = '';
    sha = undefined;
    source.value = newArticle();
    filename.value = '';
    location.textContent = '.md';
    selector.value = '';
    deployLink.hidden = true;
    remember();
    renderPreview();
    updateURL();
    syncControls();
  }
  async function listArticles() {
    const paths = await client.list();
    selector.replaceChildren(new Option('新文章', ''));
    paths.forEach(addOption);
    if (path) { addOption(path); selector.value = path; }
  }
  async function loadArticle(value: string) {
    const post = await client.load(value);
    path = post.path;
    sha = post.sha;
    source.value = post.source;
    filename.value = path.slice('content/posts/'.length, -3);
    location.textContent = '.md';
    addOption(path);
    selector.value = path;
    deployLink.hidden = true;
    remember();
    renderPreview();
    updateURL();
    message('已载入 GitHub 最新版本。');
  }

  connectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const generation = sessionGeneration;
    let candidate = tokenInput.value;
    tokenInput.value = '';
    void perform(async () => {
      try { await client.connect(candidate); } finally { candidate = ''; }
      if (generation !== sessionGeneration) { client.disconnect(); return; }
      connectionPanel.open = false;
      message('GitHub 已连接，可以保存文章。');
      await listArticles();
    });
  });
  disconnectButton.addEventListener('click', () => {
    sessionGeneration++;
    client.disconnect();
    tokenInput.value = '';
    connectionPanel.open = true;
    syncControls();
    message('已清除本页面的授权，编辑内容仍保留。');
  });
  source.addEventListener('input', () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 200);
    deployLink.hidden = true;
    message('有尚未保存的修改。');
  });
  filename.addEventListener('input', () => { message('有尚未保存的修改。'); deployLink.hidden = true; });
  selector.addEventListener('change', () => {
    const value = selector.value;
    if (!mayReplace()) { selector.value = path; return; }
    if (!value) { reset(); return; }
    void perform(async () => {
      try { await loadArticle(value); } catch (error) { selector.value = path; throw error; }
    });
  });
  newButton.addEventListener('click', () => { if (mayReplace()) { reset(); filename.focus(); } });
  reloadButton.addEventListener('click', () => { if (mayReplace()) void perform(() => loadArticle(path)); });
  saveButton.addEventListener('click', () => {
    void perform(async () => {
      const savePath = path || newArticlePath(filename.value.trim());
      const savingSource = source.value;
      const { data } = parseArticle(savingSource);
      message('正在保存，请稍候。');
      const result = await client.save(savePath, savingSource, sha);
      path = savePath;
      sha = result.sha;
      filename.value = path.slice('content/posts/'.length, -3);
      addOption(path);
      selector.value = path;
      remember();
      updateURL();
      deployLink.hidden = false;
      message(data.draft ? '草稿已保存到公开仓库，网站不会展示。' : '文章已提交到 GitHub，自动构建成功后网站会更新。');
    });
  });
  downloadButton.addEventListener('click', () => {
    const file = path ? path.split('/').pop()! : `${filename.value.replace(/[^a-z0-9-]/g, '') || 'article'}.md`;
    const url = URL.createObjectURL(new Blob([source.value], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('beforeunload', (event) => { if (dirty()) event.preventDefault(); });
  window.addEventListener('pagehide', () => { sessionGeneration++; client.disconnect(); tokenInput.value = ''; });
  window.addEventListener('pageshow', () => { syncControls(); if (!client.connected) connectionPanel.open = true; });

  const initialFile = new URL(window.location.href).searchParams.get('file');
  reset();
  void perform(async () => {
    if (initialFile) await loadArticle(articlePath(initialFile));
    await listArticles();
  });
}

startEditor();
