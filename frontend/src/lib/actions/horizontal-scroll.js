let sequence = 0;

// Enhance the existing viewport without moving tables, fields or their handlers.
export function horizontalScroll(node, labels) {
  const previous = Object.fromEntries(['tabindex', 'role', 'aria-label', 'aria-describedby'].map(name => [name, node.getAttribute(name)]));
  const cue = document.createElement('div');
  cue.className = 'scroll-cue';
  cue.id = `bigwash-scroll-${++sequence}`;
  const text = document.createElement('span');
  const back = document.createElement('button');
  const next = document.createElement('button');
  back.type = next.type = 'button';
  back.textContent = '←';
  next.textContent = '→';
  cue.append(text, back, next);
  node.after(cue);
  node.classList.add('horizontal-scroll');
  let frame;

  function measure() {
    const overflow = node.scrollWidth > node.clientWidth + 1;
    cue.hidden = !overflow;
    node.dataset.scrollable = String(overflow);
    back.disabled = node.scrollLeft <= 1;
    next.disabled = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
    if (overflow) {
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'region');
      node.setAttribute('aria-label', labels.hint);
      node.setAttribute('aria-describedby', cue.id);
    } else restoreAttributes();
  }
  function restoreAttributes() {
    for (const [name, value] of Object.entries(previous)) {
      if (value === null) node.removeAttribute(name);
      else node.setAttribute(name, value);
    }
  }
  function update(value) {
    labels = value;
    text.textContent = '↔ ' + labels.hint;
    back.setAttribute('aria-label', labels.previous);
    next.setAttribute('aria-label', labels.next);
    back.title = labels.previous;
    next.title = labels.next;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  }
  back.onclick = () => node.scrollBy({ left: -node.clientWidth * .75, behavior: 'smooth' });
  next.onclick = () => node.scrollBy({ left: node.clientWidth * .75, behavior: 'smooth' });
  node.addEventListener('scroll', measure, { passive: true });
  const observer = new ResizeObserver(measure);
  observer.observe(node);
  if (node.firstElementChild) observer.observe(node.firstElementChild);
  update(labels);
  return { update, destroy() {
    cancelAnimationFrame(frame);
    observer.disconnect();
    node.removeEventListener('scroll', measure);
    node.classList.remove('horizontal-scroll');
    delete node.dataset.scrollable;
    restoreAttributes();
    cue.remove();
  } };
}
