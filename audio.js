// audio.js（ES2018互換・構文エラー回避版）
import { STT_URL } from './config.js';
import { setTelop } from './telop.js';
import { askChat } from './chat.js';

let stream = null, rec = null, chunks = [];
let stopLevel = null;

function pickAudioMime() {
  const c = ["audio/webm;codecs=opus","audio/webm","audio/mp4;codecs=mp4a.40.2","audio/mp4"];
  if (!window.MediaRecorder || !window.MediaRecorder.isTypeSupported) return "";
  for (const t of c) if (MediaRecorder.isTypeSupported(t)) return t;
  return "";
}

// 入力レベルメーター
function startLevelMeter(mediaStream) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const src = ac.createMediaStreamSource(mediaStream);
  const an = ac.createAnalyser(); an.fftSize = 1024;
  src.connect(an);
  const data = new Uint8Array(an.frequencyBinCount);
  const bar = document.getElementById('levelBar');
  let raf = 0;

  (function tick(){
    an.getByteTimeDomainData(data);
    let sum = 0;
    for (let i=0;i<data.length;i++) {
      const v = (data[i]-128)/128; sum += v*v;
    }
    const rms = Math.sqrt(sum/data.length);
    if (bar) bar.style.width = Math.min(100, Math.round(rms*180)) + "%";
    raf = requestAnimationFrame(tick);
  })();

  return function cleanup(){ cancelAnimationFrame(raf); ac.close(); };
}

async function preflightMic() {
  const s = await navigator.mediaDevices.getUserMedia({ audio: true });
  s.getTracks().forEach(function(t){ t.stop(); });
}

async function sendToSTT(blob) {
  const res = await fetch(STT_URL, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'application/octet-stream' },
    body: await blob.arrayBuffer()
  });
  if (!res.ok) throw new Error('STT HTTP ' + res.status);
  const j = await res.json().catch(function(){ return {text:''}; });
  return j.text || j.result || '';
}

async function startRecording() {
  const micBtn = document.getElementById('micBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (!isSecureContext) { setTelop('HTTPSで開いてください'); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setTelop('getUserMedia未対応'); return;
  }

  setTelop('権限取得中…');
  try {
    await preflightMic();
  } catch (e) {
    setTelop('権限取得失敗');
    return;
  }

  setTelop('録音初期化…');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1 }
    });
  } catch (e) {
    setTelop('録音用ストリーム失敗');
    return;
  }

  try {
    stopLevel = startLevelMeter(stream);
  } catch (e) {
    // メーターは無くても致命的ではないので握りつぶし
  }

  const mime = pickAudioMime();
  try {
    rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  } catch (e) {
    setTelop('MediaRecorder作成失敗');
    return;
  }

  chunks = [];
  rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstart = function(){
    setTelop('録音中…話しかけてね');
    if (stopBtn) stopBtn.disabled = false;
    if (micBtn) micBtn.disabled = true;
  };
  rec.onstop = async function(){
    if (stopBtn) stopBtn.disabled = true;
    if (micBtn) micBtn.disabled = false;

    try { if (stopLevel) stopLevel(); } catch (e) {}
    try { stream.getTracks().forEach(function(t){ t.stop(); }); } catch (e) {}

    const type = rec.mimeType || (chunks[0] && chunks[0].type) || 'audio/webm';
    const blob = new Blob(chunks, { type });

    setTelop('STT送信中…');
    let text = '';
    try {
      text = await sendToSTT(blob);
    } catch (e) {
      setTelop('STT失敗');
      return;
    }

    if (!text) { setTelop('（聞き取れなかったかも）'); return; }
    setTelop('…考え中');
    await askChat(text);
  };

  try {
    rec.start(2000);
  } catch (e) {
    setTelop('rec.start失敗');
  }
}

export function setupMic() {
  const micBtn = document.getElementById('micBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (micBtn) micBtn.addEventListener('click', startRecording);
  if (stopBtn) stopBtn.addEventListener('click', function(){ try { rec && rec.stop(); } catch (e) {} });

  // アプリ終了時の後片付け
  document.addEventListener('app:teardown', function(){
    try { rec && rec.stop(); } catch (e) {}
    try { stream && stream.getTracks().forEach(function(t){ t.stop(); }); } catch (e) {}
  });
}
