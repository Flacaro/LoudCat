export function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

export default { showToast };
