# 巨量资产模块：官方 CRUD API × 本地原型功能对照

> 调研日期：2026-11-13
> 依据：巨量商业开放平台《接口清单（Scope 权限点）》`https://open.oceanengine.com/labels/9/docs/1699352157034496`，及本地 `frontend/src/api/openapi.js`、`api/media.js`、`mock/data.js`、`views/asset/AssetList.vue`。
> 说明：本地为纯前端 mock，「本地 mock」指已在 openapi.js / data.js 铺的占位方法与集合，并非真实联调；接口路径以联调时最新文档为准。

## 一、结论速览

按官方开放程度分三类：

- **A. 官方有完整/较完整增删改查（可在原型补 mock 增删改界面）**：定向包、自定义人群包、落地页（橙子站/第三方/程序化组）、巨量商品库、小程序/小游戏、创意组件、原生锚点模板、专辑链接（图集）、评论管理（回复/隐藏/屏蔽）。
- **B. 官方部分读写（有上传/创建/绑定，编辑/删除受限或依附其他模块）**：事件管理与监测链接、短剧推广链接、穿山甲媒体包、试玩/直玩素材、巨量应用（仅分包/解析，无应用本体新建）。
- **C. 官方无独立资产 CRUD（只读或依附创编，原型不宜做独立增删改）**：直达链接、动态链接（口径待确认）、文案库、资产组。

## 二、19 类逐项对照

| # | 菜单（kind） | 巨量官方接口（R 查 / C 增 / U 改 / D 删） | 本地 mock / api 现状 | 页面现状 | 可补的原型功能 |
|---|---|---|---|---|---|
| 1 | 事件管理 `event` | R 投放资产 `/tools/event/assets/get/`；R 事件/优化目标 `/event_manager/optimized_goal/get/`；监测链接 C/U `/event_manager/track_url/create·update/`、R `/get/` | `eventApi.assetList/eventList/trackUrlList·create·update` 已铺 mock；`eventAssets` 集合 | 只读列表，操作列仅「查看」占位 | 事件资产查看；监测链接新建/编辑弹窗；回传公钥增删启停 |
| 2 | 定向包 `orientation` | R `/audience_package/get/`；C `/create/`；U `/update/`；D `/delete/`；绑定/解绑计划 | `targetApi.audiencePackageList·create·update·remove·bind·unbind` 已铺 mock；`orientationPackages` 集合 | 只读 | 新建/编辑/删除定向包；绑定/解绑广告；复制 |
| 3 | 自定义人群包 `audience` | R 创编可用 `/local/custom_audience/get/`；DMP R/C/U/D/规则/复制/发布/推送 `/dmp/custom_audience/select·read·delete·rule·copy·publish·push_v2/`；数据源文件上传 | `targetApi.customAudienceList·detail·create·update·remove·copy·publish·push`、`dataSourceList·upload` 已铺 mock；`customAudiences/dataSources` 集合 | 只读 | 新建/编辑/删除人群包；上传数据源；复制/发布/推送；覆盖量查看 |
| 4 | 落地页 `landing_page` | 橙子站 R/C/U/复制/预览/转赠 `/tools/site/get·create·update·copy·preview·handsel/`；第三方 R/U/D/预览 `/tools/third_site/get·update·delete·preview/`；程序化组 R/C/U `/tools/landing_group/get·create·update/` | `siteApi.siteList·detail·preview·create·update·copy`、`thirdSiteList`、`landingGroupList·create` 已铺 mock；`sites/thirdSites/landingGroups` 集合 | 只读 | 新建/编辑/复制站点；预览；第三方落地页登记；程序化组新建 |
| 5 | 直达链接 `deep_link` | **无独立资产 CRUD**；deeplink 在应用下载/调起、落地页配置内填写 | `mockDb.deepLinks` 只读；openapi 未铺写 | 只读（与「动态链接」复用同一集合） | 仅查看/登记；不做独立编辑删除 |
| 6 | 动态链接 `deep_link`（本地复用） | **口径待确认**：可能对应动态创意词包 `/tools/creative_word/select·create·update·delete/`，或动态监测链接；需在创量侧确认定义 | 本地复用 `deepLinks`，无独立集合 | 只读 | 先确认业务定义再定接口；暂按只读 |
| 7 | 监测活动 `monitor` | R/C/U `/event_manager/track_url/get·create·update/` | `eventApi.trackUrlList·create·update` 已铺 mock；`trackUrls` 集合 | 只读 | 新建/编辑监测链接；复制；状态查看 |
| 8 | 文案库 `copywrite` | **无独立开放 CRUD**；标题/文案属创意素材库，在创编内挂载选用 | `mockDb.copywrites` 只读；openapi 未铺写 | 只读 | 仅查看/搜索；登记文案可后置 |
| 9 | 资产组 `asset_group` | **无统一资产组 CRUD**；官方为素材分组/定向包分组，按模块管理 | `mockDb.assetGroups` 只读；openapi 未铺写 | 只读 | 仅查看组内素材；分组增删后置 |
| 10 | 巨量商品库 `product` | R `/dpa/meta·category·detail/get/`；商品 C/U/D/状态批量；投放条件/词包/分类；品牌模糊查询 | `productApi.dpaList·detail·create·update·delete`、`condition/category/dictWordList`、`brandFuzzy` 已铺 mock；`dpaProducts` 集合 | 只读 | 新建/编辑/删除商品；上下架；分类/词包查看 |
| 11 | 巨量应用 `app` | R 列表/详情 `/tools/app_management/app/get/`；安卓/iOS/鸿蒙列表；分包 C `/extend_package/create/`、母包解析、共享关系；**无应用本体开放新建** | `appApi.appDetail·androidList·iosList·extendPackage·shareList` 已铺 mock；`apps/iosApps/appExtends` 集合 | 只读 | 应用详情/版本分包查看；分包登记；共享关系；不做应用新建 |
| 12 | 小程序/小游戏 `mini_game` | C/R 微信小程序 `/tools/wechat_applet/create·list/`；微信小游戏 `/tools/wechat_game/create·list/`；字节小程序 `/tools/micro_app/create·list/`；共享/取消共享；归因激活窗 | `miniApi.wechatApplet·wechatGame·microApp·microGameList·shareList·convertWindow` 已铺 mock（**无 create 写方法**）；`wechatApplets/microApps/miniGames` 集合 | 只读 | 补齐 create mock；新建/编辑小程序小游戏；共享/取消共享；归因窗配置 |
| 13 | 短剧推广链接 `drama_link` | R 授权状态 `/dpa/playlet/auth/`；R 可投状态 `/dpa/album_status/get/`；C 剧目上传 `/dpa/album/create/` | `productApi.dramaAuth·dramaStatus·dramaUpload` 已铺 mock；`dramaLinks/albums` 集合 | 只读 | 剧目上传/登记；授权与可投状态查看 |
| 14 | 穿山甲媒体包 `csj_package` | R `/tools/union/flow_package/get/`；C `/create/`；U/D 清单待核；rit 数据 | `mockDb.csjPackages` 只读；openapi 未铺写 | 只读 | 新建媒体包；列表/覆盖量查看；编辑删除待官方口径确认 |
| 15 | 试玩/直玩素材 `interactive` | R `/tools/playable_list/get/`；C 上传 `/tools/playable/upload/`；推送 `/tools/playable/grant/`；关联试玩 `/tools/rubeex_playable/list/` | `materialApi.playableList` 仅 list；`interactiveMaterials` 集合 | 只读 | 上传试玩素材；推送授权；关联查看；删除后置 |
| 16 | 创意组件 `component` | R/C/U `/assets/creative_component/get·create·update/` | `mockDb.adComponents` 只读；openapi 未铺写 | 只读 | 新建/编辑组件；组件预览；删除后置 |
| 17 | 原生锚点模板 `anchor` | R `/native_anchor/get/`；C/U/D `/create·update·delete/`；详情/二维码预览 | `mockDb.anchors` 只读；openapi 未铺写 | 只读 | 新建/编辑/删除锚点；详情与二维码预览 |
| 18 | 评论管理 `comment` | R `/tools/comment/get/`；回复/隐藏/操作 `/reply·operate·hide/`；指标 `/metrics/`；屏蔽词 R/C `/terms_banned/get·create/`；屏蔽抖音号 CRUD | `mockDb.commentMgmt` 只读；openapi 有 `commentDetail/bannedTerms/bannedAwemes` 集合但视图未接 | 只读 | 回复/隐藏评论；屏蔽词与屏蔽号管理；评论指标查看 |
| 19 | 专辑链接（图集）`album` | C/R/U/D `/carousel/create·list·ad/get·delete·update/` | `mockDb.albums` 只读；openapi 未铺写（`dramaStatus` 复用 albums） | 只读 | 上传/新建图集；编辑；批量删除；同主体图集查看 |

## 三、页面统一差距（当前 `AssetList.vue`）

1. **全部 18 个 kind 均为只读列表**：操作列只有「查看」，点击 `ElMessage` 占位；无新增、编辑、删除、上传、绑定、批量启停按钮与对应弹窗/抽屉。
2. **数据源未接 openapi 写层**：列表走 `media.js assetApi.byKind(kind)` 直读 mock 集合；`openapi.js` 已铺的 CRUD mock（定向包/人群包/商品/建站/监测链接/公钥等）尚未被视图调用。
3. **写方法缺口**：小程序小游戏、创意组件、锚点、图集、评论屏蔽、文案库、资产组、直达/动态链接、穿山甲包、试玩素材在 openapi.js 仍缺 create/update/delete 占位。
4. **「动态链接」无独立口径**：菜单与「直达链接」共用 `deep_link` 集合，业务定义待确认。
5. **无表单校验与回显**：即便补 mock 写操作，也需补必填校验、列表本地增删改回显、操作结果提示。

## 四、原型落地建议（分批，纯 mock）

- **P1（官方有完整 CRUD，优先补界面）**：定向包、人群包、落地页、商品库、创意组件、原生锚点、图集、评论管理、小程序/小游戏（补 create）。
  - 每页统一：工具栏「新建」主按钮 + 行内「编辑 / 删除 / 更多」；右侧抽屉或弹窗表单；本地列表增删改回显；查看详情抽屉。
- **P2（部分读写，按接口能力补）**：事件/监测链接、短剧链接、穿山甲包、试玩素材、应用分包。
  - 只做官方支持的操作（上传/创建/绑定/查看），不补无官方依据的编辑删除。
- **P3（只读或待确认）**：直达链接、文案库、资产组、动态链接。维持只读；动态链接待业务定义确认后再排接口。
- **前置统一改造**：AssetList 按 kind 接入对应 openapi.js 域方法；抽公共「新建/编辑抽屉」骨架与表单校验；写操作先改本地 mock 列表回显，预留真实 API 替换位。
