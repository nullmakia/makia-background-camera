import { FALLBACK } from './config.js';
import { setSpeed, setTelop } from './telop.js';

let pano = null;
let sv = null;

// Google Maps のimportLibraryが使えるまで待つ
async function waitGoogle(maxMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function loop() {
      if (window.google?.maps?.importLibrary) return resolve();
      if (Date.now() - start > maxMs) return reject(new Error('Google Mapsの読み込み待ちタイムアウト'));
      setTimeout(loop, 30);
    })();
  });
}

function showNearestPanorama(location, radius = 150) {
  sv.getPanorama({ location, radius }, (data, status) => {
    if (status === 'OK' && data?.location) pano.setPano(data.location.pano);
  });
}

export async function initStreetView() {
  try {
    await waitGoogle();
    await google.maps.importLibrary('maps');
    await google.maps.importLibrary('streetView');

    sv = new google.maps.StreetViewService();
    pano = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
      addressControl: false, fullscreenControl: false, motionTracking: false,
      disableDefaultUI: true, visible: true
    });

    showNearestPanorama(FALLBACK, 200);
    setTelop('準備中…');

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude, speed } = pos.coords;
        setSpeed(speed || 0);
        showNearestPanorama({ lat: latitude, lng: longitude }, 150);
      }, () => {}, { enableHighAccuracy: true, maximumAge: 8000, timeout: 10000 });
    }
    setTelop('タップで開始');
  } catch (e) {
    console.error(e);
    setTelop('地図読み込み失敗');
  }
}
