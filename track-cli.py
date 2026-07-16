#!/usr/bin/env python
"""
Track CLI — 运单轨迹查询
安装: npm install -g @rory2026/track-cli
用法: track-cli <运单号> [--app-id xxx] [--app-secret xxx]
"""

import argparse
import base64
import hmac
import hashlib
import json
import os
import sys
import urllib.request
import ssl
from datetime import datetime, timezone

DEFAULT_DOMAIN = "https://uat-api-eu.gofoexpress.com"
DEFAULT_ROUTE_COUNTRY = "FR"

# 忽略 SSL 证书校验（跟 Java 的 NoopHostnameVerifier + trustAll 一致）
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


def get_signature(secret, method, uri, body=None, date=None):
    if date is None:
        date = int(datetime.now(timezone.utc).timestamp() * 1000)
    params = {"date": str(date), "method": method, "uri": uri}
    if body and body.strip():
        params["body"] = body
    content = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    sig = hmac.new(secret.encode("utf-8"), content.encode("utf-8"), hashlib.sha256).digest()
    return date, base64.b64encode(sig).decode("ascii")


def request(method, url, body=None, headers=None):
    data = body.encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=30, context=ssl_ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_token(domain, app_id, app_secret):
    uri = "/openapi/oauth2/token"
    body = json.dumps({
        "appId": app_id,
        "appSecret": app_secret,
        "grantType": "client_credentials",
    }, ensure_ascii=False)
    headers = {"Content-Type": "application/json"}
    result = request("POST", f"{domain}{uri}", body, headers)
    return result.get("accessToken", "")


def get_track(domain, app_id, app_secret, tracking_no):
    token = get_token(domain, app_id, app_secret)
    if not token:
        print("错误: 获取访问令牌失败", file=sys.stderr)
        sys.exit(1)
    uri = f"/open-api/v2/order/track/{tracking_no}"
    date, sign = get_signature(app_secret, "GET", uri)
    headers = {
        "route-country": DEFAULT_ROUTE_COUNTRY,
        "sign": sign,
        "date": str(date),
        "token": token,
    }
    return request("GET", f"{domain}{uri}", headers=headers)


def main():
    parser = argparse.ArgumentParser(
        prog="track-cli",
        description="运单轨迹查询 CLI",
    )
    parser.add_argument("tracking_no", help="运单号")
    parser.add_argument("--app-id", default=os.environ.get("TRACK_APP_ID", ""),
                        help="App ID (或 TRACK_APP_ID 环境变量)")
    parser.add_argument("--app-secret", default=os.environ.get("TRACK_APP_SECRET", ""),
                        help="App Secret (或 TRACK_APP_SECRET 环境变量)")
    parser.add_argument("--domain", default=os.environ.get("TRACK_DOMAIN", DEFAULT_DOMAIN),
                        help=f"API 域名 (默认: {DEFAULT_DOMAIN})")

    args = parser.parse_args()

    if not args.app_id or not args.app_secret:
        parser.error("请提供 --app-id 和 --app-secret，或设置 TRACK_APP_ID / TRACK_APP_SECRET 环境变量")

    result = get_track(args.domain, args.app_id, args.app_secret, args.tracking_no)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
