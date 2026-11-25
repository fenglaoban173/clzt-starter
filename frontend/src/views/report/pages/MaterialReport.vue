<template>
  <ReportPageShell
    v-model:period="period"
    v-model:date-range="dateRange"
    v-model:media="media"
    title=""
    :periods="PERIODS"
    :show-filter="false"
  >
    <!-- ============ 二级页签（今日数据 / 历史数据） ============ -->
    <template #subtabs>
      <div class="report-subtabs">
        <span
          class="report-subtab"
          :class="{ active: subTab === 'today' }"
          @click="onSubTab('today')"
        >今日数据</span>
        <span
          class="report-subtab"
          :class="{ active: subTab === 'history' }"
          @click="onSubTab('history')"
        >历史数据</span>
      </div>
    </template>

    <!-- ============ 筛选区（.report-filter） ============ -->
    <template #before-filter>
      <div class="report-filter">
        <!-- 媒体 -->
        <ReportFilterRow
          label="媒体："
          :collapse-text="collapsed ? '展开筛选配置' : '收起筛选配置'"
          @toggle-collapse="collapsed = !collapsed"
        >
          <el-radio-group v-model="media" class="report-radio-group" size="small">
            <el-radio-button v-for="m in MEDIA_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </el-radio-button>
          </el-radio-group>
        </ReportFilterRow>

        <!-- 数据维度（收起筛选配置后仍保留 —— 线上只收起「筛选维度」「数据筛选」两行） -->
        <ReportFilterRow label="数据维度：">
          <el-radio-group v-model="dimension" class="report-radio-group" size="small">
            <el-radio-button v-for="d in DIM_MATERIAL" :key="d" :value="d">{{ d }}</el-radio-button>
          </el-radio-group>

          <!-- 预计每日更新时间提示 -->
          <el-popover placement="right" :width="288" trigger="click">
            <template #reference>
              <span class="report-tip filter-tip">
                预计每日更新时间9:45
                <el-icon class="tip-help"><QuestionFilled /></el-icon>
              </span>
            </template>
            {{ TIP_UPDATE_TIME }}
          </el-popover>
        </ReportFilterRow>

        <!-- 筛选维度（收起筛选配置后整行隐藏 —— 与线上一致） -->
        <ReportFilterRow v-if="!collapsed" label="筛选维度：">
          <div class="filter-fields">
            <!-- 素材名称：类型下拉 + 关键词输入框 -->
            <div class="material-search-box">
              <el-select v-model="materialType" size="small" class="material-type-select">
                <el-option label="素材名称" value="name" />
                <el-option label="素材ID" value="id" />
              </el-select>
              <el-input
                v-model="keyword"
                size="small"
                :placeholder="materialType === 'id' ? '请输入素材ID' : '请输入素材名称'"
                :suffix-icon="Search"
              />
            </div>

            <!-- 「素材目录」带「温馨提示」浮层（线上：鼠标移入该下拉即弹出） -->
            <template v-for="s in selects" :key="s.key">
              <el-popover
                v-if="s.key === 'directory'"
                placement="bottom-start"
                :width="280"
                trigger="hover"
              >
                <template #reference>
                  <div :class="{ 'select-account': s.key === 'account' }">
                    <ReportFilterSelect
                      v-model="s.model"
                      :label="s.label"
                      :placeholder="s.placeholder"
                      :options="s.options"
                      :wide="s.wide"
                    />
                  </div>
                </template>
                <div class="tips-title">{{ TIP_WARM_NOTICE_TITLE }}</div>
                <p v-for="line in TIP_WARM_NOTICE_LINES" :key="line" class="tips-line">{{ line }}</p>
              </el-popover>

              <div
                v-else
                :class="{ 'select-account': s.key === 'account' }"
              >
                <ReportFilterSelect
                  v-model="s.model"
                  :label="s.label"
                  :placeholder="s.placeholder"
                  :options="s.options"
                  :wide="s.wide"
                />
              </div>
            </template>

            <el-popover
              v-model:visible="addFilterVisible"
              placement="bottom-start"
              :width="190"
              trigger="click"
            >
              <template #reference>
                <button class="report-add-filter" type="button">+ 添加筛选</button>
              </template>
              <div class="add-filter-menu">
                <div
                  v-for="d in ADD_FILTER_OPTIONS"
                  :key="d"
                  class="add-filter-item"
                  @click="onAddFilter(d)"
                >
                  {{ d }}
                </div>
              </div>
            </el-popover>
          </div>

          <el-button type="primary" size="small" class="report-query-btn" @click="onQuery">
            查询
          </el-button>
        </ReportFilterRow>

        <!-- 数据筛选 -->
        <ReportFilterRow v-if="!collapsed" label="数据筛选：">
          <el-popover
            v-model:visible="dataFilterVisible"
            placement="bottom-start"
            :width="372"
            trigger="click"
          >
            <template #reference>
              <button class="report-filter-btn" type="button">
                <el-icon><Filter /></el-icon>筛选
              </button>
            </template>
            <div class="data-filter">
              <div class="data-filter-item">
                <span class="data-filter-label">消耗</span>
                <el-input v-model="costMin" size="small" placeholder="最小消耗" />
                <span class="data-filter-split">—</span>
                <el-input v-model="costMax" size="small" placeholder="最大消耗" />
              </div>
              <div class="data-filter-footer">
                <el-button size="small" @click="resetDataFilter">重置</el-button>
                <el-button type="primary" size="small" @click="applyDataFilter">确定</el-button>
              </div>
            </div>
          </el-popover>
        </ReportFilterRow>
      </div>
    </template>

    <!-- ============ 详细数据 ============ -->
    <div class="report-card">
      <div class="report-card-head">
        <div class="report-card-title">
          详细数据
          <el-popover placement="right" :width="600" trigger="click">
            <template #reference>
              <el-icon><QuestionFilled /></el-icon>
            </template>
            <div>{{ TIP_TABLE_SCOPE }}</div>
          </el-popover>
        </div>

        <div class="report-card-actions">
          <el-select
            v-model="relation"
            size="small"
            class="relation-select"
            multiple
            collapse-tags
            placeholder="关联维度"
          >
            <el-option v-for="o in RELATION_DIM" :key="o" :label="o" :value="o" />
          </el-select>

          <el-button size="small" @click="metricVisible = true">
            <el-icon><Operation /></el-icon>自定义指标
            <span class="tip-wrap" @click.stop>
              <el-popover placement="top" :width="140" trigger="click">
                <template #reference>
                  <el-icon class="export-help"><QuestionFilled /></el-icon>
                </template>
                {{ TIP_CUSTOM_METRIC }}
              </el-popover>
            </span>
          </el-button>

          <el-button size="small" @click="exportVisible = true">
            导出数据
            <span class="tip-wrap" @click.stop>
              <el-popover placement="top" :width="200" trigger="click">
                <template #reference>
                  <el-icon class="export-help"><QuestionFilled /></el-icon>
                </template>
                {{ TIP_EXPORT }}
              </el-popover>
            </span>
          </el-button>

          <a class="report-collapse-link" @click="tableCollapsed = !tableCollapsed">
            {{ tableCollapsed ? '展开' : '收起' }}
          </a>
        </div>
      </div>

      <div v-show="!tableCollapsed" class="report-table-wrap">
        <el-table
          class="report-table"
          :data="pageRows"
          row-key="id"
          border
          show-summary
          :summary-method="summaryMethod"
          @sort-change="onSortChange"
        >
          <el-table-column type="selection" width="60" fixed="left" />

          <el-table-column prop="date" label="时间" width="135" sortable="custom" show-overflow-tooltip>
            <template #header>
              <el-tooltip :content="TIP_TIME" placement="top"><span>时间</span></el-tooltip>
            </template>
          </el-table-column>

          <el-table-column prop="preview" label="素材预览" width="106" align="center">
            <template #header>
              <el-tooltip :content="TIP_PREVIEW" placement="top"><span>素材预览</span></el-tooltip>
            </template>
            <template #default="{ row }">
              <div class="material-preview-wrapper clickable" @click="onPreview(row)">
                <img class="report-preview material-preview" :src="row.preview" alt="素材预览" />
                <div v-if="row.is_video" class="video-play">
                  <el-icon><VideoPlay /></el-icon>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="title" label="素材" min-width="300">
            <template #header>
              <el-tooltip :content="TIP_MATERIAL" placement="top"><span>素材</span></el-tooltip>
            </template>
            <template #default="{ row }">
              <div class="material-name">
                <p class="material-title" :title="row.title">{{ row.title }}</p>
                <div class="creative-box">
                  <p class="material-id">ID：{{ row.material_id }}</p>
                  <button
                    v-if="row.material_id !== '0'"
                    class="report-mini-btn"
                    type="button"
                    @click="onAiCopy(row)"
                  >AI复刻</button>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="trend" label="近7日趋势" width="140" align="center">
            <template #header>
              <el-tooltip :content="TIP_TREND" placement="top"><span>近7日趋势</span></el-tooltip>
            </template>
            <template #default="{ row }">
              <div class="chart-parent" :ref="(el) => setChartEl(row.id, el)" />
            </template>
          </el-table-column>

          <el-table-column
            v-if="selectedMetrics.includes('消耗')"
            prop="stat_cost"
            label="消耗"
            width="423"
            align="right"
            sortable="custom"
          >
            <template #header>
              <el-tooltip :content="TIP_COST" placement="top">
                <span>消耗</span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ row.stat_cost_text }}</template>
          </el-table-column>

          <!-- 「自定义指标」弹窗里勾选的其它指标列 -->
          <el-table-column
            v-for="(m, mi) in extraMetrics"
            :key="m.name"
            :prop="`metric_${mi}`"
            :label="m.name"
            width="140"
            align="right"
          >
            <template #header>
              <el-tooltip :content="m.desc" placement="top">
                <span>{{ m.name }}</span>
              </el-tooltip>
            </template>
            <template #default="{ row }">{{ metricValue(row, m.name) }}</template>
          </el-table-column>
        </el-table>

        <div class="report-pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>

    <!-- ============ 弹层（与创量线上 1:1） ============ -->
    <!-- 自定义指标 -->
    <CustomMetricDialog
      v-model="metricVisible"
      metric-key="material"
      @apply="onMetricApply"
    />

    <!-- 导出数据：先选「素材预览地址的来源」，再提示任务创建成功 -->
    <ExportResultDialog
      v-model="exportVisible"
      mode="material"
      @confirm="onExportConfirm"
    />
    <ExportResultDialog v-model="exportTaskVisible" mode="default" />

    <!-- 素材预览层 -->
    <el-image-viewer
      v-if="previewUrl"
      :url-list="[previewUrl]"
      teleported
      @close="previewUrl = ''"
    />

    <!-- AI复刻 -->
    <el-dialog
      v-model="aiCopyVisible"
      title="AI复刻"
      width="560px"
      append-to-body
      class="material-ai-copy-dialog"
    >
      <div class="ai-copy-body">
        <div class="ai-copy-preview">
          <img :src="aiCopyRow ? aiCopyRow.preview : ''" alt="素材预览" />
        </div>
        <div class="ai-copy-form">
          <div class="ai-copy-line">
            <span class="ai-copy-label">素材名称：</span>
            <span class="ai-copy-value">{{ aiCopyRow ? aiCopyRow.title : '' }}</span>
          </div>
          <div class="ai-copy-line">
            <span class="ai-copy-label">素材ID：</span>
            <span class="ai-copy-value">{{ aiCopyRow ? aiCopyRow.material_id : '' }}</span>
          </div>
          <div class="ai-copy-field">
            <span class="ai-copy-label">复刻后名称：</span>
            <el-input v-model="aiCopyName" size="small" />
          </div>
          <div class="ai-copy-field">
            <span class="ai-copy-label">投放媒体：</span>
            <el-select v-model="aiCopyMedia" size="small" class="ai-copy-select">
              <el-option
                v-for="m in MEDIA_OPTIONS"
                :key="m.value"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
          </div>
          <div class="ai-copy-tip">确定后将生成一条复刻素材（消耗为 0），并按复刻名称检索该素材。</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="aiCopyVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAiCopy">确 定</el-button>
      </template>
    </el-dialog>
  </ReportPageShell>
</template>

<script setup>
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch,
} from 'vue';
import {
  Search, Filter, Operation, QuestionFilled, VideoPlay,
} from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReportPageShell from '../components/ReportPageShell.vue';
import ReportFilterRow from '../components/ReportFilterRow.vue';
import ReportFilterSelect from '../components/ReportFilterSelect.vue';
import CustomMetricDialog from '../components/CustomMetricDialog.vue';
import ExportResultDialog from '../components/ExportResultDialog.vue';
import {
  MEDIA_OPTIONS,
  OPTIMIZER_OPTIONS,
  SUBJECT_OPTIONS,
  PROJECT_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  MATERIAL_TAG_OPTIONS,
  DIM_MATERIAL,
  RELATION_DIM_MATERIAL,
  ADVERTISER_OPTIONS,
  PRODUCT_OPTIONS,
  CONVERT_GOAL_OPTIONS,
  OUYAN_PRODUCT_OPTIONS,
  ANDROID_APP_OPTIONS,
  MINI_APP_OPTIONS,
  DOUYIN_NO_OPTIONS,
  DRAMA_ALBUM_OPTIONS,
} from '@/mock/reportData';
import { REPORT_METRICS, REPORT_METRIC_DEFAULT_SELECTED } from '@/mock/reportMetrics';
import { REPORT_TIPS } from '@/mock/reportTips';

echarts.use([LineChart, GridComponent, CanvasRenderer]);

/* ------------------------------------------------------------------ *
 * 线上实测问号（ⓘ）提示文案 —— 逐条取自 REPORT_TIPS.material
 * ------------------------------------------------------------------ */
const TIP_TEXT = (text) => {
  const hit = (REPORT_TIPS.material || []).find((t) => t.body === text);
  return hit ? hit.body : text;
};
// 「预计每日更新时间9:45」ⓘ
const TIP_UPDATE_TIME = TIP_TEXT(
  '受媒体Marketing_Api接口数据更新时间和稳定性影响，每日数据更新时间可能会有波动，最多可能出现2小时延迟更新，如您对数据更新有疑问，请联系运营同学反馈。',
);
// 「详细数据」标题 ⓘ
const TIP_TABLE_SCOPE = TIP_TEXT(
  '1.每天上午9点45可查看前一天数据；2.素材报表仅展示本账号权限范围内的数据，如需查看更多，请联系企业管理员调整权限；',
);
// 「素材目录」下拉上的「温馨提示」ⓘ
const TIP_WARM_NOTICE = TIP_TEXT(
  '温馨提示： 1.找不到专辑，请先检查项目筛选2.若需查看专辑内所有素材，直接选中专辑即可',
);
const TIP_WARM_NOTICE_TITLE = TIP_WARM_NOTICE.replace(/^\s*/, '').split('1.找不到专辑')[0];
const TIP_WARM_NOTICE_LINES = TIP_WARM_NOTICE
  .replace(TIP_WARM_NOTICE_TITLE, '')
  .split(/(?=\d\.)/)
  .map((s) => s.trim())
  .filter(Boolean);
// 卡片头按钮 ⓘ
const TIP_CUSTOM_METRIC = TIP_TEXT('自定义指标');
const TIP_EXPORT = TIP_TEXT('导出所有页面的数据');
// 列头 ⓘ
const TIP_TIME = TIP_TEXT('时间');
const TIP_PREVIEW = TIP_TEXT('素材预览');
const TIP_MATERIAL = TIP_TEXT('素材');
const TIP_TREND = TIP_TEXT('近7日趋势');
const TIP_COST = TIP_TEXT('表示广告在投放期内的预估花费金额。当天数据可能会有波动，次日稳定');

/* ------------------------------------------------------------------ *
 * 指标集（线上实测：16 类 184 个指标）
 * ------------------------------------------------------------------ */
const METRIC_MAP = (() => {
  const map = new Map();
  ((REPORT_METRICS.material || {}).blocks || []).forEach((b) => {
    (b.metrics || []).forEach((m) => map.set(m.name, m));
  });
  return map;
})();

/* ------------------------------------------------------------------ *
 * 线上实测常量（采集自 cl.mobgi.com/report/material-report）
 * ------------------------------------------------------------------ */
const PERIODS = ['分日', '日汇总', '分月', '月汇总'];
// 「+ 添加筛选」下拉（线上实测维度清单）
const ADD_FILTER_OPTIONS = [
  '创量项目', '素材目录', '账户', '商品', '优化师', '账户主体', '上传时间',
  '素材类型', '素材标签', '素材来源', '优化目标', '上传人', '编导', '剪辑',
  '摄像', '演员', '配音', '录屏', '制作', '脚本', '巨量商品', '巨量应用',
  '小程序/小游戏', '抖音号', '剧目/专辑ID',
];
// 关联维度（共享 mock 基础上补齐线上实测剩余项）
const RELATION_DIM = [
  ...RELATION_DIM_MATERIAL,
  '上传时间', '优化师', '素材类型', '素材标签', '剧目/专辑ID', '编导', '剪辑',
  '摄像', '演员', '配音', '录屏', '制作', '脚本', '巨量商品', '巨量应用',
  '优化目标', '小程序/小游戏', '抖音号',
];
// 编导 / 剪辑 / 编号 / 素材来源 等下拉（线上实测人员名单）
const STAFF_OPTIONS = [
  '黄莹曦', '马学泰', '张浩', '王研', '张瑞凯', '裴心怡', '李玉玲', '冯逸',
  '李倩', '田博文', '汪玲丽', '邓艺爽', '倪秀云', '申旭阳', '吕瑶',
  '李杉杉', '杜浩', '魏然', '刘松涵', '杨新宇', '搜索更多(25)...',
];
const SOURCE_OPTIONS = ['自制', '客户上传', 'AI生成', '剪辑', '外采'];
const NUMBER_OPTIONS = ['20261101', '20261102', '20261103', '20261110', '20261116'];
const DIRECTORY_OPTIONS = ['全部', '短剧', '漫剧', '商品', '图文'];
// 「+ 添加筛选」里各维度对应的下拉选项（线上实测：点击后直接在筛选维度行出现该下拉）
const ADD_FILTER_OPTION_MAP = {
  创量项目: { options: PROJECT_OPTIONS, placeholder: '请选择创量项目' },
  素材目录: { options: DIRECTORY_OPTIONS, placeholder: '全选' },
  账户: { options: ADVERTISER_OPTIONS, placeholder: '请选择账户', wide: true },
  商品: { options: PRODUCT_OPTIONS, placeholder: '请选择商品' },
  优化师: { options: OPTIMIZER_OPTIONS, placeholder: '请选择优化师' },
  账户主体: { options: SUBJECT_OPTIONS, placeholder: '请选择账户主体' },
  上传时间: { options: [], placeholder: '请选择上传时间' },
  素材类型: { options: MATERIAL_TYPE_OPTIONS, placeholder: '请选择素材类型' },
  素材标签: { options: MATERIAL_TAG_OPTIONS, placeholder: '请选择素材标签' },
  素材来源: { options: SOURCE_OPTIONS, placeholder: '全选' },
  优化目标: { options: CONVERT_GOAL_OPTIONS, placeholder: '请选择优化目标' },
  上传人: { options: STAFF_OPTIONS, placeholder: '请选择上传人' },
  编导: { options: STAFF_OPTIONS, placeholder: '请选择编导' },
  剪辑: { options: STAFF_OPTIONS, placeholder: '请选择剪辑' },
  摄像: { options: STAFF_OPTIONS, placeholder: '请选择摄像' },
  演员: { options: STAFF_OPTIONS, placeholder: '请选择演员' },
  配音: { options: STAFF_OPTIONS, placeholder: '请选择配音' },
  录屏: { options: STAFF_OPTIONS, placeholder: '请选择录屏' },
  制作: { options: STAFF_OPTIONS, placeholder: '请选择制作' },
  脚本: { options: STAFF_OPTIONS, placeholder: '请选择脚本' },
  巨量商品: { options: OUYAN_PRODUCT_OPTIONS, placeholder: '请选择巨量商品' },
  巨量应用: { options: ANDROID_APP_OPTIONS, placeholder: '请选择巨量应用' },
  '小程序/小游戏': { options: MINI_APP_OPTIONS, placeholder: '请选择小程序/小游戏' },
  抖音号: { options: DOUYIN_NO_OPTIONS, placeholder: '请选择抖音号' },
  '剧目/专辑ID': { options: DRAMA_ALBUM_OPTIONS, placeholder: '请选择剧目/专辑ID' },
};

/* ------------------------------------------------------------------ *
 * 日期工具
 * ------------------------------------------------------------------ */
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const YESTERDAY = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmtDate(d);
})();
const TODAY = fmtDate(new Date());
const compact = (s) => String(s || '').replace(/-/g, '');

function daysInRange(range) {
  if (!range || range.length !== 2) return [];
  const out = [];
  const cur = new Date(`${range[0]}T00:00:00`);
  const end = new Date(`${range[1]}T00:00:00`);
  while (cur <= end && out.length < 31) {
    out.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out.length ? out : [range[1]];
}

/* ------------------------------------------------------------------ *
 * 页面状态
 * ------------------------------------------------------------------ */
const subTab = ref('history');
const period = ref('日汇总');
const dateRange = ref([YESTERDAY, YESTERDAY]);
const media = ref('toutiao_upgrade');
const dimension = ref('素材');
const keyword = ref('');
const materialType = ref('name');
const collapsed = ref(false);
const tableCollapsed = ref(false);
const relation = ref([]);
const addFilterVisible = ref(false);
const dataFilterVisible = ref(false);
const costMin = ref('');
const costMax = ref('');
const page = ref(1);
const pageSize = ref(20);
// 线上默认按消耗倒序
const sortProp = ref('stat_cost');
const sortOrder = ref('descending');
/* 弹层状态 */
const metricVisible = ref(false);        // 自定义指标弹窗
const exportVisible = ref(false);        // 导出数据：素材预览地址来源
const exportTaskVisible = ref(false);    // 导出数据：任务创建成功
const previewUrl = ref('');              // 素材预览层
const aiCopyVisible = ref(false);        // AI复刻弹窗
const aiCopyRow = ref(null);
const aiCopyName = ref('');
const aiCopyMedia = ref('toutiao_upgrade');
/* 已选指标（默认「消耗」，与线上一致） */
const selectedMetrics = ref([...(REPORT_METRIC_DEFAULT_SELECTED.material || ['消耗'])]);
/* AI复刻生成的素材 */
const copiedRows = ref([]);

const selects = ref([
  { key: 'project', label: '创量项目', placeholder: '请选择创量项目', options: PROJECT_OPTIONS, model: [] },
  { key: 'directory', label: '素材目录', placeholder: '全选', options: DIRECTORY_OPTIONS, model: [] },
  { key: 'account', label: '账户', placeholder: '请选择账户', options: ADVERTISER_OPTIONS, model: [], wide: true },
  { key: 'optimizer', label: '优化师', placeholder: '请选择优化师', options: OPTIMIZER_OPTIONS, model: [] },
  { key: 'subject', label: '账户主体', placeholder: '请选择账户主体', options: SUBJECT_OPTIONS, model: [] },
  { key: 'material_type', label: '素材类型', placeholder: '请选择素材类型', options: MATERIAL_TYPE_OPTIONS, model: [] },
  { key: 'material_tag', label: '素材标签', placeholder: '请选择素材标签', options: MATERIAL_TAG_OPTIONS, model: [] },
  { key: 'source', label: '素材来源', placeholder: '全选', options: SOURCE_OPTIONS, model: [] },
  { key: 'number', label: '编号', placeholder: '请选择编号', options: NUMBER_OPTIONS, model: [] },
  { key: 'editor', label: '剪辑', placeholder: '请选择剪辑', options: STAFF_OPTIONS, model: [] },
]);

/* ------------------------------------------------------------------ *
 * 素材预览占位图（线上为横向素材封面，80 × 45）
 * ------------------------------------------------------------------ */
const PREVIEW_COLORS = [
  ['#ffd9b0', '#fd7e4f'],
  ['#c6e2ff', '#409eff'],
  ['#d9f0d3', '#67c23a'],
  ['#ecd9ff', '#9254de'],
  ['#ffe6a8', '#e6a23c'],
  ['#dfe6ec', '#8a94a6'],
];
const PREVIEWS = PREVIEW_COLORS.map(([c1, c2]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="45" viewBox="0 0 80 45">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>`
    + `</linearGradient></defs>`
    + `<rect width="80" height="45" fill="url(#g)"/>`
    + `<rect x="6" y="8" width="26" height="20" rx="3" fill="rgba(255,255,255,.62)"/>`
    + `<rect x="36" y="12" width="38" height="6" rx="3" fill="rgba(255,255,255,.6)"/>`
    + `<rect x="36" y="23" width="24" height="5" rx="2.5" fill="rgba(255,255,255,.42)"/>`
    + `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

/* ------------------------------------------------------------------ *
 * 明细数据（线上首屏 20 行原样 + 其余按总数补齐）
 * ------------------------------------------------------------------ */
const TOTAL_COUNT = 1020;      // 线上「共 1020 条」
const TOTAL_COST = 23683.51;   // 线上合计 23683.51
// 线上首屏 20 行：素材名称 / 素材ID / 消耗
const HEAD_ROWS = [
  ['edk2j_apple中国-常规调起-图片-图片-自定义-立即查看新品-261116', '0', 656.80],
  ['xerhV_西门子洗衣机-常规调起-图片-图片-自定义-查看家电-1102', '0', 581.41],
  ['dRjsT_德国威能-常规调起-图片-图片-自定义-查看家电-1027', '0', 555.63],
  ['央广-软广-奢包-外观-0827-jww (1)', '14413702309', 535.08],
  ['uxfLn_xrf-常规调起-图片-图片-自定义-查看产品-1110', '0', 508.16],
  ['eVjRt_apple-常规调起-图片-图片-自定义-查看日常体验-261116', '0', 440.38],
  ['pzgsk_保鲜膜套-常规调起-真人口播-AIGC视频-自定义-保鲜膜套-14', '0', 397.43],
  ['vffAx_找拼多多借钱-常规调起-图片-图片-自定义-查看网站-1110', '0', 346.62],
  ['ufEDj_小米鹏程-常规调起-图片-图片-自定义-查看汽车-1110', '0', 337.23],
  ['qq40B_oppo商城-常规调起-真人口播-AIGC视频-自定义-oppo商城-9', '0', 337.02],
  ['7g9lJ_得力e十-常规调起-图片-图片-自定义-查看产品-1116', '0', 329.48],
  ['tg3t1_苹果-常规调起-图片-图片-自定义-了解健康娱乐-1102', '0', 307.65],
  ['央广-软广-奢包-外观-1009-NXY-4', '14810016237', 299.47],
  ['央广-软广-潮鞋-外观-0914-NXY-1', '14553537453', 296.90],
  ['字节-亦芯-奢包-商品展示-一直-07.01-01-徐莉思-yyh.mp4', '0', 285.18],
  ['7tlHh_淘宝精选-常规调起-图片-图片-自定义-去发现好物-261116', '0', 284.55],
  ['eMwir_苹果-常规调起-图片-图片-自定义-查看数码-1116', '0', 271.36],
  ['20261029-知乎小说-唯爱遥遥-缄默相思-l混剪-AIGC-00K-3', '14957135808', 249.73],
  ['uKs6V_法兰克穆勒手表官网-常规调起-图片-图片-自定义-查看运动系列-NXY', '0', 239.79],
  ['nA2jY_4973563879304674126-剪辑视频-剪辑视频-来好看视频看免费短剧-丹&欣&260910_红果_安利推广_1', '0', 223.66],
];

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => n.toFixed(2);

const signature = computed(() => JSON.stringify([
  subTab.value,
  period.value,
  (dateRange.value || []).join('~'),
  media.value,
  dimension.value,
  keyword.value,
  selects.value.map((s) => `${s.key}:${(s.model || []).join(',')}`).join('|'),
  costMin.value,
  costMax.value,
]));
const DEFAULT_SIGNATURE = computed(() => JSON.stringify([
  'history',
  '日汇总',
  `${YESTERDAY}~${YESTERDAY}`,
  'toutiao_upgrade',
  '素材',
  '',
  selects.value.map((s) => `${s.key}:`).join('|'),
  '',
  '',
]));

const allRows = computed(() => {
  const isDefault = signature.value === DEFAULT_SIGNATURE.value;
  const seed = hash(signature.value);
  const factor = isDefault ? 1 : 1 + ((seed % 13) - 6) / 100;
  const r = rng(seed || 1);

  const rows = [];
  for (let i = 0; i < TOTAL_COUNT; i++) {
    const head = isDefault ? HEAD_ROWS[i] : null;
    const base = head
      ? { title: head[0], material_id: head[1], stat_cost: head[2] }
      : {
        title: HEAD_ROWS[i % HEAD_ROWS.length][0],
        material_id: i % 7 === 3 ? String(14413702309 + i) : '0',
        stat_cost: 0,
      };
    rows.push({
      id: i + 1,
      title: base.title,
      material_id: base.material_id,
      preview: PREVIEWS[i % PREVIEWS.length],
      is_video: i % 5 === 2,
      trend: Array.from({ length: 7 }, () => Math.round(r() * 100) / 100),
      stat_cost: base.stat_cost,
    });
  }

  // 消耗：默认态沿用线上首屏 20 行原值 + 其余按权重补齐；其它态整表按权重生成
  const targetTotal = TOTAL_COST * factor;
  if (isDefault) {
    const headSum = rows.slice(0, HEAD_ROWS.length).reduce((a, b) => a + b.stat_cost, 0);
    const tailTarget = targetTotal - headSum;
    const tail = rows.slice(HEAD_ROWS.length);
    // 偏斜权重：少量大额 + 大量小额，贴近线上消耗分布
    const weights = tail.map(() => 0.02 + Math.pow(r(), 2.2) * 3);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    tail.forEach((row, i) => {
      row.stat_cost = round2(tailTarget * (weights[i] / sum));
    });
    const tailSum = tail.reduce((a, b) => a + b.stat_cost, 0);
    if (tail.length) {
      tail[tail.length - 1].stat_cost = round2(tail[tail.length - 1].stat_cost + (tailTarget - tailSum));
    }
  } else {
    const weights = rows.map(() => 0.02 + Math.pow(r(), 2.2) * 3);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    rows.forEach((row, i) => {
      row.stat_cost = round2(targetTotal * (weights[i] / sum));
    });
    const cur = rows.reduce((a, b) => a + b.stat_cost, 0);
    const last = rows[rows.length - 1];
    last.stat_cost = round2(last.stat_cost + (targetTotal - cur));
  }

  // AI复刻生成的素材（新增行，消耗为 0）
  copiedRows.value.forEach((c, i) => {
    rows.push({
      id: TOTAL_COUNT + 1 + i,
      title: c.title,
      material_id: '0',
      preview: c.preview || PREVIEWS[i % PREVIEWS.length],
      is_video: false,
      trend: Array.from({ length: 7 }, () => Math.round(r() * 100) / 100),
      stat_cost: 0,
    });
  });

  // 时间列随粒度 / 日期区间变化
  const days = daysInRange(dateRange.value);
  rows.forEach((row, i) => {
    if (period.value === '分月' || period.value === '月汇总') {
      row.date = compact(dateRange.value[1]).slice(0, 6);
    } else if (period.value === '日汇总') {
      row.date = compact(dateRange.value[1]);
    } else {
      row.date = compact(days[i % days.length]);
    }
    row.stat_cost_text = money(row.stat_cost);
  });
  return rows;
});

const filteredRows = computed(() => {
  const kw = keyword.value.trim();
  const min = costMin.value === '' ? null : Number(costMin.value);
  const max = costMax.value === '' ? null : Number(costMax.value);
  return allRows.value.filter((row) => {
    if (kw) {
      const hit = materialType.value === 'id'
        ? row.material_id.includes(kw)
        : row.title.includes(kw);
      if (!hit) return false;
    }
    if (min !== null && !Number.isNaN(min) && row.stat_cost < min) return false;
    if (max !== null && !Number.isNaN(max) && row.stat_cost > max) return false;
    return true;
  });
});

const sortedRows = computed(() => {
  const list = filteredRows.value.slice();
  if (!sortProp.value) return list;
  const dir = sortOrder.value === 'ascending' ? 1 : -1;
  list.sort((a, b) => {
    const va = a[sortProp.value];
    const vb = b[sortProp.value];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
  return list;
});

const total = computed(() => sortedRows.value.length);
const totalCost = computed(() => round2(filteredRows.value.reduce((a, b) => a + b.stat_cost, 0)));
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return sortedRows.value.slice(start, start + pageSize.value);
});

function summaryMethod({ columns }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计';
    if ((col.property || col.prop) === 'stat_cost') return money(totalCost.value);
    return '--';
  });
}

function onSortChange({ prop, order }) {
  sortProp.value = prop || '';
  sortOrder.value = order || '';
}

watch([signature, pageSize], () => { page.value = 1; });
watch(total, () => {
  const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value));
  if (page.value > maxPage) page.value = maxPage;
});

/* ------------------------------------------------------------------ *
 * 近7日趋势 mini 折线图（echarts，112 × 48）
 * ------------------------------------------------------------------ */
const chartEls = new Map();
const charts = new Map();
const rowMap = computed(() => new Map(allRows.value.map((r) => [r.id, r])));
let resizeObserver = null;

function ensureObserver() {
  if (resizeObserver) return resizeObserver;
  resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const id = Number(entry.target.dataset.rowId);
      const chart = charts.get(id);
      if (chart && !chart.isDisposed()) chart.resize();
    });
  });
  return resizeObserver;
}

function setChartEl(id, el) {
  if (!el) {
    chartEls.delete(id);
    const c = charts.get(id);
    if (c && !c.isDisposed()) c.dispose();
    charts.delete(id);
    return;
  }
  if (chartEls.get(id) === el) return;
  const old = charts.get(id);
  if (old && !old.isDisposed()) old.dispose();
  charts.delete(id);
  chartEls.set(id, el);
  el.dataset.rowId = String(id);
  ensureObserver().observe(el);
  // 单元格挂载后立即出图（el-table 的表体是延迟渲染的）
  renderChart(id);
}

function trendOption(values) {
  return {
    animation: false,
    grid: { left: 0, right: 0, top: 2, bottom: 0 },
    xAxis: {
      type: 'category',
      show: false,
      boundaryGap: false,
      data: values.map((_, i) => i),
    },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.6, color: '#2b7fff' },
      itemStyle: { color: '#2b7fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(43,127,255,0.28)' },
            { offset: 1, color: 'rgba(43,127,255,0.02)' },
          ],
        },
      },
    }],
  };
}

function renderChart(id) {
  const el = chartEls.get(id);
  const row = rowMap.value.get(id);
  if (!el || !row) return;
  let chart = charts.get(id);
  if (!chart || chart.isDisposed()) {
    chart = echarts.init(el, null, { renderer: 'canvas' });
    charts.set(id, chart);
  }
  chart.setOption(trendOption(row.trend), true);
  // 表格列宽计算完成后容器才有实际尺寸，这里补一次 resize
  requestAnimationFrame(() => {
    if (!chart.isDisposed()) chart.resize();
  });
}

function renderCharts() {
  pageRows.value.forEach((row) => renderChart(row.id));
}

function resizeCharts() {
  charts.forEach((c) => {
    if (!c.isDisposed()) c.resize();
  });
}

watch(pageRows, () => nextTick(renderCharts), { flush: 'post' });
watch(tableCollapsed, (v) => {
  if (!v) nextTick(renderCharts);
});

onMounted(() => {
  nextTick(renderCharts);
  // el-table 表体延迟渲染，兜底补一次
  setTimeout(renderCharts, 120);
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  charts.forEach((c) => {
    if (!c.isDisposed()) c.dispose();
  });
  charts.clear();
  chartEls.clear();
});

/* ------------------------------------------------------------------ *
 * 交互
 * ------------------------------------------------------------------ */
function onSubTab(tab) {
  subTab.value = tab;
  if (tab === 'today') {
    dateRange.value = [TODAY, TODAY];
    period.value = '日汇总';
  } else {
    dateRange.value = [YESTERDAY, YESTERDAY];
    period.value = '日汇总';
  }
  page.value = 1;
}

function onQuery() {
  // 线上「查询」不弹任何提示，只重新取数
  page.value = 1;
}

/** 「+ 添加筛选」：把该维度直接加进「筛选维度」行（线上行为） */
function onAddFilter(dim) {
  addFilterVisible.value = false;
  if (selects.value.some((s) => s.label === dim)) return;
  const conf = ADD_FILTER_OPTION_MAP[dim] || { options: [], placeholder: `请选择${dim}` };
  selects.value = [
    ...selects.value,
    {
      key: dim,
      label: dim,
      placeholder: conf.placeholder,
      options: conf.options,
      model: [],
      wide: !!conf.wide,
    },
  ];
  page.value = 1;
}

/** 数据筛选浮层：重置 */
function resetDataFilter() {
  costMin.value = '';
  costMax.value = '';
  dataFilterVisible.value = false;
  page.value = 1;
}

/** 数据筛选浮层：确定 */
function applyDataFilter() {
  dataFilterVisible.value = false;
  page.value = 1;
}

/** 「自定义指标」弹窗点「应 用」：把所选指标应用到表格（列增减生效） */
function onMetricApply({ selected }) {
  const list = (selected || []).filter((n) => METRIC_MAP.has(n));
  selectedMetrics.value = list.length ? list : ['消耗'];
  page.value = 1;
}

/** 「导出数据」：选好素材预览地址来源后创建导出任务 */
function onExportConfirm() {
  exportTaskVisible.value = true;
}

/** 素材预览：打开大图预览层 */
function onPreview(row) {
  previewUrl.value = row.preview;
}

/** AI复刻：打开复刻弹窗 */
function onAiCopy(row) {
  aiCopyRow.value = row;
  aiCopyName.value = `${row.title}-复刻`;
  aiCopyMedia.value = media.value;
  aiCopyVisible.value = true;
}

/** AI复刻确定：生成一条复刻素材并按复刻名称检索出来 */
function confirmAiCopy() {
  const src = aiCopyRow.value;
  if (!src) return;
  const name = (aiCopyName.value || '').trim() || `${src.title}-复刻`;
  copiedRows.value = [
    ...copiedRows.value,
    { title: name, media: aiCopyMedia.value, preview: src.preview },
  ];
  materialType.value = 'name';
  keyword.value = name;
  aiCopyVisible.value = false;
  page.value = 1;
}

/* ------------------------------------------------------------------ *
 * 自定义指标列：除「消耗」外的其它指标列
 * ------------------------------------------------------------------ */
const extraMetrics = computed(() =>
  selectedMetrics.value
    .filter((n) => n !== '消耗')
    .map((n) => ({ name: n, desc: (METRIC_MAP.get(n) || {}).desc || '' }))
);

/** 指标列的取值（本地 mock，按行 id + 指标名确定性生成） */
function metricValue(row, name) {
  const r = rng(hash(`${row.id}::${name}`));
  const v = r();
  if (name.includes('率')) return `${(v * 100).toFixed(2)}%`;
  if (name.includes('成本') || name.includes('单价') || name.includes('费用')) {
    return (v * 40).toFixed(2);
  }
  return Math.round(v * 200000).toLocaleString('en-US');
}
</script>

<style scoped>
/* 线上素材报表页头只有二级页签，没有页面标题 */
:deep(.report-title:empty) {
  display: none;
}

/* 筛选维度控件组：换行后「查询」按钮保持在右侧并垂直居中（与线上一致）
 * max-width 对齐线上 .filter-dim-list 的可用宽度（100vw - 450px），
 * 以保证筛选条件的换行位置与线上一致 */
.filter-fields {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
  max-width: calc(100vw - 450px);
}
.filter-fields :deep(.report-select-box .el-input__wrapper) {
  box-shadow: none !important;
}
.filter-fields :deep(.report-select-box .el-input),
.filter-fields :deep(.report-search-box .el-input) {
  width: 100%;
}
/* 线上组合盒：固定 label 区 84px + 下拉 181px（合计 265px） */
.filter-fields :deep(.report-select-box > label) {
  box-sizing: border-box;
  width: 84px;
  justify-content: center;
}
.filter-fields :deep(.report-select-box .el-select) {
  width: 181px;
}
/* 线上「账户」为远程下拉，字段更宽（合计 425px） */
.filter-fields .select-account :deep(.report-select-box .el-select) {
  width: 341px;
}
/* 线上筛选行 label 区宽度（控件起点与线上一致） */
:deep(.report-dim-label) {
  min-width: 115px;
}
.report-query-btn {
  margin-left: auto;
}

/* 「素材名称」组合盒：类型下拉 + 关键词输入框 */
.material-search-box {
  display: inline-flex;
  align-items: stretch;
  height: 30px;
  width: 370px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background: #fff;
  overflow: hidden;
}
.material-search-box .material-type-select {
  width: 130px;
  flex: 0 0 auto;
}
.material-search-box :deep(.material-type-select .el-select__wrapper) {
  box-shadow: none !important;
  border-right: 1px solid #dcdfe6;
  border-radius: 0;
  min-height: 28px;
  padding: 0 8px;
}
.material-search-box :deep(.material-type-select .el-select__selected-item),
.material-search-box :deep(.material-type-select .el-select__placeholder) {
  font-size: 13px;
}
.material-search-box :deep(.material-type-select .el-input__inner),
.material-search-box :deep(.el-input__inner) {
  height: 28px;
  font-size: 13px;
  border: none;
}
.material-search-box :deep(.el-input) {
  flex: 1 1 auto;
  width: auto;
}
.material-search-box :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding-left: 10px;
}

/* 数据维度行的右侧提示 */
.filter-tip {
  margin-left: auto;
}
.tip-help {
  color: #c0c4cc;
  cursor: pointer;
}
.tip-help:hover {
  color: #197afb;
}

/* 「+ 添加筛选」下拉菜单 */
.add-filter-menu {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow: auto;
}
.add-filter-item {
  font-size: 13px;
  color: #333333;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.add-filter-item:hover {
  color: #197afb;
  background: #f7f8fa;
}

/* 数据筛选浮层 */
.data-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.data-filter-label {
  font-size: 13px;
  color: #333333;
  width: 34px;
}
.data-filter-split {
  color: #c0c4cc;
}
.data-filter-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* 卡片头 */
.relation-select {
  width: 120px;
}
.export-help {
  color: #c0c4cc;
  cursor: pointer;
  margin-left: 4px;
  vertical-align: middle;
}
.export-help:hover {
  color: #197afb;
}
/* 按钮内的 ⓘ 包裹层：阻止冒泡，避免点问号时触发按钮本身 */
.tip-wrap {
  display: inline-flex;
  align-items: center;
}

/* 「素材目录」下拉上的「温馨提示」浮层 */
.tips-title {
  font-size: 13px;
  color: #333333;
  margin-bottom: 4px;
}
.tips-line {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: #606266;
}

/* 素材预览：线上为横向素材封面（80 × 45） */
.material-preview-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
}
.report-preview.material-preview {
  width: 80px;
  height: 45px;
  margin: 0 auto;
  object-fit: cover;
}
.video-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

/* 素材列：两行（标题 + ID / AI复刻） */
.material-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.material-title {
  margin: 0;
  font-size: 13px;
  color: #333333;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.creative-box {
  display: flex;
  align-items: center;
  gap: 8px;
}
.material-id {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

/* 近7日趋势 mini 图：线上 112 × 48 */
.chart-parent {
  width: 112px;
  height: 48px;
  margin: 0 auto;
}
</style>

<!-- AI复刻弹窗：el-dialog 会 teleport 到 body，样式不能 scoped -->
<style>
.material-ai-copy-dialog .el-dialog { border-radius: 4px; }
.material-ai-copy-dialog .el-dialog__title { font-size: 16px; font-weight: 500; color: #333333; }
.material-ai-copy-dialog .el-dialog__body { padding: 20px 24px; }
.material-ai-copy-dialog .el-dialog__footer { padding: 12px 24px 20px; }
.ai-copy-body { display: flex; gap: 16px; }
.ai-copy-preview {
  flex: 0 0 180px;
  width: 180px;
  height: 101px;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  background: #fafafa;
  overflow: hidden;
}
.ai-copy-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ai-copy-form { flex: 1 1 auto; min-width: 0; }
.ai-copy-line { font-size: 13px; color: #333333; line-height: 1.9; }
.ai-copy-label { color: #909399; }
.ai-copy-value { color: #333333; }
.ai-copy-field { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.ai-copy-field .ai-copy-label { flex: 0 0 76px; text-align: right; }
.ai-copy-field .el-input, .ai-copy-field .el-select { flex: 1 1 auto; min-width: 0; }
.ai-copy-select { width: 100%; }
.ai-copy-tip { margin-top: 12px; font-size: 12px; color: #909399; line-height: 1.7; }
</style>
