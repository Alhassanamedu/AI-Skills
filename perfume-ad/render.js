// Renders index.html to an MP4 per the reel-export spec (H.264 high, yuv420p, tv range, bt709, AAC, faststart).
//   node render.js                 -> full render: orvelle-ad.mp4
//   node render.js --check 1,3.5,5.5,8,9.9   -> only those times, as PNGs in the frames dir (for review)
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const dir = __dirname;
const framesDir = process.env.FRAMES_DIR || path.join(dir, '.frames');
const checkArg = process.argv.indexOf('--check');
const checkTimes = checkArg > -1 ? process.argv[checkArg + 1].split(',').map(Number) : null;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html?render`;
  fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => m.type() === 'error' && console.log('page error:', m.text()));
  page.on('pageerror', e => console.log('page exception:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.ready).then(() => page.evaluate(() => window.ready));

  const grab = async (t, file) => {
    const data = await page.evaluate(t => { window.seek(t); return document.getElementById('out').toDataURL('image/png'); }, t);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  };

  if (checkTimes) {
    for (const t of checkTimes) await grab(t, path.join(framesDir, `check-${t.toFixed(1)}s.png`));
    console.log('check frames written to', framesDir);
  } else {
    const total = FPS * 10, t0 = Date.now();
    for (let i = 0; i < total; i++) {
      await grab(i / FPS, path.join(framesDir, `f${String(i).padStart(4, '0')}.png`));
      if (i % 30 === 0) console.log(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
  await browser.close();
  server.close();
  if (checkTimes) return;

  execSync(`node ${path.join(dir, 'score.js')} ${path.join(framesDir, 'score.wav')}`, { stdio: 'inherit' });
  const outFile = path.join(dir, 'orvelle-ad.mp4');
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${framesDir}/f%04d.png -i ${framesDir}/score.wav ` +
    `-vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -profile:v high -crf 17 -preset slow ` +
    `-pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 ` +
    `-c:a aac -b:a 192k -shortest -movflags +faststart ${outFile}`, { stdio: 'inherit' });
  console.log(execSync(`ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,pix_fmt,color_range,color_space:format=duration -of compact ${outFile}`).toString());
})();
