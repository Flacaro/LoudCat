// helpers.js
// Funzioni di utilità riutilizzabili

export function formatTitle(title, maxLength = 25) {
  return title.length > maxLength ? title.slice(0, maxLength) + "..." : title;
}
