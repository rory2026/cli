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
set TRACK_APP_SECRET=*** 第 3 步 查询轨迹

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
set TRACK_APP_SECRET=*** 查询轨迹
track-cli GFFR26043939146721

# 或一行完成
track-cli GFFR26043939146721 --app-id 6e16d3c70ced --app-secret c44c...1a8
```

## 返回数据说明

```json
{
  "code": 200,
  "message": "操作成功",
  "messageEn": "Success",
  "status": 1,
  "data": [
    {
      "operationMove": "208",
      "orderNo": "UAT4837897377432",
      "enContext": "The courier is out for delivery",
      "location": "test01-1",
      "thirdWaybillNo": "UAT4837897377432",
      "pubEsContext": "De koerier is onderweg voor levering",
      "operator": "test_delivery",
      "operationTime": "2024-07-31 10:58:24"
    }
  ]
}
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `orderNo` | 运单号 |
| `thirdWaybillNo` | 客户单号 |
| `operationMove` | 轨迹编码 |
| `enContext` | 轨迹英文描述 |
| `pubEsContext` | 本地语轨迹描述 |
| `location` | 轨迹发生地点 |
| `operator` | 操作人姓名 |
| `operationTime` | 操作时间 |

### 给用户展示格式

Agent 查询到轨迹数据后，应按以下格式以**表格**呈现给用户：

```
 时间          节点       地点        英文描述                              本地描述
──────────────────────────────────────────────────────────────────────────────────────
 02-12 14:50  签收      Châtenay    Delivered Yard PIN:No                   Livré brodeur, PIN: Non
 02-12 14:49  快递员收件  Châtenay    The driver is out for delivery         Le chauffeur est en route
 02-12 14:49  站点签出    TESTLQ      Preparing for delivery                Le colis est prêt à être livré
 02-12 14:48  站点签入    TESTLQ      Arrived at station                    Votre colis est arrivé
 02-12 14:48  转运中心签出 PARIS       The package left sorting center       Colis en cours d'acheminement
 02-12 07:48  转运中心签入 PARIS       arriver in sorting center             signé PRS
 02-12 14:43  已下单                 Your package is being prepared          CPN a reçu les informations
```

- 按 `operationTime` 从新到旧排列（最新的在最上面）
- `节点` 列根据 `operationMove` 编码翻译成中文节点名称
- `英文描述` 列展示 `enContext`
- `本地描述` 列展示 `pubEsContext`（西班牙语/法语/荷兰语等）
- 如果某字段为空则对应列留空
- 表头加粗或添加分隔线以清晰区分

### 轨迹编码表

| 编码 | 节点名称 |
|---|---|
| 8 | 扣件 |
| 100 | 已下单 |
| 200 | 转运中心签出 |
| 201 | 站点签入 |
| 202 | 转运中心签入 |
| 203 | 站点签出 |
| 204 | 退回转运中心 |
| 205 | 签收 |
| 206 | 派送异常 |
| 208 | 快递员收件 |
| 209 | 退回站点 |
| 210 | 弃件销毁 |
| 217 | 集包 |
| 218 | 重派扫描 |
| 256 | 待出库 |
| 257 | 退件签收 |
| 259 | 退件出库 |
| 260 | 站点到件 |
| 261 | 退件到站 |
| 262 | 退件到仓 |
| 264 | 退件待装车 |
| 265 | 预报未到 |
| 300 | 丢失 |
| 301 | 被抢 |
| 410 | 装车 |
| 411 | 车辆出发 |
| 412 | 车辆到达 |
| 413 | 卸车 |
| 500 | 扫描分拣 |
| 600 | 组托扫描 |
| 601 | 上架 |
| 602 | 下架 |
| 611 | 拒绝退回 |
| 612 | 中心到件 |
| 700 | 站点疑似丢失 |

## 参数说明

| 选项 | 环境变量 | 说明 |
|---|---|---|
| `--app-id` | `TRACK_APP_ID` | GoFoExpress 开放平台 App ID |
| `--app-secret` | `TRACK_APP_SECRET` | GoFoExpress 开放平台 App Secret |
| `--domain` | `TRACK_DOMAIN` | API 域名（默认: `https://uat-api-eu.gofoexpress.com`） |
