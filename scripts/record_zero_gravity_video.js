const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 9876;
const CHROME_PORT = 9334;
const HTML_FILE = path.join(__dirname, 'zero_gravity_render.html');
const HERO_IMAGE = path.join(__dirname, '../frontend/public/images/zero-gravity-hero.jpg');
const OUTPUT_VIDEO = path.join(__dirname, '../frontend/public/videos/zero-gravity-bg.webm');

// 1. Start HTTP Server
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(HTML_FILE).pipe(res);
  } else if (req.url === '/zero-gravity-hero.jpg') {
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    fs.createReadStream(HERO_IMAGE).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening at http://localhost:${PORT}`);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const tempProfile = '/tmp/chrome-video-profile-' + Date.now();
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    `http://localhost:${PORT}`
  ];

  console.log('Launching Chrome headless...');
  const chromeProcess = spawn(chromePath, chromeArgs);

  try {
    // Wait for Chrome to be ready with retry loop
    let targets = null;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const targetsRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
      if (targetsRes.ok) {
        targets = await targetsRes.json();
        break;
      }
    } catch (e) {
      // Chrome still starting up
    }
  }

  if (!targets) {
    throw new Error('Chrome remote debugging did not respond on port ' + CHROME_PORT);
  }

  const pageTarget = targets.find(t => t.type === 'page');

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No page target found with WebSocket debugger URL');
    }

    console.log('Connecting to Chrome CDP via WebSocket...');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    console.log('Connected to CDP. Enabling Runtime and Page...');
    let reqId = 1;
    function sendCdp(method, params = {}) {
      return new Promise((resolve) => {
        const id = reqId++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            ws.off('message', handler);
            resolve(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value).join(' ');
        console.log('[Browser Console]:', text);
      }
    });

    await sendCdp('Runtime.enable');
    await sendCdp('Page.enable');

    console.log('Waiting for video recording to complete (approx 7-10s)...');

    // Poll window.videoReady
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 40) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
      const evalRes = await sendCdp('Runtime.evaluate', {
        expression: 'window.videoReady === true',
        returnByValue: true
      });
      if (evalRes && evalRes.result && evalRes.result.value === true) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      throw new Error('Timed out waiting for window.videoReady');
    }

    console.log('Video recording finished! Fetching video data url...');
    const dataRes = await sendCdp('Runtime.evaluate', {
      expression: 'window.videoDataUrl',
      returnByValue: true
    });

    const dataUrl = dataRes.result.value;
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    fs.mkdirSync(path.dirname(OUTPUT_VIDEO), { recursive: true });
    fs.writeFileSync(OUTPUT_VIDEO, buffer);
    console.log(`SUCCESS! Saved video to: ${OUTPUT_VIDEO} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    ws.close();
    chromeProcess.kill();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('Error recording video:', err);
    chromeProcess.kill();
    server.close();
    process.exit(1);
  }
});
