---
name: track-cli
description: "运单轨迹查询 CLI — 面向 AI Agent 的安装和使用指南"
version: 1.0.0
author: Rory Yang
---

# Track CLI

运单轨迹查询命令行工具。

## 背景

这是一个对接 GoFoExpress（高链云/GoFoExpress）开放平台 API 的 CLI 工具，用于查询国际物流运单的轨迹信息。

## 使用场景

当用户询问运单的物流轨迹、物流状态、签收情况时，Agent 可以使用此工具查询。

例如：
- "帮我查一下这个运单走到哪了"
- "查询 GFFR26043939146721 的轨迹"
- "这个包裹签收了没有"

## 环境要求

- Node.js（npm/npx）

## 第 1 步 安装

```shell
npm install -g https://github.com/rory2026/cli
```

## 第 2 步 获取凭证

此 CLI 需要 GoFoExpress 开放平台的 App ID 和 App Secret。Agent 应向用户询问：

> 请提供你的 GoFoExpress 开放平台 App ID 和 App Secret，我将用来配置轨迹查询工具。

用户提供后，Agent 通过环境变量配置：

```shell
set TRACK_APP_ID=用户提供的appId
set TRACK_APP_SECRET=用户提供的appSecret
```

## 第 3 步 查询轨迹

```shell
track-cli <运单号>
```

也可直接通过命令行参数传入凭证：

```shell
track-cli <运单号> --app-id <appId> --app-secret <appSecret>
```

## 示例

```shell
# 安装
npm install -g https://github.com/rory2026/cli

# 配置凭证
set TRACK_APP_ID=6e16d3c70ced
set TRACK_APP_SECRET=***# 查询轨迹
track-cli GFFR26043939146721

# 或一行完成
track-cli GFFR26043939146721 --app-id 6e16d3c70ced --app-secret c44cd0050bf9405db5eed92f28b4c1a8
```

## 返回数据说明

查询成功返回 JSON 数组，每条记录包含：
- `operationTime` — 操作时间
- `enContext` / `pubEsContext` — 轨迹描述（英文/本地语言）
- `location` — 所在地
- `operator` — 操作人
- `operationMove` — 操作类型编码
- `signer` — 签收人
- `delStatus` — 签收状态

## 参数说明

| 选项 | 环境变量 | 说明 |
|---|---|---|
| `--app-id` | `TRACK_APP_ID` | GoFoExpress 开放平台 App ID |
| `--app-secret` | `TRACK_APP_SECRET` | GoFoExpress 开放平台 App Secret |
| `--domain` | `TRACK_DOMAIN` | API 域名（默认: `https://uat-api-eu.gofoexpress.com`） |
