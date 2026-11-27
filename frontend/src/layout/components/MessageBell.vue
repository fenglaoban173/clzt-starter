<template>
  <!--
    顶栏右侧「消息铃铛」下拉 —— 1:1 复刻线上智投广告平台（cl.mobgi.com）
    线上依据：C:/tmp/nw/X_bell3.json（面板 outerHTML）、C:/tmp/nw/W_dl_delete.png（截图）、
             线上 layout-Dt7RUnVm.css / element-wY2YVDb4.css 中的原始样式（已提取核对）。
    交互：hover 展开（线上为 svg mouseover 触发、placement top-end 被 popper 翻转成 bottom-end，
          此处按规格书用 trigger="hover" + placement="bottom-end"）；
          点击铃铛本体跳本地消息中心 tool-message。
  -->
  <el-popover
    v-model:visible="visible"
    trigger="hover"
    placement="bottom-end"
    :width="320"
    :offset="11.5"
    popper-class="msg-bell-popper"
  >
    <template #reference>
      <div class="msg-bell__ref" @click="goMessageCenter">
        <el-tooltip content="消息提醒" placement="bottom" effect="dark" :offset="11.5" popper-class="msg-bell-tip">
          <div class="msg-bell__notice">
            <span v-if="letters.length" class="msg-bell__notice-dot"></span>
            <svg class="msg-bell__svg" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M10 38V18c0-7.732 6.268-14 14-14s14 6.268 14 14v20M4 38h40M24 44a5 5 0 0 0 5-5v-1H19v1a5 5 0 0 0 5 5Z"></path>
            </svg>
          </div>
        </el-tooltip>
      </div>
    </template>

    <!-- 面板内容：结构照抄线上 DOM（letter-tabs → letter-list → letter-item → letter-footer） -->
    <el-tabs model-value="letter" class="letter-tabs" size="small">
      <el-tab-pane label="站内信" name="letter">
        <div class="letter">
          <div class="letter-list">
            <div
              v-for="it in letters"
              :key="it.id"
              class="letter-item"
              @click="goMessageCenter"
            >
              <div class="letter-dot"></div>
              <div>
                <div class="letter-item__title">{{ it.title }}</div>
                <div class="letter-item__content">{{ it.time }}</div>
              </div>
            </div>
            <div v-if="!letters.length" class="letter-empty">暂无站内信</div>
          </div>
          <div v-if="letters.length" class="letter-footer">
            <a class="letter-footer-opt" @click="ignoreAll">忽略</a>
            <a class="letter-footer-opt float" @click="goMessageCenter">查看全部</a>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-popover>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// 线上站内信数据（照抄线上 DOM：2 条「直播预告」）
const letters = ref([
  { id: 1, title: '直播预告：「大健康」AI爆款视频创作专场', time: '2026-10-13 11:33:50' },
  { id: 2, title: '直播预告：「大健康」AI爆款视频创作专场', time: '2026-10-13 11:30:21' },
]);

const visible = ref(false);

const router = useRouter();

// 点击铃铛 / 查看全部 / 点击单条站内信 → 本地消息中心
function goMessageCenter() {
  visible.value = false;
  router.push({ name: 'tool-message' });
}

// 「忽略」→ 清空站内信列表（列表空后显示空状态，红点同时消失）
function ignoreAll() {
  letters.value = [];
}
</script>

<style>
/* ------------------------------------------------------------------
 * 铃铛按钮（线上 .header-icon-container .notice 原始样式）
 * ------------------------------------------------------------------ */
.msg-bell__ref {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.msg-bell__notice {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 16px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0;
}
.msg-bell__notice:hover {
  color: #000;
  background: #eef6ff;
}
.msg-bell__notice-dot {
  position: absolute;
  top: 3px;
  right: 11px;
  width: 7px;
  height: 7px;
  box-sizing: border-box;
  background: #f04438;
  border: 1px solid #fff;
  border-radius: 50%;
}
.msg-bell__svg {
  display: block;
  width: 20px;
  height: 20px;
  color: inherit;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}

/* 「消息提醒」气泡：线上站点全局 .el-tooltip__popper 是 padding 12px / 12px / line-height 1.4、
   描边 1px solid #ebeef5，EP 2.14 默认 5px 11px 会让气泡偏小，这里按线上还原。 */
.el-popper.msg-bell-tip {
  padding: 12px;
  font-size: 12px;
  line-height: 1.4;
  border-color: #ebeef5;
  font-family: 'PingFang SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'Helvetica Neue',
    Helvetica, 'Hiragino Sans GB', Arial, sans-serif;
}
/* EP 2.14 的 is-dark tooltip 描边跟随背景色，线上是 #ebeef5 */
.el-popper.is-dark.msg-bell-tip { border-color: #ebeef5; }

/* ------------------------------------------------------------------
 * 下拉面板（弹层 teleport 到 body，样式全部挂在 .msg-bell-popper 下，避免污染全局）
 * ------------------------------------------------------------------ */
.msg-bell-popper {
  /* 线上主色 #197afb（本地全局令牌是 #2563eb，这里按线上覆盖） */
  --el-color-primary: #197afb;
  --el-color-primary-rgb: 25, 122, 251;
  /* 线上弹层描边 #ebeef5（EP 2.14 的 .el-popper 用 --el-border-color-light，这里两个都覆盖） */
  --el-border-color-lighter: #ebeef5;
  --el-border-color-light: #ebeef5;
  z-index: 2001 !important;
  /* 线上站点 body 为 text-align: justify */
  text-align: justify;
  /* 线上站点字体栈（App.vue 用的是 Vite 默认栈，这里按线上覆盖） */
  font-family: 'PingFang SC', 'Microsoft YaHei UI', 'Microsoft YaHei', 'Helvetica Neue',
    Helvetica, 'Hiragino Sans GB', Arial, sans-serif;
  /* 线上弹层阴影：rgba(0,0,0,0.1) 0 2px 12px 0（EP 2.14 默认值与线上不同） */
  box-shadow: rgba(0, 0, 0, 0.1) 0 2px 12px 0 !important;
}
/* 提高一级特异性，确保覆盖 EP 2.14 的 .el-popper 描边 */
.el-popper.msg-bell-popper { border-color: #ebeef5; }

/* 页签（线上 element-wY2YVDb4.css 的全局 el-tabs 覆盖） */
.msg-bell-popper .el-tabs__item {
  font-size: 14px;
  font-weight: 700;
  color: #666;
}
.msg-bell-popper .el-tabs__item.is-active {
  color: #197afb;
}
.msg-bell-popper .el-tabs__active-bar {
  background-color: #197afb;
}

/* 面板内容（线上 layout-Dt7RUnVm.css 的 scoped 样式） */
.msg-bell-popper .letter-tabs {
  /* 线上 .letter-tabs{margin-top:-12px} */
  margin-top: -12px;
}
.msg-bell-popper .letter-tabs .el-tabs__header {
  /* 线上 EP 版本的 el-tabs__header 高 40px（nav-wrap 的 -1px 下外边距把内容上提 1px），
     本地 EP 2.14 的 header 只有 39px，这里补齐；margin-bottom 用 7px 抵消 EP 多出的 1px，
     保证页签行 / 下划线 / 列表 / 底栏与线上逐像素一致（线上 CSS 写的是 8px）。 */
  height: 40px;
  margin-bottom: 7px;
  align-items: flex-start;
}
.msg-bell-popper .letter {
  width: 100%;
  height: 100%;
}
.msg-bell-popper .letter-list {
  max-height: 300px;
  overflow-y: auto;
}
.msg-bell-popper .letter-list::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.msg-bell-popper .letter-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}
.msg-bell-popper .letter-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
.msg-bell-popper .letter-list::-webkit-scrollbar-track {
  background-color: transparent;
}
.msg-bell-popper .letter-item {
  display: flex;
  align-items: center;
}
.msg-bell-popper .letter .letter-item {
  position: relative;
  padding: 8px 8px 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid #e8eaec;
}
.msg-bell-popper .letter .letter-item:not(:first-child) {
  padding-top: 16px;
}
.msg-bell-popper .letter-dot {
  position: absolute;
  top: 50%;
  left: 0;
  width: 5px;
  height: 5px;
  background: red;
  border-radius: 3px;
  transform: translateY(-50%);
}
.msg-bell-popper .letter-item__title {
  font-size: 12px;
  color: #333;
}
.msg-bell-popper .letter-item__content {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
.msg-bell-popper .letter-empty {
  padding: 24px 0;
  font-size: 13px;
  color: #909399;
  text-align: center;
}
.msg-bell-popper .letter .letter-footer {
  bottom: 0;
  display: flex;
  justify-content: space-between;
  padding: 12px 0 0;
  color: #197afb;
  cursor: pointer;
}
.msg-bell-popper .letter-footer-opt {
  font-size: 12px;
  color: #197afb;
}
</style>
