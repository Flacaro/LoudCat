export function showToast(message, duration = 2000) {
  // Ensure a top-positioned container exists for stacking toasts
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;

  // Use CSS-driven entry/exit; add then show
  container.appendChild(toast);
  // allow the browser to paint then add visible class
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));

  // Remove after duration with a small fade-out
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export default { showToast };
