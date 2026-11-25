<template>
  <!-- 报表订阅 —— 1:1 对齐创量线上 cl.mobgi.com/report/adsdata/custom/customreport
   * 线上结构（与其它报表页不同）：
   *   ① 页签：我的报表 / 分组配置 / 分组合计配置（无粒度 radio、无日期区间）
   *   ② 工具条：全部媒体下拉 + 报表名称/ID 搜索 + 新建指引 + 新增报表
   *   ③ 明细表：14 列、无勾选列、无合计行、无分页
   * 本页没有 .report-filter 筛选区，故 ReportPageShell 传 show-filter=false -->
  <ReportPageShell
    class="report-sub-page"
    title=""
    :periods="[]"
    :show-date="false"
    :show-filter="false"
  >
    <!-- ① 页签 -->
    <template #subtabs>
      <div class="report-subtabs">
        <span
          v-for="t in SUB_TABS"
          :key="t.key"
          class="report-subtab"
          :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key"
        >{{ t.label }}</span>
      </div>
    </template>

    <!-- ② 工具条 -->
    <template #before-filter>
      <div class="report-sub-toolbar">
        <!-- 媒体（线上是「标签 + 下拉」组合盒：标签「全部媒体」，默认选中「不限」） -->
        <div class="report-select-box">
          <label>全部媒体</label>
          <el-select v-model="media" size="small" placeholder="全部媒体">
            <el-option
              v-for="o in SUBSCRIBE_MEDIA_OPTIONS"
              :key="o"
              :label="o"
              :value="o"
            />
          </el-select>
        </div>

        <!-- 报表名称 / ID 搜索 -->
        <div class="report-search-box">
          <el-input
            v-model="keyword"
            size="small"
            placeholder="输入报表名称或ID"
            :suffix-icon="Search"
          />
        </div>

        <!-- 新建指引 -->
        <div class="report-guide">
          <el-icon class="report-guide-icon"><Pointer /></el-icon>
          <span>新建指引:</span>
          <a @click="onGuide('项目报表')">项目报表</a>
          <span class="report-guide-sep">|</span>
          <a @click="onGuide('自定义报表')">自定义报表</a>
        </div>

        <!-- 新增报表 -->
        <el-button type="primary" class="report-sub-add-btn" @click="onAdd">新增报表</el-button>
      </div>
    </template>

    <!-- ③ 明细表（我的报表） -->
    <ReportDetailTable
      v-if="activeTab === 'mine'"
      class="report-sub-card"
      title=""
      :columns="COLUMNS"
      :rows="visibleRows"
      :selectable="false"
      :show-custom-metric="false"
      :show-export="false"
      :total="0"
    >
      <!-- 订阅：蓝色开关 -->
      <template #col-enabled="{ row }">
        <el-switch v-model="row.enabled" />
      </template>

      <!-- 操作：发送记录 / 导出 / 编辑 / 复制 / 删除 -->
      <template #col-ops="{ row }">
        <div class="report-op-links">
          <a @click="onOp('发送记录', row)">发送记录</a>
          <a @click="onOp('导出', row)">导出</a>
          <a @click="onOp('编辑', row)">编辑</a>
          <a @click="onOp('复制', row)">复制</a>
          <a @click="onOp('删除', row)">删除</a>
        </div>
      </template>
    </ReportDetailTable>

    <!-- 分组配置 / 分组合计配置：线上采集时未展开，本地给出空态 -->
    <div v-else class="report-sub-empty">
      <el-empty :description="`${currentTab.label}暂无数据`" :image-size="90" />
    </div>
  </ReportPageShell>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Pointer, Search } from '@element-plus/icons-vue';
import ReportPageShell from '../components/ReportPageShell.vue';
import ReportDetailTable from '../components/ReportDetailTable.vue';
import { SUBSCRIBE_COLUMNS, SUBSCRIBE_MEDIA_OPTIONS, subscribeRows } from '@/mock/reportData';

/* ---------- 二级页签 ---------- */
const SUB_TABS = [
  { key: 'mine', label: '我的报表' },
  { key: 'group', label: '分组配置' },
  { key: 'group-sum', label: '分组合计配置' },
];
const activeTab = ref('mine');
const currentTab = computed(
  () => SUB_TABS.find((t) => t.key === activeTab.value) || SUB_TABS[0]
);

/* ---------- 列定义 ----------
 * 标签/字段/对齐都取自共享 mock 的 SUBSCRIBE_COLUMNS（操作列居中、订阅列左对齐，
 * 与线上一致），这里只把列宽换成线上采集的实测值：
 *   80/120/247/100/80/80/80/96/180/96/96/96/96/280（合计 1727px，
 *   与线上表格宽度 1728px 一致，14 列刚好铺满不横向滚动） */
const SPEC_WIDTH = {
  enabled: 80,
  report_id: 120,
  report_name: 247,
  media: 100,
  dimension: 80,
  report_type: 80,
  report_style: 80,
  send_time: 96,
  valid_range: 180,
  content_type: 96,
  push_type: 96,
  created_at: 96,
  creator: 96,
  ops: 280,
};
const COLUMNS = SUBSCRIBE_COLUMNS.map((c) => ({
  ...c,
  width: SPEC_WIDTH[c.prop] || c.width,
  minWidth: undefined,
}));

/* ---------- 行数据 ----------
 * 以共享 mock 的 subscribeRows() 为底，补齐线上 DOM 里的全量字段值
 * （mock 里这几项是按显示宽度预截断的，线上由单元格省略号截断显示） */
const ONLINE_FIELDS = [
  {
    send_time: '10:00、14:00、18:00、22:00',
    content_type: '报表截图、Excel报表',
    created_at: '2026-10-10 15:48:46',
    creator: '北京央广时代文化传播有限公司',
  },
  {
    send_time: '10:00、14:00、18:00、22:00',
    content_type: '报表截图、Excel报表',
    created_at: '2026-06-09 09:23:08',
    creator: '北京央广时代文化传播有限公司',
  },
  {
    send_time: '10:00、14:00、18:00、22:00、16:00',
    content_type: '报表截图、Excel报表',
    created_at: '2026-06-09 09:37:58',
    creator: '北京央广时代文化传播有限公司',
  },
];
const ROWS = subscribeRows().map((row, i) => ({ ...row, ...ONLINE_FIELDS[i] }));

/* ---------- 工具条筛选 ---------- */
const media = ref('不限'); // 线上默认选中「不限」
const keyword = ref('');

/* 媒体下拉的 8 个选项（共享 SUBSCRIBE_MEDIA_OPTIONS，线上实测）→ 行内媒体关键字 */
const MEDIA_KEYWORDS = {
  不限: '',
  '巨量广告(新)': '巨量广告',
  '巨量广告·智擎': '智擎',
  '巨量广告·全域': '全域',
  '巨量广告(标准+智擎)': '标准',
  '腾讯广告3.0': '腾讯',
  '腾讯广告3.0(多口径)': '腾讯',
  '腾讯广告2.0': '腾讯',
};
const visibleRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const mk = MEDIA_KEYWORDS[media.value] || '';
  return ROWS.filter((r) => {
    if (mk && !r.media.includes(mk)) return false;
    if (!kw) return true;
    return (
      r.report_name.toLowerCase().includes(kw) ||
      r.report_id.toLowerCase().includes(kw)
    );
  });
});

/* ---------- 交互 ---------- */
const router = useRouter();

function onAdd() {
  // 线上「新增报表」跳整页新建表单（/report/adsdata/custom/design?type=create&source=custom）
  router.push({ name: 'report-custom-create' });
}
function onGuide(name) {
  ElMessage.info(`新建指引：${name}`);
}
function onOp(op, row) {
  ElMessage.info(`${op}：${row.report_name}`);
}
</script>

<style scoped>
/* ============================================================
 * 报表订阅 · 本页专属样式
 * 通用类名（.report-subtabs/.report-select-box/.report-search-box/
 * .report-guide/.report-op-links/.report-table …）全部取自
 * views/report/reportPage.css，这里只做本页的差异修正
 * ============================================================ */

/* ---------- 工具条 ---------- */
.report-sub-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px 16px;
  background: #fff;
}
/* 线上搜索框：输入区与放大镜图标区之间有一条竖分隔线 */
.report-sub-toolbar :deep(.report-search-box .el-input__suffix-inner) {
  border-left: 1px solid #dcdfe6;
}
.report-guide-icon {
  color: #197afb;
  font-size: 16px;
}
.report-guide-sep {
  color: #c0c4cc;
}
/* 新增报表：线上 el-button w120 el-button--primary（高 32px / 12px 字） */
.report-sub-add-btn {
  margin-left: auto;
  width: 120px;
  font-size: 12px;
}

/* ---------- 页头 ---------- */
/* 本页没有标题文案，页签左移贴齐内容区；页签与工具条之间无线（线上是一整条白色带） */
body.report-scope .report-sub-page :deep(.report-title) {
  display: none;
}
body.report-scope .report-sub-page :deep(.report-head-left) {
  gap: 0;
}
/* 页签与工具条之间无线（线上是一整条白色带）；左右留白由共享 reportPage.css
 * 的 .report-head / .report-body 16px 内边距提供，这里不再叠加 */
body.report-scope .report-sub-page :deep(.report-head) {
  border-bottom: none;
}

/* ---------- 表格 ---------- */
/* 线上本页表格直接铺在页面底色上（无卡片外框/内留白），这里去掉
 * ReportDetailTable 的通用卡片外观，并按要求去掉合计行与分页 */
body.report-scope .report-sub-card {
  background: transparent;
  border: none;
  border-radius: 0;
}
body.report-scope .report-sub-card :deep(.report-card-head) {
  display: none;
}
body.report-scope .report-sub-card :deep(.report-table-wrap) {
  padding: 0;
}
body.report-scope .report-sub-card :deep(.el-table__footer-wrapper) {
  display: none;
}
body.report-scope .report-sub-card :deep(.report-pager) {
  display: none;
}

/* ---------- 分组配置 / 分组合计配置 空态 ---------- */
.report-sub-empty {
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 4px;
  padding: 48px 0;
}
</style>
