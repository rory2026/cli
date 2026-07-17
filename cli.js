#!/usr/bin/env node
/**
 * Order CLI — 创建订单、取消订单、查询轨迹
 * 安装: npm install -g https://github.com/rory2026/cli
 */

const fs = require("fs");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

const DEFAULT_DOMAIN = "https://uat-api-eu.gofoexpress.com";
const DEFAULT_ROUTE_COUNTRY = "FR";
const TOKEN_URI = "/openapi/oauth2/token";
const CREATE_URI = "/open-api/v2/order/create";
const CANCEL_URI = "/open-api/v2/order/cancel";
const TRACK_URI = "/open-api/v2/order/track/";

function printHelp() {
  console.log(`
订单 OpenAPI CLI

用法:
  track-cli track <运单号> [全局选项]
  track-cli create --file <订单JSON文件> [全局选项]
  track-cli create --data '<订单JSON>' [全局选项]
  track-cli cancel <订单号> --remarks <取消原因> [全局选项]

兼容旧用法:
  track-cli <运单号>

命令:
  track                 查询订单轨迹
  create                创建订单（必须通过 --file 或 --data 提供请求体）
  cancel                取消订单

全局选项:
  --app-id <id>         App ID（或 TRACK_APP_ID）
  --app-secret <secret> App Secret（或 TRACK_APP_SECRET）
  --domain <url>        API 域名（或 TRACK_DOMAIN，默认: ${DEFAULT_DOMAIN}）
  --route-country <cc>  路由国家（或 TRACK_ROUTE_COUNTRY，默认: FR）
  --dry-run             仅输出将发送的请求，不调用业务接口
  --help, -h            显示帮助

示例:
  track-cli track GFFR26043939146721
  track-cli create --file order.json
  track-cli cancel GFFR26043939146721 --remarks "客户取消"
`);
}

function fail(message, code = 1) {
  console.error(`错误: ${message}`);
  process.exit(code);
}

function getSignature(secret, method, uri, body, date = Date.now()) {
  const params = { date: String(date), method, uri };
  if (body && body.trim()) params.body = body;
  const content = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const sign = crypto.createHmac("sha256", secret).update(content, "utf8").digest("base64");
  return { date, sign };
}

function request(urlString, options, body) {
  return new Promise((resolve, reject) => {
    const transport = urlString.startsWith("https:") ? https : http;
    const req = transport.request(urlString, options, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        let data = raw;
        try { data = JSON.parse(raw); } catch (_) {}
        resolve({ status: res.statusCode, data });
      });
    });
    req.setTimeout(30000, () => req.destroy(new Error("请求超时（30秒）")));
    req.on("error", reject);
    if (body !== undefined && body !== null) req.write(body);
    req.end();
  });
}

async function getToken(config) {
  // 与 Java fastjson fluentPut 顺序一致，且不添加签名头。
  const body = JSON.stringify({
    grantType: "client_credentials",
    appId: config.appId,
    appSecret: config.appSecret,
  });
  const response = await request(`${config.domain}${TOKEN_URI}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  }, body);
  if (response.status < 200 || response.status >= 300 || !response.data?.accessToken) {
    throw new Error(`获取令牌失败（HTTP ${response.status}）: ${JSON.stringify(response.data)}`);
  }
  return response.data.accessToken;
}

async function callApi(config, method, uri, body) {
  const { date, sign } = getSignature(config.appSecret, method, uri, body);
  const headers = {
    "route-country": config.routeCountry,
    sign,
    date: String(date),
  };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  if (config.dryRun) {
    return {
      dryRun: true,
      method,
      url: `${config.domain}${uri}`,
      headers: { ...headers, sign: "***", token: "***" },
      body: body ? JSON.parse(body) : undefined,
    };
  }

  headers.token = await getToken(config);
  const response = await request(`${config.domain}${uri}`, { method, headers }, body);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`业务请求失败（HTTP ${response.status}）: ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

function parseArgs(argv) {
  const config = {
    appId: process.env.TRACK_APP_ID || "",
    appSecret: process.env.TRACK_APP_SECRET || "",
    domain: process.env.TRACK_DOMAIN || DEFAULT_DOMAIN,
    routeCountry: process.env.TRACK_ROUTE_COUNTRY || DEFAULT_ROUTE_COUNTRY,
    dryRun: false,
  };
  const positionals = [];
  let file = "";
  let data = "";
  let remarks = "";

  const valueOptions = new Set(["--app-id", "--app-secret", "--domain", "--route-country", "--file", "--data", "--remarks"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--dry-run") { config.dryRun = true; continue; }
    if (valueOptions.has(arg)) {
      if (i + 1 >= argv.length) fail(`${arg} 缺少参数值`);
      const value = argv[++i];
      if (arg === "--app-id") config.appId = value;
      else if (arg === "--app-secret") config.appSecret = value;
      else if (arg === "--domain") config.domain = value.replace(/\/$/, "");
      else if (arg === "--route-country") config.routeCountry = value;
      else if (arg === "--file") file = value;
      else if (arg === "--data") data = value;
      else if (arg === "--remarks") remarks = value;
      continue;
    }
    if (arg.startsWith("--")) fail(`未知选项 ${arg}`);
    positionals.push(arg);
  }
  return { config, positionals, file, data, remarks };
}

function normalizeJson(raw, source) {
  try {
    return JSON.stringify(JSON.parse(raw));
  } catch (error) {
    fail(`${source} 不是有效 JSON：${error.message}`);
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help || parsed.positionals.length === 0) {
    printHelp();
    return;
  }

  let [command, target, ...extra] = parsed.positionals;
  // 向后兼容 track-cli <运单号>
  if (!["track", "create", "cancel"].includes(command)) {
    target = command;
    command = "track";
  }
  if (extra.length) fail(`多余参数: ${extra.join(" ")}`);
  if (!parsed.config.dryRun && (!parsed.config.appId || !parsed.config.appSecret)) {
    fail("请提供 --app-id 和 --app-secret，或设置 TRACK_APP_ID / TRACK_APP_SECRET");
  }

  let result;
  if (command === "track") {
    if (!target) fail("track 命令需要运单号");
    result = await callApi(parsed.config, "GET", `${TRACK_URI}${encodeURIComponent(target)}`);
  } else if (command === "cancel") {
    if (!target) fail("cancel 命令需要订单号");
    if (!parsed.remarks) fail("cancel 命令需要 --remarks <取消原因>");
    const body = JSON.stringify({ orderNo: target, remarks: parsed.remarks });
    result = await callApi(parsed.config, "POST", CANCEL_URI, body);
  } else {
    if (target) fail("create 命令不接受位置参数，请使用 --file 或 --data");
    if (parsed.file && parsed.data) fail("--file 和 --data 不能同时使用");
    if (!parsed.file && !parsed.data) fail("create 命令需要 --file <订单JSON文件> 或 --data '<订单JSON>'");
    const raw = parsed.file ? fs.readFileSync(parsed.file, "utf8") : parsed.data;
    const body = normalizeJson(raw, parsed.file || "--data");
    result = await callApi(parsed.config, "POST", CREATE_URI, body);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`请求失败: ${error.message}`);
  process.exit(1);
});
