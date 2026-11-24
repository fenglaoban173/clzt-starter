<template>
  <ReportPageShell
    class="finance-page"
    v-model:period="period"
    v-model:date-range="dateRange"
    title="财务管理"
    :selects="selects"
    :dimensions="[]"
    :show-media="false"
    :show-search="false"
    :show-data-filter="false"
  >
    <!-- 页头二级页签：巨量广告 / 腾讯广告 -->
    <template #subtabs>
      <div class="report-subtabs">
        <span
          v-for="t in subTabs"
          :key="t"
          class="report-subtab"
          :class="{ active: t === subTab }"
          @click="subTab = t"
        >{{ t }}</span>
      </div>
    </template>

    <!-- 详细数据 -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">
          详细数据
          <el-popover placement="right" :width="600" trigger="click">
            <template #reference><el-icon><QuestionFilled /></el-icon></template>
            <div>1.每天更新前一天的数据；若前一天账户停用或授权失败，则当日该账户财务数据为空；</div>
            <div>2.广告报表因每15分钟同步一次数据，停用或授权失败账户仍会有数据积累；</div>
          </el-popover>
        </div>
        <div class="report-card-actions">
          <el-select
            v-model="customMetrics"
            size="small"
            class="custom-metric-select"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            placeholder="自定义指标"
          >
            <el-option v-for="c in FINANCE_COLUMNS" :key="c.prop" :label="c.label" :value="c.label" />
          </el-select>
          <el-button size="small" plain @click="onExport">导出数据</el-button>
          <el-popover placement="bottom" :width="200" trigger="click">
            <template #reference><el-icon class="card-help-icon"><QuestionFilled /></el-icon></template>
            导出所有页面的数据
          </el-popover>
        </div>
      </div>

      <div class="report-table-wrap">
        <el-table
          class="report-table"
          :data="pageRows"
          row-key="id"
          border
          show-summary
          :summary-method="summaryMethod"
        >
          <el-table-column
            v-for="col in tableColumns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :align="col.align || 'left'"
            :sortable="col.sortable"
            :render-header="col.tip ? renderTip(col.label, col.tip) : undefined"
            show-overflow-tooltip
          />
        </el-table>

        <div class="report-pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="allRows.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>
  </ReportPageShell>
</template>

<script setup>
import { computed, h, reactive, ref, watch } from 'vue';
import { ElMessage, ElTooltip } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';
import ReportPageShell from '../components/ReportPageShell.vue';
import {
  ADVERTISER_OPTIONS,
  FINANCE_COLUMNS,
  PARTNER_OPTIONS,
  PROJECT_OPTIONS,
  financeRows,
  singleDay,
} from '@/mock/reportData';

// 经营分析页「优化师」下拉：线上实测为「姓名 (邮箱)」格式
const OPTIMIZER_OPTIONS = [
  '北京央广时代文化传播有限公司 (liuziyuan01@ygsdmedia.com)',
  '张从浩 (zhangconghao@ygsdmedia.com)',
  '王春雷 (wangchunlei@ygsdmedia.com)',
  '郭峻宇 (guojunyu@ygsdmedia.com)',
  '孙诗源 (sunshiyuan@ygsdmedia.com)',
  'gongwenqing (gongwenqing@ygsdmedia.com)',
  'lixue (lixue@ygsdmedia.com)',
  'jiangxin (jiangxin@ygsdmedia.com)',
  'chenpeihua (chenpeihua@ygsdmedia.com)',
  '1304275504 (1304275504@qq.com)',
  '文清滨 (wenqingbin@ygsdmedia.com)',
  '李若涵 (liruohan@ygsdmedia.com)',
  '杨浩蒙 (yanghaomeng@ygsdmedia.com)',
  '刘松涵 (liusonghan01@ygsdmedia.com)',
  '申旭阳 (shenxuyang@ygsdmedia.com)',
];
// 去掉「(邮箱)」后缀，便于与明细表的姓名列匹配
const plainName = (s) => String(s).replace(/\s*\([^)]*\)\s*$/, '');
// 线上明细表优化师
const FINANCE_OPTIMIZERS = ['申旭阳', '杨浩蒙', '文清滨'];

// ---------- 页头状态 ----------
const subTabs = ['巨量广告', '腾讯广告'];
const subTab = ref('巨量广告');
const period = ref('分日');
const dateRange = ref(singleDay());
const customMetrics = ref([]);

// ---------- 筛选维度（组合盒下拉，本页仅此一行） ----------
const selects = reactive([
  { key: 'advertiser', label: '广告主', placeholder: '请选择广告主账号', options: ADVERTISER_OPTIONS, model: [] },
  { key: 'optimizer', label: '优化师', placeholder: '请选择优化师', options: OPTIMIZER_OPTIONS, model: [] },
  { key: 'partner', label: '合作商', placeholder: '请选择合作商', options: PARTNER_OPTIONS, model: [] },
  { key: 'project', label: '项目', placeholder: '请选择项目', options: PROJECT_OPTIONS, model: [] },
]);

// ---------- 列定义（线上列宽 + 指标口径说明） ----------
const FINANCE_WIDTH = {
  date: 160, advertiser_name: 160, advertiser_id: 150, partner: 200, optimizer: 120,
  shared_wallet_cost: 160, shared_gift_cost: 160, total_cost: 128, cash_cost: 128,
  gift_cost: 150, total_income: 128, total_transfer_in: 120, total_transfer_out: 120, frozen: 120,
};
const FINANCE_TIP = {
  shared_wallet_cost: '共享赠款支出，共享赠款支出+账户总支出=账户报表消耗数据',
  shared_gift_cost: '共享赠款支出，共享赠款支出+账户总支出=账户报表消耗数据',
  total_cost: '广告计划总消耗，现金支出+赠款支出=总支出',
  cash_cost: '广告计划消耗中现金部分',
  gift_cost: '广告计划消耗中赠款部分',
  total_income: '当日充值减去扣款的汇总',
  total_transfer_in: '代理商、其他广告账号转入的总金额',
  total_transfer_out: '转出到代理商、其他广告账号的总金额',
  frozen: '冻结',
};
const tableColumns = computed(() =>
  FINANCE_COLUMNS
    .filter((c) => !customMetrics.value.length || customMetrics.value.includes(c.label))
    .map((c) => {
      const col = { ...c, width: FINANCE_WIDTH[c.prop] || c.width };
      if (FINANCE_TIP[c.prop]) col.tip = FINANCE_TIP[c.prop];
      return col;
    })
);

// ---------- 工具 ----------
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function renderTip(label, tip) {
  return () => h(ElTooltip, { content: tip, placement: 'top' }, { default: () => h('span', label) });
}

// 时间列：分日 → 20261123；分月 → 202611；汇总 → 20261118-20261124
const timeLabel = computed(() => {
  const [s, e] = dateRange.value || [];
  if (!s || !e) return '';
  if (period.value === '分月') {
    const sm = s.slice(0, 7).replace('-', '');
    const em = e.slice(0, 7).replace('-', '');
    return sm === em ? sm : `${sm}-${em}`;
  }
  const sc = s.replace(/-/g, '');
  const ec = e.replace(/-/g, '');
  return sc === ec ? sc : `${sc}-${ec}`;
});

const TENCENT_ADVERTISERS = [
  '腾讯广告-智者天下二分-知乎-APP内付费-802889244-在投',
  '腾讯广告-雷盟-知乎-APP内付费-131-792335571-在投',
  '腾讯广告-智者天下二分-知乎-APP内付费-802889244-在投-2',
  '腾讯广告-百度极速版调起-央广-16',
  '腾讯广告-任意门-央广-代运营-27-安卓-UBA',
];

const stateKey = computed(() => JSON.stringify({
  p: period.value,
  d: dateRange.value,
  s: subTab.value,
  f: {
    a: selects[0].model, o: selects[1].model, pa: selects[2].model, j: selects[3].model,
  },
}));

// ---------- 明细数据 ----------
const allRows = computed(() => {
  const base = financeRows();
  const rand = mulberry32(hashStr(stateKey.value));
  const factor = 0.6 + rand() * 0.95;
  const isTencent = subTab.value === '腾讯广告';
  const names = isTencent ? TENCENT_ADVERTISERS : ADVERTISER_OPTIONS;

  let rows = base.map((r, i) => ({
    ...r,
    advertiser_name: names[i % names.length],
    optimizer: FINANCE_OPTIMIZERS[i % FINANCE_OPTIMIZERS.length],
    project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
    shared_wallet_cost: +(r.shared_wallet_cost * factor).toFixed(2),
    shared_gift_cost: +(r.shared_gift_cost * factor).toFixed(2),
    total_cost: +(r.total_cost * factor).toFixed(2),
    cash_cost: +(r.cash_cost * factor).toFixed(2),
    gift_cost: +(r.gift_cost * factor).toFixed(2),
    total_income: +(r.total_income * factor).toFixed(2),
    total_transfer_in: +(r.total_transfer_in * factor).toFixed(2),
    total_transfer_out: +(r.total_transfer_out * factor).toFixed(2),
    frozen: +(r.frozen * factor).toFixed(2),
  }));

  const [advSel, optSel, partnerSel, projSel] = selects.map((s) => s.model);
  if (advSel.length) rows = rows.filter((r) => advSel.includes(r.advertiser_name));
  if (optSel.length) {
    const picked = optSel.map(plainName);
    rows = rows.filter((r) => picked.includes(r.optimizer));
  }
  if (partnerSel.length) rows = rows.filter((r) => partnerSel.includes(r.partner));
  if (projSel.length) rows = rows.filter((r) => projSel.includes(r.project));

  return rows.map((r) => ({ ...r, date: timeLabel.value }));
});

const page = ref(1);
const pageSize = ref(20);
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return allRows.value.slice(start, start + pageSize.value);
});
watch(allRows, () => { page.value = 1; });

// ---------- 合计行 ----------
function summaryMethod({ columns }) {
  const data = allRows.value;
  const sum = (key) => data.reduce((a, r) => a + (Number(r[key]) || 0), 0);
  const map = {
    date: '合计',
    advertiser_name: '--',
    advertiser_id: '--',
    partner: '--',
    optimizer: '--',
    shared_wallet_cost: +sum('shared_wallet_cost').toFixed(2),
    shared_gift_cost: +sum('shared_gift_cost').toFixed(2),
    total_cost: +sum('total_cost').toFixed(2),
    cash_cost: +sum('cash_cost').toFixed(2),
    gift_cost: +sum('gift_cost').toFixed(2),
    total_income: +sum('total_income').toFixed(2),
    total_transfer_in: +sum('total_transfer_in').toFixed(2),
    total_transfer_out: +sum('total_transfer_out').toFixed(2),
    frozen: +sum('frozen').toFixed(2),
  };
  return columns.map((col) => {
    const prop = col.property || col.prop;
    const v = map[prop];
    if (v === undefined) return '';
    return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : v;
  });
}

// ---------- 操作 ----------
function onExport() {
  ElMessage.success('导出成功');
}
</script>

<style scoped>
/* 线上本页没有「+ 添加筛选」「查询」按钮 */
.finance-page :deep(.report-add-filter) { display: none; }
.finance-page :deep(.report-query-btn) { display: none; }
.custom-metric-select { width: 130px; }
.card-help-icon { color: #c0c4cc; cursor: pointer; }
</style>
