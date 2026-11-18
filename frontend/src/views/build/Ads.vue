<template>
  <div v-loading="loading" class="page">
    <el-card class="filter-card">
      <div class="filter-row">
        <el-input v-model="filters.keyword" style="width: 260px" placeholder="广告名称关键词" clearable @keyup.enter="load">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.project" style="width: 200px" clearable placeholder="智投项目">
          <el-option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.optimizer" style="width: 200px" clearable placeholder="优化师">
          <el-option v-for="o in optimizerOptions" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.account" style="width: 200px" clearable placeholder="媒体账户">
          <el-option v-for="a in accountOptions" :key="a" :value="a">{{ a }}</el-option>
        </el-select>
        <el-select v-model="filters.subject" style="width: 200px" clearable placeholder="账户主体">
          <el-option :value="subject">{{ subject }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.purpose" style="width: 200px" clearable placeholder="推广目的">
          <el-option v-for="o in purposes" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.deliveryMode" style="width: 200px" clearable placeholder="投放模式">
          <el-option value="MANUAL">手动投放</el-option>
          <el-option value="PROCEDURAL">程序化投放</el-option>
        </el-select>
        <el-select v-model="filters.campaign" style="width: 200px" clearable placeholder="项目">
          <el-option v-for="c in campaignOptions" :key="c" :value="c">{{ c }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.status" style="width: 200px" clearable placeholder="状态">
          <el-option value="enabled">投放中</el-option>
          <el-option value="disabled">已暂停</el-option>
        </el-select>
        <el-select v-model="filters.diagnosis" style="width: 200px" clearable placeholder="诊断建议">
          <el-option value="all">不限</el-option>
          <el-option value="reject">有拒绝建议</el-option>
          <el-option value="low">低质素材</el-option>
        </el-select>
        <el-select v-model="filters.strategy" style="width: 200px" clearable placeholder="策略组">
          <el-option value="all">不限</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.adType" style="width: 200px" clearable placeholder="广告类型">
          <el-option value="ALL">信息流</el-option>
          <el-option value="SEARCH">搜索广告</el-option>
        </el-select>
        <el-select v-model="filters.learn" style="width: 200px" clearable placeholder="学习期状态">
          <el-option value="all">不限</el-option>
          <el-option value="learning">学习中</el-option>
          <el-option value="passed">已过学习期</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.star" style="width: 200px" clearable placeholder="星广联投">
          <el-option value="all">全部</el-option>
          <el-option value="yes">已联投</el-option>
          <el-option value="no">未联投</el-option>
        </el-select>
        <el-input v-model="filters.starTaskId" style="width: 260px" placeholder="星广联任务ID" clearable />
        <el-select v-model="filters.platform" style="width: 200px" clearable placeholder="平台">
          <el-option v-for="o in platforms" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.optGoal" style="width: 200px" clearable placeholder="优化目标">
          <el-option v-for="o in optGoals" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.deepGoal" style="width: 200px" clearable placeholder="深度优化目标">
          <el-option v-for="o in deepGoals" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.deepMode" style="width: 200px" clearable placeholder="深度优化方式">
          <el-option v-for="o in deepModes" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.material" style="width: 200px" clearable placeholder="创意素材">
          <el-option value="video">视频素材</el-option>
          <el-option value="image">图片素材</el-option>
        </el-select>
        <el-button @click="onAddFilter">+ 添加筛选</el-button>
        <el-button link type="primary" @click="resetFilters">清空</el-button>
        <div class="filter-actions"><el-button type="primary" @click="load">查询</el-button></div>
      </div>
    </el-card>

    <el-card class="table-card">
      <div class="op-row">
        <el-space>
          <el-select v-model="batchOp" style="width: 130px" placeholder="批量操作" disabled>
            <el-option value="enable">批量启用</el-option>
            <el-option value="disable">批量暂停</el-option>
          </el-select>
          <el-button @click="onCopy">快捷复制</el-button>
        </el-space>
        <el-space>
          <el-button @click="onSync">手动同步</el-button>
          <el-button @click="onExport">导出数据</el-button>
          <el-button @click="onCustomMetric">自定义指标</el-button>
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
        <el-table-column label="任务名称" prop="name" :min-width="220" fixed="left" />
        <el-table-column label="任务状态" :width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '投放中' : '已暂停' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="广告预算（元）" prop="budget" :width="120" align="right" />
        <el-table-column label="拒绝建议" :width="120">
          <template #default="{ row }">
            <el-tooltip v-if="row.reject_note" :content="row.reject_note" placement="top">
              <el-tag type="danger">有拒绝建议</el-tag>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="广告出价（元）" prop="bid" :width="110" align="right" />
        <el-table-column label="深度转化出价（元）" prop="deep_bid" :width="130" align="right" />
        <el-table-column label="消耗" prop="stat_cost" :width="100" align="right" />
        <el-table-column label="展示数" prop="show_cnt" :width="100" align="right" />
        <el-table-column label="平均千次展现费用" prop="cpm" :width="130" align="right" />
        <el-table-column label="点击数" prop="click_cnt" :width="100" align="right" />
        <el-table-column label="点击率" prop="ctr" :width="90" align="right" />
        <el-table-column label="转化数" prop="convert_cnt" :width="90" align="right" />
        <el-table-column label="转化成本" prop="convert_cost" :width="100" align="right" />
        <el-table-column label="转化率" prop="convert_rate" :width="90" align="right" />
        <el-table-column label="深度转化数" prop="deep_cnt" :width="100" align="right" />
        <el-table-column label="深度转化成本" prop="deep_cost" :width="110" align="right" />
        <el-table-column label="深度转化率" prop="deep_rate" :width="100" align="right" />
        <el-table-column label="广告" prop="ad_id" :width="140" />
        <el-table-column label="操作" :width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onDetail(row)">查看</el-button>
            <el-button size="small" @click="onCopyOne(row)">快捷复制</el-button>
            <el-button size="small" @click="onToggle(row)">{{ row.status === 'enabled' ? '暂停' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { buildApi } from '@/api/media';

const loading = ref(false);
const all = ref([]);
const list = ref([]);
const selected = ref([]);
const batchOp = ref('');
const page = ref(1);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const subject = '北京央广时代文化传播有限公司';

const filters = reactive({
  keyword: '', project: '', optimizer: '', account: '', subject: '', purpose: '',
  deliveryMode: '', campaign: '', status: '', diagnosis: '', strategy: '',
  adType: '', learn: '', star: '', starTaskId: '', platform: '', optGoal: '', deepGoal: '',
  deepMode: '', material: '',
});

const optGoals = ['销售线索', '商品购买', '表单提交', 'APP下载', '小程序付费'];
const deepGoals = ['付费', '下单', '激活', '注册', '表单提交'];
const deepModes = ['深度出价', '付费ROI', '转化出价'];
const purposes = ['APP推广', '网页推广', '小程序推广', '小游戏推广'];
const platforms = ['抖音', '穿山甲', '西瓜视频', '今日头条'];

const projectOptions = computed(() => [...new Set(all.value.map((a) => a.project || '未分组'))]);
const optimizerOptions = computed(() => [...new Set(all.value.map((a) => a.optimizer || '全部'))]);
const accountOptions = computed(() => [...new Set(all.value.map((a) => a.account_name))]);
const campaignOptions = computed(() => [...new Set(all.value.map((a) => a.campaign_id))]);

function applyFilter() {
  let rows = all.value;
  if (filters.status) rows = rows.filter((a) => a.status === filters.status);
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    rows = rows.filter((a) => a.name.toLowerCase().includes(kw) || (a.account_name || '').toLowerCase().includes(kw));
  }
  if (filters.account) rows = rows.filter((a) => a.account_name === filters.account);
  return rows;
}

async function load() {
  loading.value = true;
  try {
    const res = await buildApi.ads({ status: filters.status });
    all.value = res.data?.list || [];
    const rows = applyFilter();
    list.value = rows.slice((page.value - 1) * pagination.pageSize, page.value * pagination.pageSize);
    pagination.total = rows.length;
  } finally {
    loading.value = false;
  }
}

function onPage(p) { page.value = p; load(); }
function resetFilters() {
  Object.keys(filters).forEach((k) => { filters[k] = Array.isArray(filters[k]) ? [] : ''; });
  page.value = 1;
  load();
}

function onAddFilter() { ElMessage.info('原型：添加更多筛选项'); }
function onCopy() { ElMessage.info('原型：批量快捷复制所选广告'); }
function onCopyOne(record) { ElMessage.info(`原型：复制广告 ${record.name}`); }
function onSync() { ElMessage.info('原型：手动同步巨量广告数据'); }
function onExport() { ElMessage.info('原型：导出广告报表'); }
function onCustomMetric() { ElMessage.info('原型：自定义展示指标列'); }
function onDetail(record) { ElMessage.info(`原型：查看广告 ${record.name}`); }
function onToggle(record) { ElMessage.info(`原型：${record.status === 'enabled' ? '暂停' : '启用'}广告（不提交真实接口）`); }

onMounted(load);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.filter-card { padding-bottom: 4px; }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.filter-actions { margin-left: auto; }
.op-row { display: flex; justify-content: space-between; align-items: center; }
</style>
