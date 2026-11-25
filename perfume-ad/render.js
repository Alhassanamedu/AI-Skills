// Renders a seekable page to MP4 per the reel-export spec (H.264 high, yuv420p, tv range, bt709, AAC, faststart).
//   node render.js                                   -> index.html at 1080x1920 -> orvelle-ad.mp4
//   node render.js --page portrait.html --scale 2 --out orvelle-portrait-4k.mp4 --deliver orvelle-portrait-1080.mp4 --hits 0.4,3.0,4.6,5.1,5.6,6.1,7.3
//   add --check 1,5.5,9.9 to render only those times as PNGs for review
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : def; };
const FPS = 30, DUR = 10;
const dir = __dirname;
const page = arg('page', 'index.html');
const scale = Number(arg('scale', '1'));
const outName = arg('out', 'orvelle-ad.mp4');
const deliver = arg('deliver', null);
const hits = arg('hits', null);
const framesDir = process.env.FRAMES_DIR || path.join(dir, '.frames');
const query = arg('query', '');   // extra page params, e.g. --query nobust
const from = Number(arg('from', '0'));   // start time in s; with --from > 0 the output is a silent segment (no score)
const checkTimes = arg('check', null)?.split(',').map(Number);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
const ENC = '-c:v libx264 -profile:v high -crf 17 -preset slow -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -shortest -movflags +faststart';

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/${page}?render&scale=${scale}${query ? '&' + query : ''}`;
  fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('console', m => m.type() === 'error' && console.log('page error:', m.text()));
  pg.on('pageerror', e => console.log('page exception:', e.message));
  await pg.goto(url);
  await pg.waitForFunction(() => window.ready); await pg.evaluate(() => window.ready);

  const grab = async (t, file) => {
    const data = await pg.evaluate(t => { window.seek(t); return document.getElementById('out').toDataURL('image/png'); }, t);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  };
  if (checkTimes) {
    for (const t of checkTimes) await grab(t, path.join(framesDir, `check-${t.toFixed(1)}s.png`));
    console.log('check frames written to', framesDir);
  } else {
    const total = FPS * DUR, t0 = Date.now();
    for (let i = Math.round(from * FPS); i < total; i++) {
      await grab(i / FPS, path.join(framesDir, `f${String(i).padStart(4, '0')}.png`));
      if (i % 30 === 0) console.log(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
  await browser.close(); server.close();
  if (checkTimes) return;

  if (from > 0) {
    const seg = path.join(dir, outName);
    execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -start_number ${Math.round(from * FPS)} -i ${framesDir}/f%04d.png ` +
      `-vf "scale=1080:1920:flags=lanczos,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" ${ENC.replace(/-c:a .*?-shortest /, '-an ')} ${seg}`, { stdio: 'inherit' });
    return console.log(execSync(`ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt:format=duration -of compact ${seg}`).toString());
  }
  execSync(`node ${path.join(dir, 'score.js')} ${path.join(framesDir, 'score.wav')}`, { stdio: 'inherit', env: { ...process.env, ...(hits ? { HITS: hits } : {}) } });
  const outFile = path.join(dir, outName);
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${framesDir}/f%04d.png -i ${framesDir}/score.wav ` +
    `-vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" ${ENC} ${outFile}`, { stdio: 'inherit' });
  const probe = f => console.log(execSync(`ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,pix_fmt,color_range,color_space:format=duration -of compact ${f}`).toString());
  probe(outFile);
  if (deliver) {
    const d = path.join(dir, deliver);
    execSync(`ffmpeg -y -loglevel error -i ${outFile} -vf "scale=1080:1920:flags=lanczos,format=yuv420p" ${ENC} ${d}`, { stdio: 'inherit' });
    probe(d);
  }
})();
