document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.querySelector('.menu-toggle');

  if (!sidebar || !menuToggle) {
    return;
  }

  const mobileBreakpoint = window.matchMedia('(max-width: 850px)');

  const setMenuOpen = (isOpen) => {
    sidebar.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu'
    );
  };

  setMenuOpen(false);

  menuToggle.addEventListener('click', () => {
    setMenuOpen(!sidebar.classList.contains('is-open'));
  });

  sidebar.querySelectorAll('.sidebar-panel a').forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileBreakpoint.matches) {
        setMenuOpen(false);
      }
    });
  });

  mobileBreakpoint.addEventListener('change', (event) => {
    if (!event.matches) {
      setMenuOpen(false);
    }
  });
});
