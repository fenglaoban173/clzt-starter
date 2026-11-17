<template>
  <div v-loading="loading" class="page">
    <div class="page-head">
      <div class="head-tip">近 15 天一键过审已为 40 条广告产出 54 个修复方案。<a class="tip-link">立即查看</a> <a class="tip-link">自动采纳</a></div>
      <div class="head-actions">
        <template v-if="isUpgrade">
          <el-button type="primary" @click="onNewBuild">批量新建</el-button>
          <el-button @click="onUseStrategy">使用已有策略新建</el-button>
        </template>
        <el-button v-else type="primary" @click="onNewBuild">{{ isUni ? '新建全域项目' : '新建智擎项目' }}</el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <template v-if="isUpgrade">
      <div class="filter-row">
        <el-input v-model="filters.keyword" style="width: 260px" placeholder="项目名称关键词" clearable @keyup.enter="load">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.project" style="width: 200px" clearable placeholder="创量项目">
          <el-option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</el-option>
        </el-select>
        <el-select v-model="filters.product" style="width: 200px" clearable placeholder="创量产品">
          <el-option v-for="p in productOptions" :key="p" :value="p">{{ p }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.optimizer" style="width: 200px" clearable placeholder="优化师">
          <el-option v-for="o in optimizerOptions" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.optGoal" style="width: 200px" clearable placeholder="优化目标">
          <el-option v-for="o in optGoals" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.deepGoal" style="width: 200px" clearable placeholder="深度优化目标">
          <el-option v-for="o in deepGoals" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.deepMode" style="width: 200px" clearable placeholder="深度优化方式">
          <el-option v-for="o in deepModes" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.subject" style="width: 200px" clearable placeholder="账户主体">
          <el-option :value="subject">{{ subject }}</el-option>
        </el-select>
        <el-select v-model="filters.account" style="width: 200px" clearable placeholder="媒体账户">
          <el-option v-for="a in accountOptions" :key="a" :value="a">{{ a }}</el-option>
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
        <el-select v-model="filters.status" style="width: 200px" clearable placeholder="状态">
          <el-option value="enabled">投放中</el-option>
          <el-option value="disabled">已暂停</el-option>
        </el-select>
        <div class="filter-actions"><el-button type="primary" @click="load">查询</el-button></div>
      </div>
      <div class="filter-row">
        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
        <el-select v-model="filters.adType" style="width: 200px" clearable placeholder="广告类型">
          <el-option value="ALL">信息流</el-option>
          <el-option value="SEARCH">搜索广告</el-option>
        </el-select>
        <el-select v-model="filters.star" style="width: 200px" clearable placeholder="星广联投">
          <el-option value="all">全部</el-option>
          <el-option value="yes">已联投</el-option>
          <el-option value="no">未联投</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-input v-model="filters.starTaskId" style="width: 260px" placeholder="星广联任务ID" clearable />
        <el-select v-model="filters.platform" style="width: 200px" clearable placeholder="平台">
          <el-option v-for="o in platforms" :key="o" :value="o">{{ o }}</el-option>
        </el-select>
        <el-select v-model="filters.material" style="width: 200px" clearable placeholder="创意素材">
          <el-option value="video">视频素材</el-option>
          <el-option value="image">图片素材</el-option>
        </el-select>
      </div>
      <div class="filter-row">
        <el-select v-model="filters.goods" style="width: 200px" clearable placeholder="关联商品">
          <el-option value="all">全部商品</el-option>
        </el-select>
        <el-button @click="onAddFilter">+ 添加筛选</el-button>
        <el-button link type="primary" @click="resetFilters">清空</el-button>
      </div>
      </template>

      <!-- 全域项目筛选 -->
      <template v-if="isUni">
        <div class="filter-row">
          <el-input v-model="filters.keyword" style="width: 220px" placeholder="项目名称关键词" clearable @keyup.enter="load">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filters.status" style="width: 180px" clearable placeholder="一级状态"><el-option value="enabled">投放中</el-option><el-option value="disabled">已暂停</el-option></el-select>
          <el-select style="width: 180px" clearable placeholder="二级状态"><el-option value="in_learning">学习中</el-option><el-option value="stable">稳定投放</el-option></el-select>
          <el-select style="width: 180px" clearable placeholder="变现方式"><el-option value="IAA">IAA</el-option><el-option value="IAP">IAP</el-option><el-option value="混合">混合变现</el-option></el-select>
          <el-select style="width: 180px" clearable placeholder="出海状态"><el-option value="domestic">境内</el-option><el-option value="oversea">出海</el-option></el-select>
        </div>
        <div class="filter-row">
          <el-select v-model="filters.account" style="width: 200px" clearable placeholder="账户"><el-option v-for="a in accountOptions" :key="a" :value="a">{{ a }}</el-option></el-select>
          <el-select v-model="filters.project" style="width: 200px" clearable placeholder="创量项目"><el-option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</el-option></el-select>
          <el-select v-model="filters.optimizer" style="width: 180px" clearable placeholder="优化师"><el-option v-for="o in optimizerOptions" :key="o" :value="o">{{ o }}</el-option></el-select>
          <el-select style="width: 180px" clearable placeholder="账户主体"><el-option :value="subject">{{ subject }}</el-option></el-select>
          <div class="filter-actions"><el-button type="primary" @click="load">查询</el-button></div>
        </div>
        <div class="filter-row">
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
          <el-select v-model="filters.goods" style="width: 200px" clearable placeholder="关联商品"><el-option value="all">全部商品</el-option></el-select>
          <el-button link type="primary" @click="resetFilters">清空</el-button>
        </div>
      </template>

      <!-- 智擎项目筛选 -->
      <template v-if="isOc">
        <div class="filter-row">
          <el-input v-model="filters.keyword" style="width: 220px" placeholder="项目名称关键词" clearable @keyup.enter="load">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filters.account" style="width: 200px" clearable placeholder="媒体账户"><el-option v-for="a in accountOptions" :key="a" :value="a">{{ a }}</el-option></el-select>
          <el-select v-model="filters.status" style="width: 160px" clearable placeholder="一级状态"><el-option value="enabled">投放中</el-option><el-option value="disabled">已暂停</el-option></el-select>
          <el-select style="width: 160px" clearable placeholder="二级状态"><el-option value="in_learning">学习中</el-option><el-option value="stable">稳定投放</el-option></el-select>
          <el-select style="width: 160px" clearable placeholder="项目类型"><el-option value="MANUAL">手动投放</el-option><el-option value="PROCEDURAL">程序化投放</el-option></el-select>
        </div>
        <div class="filter-row">
          <el-select style="width: 160px" clearable placeholder="营销场景"><el-option>短视频带货</el-option><el-option>应用推广</el-option><el-option>直播间引流</el-option></el-select>
          <el-select v-model="filters.purpose" style="width: 160px" clearable placeholder="推广目的"><el-option v-for="o in purposes" :key="o" :value="o">{{ o }}</el-option></el-select>
          <el-select v-model="filters.project" style="width: 180px" clearable placeholder="创量项目"><el-option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</el-option></el-select>
          <el-select v-model="filters.optimizer" style="width: 160px" clearable placeholder="优化师"><el-option v-for="o in optimizerOptions" :key="o" :value="o">{{ o }}</el-option></el-select>
          <el-select style="width: 160px" clearable placeholder="账户主体"><el-option :value="subject">{{ subject }}</el-option></el-select>
        </div>
        <div class="filter-row">
          <el-select v-model="filters.optGoal" style="width: 160px" clearable placeholder="优化目标"><el-option v-for="o in optGoals" :key="o" :value="o">{{ o }}</el-option></el-select>
          <el-select v-model="filters.deepGoal" style="width: 160px" clearable placeholder="深度优化目标"><el-option v-for="o in deepGoals" :key="o" :value="o">{{ o }}</el-option></el-select>
          <el-select v-model="filters.deepMode" style="width: 160px" clearable placeholder="深度优化方式"><el-option v-for="o in deepModes" :key="o" :value="o">{{ o }}</el-option></el-select>
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
          <el-select v-model="filters.goods" style="width: 160px" clearable placeholder="关联商品"><el-option value="all">全部商品</el-option></el-select>
          <div class="filter-actions"><el-button type="primary" @click="load">查询</el-button><el-button link type="primary" @click="resetFilters">清空</el-button></div>
        </div>
      </template>
    </el-card>

    <el-card class="table-card">
      <div class="op-row">
        <el-space>
          <el-button v-if="isUpgrade" @click="onCombineFilter">组合筛选</el-button>
          <el-select v-model="batchOp" style="width: 130px" placeholder="批量操作" disabled>
            <el-option value="enable">批量启用</el-option>
            <el-option value="disable">批量暂停</el-option>
          </el-select>
          <el-button v-if="!isUpgrade" @click="onAppendMaterial">批量追加素材</el-button>
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
        <el-table-column label="项目名称" prop="name" :min-width="200" fixed="left" />

        <!-- 标准列 -->
        <template v-if="isUpgrade">
          <el-table-column label="任务状态" :width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '投放中' : '已暂停' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="消耗" prop="stat_cost" :width="100" align="right" />
          <el-table-column label="计费当日付费ROI" prop="pay_roi" :width="130" align="right" />
          <el-table-column label="小程序/小游戏当日变现ROI" prop="game_roi" :width="150" align="right" />
          <el-table-column label="平均千次展现费用" prop="cpm" :width="130" align="right" />
          <el-table-column label="平均点击单价" prop="cpc" :width="110" align="right" />
          <el-table-column label="深度转化出价（元）" prop="deep_bid" :width="130" align="right" />
          <el-table-column label="项目预算（元）" prop="budget" :width="120" align="right" />
          <el-table-column label="创建时间" prop="created_at" :width="170" />
          <el-table-column label="项目出价（元）" prop="bid" :width="110" align="right" />
          <el-table-column label="展示数" prop="show_cnt" :width="100" align="right" />
          <el-table-column label="点击数" prop="click_cnt" :width="100" align="right" />
          <el-table-column label="点击率" prop="ctr" :width="90" align="right" />
          <el-table-column label="转化数" prop="convert_cnt" :width="90" align="right" />
          <el-table-column label="转化成本" prop="convert_cost" :width="100" align="right" />
          <el-table-column label="转化率" prop="convert_rate" :width="90" align="right" />
          <el-table-column label="深度转化数" prop="deep_cnt" :width="100" align="right" />
          <el-table-column label="深度转化成本" prop="deep_cost" :width="110" align="right" />
          <el-table-column label="深度转化率" prop="deep_rate" :width="100" align="right" />
          <el-table-column label="项目" prop="campaign_id" :width="140" />
        </template>

        <!-- 全域项目列 -->
        <template v-else-if="isUni">
          <el-table-column label="项目状态" :width="100">
            <template #default="{ row }"><el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '投放中' : '已暂停' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="项目预算（元）" prop="budget" :width="120" align="right" />
          <el-table-column label="全域消耗" prop="uni_cost" :width="110" align="right" />
          <el-table-column label="全域GMV" prop="gmv" :width="110" align="right" />
          <el-table-column label="全域ROI" prop="uni_roi" :width="100" align="right" />
          <el-table-column label="变现金额" prop="monetize_amount" :width="110" align="right" />
          <el-table-column label="付费金额" prop="pay_amount" :width="110" align="right" />
          <el-table-column label="全域收入" prop="uni_income" :width="110" align="right" />
          <el-table-column label="付费收入" prop="pay_income" :width="110" align="right" />
          <el-table-column label="变现收入" prop="monetize_income" :width="110" align="right" />
        </template>

        <!-- 智擎项目列 -->
        <template v-else>
          <el-table-column label="启停" :width="80">
            <template #default="{ row }"><el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '启用' : '暂停' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="账户" prop="account_name" :min-width="180" />
          <el-table-column label="项目状态" :width="100">
            <template #default="{ row }"><el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === 'enabled' ? '投放中' : '已暂停' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="推广目的" prop="purpose" :width="110" />
          <el-table-column label="项目类型" prop="type" :width="110" />
          <el-table-column label="营销场景" prop="scene" :width="110" />
          <el-table-column label="项目预算（元）" prop="budget" :width="120" align="right" />
          <el-table-column label="优化目标" prop="goal" :width="100" />
          <el-table-column label="消耗" prop="stat_cost" :width="100" align="right" />
          <el-table-column label="展示数" prop="show_cnt" :width="100" align="right" />
        </template>

        <el-table-column label="操作" :width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onDetail(row)">查看</el-button>
            <el-button size="small" @click="onToggle(row)">{{ row.status === 'enabled' ? '暂停' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { buildApi } from '@/api/media';

const route = useRoute();
const router = useRouter();
const media = computed(() => route.query.media || 'upgrade');
const isUpgrade = computed(() => media.value === 'upgrade');
const isUni = computed(() => media.value === 'uni');
const isOc = computed(() => media.value === 'oc');

const loading = ref(false);
const all = ref([]);
const list = ref([]);
const selected = ref([]);
const batchOp = ref('');
const page = ref(1);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const subject = '北京央广时代文化传播有限公司';

const filters = reactive({
  keyword: '', project: '', product: '', optimizer: '', optGoal: '', deepGoal: '', deepMode: '',
  subject: '', account: '', purpose: '', deliveryMode: '', status: '', dateRange: [], adType: '',
  star: '', starTaskId: '', platform: '', material: '', goods: '',
});

const optGoals = ['销售线索', '商品购买', '表单提交', 'APP下载', '小程序付费'];
const deepGoals = ['付费', '下单', '激活', '注册', '表单提交'];
const deepModes = ['深度出价', '付费ROI', '转化出价'];
const purposes = ['APP推广', '网页推广', '小程序推广', '小游戏推广'];
const platforms = ['抖音', '穿山甲', '西瓜视频', '今日头条'];

const projectOptions = computed(() => [...new Set(all.value.map((p) => p.project || '未分组'))]);
const productOptions = computed(() => [...new Set(all.value.map((p) => p.product || '全部产品'))]);
const optimizerOptions = computed(() => [...new Set(all.value.map((p) => p.optimizer || '全部'))]);
const accountOptions = computed(() => [...new Set(all.value.map((p) => p.account_name))]);

function applyFilter() {
  let rows = all.value;
  if (filters.status) rows = rows.filter((p) => p.status === filters.status);
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(kw) || (p.account_name || '').toLowerCase().includes(kw));
  }
  if (filters.account) rows = rows.filter((p) => p.account_name === filters.account);
  return rows;
}

async function load() {
  loading.value = true;
  try {
    const res = await buildApi.projects({ status: filters.status, media: media.value });
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

function onNewBuild() { router.push({ name: 'build-create', query: { media: media.value } }); }
function onUseStrategy() { router.push({ name: 'build-create', query: { media: media.value, tab: 'strategy' } }); }
function onAppendMaterial() { ElMessage.info('原型：批量追加创意素材到所选项目'); }
function onCombineFilter() { ElMessage.info('原型：打开组合筛选条件'); }
function onAddFilter() { ElMessage.info('原型：添加更多筛选项'); }
function onSync() { ElMessage.info('原型：手动同步巨量项目数据'); }
function onExport() { ElMessage.info('原型：导出项目报表'); }
function onCustomMetric() { ElMessage.info('原型：自定义展示指标列'); }
function onDetail(record) { ElMessage.info(`原型：查看项目 ${record.name}`); }
function onToggle(record) { ElMessage.info(`原型：${record.status === 'enabled' ? '暂停' : '启用'}项目（不提交真实接口）`); }

onMounted(load);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.head-tip { font-size: 13px; color: #86909c; }
.tip-link { color: #2563eb; margin: 0 4px; cursor: pointer; }
.filter-card { padding-bottom: 4px; }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.filter-actions { margin-left: auto; }
.op-row { display: flex; justify-content: space-between; align-items: center; }
</style>
