const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const DIR = __dirname;

const MIME = {
  '.tgz': 'application/gzip',
  '.md': 'text/markdown; charset=utf-8',
  '.exe': 'application/octet-stream',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
};

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>GoFoExpress Track CLI</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
    code { font-size: 14px; }
    h2 { color: #333; }
    a { color: #0366d6; }
  </style>
</head>
<body>
  <h2>GoFoExpress 运单轨迹查询 CLI</h2>
  <p>安装（同飞书 lark-cli 风格）：</p>
  <pre><code>npm install -g http://10.80.21.221:8899/gofo-track-1.0.0.tgz</code></pre>

  <p>使用：</p>
  <pre><code>gofo-track TRK123456 --app-id "你的appId" --app-secret "你的ap...</code></pre>

  <p>或通过 AI 智能体（环境变量注入凭证）：</p>
  <pre><code>export GOFO_APP_ID="你的appId"
export GOFO_APP_SECRET=***

gofo-track TRK123456</code></pre>

  <p>
    <a href="/gofo-track-1.0.0.tgz">npm 包 (.tgz)</a> |
    <a href="/SKILL.md">SKILL.md（给智能体）</a> |
    <a href="/dist/gofo-track.exe">Windows .exe</a>
  </p>
</body>
</html>`;

http.createServer((req, res) => {
  const urlPath = req.url;
  if (urlPath === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(INDEX_HTML);
    return;
  }
  const fullPath = path.join(DIR, urlPath);

  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found: ' + req.url);
    return;
  }

  const ext = path.extname(fullPath);
  const contentType = MIME[ext] || 'application/octet-stream';

  if (ext === '.tgz') {
    // 让 npm 能识别
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Disposition': 'attachment; filename="gofo-track-1.0.0.tgz"',
    });
  } else {
    res.writeHead(200, { 'Content-Type': contentType });
  }

  fs.createReadStream(fullPath).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('GoFoExpress Track CLI — HTTP 服务已启动');
  console.log('========================================');
  console.log('');
  console.log('本机地址:');
  console.log('  http://localhost:' + PORT);
  console.log('  http://10.80.21.221:' + PORT);
  console.log('');
  console.log('别人安装命令:');
  console.log('  npm install -g http://10.80.21.221:8899/gofo-track-1.0.0.tgz');
  console.log('');
  console.log('AI 智能体使用:');
  console.log('  export GOFO_APP_ID="xxx"');
  console.log('  export GOFO_APP_SECRET=***  gofo-track TRK123456');
  console.log('');
  console.log('按 Ctrl+C 停止');
});
