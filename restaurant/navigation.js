(() => {
  const header = document.querySelector('.navbar');
  if (!header) return;

  const toggle = header.querySelector('.menu-toggle');
  const panel = header.querySelector('.nav-panel');
  if (!toggle || !panel) return;

  // Keep this breakpoint aligned with the mobile navigation rule in responsive.css.
  const mobile = window.matchMedia('(max-width: 1023px)');
  let focusedControl = null;

  // CSS may hide and blur a control before the matchMedia callback runs.
  document.addEventListener('focusin', event => {
    focusedControl = header.contains(event.target) ? event.target : null;
  });

  function setOpen(open, restoreFocus = false) {
    const expanded = mobile.matches && open;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Close navigation menu' : 'Open navigation menu');
    header.classList.toggle('is-open', expanded);
    panel.hidden = mobile.matches && !expanded;
    if (expanded) panel.scrollTop = 0;
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  panel.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false, mobile.matches);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setOpen(false, true);
    }
  });

  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) {
      focusedControl = null;
      if (toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    }
  });

  mobile.addEventListener('change', () => {
    const focusedElement = document.activeElement === document.body ? focusedControl : document.activeElement;
    setOpen(false);
    if (mobile.matches && panel.contains(focusedElement)) toggle.focus({ preventScroll: true });
    if (!mobile.matches && focusedElement === toggle) panel.querySelector('a').focus({ preventScroll: true });
  });

  header.classList.add('nav-ready');
  setOpen(false);
})();
