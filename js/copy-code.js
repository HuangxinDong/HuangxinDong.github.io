document.addEventListener('DOMContentLoaded', (event) => {
  const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  const SUCCESS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const copyMarkup = (label) => `${COPY_ICON}<span class="visually-hidden">${label}</span>`;
  const successMarkup = (label) => `${SUCCESS_ICON}<span class="visually-hidden">${label}</span>`;

  document.querySelectorAll('pre').forEach((pre) => {
    // Determine the wrapper
    const wrapper = pre.parentElement.classList.contains('sourceCode') 
      ? pre.parentElement 
      : null;

    const container = document.createElement('div');
    container.className = 'code-block-container';
    
    if (wrapper) {
      wrapper.parentNode.insertBefore(container, wrapper);
      container.appendChild(wrapper);
    } else {
      pre.parentNode.insertBefore(container, pre);
      container.appendChild(pre);
    }

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('title', 'Copy code to clipboard');
    button.innerHTML = copyMarkup('Copy code to clipboard');

    const status = document.createElement('span');
    status.className = 'visually-hidden';
    status.setAttribute('aria-live', 'polite');

    container.appendChild(button);
    container.appendChild(status);

    button.addEventListener('click', () => {
      const code = pre.querySelector('code') || pre;
      const text = code.innerText;

      navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = successMarkup('Copied code to clipboard');
        button.classList.add('copied');
        button.setAttribute('aria-label', 'Copied code to clipboard');
        button.setAttribute('title', 'Copied code to clipboard');
        status.textContent = 'Code copied to clipboard.';
        
        setTimeout(() => {
          button.innerHTML = copyMarkup('Copy code to clipboard');
          button.classList.remove('copied');
          button.setAttribute('aria-label', 'Copy code to clipboard');
          button.setAttribute('title', 'Copy code to clipboard');
          status.textContent = '';
        }, 2000);
      }).catch(err => {
        status.textContent = 'Failed to copy code to clipboard.';
        console.error('Failed to copy: ', err);
      });
    });
  });
});
