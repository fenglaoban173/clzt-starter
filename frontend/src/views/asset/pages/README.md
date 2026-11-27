# 资产页并行开发约定（智投标准版 → 巨量广告·标准 → 资产）

每个资产菜单由一个 agent 负责，**只允许新建自己那一个页面的文件**，不得修改任何共享文件
（`assetPages.js` / `AssetList.vue` / `AppLayout.vue` / `mock/data.js` / `api/*` / `main.js`），
以免并行开发互相覆盖。

## 0. 你的浏览器（独立实例）与本地环境

每个 agent 有**自己的 Chrome 实例**（独立 session/namespace），不要使用用户已开的 64519 端口 Chrome。

- session 名：`a_<kind>`；namespace 名：`n_<kind>`（`<kind>` 换成你的页面 kind）
- 登录态：`C:/tmp/oe_auth.json`（已含 cl.mobgi.com 的 cookie/localStorage）
- 首次打开线上（headed 会弹出可见的 Chrome 窗口；**首次启动可能要 1–2 分钟，耐心等待，别重复启动第二个实例**）：

  ```bash
  agent-browser --session a_<kind> --namespace n_<kind> --state C:/tmp/oe_auth.json --headed open "https://cl.mobgi.com/"
  ```

- 之后每条命令都带 `--session a_<kind> --namespace n_<kind>`，例如：

  ```bash
  agent-browser --session a_<kind> --namespace n_<kind> eval -b "$B64"
  agent-browser --session a_<kind> --namespace n_<kind> screenshot C:/tmp/xxx.png
  agent-browser --session a_<kind> --namespace n_<kind> click "<selector>"
  agent-browser --session a_<kind> --namespace n_<kind> tab list
  ```

- eval 传 JS 用 base64 避免 shell 转义：

  ```bash
  cat > /c/tmp/_x.js <<'JS'
  (() => { return document.title; })()
  JS
  B64=$(base64 -w0 /c/tmp/_x.js)
  agent-browser --session a_<kind> --namespace n_<kind> eval -b "$B64"
  ```

- 跳到登录页 → 重新执行带 `--state` 的 open。
- 需要同时看线上与本地：`agent-browser --session a_<kind> --namespace n_<kind> tab new` 开第二个标签页，
  `tab list` 看标签 id（t1/t2…），`tab <id>` 切换。
- **Element Plus 的下拉、单选按钮必须用真实鼠标点击**（`click` 命令），
  `eval` 里的 `el.click()` 对 el-select / el-radio-button 无效。

本地开发环境：

- 开发服务器已在跑：`http://localhost:5173/asset/list?kind=<kind>`（HMR 自动生效，**不要自己 build**）
- 本地登录：账号 `admin`，密码任意 ≥6 位（如 `123456`）

## 1. 交付物

- 页面组件：`frontend/src/views/asset/pages/<kind>.vue`
  （`<kind>` 见下表；组件 **自包含**：本页的筛选、按钮、批量操作、表格、分页、抽屉/弹窗全部写在该文件里）
- 可选的子组件：`frontend/src/views/asset/pages/<kind>/<任意名>.vue`（由 `<kind>.vue` 直接 `import` 使用）
- 本地 mock 数据写在组件内部（或同目录 `pages/<kind>/mock.js`），**不要**改 `src/mock/data.js`

`<kind>.vue` 会被 `AssetList.vue` 自动识别并整页替换通用渲染器，路由仍是
`http://localhost:5173/asset/list?kind=<kind>`。

## 2. 组件契约

```vue
<script setup>
const props = defineProps({ kind: { type: String, default: '' } });
</script>
```

渲染在 `.asset-page` 容器内（padding 16px、白底）。页面标题条 `.asset-title-bar` + `.asset-title`
请自己写（组件内部不要再套一层 `.asset-page`）。

## 3. 必须 1:1 复制的要素（缺一不可）

1. **查询条件**：每个筛选项的 label 文案、默认 placeholder、是否多选、是否可清空、下拉选项、
   以及线上「清空」链接、关键词搜索框（字段类型下拉 + 关键词输入 + 🔍 + 批量搜索气泡）。
2. **功能按钮**：工具栏所有按钮（新建 / 创建 / 同步 / 导出 / 批量导入 / 刷新 …），
   按钮类型（primary / plain / 默认）、文案、顺序、以及**点击后的真实交互**（打开抽屉 / 弹窗 / 提示）。
3. **批量操作**：线上是「下拉按钮式 批量操作(N)」还是「下拉选择式 批量操作」，
   未选中行时是否置灰，下拉项有哪些，每一项点开后的确认/表单弹窗。
4. **同步 / 其它资产动作**：如「同步资产」「手动同步」「同步到账户」，要能点、有反馈。
5. **列表布局**：列的顺序、列名、列宽、哪些是固定左列（操作列通常固定在左侧）、表头样式、
   行内操作按钮（查看 / 编辑 / 删除 / 同步 / 分享 …）及其顺序。
6. **分页**：条数、每页条数选择、跳页。
7. **新建 / 编辑抽屉（弹窗）**：抽屉宽度 1016px，分区标题 + 字段 + 字段之间的联动关系、
   必填校验、底部「取 消 / 确 定」。**只要线上该页有抽屉/弹窗，就必须复刻，且字段联动要一致。**
8. **二级页签**：如「商品库-通用版 / 商品-通用版 / 商品-升级版」，页签切换后筛选、列、数据都要变。

## 4. 线上 DOM 约定（已验证，直接照抄结构）

- 筛选区：`form.el-form.filter-search-input.el-form--inline`；
  每项 `div.select-area.multiple-select.mr8` = `<label>名称：</label>` + `div.el-select.cl-filter-select.show-close-icon`
  （`input` 的 placeholder 是默认文案）+ `a.clearall`（清空）。
- 搜索组件：`div.cl-search-input`（宽 280px）= 字段类型 el-select（80px）+ 关键词 input（请输入关键词）
  + append 🔍 + 批量搜索 popover。
- 工具栏：`div.table-toolbar`（bg #fff、padding 8px 16px、高 50px）；
  批量操作两种形态：① `div.el-select.w120` placeholder「批量操作」（未选中置灰）；
  ② `el-button ... is-plain el-dropdown-selfdefine` 文案「批量操作(N)」。
- 表格：`el-table--border`；表头 th 背景 #fafafa、12px #909399、高 56px；正文 12px #606266。
  固定列判定：主表头 th 上带 `is-hidden` 的即为固定左列（操作列通常排在固定区）。
- 抽屉：`div.cl-drawer`（宽 1016px、bg #f0f2f5）> `.drawer-header`(高 49px、bg #fff、`.header-title` 16px #333)
  > `.drawer-content.mr0`（可滚动、padding 0 16px、bg #f0f2f5）
  > `.drawer-footer`（高 70px、bg #fff、padding 12px 16px 24px）内 `.dialog-footer.flex > .operate-button`
  按钮「取 消 / 确 定」88×32、12px、圆角 3。
- 抽屉表单分区：`.module-container`（bg #fff、下边距 16px）+ `.cl-form-block-title`（48px、bg #fbfcfd、16px #333）
  + `form.el-form.el-form--label-left`；label 宽 144px（14px #666），内容左移 144px；
  输入框 360×32（13px），字数统计用 `.input-suffix`；单选用 `el-radio-button`
  （padding 9px 12px、12px；选中 bg #d6eaff、字色 #197afb）。

## 5. 样式

全局 `frontend/src/views/asset/pages/assetPage.css` 已内置上述通用类，直接用即可：
`.asset-title-bar .asset-title`、`.asset-sub-tabs .asset-sub-tab`、`.filter-row .filter-left .filter-cell .filter-label .filter-select .filter-clear`、
`.cl-search .search-field .search-input .search-more-btn`、`.table-toolbar .tool-btn .batch-select`、
`.asset-table`、`.desc-cell`、`.pager-card`、`.cl-drawer .drawer-header .header-title .drawer-content .module-container .cl-form-block-title .cl-drawer-form .drawer-footer .dialog-footer .operate-button`、
`.ag-input .ag-select .ag-radio .input-suffix .link-row .ag-add-link`。
页面私有样式写在组件自己的 `<style scoped>` 里。

## 6. 自测

1. 开发服务器已启动：`http://localhost:5173/asset/list?kind=<kind>`（HMR 自动生效，无需自己 build）。
2. 用你自己的浏览器打开该地址，逐项核对筛选、按钮、批量操作、抽屉、列、分页。
3. 截图存到 `C:/tmp/local_<kind>_*.png`（不要写进仓库目录）。

## 7. 硬性约束

- **不要执行 `git push` / `git commit`**（只有主控会话会提交）。
- **不要启动新的 preview/dev 服务器**（4173 preview 与 5173 dev 已在跑）。
- **不要修改** `assetPages.js`、`AssetList.vue`、`AppLayout.vue`、`main.js`、`mock/data.js`、`api/*`。
- 不要把临时文件写进仓库（用 `C:/tmp/`）。
