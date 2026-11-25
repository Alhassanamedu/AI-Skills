// Renders ad.html to frames, then encodes orvelle-ad.mp4 (1080x1920, 30fps, 10s) with an ambient soundtrack.
// Usage: node render.js
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30, DUR = 10;
const dir = __dirname;
const framesDir = path.join(process.env.FRAMES_DIR || path.join(dir, '.frames'));

(async () => {
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(dir, 'ad.html') + '?capture=1');
  await page.evaluate(() => window.ready);
  const total = FPS * DUR;
  for (let i = 0; i < total; i++) {
    const data = await page.evaluate(t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, i / FPS);
    fs.writeFileSync(path.join(framesDir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  await browser.close();

  // Ambient pad: soft A-minor-ish chord with slow swell, plus a shimmer at the brand reveal (~7.4s).
  const pad = [110, 164.81, 220, 261.63, 329.63].map((f, i) =>
    `${(0.16 / (i + 1)).toFixed(3)}*sin(2*PI*${f}*t)*(0.7+0.3*sin(2*PI*${0.13 + i * 0.07}*t))`).join('+');
  const shimmer = `0.05*sin(2*PI*1318.5*t)*exp(-2.2*max(t-7.4,0))*gt(t,7.4)+0.04*sin(2*PI*1760*t)*exp(-2.6*max(t-7.55,0))*gt(t,7.55)`;
  const audio = path.join(framesDir, 'pad.wav');
  execSync(`ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='${pad}+${shimmer}':s=48000:d=${DUR}" ` +
    `-af "lowpass=f=2400,aecho=0.8:0.7:120|260:0.35|0.25,afade=t=in:d=1.2,afade=t=out:st=8.6:d=1.4,volume=1.6" ${audio}`);

  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${framesDir}/f%04d.png -i ${audio} ` +
    `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart -c:a aac -b:a 192k -shortest ` +
    `${path.join(dir, 'orvelle-ad.mp4')}`, { stdio: 'inherit' });
  console.log('done: orvelle-ad.mp4');
})();
