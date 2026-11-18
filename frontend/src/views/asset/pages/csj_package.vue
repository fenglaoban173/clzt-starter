<template>
  <div class="csj-page">
    <!-- ① 页面标题（线上 .mg-title-header > h1「穿山甲媒体包」） -->
    <div class="asset-title-bar csj-title-bar">
      <span class="asset-title">穿山甲媒体包</span>
    </div>

    <!-- ② 查询条件（线上 form.el-form.filter-search-input.el-form--inline） -->
    <div class="filter-row csj-filter-row">
      <div class="filter-left">
        <!-- 媒体账户：远程搜索单选（默认选中第一个账户）+ 独立清空 X -->
        <div class="filter-cell csj-acct-cell">
          <label class="filter-label">媒体账户：</label>
          <el-select
            v-model="advertiserId"
            class="filter-select csj-acct-select"
            size="small"
            filterable
            remote
            remote-show-suffix
            :remote-method="searchAccount"
            :loading="accountLoading"
            placeholder="全部"
            popper-class="csj-acct-popper"
            @change="onFilterChange"
          >
            <el-option v-for="a in accountOptions" :key="a.value" :label="a.label" :value="a.value" />
            <template #footer>
              <div class="csj-select-footer">共 {{ accountOptions.length }} 个媒体账户，输入关键词查看更多</div>
            </template>
          </el-select>
          <span class="csj-acct-sep"></span>
          <el-icon class="csj-acct-close" title="清空" @click="clearAccount"><Close /></el-icon>
        </div>

        <!-- 关键词搜索：字段类型下拉（80px）+ 关键词输入 + 批量搜索气泡 + 🔍 -->
        <div class="filter-cell csj-search-cell">
          <div class="cl-search csj-search" style="width: 280px">
            <el-select v-model="searchField" class="search-field csj-search-field" size="small" placeholder="请选择">
              <el-option v-for="o in SEARCH_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-input
              v-model="keyword"
              class="search-input csj-search-input"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="onSearch"
            >
              <template #suffix>
                <div class="csj-search-suffix">
                  <el-popover placement="bottom-end" :width="640" trigger="click" popper-class="csj-batch-popper">
                    <template #reference>
                      <span class="csj-batch-icon" title="批量搜索">
                        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
                          <path
                            d="M881.4 250.9H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h739.9c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM272.1 454H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5S296 454 272.1 454zM272.1 657.1H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM853.8 847.5L715.3 709c-16.9-16.9-16.9-44.6 0-61.5s44.6-16.9 61.5 0L915.3 786c16.9 16.9 16.9 44.6 0 61.5s-44.6 16.9-61.5 0zM467.9 860.2H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h326.4c23.9 0 43.5 19.6 43.5 43.5 0.1 23.9-19.5 43.5-43.5 43.5z"
                            fill="currentColor"
                          />
                          <path
                            d="M619.4 290.5C493.3 290.5 391 392.8 391 519s102.3 228.5 228.5 228.5S847.9 645.2 847.9 519 745.6 290.5 619.4 290.5z m0 388.4c-88.3 0-159.9-71.6-159.9-159.9 0-88.3 71.6-159.9 159.9-159.9s160 71.5 160 159.9c0 88.3-71.6 159.9-160 159.9z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                    </template>
                    <div class="csj-batch">
                      <div class="csj-batch__hd">
                        <span class="csj-batch__title">请输入{{ currentSearchLabel }}（每行一个关键词）</span>
                        <el-link type="primary" underline="never" @click="clearBatch">清空</el-link>
                      </div>
                      <el-input
                        v-model="batchText"
                        type="textarea"
                        :rows="10"
                        resize="none"
                        placeholder="请粘贴或输入关键词，回车可换行"
                      />
                      <div class="batch-search-ops">
                        <el-button size="small" plain @click="clearBatch">清空</el-button>
                        <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                      </div>
                    </div>
                  </el-popover>
                  <el-icon
                    v-if="keyword"
                    class="csj-search-clear"
                    title="清空"
                    @click="clearKeyword"
                  ><CircleClose /></el-icon>
                </div>
              </template>
              <template #append>
                <el-button class="csj-search-btn" :icon="Search" title="搜索" @click="onSearch" />
              </template>
            </el-input>
          </div>
        </div>

        <!-- 清空（线上 a.clearall） -->
        <a class="filter-clear csj-clear" @click="clearFilters">清空</a>
      </div>
    </div>

    <!-- ③ 工具栏 + 列表 + 分页（线上 .mg-table-wrapper / .table-toolbar / .cl-table-body） -->
    <div class="csj-table-card">
      <div class="table-toolbar csj-toolbar">
        <el-button type="primary" size="small" class="tool-btn csj-sync-btn" @click="openSync">同步媒体包</el-button>
      </div>

      <el-table
        :data="pagedList"
        row-key="id"
        border
        class="asset-table csj-table"
        empty-text="暂无数据"
      >
        <el-table-column prop="flow_package_id" label="媒体包ID" width="417" show-overflow-tooltip />
        <el-table-column prop="name" label="媒体包名称" width="415" show-overflow-tooltip />
        <el-table-column label="操作" width="65">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="onEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="flow_package_type" label="类型" width="415">
          <template #default="{ row }">
            <span class="csj-middle">{{ FLOW_PACKAGE_TYPE[row.flow_package_type] || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="转化状态" width="415">
          <template #default="{ row }">
            <span class="csj-status" :class="'csj-status--' + statusClass(row.status)"></span>
            <span class="csj-middle">{{ STATUS_MENU[row.status] || '—' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-card csj-pager">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="filteredList.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- ④ 同步弹窗（线上 SynchronousAsset「同步穿山甲媒体包」，760px + AdvertiserTransfer） -->
    <el-dialog
      v-model="syncVisible"
      title="同步穿山甲媒体包"
      width="760px"
      class="cl-modal csj-sync-dialog"
      :close-on-click-modal="false"
    >
      <div class="csj-sync-tip">请选择需要同步穿山甲媒体包的媒体账户：</div>
      <div class="csj-transfer">
        <div class="csj-transfer__panel">
          <div class="csj-transfer__hd">
            <span>媒体账户</span>
          </div>
          <div class="csj-transfer__search">
            <el-select v-model="syncAccountField" class="csj-transfer__field" size="small" placeholder="请选择">
              <el-option label="ID" value="id" />
              <el-option label="名称" value="name" />
            </el-select>
            <el-input v-model="syncAccountKeyword" size="small" placeholder="请输入关键词">
              <template #suffix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <el-checkbox v-model="syncAllChecked" class="csj-transfer__all" @change="toggleSyncAll">全选</el-checkbox>
          <div class="csj-transfer__list">
            <el-checkbox-group v-model="syncSelected">
              <el-checkbox
                v-for="a in syncAccountList"
                :key="a.value"
                :label="a.value"
                class="csj-transfer__item"
              >{{ a.label }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
        <div class="csj-transfer__panel">
          <div class="csj-transfer__hd">
            <span>已选：{{ syncSelected.length }}/{{ SYNC_LIMIT }}</span>
            <el-link type="primary" underline="never" @click="clearSyncSelected">清空</el-link>
          </div>
          <div class="csj-transfer__list">
            <el-checkbox-group v-model="syncSelected">
              <el-checkbox
                v-for="a in syncSelectedItems"
                :key="a.value"
                :label="a.value"
                class="csj-transfer__item"
              >{{ a.label }}</el-checkbox>
            </el-checkbox-group>
            <div v-if="!syncSelected.length" class="csj-transfer__empty">暂无数据</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="syncVisible = false">取 消</el-button>
            <el-button size="small" type="primary" :loading="syncing" @click="submitSync">
              {{ syncing ? '同步中' : '确 定' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleClose, Close, Search } from '@element-plus/icons-vue';

/* ------------------------------------------------------------------
 * 创量标准版「巨量广告·标准 → 资产 → 穿山甲媒体包」
 * 线上：https://cl.mobgi.com/property/toutiao/flowpackage
 * 采集依据：线上 DOM + 线上构建产物 assets/flow-package-*.js
 *   - 页面无二级页签，标题 h1「穿山甲媒体包」
 *   - 筛选：媒体账户（advertiser-select，远程搜索、默认选中第一个账户）+ 清空链接
 *   - 搜索：字段类型下拉（名称 / ID）+ 关键词输入（280px 整体，字段下拉 80px）+ 批量搜索气泡 + 🔍
 *   - 工具栏：只有「同步媒体包」一个主按钮（点击打开 SynchronousAsset 弹窗）
 *   - 列表 5 列：媒体包ID / 媒体包名称 / 操作(65px，编辑) / 类型 / 转化状态
 *   - 类型取值：FLOW_PACKAGE_TYPE（自定义 / 运营推荐 / 系统推荐）
 *   - 转化状态：STATUS_MENU（已启用 / 已废弃），绿点 / 灰点
 *   - 无批量操作、无新建抽屉；分页在 total > 10 时出现
 * ------------------------------------------------------------------ */

const props = defineProps({ kind: { type: String, default: '' } });

/** 媒体账户（线上 /Media/Account/getMyMediaAccountLists 远程下拉，20 条） */
const ACCOUNTS = [
  { value: '1861811345880074', label: '北京高途云集教育科技有限公司--1(1861811345880074)' },
  { value: '1866877399870663', label: '百度文库-央广时代-拉新-搜索-01(1866877399870663)' },
  { value: '1866877399203047', label: '百度文库-央广时代-拉新-搜索-02(1866877399203047)' },
  { value: '1866849651765706', label: '百度文库-央广时代-拉新-搜索-03(1866849651765706)' },
  { value: '1866489873996443', label: '任意门-央广-代运营-36-安卓-UBA(1866489873996443)' },
  { value: '1866489858950211', label: '任意门-央广-代运营-22-安卓-UBA(1866489858950211)' },
  { value: '1866489859578696', label: '任意门-央广-代运营-23-安卓-UBA(1866489859578696)' },
  { value: '1866489860302024', label: '任意门-央广-代运营-10-ios-UBA(1866489860302024)' },
  { value: '1866489860976135', label: '任意门-央广-代运营-25-ios-UBA(1866489860976135)' },
  { value: '1866489864776836', label: '任意门-央广-代运营-30-ios-UBA(1866489864776836)' },
  { value: '1834419631681163', label: '上海得物信息集团有限公司1-50(1834419631681163)' },
  { value: '1866489862625304', label: '任意门-央广-代运营-27-安卓-UBA(1866489862625304)' },
  { value: '1866489865523527', label: '任意门-央广-代运营-31-安卓-UBA(1866489865523527)' },
  { value: '1866489874950667', label: '任意门-央广-代运营-38-安卓-UBA(1866489874950667)' },
  { value: '1866489872328266', label: '任意门-央广-代运营-33-安卓-UBA(1866489872328266)' },
  { value: '1866489871677514', label: '任意门-央广-代运营-32-ios-UBA(1866489871677514)' },
  { value: '1866877401293188', label: '百度文库-央广时代-拉新-搜索-04(1866877401293188)' },
  { value: '1866489863429463', label: '任意门-央广-代运营-28-安卓-UBA(1866489863429463)' },
  { value: '1866489873385099', label: '任意门-央广-代运营-35-iOS-UBA(1866489873385099)' },
  { value: '1866877405575303', label: '央广-621059846-百度文库-1(1866877405575303)' },
];

/** 媒体包类型（线上 FLOW_PACKAGE_TYPE） */
const FLOW_PACKAGE_TYPE = {
  CUSTOMIZE: '自定义',
  FEATURED: '运营推荐',
  SYSTEM: '系统推荐',
};

/** 媒体包转化状态（线上 STATUS_MENU） */
const STATUS_MENU = {
  FLOW_PACKAGE_ENABLE: '已启用',
  FLOW_PACKAGE_DISABLE: '已废弃',
};

/** 关键词搜索字段类型（线上 filterList：名称 like / ID eq） */
const SEARCH_FIELDS = [
  { label: '名称', value: 'name' },
  { label: 'ID', value: 'flow_package_id' },
];

/** 同步弹窗一次最多可选择的媒体账户数（线上 AdvertiserTransfer limit_num） */
const SYNC_LIMIT = 200;

/* ------------------------------ mock 数据 ------------------------------ */
/* 线上该页无数据行（接口返回空列表），此处按列补 10 条中文 mock 数据 */

const MOCK_PACKAGES = [
  { flow_package_id: '1867203850145627', name: '教育行业-信息流通用包-01', advertiser_id: '1861811345880074', flow_package_type: 'CUSTOMIZE', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145628', name: '教育行业-信息流通用包-02', advertiser_id: '1861811345880074', flow_package_type: 'CUSTOMIZE', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145629', name: '高途课程-安卓UBA包', advertiser_id: '1861811345880074', flow_package_type: 'FEATURED', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145630', name: '高途课程-iOS UBA包', advertiser_id: '1861811345880074', flow_package_type: 'FEATURED', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145631', name: '教育-运营推荐通用包', advertiser_id: '1861811345880074', flow_package_type: 'FEATURED', status: 'FLOW_PACKAGE_DISABLE' },
  { flow_package_id: '1867203850145632', name: '教育-系统推荐通用包', advertiser_id: '1861811345880074', flow_package_type: 'SYSTEM', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145633', name: '百度文库-拉新搜索包', advertiser_id: '1861811345880074', flow_package_type: 'CUSTOMIZE', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145634', name: '得物-电商品牌包', advertiser_id: '1861811345880074', flow_package_type: 'FEATURED', status: 'FLOW_PACKAGE_DISABLE' },
  { flow_package_id: '1867203850145635', name: '百度文库-搜索-安卓包', advertiser_id: '1866877399870663', flow_package_type: 'CUSTOMIZE', status: 'FLOW_PACKAGE_ENABLE' },
  { flow_package_id: '1867203850145636', name: '得物-UGC互动包', advertiser_id: '1834419631681163', flow_package_type: 'SYSTEM', status: 'FLOW_PACKAGE_ENABLE' },
];

/* ------------------------------ 状态 ------------------------------ */

/** 媒体账户（默认选中第一个，线上 defaultFirstOption） */
const advertiserId = ref('');
const accountKeyword = ref('');
const accountLoading = ref(false);

/** 关键词搜索 */
const searchField = ref('name');
const keyword = ref('');
const batchText = ref('');

/** 列表 */
const list = ref(MOCK_PACKAGES.map((p, i) => ({ id: i + 1, ...p })));
const pageNo = ref(1);
const pageSize = ref(10);

/** 同步弹窗 */
const syncVisible = ref(false);
const syncing = ref(false);
const syncAccountField = ref('id');
const syncAccountKeyword = ref('');
const syncSelected = ref([]);
const syncAllChecked = ref(false);

/* ------------------------------ 计算 ------------------------------ */

const accountOptions = computed(() => {
  const kw = (accountKeyword.value || '').trim();
  return kw ? ACCOUNTS.filter((a) => a.label.indexOf(kw) !== -1) : ACCOUNTS;
});

const currentSearchLabel = computed(
  () => (SEARCH_FIELDS.find((f) => f.value === searchField.value) || SEARCH_FIELDS[0]).label,
);

/** 列表过滤：媒体账户 + 关键词（名称 like / ID eq；批量搜索为多关键词 in） */
const filteredList = computed(() => {
  let rows = list.value;
  if (advertiserId.value) {
    rows = rows.filter((r) => r.advertiser_id === advertiserId.value);
  }
  const kw = (keyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    if (searchField.value === 'flow_package_id') {
      rows = rows.filter((r) => keys.indexOf(String(r.flow_package_id)) !== -1);
    } else {
      rows = rows.filter((r) => keys.some((k) => String(r.name || '').indexOf(k) !== -1));
    }
  }
  return rows;
});

const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

/** 同步弹窗：左侧可选媒体账户（按 ID / 名称过滤） */
const syncAccountList = computed(() => {
  const kw = (syncAccountKeyword.value || '').trim();
  if (!kw) return ACCOUNTS;
  return ACCOUNTS.filter((a) => {
    if (syncAccountField.value === 'id') return a.value.indexOf(kw) !== -1;
    return a.label.indexOf(kw) !== -1;
  });
});

/** 同步弹窗：右侧已选媒体账户 */
const syncSelectedItems = computed(() => ACCOUNTS.filter((a) => syncSelected.value.indexOf(a.value) !== -1));

watch(pageSize, () => { pageNo.value = 1; });

/* ------------------------------ 方法 ------------------------------ */

/** 媒体账户远程搜索（线上 getMyMediaAccountLists，keyword 模糊匹配） */
function searchAccount(kw) {
  accountLoading.value = true;
  accountKeyword.value = kw || '';
  setTimeout(() => { accountLoading.value = false; }, 150);
}

/** 转化状态圆点样式（线上 site-status--enable / site-status--disable） */
function statusClass(status) {
  return STATUS_MENU[status] === '已启用' ? 'enable' : 'disable';
}

/** 切换媒体账户 → 重新查询 */
function onFilterChange() {
  pageNo.value = 1;
}

/** 清空单个筛选项（媒体账户旁的 X，线上 clearThis） */
function clearAccount() {
  advertiserId.value = '';
  pageNo.value = 1;
}

/** 清空（线上 a.clearall：清空全部筛选项与关键词） */
function clearFilters() {
  advertiserId.value = '';
  keyword.value = '';
  batchText.value = '';
  searchField.value = 'name';
  pageNo.value = 1;
}

/** 关键词搜索（回车 / 🔍） */
function onSearch() {
  pageNo.value = 1;
}

function clearKeyword() {
  keyword.value = '';
  pageNo.value = 1;
}

function clearBatch() {
  batchText.value = '';
}

/** 批量搜索：每一行为一个关键词，精确匹配（任意一个命中即保留） */
function applyBatchSearch() {
  const keys = batchText.value.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
  if (!keys.length) {
    ElMessage.warning('请至少输入一个关键词');
    return;
  }
  keyword.value = keys.join('\n');
  pageNo.value = 1;
}

/** 行内操作「编辑」（线上 $prompt「编辑媒体包」，媒体包名 1-20 字且不能含空格） */
function onEdit(row) {
  ElMessageBox.prompt('媒体包名:', '编辑媒体包', {
    closeOnClickModal: false,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputErrorMessage: '请输入媒体包名',
    inputValue: row.name,
    inputValidator: (v) => {
      if (!v) return '请输入媒体包名';
      const len = Math.round(String(v).replace(/[^\u0000-ÿ]/g, 'aa').length);
      if (len > 20) return '媒体包名必须为1-20个字符';
      if (/\s/.test(v)) return '媒体包名不能包含空格';
      return true;
    },
  }).then(({ value }) => {
    const hit = list.value.find((r) => r.id === row.id);
    if (hit) hit.name = value;
    ElMessage.success('更新成功');
  }).catch(() => {});
}

/* ------------------------------ 同步媒体包 ------------------------------ */

function openSync() {
  syncVisible.value = true;
}

function toggleSyncAll(v) {
  syncSelected.value = v ? syncAccountList.value.map((a) => a.value) : [];
}

function clearSyncSelected() {
  syncSelected.value = [];
  syncAllChecked.value = false;
}

function submitSync() {
  if (!syncSelected.value.length) {
    ElMessage.error('请选择媒体账户');
    return;
  }
  syncing.value = true;
  setTimeout(() => {
    syncing.value = false;
    syncVisible.value = false;
    syncSelected.value = [];
    syncAllChecked.value = false;
    pageNo.value = 1;
    ElMessage.success('同步成功');
  }, 800);
}

onMounted(() => {
  /* 线上 defaultFirstOption：默认选中第一个媒体账户 */
  advertiserId.value = ACCOUNTS.length ? ACCOUNTS[0].value : '';
});
</script>

<style scoped>
.csj-page { min-height: 100%; }

/* ---------- 页面标题（线上 .mg-title-header > h1） ---------- */
.csj-title-bar { padding: 0 0 12px; border-bottom: 1px solid #e8eaec; }
.csj-title-bar .asset-title { font-size: 16px; font-weight: 600; color: #1d2129; }

/* ---------- 查询条件（线上 form.filter-search-input） ---------- */
.csj-filter-row { padding: 12px 0 4px; }
.csj-filter-row .filter-left { align-items: center; }

/* 媒体账户：label + 下拉 + 分隔线 + 清空 X */
.csj-acct-cell { padding: 0 6px 0 8px; }
.csj-acct-select { width: 190px; }
.csj-acct-select :deep(.el-select__wrapper) { box-shadow: none; background-color: transparent; padding-left: 4px; min-height: 30px; }
.csj-acct-select :deep(.el-select__input) { height: 30px; font-size: 12px; color: #606266; }
.csj-acct-sep { width: 1px; height: 16px; background: #e8eaec; margin: 0 8px; }
.csj-acct-close { font-size: 16px; color: #c0c4cc; cursor: pointer; }
.csj-acct-close:hover { color: #909399; }
.csj-select-footer { font-size: 12px; color: #909399; padding: 6px 12px; text-align: center; }

/* 关键词搜索：整块外框（280px），内部无边框，靠分隔线分区 */
.csj-search-cell { padding: 0; }
.csj-search { height: 32px; }
.csj-search-field { width: 80px; flex: none; }
.csj-search-field :deep(.el-select__wrapper) { box-shadow: none; background-color: transparent; padding: 0 4px; min-height: 30px; }
.csj-search-field :deep(.el-select__input) { height: 30px; font-size: 12px; color: #606266; }
.csj-search-field :deep(.el-select__placeholder) { font-size: 12px; color: #606266; }
.csj-search-input { flex: 1; min-width: 0; border-left: 1px solid #e8eaec; }
.csj-search-input :deep(.el-input__wrapper) { box-shadow: none; background-color: transparent; padding-left: 8px; }
.csj-search-input :deep(.el-input__inner) { height: 32px; font-size: 12px; color: #606266; padding-right: 56px; }
.csj-search-input :deep(.el-input-group__append) { padding: 0; background: transparent; box-shadow: none; width: 40px; flex: none; }
.csj-search-btn {
  width: 40px; flex: none; height: 32px; border: none; border-left: 1px solid #e8eaec; border-radius: 0 3px 3px 0;
  background: transparent; --el-button-text-color: #333; --el-button-hover-text-color: #197afb;
}
.csj-search-btn:hover { background: #ebf5ff; }
.csj-search-suffix { display: flex; align-items: center; gap: 4px; }
.csj-batch-icon { display: inline-flex; align-items: center; font-size: 16px; color: #909399; cursor: pointer; }
.csj-batch-icon:hover { color: #606266; }
.csj-search-clear { font-size: 16px; color: #c0c4cc; cursor: pointer; }
.csj-search-clear:hover { color: #909399; }

/* 清空链接 */
.csj-clear { margin: 0 0 0 12px; font-size: 12px; color: #197afb; cursor: pointer; }

/* 批量搜索气泡 */
.csj-batch__hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.csj-batch__title { font-size: 13px; color: #333; }

/* ---------- 工具栏 + 列表卡片（线上 .mg-table-wrapper） ---------- */
.csj-table-card {
  margin: 8px 0 16px; padding: 12px 16px 16px;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
}
.csj-toolbar { height: auto; padding: 0 0 12px; border: none; background: transparent; margin-bottom: 0; }
.csj-sync-btn { font-size: 12px; height: 32px; padding: 9px 15px; border-radius: 3px; }

/* ---------- 列表（线上 el-table--border，size mini） ---------- */
.csj-table { font-size: 12px; width: 100%; }
.csj-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.csj-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.csj-table :deep(.el-button) { font-size: 12px; }
.csj-table :deep(.el-button.is-link) { margin-left: 0; padding: 0; }

/* 转化状态圆点（线上 .site-status / .site-middle） */
.csj-status { display: inline-block; width: 6px; height: 6px; margin-right: 8px; border-radius: 50%; }
.csj-status--enable { background-color: #1aad19; }
.csj-status--disable { background-color: #4d4d4d; }
.csj-middle { vertical-align: middle; }

/* ---------- 分页 ---------- */
.csj-pager { height: 48px; margin-top: 12px; padding: 2px 5px 2px 24px; }
.csj-pager :deep(.el-pagination) { font-size: 12px; }

/* ---------- 同步弹窗 ---------- */
.csj-sync-tip { font-size: 14px; color: #333; margin-bottom: 4px; }
.csj-transfer { display: flex; gap: 16px; margin-top: 12px; }
.csj-transfer__panel {
  flex: 1; height: 340px; border: 1px solid #e8eaec; border-radius: 3px;
  display: flex; flex-direction: column; overflow: hidden; background: #fff;
}
.csj-transfer__hd {
  height: 40px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; background: #fafafa; border-bottom: 1px solid #e8eaec; font-size: 13px; color: #333;
}
.csj-transfer__search { display: flex; gap: 8px; padding: 8px 12px; }
.csj-transfer__field { width: 90px; flex: none; }
.csj-transfer__field :deep(.el-input__inner) { height: 32px; font-size: 12px; }
.csj-transfer__all { padding: 0 12px 6px; font-size: 12px; }
.csj-transfer__list { flex: 1; overflow-y: auto; padding: 0 12px 8px; }
.csj-transfer__item { display: flex; font-size: 12px; color: #606266; height: 30px; }
.csj-transfer__empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; font-size: 12px; }
</style>
