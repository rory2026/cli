---
name: gofo-track
description: "GoFoExpress 运单轨迹查询 — npm 全局 CLI"
version: 1.0.0
author: Rory Yang
---

# gofo-track

高链云(GoFoExpress) 运单轨迹查询命令行工具。npm 全局安装，跟飞书 `@larksuite/cli` 一样。

## 安装

```bash
npm install -g @gofo/track
```

## 使用

### 方式一：命令行参数

```bash
gofo-track TRK123456 --app-id "你的appId" --app-secret "你的ap...方式二：环境变量（推荐给 AI 智能体）
export GOFO_APP_ID="你的appId"
export GOFO_APP_SECRET=*** gofo-track TRK123456
```

## AI 智能体调用模板

```bash
# 1. 从对话上下文获取用户的 AppId 和 AppSecret
# 2. 注入环境变量（不写配置文件）
export GOFO_APP_ID="<app_id>"
export GOFO_APP_SECRET="<app...n
# 3. 查询轨迹
gofo-track <运单号>
```

## 参数

| 参数 / 环境变量 | 说明 | 默认值 |
|---|---|---|
| `tracking_no`（位置参数） | 运单号 | — |
| `--app-id` / `GOFO_APP_ID` | App ID | — |
| `--app-secret` / `GOFO_APP_SECRET` | App Secret | — |
| `--domain` / `GOFO_DOMAIN` | API 域名 | `https://uat-api-eu.gofoexpress.com` |
