(function () {
  const SCROLL_TOP_OFFSET = 24;
  const feedbackTimers = new WeakMap();

  let headings = [];
  let headingOffsets = [];
  let links = [];
  let activeId = null;
  let activeUpdateQueued = false;
  let offsetUpdateQueued = false;

  function visibleHeading(heading) {
    return !heading.closest('[hidden]');
  }

  function flashFeedback(target, className) {
    if (!target) return;

    const existingTimer = feedbackTimers.get(target);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    target.classList.remove(className);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        target.classList.add(className);
      });
    });

    const timer = window.setTimeout(() => {
      target.classList.remove(className);
      feedbackTimers.delete(target);
    }, 900);

    feedbackTimers.set(target, timer);
  }

  function buildList(list, includeSpan) {
    list.replaceChildren();

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1], 10);
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = '#' + heading.id;
      a.dataset.level = level;

      if (includeSpan) {
        const span = document.createElement('span');
        span.textContent = heading.textContent;
        a.appendChild(span);
      } else {
        a.textContent = heading.textContent;
      }

      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function collectHeadings() {
    headings = Array.from(document.querySelectorAll('main h2, main h3, main h4'))
      .filter(visibleHeading);

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = 'heading-' + index;
    });
  }

  function updateHeadingOffsets() {
    if (offsetUpdateQueued) return;
    offsetUpdateQueued = true;

    window.requestAnimationFrame(() => {
      offsetUpdateQueued = false;
      headingOffsets = headings.map((heading) => heading.offsetTop);
      queueSetActive();
    });
  }

  function setActive() {
    if (headings.length === 0) return;

    const tocList = document.getElementById('toc-list');
    const mid = window.scrollY + window.innerHeight * 0.3;
    let activeIndex = 0;

    for (let i = 0; i < headingOffsets.length; i += 1) {
      if (headingOffsets[i] <= mid) {
        activeIndex = i;
      } else {
        break;
      }
    }

    const active = headings[activeIndex];

    links.forEach((a) => {
      a.classList.toggle('toc-active', a.getAttribute('href') === '#' + active.id);
    });

    if (tocList && activeId !== active.id) {
      activeId = active.id;
      const activeLink = tocList.querySelector('.toc-active');
      if (activeLink) {
        activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }

  function queueSetActive() {
    if (activeUpdateQueued) return;
    activeUpdateQueued = true;
    window.requestAnimationFrame(() => {
      activeUpdateQueued = false;
      setActive();
    });
  }

  function scrollToHash(hash, link) {
    const targetId = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(targetId);
    if (!target) return;

    const targetTop = window.scrollY + target.getBoundingClientRect().top - SCROLL_TOP_OFFSET;
    const maxScrollTop = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
    const nextScrollTop = Math.min(Math.max(targetTop, 0), maxScrollTop);
    const currentScrollTop = window.scrollY;
    const canMove = Math.abs(nextScrollTop - currentScrollTop) > 2;

    window.scrollTo({ top: nextScrollTop, behavior: 'smooth' });

    if (!canMove) {
      flashFeedback(link, 'toc-feedback');
      flashFeedback(target, 'toc-feedback');
    }

    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash);
    }
  }

  function handleTocClick(event) {
    const link = event.target.closest('a');
    if (!link) return;

    event.preventDefault();
    scrollToHash(link.getAttribute('href'), link);
  }

  function refreshToc() {
    const toc = document.getElementById('toc');
    const tocList = document.getElementById('toc-list');
    const inlineToc = document.getElementById('toc-inline');
    const inlineList = document.getElementById('toc-inline-list');
    if (!toc || !tocList) return;

    collectHeadings();
    activeId = null;

    if (headings.length === 0) {
      toc.hidden = true;
      tocList.replaceChildren();
      if (inlineToc) inlineToc.hidden = true;
      if (inlineList) inlineList.replaceChildren();
      return;
    }

    buildList(tocList, true);
    if (inlineToc && inlineList) {
      buildList(inlineList, false);
      inlineToc.hidden = false;
    }

    links = Array.from(tocList.querySelectorAll('a'));
    headingOffsets = headings.map((heading) => heading.offsetTop);
    toc.hidden = false;
    queueSetActive();
    updateHeadingOffsets();
  }

  function initToc() {
    const tocList = document.getElementById('toc-list');
    const inlineList = document.getElementById('toc-inline-list');
    if (!tocList) return;

    tocList.addEventListener('click', handleTocClick);
    if (inlineList) inlineList.addEventListener('click', handleTocClick);

    window.addEventListener('resize', updateHeadingOffsets);
    window.addEventListener('load', updateHeadingOffsets, { once: true });
    window.addEventListener('scroll', queueSetActive, { passive: true });
    window.addEventListener('blog:languagechange', refreshToc);

    window.BlogToc = { refresh: refreshToc };
    refreshToc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToc, { once: true });
  } else {
    initToc();
  }
})();
