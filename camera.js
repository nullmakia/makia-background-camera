// camera.js
import { setTelop } from './telop.js';

let camStream = null;
const constraints = {
  video: {
    facingMode: { ideal: 'environment' }, // 背面カメラ優先（なければフロント）
    width:    { ideal: 1920 },
    height:   { ideal: 1080 }
  },
  audio: false
};

function showCameraUI(isOn) {
  const btn = document.getElementById('camBtn');
  const pano = document.getElementById('pano');
  const cam = document.getElementById('cam');
  if (!btn || !pano || !cam) return;

  if (isOn) {
    btn.textContent = '📷 カメラOFF';
    // Street View を隠してカメラを表示
    pano.classList.add('hidden');
    cam.classList.remove('hidden');
  } else {
    btn.textContent = '📷 カメラON';
    // カメラを隠して Street View を表示
    cam.classList.add('hidden');
    pano.classList.remove('hidden');
  }
}

async function startCamera() {
  if (!isSecureContext) {
    setTelop('HTTPSで開いてください'); return;
  }
  const videoEl = document.getElementById('cam');
  if (!videoEl) return;

  try {
    // 既存停止
    if (camStream) stopCamera();

    // 権限付与＆取得
    camStream = await navigator.mediaDevices.getUserMedia(constraints);
    // iOS/Safari 対応：autoplay/playsinline/muted 属性は index.html に付与済み
    videoEl.srcObject = camStream;
    await videoEl.play().catch(() => {}); // 失敗してもボタン押下で再試行可能

    showCameraUI(true);
    setTelop('カメラ起動中');
  } catch (e) {
    console.error(e);
    setTelop('カメラ起動失敗');
    showCameraUI(false);
  }
}

function stopCamera() {
  const videoEl = document.getElementById('cam');
  if (videoEl && videoEl.srcObject) {
    try {
      const tracks = videoEl.srcObject.getTracks();
      tracks.forEach(t => t.stop());
    } catch (e) {}
    videoEl.srcObject = null;
  }
  camStream = null;
  showCameraUI(false);
  setTelop('カメラ停止');
}

export function setupCamera() {
  const btn = document.getElementById('camBtn');
  const cam = document.getElementById('cam');
  const pano = document.getElementById('pano');
  if (!btn || !cam || !pano) return;

  // 初期状態：Street View 表示、カメラ非表示
  cam.classList.add('hidden');
  pano.classList.remove('hidden');
  showCameraUI(false);

  btn.addEventListener('click', async () => {
    // トグル
    if (camStream) {
      stopCamera();
    } else {
      await startCamera();
    }
  });

  // アプリ終了時の後片付け
  document.addEventListener('app:teardown', () => {
    stopCamera();
  });
}
