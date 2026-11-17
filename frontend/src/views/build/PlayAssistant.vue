<template>
  <div v-loading="loading" class="page">
    <div class="page-head">
      <div class="head-tip"></div>
      <div class="head-actions">
        <el-button type="primary" @click="onNewBuild">批量新建</el-button>
        <el-button @click="onUseStrategy">使用已有策略新建</el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filter-row">
        <el-input v-model="filters.keyword" style="width: 260px" placeholder="规则名称关键词" clearable @keyup.enter="load">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.account_name" style="width: 220px" clearable placeholder="媒体账户">
          <el-option v-for="a in accounts" :key="a.id" :value="a.name">{{ a.name }}</el-option>
        </el-select>
        <el-select v-model="filters.creator" style="width: 200px" clearable placeholder="创建者">
          <el-option v-for="c in creatorOptions" :key="c" :value="c">{{ c }}</el-option>
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" @click="load">查询</el-button>
          <el-button link type="primary" @click="resetFilters">清空</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <div class="op-row">
        <el-space>
          <el-select v-model="batchOp" style="width: 130px" placeholder="批量操作" :disabled="!selected.length">
            <el-option value="enable">批量启用</el-option>
            <el-option value="disable">批量停用</el-option>
          </el-select>
          <el-button type="primary" @click="onNewRule">新建铺剧规则</el-button>
        </el-space>
        <el-space>
          <el-button @click="onCustomColumn">自定义列</el-button>
        </el-space>
      </div>

      <el-table
        :data="list"
        row-key="id"
        border
        stripe
        style="margin-top: 12px"
        @selection-change="(k) => (selected = k)"
      >
        <el-table-column type="selection" :width="42" />
        <el-table-column label="状态" :width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="规则名称" prop="name" :min-width="200" />
        <el-table-column label="操作" :width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="onDetail(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="onEdit(row)">编辑规则</el-button>
          </template>
        </el-table-column>
        <el-table-column label="执行规则" prop="rule" :min-width="260" />
        <el-table-column label="近一次执行结果" prop="last_result" :width="150" />
        <el-table-column label="描述" prop="desc" :min-width="240" />
        <el-table-column label="有效期" prop="expire" :width="110" />
        <el-table-column label="账户" prop="account_name" :min-width="220" />
        <el-table-column label="创建者" prop="creator" :width="100" />
        <el-table-column label="更新人" prop="updater" :width="100" />
        <el-table-column label="更新时间" prop="updated_at" :width="180" />
      </el-table>

      <el-pagination class="pager" layout="total, sizes, prev, pager, next, jumper" :total="list.length" :page-size="20" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { dramaApi, mediaApi } from '@/api/media';

const route = useRoute();
const router = useRouter();
const media = computed(() => route.query.media || 'upgrade');

const loading = ref(false);
const list = ref([]);
const accounts = ref([]);
const selected = ref([]);
const batchOp = ref('');
const filters = reactive({ keyword: '', account_name: '', creator: '' });

const creatorOptions = computed(() => [...new Set(list.value.map((d) => d.creator))]);

async function load() {
  loading.value = true;
  try {
    const res = await dramaApi.list();
    let rows = res.data?.list || [];
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(kw));
    }
    if (filters.account_name) rows = rows.filter((r) => r.account_name === filters.account_name);
    if (filters.creator) rows = rows.filter((r) => r.creator === filters.creator);
    list.value = rows;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  Object.assign(filters, { keyword: '', account_name: '', creator: '' });
  load();
}

function onNewBuild() { router.push({ name: 'build-create', query: { media: media.value } }); }
function onUseStrategy() { router.push({ name: 'build-create', query: { media: media.value, tab: 'strategy' } }); }
function onBatch() { ElMessage.info('原型：批量启用/停用所选规则'); }
function onNewRule() { ElMessage.info('原型：新建铺剧规则'); }
function onCustomColumn() { ElMessage.info('原型：自定义展示列'); }
function onDetail(record) { ElMessage.info(`原型：查看规则 ${record.name}`); }
function onEdit(record) { ElMessage.info(`原型：编辑铺剧规则 ${record.name}（不提交真实接口）`); }

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
.op-row { display: flex; justify-content: space-between; align-items: center; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
