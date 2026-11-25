<template>
  <div class="app-page msg-page">
    <!-- ① 通知横幅：线上 el-alert.bind-notification-banner.el-alert--warning.is-light
         底色 rgb(245,247,250)、圆角 4px、高 40px、文案 14px #333、两个绑定链接 #197afb -->
    <div v-if="bannerVisible" class="app-banner msg-banner">
      <el-icon class="msg-banner__icon"><InfoFilled /></el-icon>
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

    <!-- ② 页签 + 表格：线上 common-tabs.el-tabs，9 个 el-tab-pane，每个 pane 各有一张 el-table
         （线上未激活的 pane 数据为空，激活时才填充；本页照抄该结构） -->
    <el-tabs v-model="activeTab" class="msg-tabs">
      <el-tab-pane v-for="t in TABS" :key="t" :name="t" :label="t">
        <!-- height="618"：线上实测表格恒为 618px（body 561px），与当前页签有无数据无关 -->
        <el-table :data="paneRows[t] || []" border size="small" height="618" class="app-table msg-table">
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
            width="200"
            header-class-name="msg-type"
            class-name="msg-type"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="app-msg-type-text msg-type-text" @click="gotoType(row.type)">
                {{ row.type }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="publishedAt" label="发布时间" width="200" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ③ 绑定办公协同软件（线上 el-dialog「信息绑定」） -->
    <el-dialog v-model="bindVisible" title="信息绑定" width="520px" class="msg-bind-dialog">
      <p class="msg-bind__tip">
        即将跳转至{{ bindTarget }}开放平台完成授权。授权完成后，创量可把消息通知实时推送到你的办公协同软件。
      </p>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="small" plain @click="bindVisible = false">取 消</el-button>
          <el-button size="small" type="primary" @click="confirmBind">保 存</el-button>
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
 * 采集自线上 DOM / computed style（C:/tmp/nw/T3_消息中心.json、线上探针 + 截图）：
 *   - 横幅 el-alert.bind-notification-banner：bg rgb(245,247,250)、border rgb(217,226,242)、
 *     radius 4px、h 40px、padding 0 12px；ⓘ 图标 14px rgb(22,119,255)；
 *     文案 14px rgb(51,51,51)；两个链接 14px rgb(25,122,251)；右侧「不再提醒」rgb(140,140,140) + × 24×24
 *   - 页签：9 个，顺序全部消息 / 重要通知 / 产品更新 / 系统维护更新 / 投放最佳实践 /
 *     其它消息 / 需求管理 / 素材批注 / 素材审核；16px / 700 / #666（选中 #197afb + 底部 2px 蓝条）
 *   - 表格：3 列 1327 / 200 / 200，表头 12px #909399 on #fafafa，行高 56px，表体 12px #333
 *   - 消息类型单元格：.msg-type-text 蓝色描边方块 120×32，底色 rgb(241,247,255)，1px solid #197afb
 *   - 标题读态：has-red → rgb(153,153,153)（浅）、unhas-red → rgb(51,51,51)（深）
 *     ※ 线上实测：第 1 行浅、第 2/3 行深、第 4~8 行浅（appPage.css 的配色与线上相反，本组件内覆盖）
 *   - 页签行为：每个 pane 一张独立表格，未激活的 pane 数据为空，激活时填充该类型数据
 *     （线上「重要通知」可见 3 行 / 「需求管理」4 行 / 「素材审核」1 行 / 其余 0 行）
 * ------------------------------------------------------------------ */
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, InfoFilled } from '@element-plus/icons-vue';

/** 9 个页签，顺序与线上一致 */
const TABS = [
  '全部消息',
  '重要通知',
  '产品更新',
  '系统维护更新',
  '投放最佳实践',
  '其它消息',
  '需求管理',
  '素材批注',
  '素材审核',
];

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

/** 各类型对应的原始行（线上各页签单独请求的数据） */
const TYPE_ROWS = {
  全部消息: MESSAGES,
  重要通知: MESSAGES.filter((m) => m.type === '重要通知'),
  产品更新: [],
  系统维护更新: [],
  投放最佳实践: [],
  其它消息: [],
  需求管理: MESSAGES.filter((m) => m.type === '需求管理'),
  素材批注: [],
  素材审核: MESSAGES.filter((m) => m.type === '素材审核'),
};

const activeTab = ref('全部消息');

/**
 * 每个 pane 一份数据（与线上一致）：
 * 初始只有「全部消息」有数据，其余 pane 的表格为空；
 * 切换页签时把该类型的原始行填入对应 pane（重复切换不会重复追加）。
 */
const paneRows = reactive({});

watch(
  activeTab,
  (name) => {
    paneRows[name] = (TYPE_ROWS[name] || []).slice();
  },
  { immediate: true }
);

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

/** 点击消息类型方块 → 跳到该类型页签 */
function gotoType(type) {
  if (TABS.indexOf(type) === -1) return;
  activeTab.value = type;
}
</script>

<style scoped>
/* ---------- 页面骨架（线上整页白底） ---------- */
.app-page.msg-page { background: #fff; }

/* ---------- 通知横幅 ---------- */
.msg-page .msg-banner {
  margin: 12px 8px 0;
  border-color: #d9e2f2;
  gap: 8px;
  box-sizing: border-box;
}
.msg-page .msg-banner__icon { color: #1677ff; font-size: 14px; }
.msg-page .msg-banner__text { color: #333; font-size: 14px; }
.msg-page .msg-bind-link { color: #197afb; font-size: 14px; cursor: pointer; text-decoration: none; }
.msg-page .msg-bind-link:hover { text-decoration: underline; }
/* 线上两个绑定链接之间 16px（8px 基础间距 + 8px 额外外边距） */
.msg-page .msg-bind-link + .msg-bind-link { margin-left: 8px; }
.msg-page .msg-banner__right { gap: 8px; color: #8c8c8c; }
.msg-page .msg-no-remind { color: #8c8c8c; font-size: 14px; cursor: pointer; }
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

/* ---------- 页签（线上 .el-tabs__header 高 48px、字号 16px/700） ---------- */
.msg-page .msg-tabs { margin-top: 8px; }
.msg-page .msg-tabs :deep(.el-tabs__header) {
  height: 48px;
  margin: 0;
  padding-left: 16px;
  background: #fff;
  --el-tabs-header-height: 40px;
}
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
/* 线上 el-table 根节点 clientWidth=1727（1327+200+200） */
.msg-page .msg-table { width: calc(100% - 1px); font-size: 12px; }
.msg-page .msg-table :deep(th.el-table__cell) {
  height: 56px;
  background: #fafafa;
  color: #909399;
  font-size: 12px;
  font-weight: 700;
  padding: 0;
}
.msg-page .msg-table :deep(td.el-table__cell) {
  height: 56px;
  padding: 0;
  font-size: 12px;
  color: #333;
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
}
/* 标题读态：线上 has-red=浅灰 rgb(153,153,153)、unhas-red=深色 rgb(51,51,51) */
.msg-page .app-msg-has-red { color: #999; }
.msg-page .app-msg-unhas-red { color: #333; }

/* ---------- 绑定弹窗 ---------- */
.msg-bind__tip { font-size: 13px; color: #333; line-height: 20px; margin: 0; }
</style>
