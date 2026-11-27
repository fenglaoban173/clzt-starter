<template>
  <div class="app-page msg-page">
    <!-- ① 通知横幅：线上 el-alert.bind-notification-banner.el-alert--warning.is-light
         底色 rgb(245,247,250)、圆角 4px、高 40px、margin 8px、文案 14px #333、两个绑定链接 #197afb
         图标：线上 .el-alert__icon.el-icon-warning（14×14 实心圆 + 感叹号，#1677ff） -->
    <div v-if="bannerVisible" class="app-banner msg-banner">
      <svg class="msg-banner__icon" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
        <circle cx="7" cy="7" r="7" fill="currentColor" />
        <rect x="6.2" y="2.8" width="1.6" height="5.2" rx="0.8" fill="#fff" />
        <circle cx="7" cy="10.6" r="1" fill="#fff" />
      </svg>
      <span class="notification-text msg-banner__text">关联办公协同软件，第一时间获取消息通知：</span>
      <a class="bind-link msg-bind-link" @click="openBind('飞书')">去绑定飞书 &gt;&gt;</a>
      <a class="bind-link msg-bind-link" @click="openBind('钉钉')">去绑定钉钉 &gt;&gt;</a>
      <span class="app-banner__right banner-right msg-banner__right">
        <span class="no-remind-text msg-no-remind" @click="hideBanner">不再提醒</span>
        <span class="banner-close msg-banner__close" title="关闭" @click="hideBanner">
          <el-icon><Close /></el-icon>
        </span>
      </span>
    </div>

    <!-- ② 仅保留全部消息页签 -->
    <el-tabs model-value="全部消息" class="msg-tabs">
      <el-tab-pane name="全部消息" label="全部消息">
        <!-- height="617"：线上表格 border-box 恒为 618px（表头 56 + 表体 561 = 617 内容高），
             与当前页签有无数据无关；本地用 content-box + 1px 上描边，故内容高传 617 -->
        <el-table :data="MESSAGES" border size="small" height="617" class="app-table msg-table">
          <el-table-column prop="title" label="标题" min-width="600" show-overflow-tooltip>
            <template #default="{ row }">
              <div :class="row.state === 'has-red' ? 'app-msg-has-red has-red' : 'app-msg-unhas-red unshas-red'">
                {{ row.title }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="type"
            label="消息类型"
            min-width="200"
            header-class-name="msg-type"
            class-name="msg-type"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="app-msg-type-text msg-type-text">
                {{ row.type }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="publishedAt" label="发布时间" min-width="200" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ③ 绑定办公协同软件（线上 el-dialog「信息绑定」）
         飞书：800px、el-dialog--center 垂直居中、表单 label 180px、按钮「取消 / 确定」
         钉钉：700px、顶部 15vh、表单 label 130px、按钮「取 消 / 保 存」 -->
    <el-dialog
      v-model="bindVisible"
      title="信息绑定"
      :width="bindTarget === '钉钉' ? '700px' : '800px'"
      :align-center="bindTarget !== '钉钉'"
      class="msg-bind-dialog"
      :class="{ 'msg-bind-dialog--ding': bindTarget === '钉钉' }"
    >
      <!-- 飞书 -->
      <template v-if="bindTarget !== '钉钉'">
        <div class="bind-intro">
          请飞书管理员查看
          <a
            class="btn-link fs12"
            href="https://chuangliang.feishu.cn/wiki/L7VpwD6tfi36tCkSimlc48X3nVh"
            target="_blank"
            rel="noopener"
          >指引文档</a>
          ，创建飞书应用并绑定到智投
        </div>
        <el-form label-width="180px" size="small" class="bind-form">
          <el-form-item label="智投账户名称">
            <el-input class="bind-input" disabled />
          </el-form-item>
          <el-form-item label="飞书智投应用AppID" required>
            <el-input class="bind-input" />
          </el-form-item>
          <el-form-item label="飞书智投应用AppSecret" required>
            <el-input class="bind-input" />
          </el-form-item>
        </el-form>
      </template>
      <!-- 钉钉 -->
      <template v-else>
        <p class="mb16">
          请钉钉管理员查看
          <a
            class="opt-link"
            href="https://chuangliang.feishu.cn/docx/RSZQdZ3gboaI91xBw7ecN3rbnqh"
            target="_blank"
            rel="noopener"
          >指引文档</a>
          ，创建钉钉应用并绑定到智投
        </p>
        <el-form label-width="130px" class="bind-form">
          <el-form-item label="智投账户名称">
            <el-input disabled placeholder="请输入智投账户名称" />
          </el-form-item>
          <el-form-item label="Agent ID" required>
            <el-input placeholder="请输入Agent ID" />
          </el-form-item>
          <el-form-item label="Client ID" required>
            <el-input placeholder="请输入Client ID" />
          </el-form-item>
          <el-form-item label="Client Secret" required>
            <el-input placeholder="请输入Client Secret" />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <div class="dialog-footer">
          <template v-if="bindTarget !== '钉钉'">
            <el-button class="bind-btn" @click="bindVisible = false">取消</el-button>
            <el-button class="bind-btn" type="primary" @click="confirmBind">确定</el-button>
          </template>
          <template v-else>
            <el-button class="bind-btn" size="small" @click="bindVisible = false">取 消</el-button>
            <el-button class="bind-btn" size="small" type="primary" @click="confirmBind">保 存</el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/* ------------------------------------------------------------------
 * 工具 · 系统工具 · 消息中心
 * 线上：https://cl.mobgi.com/assist/letter/list
 *
 * 采集自线上 DOM / computed style（C:/tmp/nw/T3_消息中心.json、线上探针 + 截图 + 逐项对拍）：
 *   - 横幅 el-alert.bind-notification-banner：bg rgb(245,247,250)、border rgb(217,226,242)、
 *     radius 4px、h 40px、margin 8px、padding 0 12px、font-size 16px；
 *     实心圆感叹号图标 14×14 rgb(22,119,255)；
 *     文案 14px rgb(51,51,51) / line-height 20px；两个链接 14px rgb(25,122,251)；
 *     右侧「不再提醒」rgb(140,140,140) + × 24×24
 *   - 页签仅保留「全部消息」，显示所有类型的消息
 *     ※ 页签行底部的 1px #e8eaec 分隔线按用户要求已移除（线上 .common-tabs .el-tabs__header:after）
 *   - 表格：3 列 1327 / 200 / 200，表头 th 14px #909399 on #fafafa、th>.cell 12px #333 700，
 *     行高 56px，td 14px #606266 / td>.cell 12px #333，cell padding 0 12px，表格边框 #e8eaec
 *   - 消息类型单元格：.msg-type-text 蓝色描边方块 120×32，底色 rgb(241,247,255)，1px solid #197afb
 *   - 标题读态：has-red → rgb(153,153,153)（浅）、unhas-red → rgb(51,51,51)（深）
 *     ※ 线上实测：第 1 行浅、第 2/3 行深、第 4~8 行浅（appPage.css 的配色与线上相反，本组件内覆盖）
 *   - 「去绑定飞书」弹窗：800px、垂直居中、标题「信息绑定」、表单（智投账户名称/飞书智投应用AppID/
 *     飞书智投应用AppSecret，label 180px）、按钮「取消 / 确定」（120×32）
 *   - 「去绑定钉钉」弹窗：700px、顶部 15vh、标题「信息绑定」、表单（智投账户名称/Agent ID/
 *     Client ID/Client Secret，label 130px）、按钮「取 消 / 保 存」（120×32）
 * ------------------------------------------------------------------ */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';

/** 线上「全部消息」8 条，逐字照抄（state = 线上 DOM 的 has-red / khas-red 类名） */
const MESSAGES = [
  { id: 'm1', title: '头条组织素材使用须知', type: '重要通知', publishedAt: '2026-11-02 17:31:23', state: 'has-red' },
  { id: 'm2', title: '直播预告：「大健康」AI爆款视频创作专场', type: '重要通知', publishedAt: '2026-10-13 11:33:50', state: 'unhas-red' },
  { id: 'm3', title: '直播预告：「大健康」AI爆款视频创作专场', type: '重要通知', publishedAt: '2026-10-13 11:30:21', state: 'unhas-red' },
  { id: 'm4', title: '您的素材审核不通过', type: '素材审核', publishedAt: '2026-09-08 17:55:04', state: 'has-red' },
  { id: 'm5', title: '您提出的需求已交付', type: '需求管理', publishedAt: '2026-07-28 15:07:36', state: 'has-red' },
  { id: 'm6', title: '您提出的需求已交付', type: '需求管理', publishedAt: '2026-07-28 15:04:39', state: 'has-red' },
  { id: 'm7', title: '您提出的需求已交付', type: '需求管理', publishedAt: '2026-07-28 15:02:10', state: 'has-red' },
  { id: 'm8', title: '您提出的需求已被接单', type: '需求管理', publishedAt: '2026-07-28 14:53:59', state: 'has-red' },
];

/* ---------------- 横幅：不再提醒 / × / localStorage ---------------- */
const BANNER_KEY = 'clzt_msg_banner_hidden';

const bannerVisible = ref(true);
try {
  bannerVisible.value = localStorage.getItem(BANNER_KEY) !== '1';
} catch (e) {
  bannerVisible.value = true;
}

/** 隐藏横幅并记住（刷新后仍保持隐藏） */
function hideBanner() {
  bannerVisible.value = false;
  try {
    localStorage.setItem(BANNER_KEY, '1');
  } catch (e) {
    /* 隐私模式下 localStorage 不可用，忽略 */
  }
  ElMessage.success('提示已关闭');
}

/* ---------------- 绑定办公协同软件 ---------------- */
const bindVisible = ref(false);
const bindTarget = ref('飞书');

function openBind(target) {
  bindTarget.value = target;
  bindVisible.value = true;
}

function confirmBind() {
  bindVisible.value = false;
  ElMessage.success(`已提交${bindTarget.value}绑定申请`);
}
</script>

<style scoped>
/* ---------- 页面骨架（线上 .cl-container-main 底色 #f5f6f7，内容块各自白底） ---------- */
/* 线上站点字体栈：App.vue 用的是 Vite 默认栈（Segoe UI 优先），
   这里按线上覆盖，保证数字/字母（发布时间）与线上一致 */
.app-page.msg-page {
  background: #f5f6f7;
  font-family: 'PingFang SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'Helvetica Neue',
    Helvetica, 'Hiragino Sans GB', Arial, sans-serif;
}

/* ---------- 通知横幅 ----------
   线上 el-alert：margin 8px（四边）、padding 0 12px、高 40px、font-size 16px */
.msg-page .msg-banner {
  margin: 8px;
  border-color: #d9e2f2;
  gap: 8px;
  box-sizing: border-box;
  font-size: 16px;
}
.msg-page .msg-banner__icon { color: #1677ff; flex: none; }
.msg-page .msg-banner__text { color: #333; font-size: 14px; line-height: 20px; }
.msg-page .msg-bind-link { color: #197afb; font-size: 14px; line-height: 20px; cursor: pointer; text-decoration: none; }
.msg-page .msg-bind-link:hover { text-decoration: underline; }
/* 线上两个绑定链接之间 16px（8px 基础间距 + 8px 额外外边距） */
.msg-page .msg-bind-link + .msg-bind-link { margin-left: 8px; }
.msg-page .msg-banner__right { gap: 8px; color: #8c8c8c; }
.msg-page .msg-no-remind { color: #8c8c8c; font-size: 14px; line-height: 20px; cursor: pointer; }
.msg-page .msg-no-remind:hover { color: #197afb; }
.msg-page .msg-banner__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
  cursor: pointer;
  font-size: 14px;
}
.msg-page .msg-banner__close:hover { color: #197afb; }

/* ---------- 页签（线上 .el-tabs__header 高 48px、字号 16px/700） ----------
   线上横幅 margin 8px（上下共 16px），页签行紧接其后，自身无 margin-top */
.msg-page .msg-tabs { margin-top: 0; }
.msg-page .msg-tabs :deep(.el-tabs__header) {
  height: 48px;
  margin: 0;
  padding-left: 16px;
  background: #fff;
  --el-tabs-header-height: 40px;
}
/* 页签行底部不画分隔线（按用户要求移除线上 .common-tabs .el-tabs__header:after 的 1px #e8eaec） */
.msg-page .msg-tabs :deep(.el-tabs__header)::after {
  display: none;
}
/* 线上把 nav-wrap 的滚动阴影线设为透明 */
.msg-page .msg-tabs :deep(.el-tabs__nav-wrap)::after { background-color: transparent; }
.msg-page .msg-tabs :deep(.el-tabs__nav) { height: 48px; align-items: center; }
/* EP 2.14 的 nav-wrap 有 margin-bottom:-1px，会让页签整体下移 0.5px */
.msg-page .msg-tabs :deep(.el-tabs__nav-wrap) { margin-bottom: 0; }
.msg-page .msg-tabs :deep(.el-tabs__item) {
  height: 40px;
  font-size: 16px;
  font-weight: 700;
  color: #666;
}
.msg-page .msg-tabs :deep(.el-tabs__item.is-active) { color: #197afb; }
.msg-page .msg-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  background-color: #197afb;
}
.msg-page .msg-tabs :deep(.el-tabs__content) { overflow: visible; }
.msg-page .msg-tabs :deep(.el-tab-pane) { padding: 16px 16px 0; }

/* ---------- 表格 ---------- */
/* 线上 el-table：border-box 1728×618，左/上各 1px #ebeef5 描边，
   内部表头 56 + 表体 561 = 617（colgroup 合计 1327+200+200=1727）。
   这里用 content-box + 左/上 1px 描边复刻 EP2.14 与线上 1px 的差异（height prop 传 617）。 */
.msg-page .msg-table {
  box-sizing: content-box;
  width: calc(100% - 1px);
  font-size: 12px;
  border-top: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
  /* 线上单元格边框 #e8eaec（EP 2.14 在 .el-table 上重定义了该变量，需在表格上覆盖） */
  --el-table-border-color: #e8eaec;
}
.msg-page .msg-table :deep(th.el-table__cell) {
  height: 56px;
  background: #fafafa;
  color: #909399;
  font-size: 12px;
  font-weight: 700;
  padding: 0;
  border-color: #e8eaec;
}
/* 线上表头文字：th>.cell 12px #333 700、左右内边距 12px */
.msg-page .msg-table :deep(th.el-table__cell > .cell) {
  font-size: 12px;
  font-weight: 700;
  color: #333;
  padding: 0 12px;
}
.msg-page .msg-table :deep(td.el-table__cell) {
  height: 56px;
  padding: 0;
  font-size: 12px;
  color: #606266;
  border-color: #e8eaec;
}
/* 线上正文：td>.cell 12px #333、左右内边距 12px（EP small 表格默认 8px） */
.msg-page .msg-table :deep(td.el-table__cell > .cell) {
  font-size: 12px;
  color: #333;
  padding: 0 12px;
}
.msg-page .msg-table :deep(.el-table__cell .cell) { line-height: 18px; }
/* 消息类型列：线上 .msg-type 列内容居中 */
.msg-page .msg-table :deep(td.msg-type .cell) {
  display: flex;
  justify-content: center;
}
/* 消息类型方块：线上 120×32、1px solid #197afb、底色 rgb(241,247,255) */
.msg-page .msg-type-text {
  width: 120px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f7ff;
  line-height: 18px;
  text-align: center;
}
/* 标题读态：线上 has-red=浅灰 rgb(153,153,153)、unhas-red=深色 rgb(51,51,51) */
.msg-page .app-msg-has-red { color: #999; }
.msg-page .app-msg-unhas-red { color: #333; }

/* ---------- 绑定弹窗内的表单 ---------- */
.bind-intro { margin-left: 32px; margin-bottom: 16px; font-size: 14px; color: #333; line-height: 20px; }
.bind-intro .btn-link,
.bind-intro .opt-link,
.mb16 .opt-link { color: #197afb; font-size: 12px; text-decoration: none; cursor: pointer; }
.bind-intro .btn-link:hover,
.bind-intro .opt-link:hover,
.mb16 .opt-link:hover { text-decoration: underline; }
.mb16 { margin: 0 0 16px; font-size: 14px; color: #333; line-height: 20px; }
.bind-form :deep(.el-form-item) { margin-bottom: 24px; }
.bind-form :deep(.el-form-item__label) { width: auto !important; padding-right: 12px; line-height: 32px; color: #666; }
/* 线上站点全局 .el-input .el-input__inner{height:32px}，表单里的输入框也是 32px 高 */
.bind-form :deep(.el-input__wrapper) { height: 32px; min-height: 32px; }
.bind-input { width: 320px; }
</style>

<!-- 绑定弹窗：el-dialog 会被 teleport 到 body，故这里用非 scoped 样式还原线上 Element UI 2 的 dialog 尺寸 -->
<style>
.el-dialog.msg-bind-dialog {
  padding: 0;
  border-radius: 2px;
}
.el-dialog.msg-bind-dialog .el-dialog__header {
  box-sizing: content-box;
  height: 18px;
  padding: 24px 32px 14px;
  margin: 0;
  border-bottom: 1px solid #e8eaec;
  font-size: 18px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
.el-dialog.msg-bind-dialog .el-dialog__title {
  display: block;
  height: 18px;
  font-size: 16px;
  font-weight: 700;
  line-height: 18px;
  color: #333;
  text-align: left;
}
/* 线上关闭按钮在标题栏右上角 16×20（EP 2.14 默认是 48×48 贴角） */
.el-dialog.msg-bind-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 32px;
  width: 16px;
  height: 20px;
  font-size: 16px;
  font-weight: 700;
}
.el-dialog.msg-bind-dialog .el-dialog__body { padding: 24px 32px 32px; color: #606266; font-size: 14px; }
.el-dialog.msg-bind-dialog .el-dialog__footer { padding: 0 32px 32px; }
.el-dialog.msg-bind-dialog .dialog-footer { display: flex; justify-content: flex-end; }
.el-dialog.msg-bind-dialog .dialog-footer .el-button {
  min-width: 120px;
  margin-left: 16px;
  border-radius: 2px !important;
}
.el-dialog.msg-bind-dialog .dialog-footer .el-button:first-child { margin-left: 0; }
/* 飞书弹窗：线上 .cl-dialog--middle —— 标题栏 padding 16px 32px、按钮居中 */
.el-dialog.msg-bind-dialog:not(.msg-bind-dialog--ding) .el-dialog__header { padding: 16px 32px; }
.el-dialog.msg-bind-dialog:not(.msg-bind-dialog--ding) .el-dialog__body { padding: 24px 32px; }
.el-dialog.msg-bind-dialog:not(.msg-bind-dialog--ding) .el-dialog__footer { padding: 11px 32px 30px; }
.el-dialog.msg-bind-dialog:not(.msg-bind-dialog--ding) .dialog-footer { justify-content: center; }
.el-dialog.msg-bind-dialog:not(.msg-bind-dialog--ding) .dialog-footer .el-button { font-size: 14px; padding: 8px 20px; }
/* 钉钉弹窗：线上按钮 12px、padding 9px 15px、圆角 3px */
.el-dialog.msg-bind-dialog--ding .dialog-footer .el-button { font-size: 12px; padding: 9px 15px; border-radius: 3px !important; }
</style>
