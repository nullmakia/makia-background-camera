import { CHAT_URL } from './config.js';
import { setTelop, appendTelop } from './telop.js';

export async function askChat(text) {
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o-mini", stream: true,
        messages: [
          { role: "system", content: "あなたは元気な少年キャラ『Fool』です。短い日本語セリフで返答。敬称不要。絵文字は控えめ。" },
          { role: "user", content: text }
        ]
      })
    });
    if (!res.ok || !res.body) {
      setTelop(`接続エラー(${res.status})`);
      return;
    }
    setTelop('');
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });

      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { buf = ''; break; }
        try {
          const j = JSON.parse(payload);
          const delta = j?.choices?.[0]?.delta?.content || '';
          if (delta) appendTelop(delta);
        } catch {}
      }
    }
  } catch (e) {
    setTelop('通信エラー: ' + (e?.message || e));
  }
}
