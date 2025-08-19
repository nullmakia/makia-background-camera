import { initStreetView } from './streetview.js';
import { initCharacters } from './character.js';
import { setupMic } from './audio.js';
import { setupCamera } from './camera.js';

// 画面読込後に初期化開始
window.addEventListener('DOMContentLoaded', () => {
  initStreetView();   // Street View 背景（Google Maps 準備待ちを内部で実施）
  initCharacters();   // キャラの反応（クリック/タップ）
  setupMic();         // 録音・STT・会話
  setupCamera();       // ★追加：カメラ機能の初期化（ボタン配線）
});

// タブを閉じる/離脱時に録音停止（保険）
window.addEventListener('pagehide', () => {
  document.dispatchEvent(new Event('app:teardown'));
});
