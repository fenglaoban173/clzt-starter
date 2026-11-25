<template>
  <!-- 新建报表 —— 1:1 对齐线上 cl.mobgi.com/report/adsdata/custom/design?type=create&source=custom
   * 线上结构：左侧仍是报表侧栏，右侧是整页表单（顶部返回箭头 + 标题「新建报表」）。
   * 说明：AppLayout 的左侧侧栏按 route.name 渲染（moduleOf 里只有 9 个报表页），
   *      而本任务不允许改 AppLayout，所以侧栏在本页本地复刻一份（线上同名同序）。
   * 字段（14 项，顺序与线上一致）：
   *   报表名称 / 媒体 / 数据维度 / 报表类型 / 报表样式 / 设置报表 / 发送排序 /
   *   排除无消耗账户 / 订阅状态 / 订阅时间 / 发送时间 / 订阅内容 / AI数据分析 / 推送方式 -->
  <div class="rc-create">
    <!-- ① 左侧：报表侧栏（线上：效果分析 6 项 + 经营分析 3 项） -->
    <aside class="rc-sider">
      <el-menu
        class="rc-menu"
        :default-active="SIDE_ACTIVE"
        :default-openeds="['效果分析', '经营分析']"
        @select="onSideSelect"
      >
        <el-sub-menu index="效果分析">
          <template #title><span>效果分析</span></template>
          <el-menu-item v-for="it in EFFECT_ITEMS" :key="it.name" :index="it.title">
            {{ it.title }}
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="经营分析">
          <template #title><span>经营分析</span></template>
          <el-menu-item v-for="it in BIZ_ITEMS" :key="it.name" :index="it.title">
            {{ it.title }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <!-- ② 右侧：新建报表整页表单 -->
    <div class="rc-main">
      <!-- 顶部：返回箭头 + 标题 -->
      <div class="rc-head">
        <el-icon class="rc-back" @click="goBack"><ArrowLeft /></el-icon>
        <span class="rc-title">新建报表</span>
      </div>

      <div class="rc-body">
        <el-form class="rc-form" :model="form" @submit.prevent>
          <!-- 1. 报表名称 -->
          <div class="rc-row">
            <div class="rc-label">报表名称</div>
            <div class="rc-ctrl">
              <el-input
                v-model="form.name"
                class="rc-input"
                maxlength="100"
                placeholder="建议名称：公司简称-项目名称-时报"
              >
                <!-- 线上右侧计数为「0/100」（无空格），EP 自带 show-word-limit 是「0 / 100」，这里自绘 -->
                <template #suffix>
                  <span class="rc-count">{{ form.name.length }}/100</span>
                </template>
              </el-input>
            </div>
          </div>

          <!-- 2. 媒体 -->
          <div class="rc-row">
            <div class="rc-label">媒体</div>
            <div class="rc-ctrl">
              <el-select v-model="form.media" class="rc-select">
                <el-option v-for="o in MEDIA_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </div>
          </div>

          <!-- 3. 数据维度 -->
          <div class="rc-row">
            <div class="rc-label">数据维度</div>
            <div class="rc-ctrl">
              <el-select v-model="form.dimension" class="rc-select">
                <el-option v-for="o in DIMENSION_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </div>
          </div>

          <!-- 4. 报表类型 -->
          <div class="rc-row">
            <div class="rc-label">报表类型</div>
            <div class="rc-ctrl">
              <el-radio-group v-model="form.reportType" class="report-radio-group rc-radio">
                <el-radio-button v-for="o in REPORT_TYPES" :key="o" :value="o">{{ o }}</el-radio-button>
              </el-radio-group>
              <div class="rc-hint">根据设定的时间整点推送订阅（如8点的时报，数据为0点-8点的累计）</div>
            </div>
          </div>

          <!-- 5. 报表样式 -->
          <div class="rc-row">
            <div class="rc-label">报表样式</div>
            <div class="rc-ctrl">
              <el-radio-group v-model="form.reportStyle" class="report-radio-group rc-radio">
                <el-radio-button v-for="o in REPORT_STYLES" :key="o" :value="o">{{ o }}</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 6. 设置报表 -->
          <div class="rc-row">
            <div class="rc-label">设置报表</div>
            <div class="rc-ctrl">
              <el-button type="primary" class="rc-tpl-btn" @click="tplVisible = true">编辑模板</el-button>
            </div>
          </div>

          <!-- 7. 发送排序 -->
          <div class="rc-row">
            <div class="rc-label">发送排序</div>
            <div class="rc-ctrl">
              <el-radio-group v-model="form.sendSort" class="report-radio-group rc-radio">
                <el-radio-button v-for="o in SWITCH_OPTIONS" :key="o" :value="o">{{ o }}</el-radio-button>
              </el-radio-group>
              <div class="rc-hint">{{ SORT_HINT }}</div>
            </div>
          </div>

          <!-- 8. 排除无消耗账户 -->
          <div class="rc-row">
            <div class="rc-label">排除无消耗账户</div>
            <div class="rc-ctrl">
              <el-radio-group v-model="form.excludeNoCost" class="report-radio-group rc-radio">
                <el-radio-button v-for="o in SWITCH_OPTIONS" :key="o" :value="o">{{ o }}</el-radio-button>
              </el-radio-group>
              <el-tooltip :content="EXCLUDE_HINT" placement="top">
                <span class="rc-info">
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2" />
                    <text x="8" y="11.6" text-anchor="middle" font-size="9.5" fill="currentColor">?</text>
                  </svg>
                </span>
              </el-tooltip>
            </div>
          </div>

          <!-- 9. 订阅状态 -->
          <div class="rc-row">
            <div class="rc-label">订阅状态</div>
            <div class="rc-ctrl">
              <el-radio-group v-model="form.subscribeStatus" class="report-radio-group rc-radio">
                <el-radio-button v-for="o in SWITCH_OPTIONS" :key="o" :value="o">{{ o }}</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 10. 订阅时间 -->
          <div class="rc-row">
            <div class="rc-label">订阅时间</div>
            <div class="rc-ctrl">
              <el-date-picker
                v-model="form.subscribeRange"
                class="rc-range"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :clearable="false"
              />
            </div>
          </div>

          <!-- 11. 发送时间 -->
          <div class="rc-row">
            <div class="rc-label">发送时间</div>
            <div class="rc-ctrl">
              <el-radio-group v-model="form.sendTimeMode" class="report-radio-group rc-radio">
                <el-radio-button v-for="o in SEND_TIME_MODES" :key="o" :value="o">{{ o }}</el-radio-button>
              </el-radio-group>
              <el-tooltip :content="SEND_TIME_HINT" placement="top">
                <span class="rc-info">
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2" />
                    <text x="8" y="11.6" text-anchor="middle" font-size="9.5" fill="currentColor">?</text>
                  </svg>
                </span>
              </el-tooltip>
              <div class="rc-time-row">
                <el-time-picker
                  v-model="form.timeStart"
                  class="rc-time"
                  placeholder="起始时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
                <span class="rc-time-sep">-</span>
                <el-time-picker
                  v-model="form.timeEnd"
                  class="rc-time"
                  placeholder="结束时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
              </div>
              <div class="rc-hint">{{ SEND_TIME_HINT }}</div>
            </div>
          </div>

          <!-- 12. 订阅内容 -->
          <div class="rc-row">
            <div class="rc-label">订阅内容</div>
            <div class="rc-ctrl rc-content">
              <el-checkbox-group v-model="form.contents">
                <el-checkbox v-for="o in CONTENT_OPTIONS" :key="o" :value="o">{{ o }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>

          <!-- 13. AI数据分析 -->
          <div class="rc-row">
            <div class="rc-label">AI数据分析</div>
            <div class="rc-ctrl">
              <el-checkbox v-model="form.aiAnalysis" class="rc-ai">生成数据概要，随报表一起推送</el-checkbox>
              <span class="rc-hint rc-hint--inline">{{ AI_HINT }}</span>
            </div>
          </div>

          <!-- 14. 推送方式 -->
          <div class="rc-row">
            <div class="rc-label">推送方式</div>
            <div class="rc-ctrl">
              <el-checkbox-group v-model="form.pushMethods" class="rc-push">
                <el-checkbox v-for="o in PUSH_METHODS" :key="o" :value="o" class="rc-push-item">{{ o }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>

          <!-- 底部：取消 / 完成 -->
          <div class="rc-footer">
            <el-button plain class="rc-btn" @click="goBack">取消</el-button>
            <el-button type="primary" class="rc-btn" @click="onSubmit">完成</el-button>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 「编辑模板」：真实弹层（可勾选报表附件列），不是占位 toast -->
    <el-dialog
      v-model="tplVisible"
      title="编辑模板"
      width="560px"
      :append-to-body="false"
      class="rc-tpl-dialog"
    >
      <p class="rc-tpl-desc">
        自定义模板用于配置报表附件（xlsx）包含的列与指标。勾选需要携带的列，保存后随报表一起推送。
      </p>
      <el-checkbox-group v-model="tplColumns" class="rc-tpl-cols">
        <el-checkbox v-for="c in TPL_COLUMNS" :key="c" :value="c" class="rc-tpl-col">{{ c }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="tplVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';

/* ---------- 常量（文案与线上逐字一致） ---------- */
const MEDIA_OPTIONS = [
  '巨量广告(新)',
  '巨量广告·智擎',
  '巨量广告·全域',
  '巨量广告(标准+智擎)',
  '腾讯广告3.0',
  '腾讯广告3.0(多口径)',
  '腾讯广告2.0',
  '全部',
];
const DIMENSION_OPTIONS = ['媒体账户', '媒体汇总', '财务流水', '智投项目', '项目分组', '人员'];
const REPORT_TYPES = ['时报', '日报', '周报', '月报'];
const REPORT_STYLES = ['默认', '自定义'];
const SWITCH_OPTIONS = ['关闭', '开启'];
const SEND_TIME_MODES = ['时间段内每个整点发送', '指定具体时间点发送'];
const CONTENT_OPTIONS = ['报表(xlsx)', '报表截图'];
const PUSH_METHODS = ['邮箱', '钉钉', '飞书', '企业微信'];

const SORT_HINT =
  '每次发送时按所选指标重排账户行，连续的账户行为一段，手写行或空行会把前后隔成两段分别排序；缺少该指标或无数据的账户排在本段最后；表头及其他内容位置不变。开启后，报表附件中的公式将以计算结果的数值呈现。';
const SEND_TIME_HINT = '整点数据一般会在30min内发出，受媒体接口性能影响可能会有波动。';
const AI_HINT = '概要由大模型根据下方分析要求生成，仅供参考，请以报表数据为准。';
const EXCLUDE_HINT = '开启后，报表中不包含统计周期内无消耗的账户。';

const TPL_COLUMNS = [
  '日期',
  '账户名称',
  '账户ID',
  '媒体',
  '消耗',
  '曝光量',
  '点击量',
  '转化量',
  '转化率',
  '成交金额',
];

/* ---------- 左侧报表侧栏 ---------- */
const SIDE_ACTIVE = '报表订阅';
const EFFECT_ITEMS = [
  { title: '账户报表', name: 'report-account' },
  { title: '项目报表', name: 'report-project' },
  { title: '广告报表', name: 'report-ad' },
  { title: '组件报表', name: 'report-component' },
  { title: '素材报表', name: 'report-material' },
  { title: '报表订阅', name: 'report-subscribe' },
];
const BIZ_ITEMS = [
  { title: '人效管理', name: 'report-people' },
  { title: '财务管理', name: 'report-finance' },
  { title: '资金使用率', name: 'report-funds' },
];

/* ---------- 表单初值（与线上一致） ---------- */
const form = reactive({
  name: '',
  media: '巨量广告(新)',
  dimension: '媒体账户',
  reportType: '时报',
  reportStyle: '自定义',
  sendSort: '关闭',
  excludeNoCost: '关闭',
  subscribeStatus: '开启',
  subscribeRange: [],
  sendTimeMode: '时间段内每个整点发送',
  timeStart: '',
  timeEnd: '',
  contents: ['报表(xlsx)'],
  aiAnalysis: false,
  pushMethods: [],
});

/* ---------- 模板编辑弹层 ---------- */
const tplVisible = ref(false);
const tplColumns = ref(['日期', '账户名称', '消耗', '曝光量', '点击量']);

/* ---------- 交互 ---------- */
const router = useRouter();

function goBack() {
  router.push({ name: 'report-subscribe' });
}

function onSideSelect(title) {
  const all = [...EFFECT_ITEMS, ...BIZ_ITEMS];
  const hit = all.find((i) => i.title === title);
  if (hit) router.push({ name: hit.name });
}

function saveTemplate() {
  tplVisible.value = false;
  ElMessage.success(`模板已保存，共 ${tplColumns.value.length} 列`);
}

function onSubmit() {
  ElMessage.success('新建报表成功');
  router.push({ name: 'report-subscribe' });
}

/* ---------- 报表设计令牌 ----------
 * 报表模块的令牌挂在 body.report-scope 上（AppLayout 按 route.name 挂载，
 * 新建页的 route 名不在其中），本页自行挂载/摘除，保证 EP 组件颜色与其它报表页一致。 */
const REPORT_ROUTE_NAMES = new Set([
  'report-account',
  'report-project',
  'report-ad',
  'report-component',
  'report-material',
  'report-subscribe',
  'report-people',
  'report-finance',
  'report-funds',
  'report-custom-create',
]);

onMounted(() => {
  // 子组件的 onMounted 先于父组件（AppLayout）的 onMounted 执行，
  // nextTick 等父组件挂载完再挂令牌，避免被 AppLayout 的 syncAssetScope 摘掉。
  nextTick(() => document.body.classList.add('report-scope'));
});

onUnmounted(() => {
  // 跳到其它报表页时保留令牌（AppLayout 会自行挂载），跳到非报表页则摘除
  const name = router.currentRoute.value.name;
  if (!REPORT_ROUTE_NAMES.has(name)) document.body.classList.remove('report-scope');
});
</script>

<style scoped>
/* ============================================================
 * 新建报表 —— 整页表单样式
 * 颜色/圆角等令牌复用 views/report/reportPage.css（body.report-scope），
 * 这里只写本页的排版差异。
 * ============================================================ */

/* 根容器：取消全局 .app-content 的 16px 20px 内边距（线上表单区贴边） */
.app-content > div.rc-create {
  padding: 0 !important;
}

.rc-create {
  display: flex;
  align-items: stretch;
  min-height: 100%;
  background: #fff;
}

/* ---------- 左侧报表侧栏（线上 160px 白底 + 右分隔线） ---------- */
.rc-sider {
  flex: 0 0 160px;
  width: 160px;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  overflow-y: auto;
}
.rc-menu {
  border-right: none;
  --el-menu-item-font-size: 15px;
}
.rc-menu :deep(.el-menu-item [class^=el-icon]),
.rc-menu :deep(.el-sub-menu [class^=el-icon]) {
  font-size: 19px;
}

/* ---------- 右侧主区 ---------- */
.rc-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* 顶部：返回箭头 + 标题（线上高 48px，下边框 #e8eaec） */
.rc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 48px;
  border-bottom: 1px solid #e8eaec;
  background: #fff;
}
.rc-back {
  font-size: 18px;
  color: #333333;
  cursor: pointer;
}
.rc-back:hover { color: #197afb; }
.rc-title {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
}

/* 表单区：线上左侧留白 48px（内容区起点 160 + 48 = 208） */
.rc-body {
  flex: 1 1 auto;
  padding: 32px 48px 24px;
}

/* ---------- 表单行 ---------- */
.rc-form { width: 100%; }
.rc-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
}
.rc-label {
  flex: 0 0 128px;
  width: 128px;
  font-size: 13px;
  color: #666666;
  line-height: 32px;
  text-align: left;
  white-space: nowrap;
}
.rc-ctrl {
  flex: 1 1 auto;
  min-width: 0;
}

/* 说明文案（线上 13px / #999） */
.rc-hint {
  margin-top: 8px;
  font-size: 13px;
  line-height: 20px;
  color: #999999;
}
.rc-hint--inline {
  display: inline-block;
  margin-top: 0;
  margin-left: 8px;
  vertical-align: middle;
}

/* ---------- 控件尺寸（线上实测） ---------- */
/* 输入框 / 下拉：宽 360px，高 32px，字号 13px */
.rc-input { width: 360px; }
.rc-select { width: 360px; }
.rc-input :deep(.el-input__wrapper),
.rc-select :deep(.el-select__wrapper) {
  min-height: 32px;
  padding: 0 10px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
.rc-input :deep(.el-input__inner),
.rc-select :deep(.el-select__selected-item),
.rc-select :deep(.el-select__placeholder) {
  font-size: 13px;
}
/* 名称字数统计（0/100） */
.rc-count {
  font-size: 12px;
  color: #909399;
  line-height: 1;
}

/* 订阅时间：daterange 宽 320px */
.rc-range { width: 320px; }
.rc-range :deep(.el-input__wrapper) {
  min-height: 32px;
  padding: 0 10px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
.rc-range :deep(.el-range-input) { font-size: 13px; }

/* 起始时间 / 结束时间：各 120px */
.rc-time-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 26px;
}
.rc-time { width: 120px; }
.rc-time :deep(.el-input__wrapper) {
  min-height: 32px;
  padding: 0 10px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
.rc-time :deep(.el-input__inner) { font-size: 13px; }
.rc-time :deep(.el-input__prefix) { color: #c0c4cc; }
.rc-time-sep {
  font-size: 13px;
  color: #333333;
}

/* ---------- radio-button 组（线上选中态：浅蓝底 + 主色描边 + 主色字） ---------- */
.rc-radio :deep(.el-radio-button__inner) {
  background: #fff;
  border-color: #dcdfe6;
  color: #333333;
  font-size: 12px;
  padding: 10px 12px;
  line-height: 12px;
}
.rc-radio :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #d6eaff;
  border-color: #197afb;
  color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
.rc-radio :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 3px 0 0 3px;
}
.rc-radio :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 3px 3px 0;
}

/* ⓘ 提示图标（线上：灰色圆圈问号） */
.rc-info {
  display: inline-flex;
  align-items: center;
  margin-left: 12px;
  color: #c0c4cc;
  cursor: pointer;
  vertical-align: middle;
}
.rc-info:hover { color: #197afb; }

/* ---------- 订阅内容 / AI数据分析 ---------- */
.rc-content :deep(.el-checkbox) {
  margin-right: 24px;
}
.rc-content :deep(.el-checkbox__label),
.rc-ai :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #333333;
}
/* 线上已勾选项文案为蓝色 */
.rc-content :deep(.el-checkbox.is-checked .el-checkbox__label) {
  color: #197afb;
}
.rc-ai { margin-right: 0; }

/* ---------- 推送方式（线上是 4 个带右上角小三角的下拉式方框） ---------- */
.rc-push {
  display: inline-flex;
  align-items: stretch;
}
.rc-push :deep(.el-checkbox) {
  margin-right: 0;
}
.rc-push :deep(.el-checkbox__input) { display: none; }
.rc-push :deep(.el-checkbox__label) {
  position: relative;
  display: inline-block;
  height: 32px;
  line-height: 30px;
  padding: 0 26px;
  font-size: 13px;
  color: #333333;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 0;
}
.rc-push :deep(.el-checkbox:first-child .el-checkbox__label) {
  border-radius: 3px 0 0 3px;
}
.rc-push :deep(.el-checkbox:last-child .el-checkbox__label) {
  border-right: 1px solid #dcdfe6;
  border-radius: 0 3px 3px 0;
}
/* 右上角小三角（下拉指示） */
.rc-push :deep(.el-checkbox__label)::after {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-top-color: #c0c4cc;
  border-right-color: #c0c4cc;
}
.rc-push :deep(.el-checkbox.is-checked .el-checkbox__label) {
  color: #197afb;
  border-color: #197afb;
}
.rc-push :deep(.el-checkbox.is-checked .el-checkbox__label)::after {
  border-top-color: #197afb;
  border-right-color: #197afb;
}

/* ---------- 按钮 ---------- */
/* 设置报表：160×32 主按钮 */
.rc-tpl-btn {
  width: 160px;
  font-size: 13px;
}
/* 底部：取消 / 完成 各 120×32 */
.rc-btn {
  width: 120px;
  font-size: 13px;
}

/* 底部按钮区：与控件列对齐（线上取消按钮 x=336 = 208 + 128） */
.rc-footer {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  padding: 16px 0 0 128px;
  border-top: 1px solid #e8eaec;
}

/* ---------- 模板编辑弹层 ---------- */
.rc-tpl-desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 20px;
  color: #666666;
}
.rc-tpl-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px 12px;
}
.rc-tpl-col {
  margin-right: 0;
}
.rc-tpl-col :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #333333;
}
</style>
