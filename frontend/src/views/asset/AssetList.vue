<template>
  <div class="asset-page" v-loading="loading">
    <!-- 页面标题 -->
    <div class="asset-title-bar">
      <span class="asset-title">{{ page.title }}</span>
    </div>

    <!-- 二级页签（部分资产页有，如「商品库-通用版 / 商品-通用版 / 商品-升级版」） -->
    <div v-if="page.subTabs && page.subTabs.length" class="asset-sub-tabs">
      <div
        v-for="t in page.subTabs"
        :key="t"
        class="asset-sub-tab"
        :class="{ active: t === page.activeSubTab }"
        @click="onSubTab(t)"
      >{{ t }}</div>
    </div>

    <!-- ① 查询条件（对齐创量标准版 form.filter-search-input） -->
    <div v-if="page.filters && page.filters.length" class="filter-row">
      <div class="filter-left">
        <div v-for="(f, fi) in page.filters" :key="fi" class="filter-cell">
          <template v-if="f.type === 'select'">
            <label class="filter-label">{{ f.label }}</label>
            <el-select
              v-model="query[f.key]"
              class="filter-select"
              size="small"
              :multiple="!!f.multiple"
              :placeholder="f.placeholder"
              :collapse-tags="!!f.multiple"
              collapse-tags-tooltip
              clearable
              @change="onFilterChange"
            >
              <el-option v-for="o in optionsOf(f)" :key="o" :label="o" :value="o" />
            </el-select>
          </template>

          <template v-else-if="f.type === 'search'">
            <div class="cl-search" :style="{ width: (f.width || 280) + 'px' }">
              <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
                <el-option v-for="o in f.fields" :key="o" :label="o" :value="o" />
              </el-select>
              <el-input
                v-model="searchKeyword"
                class="search-input"
                size="small"
                :placeholder="f.placeholder"
                @keyup.enter="onSearch"
              >
                <template #append>
                  <el-button :icon="Search" @click="onSearch" />
                </template>
              </el-input>
              <el-popover placement="bottom-end" :width="280" trigger="click" popper-class="batch-search-popper">
                <template #reference>
                  <el-button class="search-more-btn" :icon="MoreFilled" />
                </template>
                <div class="batch-search">
                  <el-input v-model="searchKeyword" size="small" placeholder="请输入关键词" />
                  <div class="batch-search-ops">
                    <el-button size="small" @click="onClearSearch">清空</el-button>
                    <el-button size="small" type="primary" @click="onSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </div>
          </template>
        </div>
        <a class="filter-clear" @click="onClearFilters">清空</a>
      </div>

      <!-- 筛选区右侧按钮（如「同步资产」） -->
      <div v-if="page.filterActions && page.filterActions.length" class="filter-right">
        <el-button
          v-for="(a, ai) in page.filterActions"
          :key="ai"
          :type="a.type || undefined"
          size="small"
          class="tool-btn"
          @click="onButton(a)"
        >{{ a.text }}</el-button>
      </div>
    </div>

    <!-- ② 功能按钮（对齐创量标准版 .table-toolbar / .toolbar-operate） -->
    <div class="table-toolbar">
      <el-button
        v-for="(b, bi) in page.buttons"
        :key="bi"
        :type="b.type || undefined"
        :plain="!!b.plain"
        size="small"
        class="tool-btn"
        @click="onButton(b)"
      >{{ b.text }}</el-button>

      <!-- 批量操作：下拉按钮式（选中行后显示数量，如「批量操作(1)」） -->
      <el-dropdown v-if="page.batch && page.batch.style === 'dropdown'" @command="onBatchOp">
        <el-button
          :type="page.batch.type || 'primary'"
          :plain="page.batch.plain !== false"
          size="small"
          class="tool-btn"
          :disabled="!selectedRows.length"
        >
          {{ page.batch.label }}<span v-if="selectedRows.length"> ({{ selectedRows.length }})</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="o in page.batch.options" :key="o" :command="o">{{ o }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 批量操作：下拉选择式（未选中行时置灰，如资产组页） -->
      <el-select
        v-else-if="page.batch"
        v-model="batchOp"
        class="batch-select"
        size="small"
        :placeholder="page.batch.label"
        :disabled="!selectedRows.length"
        @change="onBatchOp"
      >
        <el-option v-for="o in page.batch.options" :key="o" :label="o" :value="o" />
      </el-select>
    </div>

    <!-- ③ 列表（对齐创量标准版 table.el-table__header 的列序 / 固定列） -->
    <el-table
      :data="pagedList"
      row-key="id"
      border
      class="asset-table"
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="48" fixed="left" />
      <el-table-column
        v-for="c in page.columns"
        :key="c.label + (c.prop || '')"
        :label="c.label"
        :prop="c.prop"
        :width="c.width"
        :fixed="c.fixed ? 'left' : undefined"
        :show-overflow-tooltip="!c.action"
      >
        <template v-if="c.action" #default="{ row }">
          <el-button
            v-for="a in page.rowActions"
            :key="a.text"
            link
            type="primary"
            size="small"
            @click="onRowAction(a, row)"
          >{{ a.text }}</el-button>
        </template>
        <template v-else-if="c.descProp" #default="{ row }">
          <div class="desc-cell">
            <div class="desc-cell__title" :title="row[c.prop]">{{ row[c.prop] || '-' }}</div>
            <div class="desc-cell__desc" :title="row[c.descProp]">{{ row[c.descProp] || '' }}</div>
          </div>
        </template>
        <template v-else-if="c.type === 'status'" #default="{ row }">
          <el-tag size="small" :type="statusType(row[c.prop])">{{ row[c.prop] || '-' }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pager-card">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- 新建 / 编辑抽屉（线上「新建资产组」右侧抽屉，分区 + 字段联动） -->
    <AssetGroupDrawer
      v-if="page.drawer === 'assetGroup'"
      v-model="drawerVisible"
      :form="drawerForm"
      :title="drawerTitle"
      :readonly="drawerReadonly"
      :accounts="accounts"
      :templates="siteTemplates"
      :products="productLibraries"
      :links="miniLinks"
      :picker-source="miniComponents"
      @submit="onDrawerSubmit"
    />

    <!-- 批量导入弹窗（线上「批量导入资产组」） -->
    <AssetImportModal
      v-if="page.importModal"
      v-model="importVisible"
      :title="page.importModal.title"
      :task-options="importTasks"
      @confirm="onImportConfirm"
    />

    <!-- 新建 / 编辑弹窗（其余资产页的通用表单） -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="110px" label-position="top">
        <el-form-item v-for="f in page.fields || []" :key="f.key" :label="f.label" :required="f.required">
          <el-select v-if="f.type === 'select'" v-model="form[f.key]" :placeholder="`请选择${f.label}`" style="width: 100%">
            <el-option v-for="opt in f.options" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <el-input v-else v-model="form[f.key]" :placeholder="`请输入${f.label}`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 评论回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复评论" width="480px" destroy-on-close>
      <el-alert :title="replyTarget ? `「${replyTarget.comment}」` : ''" type="info" :closable="false" style="margin-bottom: 12px" />
      <el-input v-model="replyText" type="textarea" :rows="3" placeholder="请输入回复内容" />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmitReply">回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, MoreFilled, ArrowDown } from '@element-plus/icons-vue';
import { assetApi } from '@/api/media';
import { assetExtApi } from '@/api/openapi';
import {
  ASSET_KINDS, getAssetPage, loadAccountOptions, loadAccounts, KIND_CONFIG,
} from './assetPages';
import AssetGroupDrawer from './components/AssetGroupDrawer.vue';
import AssetImportModal from './components/AssetImportModal.vue';
import {
  emptyAssetGroupForm, toAssetGroupRow, MICRO_LABEL,
} from './assetGroupForm';

const route = useRoute();
const kind = ref(ASSET_KINDS.includes(route.query.kind) ? route.query.kind : 'asset_group');
const page = computed(() => getAssetPage(kind.value));
const apiCfg = computed(() => KIND_CONFIG[kind.value] || {});

const loading = ref(false);
const list = ref([]);
const accountOptions = ref([]);
const accounts = ref([]);
const query = ref({});
const searchField = ref('');
const searchKeyword = ref('');
const batchOp = ref('');
const selectedRows = ref([]);
const pageNo = ref(1);
const pageSize = ref(10);

// 抽屉 / 弹窗状态
const drawerVisible = ref(false);
const drawerTitle = ref('新建资产组');
const drawerReadonly = ref(false);
const drawerForm = ref(emptyAssetGroupForm());
const drawerEditingId = ref(null);
const importVisible = ref(false);
const importTasks = ref([]);
const miniComponents = ref([]);
const productLibraries = ref([]);
const miniLinks = ref([]);
const siteTemplates = ref([]);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const editingId = ref(null);
const form = ref({});
const formRef = ref();
// 回复弹窗
const replyVisible = ref(false);
const replyTarget = ref(null);
const replyText = ref('');

watch(() => route.query.kind, (k) => {
  if (ASSET_KINDS.includes(k)) { kind.value = k; resetQuery(); load(); }
});

watch(page, (p) => {
  searchField.value = (p.filters || []).find((f) => f.type === 'search')?.fields?.[0] || '';
});

function resetQuery() {
  const q = {};
  (page.value.filters || []).forEach((f) => { if (f.type === 'select') q[f.key] = f.multiple ? [] : ''; });
  query.value = q;
  searchField.value = (page.value.filters || []).find((f) => f.type === 'search')?.fields?.[0] || '';
  searchKeyword.value = '';
  batchOp.value = '';
  selectedRows.value = [];
  pageNo.value = 1;
}

function optionsOf(f) {
  if (f.source === 'accounts') return accountOptions.value;
  return f.options || [];
}

// ---------------- 查询条件与列表联动 ----------------
const FILTER_PROP = {
  group_type: 'group_type',
  delivery_content: 'delivery_content',
  use_status: 'use_status',
};

const filteredList = computed(() => {
  let rows = list.value;
  const q = query.value;
  Object.keys(q).forEach((k) => {
    const v = q[k];
    if (v === '' || v === null || v === undefined) return;
    if (Array.isArray(v)) {
      if (!v.length) return;
      rows = rows.filter((r) => v.some((x) => String(r.account_name || '').indexOf(x) === 0 || r[k] === x));
      return;
    }
    const prop = FILTER_PROP[k] || k;
    rows = rows.filter((r) => r[prop] === v);
  });
  // 关键词搜索：按搜索字段类型匹配对应列
  const kw = searchKeyword.value.trim();
  if (kw) {
    const field = searchField.value;
    const propMap = {
      资产组名称: 'name', 资产组别名: 'alias', 组件名称: 'component_name', 组件资产ID: 'component_id',
      名称: 'name', 别名: 'alias', ID: 'id',
    };
    const prop = propMap[field] || 'name';
    rows = rows.filter((r) => String(r[prop] || '').includes(kw));
  }
  return rows;
});

const total = computed(() => filteredList.value.length);
const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

function onFilterChange() { pageNo.value = 1; }
function onSearch() { pageNo.value = 1; }
function onClearSearch() { searchKeyword.value = ''; pageNo.value = 1; }
function onClearFilters() {
  resetQuery();
  pageNo.value = 1;
}
function onSelectionChange(rows) { selectedRows.value = rows; }
function onSubTab(t) {
  ElMessage.info(`原型：切换到「${t}」`);
}

// ---------------- 数据加载 ----------------
async function load() {
  loading.value = true;
  try {
    const src = page.value.list || apiCfg.list || (() => assetApi.byKind(kind.value));
    const res = await src();
    list.value = res.data?.list || [];
  } finally {
    loading.value = false;
  }
}

// ---------------- 功能按钮 ----------------
function onButton(b) {
  if (b.action === 'create') { onCreate(); return; }
  if (b.action === 'import') {
    if (page.value.importModal) { importVisible.value = true; return; }
    ElMessage.info(`原型：批量导入${page.value.title}（下载模板 → 上传文件）`);
    return;
  }
  if (b.action === 'sync') { ElMessage.info('原型：手动同步巨量资产'); return; }
  if (b.action === 'export') { ElMessage.info('原型：导出资产清单'); return; }
  ElMessage.info(`原型：${b.text}`);
}

function onImportConfirm(payload) {
  ElMessage.success(`导入任务已提交（${payload.task_source === 'HISTORY' ? '引用历史任务' : '新建商品'}）`);
  load();
}

async function onBatchOp(op) {
  const rows = selectedRows.value;
  if (!rows.length) { ElMessage.warning('请先选择数据'); return; }
  if (op === '删除') {
    await ElMessageBox.confirm(`确认删除选中的 ${rows.length} 条数据吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
    const ids = rows.map((r) => r.id);
    list.value = list.value.filter((x) => !ids.includes(x.id));
    ElMessage.success('已删除');
  } else {
    ElMessage.info(`原型：对 ${rows.length} 条数据执行「${op}」`);
  }
  batchOp.value = '';
  selectedRows.value = [];
}

// ---------------- 行内操作 ----------------
function onRowAction(a, row) {
  if (a.action === 'view') { onDetail(row); return; }
  if (a.action === 'edit') { onEdit(row); return; }
  if (a.action === 'remove') { onRemove(row); return; }
  if (a.action === 'reply') { onReply(row); return; }
  if (a.action === 'hide') { onHide(row); return; }
  ElMessage.info(`原型：${a.text}`);
}

function blankForm() {
  const f = {};
  (page.value.fields || []).forEach((field) => { f[field.key] = ''; });
  return f;
}

function onCreate() {
  if (page.value.drawer === 'assetGroup') {
    drawerEditingId.value = null;
    drawerForm.value = emptyAssetGroupForm();
    drawerTitle.value = '新建资产组';
    drawerReadonly.value = false;
    drawerVisible.value = true;
    return;
  }
  editingId.value = null;
  form.value = blankForm();
  dialogTitle.value = `新建${page.value.title}`;
  dialogVisible.value = true;
}

function onEdit(row) {
  if (page.value.drawer === 'assetGroup') {
    drawerEditingId.value = row.id;
    drawerForm.value = rowToDrawerForm(row);
    drawerTitle.value = '编辑资产组';
    drawerReadonly.value = false;
    drawerVisible.value = true;
    return;
  }
  editingId.value = row.id;
  form.value = { ...row };
  dialogTitle.value = `编辑${page.value.title}`;
  dialogVisible.value = true;
}

/** 列表行 → 抽屉表单（编辑 / 查看回填） */
function rowToDrawerForm(row) {
  const f = emptyAssetGroupForm();
  f.name = row.name || '';
  f.alias = row.alias || '';
  const acc = String(row.account_name || '').match(/\((\d+)\)\s*$/);
  if (acc) f.advertiser_id = acc[1];
  const isEcom = ['自研落地页', '橙子落地页'].includes(row.delivery_content);
  f.asset_group_type = isEcom ? '2' : '1';
  if (isEcom) {
    f.delivery_content_type = row.delivery_content === '橙子落地页' ? 'ORANGE' : 'THIRDPARTY';
  } else {
    const microKey = Object.keys(MICRO_LABEL).find((k) => MICRO_LABEL[k] === row.mini_type);
    if (microKey) f.micro_promotion_type = microKey;
  }
  f.product_id = row.product_id || '';
  f.track_url = row.monitor_link || '';
  f.action_track_url = row.valid_link || '';
  f.micro_app_name = row.mini_name || '';
  f.micro_app_link = row.path_link || '';
  f.site_url = row.landing_link || '';
  f.cl_site_template_id = row.cl_template || '';
  f.playlet_series_url = row.native_link || '';
  const lt = row.link_type || '不启用';
  f.open_url_type = lt.includes('Ulink') && lt.includes('Deeplink')
    ? 'DEEP_LINK_AND_ULINK'
    : lt.includes('Deeplink') ? 'DEEP_LINK' : lt.includes('Ulink') ? 'ULINK' : 'OFF';
  f.open_url = row.deeplink ? String(row.deeplink).split(' , ').filter(Boolean) : [];
  f.ulink = row.ulink ? String(row.ulink).split(' , ').filter(Boolean) : [];
  return f;
}

/** 抽屉提交 → 写回本地列表 */
function onDrawerSubmit(payload) {
  const acc = accounts.value.find((a) => String(a.advertiser_id) === String(payload.advertiser_id));
  const row = toAssetGroupRow(payload, {
    account_name: acc ? `${acc.name}  (${acc.advertiser_id})` : '',
    creator: '当前用户',
  });
  if (drawerEditingId.value == null) {
    list.value.unshift({ id: Date.now(), ...row, created_at: now(), updated_at: now() });
    ElMessage.success('新建成功');
  } else {
    const idx = list.value.findIndex((x) => x.id === drawerEditingId.value);
    if (idx > -1) list.value[idx] = { ...list.value[idx], ...row, updated_at: now() };
    ElMessage.success('保存成功');
  }
  drawerVisible.value = false;
}

async function onSubmit() {
  for (const field of page.value.fields || []) {
    if (field.required && !String(form.value[field.key] || '').trim()) {
      ElMessage.warning(`请填写${field.label}`);
      return;
    }
  }
  const payload = { ...form.value };
  try {
    if (editingId.value == null) {
      await apiCfg.create?.(payload);
      list.value.unshift({ id: Date.now(), status: 'available', created_at: now(), ...payload });
      ElMessage.success('新建成功');
    } else {
      await apiCfg.update?.(payload);
      const idx = list.value.findIndex((x) => x.id === editingId.value);
      if (idx > -1) list.value[idx] = { ...list.value[idx], ...payload, updated_at: now() };
      ElMessage.success('保存成功');
    }
    dialogVisible.value = false;
  } catch (e) {
    ElMessage.error('操作失败');
  }
}

async function onRemove(row) {
  await ElMessageBox.confirm(`确认删除「${row.name || row.title}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
  await apiCfg.remove?.(row.id);
  list.value = list.value.filter((x) => x.id !== row.id);
  ElMessage.success('已删除');
}

function onDetail(row) {
  if (page.value.drawer === 'assetGroup') {
    drawerEditingId.value = row.id;
    drawerForm.value = rowToDrawerForm(row);
    drawerTitle.value = '查看资产组';
    drawerReadonly.value = true;
    drawerVisible.value = true;
    return;
  }
  ElMessage.info(`原型：查看 ${row.name || row.title || row.video_title}`);
}

function onReply(row) {
  replyTarget.value = row;
  replyText.value = '';
  replyVisible.value = true;
}

async function onSubmitReply() {
  if (!replyText.value.trim()) { ElMessage.warning('请输入回复内容'); return; }
  await assetExtApi.commentReply({ comment_id: replyTarget.value.id, reply: replyText.value.trim() });
  const idx = list.value.findIndex((x) => x.id === replyTarget.value.id);
  if (idx > -1) { list.value[idx].action = '已回复'; list.value[idx].status = 'handled'; }
  replyVisible.value = false;
  ElMessage.success('回复成功');
}

async function onHide(row) {
  await ElMessageBox.confirm('确认隐藏该评论吗？', '隐藏确认', { type: 'warning' });
  await assetExtApi.commentHide(row.id);
  const idx = list.value.findIndex((x) => x.id === row.id);
  if (idx > -1) { list.value[idx].status = 'hidden'; list.value[idx].action = '已隐藏'; }
  ElMessage.success('已隐藏');
}

function statusType(s) {
  return {
    已使用: 'success', 未使用: 'info', 可用: 'success', 生效中: 'success', 审核中: 'warning',
    失败: 'danger', 已隐藏: 'info', 待回复: 'warning', 已处理: 'success', 正常: 'success',
    异常: 'danger', 已发布: 'success', 待发布: 'warning',
  }[s] || 'info';
}
function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

onMounted(async () => {
  resetQuery();
  accountOptions.value = await loadAccountOptions();
  accounts.value = await loadAccounts();
  const [mc, pl, ml, st, it] = await Promise.all([
    assetApi.miniComponents(), assetApi.productLibraries(), assetApi.miniLinks(),
    assetApi.siteTemplates(), assetApi.importTasks(),
  ]);
  miniComponents.value = mc.data?.list || [];
  productLibraries.value = pl.data?.list || [];
  miniLinks.value = ml.data?.list || [];
  siteTemplates.value = st.data?.list || [];
  importTasks.value = it.data?.list || [];
  await load();
});
</script>

<style scoped>
.asset-page { padding: 16px; min-height: 100%; box-sizing: border-box; background: #fff; }
.asset-title-bar { padding: 0 0 12px; }
.asset-title { font-size: 16px; font-weight: 600; color: #1d2129; }

/* 查询条件：与创量标准版一致（白底细边框、28px 高、12px 字号） */
.filter-row { display: flex; align-items: flex-start; flex-wrap: wrap; margin-bottom: 8px; }
.filter-left { display: flex; align-items: center; flex-wrap: wrap; }
.filter-cell {
  display: flex; align-items: center; height: 28px; margin: 0 8px 8px 0; padding: 0 5px 0 8px;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
}
.filter-label { font-size: 12px; color: #666; margin-right: 4px; white-space: nowrap; }
.filter-select { width: 169px; }
.filter-select :deep(.el-input__inner) { height: 28px; font-size: 12px; color: #666; }
.filter-clear { font-size: 12px; color: #197afb; cursor: pointer; margin: 6px 0 0 4px; }

.cl-search { display: flex; align-items: center; height: 28px; }
.search-field { width: 100px; flex: none; }
.search-field :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.search-input { width: 200px; }
.search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.search-input :deep(.el-input-group__append) { padding: 0; background: #fff; }
.search-more-btn { height: 28px; padding: 0 6px; border-radius: 0 3px 3px 0; }

.batch-search-ops { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }

/* 功能按钮条 */
.table-toolbar {
  display: flex; align-items: center; gap: 12px; height: 50px; padding: 8px 16px;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px; margin-bottom: 8px;
}
.tool-btn { font-size: 12px; height: 32px; padding: 9px 15px; border-radius: 3px; }
.batch-select { width: 120px; margin-left: 4px; }
.batch-select :deep(.el-input__inner) { height: 32px; font-size: 12px; }

/* 列表：与创量标准版一致（边框表格、表头 #fafafa、12px 字号） */
.asset-table { font-size: 12px; }
.asset-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.asset-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.asset-table :deep(.el-button) { font-size: 12px; }
.asset-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.asset-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* 分页 */
.pager-card {
  display: flex; align-items: center; height: 64px; margin-top: 16px; padding: 2px 5px 2px 24px;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
}
</style>
