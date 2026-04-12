document.addEventListener('DOMContentLoaded', () => {
  const toolbar = document.querySelector('[data-record-filter]');
  const select = document.querySelector('#records-rating-filter');

  if (!toolbar || !select) {
    return;
  }

  const items = Array.from(document.querySelectorAll('[data-record-item]'));

  const applyFilter = () => {
    const activeRating = select.value;

    items.forEach((item) => {
      const itemRating = item.getAttribute('data-rating') || '';
      const shouldShow = !activeRating || itemRating === activeRating;
      item.hidden = !shouldShow;
    });
  };

  select.addEventListener('change', applyFilter);
  applyFilter();
});
