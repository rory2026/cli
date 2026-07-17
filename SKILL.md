---
name: track-cli
description: "订单 OpenAPI CLI：创建订单、取消订单、查询轨迹"
version: 2.0.0
author: Rory Yang
---

# Order CLI 安装与使用指南

以下步骤面向 AI Agent。该工具对接订单 OpenAPI，支持创建订单、取消订单和查询轨迹。

## 背景与使用场景

当用户需要通过命令行操作订单 API 时使用：

- 根据 JSON 创建订单
- 按订单号取消订单
- 按运单号查询完整轨迹

## 环境要求

- Node.js 18 或更高版本
- npm
- 可访问目标 API 域名
- 开放平台 App ID 和 App Secret

## 第 1 步 安装

```shell
npm install -g https://github.com/rory2026/cli
track-cli --help
```

## 第 2 步 获取并配置凭证

Agent 应提示用户：

> 请提供开放平台 App ID 和 App Secret，我将用于调用订单 API。

用户提供后，在当前 Git Bash 会话中设置：

```shell
export TRACK_APP_ID="<用户提供的 App ID>"
export TRACK_APP_SECRET="<用户提供的 App Secret>"
```

可选配置：

```shell
export TRACK_DOMAIN="https://uat-api-eu.gofoexpress.com"
export TRACK_ROUTE_COUNTRY="FR"
```

不要在回复、日志或提交中明文展示 App Secret。

## 第 3 步 创建订单

推荐把完整请求体保存为 JSON 文件，再执行：

```shell
track-cli create --file order.json
```

也支持内联 JSON：

```shell
track-cli create --data '{"cOrderNo":"ORDER-001","productType":"EXP"}'
```

执行真实创建前，建议先校验请求结构和签名流程（不会获取 Token，也不会调用业务接口）：

```shell
track-cli create --file order.json --dry-run
```

项目内提供 `order.example.json` 作为字段结构示例。创建订单属于有外部副作用的操作；Agent 必须确认用户明确要求创建，且订单数据已核对，再执行非 `--dry-run` 命令。

## 第 4 步 取消订单

```shell
track-cli cancel <订单号> --remarks "<取消原因>"
```

示例：

```shell
track-cli cancel GFFR26043939146721 --remarks "客户取消"
```

取消订单属于不可忽略的外部副作用；Agent 必须在订单号和原因明确后执行。

## 第 5 步 查询轨迹

```shell
track-cli track <运单号>
```

示例：

```shell
track-cli track GFFR26043939146721
```

兼容旧用法：

```shell
track-cli GFFR26043939146721
```

## 参数说明

| 参数 | 环境变量 | 说明 |
|---|---|---|
| `--app-id` | `TRACK_APP_ID` | 开放平台 App ID |
| `--app-secret` | `TRACK_APP_SECRET` | 开放平台 App Secret |
| `--domain` | `TRACK_DOMAIN` | API 域名，默认 UAT |
| `--route-country` | `TRACK_ROUTE_COUNTRY` | 路由国家，默认 `FR` |
| `--dry-run` | — | 输出业务请求但不获取 Token、不发送业务请求 |
| `create --file` | — | 从 UTF-8 JSON 文件读取创建订单请求体 |
| `create --data` | — | 从命令行读取创建订单 JSON |
| `cancel --remarks` | — | 取消原因，必填 |

## API 与签名规则

| 命令 | 方法 | URI |
|---|---|---|
| 获取 Token（内部自动） | POST | `/openapi/oauth2/token` |
| `create` | POST | `/open-api/v2/order/create` |
| `cancel` | POST | `/open-api/v2/order/cancel` |
| `track` | GET | `/open-api/v2/order/track/{trackingNo}` |

- Token 请求是裸 POST，仅包含 JSON `Content-Type`，不签名。
- 业务请求使用 HMAC-SHA256，签名字段按键名字典序连接。
- POST 签名中的 `body` 与实际发送的 JSON 字符串完全一致。

## 返回数据说明

CLI 将 API 响应原样格式化为 JSON：

| 字段 | 说明 |
|---|---|
| `code` | 业务状态码，通常 `200` 表示成功 |
| `msg` / `msgEn` | 中文/英文状态消息 |
| `data` | 业务数据；轨迹查询时为轨迹列表 |
| `orderNo` | 运单号 |
| `operationMove` | 轨迹节点编码 |
| `operationTime` | 操作时间 |
| `location` | 发生地点 |
| `enContext` | 英文轨迹描述 |
| `pubEsContext` | 本地语轨迹描述 |

## 轨迹编码表

| 编码 | 节点名称 | 编码 | 节点名称 |
|---|---|---|---|
| 100 | 已下单 | 200 | 转运中心签出 |
| 201 | 站点签入 | 202 | 转运中心签入 |
| 203 | 站点签出 | 205 | 签收 |
| 206 | 派送异常 | 208 | 快递员收件 |
| 217 | 集包 | 300 | 丢失 |
| 410 | 装车 | 411 | 车辆出发 |
| 412 | 车辆到达 | 413 | 卸车 |
| 500 | 扫描分拣 | 600 | 组托扫描 |

## 给用户展示轨迹的格式

按 `operationTime` 倒序排列，编码翻译为中文，同时保留英文和本地语描述：

| 时间 | 节点 | 地点 | 英文描述 | 本地描述 |
|---|---|---|---|---|
| 02-12 14:50 | 签收 | Châtenay-Malabry | Delivered Yard PIN: No | Livré brodeur, PIN: Non |

## 完整示例

```shell
npm install -g https://github.com/rory2026/cli
export TRACK_APP_ID="<App ID>"
export TRACK_APP_SECRET="<App Secret>"
track-cli create --file order.json --dry-run
track-cli track GFFR26043939146721
```
