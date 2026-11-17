# 巨量营销全链路 API 盘点 × 本地原型差距清单

> 调研日期：2026-11-13
> 依据：巨量引擎开放平台《接口清单（Scope 权限点）》`https://open.oceanengine.com/labels/9/docs/1699352157034496`，及巨量营销升级版 / 智擎版 API 文档。
> 范围：创量「巨量广告」三媒体——标准（`upgrade`）、全域（`uni`）、智擎（`oc`）的竞价投放主链路。**不含**巨量星图、Dou+、本地推、品牌广告、代理结算返点/发票、MCN/服务商、万花筒 AIGC 等非复刻线。
> 说明：本地为纯前端 mock，下表「本地现状」指 `frontend/src/api/media.js` 与 `mock/data.js` 已模拟的能力，并非真实联调；缺失项是后续接后端 / 真实 API 时的补齐范围。

## 一、本地现状速览（已有 mock 域）

| 本地 API 封装 | 已模拟能力 |
|---|---|
| `mediaApi` | 授权链接占位 `startAuth`、授权账户列表 `accounts`、绑定 `bind`、解绑 `unbind` |
| `assetApi` | 素材/资产列表 `list`、上传 `upload`、登记 `register`、删除 `remove`；18 类资产 `byKind`（文案/直达链接/组件/评论/人群包/定向包/监测活动/事件/落地页/资产组/商品/应用/小游戏/短剧链接/穿山甲包/试玩直玩/锚点/专辑） |
| `buildApi` | 搭建预览 `preview`、提交 `submit`、任务列表 `tasks`、任务明细 `taskDetail`、取消 `cancelTask`、重试 `retryItem`；策略模板 `templates/saveTemplate/templateDetail`；项目 `projects`、广告 `ads` |
| `autoApi` | 托管方案列表 `list`、保存 `save` |
| `dramaApi` | 铺剧规则列表 `list`、保存 `saveRule` |
| `operationApi` | 批量启停 `batchStatus`、在投配额 `quota` |
| `reportApi` | 账户汇总 `accountSummary`、素材排行 `materialRanking`、分维度报表 `dimensionReport`、异步任务创建 `createAsyncTask`、轮询 `pollAsyncTask`、快照 `snapshots` |
| `userApi` | 内部用户列表/新建（系统内，非巨量接口） |

## 二、全链路 API 地图 × 覆盖对照

### 阶段 0：账号授权与凭证（OAuth2.0）

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 授权链接生成 / 回调 | 申请授权链接、回调 code 换取 Access Token | 仅 `startAuth` 返回占位 `auth_url='#'` | **缺失**：真实授权链接、code 换 token、回调处理 |
| 凭证管理 | 获取 Access Token、APP Access Token、刷新 Refresh Token、获取已授权账户、授权 User 信息 | 无 | **缺失**：token 获取/刷新/有效期、已授权账户拉取 |
| 权限点 Scope | 按一级/二级类目申请授权范围 | 无 | **缺失**：Scope 申请与授权状态校验（联调前置） |

### 阶段 1：账户、资质与资金

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 客户信息 | `/advertiser/info/`、`/advertiser/adv_info/list/` 批量账户 | `accounts` 只读 mock 列表 | **部分**：有列表；缺详情、公开信息、账户状态/余额/日预算实时读取 |
| 主体/投放/产品资质 | `/advertiser/qualification/select/`、`/delivery_qualification/submit/list/`、`/delivery_pkg/get/`、附件上传、对公验证 | 无 | **缺失**：资质查询/提交/删除、推广产品资质规则 |
| 头像管理 | `/advertiser/avatar/get/submit/upload/` | 无 | **缺失**（后置） |
| 代理商 | `/agent/advertiser/select/`、`/agent/child_agent/select/`、`/agent/info/`、账户复制、挂接销售、分配/解绑 | 无 | **缺失**（代理商场景，后置） |
| 工作台组织（EBP） | `/ebp/advertiser/list/`、组织/子组织 CRUD、绑定解绑、账户转移、角色权限、认证主体、离线拉取任务 | 无 | **缺失**（组织架构场景，后置） |
| 资金流水 | `/advertiser/fund/get/` 余额、`/fund/daily_stat/` 日流水、`/fund/transaction/get/` 流水明细、可转账余额、共享钱包、充值校验/汇款码/对公充值、转账 | 无 | **缺失**：余额/流水/日预算读写、钱包与转账（原型列表仅静态列头） |
| 账户日预算 | `/advertiser/budget/get/`、`/advertiser/update/budget/` | 无 | **缺失**：日预算查询与更新 |

### 阶段 2：投放创编——项目 / 单元 / 创意（主链路核心）

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 计划组（campaign） | `/campaign/get/`、品牌组编辑/删除/操作 | 无 | **缺失**（标准分层中的计划组层） |
| 项目-标准/升级版 | `/project/create/update/delete/status/update/`、`/project/budget/update/`、`/project/week_schedule/update/`、`/project/schedule_time/update/`、`/project/cpa_bid/update/`、`/project/roigoal/update/` | `projects` 只读；搭建 `submit` 走本地任务模拟 | **部分→缺写接口**：缺项目创建/更新/删除/批量启停/预算/出价/投放时段/ROI 系数更新、项目详情与审核建议 |
| 项目-全域 | `/uni_project/create/`、`/uni_project/update/`、`/uni_project_list/get/`、`/uni_project/monetization_mode/update/` | `uni` 项目只读 mock | **缺失**：全域项目创编/编辑/变现模式更新 |
| 项目-智擎（OC） | `/std_project/create/update/`、`/oc_project/material/create/delete/status/update/`、`/oc_project/reject_reason/get/`、`/oc_project/tools/compensate_history_list/get/` | `oc` 项目只读 mock | **缺失**：智擎标准项目 CRUD、项目素材增删改状态、审核建议、保障历史 |
| 单元（广告） | `/promotion/create/update/delete/status/update/`、`/promotion/budget/update/`、`/promotion/bid/update/`、`/promotion/deepbid/update/`、`/promotion/schedule_time/update/`、`/promotion/material/delete/`、`/project/deep_cpa_bid/update/` | `ads` 只读；`batchStatus` 批量启停模拟 | **部分→缺写接口**：缺单元创建/编辑/删除/预算/出价/深度出价/时段更新、素材解绑、详情、单元审核建议 |
| 创意 | 素材绑定客户 `/file/material/bind/`、创意 CRUD（品牌线 `/brand/creative/*`）、单元素材状态 `/material/status/update/` | 搭建内选素材/图片/标题包，本地组合预览 | **缺失**：创意与素材挂载、创意状态批量更新、创意详情 |
| 创编前置查询 | 优化目标 `/event_manager/optimized_goal/get(_v2)`、深度方式 `/event_manager/dbt/get/`、建议出价 `/tools/bids/suggest/`、预估点击成本 `/tools/estimated_price/get/`、行业列表、行动号召、可用转化 ID `/tools/ad_convert/select/` | 表单内联枚举字典（本地常量） | **部分**：枚举已内置；缺按账户/目的动态拉取可用目标、深度方式、建议出价、转化 ID |
| 关键词 | `/keyword/create/update/delete/`、`/keyword/list/get/`、`/sugg_words/` 推荐、蓝海词包 | 搭建表单含关键词包（本地常量） | **缺失**：关键词 CRUD、列表、推荐词、匹配方式/出价读写 |

### 阶段 3：定向与人群

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 定向包 | `/audience_package/get/create/update/delete/`、绑定/解绑计划、关联项目查询 | `orientationPackages` 只读列表 | **部分**：缺定向包 CRUD、绑定/解绑 |
| DMP 人群包 | `/dmp/custom_audience/select/read/delete/rule/copy/publish/push_v2/`、数据源文件上传/创建/更新 | `audiencePackages` 只读列表 | **缺失**：人群包 CRUD、规则包、上传/推送/发布/复制、数据源管理 |
| 行为兴趣词 | `/tools/interest_action/interest/action category/keyword/`、`/id2word/`、`/keyword/suggest/` | 表单内联行为兴趣模式/天数枚举 | **缺失**：类目/关键词下拉查询、id 转词、推荐词 |
| 受众预估 / 地域 | `/report/...` 受众画像、地域列表 | 无 | **缺失**：受众预估、地域/商圈查询（后置） |

### 阶段 4：素材、商品、应用资产

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 素材上传 | `/file/video/ad/`、`/file/image/ad/`、`/file/audio/ad/`、异步上传 `/file/upload_task/create/` + 结果轮询、试玩直玩 `/file/playable/create/` | `assetApi.upload` 本地模拟登记 | **部分**：缺异步上传任务与轮询、音频、试玩/直玩上传 |
| 素材查询/管理 | `/file/video/get`、`/file/image/get`、`/file/material/list/detail/`、智能封面 `/tools/video_cover/suggest/`、评估标签、低效素材 `/file/video/efficiency/get/`、机审结果、抖音主页视频、图文素材、素材清理任务、素材共享（EBP） | `videos/images` 只读；`byKind` 18 类只读 | **部分**：缺素材详情/标签/封面/低效判定/清理任务/共享范围/组织素材库 |
| 商品库 / DPA | `/dpa/meta/get/`、`/dpa/detail/get/`、商品新增/修改/删除/状态批量、投放条件 V2、词包/分类/视频模板、品牌模糊查询 | `products` 只读 | **缺失**：DPA 商品 CRUD、投放条件、词包分类、品牌查询 |
| 短剧商品 | `/dpa/playlet/auth/` 授权状态、`/dpa/album/create/`、`/dpa/album_status/get/` 可投状态、剧目上传 | `dramaLinks` 只读 | **缺失**：短剧授权/可投状态/剧目上传 |
| 应用 / 分包 | `/tools/app_management/app/get/`、安卓/ iOS/鸿蒙列表、分包创建/版本更新、母包解析/发布、共享关系、SKAN 权限 | `apps` 只读 | **缺失**：应用详情、分包/版本、包解析、共享授权 |
| 小程序 / 小游戏 | 微信/字节 小程序小游戏 创建/更新/列表、共享关系、归因激活时间窗 | `miniGames` 只读 | **缺失**：CRUD、共享、归因窗 |
| 创意组件 / 锚点 | `/assets/creative_component/create/update/get/`、`/native_anchor/create/update/delete/get/detail/qrcode_preview/` | `adComponents`、`anchors` 只读 | **部分**：缺组件/锚点 CRUD 与预览 |
| 图集 | `/carousel/create/list/ad/get/delete/update/` | `albums` 只读 | **缺失**：图集 CRUD |
| 评论 / 屏蔽 | `/tools/comment/get/reply/operate/reply/hide/metrics/`、屏蔽词 CRUD、屏蔽抖音号 CRUD | `commentMgmt` 只读 | **部分**：缺评论回复/隐藏/屏蔽操作、屏蔽词与屏蔽号管理 |

### 阶段 5：建站与线索

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 橙子建站 | `/tools/site/create/update/update_status/copy/handsel/`、站点列表/详情/预览、模板 | `landingPages` 只读 | **缺失**：站点 CRUD/复制/转赠/预览/模板 |
| 第三方 / 程序化落地页 | `/tools/third_site/get/update/delete/preview/`、`/tools/landing_group/create/update/get/` | 无 | **缺失** |
| 线索通组件 | 表单 `/clue/form/*`、智能电话 `/clue/smartphone/*`、卡券 `/clue/coupon/*`（券码/核销员/核销）、微信加粉 `/clue/wechat_*`、获客助手 `/clue/ca/*` | 无 | **缺失**：表单/电话/卡券/加粉组件管理 |
| 飞鱼线索 | `/tools/clue/get/info/get/` 线索列表/详情、回传 `callback`、无效线索返款、呼叫中间号/话单/双呼/网络电话/机器人外呼、录音、线索概览报表 | 无 | **缺失**（线索回收链路，后置） |
| 私信线索 | `/tools/clue/private_message/callback/` | 无 | **缺失** |
| 转化回传 / 事件管理 | 事件资产/事件/监测链接 CRUD、优化目标/深度方式查询、异常资产、回传鉴权公钥增删启停、实时归因、全域增效 API | `eventAssets`、`monitorActivities` 只读 | **部分→缺写接口**：缺资产/事件/监测链接创建、回传鉴权公钥管理、归因查询 |

### 阶段 6：数据报表

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 账户/项目/单元/创意报表 | `/report/advertiser/get/`、品牌/代理/计划/创意数据 | `accountSummary`、`dimensionReport(project/ad/material/component)` mock | **部分**：维度已有占位；缺真实指标维度配置、同步明细查询、更多指标列 |
| 自定义报表 | `/report/custom/get/`、`/report/custom/config/get/` 可用指标维度、创意维度自定义报表 | 无 | **缺失**：指标/维度配置拉取、自定义报表查询 |
| 异步报表 | `/report/custom/async_task/create/get/download/` | `createAsyncTask`/`pollAsyncTask` 模拟 | **部分**：缺任务列表、结果下载、T+1/实时离线任务 |
| 直播 / 电商报表 | `/report/live_room/analysis/product/audience_portrait/get/` | 全域 mock 含 GMV/ROI/收入列头 | **缺失**：直播间分析/商品/受众画像报表 |
| RTA / 星广联 / 联合出价 | `/report/rta/get/`、`/report/stardelivery/*`、联合出价数据 | 无 | **缺失**（专项，后置） |
| 报表订阅 / 经营 / 人效 / 财务 | 订阅推送、人效、财务、资金使用率 | 菜单置灰占位 | **缺失**（后置） |

### 阶段 7：投放运营与调控工具

| 官方模块 | 代表接口 | 本地现状 | 差距 |
|---|---|---|---|
| 批量启停 / 配额 | `/project/status/update/`、`/promotion/status/update/`、`/tools/quota/get/` | `batchStatus`、`quota` 模拟 | **部分**：有启停与配额占位；缺配额明细、在投/学习中状态 |
| 一键起量 / 优选起量 | `/tools/promotion_raise/*`、`/tools/material_raise/*`、`/tools/task_raise/*` | 无 | **缺失**：起量方案/开启/关停/后验数据、优选起量任务 |
| 智擎调控任务 | `/oc_project/tools_audience/*`（定向调控）、`/oc_project/tools_keyword/*`（关键词调控）、`/oc_project/tools_material_raise/*`、`/std_project/tools/get/` 剩余可建数量、成本保障状态 | 无 | **缺失**：三类调控任务 CRUD/启停/列表/保障状态 |
| 诊断 / 修复建议 | `/tools/diagnosis/*`、`/tools/project_diagnosis/*`、`/tools/promotion_diagnosis/*`、采纳建议、拒审素材修复 `/reject_material/ai_repair/*`、生态风险判定 | 无 | **缺失**：项目/单元/素材诊断、建议采纳、拒审修复任务 |
| 否定词 | 计划/组/项目/广告否定词增删改查 | 无 | **缺失** |
| RTA 策略 | `/tools/rta/get/bind/unbind/set_scope/status_update/scope/get/`、联合实验报表 | 无 | **缺失**（专项） |
| 穿山甲流量包 | `/tools/union/flow_package/get/create/update/delete/`、rit 数据 | `csjPackages` 只读 | **部分**：缺 CRUD 与流量包报表 |
| 动态创意词包 | `/tools/creative_word/select/create/update/delete/` | 无 | **缺失** |
| 抖音号 / 达人 | `/tools/ies_account_search/`、授权关系查询/续期/解绑/共享、达人/类目/头部达人查询 | 无 | **缺失** |
| 合规 / 积分 / 日志 | 违规计划列表、积分明细/处置/累计分、扣罚单、操作日志 `/tools/log_search/*`、申诉提交/结果 | 无 | **缺失** |
| 出价 / 预估工具 | 建议出价、最大转化出价、预估点击成本、快投出价系数、白名单能力 | 无 | **缺失**（创编前置，部分后置） |
| 预览 / 校验 | 预览二维码 `/tools/ad_preview/qrcode_get/`、通投智选支持校验、锚点挂载校验 | 无 | **缺失** |
| 消息配置 / AB 实验 / AIGC | `/tools/notification/*`、`/tools/ab_test/*`、推荐 AIGC 素材 | 无 | **缺失**（后置） |

## 三、缺失优先级建议

### P0 —— 投放主链路闭环（联调第一批）
1. **OAuth 授权**：授权链接、code 换 Access Token、Refresh Token 刷新、已授权账户拉取、授权状态校验。
2. **账户读取**：账户详情/余额/日预算/状态实时查询。
3. **项目创编写接口**：标准/升级版、全域、智擎项目的创建/更新/删除/批量启停/预算/出价/时段；项目详情与审核建议。
4. **单元创编写接口**：单元创建/编辑/删除/启停/预算/出价/深度出价/素材挂载。
5. **创编前置查询**：可用优化目标、深度优化方式、建议出价、可用转化 ID、行为兴趣类目关键词下拉。
6. **素材上传与查询**：图片/视频上传、异步上传轮询、素材库列表/详情/标签。

### P1 —— 资产与运营调控（联调第二批）
7. 定向包 / 人群包 CRUD 与绑定；事件资产 / 转化目标 / 监测链接管理。
8. 建站站点 CRUD 与预览；表单/电话/卡券组件。
9. 报表：同步明细报表、自定义指标维度配置、异步任务列表/下载。
10. 批量启停、在投配额、一键起量/优选起量、智擎三类调控任务。
11. 诊断建议与采纳、拒审素材修复、操作日志、违规积分。
12. 商品库 / DPA 商品、应用分包、小程序小游戏、锚点/组件/图集 CRUD。

### P2 —— 专项与后置（按业务需要再接入）
13. 资金流水/钱包/转账/充值汇款码、资质管理、代理商与工作台组织。
14. 飞鱼线索回收与呼叫、私信线索、线索通加粉组件。
15. 关键词管理、否定词、RTA、穿山甲流量包报表、评论/屏蔽管理。
16. 直播/电商报表、星广联投数据、AIGC/AB 实验、品牌广告、星图、Dou+、本地推（非本项目复刻范围）。

## 四、不在本轮原型范围

- 巨量星图（客户任务/订单/达人/MCN/服务商）、Dou+ 订单、本地推、品牌广告 2.0、代理结算返点/发票、云图品牌版圈包、万花筒创意剪辑、小程序投稿生态任务。
- 原型阶段所有提交/启停/上传均为本地 mock 回显，未触达真实配额、风控与审核。
