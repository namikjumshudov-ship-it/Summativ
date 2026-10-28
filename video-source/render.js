// usage: node render.js preview t1 t2 ...   |   node render.js video out.mp4 audio.wav
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  const frame = async (t, q = 0.92) => {
    const url = await page.evaluate(([t, q]) => { render(t); return document.getElementById('c').toDataURL('image/jpeg', q); }, [t, q]);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  if (mode === 'preview') {
    fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true });
    for (const t of args) fs.writeFileSync(path.join(__dirname, 'preview', `f_${t}.jpg`), await frame(parseFloat(t), .8));
  } else {
    const [out, audio] = args, fps = 30, total = await page.evaluate(() => TOTAL);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', audio,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let i = 0; i < total * fps; i++) {
      const buf = await frame(i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log('frame', i);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
