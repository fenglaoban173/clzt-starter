<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <el-space wrap>
          <el-select v-model="dept" style="width: 150px" clearable placeholder="部门">
            <el-option v-for="d in deptOptions" :key="d" :value="d">{{ d }}</el-option>
          </el-select>
          <el-select v-model="optimizer" style="width: 150px" clearable placeholder="优化师">
            <el-option v-for="o in optimizerOptions" :key="o" :value="o">{{ o }}</el-option>
          </el-select>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">清空</el-button>
        </el-space>
        <el-button @click="onAdd">+ 添加账户</el-button>
      </div>

      <el-table :data="list" row-key="id" border stripe style="margin-top: 16px">
        <el-table-column label="广告主 ID" prop="advertiser_id" :width="160" />
        <el-table-column label="账户名称" prop="name" :width="220" />
        <el-table-column label="登录邮箱" prop="email" :width="170" />
        <el-table-column label="智投项目" prop="project" :width="130" />
        <el-table-column label="产品" prop="product" :width="120" />
        <el-table-column label="优化师" prop="optimizer" :width="100" />
        <el-table-column label="部门" prop="dept" :width="100" />
        <el-table-column label="状态" :width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'warning'">{{ row.status === 'normal' ? '正常' : '授权失效' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="授权时间" prop="created_at" :width="180" />
        <el-table-column label="操作" :width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onAssign(row)">分配优化师</el-button>
            <el-button size="small" @click="onDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { mediaApi } from '@/api/media';

const loading = ref(false);
const all = ref([]);
const list = ref([]);
const dept = ref('');
const optimizer = ref('');

const deptOptions = computed(() => [...new Set(all.value.map((a) => a.dept))]);
const optimizerOptions = computed(() => [...new Set(all.value.map((a) => a.optimizer))]);

async function load() {
  loading.value = true;
  try {
    const res = await mediaApi.accounts();
    all.value = res.data?.list || [];
    let rows = all.value;
    if (dept.value) rows = rows.filter((a) => a.dept === dept.value);
    if (optimizer.value) rows = rows.filter((a) => a.optimizer === optimizer.value);
    list.value = rows;
  } finally {
    loading.value = false;
  }
}

function reset() { dept.value = ''; optimizer.value = ''; load(); }
function onAdd() { ElMessage.info('原型：对接巨量 OAuth 添加账户'); }
function onAssign(record) { ElMessage.info(`原型：为 ${record.name} 分配优化师`); }
function onDetail(record) { ElMessage.info(`原型：查看账户 ${record.name}`); }

onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
</style>
