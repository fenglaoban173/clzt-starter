<template>
  <div class="cmp-page">
    <!-- ① 页面标题（线上 .mg-title-header，48px 高） -->
    <div class="asset-title-bar cmp-title-bar">
      <span class="asset-title">创意组件</span>
    </div>

    <!-- ② 查询条件（线上 .mg-filter-wrapper + .select-area） -->
    <div class="cmp-filter-area">
      <div class="filter-left">
        <!-- 媒体账户（远程可搜索 + 独立清空 ✕） -->
        <div class="filter-cell">
          <label class="filter-label">媒体账户：</label>
          <el-select
            v-model="query.accountId"
            class="filter-select cmp-account-select"
            size="small"
            filterable
            remote
            :remote-method="searchAccount"
            :loading="accountLoading"
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="a in accountOptions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
          <el-icon class="cmp-icon-close" title="清空" @click="clearAccount"><Close /></el-icon>
        </div>

        <!-- 状态 -->
        <div class="filter-cell">
          <label class="filter-label">状态：</label>
          <el-select
            v-model="query.status"
            class="filter-select"
            size="small"
            placeholder="请选择状态"
            @change="onFilterChange"
          >
            <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
          </el-select>
        </div>

        <!-- 组件类型 -->
        <div class="filter-cell">
          <label class="filter-label">组件类型：</label>
          <el-select
            v-model="query.compType"
            class="filter-select"
            size="small"
            placeholder="请选择组件类型"
            @change="onFilterChange"
          >
            <el-option v-for="t in COMP_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </div>

        <!-- 关键词搜索：字段类型下拉（80px）+ 关键词输入 + 🔍 -->
        <div class="cmp-search">
          <el-input
            v-model="searchKeyword"
            class="cl-search-input cmp-search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #prepend>
              <el-select v-model="searchField" class="search-field cmp-search-field" size="small" placeholder="请选择">
                <el-option v-for="f in SEARCH_FIELDS" :key="f.value" :label="f.label" :value="f.value" />
              </el-select>
            </template>
            <template #append>
              <el-button class="cmp-search-btn" title="搜索" @click="onSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 清空 -->
        <a class="filter-clear cmp-clear" @click="onClearFilters">清空</a>
      </div>
    </div>

    <!-- ③ 功能按钮条（线上 .mg-filter-wrapper，padding 16px，无批量操作） -->
    <div class="table-toolbar cmp-toolbar">
      <el-button type="primary" size="small" class="tool-btn" @click="openCreateDrawer">新建创意组件</el-button>
      <el-button type="primary" size="small" class="tool-btn" :loading="syncing" @click="onSync">同步创意组件</el-button>
    </div>

    <!-- ④ 列表（线上 el-table--border el-table--mini，6 列，线上无分页） -->
    <el-table
      :data="filteredList"
      row-key="id"
      border
      class="asset-table cmp-table"
      empty-text="暂无数据"
    >
      <el-table-column prop="name" label="组件名称" min-width="315" show-overflow-tooltip />
      <el-table-column prop="component_id" label="组件ID" min-width="313" show-overflow-tooltip />
      <el-table-column label="操作" min-width="160">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEditDrawer(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="comp_type" label="组件类型" min-width="313" />
      <el-table-column prop="audit_status" label="审核状态" min-width="313" />
      <el-table-column prop="account" label="账户" min-width="313" show-overflow-tooltip />
    </el-table>

    <!-- ⑤ 新建 / 编辑创意组件抽屉（线上 el-drawer：832px，顶栏下方 64px 起，无遮罩） -->
    <el-drawer
      v-model="drawerVisible"
      size="832"
      direction="rtl"
      :with-header="false"
      :modal="false"
      :modal-penetrable="true"
      class="cmp-drawer"
    >
      <div class="cl-drawer cmp-drawer-inner">
        <!-- 左侧关闭按钮列（线上 32px 宽，蓝色 32×32 关闭按钮） -->
        <div class="cmp-drawer-rail">
          <button class="cmp-close-btn" type="button" title="关闭" @click="closeDrawer">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <!-- 内容区（线上 .detail-wrapper，800px） -->
        <div class="cmp-drawer-main">
          <div class="drawer-header cmp-drawer-header">
            <span class="header-title cmp-drawer-title">{{ drawerTitle }}</span>
          </div>

          <div class="drawer-content cmp-drawer-content">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-width="110px"
              label-position="left"
              hide-required-asterisk
              class="cl-drawer-form cmp-drawer-form"
            >
              <!-- 组件类型（线上仅「图片磁贴」） -->
              <el-form-item label="组件类型">
                <el-radio-group v-model="form.compType" class="ag-radio cmp-radio">
                  <el-radio-button :value="'图片磁贴'">图片磁贴</el-radio-button>
                </el-radio-group>
                <div class="text-tips cmp-tips">当前仅支持图片磁贴的新建和编辑，其它组件将逐步开放</div>
              </el-form-item>

              <!-- 新建到媒体账户 -->
              <el-form-item label="新建到媒体账户" prop="advertiserId" required>
                <el-select
                  v-model="form.advertiserId"
                  class="ag-select cmp-select"
                  filterable
                  placeholder="请选择媒体账户"
                >
                  <el-option
                    v-for="a in drawerAccounts"
                    :key="a.value"
                    :label="a.label"
                    :value="a.value"
                  />
                </el-select>
              </el-form-item>

              <!-- 投放时间（线上为日期区间：开始日期 ~ 结束日期） -->
              <el-form-item label="投放时间" prop="dateRange" required>
                <el-date-picker
                  v-model="form.dateRange"
                  type="daterange"
                  class="cmp-date"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  unlink-panels
                />
              </el-form-item>

              <!-- 显示图片 -->
              <el-form-item label="显示图片" prop="image" required>
                <div class="cmp-upload-wrap">
                  <el-upload
                    class="cmp-upload"
                    accept="image/*"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="onImageChange"
                  >
                    <div class="cmp-upload-box" :class="{ 'has-image': !!form.image }">
                      <img v-if="form.image" :src="form.image.url" alt="显示图片" />
                      <div v-else class="cmp-upload-empty">
                        <el-icon class="cmp-upload-icon"><UploadFilled /></el-icon>
                        <span class="cmp-upload-text">上传图片</span>
                      </div>
                    </div>
                  </el-upload>
                  <div class="cmp-card-tips">图片尺寸小于等于540*276px，大小&lt;2M</div>
                </div>
              </el-form-item>

              <!-- 出现时间 -->
              <el-form-item label="出现时间">
                <el-radio-group v-model="form.appearTime" class="ag-radio cmp-radio">
                  <el-radio-button :value="'系统默认'">系统默认</el-radio-button>
                  <el-radio-button :value="'自定义'">自定义</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <!-- 组件名称 -->
              <el-form-item label="组件名称" prop="name" required>
                <el-input v-model="form.name" class="ag-input cmp-input" placeholder="请输入组件名称" />
              </el-form-item>

              <!-- 链接（线上为静态说明文案） -->
              <div class="cmp-link-row">
                <span class="cmp-link-label">链接</span>
                <span class="cmp-link-text">与您投放时关联计划落地页保持一致</span>
              </div>
              </el-form>

            <!-- 底部操作（线上 .bottom-btn：8px #f7f7f8 上边框 + 按钮贴底） -->
            <div class="cmp-bottom-btn">
              <div class="dialog-footer">
                <div class="operate-button">
                  <el-button size="small" @click="onPreview">预览组件</el-button>
                  <el-button size="small" type="primary" @click="onSave">保存</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ⑥ 预览组件（线上「预览组件」按钮） -->
    <el-dialog v-model="previewVisible" title="预览组件" width="420px" class="cmp-preview-dialog">
      <div class="cmp-preview">
        <div class="cmp-preview__img">
          <img v-if="form.image" :src="form.image.url" alt="显示图片" />
          <span v-else>未上传图片</span>
        </div>
        <div class="cmp-preview__name">{{ form.name || '未命名组件' }}</div>
        <div class="cmp-preview__tip">投放时间：{{ (form.dateRange || []).join(' ~ ') || '未设置' }}</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="previewVisible = false">关 闭</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Search, UploadFilled } from '@element-plus/icons-vue';

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------ *
 * 线上枚举（采集自 cl.mobgi.com/property/toutiao/creativemodule）
 * ------------------------------------------------------------------ */

/** 媒体账户（线上远程加载，采集到的 22 个选项） */
const ACCOUNTS = [
  { value: 'all', label: '全部账户' },
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

/** 状态（审核状态） */
const STATUS_OPTIONS = ['不限', '审核通过', '审核未通过', '审核中'];

/** 组件类型 */
const COMP_TYPES = [
  '选择磁贴', '投票磁贴', '图片磁贴', '电商磁贴', '优惠券磁贴',
  '游戏礼包码', '轻互动组件', '穿山甲轻互动组件', '预约按钮', '推广卡片',
];

/** 关键词搜索的字段类型 */
const SEARCH_FIELDS = [
  { value: 'name', label: '组件名' },
  { value: 'id', label: 'ID' },
];

/* ------------------------------------------------------------------ *
 * 列表 mock（线上该账户下暂无数据，按业务补 mock）
 * ------------------------------------------------------------------ */
const accountLabel = (id) => {
  const hit = ACCOUNTS.find((a) => a.value === id);
  return hit ? hit.label : '';
};

const MOCK_LIST = [
  { id: 1, name: '双十一大促-商品磁贴', component_id: '7301122334455667788', comp_type: '电商磁贴', audit_status: '审核通过', advertiser_id: '1861811345880074' },
  { id: 2, name: '百度文库会员日-品牌图片磁贴', component_id: '7301122334455667799', comp_type: '图片磁贴', audit_status: '审核中', advertiser_id: '1866877399870663' },
  { id: 3, name: '得物潮流单品-投票磁贴', component_id: '7301122334455667810', comp_type: '投票磁贴', audit_status: '审核通过', advertiser_id: '1834419631681163' },
  { id: 4, name: '任意门安卓下载-预约按钮', component_id: '7301122334455667821', comp_type: '预约按钮', audit_status: '审核未通过', advertiser_id: '1866489873996443' },
  { id: 5, name: '百度文库优惠券-优惠券磁贴', component_id: '7301122334455667832', comp_type: '优惠券磁贴', audit_status: '审核通过', advertiser_id: '1866877399203047' },
  { id: 6, name: '游戏预约礼包-游戏礼包码', component_id: '7301122334455667843', comp_type: '游戏礼包码', audit_status: '审核中', advertiser_id: '1866489858950211' },
  { id: 7, name: 'iOS端轻互动-答题组件', component_id: '7301122334455667854', comp_type: '轻互动组件', audit_status: '审核通过', advertiser_id: '1866489860302024' },
  { id: 8, name: '穿山甲小游戏-轻互动组件', component_id: '7301122334455667865', comp_type: '穿山甲轻互动组件', audit_status: '审核未通过', advertiser_id: '1866489860976135' },
  { id: 9, name: '教育课程推广卡片', component_id: '7301122334455667876', comp_type: '推广卡片', audit_status: '审核通过', advertiser_id: '1866849651765706' },
  { id: 10, name: '高途考研-选择磁贴', component_id: '7301122334455667887', comp_type: '选择磁贴', audit_status: '审核中', advertiser_id: '1861811345880074' },
  { id: 11, name: '央广自营-商品图磁贴', component_id: '7301122334455667898', comp_type: '图片磁贴', audit_status: '审核通过', advertiser_id: '1866877405575303' },
  { id: 12, name: '得物秋季上新-推广卡片', component_id: '7301122334455667909', comp_type: '推广卡片', audit_status: '审核中', advertiser_id: '1866489871677514' },
];

const list = ref(
  MOCK_LIST.map((r) => ({ ...r, account: accountLabel(r.advertiser_id) })),
);

/* ------------------------------------------------------------------ *
 * 查询条件
 * ------------------------------------------------------------------ */
const query = ref({ accountId: 'all', status: '不限', compType: '' });
const searchField = ref('name');
const searchKeyword = ref('');

const accountKeyword = ref('');
const accountLoading = ref(false);
const accountOptions = computed(() => {
  const k = (accountKeyword.value || '').trim().toLowerCase();
  return ACCOUNTS.filter(
    (a) => a.value === 'all' || !k || a.label.toLowerCase().indexOf(k) > -1,
  );
});

/** 抽屉内媒体账户（不含「全部账户」） */
const drawerAccounts = computed(() => ACCOUNTS.filter((a) => a.value !== 'all'));

function searchAccount(kw) {
  accountLoading.value = true;
  accountKeyword.value = kw || '';
  setTimeout(() => { accountLoading.value = false; }, 120);
}

function onFilterChange() { /* 过滤是响应式的，无需额外处理 */ }
function onSearch() { /* 过滤是响应式的，无需额外处理 */ }

function clearAccount() {
  query.value.accountId = '';
  ElMessage.info('已清空媒体账户');
}

function onClearFilters() {
  query.value = { accountId: 'all', status: '不限', compType: '' };
  searchField.value = 'name';
  searchKeyword.value = '';
  accountKeyword.value = '';
  ElMessage.info('已清空筛选条件');
}

/* ------------------------------------------------------------------ *
 * 列表过滤
 * ------------------------------------------------------------------ */
const filteredList = computed(() => {
  const q = query.value;
  let rows = list.value;
  if (q.accountId && q.accountId !== 'all') {
    rows = rows.filter((r) => r.advertiser_id === q.accountId);
  }
  if (q.status && q.status !== '不限') {
    rows = rows.filter((r) => r.audit_status === q.status);
  }
  if (q.compType) {
    rows = rows.filter((r) => r.comp_type === q.compType);
  }
  const kw = (searchKeyword.value || '').trim();
  if (kw) {
    rows = rows.filter((r) => {
      if (searchField.value === 'id') return String(r.component_id).indexOf(kw) > -1;
      return String(r.name).indexOf(kw) > -1;
    });
  }
  return rows;
});

/* ------------------------------------------------------------------ *
 * 同步创意组件（线上：未选择具体媒体账户时提示「请选择媒体账户」）
 * ------------------------------------------------------------------ */
const syncing = ref(false);
function onSync() {
  if (syncing.value) return;
  if (!query.value.accountId || query.value.accountId === 'all') {
    ElMessage.warning('请选择媒体账户');
    return;
  }
  syncing.value = true;
  setTimeout(() => {
    syncing.value = false;
    ElMessage.success('同步成功');
  }, 1000);
}

/* ------------------------------------------------------------------ *
 * 新建 / 编辑抽屉
 * ------------------------------------------------------------------ */
const drawerVisible = ref(false);
const drawerTitle = ref('新建创意组件');
const formRef = ref();
const previewVisible = ref(false);
/* 编辑态记录 id（新建时为 null） */
const editingId = ref(null);

const emptyForm = () => ({
  compType: '图片磁贴',
  advertiserId: '',
  dateRange: [],
  image: null,
  appearTime: '系统默认',
  name: '',
});
const form = ref(emptyForm());

const rules = {
  advertiserId: [{ required: true, message: '请选择媒体账户', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择投放时间', trigger: 'change' }],
  image: [{ required: true, message: '请上传显示图片', trigger: 'change' }],
  name: [{ required: true, message: '请输入组件名称', trigger: 'blur' }],
};

function openCreateDrawer() {
  editingId.value = null;
  drawerTitle.value = '新建创意组件';
  form.value = emptyForm();
  previewVisible.value = false;
  drawerVisible.value = true;
}

function openEditDrawer(row) {
  editingId.value = row.id;
  drawerTitle.value = '编辑创意组件';
  form.value = {
    compType: '图片磁贴',
    advertiserId: row.advertiser_id,
    dateRange: [],
    image: null,
    appearTime: '系统默认',
    name: row.name,
  };
  previewVisible.value = false;
  drawerVisible.value = true;
}

function closeDrawer() {
  drawerVisible.value = false;
}

/* 行内操作：删除 */
async function removeRow(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除创意组件「${row.name}」吗？删除后不可恢复。`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
  } catch (e) {
    return;
  }
  list.value = list.value.filter((r) => r.id !== row.id);
  ElMessage.success('删除成功');
}

function onImageChange(uploadFile) {
  const raw = uploadFile && uploadFile.raw ? uploadFile.raw : uploadFile;
  if (!raw) return;
  form.value.image = { name: raw.name, url: URL.createObjectURL(raw) };
  ElMessage.success('图片上传成功');
}

function onPreview() {
  if (!form.value.name) {
    ElMessage.warning('请先输入组件名称');
    return;
  }
  previewVisible.value = true;
}

function onSave() {
  formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请完善必填信息');
      return;
    }
    const acc = accountLabel(form.value.advertiserId);
    const exists = list.value.some((r) => r.id === editingId.value);
    if (exists) {
      const idx = list.value.findIndex((r) => r.id === editingId.value);
      list.value[idx] = {
        ...list.value[idx],
        name: form.value.name,
        comp_type: form.value.compType,
        advertiser_id: form.value.advertiserId,
        account: acc,
        audit_status: '审核中',
      };
    } else {
      list.value.unshift({
        id: Date.now(),
        name: form.value.name,
        component_id: `7301${String(Date.now()).slice(-13)}`,
        comp_type: form.value.compType,
        audit_status: '审核中',
        advertiser_id: form.value.advertiserId,
        account: acc,
      });
    }
    drawerVisible.value = false;
    ElMessage.success(exists ? '保存成功' : '新建成功');
  });
}
</script>

<style scoped>
.cmp-page { width: 100%; }

/* ---------- 页面标题（线上 .mg-title-header：48px） ---------- */
.cmp-title-bar { height: 48px; padding: 0; display: flex; align-items: center; }
.cmp-title-bar .asset-title { font-size: 16px; font-weight: 600; color: #1d2129; line-height: 48px; }

/* ---------- 查询条件（线上 .mg-filter-wrapper，12/16 padding） ---------- */
.cmp-filter-area { padding: 0 0 28px; }
.cmp-filter-area .filter-left { align-items: center; flex-wrap: wrap; }
.cmp-filter-area .filter-cell {
  height: 28px; margin: 0 8px 0 0; padding: 0;
  background: transparent; border: none; border-radius: 0;
}
.cmp-filter-area .filter-label { font-size: 12px; color: #666; margin-right: 4px; white-space: nowrap; }
.cmp-filter-area .filter-select { width: 169px; flex: none; }
.cmp-filter-area .filter-select :deep(.el-input__wrapper) { padding-left: 8px; }
.cmp-filter-area .filter-select :deep(.el-input__inner) { height: 28px; font-size: 12px; color: #606266; }
.cmp-icon-close {
  margin-left: 8px; font-size: 12px; color: #999; cursor: pointer;
}
.cmp-icon-close:hover { color: #197afb; }

/* 关键词搜索：字段类型下拉(80) + 关键词输入 + 🔍 */
.cmp-search { margin: 0 8px 0 0; }
.cmp-search-input { width: 280px; }
.cmp-search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.cmp-search-input :deep(.el-input-group__prepend) { padding: 0; background: #fff; }
.cmp-search-input :deep(.el-input-group__append) { padding: 0; background: #fff; }
.cmp-search-field { width: 80px; }
.cmp-search-field :deep(.el-input__inner) { height: 28px; font-size: 12px; border-radius: 3px 0 0 3px; }
.cmp-search-btn {
  width: 40px; height: 28px; padding: 0; border-radius: 0 3px 3px 0; border-left: 0;
}
.cmp-clear { font-size: 12px; color: #197afb; cursor: pointer; margin: 0 0 0 4px; line-height: 28px; }

/* ---------- 工具栏（线上 .mg-filter-wrapper：padding 16px、64px 高） ---------- */
.cmp-toolbar {
  height: 64px; padding: 16px; margin-bottom: 0;
  background: #fff; border: none; border-top: 1px solid #e8eaec; border-radius: 0;
}
.cmp-toolbar .tool-btn { font-size: 12px; height: 32px; padding: 9px 15px; border-radius: 3px; }

/* ---------- 列表（线上 el-table--border el-table--mini） ---------- */
.cmp-table { font-size: 12px; width: 100%; }
.cmp-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.cmp-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.cmp-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.cmp-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* ---------- 抽屉（线上 832px：左 32px 关闭列 + 800px 内容区；label 110px、控件 300px） ---------- */
.cmp-drawer-inner { display: flex; flex-direction: row; height: 100%; background: #fff; }
.cmp-drawer-rail { width: 32px; flex: none; padding-top: 16px; }
.cmp-close-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  padding: 0; border: none; border-radius: 0; background: #197afb; color: #fff; cursor: pointer;
}
.cmp-close-btn:hover { background: #4b9bff; }
.cmp-close-btn :deep(.el-icon) { font-size: 24px; }

.cmp-drawer-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #fff; }
.cmp-drawer-header {
  flex: none; height: 48px; padding: 0 32px; display: flex; align-items: center;
  background: #fff; border-bottom: none;
}
.cmp-drawer-title { font-size: 16px; font-weight: 500; color: #333; line-height: 48px; }

.cmp-drawer-content {
  flex: 1; overflow-y: auto; padding: 0; background: #fff;
  display: flex; flex-direction: column;
}
.cmp-drawer-form { padding: 24px 32px 0; }
.cmp-drawer-form :deep(.el-form-item) { margin-bottom: 24px; }
.cmp-drawer-form :deep(.el-form-item__label) {
  width: 110px; font-size: 14px; color: #666; white-space: nowrap;
}
.cmp-drawer-form :deep(.el-form-item__content) { margin-left: 0 !important; }

.cmp-radio :deep(.el-radio-button__inner) {
  padding: 9px 12px; font-size: 12px; min-width: 80px; min-height: 32px;
  box-sizing: border-box; text-align: center;
}
.cmp-radio :deep(.el-radio-button__orig-radio) { display: none; }
.cmp-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #d6eaff; border-color: #197afb; color: #197afb; box-shadow: -1px 0 0 0 #197afb;
}
.cmp-select { width: 300px; }
.cmp-input { width: 300px; }
.cmp-input :deep(.el-input__wrapper) { height: 32px; box-sizing: border-box; }
.cmp-input :deep(.el-input__inner) { height: 30px; font-size: 13px; }
.cmp-date :deep(.el-range-input) { font-size: 12px; color: #606266; }
.cmp-date :deep(.el-range-separator) { font-size: 12px; color: #606266; }

/* 提示文案（线上 .text-tips / .card-tips） */
.cmp-tips { width: 100%; font-size: 12px; color: #999; line-height: 32px; }
.cmp-card-tips {
  width: 100%; margin-top: 4px; padding-top: 4px; font-size: 12px; color: #999; line-height: 12px;
}

/* 显示图片上传（线上 124×124 虚线框，图标 + 文案同一行） */
.cmp-upload-wrap { width: 100%; }
.cmp-upload :deep(.el-upload) { display: block; }
.cmp-upload-box {
  width: 124px; height: 124px; box-sizing: border-box; padding: 8px;
  display: flex; align-items: center; justify-content: center;
  border: 1px dashed #dcdfe6; border-radius: 4px; background: #fff; cursor: pointer; overflow: hidden;
}
.cmp-upload-box:hover { border-color: #197afb; }
.cmp-upload-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.cmp-upload-box img { width: 100%; height: 100%; object-fit: cover; }
.cmp-upload-icon { font-size: 18px; color: #5a5a5a; margin-right: 4px; }
.cmp-upload-text { font-size: 12px; color: #333; }

/* 链接（静态说明） */
.cmp-link-row { display: flex; align-items: flex-start; margin-bottom: 24px; }
.cmp-link-label { width: 110px; flex: none; font-size: 14px; color: #666; line-height: 18px; }
.cmp-link-text { font-size: 14px; color: #333; line-height: 18px; }

/* 底部操作（线上 .bottom-btn：8px #f7f7f8 上边框、按钮贴底左对齐） */
.cmp-bottom-btn {
  margin-top: auto; padding: 16px 32px 32px; background: #fff; border-top: 8px solid #f7f7f8;
}
.cmp-bottom-btn .dialog-footer { justify-content: flex-start; }
.cmp-bottom-btn .el-button {
  width: 80px; font-size: 12px; height: 32px; padding: 9px 15px; border-radius: 3px;
}
.cmp-bottom-btn .el-button + .el-button { margin-left: 0; }

/* ---------- 预览组件 ---------- */
.cmp-preview { text-align: center; }
.cmp-preview__img {
  width: 270px; height: 138px; margin: 0 auto 12px; border: 1px solid #e8eaec; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; overflow: hidden; color: #909399; font-size: 13px;
}
.cmp-preview__img img { width: 100%; height: 100%; object-fit: cover; }
.cmp-preview__name { font-size: 14px; color: #333; font-weight: 500; }
.cmp-preview__tip { margin-top: 6px; font-size: 12px; color: #909399; }
</style>

<!-- el-drawer 内部节点（EP 组件根节点不带父组件作用域标记，故此处不用 scoped） -->
<style>
/* 线上抽屉：宽 832px、位于顶部导航下方、无遮罩 */
.el-drawer.cmp-drawer.rtl { top: 56px; height: calc(100% - 56px); }
.cmp-drawer .el-drawer__body { padding: 0; overflow: hidden; }
/* 线上「投放时间」为 220×32 的日期区间控件 */
.cmp-drawer .cmp-date.el-date-editor {
  width: 220px !important; flex: 0 0 auto !important; box-sizing: border-box;
}
</style>
