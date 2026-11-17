<template>
  <div v-loading="loading">
    <el-card>
      <div class="toolbar">
        <el-tabs v-model="dim" type="card" @change="onDimChange">
          <el-tab-pane label="账户报表" name="account" />
          <el-tab-pane label="项目报表" name="project" />
          <el-tab-pane label="广告报表" name="ad" />
          <el-tab-pane label="素材报表" name="material" />
          <el-tab-pane label="组件报表" name="component" />
        </el-tabs>
        <el-space>
          <el-radio-group v-model="period" size="small">
            <el-radio-button value="days">分日</el-radio-button>
            <el-radio-button value="months">分月</el-radio-button>
            <el-radio-button value="sum">汇总</el-radio-button>
          </el-radio-group>
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" style="width: 260px" />
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="onCreateTask" :loading="taskCreating">导出异步报表</el-button>
        </el-space>
      </div>
      <div class="filter-line">
        <span class="line-label">媒体：</span>
        <el-radio-group v-model="media" size="small">
          <el-radio-button value="aggregate">不限</el-radio-button>
          <el-radio-button value="toutiao_upgrade">巨量广告</el-radio-button>
          <el-radio-button value="toutiao_uni">巨量广告·全域</el-radio-button>
          <el-radio-button value="toutiao_oc">巨量广告·智擎</el-radio-button>
          <el-radio-button value="gdt_upgrade">腾讯广告3.0</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-line">
        <span class="line-label">数据维度：</span>
        <el-radio-group v-model="dimension" size="small">
          <el-radio-button value="advertiser_id">账户</el-radio-button>
          <el-radio-button value="owner_user_id">优化师</el-radio-button>
          <el-radio-button value="media">媒体</el-radio-button>
          <el-radio-button value="project">创量项目</el-radio-button>
          <el-radio-button value="partner">合作商</el-radio-button>
          <el-radio-button value="dept">部门</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filters">
        <el-space wrap>
          <el-select v-if="dim === 'account'" v-model="accountIds" multiple collapse-tags collapse-tags-tooltip style="width: 300px" placeholder="选择账户">
            <el-option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</el-option>
          </el-select>
        </el-space>
      </div>

      <el-alert v-if="taskInfo" type="info" style="margin-top: 12px" :closable="false" :title="`异步任务已创建：任务 ID ${taskInfo.task_id}，状态 ${taskInfo.task_status || 'CREATED'}。大历史数据可在稍后刷新轮询结果。`" />

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="6"><div class="stat-card"><div class="stat-title">总消耗</div><div class="stat-value">{{ totals.stat_cost.toFixed(2) }}</div></div></el-col>
        <el-col :span="6"><div class="stat-card"><div class="stat-title">展示次数</div><div class="stat-value">{{ totals.show_cnt }}</div></div></el-col>
        <el-col :span="6"><div class="stat-card"><div class="stat-title">点击次数</div><div class="stat-value">{{ totals.click_cnt }}</div></div></el-col>
        <el-col :span="6"><div class="stat-card"><div class="stat-title">转化数</div><div class="stat-value">{{ totals.convert_cnt }}</div></div></el-col>
      </el-row>

      <el-table :data="rows" border stripe style="margin-top: 16px">
        <template v-if="dim === 'account'">
          <el-table-column label="账户" prop="account_name" :min-width="200" />
          <el-table-column label="消耗" prop="stat_cost" align="right" />
          <el-table-column label="展示" prop="show_cnt" align="right" />
          <el-table-column label="点击" prop="click_cnt" align="right" />
          <el-table-column label="点击率" align="right"><template #default="{ row }">{{ row.ctr }}%</template></el-table-column>
          <el-table-column label="转化" prop="convert_cnt" align="right" />
          <el-table-column label="转化成本" prop="convert_cost" align="right" />
        </template>
        <template v-else-if="dim === 'project'">
          <el-table-column label="项目名称" prop="name" :min-width="200" />
          <el-table-column label="账户" prop="account_name" :min-width="180" />
          <el-table-column label="项目 ID" prop="campaign_id" />
          <el-table-column label="消耗" prop="stat_cost" align="right" />
          <el-table-column label="展示" prop="show_cnt" align="right" />
          <el-table-column label="点击" prop="click_cnt" align="right" />
          <el-table-column label="点击率" align="right"><template #default="{ row }">{{ row.ctr }}%</template></el-table-column>
          <el-table-column label="转化" prop="convert_cnt" align="right" />
          <el-table-column label="转化成本" prop="convert_cost" align="right" />
        </template>
        <template v-else-if="dim === 'ad'">
          <el-table-column label="广告名称" prop="name" :min-width="220" />
          <el-table-column label="账户" prop="account_name" :min-width="180" />
          <el-table-column label="广告 ID" prop="ad_id" />
          <el-table-column label="消耗" prop="stat_cost" align="right" />
          <el-table-column label="展示" prop="show_cnt" align="right" />
          <el-table-column label="点击" prop="click_cnt" align="right" />
          <el-table-column label="点击率" align="right"><template #default="{ row }">{{ row.ctr }}%</template></el-table-column>
          <el-table-column label="转化" prop="convert_cnt" align="right" />
          <el-table-column label="转化成本" prop="convert_cost" align="right" />
        </template>
        <template v-else-if="dim === 'material'">
          <el-table-column label="素材 ID" prop="material_id" />
          <el-table-column label="素材名称" prop="title" :min-width="200" />
          <el-table-column label="消耗" prop="stat_cost" align="right" />
          <el-table-column label="展示" prop="show_cnt" align="right" />
          <el-table-column label="点击" prop="click_cnt" align="right" />
          <el-table-column label="转化" prop="convert_cnt" align="right" />
        </template>
        <template v-else-if="dim === 'component'">
          <el-table-column label="组件名称" prop="title" :min-width="200" />
          <el-table-column label="组件类型" prop="comp_type" />
          <el-table-column label="消耗" prop="stat_cost" align="right" />
          <el-table-column label="展示" prop="show_cnt" align="right" />
          <el-table-column label="点击" prop="click_cnt" align="right" />
          <el-table-column label="转化" prop="convert_cnt" align="right" />
        </template>
      </el-table>
    </el-card>

    <el-card v-if="dim === 'account' || dim === 'material'" title="素材消耗排行" style="margin-top: 16px">
      <el-table :data="ranking" border stripe>
        <el-table-column label="素材 ID" prop="material_id" />
        <el-table-column label="消耗" prop="stat_cost" align="right" />
        <el-table-column label="展示" prop="show_cnt" align="right" />
        <el-table-column label="点击" prop="click_cnt" align="right" />
        <el-table-column label="转化" prop="convert_cnt" align="right" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { reportApi, mediaApi } from '@/api/media';

const route = useRoute();
const REPORT_TABS = ['account', 'project', 'ad', 'material', 'component'];

const loading = ref(false);
const taskCreating = ref(false);
const taskInfo = ref(null);
const accounts = ref([]);
const accountIds = ref([]);
const dim = ref(REPORT_TABS.includes(route.query.tab) ? route.query.tab : 'account');
const dateRange = ref(defaultRange());
const period = ref('sum');
const media = ref('aggregate');
const dimension = ref('advertiser_id');

function defaultRange() {
  const end = new Date();
  const start = new Date(Date.now() - 6 * 86400000);
  const fmt = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  return [fmt(start), fmt(end)];
}

const rows = ref([]);
const ranking = ref([]);
const totals = reactive({ stat_cost: 0, show_cnt: 0, click_cnt: 0, convert_cnt: 0 });

function dates() {
  const [s, e] = dateRange.value || [];
  const fmt = (d) => {
    if (!d) return null;
    if (typeof d === 'string') return d.slice(0, 10);
    const dt = d instanceof Date ? d : (typeof d.toDate === 'function' ? d.toDate() : new Date(d));
    const p = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  };
  return [fmt(s) || defaultRange()[0], fmt(e) || defaultRange()[1]];
}

async function load() {
  loading.value = true;
  try {
    let summary;
    if (dim.value === 'account') {
      summary = await reportApi.accountSummary({ account_ids: accountIds.value.join(',') });
    } else {
      summary = await reportApi.dimensionReport(dim.value);
    }
    rows.value = summary.data?.rows || [];
    Object.assign(totals, summary.data?.totals || { stat_cost: 0, show_cnt: 0, click_cnt: 0, convert_cnt: 0 });

    const rank = await reportApi.materialRanking();
    ranking.value = rank.data?.rows || [];
  } finally {
    loading.value = false;
  }
}

function onDimChange() {
  load();
}

async function onCreateTask() {
  taskCreating.value = true;
  try {
    const [start, end] = dates();
    const res = await reportApi.createAsyncTask({
      account_id: accountIds.value[0],
      task_name: `${dim.value}_报表_${start}_${end}`,
      query: { start_time: start, end_time: end, data_topic: 'BASIC_DATA' },
    });
    taskInfo.value = res.data || null;
    ElMessage.success('异步报表任务已提交（原型模拟）');
  } finally {
    taskCreating.value = false;
  }
}

onMounted(async () => {
  const acc = await mediaApi.accounts();
  accounts.value = acc.data?.list || [];
  accountIds.value = accounts.value.map((a) => a.id);
  load();
});
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.filters { margin-top: 12px; }
.filter-line { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.line-label { font-size: 13px; color: #4e5969; white-space: nowrap; }
.stat-card { padding: 20px 24px; background: #f7f8fa; border-radius: 8px; }
.stat-title { color: #86909c; font-size: 13px; }
.stat-value { margin-top: 8px; font-size: 28px; font-weight: 600; color: #1d2129; }
</style>
