<template>
  <div v-loading="loading" class="page">
    <!-- 筛选行：标签内嵌在下拉框内，单行排布 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-select
          v-model="filters.subject"
          class="f-box f-w-subject"
          :style="{ '--f-w': subjectWidth + 'px' }"
          multiple
          collapse-tags
          collapse-tags-tooltip
          filterable
          :filter-method="(q) => setQuery('subject', q)"
          clearable
          placeholder="全部"
          :title="multiText(filters.subject)"
        >
          <template #prefix><span class="f-prefix">账户主体：</span></template>
          <el-option v-for="s in matchOptions(subjectOptions, queries.subject, filters.subject)" :key="s" :value="s" :label="s" />
        </el-select>

        <el-select
          v-model="filters.project"
          class="f-box f-w-project"
          :style="{ '--f-w': projectWidth + 'px' }"
          multiple
          collapse-tags
          collapse-tags-tooltip
          filterable
          :filter-method="(q) => setQuery('project', q)"
          clearable
          placeholder="全部"
          :title="multiText(filters.project)"
        >
          <template #prefix><span class="f-prefix">智投项目：</span></template>
          <el-option v-for="p in matchOptions(projectOptions, queries.project, filters.project)" :key="p" :value="p" :label="p" />
        </el-select>

        <el-select
          v-model="filters.optimizer"
          class="f-box f-w-optimizer"
          :style="{ '--f-w': optimizerWidth + 'px' }"
          multiple
          collapse-tags
          collapse-tags-tooltip
          filterable
          :filter-method="(q) => setQuery('optimizer', q)"
          clearable
          placeholder="全部"
          :title="multiText(filters.optimizer)"
        >
          <template #prefix><span class="f-prefix">优化师：</span></template>
          <el-option v-for="o in matchOptions(optimizerOptions, queries.optimizer, filters.optimizer)" :key="o" :value="o" :label="o" />
        </el-select>

        <div class="name-filter">
          <el-select
            v-model="filters.nameType"
            class="f-name-type"
            :style="{ '--f-w': nameTypeWidth + 'px' }"
            filterable
            :filter-method="(q) => setQuery('nameType', q)"
          >
            <el-option
              v-for="t in matchOptions(nameTypeOptions, queries.nameType, filters.nameType)"
              :key="t.value"
              :value="t.value"
              :label="t.label"
            />
          </el-select>
          <el-input v-model="filters.keyword" class="f-keyword" placeholder="请输入关键词" clearable @keyup.enter="onSearch" />
          <el-button class="f-search-btn" title="搜索" @click="onSearch"><el-icon><Search /></el-icon></el-button>
        </div>

        <!-- 部门：线上为树形选择器（可搜索），5 个职能部门（R84） -->
        <el-tree-select
          v-model="filters.dept"
          class="f-box f-w-dept"
          :style="{ '--f-w': deptWidth + 'px' }"
          :data="deptTree"
          filterable
          check-strictly
          clearable
          placeholder="请选择部门"
          :title="filters.dept || ''"
        >
          <template #prefix><span class="f-prefix">部门：</span></template>
        </el-tree-select>

        <template v-if="!isUpgrade">
          <el-select
            v-model="filters.status"
            class="f-box f-w-status"
            :style="{ '--f-w': statusWidth + 'px' }"
            clearable
            placeholder="全部"
            :title="filters.status || ''"
          >
            <template #prefix><span class="f-prefix">账户状态：</span></template>
            <el-option value="normal" label="正常" />
            <el-option value="auth_expired" label="授权失效" />
            <el-option value="blocked" label="已解绑" />
          </el-select>
        </template>

        <el-button link type="primary" @click="resetFilters">清空</el-button>
        <div class="filter-actions">
          <el-button type="primary" @click="onSearch">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <!-- 操作行 -->
      <div class="op-row">
        <div class="op-left">
          <el-dropdown trigger="click" :disabled="!selected.length" @command="onBatchOp">
            <el-button :disabled="!selected.length">批量操作<el-icon class="el-icon--right"><CaretBottom /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">批量修改账户名称</el-dropdown-item>
                <el-dropdown-item command="budget">修改日预算</el-dropdown-item>
                <el-dropdown-item command="blockword">添加屏蔽词</el-dropdown-item>
                <el-dropdown-item command="rta">设置账户RTA</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-if="selected.length" class="sel-tip">已选择{{ selected.length }}个媒体账户</span>
          <el-button type="primary" @click="onCreativeClean">创意清理</el-button>
        </div>
        <div class="op-right">
          <el-button class="light-btn" @click="onSync">手动同步</el-button>
          <el-button @click="onExport">导出数据</el-button>
          <!-- 自定义指标：悬停展示已保存的指标模板，点击打开自定义指标弹窗 -->
          <el-dropdown v-if="templates.length" trigger="hover" @command="onTplCommand">
            <el-button @click="openCustomMetric"><el-icon><Operation /></el-icon>自定义指标</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="tpl in templates" :key="tpl.id" :command="tpl.id">
                  <span class="tpl-name">{{ tpl.name }}</span>
                  <el-icon class="tpl-del" title="删除模板" @click.stop="delTemplate(tpl)"><Delete /></el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-else @click="openCustomMetric"><el-icon><Operation /></el-icon>自定义指标</el-button>
        </div>
      </div>

      <el-table
        :data="rows"
        row-key="id"
        border
        style="margin-top: 12px"
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
      >
        <el-table-column type="selection" width="42" :selectable="(row) => !row.__total" />
        <el-table-column label="账户名称" :min-width="230" fixed="left">
          <template #default="{ row }">
            <div v-if="row.__total" class="total-label">合计</div>
            <div v-else class="acc-name">
              <a class="link" @click="onDetail(row)">{{ row.name }}</a>
              <div class="acc-id">ID：{{ row.advertiser_id }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" :width="170" fixed="left">
          <template #default="{ row }">
            <template v-if="!row.__total">
              <el-button link type="primary" size="small" @click="onViewProjects(row)">查看项目</el-button>
              <el-button link type="primary" size="small" @click="onViewAds(row)">查看广告</el-button>
            </template>
          </template>
        </el-table-column>

        <!-- 数据列：由「自定义指标」选中的指标及顺序驱动 -->
        <el-table-column
          v-for="col in tableColumns"
          :key="col.key"
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :align="col.align"
          :sortable="col.sortable ? 'custom' : false"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <template v-if="col.type === 'status'">
              <span v-if="row.__total"></span>
              <template v-else>
                <i class="status-dot" :class="statusDot(row)"></i>
                <span class="status-text" :class="statusTextCls(row)">{{ statusText(row) }}</span>
              </template>
            </template>
            <template v-else-if="col.type === 'number'">{{ fmtMetric(row, col.prop, col.digits) }}{{ col.suffix || '' }}</template>
            <template v-else-if="col.type === 'computed'">{{ computedMetric(row, col) }}</template>
            <template v-else-if="col.type === 'dash'">—</template>
            <template v-else>{{ row[col.prop] || '—' }}</template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, prev, pager, next"
        :total="pagination.total"
        :current-page="pagination.current"
        :page-size="pagination.pageSize"
        @current-change="onPage"
      />
    </el-card>

    <!-- 手动同步：同步项目与广告 -->
    <el-dialog
      v-model="syncVisible"
      title="同步项目与广告"
      width="1004px"
      class="sync-dialog"
      :close-on-click-modal="false"
    >
      <div class="sync-form">
        <div class="sync-label">账户</div>
        <div class="sync-content">
          <div class="sync-panels">
            <!-- 左：媒体账户列表 -->
            <div class="sync-panel left">
              <div class="panel-head">媒体账户</div>
              <div class="panel-search">
                <el-select v-model="syncSearchType" class="sync-type">
                  <el-option label="ID" value="id" />
                  <el-option label="账户名称" value="name" />
                </el-select>
                <el-input v-model="syncKeyword" class="sync-input" placeholder="请输入关键词" clearable @keyup.enter="onSyncSearch" />
                <el-button class="sync-search-btn" title="搜索" @click="onSyncSearch"><el-icon><Search /></el-icon></el-button>
              </div>
              <div class="panel-list">
                <el-checkbox
                  class="check-all"
                  :model-value="syncAllChecked"
                  :indeterminate="syncHalfChecked"
                  @change="toggleSyncAll"
                >全选</el-checkbox>
                <div class="list-scroll">
                  <el-checkbox
                    v-for="a in syncPageRows"
                    :key="a.id"
                    class="list-item"
                    :model-value="syncChecked.includes(a.id)"
                    @change="(v) => toggleSyncOne(a, v)"
                  >
                    {{ a.name }}({{ a.advertiser_id }})
                  </el-checkbox>
                  <div v-if="!syncPageRows.length" class="list-empty">暂无数据</div>
                </div>
              </div>
              <el-pagination
                class="sync-pager"
                layout="prev, pager, next"
                :total="syncList.length"
                :page-size="syncPageSize"
                :current-page="syncPage"
                @current-change="onSyncPage"
              />
            </div>

            <!-- 右：已选账户（R82：按「项目和广告」手动同步弹窗的样式：灰色矩形底 + 右侧移除按钮） -->
            <div class="sync-panel right">
              <div class="panel-head sel-head">
                <span>已选：{{ syncChecked.length }}/500</span>
                <el-button link type="primary" @click="syncChecked = []">清空</el-button>
              </div>
              <div class="sel-body">
                <div v-if="!syncCheckedAccounts.length" class="sel-empty">暂未选择媒体账户</div>
                <div v-else class="sel-scroll">
                  <div v-for="a in syncCheckedAccounts" :key="a.id" class="sel-item">
                    <span class="sel-name" :title="syncAccountLabel(a)">{{ syncAccountLabel(a) }}</span>
                    <el-icon class="sel-del" title="移除" @click="removeSyncOne(a)"><Close /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sync-label">更新时间</div>
        <div class="sync-content">
          <el-date-picker
            v-model="syncDateRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="sync-date"
          />
          <div class="sync-tip">建议选择更新时间同步，减少拉取不必要的数据，降低等待时间。</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="syncVisible = false">取消</el-button>
        <el-button type="primary" @click="onSyncConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改账户名称 -->
    <BatchRenameDialog v-model="renameVisible" :accounts="batchAccounts" />
    <!-- 批量修改日预算 -->
    <BatchBudgetDialog v-model="budgetVisible" :accounts="batchAccounts" />
    <!-- 添加屏蔽词 -->
    <BatchBlockWordDialog v-model="blockVisible" :accounts="batchAccounts" />
    <!-- 设置账户RTA -->
    <RtaDialog v-model="rtaVisible" :accounts="batchAccounts" />
    <!-- 自定义指标 -->
    <CustomMetricDialog
      v-model="metricVisible"
      :media="media"
      :model-keys="metricSel[media]"
      @apply="onMetricApply"
      @save-template="onSaveTemplate"
    />
    <!-- 创意清理 -->
    <CreativeCleanDialog v-model="cleanVisible" :accounts="all" />
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { CaretBottom, Close, Delete, Operation, Search } from '@element-plus/icons-vue';
import { mediaApi } from '@/api/media';
import dayjs from 'dayjs';
import BatchRenameDialog from './components/BatchRenameDialog.vue';
import BatchBudgetDialog from './components/BatchBudgetDialog.vue';
import BatchBlockWordDialog from './components/BatchBlockWordDialog.vue';
import RtaDialog from './components/RtaDialog.vue';
import CustomMetricDialog from './components/CustomMetricDialog.vue';
import CreativeCleanDialog from './components/CreativeCleanDialog.vue';
import { DEFAULT_METRICS, METRIC_MAP, loadTemplates, saveTemplates } from './customMetrics';

const route = useRoute();
const router = useRouter();
const media = computed(() => route.query.media || 'upgrade');
const isUpgrade = computed(() => media.value === 'upgrade');

const loading = ref(false);
const all = ref([]);
const selected = ref([]);
const page = ref(1);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const sortState = reactive({ prop: '', order: '' });

const today = dayjs().format('YYYY-MM-DD');

const filters = reactive({
  subject: [], project: [], optimizer: [], dept: '', status: '',
  keyword: '', nameType: 'name',
});

const mediaAccounts = computed(() => all.value.filter((a) => (a.media || 'upgrade') === media.value));
const subjectOptions = computed(() => [...new Set(mediaAccounts.value.map((a) => a.subject || '北京央广时代文化传播有限公司'))]);
const projectOptions = computed(() => [...new Set(mediaAccounts.value.map((a) => a.project).filter(Boolean))]);
const optimizerOptions = computed(() => [...new Set(mediaAccounts.value.map((a) => a.optimizer).filter(Boolean))]);
const deptOptions = computed(() => [...new Set(mediaAccounts.value.map((a) => a.dept).filter(Boolean))]);

// 部门：线上为树形选择器（可搜索），5 个职能部门（R84 实测：编导 / 剪辑 / 默认部门 / 优化 / 技术）
const deptTree = [
  { value: '编导', label: '编导' },
  { value: '剪辑', label: '剪辑' },
  { value: '默认部门', label: '默认部门' },
  { value: '优化', label: '优化' },
  { value: '技术', label: '技术' },
];
// 本地账户部门（业务线）→ 线上职能部门
const DEPT_MAP = {
  网服一部: '编导', 短剧一部: '剪辑', 网服二部: '优化',
  全域运营部: '默认部门', 智擎运营部: '技术',
};
function deptOf(a) {
  return DEPT_MAP[a.dept] || '默认部门';
}

// 关键词检索维度：账户名称 / 账户ID / 账户备注（巨量）
const nameTypeOptions = [
  { value: 'name', label: '账户名称' },
  { value: 'id', label: '账户ID' },
  { value: 'remark_jl', label: '账户备注(巨量)' },
];

// ---------- 下拉框宽度：按「内嵌标签 + 最长选项」自适应 ----------
// 选中值回显在 el-select 内部绝对定位并以省略号截断，宽度不足会显示不全；
// 这里按最长选项预估所需宽度，保证选中内容完整回显。
const FONT_SIZE = 15;
function autoWidth(label, options, min = 180) {
  const maxLen = (options || []).reduce((m, o) => Math.max(m, String(o ?? '').length), 0);
  const labelLen = String(label || '').length;
  // 文字宽度 + 上下拉箭头 / 内边距等固定开销
  return Math.max(min, (labelLen + maxLen) * FONT_SIZE + 60);
}
const subjectWidth = computed(() => autoWidth('账户主体：', subjectOptions.value, 220));
const projectWidth = computed(() => autoWidth('智投项目：', projectOptions.value, 200));
const optimizerWidth = computed(() => autoWidth('优化师：', optimizerOptions.value, 180));
const deptWidth = computed(() => autoWidth('部门：', deptTree.map((d) => d.label), 180));
const statusWidth = computed(() => autoWidth('账户状态：', ['正常', '授权失效', '已解绑'], 190));
const nameTypeWidth = computed(() => autoWidth('', nameTypeOptions.map((t) => t.label), 150));

// ---------- 下拉模糊搜索：子序列匹配（如「文滨」可命中「文清滨」） ----------
// Element Plus 2.14 传入 filter-method 后不再内置过滤，需由父级按查询词裁剪选项
const queries = reactive({ subject: '', project: '', optimizer: '', nameType: '', dept: '' });

function setQuery(key, query) {
  queries[key] = query || '';
}

function fuzzyMatch(query, text) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const t = String(text || '').toLowerCase();
  if (!t) return false;
  if (t.includes(q)) return true;
  let i = 0;
  for (const ch of q) {
    i = t.indexOf(ch, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

// 始终保留当前选中项，避免选中项被过滤卸载后回显成原始值
function matchOptions(list, query, current) {
  if (!query) return list;
  const cur = Array.isArray(current) ? current : (current ? [current] : []);
  return list.filter((o) => cur.includes(o) || fuzzyMatch(query, o));
}

// 多选筛选项回显文案
function multiText(v) {
  return Array.isArray(v) ? v.join('、') : (v || '');
}

// ---------- 账户状态（按余额推导） ----------
function statusText(row) {
  if (row.status === 'auth_expired') return '授权失效';
  if (row.status === 'blocked') return '已解绑';
  if (!row.balance) return '账户余额不足';
  if (row.balance < 1000) return '余额低，请充值';
  return '余额充足';
}
function statusDot(row) {
  if (row.status === 'auth_expired' || row.status === 'blocked') return 'dot-gray';
  if (!row.balance) return 'dot-red';
  if (row.balance < 1000) return 'dot-red';
  return 'dot-green';
}
function statusTextCls(row) {
  if (row.status === 'auth_expired' || row.status === 'blocked') return 'st-gray';
  if (!row.balance) return 'st-red';
  if (row.balance < 1000) return 'st-orange';
  return 'st-green';
}

// ---------- 数值格式化 ----------
// 明细行按原始数值展示（2354.44 / 154501），合计行带千分位（7,655.80 / 487,199）
function fmtMetric(row, key, digits = 0) {
  const v = row[key];
  if (v == null || Number.isNaN(Number(v))) return '';
  if (row.__total) {
    return Number(v).toLocaleString('zh-CN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  return Number(v).toFixed(digits);
}

// ---------- 筛选 ----------
function applyFilter() {
  // 按媒体类型（标准 / 全域 / 智擎）区分账户
  let rows = all.value.filter((a) => (a.media || 'upgrade') === media.value);
  if (filters.subject.length) rows = rows.filter((a) => filters.subject.includes(a.subject || '北京央广时代文化传播有限公司'));
  if (filters.project.length) rows = rows.filter((a) => filters.project.includes(a.project));
  if (filters.optimizer.length) rows = rows.filter((a) => filters.optimizer.includes(a.optimizer));
  if (filters.dept) rows = rows.filter((a) => deptOf(a) === filters.dept);
  if (filters.status) rows = rows.filter((a) => a.status === filters.status);
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    rows = rows.filter((a) => {
      if (filters.nameType === 'id') return String(a.advertiser_id || '').toLowerCase().includes(kw);
      if (filters.nameType === 'remark_jl') return String(a.remark_jl || '').toLowerCase().includes(kw);
      return (a.name || '').toLowerCase().includes(kw) || (a.email || '').toLowerCase().includes(kw);
    });
  }
  if (sortState.prop && sortState.order) {
    const dir = sortState.order === 'ascending' ? 1 : -1;
    rows = [...rows].sort((x, y) => (Number(x[sortState.prop]) || 0) - (Number(y[sortState.prop]) || 0) * dir);
  }
  return rows;
}

// ---------- 合计行 ----------
function buildTotal(rows) {
  const sum = (k) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const cost = sum('stat_cost');
  const show = sum('show_cnt');
  const click = sum('click_cnt');
  const active = sum('active_cnt');
  const register = sum('register_cnt');
  return {
    __total: true,
    id: '__total',
    stat_cost: cost,
    show_cnt: show,
    click_cnt: click,
    ctr: show ? +((click / show) * 100).toFixed(2) : 0,
    active_cnt: active,
    active_cost: active ? +(cost / active).toFixed(2) : 0,
    register_cnt: register,
    register_cost: register ? +(cost / register).toFixed(2) : 0,
  };
}

// ---------- 数据 ----------
const rows = ref([]);

async function load() {
  loading.value = true;
  try {
    const res = await mediaApi.accounts();
    all.value = res.data?.list || [];
    const filtered = applyFilter();
    pagination.total = filtered.length;
    const pageRows = filtered.slice((page.value - 1) * pagination.pageSize, page.value * pagination.pageSize);
    rows.value = isUpgrade ? [buildTotal(filtered), ...pageRows] : pageRows;
  } finally {
    loading.value = false;
  }
}

function onPage(p) { page.value = p; load(); }
function onSelectionChange(list) { selected.value = list; }
function onSortChange({ prop, order }) {
  sortState.prop = prop || '';
  sortState.order = order || '';
  load();
}
function onSearch() { page.value = 1; load(); }

function resetFilters() {
  Object.assign(filters, {
    subject: [], project: [], optimizer: [], dept: '', status: '',
    keyword: '', nameType: 'name',
  });
  page.value = 1;
  load();
}

// ---------- 手动同步弹窗（同步项目与广告） ----------
const syncVisible = ref(false);
const syncSearchType = ref('id');
const syncKeyword = ref('');
const syncChecked = ref([]);
const syncPage = ref(1);
const syncPageSize = 10;
const syncDateRange = ref([dayjs().subtract(14, 'day').format('YYYY-MM-DD'), today]);

const syncList = computed(() => {
  const kw = syncKeyword.value.trim().toLowerCase();
  const list = all.value.filter((a) => (a.media || 'upgrade') === media.value);
  if (!kw) return list;
  return list.filter((a) => (syncSearchType.value === 'id'
    ? String(a.advertiser_id || '').toLowerCase().includes(kw)
    : String(a.name || '').toLowerCase().includes(kw)));
});
const syncPageRows = computed(() => syncList.value.slice(
  (syncPage.value - 1) * syncPageSize,
  syncPage.value * syncPageSize,
));
const syncCheckedAccounts = computed(() => all.value.filter((a) => syncChecked.value.includes(a.id)));
const syncAllChecked = computed(() => syncPageRows.value.length > 0
  && syncPageRows.value.every((a) => syncChecked.value.includes(a.id)));
const syncHalfChecked = computed(() => !syncAllChecked.value
  && syncPageRows.value.some((a) => syncChecked.value.includes(a.id)));

function onSync() {
  syncVisible.value = true;
  syncSearchType.value = 'id';
  syncKeyword.value = '';
  syncChecked.value = [];
  syncPage.value = 1;
}
function onSyncSearch() { syncPage.value = 1; }
function onSyncPage(p) { syncPage.value = p; }
function toggleSyncAll(val) {
  const ids = syncPageRows.value.map((a) => a.id);
  syncChecked.value = val
    ? [...new Set([...syncChecked.value, ...ids])]
    : syncChecked.value.filter((id) => !ids.includes(id));
}
function toggleSyncOne(acc, val) {
  syncChecked.value = val
    ? [...syncChecked.value, acc.id]
    : syncChecked.value.filter((id) => id !== acc.id);
}
/** R82：已选区域账户展示（与「项目和广告」手动同步弹窗一致：名称--账户ID） */
function syncAccountLabel(a) {
  return `${a.name}--${a.advertiser_id}`;
}
/** R82：已选区域单条移除 */
function removeSyncOne(acc) {
  syncChecked.value = syncChecked.value.filter((id) => id !== acc.id);
}
function onSyncConfirm() {
  const range = syncDateRange.value || [];
  ElMessage.success(`原型：已提交同步任务（账户 ${syncChecked.value.length} 个，更新时间 ${range[0] || '-'} 至 ${range[1] || '-'}）`);
  syncVisible.value = false;
}

// ---------- 批量操作弹窗（批量修改账户名称 / 修改日预算 / 添加屏蔽词 / 设置账户RTA） ----------
const renameVisible = ref(false);
const budgetVisible = ref(false);
const blockVisible = ref(false);
const rtaVisible = ref(false);

// 批量操作对象：优先取列表勾选项，未勾选时默认作用于当前媒体下的全部账户
const batchAccounts = computed(() => {
  const sel = selected.value.filter((a) => !a.__total);
  if (sel.length) return sel;
  return mediaAccounts.value;
});

// ---------- 自定义指标 ----------
const metricVisible = ref(false);
// ---------- 创意清理 ----------
const cleanVisible = ref(false);
const templates = ref(loadTemplates());
// 账户名称 / 账户ID 由左侧固定列承载，不作为数据列渲染
const FIXED_KEYS = ['name', 'advertiser_id'];
const metricSel = reactive({
  upgrade: [...DEFAULT_METRICS.upgrade],
  uni: [...DEFAULT_METRICS.uni],
  oc: [...DEFAULT_METRICS.oc],
});

// 当前媒体下展示的列：按已选指标顺序渲染
const tableColumns = computed(() => (metricSel[media.value] || [])
  .filter((k) => !FIXED_KEYS.includes(k))
  .map((k) => {
    const m = METRIC_MAP[k];
    if (!m) return null;
    // 智擎页沿用「智投商品」列名
    const label = (media.value === 'oc' && m.key === 'product') ? '智投商品' : m.label;
    return { ...m, label };
  })
  .filter(Boolean)
  .filter((m) => !m.media || m.media.includes(media.value)));

function computedMetric(row, col) {
  const v = col.calc ? col.calc(row) : 0;
  return Number(v || 0).toFixed(col.digits ?? 2);
}

function openCustomMetric() { metricVisible.value = true; }

function onMetricApply(keys) {
  metricSel[media.value] = keys.filter((k) => !FIXED_KEYS.includes(k));
  ElMessage.success(`原型：已应用自定义指标（${metricSel[media.value].length} 个指标）`);
}

function onSaveTemplate({ name, keys }) {
  const list = [...templates.value];
  const exist = list.find((t) => t.name === name);
  if (exist) exist.keys = [...keys];
  else list.push({ id: `tpl_${Date.now()}`, name, keys: [...keys] });
  templates.value = list;
  saveTemplates(list);
  ElMessage.success(`原型：已保存自定义指标模板「${name}」`);
}

function onTplCommand(id) {
  const tpl = templates.value.find((t) => t.id === id);
  if (!tpl) return;
  metricSel[media.value] = tpl.keys.filter((k) => !FIXED_KEYS.includes(k));
  ElMessage.success(`原型：已应用自定义指标模板「${tpl.name}」`);
}

function delTemplate(tpl) {
  templates.value = templates.value.filter((t) => t.id !== tpl.id);
  saveTemplates(templates.value);
  ElMessage.success(`原型：已删除自定义指标模板「${tpl.name}」`);
}

// 以下均为原型占位：不触发真实增删改
function onBatchOp(cmd) {
  // 与线上一致：必须先勾选至少一条账户才能执行批量操作
  if (!selected.value.length) {
    ElMessage.warning('请先选择媒体账户');
    return;
  }
  if (cmd === 'rename') { renameVisible.value = true; return; }
  if (cmd === 'budget') { budgetVisible.value = true; return; }
  if (cmd === 'blockword') { blockVisible.value = true; return; }
  if (cmd === 'rta') { rtaVisible.value = true; return; }
  ElMessage.info(`原型：批量操作「${cmd}」（不提交真实接口）`);
}
function onCreativeClean() { cleanVisible.value = true; }
function onExport() { ElMessage.info('原型：导出当前筛选结果（异步报表）'); }
function onCustomMetric() { ElMessage.info('原型：自定义展示指标列'); }
function onDetail(record) { ElMessage.info(`原型：查看账户 ${record.name} 详情`); }
function onViewProjects(record) { goAccountList('projects', record); }
function onViewAds(record) { goAccountList('ads', record); }
// 「查看项目 / 查看广告」：携带账户 ID 跳转到顶部页签对应的项目 / 广告列表
function goAccountList(name, record) {
  if (!record?.advertiser_id) { ElMessage.info('原型：该账户缺少 ID，无法跳转'); return; }
  router.push({ name, query: { media: media.value, account_id: record.advertiser_id } });
}

onMounted(load);
</script>

<style scoped>
/* 整体字号放大：Element Plus 基础字号变量在页面内上调，下拉/输入/按钮/表格同步放大 */
.page {
  --el-font-size-base: 15px;
  --el-font-size-small: 14px;
  --el-font-size-extra-small: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
}

/* 筛选行：标签内嵌在下拉框内 */
.filter-card { border-radius: 4px; }
.filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.f-prefix { font-size: 15px; color: #4e5969; white-space: nowrap; }
/* 全局 .filter-card 下拉/输入框为 220px !important，此页需要按标签长度单独设定宽度
   宽度由脚本按最长选项计算（--f-w），保证选中值完整回显 */
.f-box { width: var(--f-w, 220px) !important; min-width: 0; }
.filter-card .f-w-subject { width: var(--f-w, 420px) !important; }
.filter-card .f-w-project { width: var(--f-w, 240px) !important; }
.filter-card .f-w-optimizer { width: var(--f-w, 190px) !important; }
.filter-card .f-w-dept { width: var(--f-w, 190px) !important; }
.filter-card .f-w-status { width: var(--f-w, 200px) !important; }
.filter-card .f-name-type { width: var(--f-w, 160px) !important; min-width: 0; }
.filter-card .f-keyword { width: 260px !important; min-width: 0; }
.f-search-btn {
  width: 40px;
  padding: 8px 0;
  margin-left: 0;
  border-radius: 0 4px 4px 0;
  border-left: none;
  color: #4e5969;
}
.name-filter { display: flex; align-items: center; }
.name-filter .f-name-type { border-radius: 4px 0 0 4px; }
.name-filter .f-keyword { border-radius: 0; border-left: none; }
.filter-actions { margin-left: auto; }

/* 操作行 */
.op-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.op-left, .op-right { display: flex; align-items: center; gap: 12px; }
.sel-tip { font-size: 15px; color: #4e5969; }
.light-btn {
  --el-button-bg-color: #edf4ff;
  --el-button-border-color: #edf4ff;
  --el-button-hover-bg-color: #dce9ff;
  --el-button-hover-border-color: #dce9ff;
  --el-button-text-color: #546ef7;
  --el-button-hover-text-color: #3b5bdb;
}

/* 表格 */
.acc-name .link { color: #2563eb; cursor: pointer; }
.acc-id { font-size: 13px; color: #86909c; margin-top: 2px; }
.total-label { font-size: 15px; font-weight: 600; color: #1d2129; }
.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.dot-red { background: #f53f3f; }
.dot-green { background: #00b42a; }
.dot-gray { background: #c9cdd4; }
.status-text { font-size: 15px; vertical-align: middle; }
.st-red { color: #f53f3f; }
.st-orange { color: #ff7d00; }
.st-green { color: #00b42a; }
.st-gray { color: #86909c; }
.pager { margin-top: 16px; justify-content: flex-end; }

/* ---------- 手动同步弹窗（同步项目与广告） ---------- */
.sync-form { display: grid; grid-template-columns: 92px 1fr; row-gap: 18px; align-items: start; }
.sync-label { font-size: 15px; color: #4e5969; padding-top: 9px; }
.sync-content { min-width: 0; }
/* R81：左右两块等高、底部对齐（参考「项目和广告」的手动同步弹窗） */
.sync-panels { display: flex; gap: 16px; align-items: stretch; }
.sync-panel {
  border: 1px solid #e5e6eb; border-radius: 4px; background: #fff; overflow: hidden;
  display: flex; flex-direction: column; height: 470px;
}
.sync-panel.left { flex: 1; min-width: 0; }
.sync-panel.right { width: 420px; flex: none; }
.panel-head {
  height: 38px; flex: none; display: flex; align-items: center; padding: 0 12px;
  border-bottom: 1px solid #e5e6eb; font-size: 14px; color: #1d2129;
}
.sel-head { justify-content: space-between; }
.panel-search { flex: none; display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid #e5e6eb; }
.sync-type { width: 92px !important; border-radius: 4px 0 0 4px; }
.sync-input { flex: 1; min-width: 0; border-radius: 0; }
.sync-input :deep(.el-input__wrapper) { border-left: none; border-radius: 0; box-shadow: 0 0 0 1px var(--el-input-border-color) inset; }
.sync-search-btn { width: 40px; padding: 8px 0; margin-left: -1px; border-radius: 0 4px 4px 0; border-left: none; color: #4e5969; }
.panel-list { flex: 1; min-height: 0; padding: 10px 12px 0; display: flex; flex-direction: column; }
.check-all { flex: none; display: flex; height: 28px; }
.list-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.list-item { display: flex; height: 32px; align-items: center; }
.list-item :deep(.el-checkbox__label) {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 14px; color: #1d2129;
}
.list-empty { padding: 48px 0; text-align: center; color: #86909c; font-size: 14px; }
.sync-pager { flex: none; padding: 8px 12px 10px; justify-content: flex-start; }
.sel-body { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
.sel-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 12px; }
/* R82：已选行按「项目和广告」弹窗样式：灰色矩形底 + 右侧移除按钮 */
.sel-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  height: 38px; padding: 0 12px; margin-bottom: 8px;
  background: #f7f8fa; border-radius: 2px; font-size: 14px; color: #1d2129;
}
.sel-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sel-del { color: #86909c; cursor: pointer; }
.sel-del:hover { color: #f53f3f; }
.sel-empty { padding: 30px 0; text-align: center; color: #86909c; font-size: 13px; }
.sync-date { width: 320px !important; }
.sync-tip { margin-top: 8px; font-size: 13px; color: #86909c; }
</style>
