<template>
  <div v-loading="loading" class="page">
    <div class="page-head">
      <div class="head-tip"></div>
      <div class="head-actions">
        <el-button type="primary" @click="onNewPlan">新建计划</el-button>
        <el-button @click="onCustomColumn">自定义列</el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filter-row">
        <el-select v-model="filters.external_action" style="width: 200px" clearable placeholder="优化目标">
          <el-option v-for="o in actionOptions" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.deep_action" style="width: 200px" clearable placeholder="深度优化目标">
          <el-option v-for="o in deepOptions" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.account_name" style="width: 240px" clearable placeholder="媒体账户">
          <el-option v-for="a in accounts" :key="a.id" :value="a.name">{{ a.name }}</el-option>
        </el-select>
        <el-select v-model="filters.goal" style="width: 180px" clearable placeholder="推广目的">
          <el-option value="销售线索投放">销售线索投放</el-option>
          <el-option value="小程序/小游戏">小程序/小游戏</el-option>
        </el-select>
        <el-select v-model="filters.delivery_mode" style="width: 180px" clearable placeholder="投放模式">
          <el-option value="MANUAL">手动投放</el-option>
          <el-option value="PROCEDURAL">自动投放（程序化）</el-option>
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" @click="load">查询</el-button>
          <el-button link type="primary" @click="resetFilters">清空</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table :data="list" row-key="id" border stripe style="margin-top: 12px">
        <el-table-column type="selection" :width="42" />
        <el-table-column label="状态" :width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '启用中' : '已停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="托管方案名称" prop="name" :min-width="220" />
        <el-table-column label="优化目标" prop="external_action" :width="120" />
        <el-table-column label="深度优化目标" prop="deep_action" :width="130" />
        <el-table-column label="深度优化方式" prop="deep_mode" :width="120" />
        <el-table-column label="媒体账户" prop="account_name" :min-width="220" />
        <el-table-column label="推广目的" prop="goal" :width="130" />
        <el-table-column label="投放模式" :width="150">
          <template #default="{ row }">{{ modeText(row.delivery_mode) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="created_at" :width="180" />
        <el-table-column label="操作" :width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="onDetail(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="onEdit(row)">编辑方案</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { autoApi, mediaApi } from '@/api/media';

const loading = ref(false);
const list = ref([]);
const accounts = ref([]);
const filters = reactive({ external_action: '', deep_action: '', account_name: '', goal: '', delivery_mode: '' });

const actionOptions = computed(() => [...new Set(list.value.map((a) => a.external_action))]);
const deepOptions = computed(() => [...new Set(list.value.map((a) => a.deep_action))]);

function modeText(m) {
  return m === 'PROCEDURAL' ? '自动投放（程序化）' : '手动投放';
}

async function load() {
  loading.value = true;
  try {
    const res = await autoApi.list();
    let rows = res.data?.list || [];
    if (filters.external_action) rows = rows.filter((r) => r.external_action === filters.external_action);
    if (filters.deep_action) rows = rows.filter((r) => r.deep_action === filters.deep_action);
    if (filters.account_name) rows = rows.filter((r) => r.account_name === filters.account_name);
    if (filters.goal) rows = rows.filter((r) => r.goal === filters.goal);
    if (filters.delivery_mode) rows = rows.filter((r) => r.delivery_mode === filters.delivery_mode);
    list.value = rows;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  Object.assign(filters, { external_action: '', deep_action: '', account_name: '', goal: '', delivery_mode: '' });
  load();
}

function onNewPlan() { ElMessage.info('原型：新建托管方案'); }
function onCustomColumn() { ElMessage.info('原型：自定义展示列'); }
function onDetail(record) { ElMessage.info(`原型：查看方案 ${record.name}`); }
function onEdit(record) { ElMessage.info(`原型：编辑托管方案 ${record.name}（不提交真实接口）`); }

onMounted(async () => {
  const acc = await mediaApi.accounts();
  accounts.value = acc.data?.list || [];
  load();
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.filter-card { padding-bottom: 4px; }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-actions { margin-left: auto; display: flex; gap: 12px; }
</style>
