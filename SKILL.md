---
name: track-cli
description: "运单轨迹查询 CLI — 安装和使用指南"
version: 1.0.0
author: Rory Yang
---

# Track CLI 安装指南

以下步骤面向 AI Agent，部分步骤需要用户在浏览器中配合完成。

## 环境要求

开始安装之前，请确保环境中已安装：

- Node.js（npm/npx）

## 第 1 步 安装

```shell
npm install -g https://github.com/rory2026/cli
```

## 第 2 步 配置应用凭证

Agent 运行以下命令，并让用户提供 App ID 和 App Secret。

```shell
export TRACK_APP_ID="用户提供的appId"
export TRACK_APP_SECRET=**
```

## 第 3 步 查询轨迹

```shell
track-cli <运单号>
```

## 参数说明

| 选项 | 环境变量 | 说明 |
|---|---|---|
| `--app-id` | `TRACK_APP_ID` | App ID |
| `--app-secret` | `TRACK_APP_SECRET` | App Secret |
| `--domain` | `TRACK_DOMAIN` | API 域名（默认: `https://uat-api-eu.gofoexpress.com`） |

## 完整示例

```shell
# 安装
npm install -g https://github.com/rory2026/cli

# 配置凭证
export TRACK_APP_ID="cli_a9...d5"
export TRACK_APP_SECRET=*** 查询轨迹
track-cli TRK123456
```
