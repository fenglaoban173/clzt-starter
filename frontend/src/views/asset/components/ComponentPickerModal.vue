<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="970px"
    append-to-body
    class="cp-modal"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <!-- 数据源 -->
    <div class="cp-source">
      <span class="cp-label">数据源</span>
      <el-radio-group v-model="source" size="small">
        <el-radio-button label="sync">同步数据</el-radio-button>
        <el-radio-button label="real">实时数据</el-radio-button>
      </el-radio-group>
    </div>

    <div class="cp-body">
      <!-- 左侧账户列表 -->
      <div class="cp-accounts">
        <div
          v-for="a in accounts"
          :key="a.advertiser_id"
          class="cp-account"
          :class="{ active: a.advertiser_id === currentAccount }"
          @click="currentAccount = a.advertiser_id"
        >
          <el-radio :model-value="currentAccount" :label="a.advertiser_id" />
          <div class="cp-account__name">{{ a.name }}</div>
          <div class="cp-account__id">{{ a.advertiser_id }}</div>
        </div>
      </div>

      <!-- 右侧组件列表 -->
      <div class="cp-main">
        <div class="cp-toolbar">
          <span class="cp-title">选择{{ title }}</span>
          <div class="cp-toolbar__btns">
            <el-button size="small" type="primary" @click="onMsg('多账户刷新')">多账户刷新</el-button>
            <el-button size="small" plain @click="onMsg('清空所有资产')">清空所有资产</el-button>
            <el-button size="small" plain @click="onMsg('多账户快速选择')">多账户快速选择</el-button>
            <el-button size="small" text disabled>复制到其他账户</el-button>
          </div>
        </div>

        <div class="cp-filter">
          <el-select v-model="filterField" class="cp-filter__field" size="small" placeholder="请选择">
            <el-option label="名称" value="名称" />
            <el-option label="ID" value="ID" />
          </el-select>
          <el-input v-model="keyword" class="cp-filter__input" size="small" placeholder="请输入关键词">
            <template #append>
              <el-button :icon="Search" @click="filterApplied = true" />
            </template>
          </el-input>
          <el-button class="cp-filter__more" :icon="MoreFilled" @click="onMsg('批量搜索')" />
        </div>

        <el-table
          ref="tableRef"
          :data="filteredItems"
          border
          size="small"
          height="300"
          @selection-change="onSelectionChange"
        >
          <el-table-column :label="nameLabel" min-width="220">
            <template #default="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column prop="project_count" label="关联项目数" width="120" align="center" />
          <el-table-column label="已选" width="150" align="right">
            <template #header>
              <span>已选({{ selected.length }}/1)</span>
              <el-button class="cp-clear" size="small" text @click="clearSelection">清空</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <div class="cp-empty">
              <div class="cp-empty__icon">🗂</div>
              <div>没找到想要的组件？可尝试同步哦</div>
            </div>
          </template>
        </el-table>

        <div class="cp-checks">
          <el-checkbox v-model="onlyUnused">仅查看未使用资产</el-checkbox>
          <el-checkbox v-model="onlyUpgrade">仅看升级版资产</el-checkbox>
        </div>

        <div class="cp-pager">
          <el-pagination
            v-model:current-page="pageNo"
            :page-size="10"
            :total="filteredItems.length"
            layout="prev, pager, next"
            small
            background
          />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button size="small" plain @click="close">取 消</el-button>
      <el-button size="small" type="primary" @click="confirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, MoreFilled } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '选择微信小游戏' },
  nameLabel: { type: String, default: '微信小游戏名称' },
  items: { type: Array, default: () => [] },
  accounts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const source = ref('sync');
const currentAccount = ref('');
const filterField = ref('名称');
const keyword = ref('');
const filterApplied = ref(false);
const onlyUnused = ref(false);
const onlyUpgrade = ref(false);
const pageNo = ref(1);
const selected = ref([]);
const tableRef = ref();

const filteredItems = computed(() => {
  let rows = props.items || [];
  if (onlyUnused.value) rows = rows.filter((r) => !r.used);
  if (onlyUpgrade.value) rows = rows.filter((r) => r.upgrade);
  const kw = keyword.value.trim();
  if (kw) {
    rows = rows.filter((r) => (filterField.value === 'ID'
      ? String(r.id).includes(kw)
      : r.name.includes(kw)));
  }
  return rows;
});

watch(() => props.modelValue, (v) => {
  if (v) {
    selected.value = [];
    pageNo.value = 1;
    if (!currentAccount.value && props.accounts.length) currentAccount.value = props.accounts[0].advertiser_id;
  }
});

function onSelectionChange(rows) { selected.value = rows; }
function clearSelection() { tableRef.value?.clearSelection(); selected.value = []; }
function onMsg(t) { ElMessage.info(`原型：${t}`); }
function close() { emit('update:modelValue', false); }
function confirm() {
  if (!selected.value.length) { ElMessage.warning('请选择组件'); return; }
  emit('confirm', selected.value[0]);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.cp-source { display: flex; align-items: center; margin-bottom: 14px; }
.cp-label { font-size: 13px; color: #333; margin-right: 12px; }
.cp-body { display: flex; border: 1px solid #e8eaec; min-height: 470px; }
.cp-accounts {
  flex: none; width: 190px; border-right: 1px solid #e8eaec; padding: 8px 0; overflow-y: auto;
  background: #fbfcfd;
}
.cp-account { padding: 6px 10px; cursor: pointer; border-left: 2px solid transparent; }
.cp-account.active { background: #fff; border-left-color: #197afb; }
.cp-account :deep(.el-radio) { height: 18px; }
.cp-account :deep(.el-radio__label) { font-size: 12px; }
.cp-account__name { font-size: 12px; color: #333; line-height: 18px; word-break: break-all; }
.cp-account__id { font-size: 12px; color: #909399; line-height: 18px; }
.cp-main { flex: 1; padding: 12px 16px; min-width: 0; }
.cp-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.cp-title { font-size: 13px; color: #333; }
.cp-toolbar__btns { display: flex; gap: 8px; }
.cp-toolbar__btns :deep(.el-button) { font-size: 12px; }
.cp-filter { display: flex; align-items: center; margin-bottom: 10px; }
.cp-filter__field { width: 90px; }
.cp-filter__input { width: 220px; }
.cp-filter__input :deep(.el-input-group__append) { padding: 0; background: #fff; }
.cp-filter__more { height: 32px; padding: 0 8px; }
.cp-checks { display: flex; gap: 24px; margin-top: 10px; }
.cp-checks :deep(.el-checkbox__label) { font-size: 12px; color: #666; }
.cp-pager { display: flex; justify-content: center; margin-top: 10px; }
.cp-clear { margin-left: 8px; }
.cp-empty { color: #909399; font-size: 12px; padding: 24px 0; }
.cp-empty__icon { font-size: 32px; margin-bottom: 8px; }
</style>
