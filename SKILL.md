---
name: track-cli
description: "运单轨迹查询 CLI — 安装和使用指南"
version: 1.0.0
author: Rory Yang
---

# Track CLI 安装指南

以下步骤面向 AI Agent。

## 环境要求

- Node.js（npm/npx）

## 第 1 步 安装

```shell
npm install -g https://github.com/rory2026/cli
```

## 第 2 步 查询轨迹

直接使用，无需配置：

```shell
track-cli <运单号>
```

也可通过环境变量覆盖凭证：

```shell
export TRACK_APP_ID="你的appId"
export TRACK_APP_SECRET=*** 
```

## 完整示例

```shell
npm install -g https://github.com/rory2026/cli
track-cli GFFR26043939146721
```
