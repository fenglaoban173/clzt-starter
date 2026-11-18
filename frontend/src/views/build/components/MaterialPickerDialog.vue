<template>
  <el-dialog
    :model-value="modelValue"
    width="1240px"
    top="4vh"
    class="mp-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <template #header="{ close }">
      <div class="mp-head">
        <div class="mp-tabs">
          <div
            v-for="t in TABS"
            :key="t.key"
            class="mp-tab"
            :class="{ active: tab === t.key }"
            @click="switchTab(t.key)"
          >{{ t.label }}</div>
        </div>
        <a class="mp-upload" @click="onUpload">上传素材</a>
      </div>
    </template>

    <div class="mp-body">
      <!-- 筛选区 -->
      <div class="mp-filters">
        <!-- 第一行：素材名称 + 关键词 + 排除素材名 + 类型/账户 -->
        <div class="mp-frow">
          <div class="mp-search-group">
            <el-select v-model="f.nameField" class="mp-f-select mp-f-name">
              <el-option v-for="o in OPTS.nameField" :key="o" :label="o" :value="o" />
            </el-select>
            <el-input v-model="f.keyword" class="mp-f-input" placeholder="支持两个关键词查询（空格分隔）">
              <template #suffix><el-icon class="mp-suffix-icon"><Search /></el-icon></template>
            </el-input>
            <el-button class="mp-f-btn" @click="onSearch"><el-icon><Search /></el-icon></el-button>
          </div>
          <span class="mp-chip">排除素材名</span>
          <div class="mp-search-group">
            <el-input v-model="f.exclude" class="mp-f-input" placeholder="多个以空格分隔，结果取并集">
              <template #suffix><el-icon class="mp-suffix-icon"><Search /></el-icon></template>
            </el-input>
            <el-button class="mp-f-btn" @click="onSearch"><el-icon><Search /></el-icon></el-button>
          </div>
          <el-select
            v-if="tab === 'media'"
            v-model="f.account"
            class="mp-f-select mp-f-account"
            placeholder="全部"
            clearable
          >
            <template #prefix><span class="mp-pre">账户：</span></template>
            <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.name" />
          </el-select>
          <el-select v-else v-model="f.type" class="mp-f-select mp-f-type">
            <template #prefix><span class="mp-pre">类型：</span></template>
            <el-option v-for="o in OPTS.type" :key="o" :label="o" :value="o" />
          </el-select>
          <div class="mp-f-right">
            <a class="mp-link" @click="resetFilters">清空</a>
            <a class="mp-link" @click="collapsed = !collapsed">{{ collapsed ? '展开' : '收起' }}</a>
          </div>
        </div>

        <template v-if="!collapsed">
          <!-- 素材库 -->
          <template v-if="tab === 'library'">
            <div class="mp-frow">
              <el-select v-model="f.getType" class="mp-f-select mp-f-mid" placeholder="获取方式" clearable>
                <template #prefix><span class="mp-pre">获取方式：</span></template>
                <el-option v-for="o in OPTS.getType" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.ztProject" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">智投项目：</span></template>
                <el-option v-for="o in OPTS.ztProject" :key="o" :label="o" :value="o" />
              </el-select>
              <el-cascader
                v-model="f.directory"
                :options="OPTS.directory"
                :props="DIRECTORY_PROPS"
                class="mp-f-select mp-f-mid"
                placeholder="全部"
                clearable
              >
                <template #prefix><span class="mp-pre">素材目录：</span></template>
              </el-cascader>
              <el-cascader
                v-model="f.tag"
                :options="OPTS.tag"
                :props="TAG_PROPS"
                show-checkbox
                class="mp-f-select mp-f-mid"
                placeholder="全部"
                clearable
              >
                <template #prefix><span class="mp-pre">素材标签：</span></template>
              </el-cascader>
            </div>
            <div class="mp-frow">
              <el-cascader
                v-model="f.excludeTag"
                :options="OPTS.excludeTag"
                :props="TAG_PROPS"
                show-checkbox
                class="mp-f-select mp-f-mid"
                placeholder="全部"
                clearable
              >
                <template #prefix><span class="mp-pre">排除标签：</span></template>
              </el-cascader>
              <el-select v-model="f.personalTag" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">个人标签：</span></template>
                <el-option v-for="o in OPTS.personalTag" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.useStatus" class="mp-f-select mp-f-mid" placeholder="不限" clearable>
                <template #prefix><span class="mp-pre">使用情况：</span></template>
                <el-option v-for="o in OPTS.useStatus" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.layout" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">版式：</span></template>
                <el-option v-for="o in OPTS.layout" :key="o" :label="o" :value="o" />
              </el-select>
            </div>
            <div class="mp-frow">
              <div class="mp-dur" :class="{ empty: durEmpty }">
                <el-slider v-model="f.duration" range :min="0" :max="600" :show-tooltip="false" />
                <span class="mp-dur-txt">{{ durText }}</span>
                <el-icon v-if="!durEmpty" class="mp-dur-clear" @click="f.duration = [0, 600]">
                  <CircleClose />
                </el-icon>
              </div>
              <el-select v-model="f.number" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">编号：</span></template>
                <el-option v-for="o in OPTS.member" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.clip" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">剪辑：</span></template>
                <el-option v-for="o in OPTS.member" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select
                v-model="f.filterRule"
                multiple
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                class="mp-f-select mp-f-rule"
                placeholder="全部"
                clearable
              >
                <template #prefix><span class="mp-pre">素材过滤：</span></template>
                <el-option v-for="o in OPTS.filterRule" :key="o" :label="o" :value="o" />
              </el-select>
            </div>
            <div class="mp-frow">
              <el-select v-model="f.attr" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">素材属性：</span></template>
                <el-option v-for="o in OPTS.attr" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.status" class="mp-f-select mp-f-mid" placeholder="不限" clearable>
                <template #prefix><span class="mp-pre">启停状态：</span></template>
                <el-option v-for="o in OPTS.status" :key="o" :label="o" :value="o" />
              </el-select>
              <el-date-picker
                v-model="f.uploadRange"
                type="datetimerange"
                unlink-panels
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="mp-f-date"
              />
            </div>
          </template>

          <!-- 媒体素材 -->
          <template v-else>
            <div class="mp-frow">
              <el-select v-model="f.source" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">来源：</span></template>
                <el-option v-for="o in OPTS.source" :key="o" :label="o" :value="o" />
              </el-select>
              <el-date-picker
                v-model="f.uploadRange"
                type="daterange"
                unlink-panels
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                class="mp-f-date"
              />
              <el-select v-model="f.type" class="mp-f-select mp-f-mid">
                <template #prefix><span class="mp-pre">类型：</span></template>
                <el-option v-for="o in OPTS.type" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.layout" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">版式：</span></template>
                <el-option v-for="o in OPTS.layout" :key="o" :label="o" :value="o" />
              </el-select>
            </div>
            <div class="mp-frow">
              <div class="mp-dur" :class="{ empty: durEmpty }">
                <el-slider v-model="f.duration" range :min="0" :max="600" :show-tooltip="false" />
                <span class="mp-dur-txt">{{ durText }}</span>
                <el-icon v-if="!durEmpty" class="mp-dur-clear" @click="f.duration = [0, 600]">
                  <CircleClose />
                </el-icon>
              </div>
              <el-select
                v-model="f.filterRule"
                multiple
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="1"
                class="mp-f-select mp-f-rule"
                placeholder="全部"
                clearable
              >
                <template #prefix><span class="mp-pre">素材过滤：</span></template>
                <el-option v-for="o in OPTS.mediaFilterRule" :key="o" :label="o" :value="o" />
              </el-select>
              <el-select v-model="f.attr" class="mp-f-select mp-f-mid" placeholder="全部" clearable>
                <template #prefix><span class="mp-pre">素材属性：</span></template>
                <el-option v-for="o in OPTS.attr" :key="o" :label="o" :value="o" />
              </el-select>
              <span class="mp-warn">
                <el-icon><WarningFilled /></el-icon>
                使用抖音达人的视频时，将只能投放自定义创意
              </span>
            </div>
          </template>
        </template>
      </div>

      <!-- 指标数据口径 -->
      <div class="mp-caliber">
        <span class="mp-caliber-label">指标数据口径：</span>
        <el-radio-group v-model="f.caliber" size="small">
          <el-radio v-for="o in OPTS.caliber" :key="o" :label="o" :value="o" />
        </el-radio-group>
      </div>

      <!-- 工具条 -->
      <div class="mp-toolbar">
        <div class="mp-view-toggle">
          <button class="mp-view-btn" :class="{ active: view === 'grid' }" @click="view = 'grid'">
            <el-icon><Grid /></el-icon>网格
          </button>
          <button class="mp-view-btn" :class="{ active: view === 'list' }" @click="view = 'list'">
            <el-icon><Menu /></el-icon>列表
          </button>
        </div>
        <el-checkbox v-model="tool.onlyDeliverable">仅显示可投放素材</el-checkbox>
        <el-icon class="mp-help"><QuestionFilled /></el-icon>
        <div class="mp-filter-item">
          <el-checkbox v-model="tool.filterReject">过滤拒绝次数≥</el-checkbox>
          <el-input v-model="tool.rejectTimes" class="mp-num" />
          <span>的素材</span>
          <el-icon class="mp-help"><QuestionFilled /></el-icon>
        </div>
        <div class="mp-filter-item">
          <el-checkbox v-model="tool.filterSuggest">过滤建议次数≥</el-checkbox>
          <el-input v-model="tool.suggestTimes" class="mp-num" />
          <span>的素材</span>
        </div>
        <div class="mp-toolbar-right">
          <el-button v-if="tab === 'media'" type="primary" plain class="mp-sync-btn" @click="onSyncMedia">同步素材</el-button>
          <el-button @click="onCustomMetric"><el-icon><Operation /></el-icon>自定义指标与排序</el-button>
          <el-button link type="primary" class="mp-refresh" @click="onRefresh">刷新</el-button>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="mp-content">
        <template v-if="currentList.length">
          <div v-if="view === 'grid'" class="mp-grid">
            <div v-for="m in currentList" :key="m.id" class="mp-card">
              <div class="mp-thumb">
                <el-checkbox
                  class="mp-card-check"
                  :model-value="selected.includes(m.id)"
                  @change="(v) => toggle(m.id, v)"
                />
                <div class="mp-cover" :class="'tone-' + m.tone">
                  <el-icon class="mp-play"><VideoPlay /></el-icon>
                </div>
                <div class="mp-res">{{ m.resolution }}</div>
                <div class="mp-dur-badge">{{ m.duration }}</div>
                <el-icon class="mp-more"><MoreFilled /></el-icon>
              </div>
              <div class="mp-info">
                <div class="mp-title">
                  <span class="mp-name" :title="m.name">{{ m.name }}</span>
                  <span class="mp-size">{{ m.size }}</span>
                </div>
                <div class="mp-line">MID: {{ m.mid }}</div>
                <div class="mp-line">备注:{{ m.remark }}</div>
                <div class="mp-line">上传时间：{{ m.upload_time }}</div>
                <div class="mp-line">
                  累计关联广告数 <el-icon class="mp-help"><QuestionFilled /></el-icon>：{{ m.ad_count }}
                </div>
                <div class="mp-line">
                  今日创量关联广告数 <el-icon class="mp-help"><QuestionFilled /></el-icon>：{{ m.today_ad_count }}
                </div>
                <div class="mp-foot">
                  <span class="mp-badge" :class="{ used: m.status !== '未使用' }">{{ m.status }}</span>
                  <a class="mp-detail" @click="onDetail(m)">详情</a>
                </div>
              </div>
            </div>
          </div>

          <el-table v-else :data="currentList" size="small" border class="mp-table">
            <el-table-column label="素材名称" prop="name" min-width="260" />
            <el-table-column label="大小" prop="size" width="110" />
            <el-table-column label="MID" prop="mid" width="150" />
            <el-table-column label="上传时间" prop="upload_time" width="170" />
            <el-table-column label="累计关联广告数" prop="ad_count" width="130" align="right" />
            <el-table-column label="今日创量关联广告数" prop="today_ad_count" width="150" align="right" />
            <el-table-column label="状态" prop="status" width="90" />
          </el-table>
        </template>
        <el-empty v-else description="暂无数据" />
      </div>

      <!-- 列表页脚 -->
      <div class="mp-listfoot">
        <el-checkbox :model-value="allChecked" @change="toggleAll">全选</el-checkbox>
        <span v-if="tab === 'media'" class="mp-tip-inline">
          素材封面缺失时，请授权账户时勾选敏感物料。
        </span>
        <span v-else class="mp-tip-inline">
          1、素材可投放尺寸：<a class="mp-link">详细尺寸&gt;&gt;</a>
          2、创意审核状态：只有素材库素材通过审核才可以使用；
        </span>
        <div class="mp-pager">
          <span class="mp-total">共 {{ total }} 条</span>
          <el-select v-model="pageSize" class="mp-size-select" size="small">
            <el-option v-for="s in [20, 50, 100]" :key="s" :label="`${s}条/页`" :value="s" />
          </el-select>
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next, jumper"
            :pager-count="5"
            background
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="mp-foot">
        <div class="mp-foot-left">
          <span>已选素材: {{ selected.length }}/100</span>
          <el-icon class="mp-help"><QuestionFilled /></el-icon>
          <span class="mp-missing">找不到素材？<a class="mp-link">点这里</a></span>
        </div>
        <div class="mp-foot-right">
          <el-button link type="primary" @click="clearSelection">清空选择</el-button>
          <el-button @click="close">取消</el-button>
          <el-button type="primary" @click="submit">提交</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  CircleClose, Grid, Menu, MoreFilled, Operation, QuestionFilled, Search, VideoPlay, WarningFilled,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { mediaApi } from '@/api/media';
import {
  MATERIAL_LIBRARY, MATERIAL_MEDIA,
  MATERIAL_FILTER_OPTIONS as OPTS,
  MATERIAL_FILTER_RULE_DEFAULT,
  MATERIAL_FILTER_RULE_MEDIA_DEFAULT,
} from '@/mock/materials';

const props = defineProps({
  modelValue: Boolean,
  selectedIds: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'submit']);

// 页签：素材库 / 媒体素材（线上另有「魔剪 / 收藏夹」，按需求移除）
const TABS = [
  { key: 'library', label: '素材库', data: MATERIAL_LIBRARY },
  { key: 'media', label: '媒体素材', data: MATERIAL_MEDIA },
];

// 级联面板参数：素材目录（单选 · 悬停展开）、素材标签（多选 · 勾选）
const DIRECTORY_PROPS = { emitPath: false, expandTrigger: 'hover' };
const TAG_PROPS = { multiple: true, emitPath: false, checkStrictly: false };

const tab = ref('library');
const view = ref('grid');
const collapsed = ref(false);
const selected = ref([]);
const page = ref(1);
const pageSize = ref(20);
const accounts = ref([]);

// 上传时间默认区间（对齐线上：近 90 天）
function defaultRange(withTime) {
  const start = dayjs().subtract(90, 'day');
  const end = dayjs();
  return withTime
    ? [start.startOf('day').format('YYYY-MM-DD HH:mm:ss'), end.endOf('day').format('YYYY-MM-DD HH:mm:ss')]
    : [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
}

function createFilterState(kind) {
  return {
    nameField: '素材名称',
    keyword: '',
    exclude: '',
    type: '视频',
    getType: '',
    ztProject: '',
    directory: '',
    tag: [],
    excludeTag: [],
    personalTag: '',
    useStatus: '',
    layout: '',
    number: '',
    clip: '',
    filterRule: kind === 'media'
      ? [...MATERIAL_FILTER_RULE_MEDIA_DEFAULT]
      : [...MATERIAL_FILTER_RULE_DEFAULT],
    source: '',
    account: '',
    attr: '',
    status: '',
    uploadRange: defaultRange(kind !== 'media'),
    duration: [0, 600],
    caliber: '标准版',
  };
}

const fLibrary = reactive(createFilterState('library'));
const fMedia = reactive(createFilterState('media'));
const f = computed(() => (tab.value === 'media' ? fMedia : fLibrary));

// 工具条（两页签共用）
const tool = reactive({
  onlyDeliverable: false,
  filterReject: false,
  rejectTimes: '',
  filterSuggest: false,
  suggestTimes: '',
});

const durEmpty = computed(() => {
  const d = f.value.duration || [];
  return !d.length || (d[0] <= 0 && d[1] >= 600);
});
const durText = computed(() => {
  const d = f.value.duration || [];
  if (!d.length || (d[0] <= 0 && d[1] >= 600)) return '~';
  return `${d[0]}s ~ ${d[1]}s`;
});

const currentData = computed(() => (TABS.find((t) => t.key === tab.value) || {}).data || []);
const total = computed(() => currentData.value.length);
const currentList = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return currentData.value.slice(start, start + pageSize.value);
});
const allChecked = computed(() => currentList.value.length > 0 && currentList.value.every((m) => selected.value.includes(m.id)));

watch(() => props.modelValue, (v) => {
  if (v) selected.value = [...props.selectedIds];
});

async function init() {
  selected.value = [...props.selectedIds];
  page.value = 1;
  if (!accounts.value.length) {
    const res = await mediaApi.accounts();
    accounts.value = res.data?.list || [];
  }
}

function accountLabel(a) {
  return `${a.name}--${a.advertiser_id}`;
}

function switchTab(key) {
  if (tab.value === key) return;
  tab.value = key;
  page.value = 1;
}

function toggle(id, v) {
  if (v) {
    if (selected.value.length >= 100) {
      ElMessage.warning('最多只能选择 100 个素材');
      return;
    }
    selected.value = [...selected.value, id];
  } else {
    selected.value = selected.value.filter((x) => x !== id);
  }
}

function toggleAll(v) {
  const ids = currentList.value.map((m) => m.id);
  if (v) {
    const merged = [...new Set([...selected.value, ...ids])].slice(0, 100);
    selected.value = merged;
  } else {
    selected.value = selected.value.filter((x) => !ids.includes(x));
  }
}

function clearSelection() {
  selected.value = [];
}

function resetFilters() {
  const next = createFilterState(tab.value);
  Object.assign(f.value, next);
  page.value = 1;
}

function onSearch() { page.value = 1; ElMessage.info('原型：按条件筛选素材'); }
function onRefresh() { page.value = 1; ElMessage.info('原型：已刷新素材列表'); }
function onUpload() { ElMessage.info('原型：上传素材'); }
function onCustomMetric() { ElMessage.info('原型：自定义指标与排序'); }
function onSyncMedia() { ElMessage.warning('请选择账户'); }
function onDetail(m) { ElMessage.info(`原型：查看素材「${m.name}」详情`); }

function close() { emit('update:modelValue', false); }

function submit() {
  const picked = currentData.value.filter((m) => selected.value.includes(m.id));
  emit('submit', picked);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.mp-body {
  --el-font-size-base: 14px;
  --el-font-size-small: 13px;
  height: 68vh;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #1d2129;
  overflow: hidden;
}

/* 顶部：页签 + 上传素材 */
.mp-head { display: flex; align-items: center; justify-content: space-between; }
.mp-tabs { display: flex; align-items: center; gap: 34px; }
.mp-tab {
  font-size: 16px;
  color: #4e5969;
  cursor: pointer;
  padding-bottom: 10px;
  border-bottom: 2px solid transparent;
}
.mp-tab.active { color: #165dff; border-bottom-color: #165dff; }
.mp-upload { color: #165dff; font-size: 14px; cursor: pointer; }

/* 筛选区 */
.mp-filters { border-bottom: 1px solid #f2f3f5; padding-bottom: 10px; }
.mp-frow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 10px; }
.mp-frow:last-child { margin-bottom: 0; }
.mp-search-group { display: flex; align-items: center; }
.mp-f-select { flex: none; }
.mp-f-name { width: 130px; }
.mp-f-type { width: 130px; }
.mp-f-account { width: 250px; }
.mp-f-mid { width: 190px; }
.mp-f-rule { width: 240px; }
.mp-f-input { width: 210px; }
.mp-f-input :deep(.el-input__wrapper) { border-radius: 4px 0 0 4px; }
.mp-f-btn {
  width: 40px;
  margin-left: -1px;
  padding: 0;
  border-radius: 0 4px 4px 0;
  border-left: none;
  color: #4e5969;
}
.mp-suffix-icon { color: #86909c; cursor: pointer; }
.mp-pre { color: #4e5969; }
/* 「排除素材名」标签 */
.mp-chip {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  margin: 0 10px;
  border: 1px solid #c9cdd4;
  border-radius: 4px;
  background: #fff;
  color: #1d2129;
  font-size: 14px;
  white-space: nowrap;
}
.mp-f-right { margin-left: auto; display: flex; align-items: center; gap: 16px; }
.mp-link { color: #165dff; cursor: pointer; font-size: 14px; }
.mp-f-date { width: 340px !important; }
.mp-warn { display: inline-flex; align-items: center; gap: 4px; color: #86909c; font-size: 13px; }
.mp-warn .el-icon { color: #ff7d00; }

/* 视频时长：区间滑块 */
.mp-dur {
  position: relative;
  flex: none;
  width: 190px;
  height: 32px;
  border: 1px solid #c9cdd4;
  border-radius: 4px;
  background: #fff;
}
.mp-dur :deep(.el-slider) {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 30px;
  margin: 0;
  padding: 0 10px;
}
.mp-dur :deep(.el-slider__runway) { height: 4px; margin: 13px 0; background: #e5e6eb; }
.mp-dur :deep(.el-slider__button) { width: 12px; height: 12px; border-width: 2px; }
/* 未设置区间时与线上一致：仅显示「~」，悬停后出现滑块 */
.mp-dur.empty :deep(.el-slider) { opacity: 0; }
.mp-dur.empty:hover :deep(.el-slider) { opacity: 1; }
.mp-dur-txt {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
  font-size: 13px;
  color: #4e5969;
  background: #fff;
  padding: 0 8px;
  pointer-events: none;
}
.mp-dur-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  color: #c9cdd4;
  cursor: pointer;
}
.mp-dur-clear:hover { color: #86909c; }

/* 指标数据口径 */
.mp-caliber { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 0; }
.mp-caliber-label { color: #4e5969; font-size: 14px; }

/* 工具条 */
.mp-toolbar { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; flex-wrap: wrap; }
.mp-view-toggle { display: flex; }
.mp-view-btn {
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #c9cdd4;
  background: #fff;
  color: #4e5969;
  cursor: pointer;
  font-size: 14px;
}
.mp-view-btn:first-child { border-radius: 4px 0 0 4px; }
.mp-view-btn:last-child { border-radius: 0 4px 4px 0; border-left: none; }
.mp-view-btn.active { color: #165dff; border-color: #165dff; background: #e8f3ff; }
.mp-help { color: #86909c; cursor: pointer; }
.mp-filter-item { display: flex; align-items: center; gap: 6px; }
.mp-num { width: 60px; }
.mp-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.mp-refresh { font-size: 14px; }

/* 内容区 */
.mp-content { flex: 1; overflow-y: auto; padding: 4px 0 8px; }
.mp-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.mp-card { border: 1px solid #e5e6eb; border-radius: 4px; background: #fff; overflow: hidden; }
.mp-card:hover { border-color: #165dff; }
.mp-thumb { position: relative; height: 150px; background: #f7f8fa; }
.mp-card-check { position: absolute; left: 8px; top: 8px; z-index: 2; }
.mp-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mp-cover.tone-0 { background: linear-gradient(135deg, #f2f3f5 0%, #e5e6eb 100%); }
.mp-cover.tone-1 { background: linear-gradient(135deg, #fff1f0 0%, #ffd8d3 100%); }
.mp-cover.tone-2 { background: linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%); }
.mp-cover.tone-3 { background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); }
.mp-cover.tone-4 { background: linear-gradient(135deg, #fffbe6 0%, #ffe9a8 100%); }
.mp-play { font-size: 30px; color: rgba(29, 33, 41, .35); }
.mp-res, .mp-dur-badge {
  position: absolute;
  bottom: 6px;
  padding: 1px 6px;
  background: rgba(29, 33, 41, .6);
  color: #fff;
  font-size: 12px;
  border-radius: 2px;
}
.mp-res { left: 8px; }
.mp-dur-badge { right: 8px; }
.mp-more { position: absolute; right: 8px; top: 8px; color: #86909c; }
.mp-info { padding: 10px 12px 12px; }
.mp-title { display: flex; align-items: baseline; gap: 8px; }
.mp-name { flex: 1; min-width: 0; color: #165dff; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-size { color: #86909c; font-size: 13px; }
.mp-line { color: #4e5969; font-size: 13px; margin-top: 6px; }
.mp-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.mp-badge { padding: 1px 6px; border: 1px solid #c9cdd4; border-radius: 2px; color: #86909c; font-size: 12px; }
.mp-badge.used { color: #00b42a; border-color: #7ce1a8; }
.mp-detail { color: #165dff; cursor: pointer; font-size: 13px; }
.mp-table { width: 100%; }

/* 列表页脚 */
.mp-listfoot { display: flex; align-items: center; gap: 14px; padding-top: 10px; border-top: 1px solid #f2f3f5; }
.mp-tip-inline { color: #86909c; font-size: 12px; }
.mp-pager { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.mp-total { color: #86909c; font-size: 13px; }
.mp-size-select { width: 108px; }

/* 底部操作 */
.mp-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.mp-foot-left { display: flex; align-items: center; gap: 8px; color: #4e5969; font-size: 14px; }
.mp-missing { color: #86909c; }
.mp-foot-right { display: flex; align-items: center; gap: 12px; }
</style>

<style>
/* 弹窗外壳：与线上一致（无内边距头部、body 自行排版） */
.mp-dialog .el-dialog__header { margin-right: 0; padding: 14px 20px 0; }
.mp-dialog .el-dialog__body { padding: 12px 20px 0; }
.mp-dialog .el-dialog__footer { padding: 12px 20px 16px; }
.mp-dialog .el-input__wrapper { box-shadow: 0 0 0 1px #c9cdd4 inset; }
/* 级联面板与线上保持一致的高度 */
.mp-dialog .el-cascader__dropdown { max-height: 320px; }
</style>
