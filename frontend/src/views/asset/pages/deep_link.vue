<template>
  <div class="dl-page">
    <!-- 页面标题（线上 .mg-title-header > h1） -->
    <div class="asset-title-bar">
      <span class="asset-title">直达链接</span>
    </div>

    <!-- ① 查询条件（线上 form.filter-search-input） -->
    <div class="filter-row">
      <div class="filter-left">
        <!-- 智投项目 -->
        <div class="filter-cell">
          <label class="filter-label">智投项目：</label>
          <el-select
            v-model="query.project"
            class="filter-select"
            size="small"
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in PROJECT_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
          <i class="dl-icon-close" title="清空" @click="clearFilter('project')">
            <Close />
          </i>
        </div>

        <!-- 媒体账户（远程下拉 + 右侧 ✕ 清空） -->
        <div class="filter-cell">
          <label class="filter-label">媒体账户：</label>
          <el-select
            v-model="query.advertiser_id"
            class="filter-select dl-account-select"
            size="small"
            filterable
            remote
            remote-show-suffix
            :remote-method="searchAccount"
            :loading="accountLoading"
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option
              v-for="a in accountOptions"
              :key="a.value"
              :label="a.label"
              :value="a.value"
            />
          </el-select>
          <i class="dl-icon-close" title="清空" @click="clearFilter('advertiser_id')">
            <Close />
          </i>
        </div>

        <!-- 优化师 -->
        <div class="filter-cell">
          <label class="filter-label">优化师：</label>
          <el-select
            v-model="query.optimizer"
            class="filter-select"
            size="small"
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in OPTIMIZER_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
          <i class="dl-icon-close" title="清空" @click="clearFilter('optimizer')">
            <Close />
          </i>
        </div>

        <!-- 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索 + 🔍 -->
        <div class="dl-search-wrap">
          <el-input
            v-model="searchKeyword"
            class="cl-search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
          >
            <template #prepend>
              <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
                <el-option label="名称" value="name" />
                <el-option label="ID" value="id" />
              </el-select>
            </template>
            <template #suffix>
              <el-popover
                placement="bottom-end"
                :width="420"
                trigger="click"
                popper-class="dl-batch-popper"
              >
                <template #reference>
                  <span class="dl-batch-icon" title="批量搜索">
                    <svg
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                    >
                      <path d="M64 144h384v56H64zM64 320h288v56H64zM64 496h192v56H64z" fill="currentColor" />
                      <path
                        d="M620 420a180 180 0 1 0 0 360 180 180 0 0 0 0-360zm0 72a108 108 0 1 1 0 216 108 108 0 0 1 0-216z"
                        fill="currentColor"
                      />
                      <path d="M756 756l180 180-58 58-180-180z" fill="currentColor" />
                    </svg>
                  </span>
                </template>
                <div class="dl-batch">
                  <div class="dl-batch__head">
                    <span class="dl-batch__title">请输入名称（最多1000个）</span>
                    <el-button link type="primary" size="small" @click="batchText = ''">清空</el-button>
                  </div>
                  <div class="dl-batch__tips">
                    每一行为一个关键词，批量搜索将执行
                    <el-popover placement="right" :width="400" trigger="hover">
                      <template #reference><a class="dl-batch__link">精确匹配</a></template>
                      <div class="dl-batch__pop-title">精准匹配</div>
                      指被搜索的内容需要与搜索关键词完全一致。如：输入关键字为“爆款素材”时，精准匹配只能搜索到名称为“爆款素材”的内容
                    </el-popover>
                    。
                  </div>
                  <el-input
                    v-model="batchText"
                    type="textarea"
                    :rows="10"
                    resize="none"
                    placeholder="请粘贴或输入名称，回车可换行"
                  />
                  <div class="batch-search-ops">
                    <el-button size="small" plain @click="batchText = ''">清空</el-button>
                    <el-button size="small" type="primary" @click="onBatchSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </template>
            <template #append>
              <el-button class="search-more-btn" title="搜索" @click="onSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>

        <a class="filter-clear" @click="onClearFilters">清空</a>
      </div>
    </div>

    <!-- ② 功能按钮条（线上 .table-toolbar） -->
    <div class="table-toolbar">
      <el-button type="primary" size="small" class="tool-btn" @click="openCreate">
        新增直达链接
      </el-button>
      <el-button type="primary" size="small" class="tool-btn" @click="openImport">
        导入直达链接
      </el-button>
      <el-button type="primary" size="small" class="tool-btn" disabled title="请先勾选需要操作的直达链接">
        修改智投项目
      </el-button>
      <el-button size="small" class="tool-btn" disabled title="请先勾选需要操作的直达链接">
        删除
      </el-button>
      <el-button plain class="tool-btn dl-export-btn" disabled title="暂无可导出的数据">
        导出数据
      </el-button>
    </div>

    <!-- ③ 列表（线上 el-table--border） -->
    <el-table
      ref="tableRef"
      :data="pagedList"
      row-key="id"
      border
      class="asset-table"
      show-overflow-tooltip
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="60" fixed="left" align="center" />
      <el-table-column prop="name" label="直达链接名称" width="200" fixed="left" show-overflow-tooltip />
      <el-table-column prop="use_status" label="使用状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.use_status === '已使用' ? 'success' : 'info'">
            {{ row.use_status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="120" show-overflow-tooltip />
      <el-table-column prop="deeplink" label="Deeplink直达链接" width="200" show-overflow-tooltip />
      <el-table-column prop="ulink" label="Ulink直达链接" width="200" show-overflow-tooltip />
      <el-table-column prop="advertiser_name" label="媒体账户" width="150" show-overflow-tooltip />
      <el-table-column prop="optimizer" label="优化师" width="120" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="150" show-overflow-tooltip />
      <el-table-column label="关联计划" width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.plans && row.plans.length">{{ row.plans.join('、') }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- ④ 分页（线上 .cl-table-pagination-layout） -->
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

    <!-- ⑤ 新增 / 编辑直达链接 弹窗（线上 el-dialog「新增直达链接」800px） -->
    <el-dialog
      v-model="createVisible"
      :title="editingRow ? '编辑直达链接' : '新增直达链接'"
      width="800px"
      top="15vh"
      :close-on-click-modal="false"
      class="dl-dialog"
      append-to-body
    >
      <el-form ref="createFormRef" :model="createForm" label-width="130px" label-position="left">
        <el-form-item label="关联媒体账户">
          <el-select
            v-model="createForm.advertiser_id"
            class="ag-select"
            size="small"
            filterable
            remote
            remote-show-suffix
            :remote-method="searchAccount"
            :loading="accountLoading"
            placeholder="不限"
          >
            <el-option
              v-for="a in accountOptions"
              :key="a.value"
              :label="a.label"
              :value="a.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="智投项目（选填）">
          <el-select v-model="createForm.project" class="ag-select" size="small" placeholder="不限">
            <el-option v-for="o in PROJECT_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>

        <el-form-item label="直达链接名称" required>
          <el-input
            v-model="createForm.name"
            class="ag-input"
            size="small"
            maxlength="50"
            placeholder="直达链接名称不能超过50字符"
          />
        </el-form-item>

        <el-form-item label="设置多个直达链接">
          <el-radio-group v-model="createForm.multiple" class="ag-radio dl-radio-group">
            <el-radio-button :value="1">启用</el-radio-button>
            <el-radio-button :value="0">不启用</el-radio-button>
          </el-radio-group>
          <div class="dl-radio-tip">媒体白名单功能，适合覆盖安装不同电商APP用户启用</div>
        </el-form-item>

        <el-form-item label="Deeplink直达链接">
          <el-input
            v-model="createForm.deeplink"
            class="ag-input"
            size="small"
            placeholder="输入Deeplink直达链接"
          />
        </el-form-item>

        <el-form-item label="Ulink直达链接">
          <el-input
            v-model="createForm.ulink"
            class="ag-input"
            size="small"
            placeholder="输入Ulink直达链接"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button plain @click="createVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitCreate">保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ⑥ 导入直达链接 弹窗（线上 el-dialog「导入直达链接」560px） -->
    <el-dialog
      v-model="importVisible"
      title="导入直达链接"
      width="560px"
      :close-on-click-modal="false"
      class="dl-dialog dl-dialog--import"
      append-to-body
    >
      <el-form class="dl-import-form" label-width="100px" label-position="left">
        <el-form-item label="获取模板文件">
          <div class="input-group">
            <a :href="TEMPLATE_URL" target="_blank" rel="noopener">
              <el-button type="primary" size="small" class="w120">点击下载</el-button>
            </a>
          </div>
        </el-form-item>

        <el-form-item label="导入文件">
          <div>
            <el-upload
              class="dl-upload"
              action="/mock/deep-link/import"
              :auto-upload="false"
              :limit="1"
              :file-list="importFileList"
              :on-change="onFileChange"
              :on-remove="onFileRemove"
              :on-exceed="onFileExceed"
            >
              <el-button type="primary" size="small" class="w120">上传文件</el-button>
              <span class="btn-tip">目前仅支持xlsx文件格式</span>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button plain @click="importVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitImport">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ASSET_ACCOUNT_OPTIONS } from './assetOptions';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Search } from '@element-plus/icons-vue';

defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------ *
 * 线上选项（来源：创量线上「直达链接」页 DOM 快照）
 * ------------------------------------------------------------------ */
/** 智投项目（线上原为「创量项目」，el-select 下拉：知乎小说 / 漫剧端原生 / soul / 百度文库） */
const PROJECT_OPTIONS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

/** 优化师（线上 15 项） */
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

/** 媒体账户下拉：线上 20 个账户（顺序照抄线上 DOM） */
const MOCK_ACCOUNTS = ASSET_ACCOUNT_OPTIONS.map((label) => ({
  value: (label.match(/\((\d+)\)/) || [])[1] || '',
  label,
}));

/** 媒体账户（线上为远程加载 /Media/Account/getMyMediaAccountLists，本地 mock 一组） */
const MOCK_ACCOUNTS_LEGACY = [
  { value: '1846116421525516', label: '央广-亦芯-95分-拉新-通投-安卓-17(1846116421525516)' },
  { value: '1834419631681163', label: '上海得物信息集团有限公司1-50(1834419631681163)' },
  { value: '1869584158208068', label: '百度极速版调起-央广-12(1869584158208068)' },
  { value: '1869584152800267', label: '百度极速版调起-央广-4(1869584152800267)' },
  { value: '1869584153842699', label: '百度极速版调起-央广-6(1869584153842699)' },
  { value: '1869584164579543', label: '百度极速版调起-央广-20(1869584164579543)' },
  { value: '1869584157446151', label: '百度极速版调起-央广-11(1869584157446151)' },
  { value: '1869584151302635', label: '百度极速版调起-央广-1(1869584151302635)' },
  { value: '1869584152314635', label: '百度极速版调起-央广-3(1869584152314635)' },
  { value: '1869584153348634', label: '百度极速版调起-央广-5(1869584153348634)' },
  { value: '1866877399870663', label: '百度文库-央广时代-拉新-搜索-01(1866877399870663)' },
  { value: '1866877399203047', label: '百度文库-央广时代-拉新-搜索-02(1866877399203047)' },
  { value: '1866849651765706', label: '百度文库-央广时代-拉新-搜索-03(1866849651765706)' },
  { value: '1866489873996443', label: '任意门-央广-代运营-36-安卓-UBA(1866489873996443)' },
  { value: '1866489858950211', label: '任意门-央广-代运营-22-安卓-UBA(1866489858950211)' },
  { value: '1872677289688', label: '上海置潮信息科技有限公司-23(1872677289688)' },
];

const TEMPLATE_URL = 'https://cls.mobgi.com/template/直达链接导入模板.xlsx';

/* ------------------------------------------------------------------ *
 * 组件内 mock 列表数据（线上该账号下共 0 条，此处造 23 条用于验证版式）
 * ------------------------------------------------------------------ */
const NAME_TPL = [
  '知乎小说-通用直达链接', '知乎小说-小说详情页', '漫剧端原生-短剧详情',
  '漫剧端原生-通用落地页', 'soul-通用直达链接', 'soul-聊天页唤起',
  '百度文库-文档详情', '百度文库-搜索结果页', '百度文库-通用直达链接',
  '通用-应用商店唤起', '通用-电商首页',
];
const DEEPLINK_TPL = [
  'snssdk1128://aweme/detail/6837291055562781',
  'snssdk1128://aweme/detail/6837291055562782',
  'snssdk1128://feed/6804195312294892',
];
const ULINK_TPL = [
  'https://www.zhihu.com/question/589812345',
  'https://www.zhihu.com/question/589812346',
  'https://m.baidu.com/sf?pd=wise&word=%E7%99%BE%E5%BA%A6%E6%96%87%E5%BA%93',
  'https://www.soulapp.cn/',
];
const PLAN_TPL = [
  ['知乎-小说拉新-通投-安卓'],
  ['知乎-小说拉新-通投-安卓', '知乎-小说详情-测试计划'],
  [],
  ['漫剧-端原生-通用计划'],
];

function buildMockList() {
  const rows = [];
  for (let i = 0; i < 23; i += 1) {
    const acc = MOCK_ACCOUNTS[i % MOCK_ACCOUNTS.length];
    rows.push({
      id: 1024001 + i * 37,
      name: NAME_TPL[i % NAME_TPL.length],
      use_status: i % 3 === 0 ? '已使用' : '未使用',
      project: PROJECT_OPTIONS[i % PROJECT_OPTIONS.length],
      advertiser_id: acc.value,
      advertiser_name: acc.label,
      optimizer: OPTIMIZER_OPTIONS[i % OPTIMIZER_OPTIONS.length],
      deeplink: DEEPLINK_TPL[i % DEEPLINK_TPL.length],
      ulink: ULINK_TPL[i % ULINK_TPL.length],
      created_at: `2026-11-${String(((i % 27) + 1)).padStart(2, '0')} ${String(9 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
      plans: PLAN_TPL[i % PLAN_TPL.length],
    });
  }
  return rows;
}

const list = ref(buildMockList());

/* ------------------------------------------------------------------ *
 * 查询条件
 * ------------------------------------------------------------------ */
const query = ref({ project: '', advertiser_id: '', optimizer: '' });
const searchField = ref('name');
const searchKeyword = ref('');
const batchText = ref('');
const accountOptions = ref(MOCK_ACCOUNTS);
const accountLoading = ref(false);
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRows = ref([]);

const tableRef = ref();

/** 账户下拉远程搜索（线上 filter-select-remote） */
function searchAccount(kw) {
  accountLoading.value = true;
  setTimeout(() => {
    const k = String(kw || '').trim().toLowerCase();
    accountOptions.value = !k
      ? MOCK_ACCOUNTS
      : MOCK_ACCOUNTS.filter((a) => a.label.toLowerCase().indexOf(k) > -1);
    accountLoading.value = false;
  }, 120);
}

function clearFilter(key) {
  query.value[key] = '';
  onFilterChange();
}

function onFilterChange() {
  pageNo.value = 1;
  tableRef.value && tableRef.value.clearSelection();
}

function onSearch() {
  pageNo.value = 1;
  tableRef.value && tableRef.value.clearSelection();
}

function onBatchSearch() {
  const keys = batchText.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!keys.length) { ElMessage.warning('请输入关键词'); return; }
  searchKeyword.value = keys.join(',');
  searchField.value = 'name';
  onSearch();
  ElMessage.success(`已按 ${keys.length} 个关键词批量搜索`);
}

function onClearFilters() {
  query.value = { project: '', advertiser_id: '', optimizer: '' };
  searchField.value = 'name';
  searchKeyword.value = '';
  batchText.value = '';
  onFilterChange();
}

/* ------------------------------------------------------------------ *
 * 列表数据
 * ------------------------------------------------------------------ */
const filteredList = computed(() => {
  let rows = list.value;
  if (query.value.project) rows = rows.filter((r) => r.project === query.value.project);
  if (query.value.advertiser_id) rows = rows.filter((r) => r.advertiser_id === query.value.advertiser_id);
  if (query.value.optimizer) rows = rows.filter((r) => r.optimizer === query.value.optimizer);
  const kw = searchKeyword.value.trim();
  if (kw) {
    const keys = kw.split(',').map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      if (searchField.value === 'id') return keys.some((k) => String(r.id) === k);
      return keys.some((k) => String(r.name).indexOf(k) > -1);
    });
  }
  return rows;
});

const total = computed(() => filteredList.value.length);
const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

function onSelectionChange(rows) {
  selectedRows.value = rows;
}

/* ------------------------------------------------------------------ *
 * 新增 / 编辑直达链接弹窗（线上 el-dialog「新增直达链接」）
 * ------------------------------------------------------------------ */
const createVisible = ref(false);
const editingRow = ref(null);
const createFormRef = ref();
const createForm = ref(emptyCreateForm());

function emptyCreateForm() {
  return {
    advertiser_id: '',
    project: '',
    name: '',
    multiple: 0,
    deeplink: '',
    ulink: '',
  };
}

function openCreate() {
  editingRow.value = null;
  createForm.value = emptyCreateForm();
  createVisible.value = true;
}

function openEdit(row) {
  editingRow.value = row;
  createForm.value = {
    advertiser_id: row.advertiser_id,
    project: row.project,
    name: row.name,
    multiple: 0,
    deeplink: row.deeplink,
    ulink: row.ulink,
  };
  createVisible.value = true;
}

function submitCreate() {
  const name = String(createForm.value.name || '').trim();
  if (!name) {
    ElMessage.warning('请填写直达链接名称');
    return;
  }
  if (name.length > 50) {
    ElMessage.warning('直达链接名称不能超过50字符');
    return;
  }
  const acc = MOCK_ACCOUNTS.find((a) => a.value === createForm.value.advertiser_id);
  const payload = {
    id: editingRow.value ? editingRow.value.id : Date.now(),
    name,
    use_status: editingRow.value ? editingRow.value.use_status : '未使用',
    project: createForm.value.project || PROJECT_OPTIONS[0],
    advertiser_id: createForm.value.advertiser_id,
    advertiser_name: acc ? acc.label : (editingRow.value ? editingRow.value.advertiser_name : ''),
    optimizer: editingRow.value ? editingRow.value.optimizer : OPTIMIZER_OPTIONS[1],
    deeplink: createForm.value.deeplink,
    ulink: createForm.value.ulink,
    created_at: editingRow.value ? editingRow.value.created_at : nowText(),
    plans: editingRow.value ? editingRow.value.plans : [],
  };
  if (editingRow.value) {
    const idx = list.value.findIndex((x) => x.id === editingRow.value.id);
    if (idx > -1) list.value[idx] = { ...list.value[idx], ...payload };
    ElMessage.success('保存成功');
  } else {
    list.value.unshift(payload);
    ElMessage.success('新增成功');
  }
  createVisible.value = false;
}

function nowText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ *
 * 导入直达链接弹窗（线上 el-dialog「导入直达链接」560px）
 * ------------------------------------------------------------------ */
const importVisible = ref(false);
const importFileList = ref([]);

function openImport() {
  importFileList.value = [];
  importVisible.value = true;
}

function onFileChange(file) {
  importFileList.value = [file];
}

function onFileRemove() {
  importFileList.value = [];
}

function onFileExceed() {
  ElMessage.warning('仅支持上传一个文件，请先删除已选文件');
}

function submitImport() {
  if (!importFileList.value.length) {
    ElMessage.warning('请先上传需要导入的文件');
    return;
  }
  ElMessage.success('导入任务已提交');
  importVisible.value = false;
  importFileList.value = [];
}

/* ------------------------------------------------------------------ *
 * 行内删除
 * ------------------------------------------------------------------ */
async function removeRow(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」吗？删除后不可恢复。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'cl-message-box--mini',
    });
  } catch (e) {
    return;
  }
  list.value = list.value.filter((x) => x.id !== row.id);
  selectedRows.value = [];
  ElMessage.success('删除成功');
}

watch(pageSize, () => { pageNo.value = 1; });
</script>

<style scoped>
.dl-page { width: 100%; }

/* ---------- 查询条件（对齐线上 .select-area / .icon-close） ---------- */
/* 线上 .select-area 内层 el-select 无边框（外层 .filter-cell 提供方框） */
.filter-cell :deep(.el-select .el-input__wrapper) { box-shadow: none !important; padding: 0; }
.filter-cell :deep(.el-select .el-input__inner) { border: none; }
.filter-cell :deep(.el-select .el-input__suffix) { color: #c0c4cc; }
.dl-icon-close {
  display: inline-flex; align-items: center; color: #999; cursor: pointer; margin-left: 6px;
  padding-left: 6px; border-left: 1px solid #e8eaec;
}
.dl-icon-close :deep(svg) { width: 12px; height: 12px; }
.dl-icon-close:hover { color: #197afb; }

/* 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索 + 🔍 */
.dl-search-wrap { margin: 0 8px 8px 0; }
.dl-search-wrap :deep(.cl-search-input) { width: 280px; }
.dl-search-wrap :deep(.cl-search-input .el-input__inner) { height: 28px; font-size: 12px; }
/* 线上 .cl-search-input 整组 280px：字段下拉 80px 在左，🔍 按钮 40px 在右 */
.dl-search-wrap :deep(.cl-search-input .el-input-group__prepend) { padding: 0; background: #fff; }
.dl-search-wrap :deep(.cl-search-input .el-input-group__prepend .el-select) {
  flex: none; width: 80px; margin: 0;
}
.dl-search-wrap :deep(.cl-search-input .el-input-group__prepend .el-select__wrapper) { box-shadow: none; }
.dl-search-wrap :deep(.cl-search-input .el-input-group__append) { padding: 0; background: #fff; }
.dl-search-wrap :deep(.cl-search-input .el-input-group__append .el-button) {
  width: 40px; height: 26px; margin: 0; padding: 0; border-radius: 0 3px 3px 0;
}
.dl-search-wrap :deep(.search-field) { width: 80px; }
.dl-search-wrap :deep(.search-field .el-input__inner) { height: 28px; font-size: 12px; }
.dl-search-wrap :deep(.search-more-btn) { height: 26px; padding: 0; border-radius: 0 3px 3px 0; }
.dl-batch-icon {
  display: inline-flex; align-items: center; font-size: 15px; color: #606266; cursor: pointer;
}
.dl-batch-icon:hover { color: #197afb; }

/* 批量搜索气泡 */
.dl-batch__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.dl-batch__title { font-size: 14px; color: #333; font-weight: 500; }
.dl-batch__tips { font-size: 12px; color: #909399; margin-bottom: 6px; }
.dl-batch__link { color: #197afb; cursor: pointer; }
.dl-batch__pop-title { font-size: 14px; color: #303133; margin-bottom: 6px; }

/* ---------- 工具栏 ---------- */
.dl-export-btn { margin-left: auto; }

/* ---------- 列表 ---------- */
.asset-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.asset-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* ---------- 新增 / 导入 弹窗 ---------- */
.dl-dialog :deep(.el-dialog__body) { padding-top: 12px; }
.dl-dialog :deep(.el-form-item__label) { font-size: 14px; color: #666; }
.dl-dialog :deep(.dialog-footer) { display: flex; justify-content: flex-end; gap: 12px; }
.dl-radio-group { width: 360px; }
.dl-radio-tip { flex: 0 0 100%; font-size: 12px; color: #909399; margin-top: 4px; }
.dl-import-form :deep(.el-form-item) { margin-bottom: 20px; }
.w120 { width: 120px; }
.btn-tip { font-size: 12px; color: #909399; margin-left: 8px; }
.dl-upload :deep(.el-upload-list) { margin-top: 6px; }
</style>
