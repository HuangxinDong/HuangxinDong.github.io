(function () {
  function initToc() {
    const SCROLL_TOP_OFFSET = 24;
    const feedbackTimers = new WeakMap();
    const toc = document.getElementById('toc');
    const tocList = document.getElementById('toc-list');
    if (!toc || !tocList) return;

    const headings = Array.from(
      document.querySelectorAll('main h2, main h3, main h4')
    );
    if (headings.length === 0) return;

    tocList.replaceChildren();

    // Give every heading an id if it doesn't have one.
    headings.forEach((h, i) => {
      if (!h.id) h.id = 'heading-' + i;
    });

    headings.forEach((h) => {
      const level = parseInt(h.tagName[1], 10);
      const li = document.createElement('li');
      const a = document.createElement('a');
      const span = document.createElement('span');

      a.href = '#' + h.id;
      a.dataset.level = level;
      span.textContent = h.textContent;
      a.appendChild(span);
      li.appendChild(a);
      tocList.appendChild(li);
    });

    const links = Array.from(tocList.querySelectorAll('a'));
    let activeId = null;
    let headingOffsets = [];
    let activeUpdateQueued = false;

    function flashFeedback(target, className) {
      if (!target) return;

      const existingTimer = feedbackTimers.get(target);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      // Re-apply feedback class on next paint without forcing a layout read.
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

    function updateHeadingOffsets() {
      headingOffsets = headings.map((h) => h.offsetTop);
    }

    function setActive() {
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

      if (activeId !== active.id) {
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

    updateHeadingOffsets();
    window.addEventListener('resize', () => {
      updateHeadingOffsets();
      queueSetActive();
    });
    window.addEventListener('load', updateHeadingOffsets, { once: true });
    window.addEventListener('scroll', queueSetActive, { passive: true });
    setActive();

    tocList.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();

      const hash = a.getAttribute('href');
      const targetId = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(targetId);
      if (!target) return;

      const targetTop = window.scrollY + target.getBoundingClientRect().top - SCROLL_TOP_OFFSET;
      const maxScrollTop = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      const nextScrollTop = Math.min(Math.max(targetTop, 0), maxScrollTop);
      const currentScrollTop = window.scrollY;
      const canMove = Math.abs(nextScrollTop - currentScrollTop) > 2;

      window.scrollTo({ top: nextScrollTop, behavior: 'smooth' });

      if (!canMove) {
        flashFeedback(a, 'toc-feedback');
        flashFeedback(target, 'toc-feedback');
      }

      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
      }
    });

    toc.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToc, { once: true });
  } else {
    initToc();
  }
})();
