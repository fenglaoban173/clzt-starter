# 创量智投 · 批量广告搭建平台（前端原型）

> **当前交付：纯前端可交互原型，本地模拟数据。** 所有列表、下拉、筛选、提交、预览、明细均由前端 `src/mock/data.js` 提供模拟数据，**不连接后端、不请求巨量真实接口**；表单字段与枚举对齐巨量广告升级版「创建项目 / 创建营销」官方文档。界面布局与交互对照创量标准版（仅巨量相关，其他媒体不做）。

对接巨量引擎开放平台的批量广告搭建与投放看板原型。覆盖：**登录 → 工作台 → 推广（账户 / 项目 / 广告 / 托管方案 / 铺剧助手 / 批量搭建）→ 素材库 → 资产库 → 任务中心 → 数据看板 → 管理** 全链路页面。

- 前端：Vue 3 + Vite 6 + Element Plus + @element-plus/icons-vue + Pinia + Vue Router + dayjs + Less
- 无后端、无数据库、无真实网络请求；API 封装在 `src/api/media.js`，方法签名预留，后续接真实后端时把该层换回 HTTP 调用即可。

## 启动

```bash
cd frontend
npm install
npm run dev      # 默认 http://localhost:5173（端口占用时自动顺延）
npm run build    # 产出 dist/
```

原型本地账号（密码任意 ≥6 位即可登录）：

| 用户名 | 角色 | 说明 |
| --- | --- | --- |
| admin | admin | 管理员，可见管理菜单 |
| op_test | operator | 优化师 |
| viewer | viewer | 只读 |

## 目录结构

```
clzt-starter/
└── frontend/
    ├── vite.config.js        # Vite + Vue 插件，@ 别名指向 /src（无后端代理）
    └── src/
        ├── api/media.js      # 授权 / 素材 / 搭建 / 运营 / 报表 / 资产 / 任务 mock 封装
        ├── mock/data.js      # 全部模拟数据与巨量枚举口径
        ├── store/auth.js     # Pinia 会话态（localStorage 持久化）
        ├── router/index.js   # 登录守卫 + 角色守卫
        ├── layout/AppLayout.vue  # 顶部横向导航 + 悬停下拉
        └── views/            # Login / Dashboard / media/* / build/* / asset/* / admin/*
```

## 导航结构（对照创量标准版）

顶部一级导航，鼠标移入展开二级下拉：

- **首页**：工作台概览
- **推广**：账户、项目、广告、托管方案、铺剧助手、批量搭建
- **报表**：账户 / 项目 / 广告 / 素材 / 组件报表（页内页签切换）、报表订阅与经营分析（原型占位）
- **素材**：素材库（视频 / 图片 / 标题包 / 落地页等）
- **资产**：资产总览、巨量商品库、巨量应用、小程序/小游戏、短剧推广链接、人群包、定向包、落地页、事件管理（部分占位）
- **任务**：任务中心
- **管理**：账户管理、用户管理（仅 admin）

## 巨量字段与规则口径（按开放平台文档落地于 mock）

- **项目层级**：`advertiser_id`、`operation`、`delivery_mode`、`landing_type`、`app_promotion_type`、`marketing_goal`、`ad_type`、`delivery_type`、`name`、`asset_type`、`micro_promotion_type`、`download_url/app_name/download_type/launch_type/open_url/subscribe_url`、`optimize_goal{asset_ids,external_action,deep_external_action,deep_bid_type}`、`delivery_range{inventory_catalog,inventory_type,union_video_type}`、`audience{audience_package_id,district,geolocation,city,location_type,gender,age,retargeting_tags_include/exclude,interest_action_mode,action_days,action_categories,action_words,hide_if_converted}`。
- **单元层级**：`advertiser_id`、`project_id`、`name`（1-50 字不可重复）、`operation`、`promotion_materials{video_material_list,image_material_list,title_material_list,external_url_material_list}`、`native_setting{aweme_setting_type,aweme_id,anchor_related_type}`、`source`、`is_comment_disable`、`ad_download_status`、`budget_mode`、`budget`、`bid`、`cpa_bid`、`deep_cpabid`、`roi_goal`、`first_roi_goal`、`auto_extend_traffic`、`keywords[{word,match_type,bid}]`。
- **预算出价区间**：日预算 CPM/CPC ≥100、oCPM/oCPC ≥300；bid CPM 4-100、CPC 0.1-100；`cpa_bid` 0.01-10000；`deep_cpabid` 0.1-10000；`roi_goal` (0,5]。
- **枚举联动**：落地页类型（APP/LINK/MICRO_GAME/SHOP/QUICK_APP/NATIVE_ACTION/DPA）联动投放载体、优化目标、深度目标；计费方式联动预算下限与出价字段。

## 已知边界（原型占位，未独立成页）

报表订阅、经营分析 / 人效 / 财务 / 资金使用率；巨量商品库、巨量应用、小程序/小游戏、短剧推广链接、试玩/直玩素材、原生锚点模板、专辑链接、组图管理、标签管理、穿山甲媒体包、定向模板、微信生态类落地页与资产组管理等，在顶部下拉中以占位项呈现，点击给出「原型暂未开放」提示。
