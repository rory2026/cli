---
name: track-cli
description: "运单轨迹查询 CLI — 面向 AI Agent 的安装和使用指南"
version: 1.0.0
author: Rory Yang
---

# Track CLI

运单轨迹查询命令行工具。

## 背景

对接 GoFoExpress（高链云）开放平台 API，查询国际物流运单轨迹信息。

## 使用场景

当用户询问运单的物流状态时，Agent 使用此工具查询轨迹并整理成表格展示。

例如：
- "帮我查一下这个运单走到哪了"
- "查询 GFFR26043939146721 的轨迹"
- "这个包裹签收了没有"

## 安装

一行命令安装：

```shell
npm install -g https://github.com/rory2026/cli
```

安装后 `track-cli` 命令全局可用。

> 要求：Node.js（npm）或 Python 3，安装时 npm 会自动使用系统 Python 运行脚本。

## 获取凭证

首次使用需要 GoFoExpress 开放平台的 App ID 和 App Secret。Agent 向用户询问：

> 请提供你的 GoFoExpress 开放平台 App ID 和 App Secret，我将配置轨迹查询工具。

## 使用方式

### 方式一：命令行传参

```shell
track-cli <运单号> --app-id <你的AppId> --app-secret <你的AppSecret>
```

### 方式二：环境变量

```shell
set TRACK_APP_ID=你的AppId
set TRACK_APP_SECRET=*** 查询轨迹
```

## 示例

```shell
# 安装
npm install -g https://github.com/rory2026/cli

# 查询
track-cli GFFR26043939146721 --app-id 6e16d3c70ced --app-secret c44c...1a8
```

## 给用户展示格式

Agent 查询到轨迹数据后，按以下格式以**表格**呈现给用户：

```
 时间          节点         地点        英文描述                                本地描述
 ─────────────────────────────────────────────────────────────────────────────────────────
 02-12 14:50   签收         Châtenay    Delivered Yard PIN:No                  Livré brodeur, PIN: Non
 02-12 14:49   快递员收件    Châtenay    The driver is out for delivery        Le chauffeur est en route
 02-12 14:49   站点签出      TESTLQ      Preparing for delivery               Le colis est prêt à être livré
 02-12 14:48   站点签入      TESTLQ      Arrived at station                   Votre colis est arrivé
 02-12 14:48   转运中心签出   PARIS       The package left sorting center      Colis en cours d'acheminement
 02-12 07:48   转运中心签入   PARIS       arriver in sorting center            signé PRS
 02-12 14:43   已下单                    Your package is being prepared         CPN a reçu les informations
```

- 按 `operationTime` 从新到旧排列（最新的在最上面）
- `节点` 列根据 `operationMove` 编码翻译成中文
- `英文描述` 列展示 `enContext`
- `本地描述` 列展示 `pubEsContext`（法语/西班牙语/荷兰语等）
- 某字段为空则对应列留空

## 返回数据格式

```json
{
  "code": 200,
  "data": [
    {
      "operationMove": "208",
      "orderNo": "UAT4837897377432",
      "enContext": "The courier is out for delivery",
      "pubEsContext": "De koerier is onderweg voor levering",
      "location": "test01-1",
      "thirdWaybillNo": "UAT4837897377432",
      "operator": "test_delivery",
      "operationTime": "2024-07-31 10:58:24"
    }
  ]
}
```

| 字段 | 说明 |
|---|---|
| `orderNo` | 运单号 |
| `thirdWaybillNo` | 客户单号 |
| `operationMove` | 轨迹编码（见下方编码表） |
| `enContext` | 英文描述 |
| `pubEsContext` | 本地语描述 |
| `location` | 发生地点 |
| `operator` | 操作人 |
| `operationTime` | 操作时间 |

## 轨迹编码表

| 编码 | 节点名称 | | 编码 | 节点名称 |
|---|---|---|---|---|
| 8 | 扣件 | | 261 | 退件到站 |
| 100 | 已下单 | | 262 | 退件到仓 |
| 200 | 转运中心签出 | | 264 | 退件待装车 |
| 201 | 站点签入 | | 265 | 预报未到 |
| 202 | 转运中心签入 | | 300 | 丢失 |
| 203 | 站点签出 | | 301 | 被抢 |
| 204 | 退回转运中心 | | 410 | 装车 |
| 205 | 签收 | | 411 | 车辆出发 |
| 206 | 派送异常 | | 412 | 车辆到达 |
| 208 | 快递员收件 | | 413 | 卸车 |
| 209 | 退回站点 | | 500 | 扫描分拣 |
| 210 | 弃件销毁 | | 600 | 组托扫描 |
| 217 | 集包 | | 601 | 上架 |
| 218 | 重派扫描 | | 602 | 下架 |
| 256 | 待出库 | | 611 | 拒绝退回 |
| 257 | 退件签收 | | 612 | 中心到件 |
| 259 | 退件出库 | | 700 | 站点疑似丢失 |
| 260 | 站点到件 | | | |

## 参数

| 参数 | 环境变量 | 说明 |
|---|---|---|
| `--app-id` | `TRACK_APP_ID` | GoFoExpress App ID |
| `--app-secret` | `TRACK_APP_SECRET` | GoFoExpress App Secret |
| `--domain` | `TRACK_DOMAIN` | API 域名（默认: `https://uat-api-eu.gofoexpress.com`） |
