// dom.js — tiny helpers for building HTML from JavaScript.
// Features use these instead of innerHTML, so text from the user (notes, food
// names) can never be interpreted as HTML.

/** Create an element: el("p", "small muted", "Hello") -> <p class="small muted">Hello</p> */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

/** Append several children at once and return the parent. */
export function append(parent, ...children) {
  for (const child of children) if (child) parent.appendChild(child);
  return parent;
}
