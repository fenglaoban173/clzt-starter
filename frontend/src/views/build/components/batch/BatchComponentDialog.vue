<template>
  <!-- 选择附加创意组件（线上：创意组件「选择创意组件」按钮打开）
       * 700×，标题「选择附加创意组件」+「功能说明」链接
       * 橙色提示：未展示的组件类型暂时不支持获取和使用，审核未通过的组件不支持使用
       * 右上：清空所有资产 / 多账户快速选择
       * 三栏：左账户列表（4 个）+ 中间（产品下拉 + 关键词查询 + 组件表）+ 右已选面板 -->
  <el-dialog
    :model-value="modelValue"
    width="700px"
    class="adpick-dialog"
    align-center
    append-to-body
    :z-index="2600"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <div class="adpick-header">
        <span class="adpick-header__title">选择附加创意组件</span>
        <a class="adpick-link adpick-header__help" @click="onHelp">功能说明</a>
      </div>
    </template>

    <div class="adpick-tip adpick-tip--compact">
      <span class="adpick-tip__icon">!</span>
      <div class="adpick-tip__text">
        <p>未展示的组件类型暂时不支持获取和使用，审核未通过的组件不支持使用</p>
      </div>
    </div>

    <div class="adpick-head adpick-head--right">
      <div class="adpick-head__actions">
        <el-button size="small" class="adpick-btn" @click="onSync">同步账户创意组件</el-button>
        <el-button size="small" class="adpick-btn" @click="onClearAll">清空所有资产</el-button>
        <el-button size="small" class="adpick-btn" @click="onMultiPick">多账户快速选择</el-button>
      </div>
    </div>

    <div class="adpick-cols adpick-cols--3">
      <!-- 左：账户列表 -->
      <div class="adpick-accounts">
        <div
          v-for="a in accounts"
          :key="a.id"
          class="adpick-account"
          :class="{ 'is-active': a.id === activeAccount }"
          @click="activeAccount = a.id"
        >
          <div class="adpick-account__main">
            <div class="adpick-account__name">{{ a.name }}</div>
            <div class="adpick-account__id">{{ a.id }}</div>
          </div>
          <i v-if="a.id === activeAccount" class="adpick-account__check">✓</i>
        </div>
      </div>

      <!-- 中：产品 + 关键词 + 组件表 -->
      <div class="adpick-list">
        <div class="adpick-product">
          <el-select v-model="product" size="small" class="adpick-product__select">
            <el-option label="推广卡片（+11）" value="CARD" />
          </el-select>
        </div>
        <div class="adpick-filter adpick-filter--tight">
          <el-input v-model="keyword" size="small" class="adpick-kw" placeholder="请输入关键词" />
          <el-button size="small" type="primary" class="adpick-query" @click="onQuery">查询</el-button>
        </div>
        <div class="adpick-meta">项目数：{{ projectCount }}　广告数：{{ adCount }}</div>
        <el-table
          ref="tableRef"
          :data="rows"
          height="230"
          class="adpick-table"
          row-key="id"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="36" reserve-selection />
          <el-table-column label="组件名称" prop="name" min-width="140" show-overflow-tooltip />
          <el-table-column label="组件类型" prop="type" width="80" />
          <el-table-column label="组件状态" prop="status" width="86" />
          <template #empty>
            <div class="adpick-empty adpick-empty--nowrap">
              <i class="adpick-empty__icon"></i>
              <p>没找到想要的创意组件</p>
            </div>
          </template>
        </el-table>
      </div>

      <!-- 右：已选 -->
      <div class="adpick-sel">
        <div class="adpick-sel__head">
          <span>已选({{ selected.length }})</span>
          <a class="adpick-link" @click="onClearSel">清空</a>
        </div>
        <div class="adpick-sel__body">
          <div v-for="s in selected" :key="s.id" class="adpick-sel__item">
            <span>{{ s.name }}</span>
            <el-icon class="adpick-sel__x" @click="removeSelected(s)"><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button class="adpick-foot-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="adpick-foot-btn adpick-foot-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

const accounts = [
  { id: '1881004598305866', name: '红果-央广-199' },
  { id: '1881004597144836', name: '红果-央广-198' },
  { id: '1881004595845194', name: '红果-央广-197' },
  { id: '1881004594760073', name: '红果-央广-196' },
];
/* 点「同步账户创意组件」后按账户拉取的模拟数据（本地 mock，用于演示勾选 → 提交） */
const COMPONENT_MOCK = {
  '1881004598305866': [
    { id: 'cp19901', name: '推广卡片-女频-01', type: '推广卡片', status: '审核通过' },
    { id: 'cp19902', name: '推广卡片-男频-02', type: '推广卡片', status: '审核通过' },
    { id: 'cp19903', name: '推广卡片-活动-03', type: '推广卡片', status: '审核中' },
  ],
  '1881004597144836': [
    { id: 'cp19801', name: '推广卡片-新客-04', type: '推广卡片', status: '审核通过' },
    { id: 'cp19802', name: '推广卡片-回访-05', type: '推广卡片', status: '审核中' },
  ],
  '1881004595845194': [
    { id: 'cp19701', name: '推广卡片-素材-06', type: '推广卡片', status: '审核通过' },
    { id: 'cp19702', name: '推广卡片-素材-07', type: '推广卡片', status: '审核通过' },
    { id: 'cp19703', name: '推广卡片-素材-08', type: '推广卡片', status: '审核未通过' },
  ],
  '1881004594760073': [
    { id: 'cp19601', name: '推广卡片-测试-09', type: '推广卡片', status: '审核通过' },
  ],
};
const activeAccount = ref(accounts[0].id);
const product = ref('CARD');
const keyword = ref('');
const synced = ref(false);
const rows = computed(() =>
  synced.value ? COMPONENT_MOCK[activeAccount.value] || [] : []
);
const projectCount = ref(1);
const adCount = ref(10);

/* 已选按账户分别存放：切换账户各自保留，多账户快速选择一次写入全部账户 */
const tableRef = ref();
const pickedMap = ref({});
const selected = computed(() => accounts.flatMap((a) => pickedMap.value[a.id] || []));
let syncing = false;

function applyPickedToTable() {
  const t = tableRef.value;
  if (!t) return;
  syncing = true;
  t.clearSelection();
  const picked = pickedMap.value[activeAccount.value] || [];
  rows.value.forEach((r) => {
    if (picked.some((p) => p.id === r.id)) t.toggleRowSelection(r, true);
  });
  syncing = false;
}

watch(activeAccount, () => nextTick(applyPickedToTable));

function onHelp() {
  ElMessage.info('附加创意组件功能说明');
}
/* 同步账户创意组件 —— 把每个账户下的组件拉回来，给表格用 */
function onSync() {
  if (synced.value) {
    ElMessage.info('创意组件已同步');
    return;
  }
  synced.value = true;
  const total = Object.values(COMPONENT_MOCK).reduce((n, arr) => n + arr.length, 0);
  ElMessage.success(`已同步 ${total} 个创意组件，可勾选后提交`);
  nextTick(applyPickedToTable);
}
function onClearAll() {
  pickedMap.value = {};
  if (tableRef.value) {
    syncing = true;
    tableRef.value.clearSelection();
    syncing = false;
  }
  ElMessage.success('已清空所有资产');
}
function onClearSel() {
  pickedMap.value = {};
  if (tableRef.value) {
    syncing = true;
    tableRef.value.clearSelection();
    syncing = false;
  }
}
/* 多账户快速选择：每个账户默认勾选该账户列表里的一条到已选区 */
function onMultiPick() {
  synced.value = true;
  const map = {};
  accounts.forEach((a) => {
    const list = COMPONENT_MOCK[a.id] || [];
    if (list.length) map[a.id] = [list[0]];
  });
  pickedMap.value = map;
  nextTick(applyPickedToTable);
  ElMessage.success(`已为 ${Object.keys(map).length} 个账户各勾选 1 个创意组件`);
}
function onQuery() {
  ElMessage.success('已查询创意组件');
}
function onSelectionChange(list) {
  if (syncing) return;
  pickedMap.value = { ...pickedMap.value, [activeAccount.value]: list || [] };
}
function removeSelected(row) {
  const map = { ...pickedMap.value };
  Object.keys(map).forEach((k) => {
    map[k] = (map[k] || []).filter((s) => s.id !== row.id);
  });
  pickedMap.value = map;
  const r = rows.value.find((x) => x.id === row.id);
  if (tableRef.value && r) {
    syncing = true;
    tableRef.value.toggleRowSelection(r, false);
    syncing = false;
  }
}
function onConfirm() {
  /* 回传时带上所属账户，供抽屉按「账户 / 名称」列表回显 */
  const list = accounts.flatMap((a) =>
    (pickedMap.value[a.id] || []).map((r) => ({ ...r, account: a.name, accountId: a.id }))
  );
  emit('confirm', list);
  emit('update:modelValue', false);
}
</script>



