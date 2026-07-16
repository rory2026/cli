#!/usr/bin/env node
/**
 * Track CLI — 运单轨迹查询
 * 安装: npm install -g @rory2026/track-cli
 * 用法: track-cli <运单号> [--app-id xxx] [--app-secret xxx]
 */

const https = require("https");
const crypto = require("crypto");

const DEFAULT_DOMAIN = "https://uat-api-eu.gofoexpress.com";
const DEFAULT_ROUTE_COUNTRY = "FR";

function getSignature(secret, method, uri, body, date) {
  date = date || Date.now();
  const params = { date: String(date), method, uri };
  if (body && body.trim()) params.body = body;
  const content = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const sig = crypto.createHmac("sha256", secret).update(content, "utf8").digest("base64");
  return [date, sig];
}

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getToken(domain, appId, appSecret) {
  const uri = "/openapi/oauth2/token";
  const body = JSON.stringify({ grantType: "client_credentials", appId, appSecret });
  const [date, sign] = getSignature(appSecret, "POST", uri, body);
  const url = new URL(uri, domain);
  return (
    await request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "route-country": DEFAULT_ROUTE_COUNTRY,
          sign,
          date: String(date),
        },
      },
      body,
    )
  ).accessToken || "";
}

async function getTrack(domain, appId, appSecret, trackingNo) {
  const token = await getToken(domain, appId, appSecret);
  const uri = `/open-api/v2/order/track/${trackingNo}`;
  const [date, sign] = getSignature(appSecret, "GET", uri);
  const url = new URL(uri, domain);
  return request(url, {
    headers: {
      "route-country": DEFAULT_ROUTE_COUNTRY,
      sign,
      date: String(date),
      token,
    },
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
运单轨迹查询 CLI

用法:
  track-cli <运单号> [选项]

选项:
  --app-id <id>          App ID (或 TRACK_APP_ID 环境变量)
  --app-secret <secret>  App Secret (或 TRACK_APP_SECRET 环境变量)
  --domain <url>         API 域名 (默认: ${DEFAULT_DOMAIN})
  --help                 显示帮助

示例:
  track-cli TRK123456 --app-id xxx --app-secret xxx

环境变量:
  TRACK_APP_ID       App ID
  TRACK_APP_SECRET   App Secret
  TRACK_DOMAIN       API 域名
`);
    return;
  }

  let trackingNo = null;
  let appId = process.env.TRACK_APP_ID || "";
  let appSecret = process.env.TRACK_APP_SECRET || "";
  let domain = process.env.TRACK_DOMAIN || DEFAULT_DOMAIN;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--app-id":
        appId = args[++i];
        break;
      case "--app-secret":
        appSecret = args[++i];
        break;
      case "--domain":
        domain = args[++i];
        break;
      default:
        trackingNo = args[i];
    }
  }

  if (!trackingNo) {
    console.error("错误: 请提供运单号");
    process.exit(1);
  }
  if (!appId || !appSecret) {
    console.error("错误: 请提供 --app-id 和 --app-secret，或设置 TRACK_APP_ID / TRACK_APP_SECRET 环境变量");
    process.exit(1);
  }

  try {
    const result = await getTrack(domain, appId, appSecret, trackingNo);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("请求失败:", err.message);
    process.exit(1);
  }
}

main();
