function bounce(el, cls) {
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}
function bubble(el, text) {
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  el.appendChild(b);
  setTimeout(() => b.remove(), 800);
}

export function initCharacters() {
  const boy = document.getElementById('boy');
  const dog = document.getElementById('dog');
  if (!boy || !dog) return;

  ['click','touchend'].forEach(type => {
    boy.addEventListener(type, e => {
      if (type === 'touchend') e.preventDefault();
      bounce(boy, 'react'); bubble(boy, 'いこう！');
    }, { passive: false });

    dog.addEventListener(type, e => {
      if (type === 'touchend') e.preventDefault();
      bounce(dog, 'react'); bubble(dog, 'ワン！');
    }, { passive: false });
  });
}
