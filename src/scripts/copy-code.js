(() => {
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
      label.textContent = copied ? '已复制' : '手动复制';
      status.textContent = copied ? '源码已复制到剪贴板' : '自动复制未成功，已选中源码，请手动复制。';
      if (!copied) {
        const range = document.createRange();
        range.selectNodeContents(code);
        code.closest('pre')?.focus({ preventScroll: true });
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      resetTimer = setTimeout(() => {
        label.textContent = '复制';
        delete button.dataset.state;
        status.textContent = '';
      }, copied ? 2200 : 6000);
    });
  }
})();
