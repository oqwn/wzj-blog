(() => {
  const text = document.documentElement.lang.startsWith('en')
    ? { copy: 'Copy', copied: 'Copied', manual: 'Copy manually', copiedStatus: 'Source copied to clipboard', manualStatus: 'Automatic copy failed. The source is selected; copy it manually.' }
    : { copy: '复制', copied: '已复制', manual: '手动复制', copiedStatus: '源码已复制到剪贴板', manualStatus: '自动复制未成功，已选中源码，请手动复制。' };

  function copyWithSelection(text) {
    const selection = window.getSelection();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    const activeElement = document.activeElement;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.readOnly = true;
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px;';
    document.body.append(textarea);
    try {
      textarea.focus({ preventScroll: true });
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
      if (activeElement instanceof HTMLElement) activeElement.focus({ preventScroll: true });
      if (selection) {
        selection.removeAllRanges();
        for (const range of ranges) selection.addRange(range);
      }
    }
  }

  for (const block of document.querySelectorAll('.prose .code-block')) {
    const button = block.querySelector('.code-copy');
    const code = block.querySelector('pre code');
    const label = button?.querySelector('.copy-label');
    const status = block.querySelector('.copy-status');
    if (!(button instanceof HTMLButtonElement) || !code || !label || !status) continue;
    button.hidden = false;
    let resetTimer;
    button.addEventListener('click', async () => {
      clearTimeout(resetTimer);
      status.textContent = '';
      button.disabled = true;
      const text = code.textContent ?? '';
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch {
        // Older browsers and denied clipboard permissions can still allow a copy selection.
      }
      if (!copied) copied = copyWithSelection(text);
      button.disabled = false;
      button.dataset.state = copied ? 'copied' : 'manual';
      label.textContent = copied ? text.copied : text.manual;
      status.textContent = copied ? text.copiedStatus : text.manualStatus;
      if (!copied) {
        const range = document.createRange();
        range.selectNodeContents(code);
        code.closest('pre')?.focus({ preventScroll: true });
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      resetTimer = setTimeout(() => {
  const text = document.documentElement.lang.startsWith('en')
    ? { copy: 'Copy', copied: 'Copied', manual: 'Copy manually', copiedStatus: 'Source copied to clipboard', manualStatus: 'Automatic copy failed. The source is selected; copy it manually.' }
    : { copy: '复制', copied: '已复制', manual: '手动复制', copiedStatus: '源码已复制到剪贴板', manualStatus: '自动复制未成功，已选中源码，请手动复制。' };

        label.textContent = text.copy;
        delete button.dataset.state;
        status.textContent = '';
      }, copied ? 2200 : 6000);
    });
  }
})();
