const telopEl = document.getElementById('aiTelop');
const stEl = document.getElementById('st');

export function setTelop(text) {
  if (telopEl) telopEl.textContent = text;
  if (stEl) stEl.textContent = text;
}
export function appendTelop(text) {
  if (telopEl) telopEl.textContent += text;
}
export function setSpeed(v) {
  const el = document.getElementById('spd');
  if (el) el.textContent = Number(v ?? 0).toFixed(1);
}
