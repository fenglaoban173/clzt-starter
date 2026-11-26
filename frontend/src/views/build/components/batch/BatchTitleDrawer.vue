<template>
  <!--
    标题包抽屉（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 标题包列底「编辑」）
    线上基准：ClDrawer 1016×1080（右侧，非 el-drawer）
      header：页签「手动选取标题 / 动态选取标题」（simple-tabs，放抽屉头部）
      content：白底 padding 16px
        手动选取标题：
          表单项「标题来源」→ 单选【标题包 / 标题库】
          表单项「标题分配方式」→ 单选【全账户复用 / 平均分配 / 分账户选择】（带 ⓘ 说明）+ 灰色说明行
          左侧账户面板 148px（仅「分账户选择」时可见，其余 opacity:0）
          筛选行：优化师 / 拒审次数(比较符+数值) / 建议次数(比较符+数值) / 关键词 / 清空
          工具条：新建标题包 / 随机选择 / 智能优选 / 一键测新 + 右侧「已选：n/上限」
          表格：多选 + 标题包名称 + 拒审次数 + 建议次数 + 创建者 + 近3日点击率 + 近3日消耗
                + 近90天点击率 + 近90天消耗 + 标题数 + 创建时间 + 操作(编辑)
          分页：共 N 条 / 每页条数 / 页码 / 前往 __ 页
        动态选取标题：
          「每个广告标题数量」统一设置 / 分规则设置 + 数值
          「规则分配方式」全账户复用 / 分账户选择 + 说明
          「选取标题不足时」余量广告不搭建 / 循环使用标题
          「动态选取规则」+ 添加动态选取规则 + 空态
      footer：取 消 / 确 定（右下角）
  -->
  <el-drawer
    :model-value="visible"
    size="1016px"
    direction="rtl"
    class="tdw-drawer"
    :with-header="true"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <div class="tdw-tabs">
        <div
          v-for="t in TABS"
          :key="t.name"
          class="tdw-tab"
          :class="{ 'is-active': titleTab === t.name }"
          @click="titleTab = t.name"
        >{{ t.label }}</div>
      </div>
    </template>

    <!-- ============ 手动选取标题 ============ -->
    <div v-show="titleTab === 'manual'" class="tdw-body">
      <el-form :model="form.titles" label-position="left" label-width="160px" size="small" class="tdw-form">
        <!-- 标题来源 -->
        <el-form-item label="标题来源">
          <el-radio-group v-model="form.titles.title_source" size="small">
            <el-radio-button value="TITLE_PACK">标题包</el-radio-button>
            <el-radio-button value="TITLE_LIB">标题库</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 标题分配方式（线上：单选按钮 + ⓘ 气泡 + 下方说明行） -->
        <el-form-item label="标题分配方式">
          <el-radio-group v-model="form.titles.assign_rule" size="small" class="tdw-alloc">
            <el-radio-button v-for="o in TITLE_ASSIGN_RULES" :key="o.value" :value="o.value">
              {{ o.label }}
              <el-tooltip :content="o.desc" placement="top" :show-after="200">
                <span class="tdw-qa">ⓘ</span>
              </el-tooltip>
            </el-radio-button>
          </el-radio-group>
          <div class="tdw-tips">{{ assignTip }}</div>
        </el-form-item>

        <el-form-item label-width="0">
          <div class="tdw-flex">
            <!-- 左侧账户面板（线上 148px；非「分账户选择」时 opacity:0 但仍占位） -->
            <div class="tdw-accounts" :style="{ opacity: isAccountMode ? 1 : 0 }">
              <div
                v-for="(a, i) in titleAccountRows"
                :key="a.accountId || i"
                class="tdw-account"
                :class="{ 'is-active': i === accountIndex }"
                @click="isAccountMode && (accountIndex = i)"
              >
                <span class="tdw-account__name" :title="a.account">{{ a.account }}</span>
              </div>
            </div>

            <!-- 右侧标题包列表 -->
            <div class="tdw-pack">
              <!-- 筛选行 -->
              <div class="tdw-filter">
                <div class="tdw-filter__area">
                  <label>优化师</label>
                  <el-select v-model="filter.optimizer" clearable filterable collapse-tags placeholder="所有优化师" size="small" class="tdw-select">
                    <el-option v-for="o in optimizerOptions" :key="o" :label="o" :value="o" />
                  </el-select>
                </div>
                <div class="tdw-filter__area">
                  <label>拒审次数</label>
                  <div class="tdw-compare">
                    <el-select v-model="filter.rejectOp" size="small" class="tdw-compare__op">
                      <el-option v-for="o in COMPARE_OPS" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                    <el-input-number v-model="form.titles.reject_count" :min="0" :max="999" :controls="false" size="small" class="tdw-compare__val" />
                  </div>
                </div>
                <div class="tdw-filter__area">
                  <label>建议次数</label>
                  <div class="tdw-compare">
                    <el-select v-model="filter.suggestOp" size="small" class="tdw-compare__op">
                      <el-option v-for="o in COMPARE_OPS" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                    <el-input-number v-model="form.titles.suggest_count" :min="0" :max="999" :controls="false" size="small" class="tdw-compare__val" />
                  </div>
                </div>
                <div class="tdw-filter__area tdw-filter__area--search">
                  <el-input v-model="filter.keyword" placeholder="请输入关键词" size="small" class="tdw-search" @keyup.enter="onSearch">
                    <template #suffix>
                      <el-icon class="tdw-search__icon" @click="onSearch"><Search /></el-icon>
                    </template>
                  </el-input>
                </div>
                <a class="tdw-clear" @click="onReset">清空</a>
              </div>

              <!-- 工具条 -->
              <div class="tdw-toolbar">
                <el-button type="primary" size="small" class="tdw-btn tdw-btn--120" @click="newTitlePackVisible = true">
                  <span class="tdw-plus">＋</span>新建标题包
                </el-button>
                <div class="tdw-toolbar__ml16">
                  <el-button plain size="small" class="tdw-btn tdw-btn--120" :disabled="!limitCount" @click="titleRandomPick('随机选择')">随机选择</el-button>
                  <el-button plain size="small" class="tdw-btn tdw-btn--120" :disabled="!limitCount" @click="titleRandomPick('智能优选')">智能优选</el-button>
                  <el-button plain size="small" class="tdw-btn tdw-btn--120" :disabled="!limitCount" @click="titleRandomPick('一键测新')">一键测新</el-button>
                </div>
                <span class="tdw-selected">已选：<span class="tdw-selected__num">{{ picked.length }}</span>/{{ limitCount }}</span>
              </div>

              <!-- 标题包表（线上 11 列 + 多选 + 操作） -->
              <el-table
                ref="packTableRef"
                :data="packRows"
                size="small"
                border
                max-height="505"
                class="tdw-table"
                @selection-change="onSelectionChange"
              >
                <el-table-column type="selection" width="50" align="center" fixed />
                <el-table-column label="标题包名称" prop="name" width="120" fixed show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-popover placement="right" trigger="hover" :width="220">
                      <p v-for="(t, i) in row.titles || []" :key="i" class="tdw-pop__line">{{ t }}</p>
                      <p v-if="!(row.titles || []).length" class="tdw-pop__line">—</p>
                      <template #reference>
                        <span class="tdw-pop__ref">{{ row.name }}</span>
                      </template>
                    </el-popover>
                  </template>
                </el-table-column>
                <el-table-column label="拒审次数" prop="reject" align="center">
                  <template #default="{ row }">
                    <span v-if="row.reject && row.reject !== '--'" class="tdw-tag tdw-tag--red">{{ row.reject }}次</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="建议次数" prop="suggest" align="center">
                  <template #default="{ row }">
                    <span v-if="row.suggest && row.suggest !== '--'" class="tdw-tag tdw-tag--red">{{ row.suggest }}次</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="创建者" prop="creator" width="100" show-overflow-tooltip />
                <el-table-column label="近3日点击率" prop="ctr3" sortable align="right" min-width="110" />
                <el-table-column label="近3日消耗" prop="cost3" sortable align="right" min-width="110" />
                <el-table-column label="近90天点击率" prop="ctr90" sortable align="right" min-width="120" />
                <el-table-column label="近90天消耗" prop="cost90" sortable align="right" min-width="110" />
                <el-table-column label="标题数" prop="count" align="right" width="80" />
                <el-table-column label="创建时间" prop="created" width="150" sortable show-overflow-tooltip />
                <el-table-column label="操作" width="80" align="center" fixed="right">
                  <template #default>
                    <el-button link type="primary" size="small">编辑</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页 -->
              <div class="tdw-pager">
                <el-pagination
                  v-model:current-page="page"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="packRows.length"
                  :pager-count="5"
                  layout="total, sizes, prev, pager, next, jumper"
                />
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- ============ 动态选取标题 ============ -->
    <div v-show="titleTab === 'dynamic'" class="tdw-body">
      <el-form :model="form.titles" label-position="left" label-width="160px" size="small" class="tdw-form">
        <el-form-item label="每个广告标题数量">
          <el-radio-group v-model="form.titles.dyn_count_mode" size="small">
            <el-radio-button value="UNIFIED">统一设置</el-radio-button>
            <el-radio-button value="RULE">分规则设置</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="每个广告标题数量">
          <el-input-number v-model="form.titles.dyn_count" :min="1" :max="50" size="small" />
        </el-form-item>
        <el-form-item label="规则分配方式">
          <el-radio-group v-model="form.titles.dyn_rule_match" size="small">
            <el-radio-button value="ALL">全账户复用</el-radio-button>
            <el-radio-button value="PER_ACCOUNT">分账户选择</el-radio-button>
          </el-radio-group>
          <div class="tdw-tips">所有账户都使用一样的规则</div>
        </el-form-item>
        <el-form-item label="选取标题不足时">
          <el-radio-group v-model="form.titles.dyn_shortage" size="small">
            <el-radio-button value="SKIP">余量广告不搭建</el-radio-button>
            <el-radio-button value="CYCLE">循环使用标题</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div class="tdw-section">动态选取规则</div>
        <el-button type="primary" size="small" @click="addTitleDynRule">添加动态选取规则</el-button>
        <el-empty v-if="!form.titles.dyn_rules.length" description="暂无动态选取规则，点击添加" :image-size="80" />
        <div v-for="(r, ri) in form.titles.dyn_rules" :key="ri" class="tdw-dynrule">
          <el-select v-model="r.title_source" placeholder="标题来源" style="width: 180px">
            <el-option v-for="o in TITLE_SOURCES" :key="o.value" :value="o.value" :label="o.label" />
          </el-select>
          <span class="tdw-dynrule__label">每个广告使用</span>
          <el-input-number v-model="r.count" :min="0" :max="50" size="small" />
          <el-button link type="danger" @click="form.titles.dyn_rules.splice(ri, 1)">删除</el-button>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="tdw-foot">
        <el-button size="small" @click="visible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="onConfirm">确 定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { TITLE_ASSIGN_RULES as FALLBACK_TITLE_ASSIGN_RULES, TITLE_SOURCES as FALLBACK_TITLE_SOURCES } from '@/mock/data';

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露，这里直接取用，不重复声明 */
const batch = inject('batch');
const {
  form,
  titleVisible,
  titleTab,
  titlePackRows,
  titleAccountRows,
  titlePacks,
  clearTitlePicked,
  titleRandomPick,
  addTitleDynRule,
  newTitlePackVisible,
  isUni,
} = batch;

/* 常量：优先取 batch（Create.vue provide），未提供时回落到 @/mock/data 的同一份定义 */
const TITLE_ASSIGN_RULES = batch.TITLE_ASSIGN_RULES || FALLBACK_TITLE_ASSIGN_RULES;
const TITLE_SOURCES = batch.TITLE_SOURCES || FALLBACK_TITLE_SOURCES;

const props = defineProps({
  /** v-model：抽屉显隐；不传时直接用 Create.vue provide 的 titleVisible */
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/** 显隐：外部 v-model 优先；未传时回落 batch 内部状态 */
const visible = computed({
  get: () => (props.modelValue === undefined ? !!titleVisible.value : props.modelValue),
  set: (v) => {
    if (titleVisible) titleVisible.value = v;
    emit('update:modelValue', v);
  },
});

/** 线上抽屉页签 */
const TABS = [
  { name: 'manual', label: '手动选取标题' },
  { name: 'dynamic', label: '动态选取标题' },
];

/** 线上比较符选项（拒审次数 / 建议次数） */
const COMPARE_OPS = [
  { value: '>', label: '大于' },
  { value: '>=', label: '大于或等于' },
  { value: '=', label: '等于' },
  { value: '<=', label: '小于或等于' },
  { value: '<', label: '小于' },
];

const filter = ref({
  optimizer: '',
  rejectOp: '<=',
  suggestOp: '<=',
  keyword: '',
});
const picked = ref([]);
const page = ref(1);
const pageSize = ref(10);
const accountIndex = ref(0);
const packTableRef = ref(null);

/** 优化师下拉（线上来自当前账号的优化师列表，本地取账户表里的优化师去重） */
const optimizerOptions = computed(() => {
  const list = (titleAccountRows.value || []).map((a) => a.optimizer).filter(Boolean);
  return Array.from(new Set(list));
});

/** 标题分配方式 = 分账户选择（本地 PER_ACCOUNT） */
const isAccountMode = computed(() => form?.titles?.assign_rule === 'PER_ACCOUNT');

/** 标题分配方式说明行（线上取当前选中项的 tips） */
const assignTip = computed(() => {
  const cur = TITLE_ASSIGN_RULES.find((o) => o.value === form?.titles?.assign_rule);
  return cur ? cur.desc : '';
});

/** 上限：线上 = 总配额 - 已选（标准版 200 / 全域 100） */
const limitCount = computed(() => {
  const total = (isUni && isUni.value) ? 100 : 200;
  const used = (form?.ad?.title_packs || []).length;
  return Math.max(0, total - used);
});

/** 表格数据（按关键词过滤） */
const packRows = computed(() => {
  const kw = String(filter.value.keyword || '').trim().toLowerCase();
  const rows = titlePackRows.value || [];
  if (!kw) return rows;
  return rows.filter((r) => Object.values(r || {}).some((v) => String(v).toLowerCase().includes(kw)));
});

watch(visible, (v) => {
  if (v) {
    filter.value = { optimizer: '', rejectOp: '<=', suggestOp: '<=', keyword: '' };
    picked.value = [];
    page.value = 1;
    accountIndex.value = 0;
  }
}, { immediate: true });

function onSelectionChange(rows) {
  picked.value = rows;
}

function onSearch() {
  page.value = 1;
}

function onReset() {
  filter.value = { optimizer: '', rejectOp: '<=', suggestOp: '<=', keyword: '' };
  form.titles.reject_count = 0;
  form.titles.suggest_count = 0;
  page.value = 1;
}

function onConfirm() {
  const names = picked.value.map((r) => r.name).filter(Boolean);
  form.titles.title_pack_ids = names;
  // 若与本地标题包资产同名则回写到已选（保持列卡「标题包」联动）
  const ids = (titlePacks.value || [])
    .filter((t) => names.includes(t.title))
    .map((t) => t.id);
  if (ids.length) form.ad.title_packs = ids;
  visible.value = false;
}
</script>

<style scoped>
/* ============ 抽屉头部页签（线上 simple-tabs） ============ */
.tdw-tabs { display: flex; align-items: center; gap: 32px; height: 50px; }
.tdw-tab {
  position: relative;
  height: 50px;
  font-size: 16px;
  line-height: 50px;
  color: #333;
  cursor: pointer;
}
.tdw-tab.is-active { color: #197afb; }
.tdw-tab.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #197afb;
}

.tdw-body { padding: 16px; background: #fff; }
/* 线上：label 宽 160、左对齐、14px #666 */
.tdw-form :deep(.el-form-item__label) {
  width: 160px;
  padding-bottom: 0;
  font-size: 14px;
  line-height: 32px;
  color: #666;
  text-align: left;
}
.tdw-form :deep(.el-form-item) { margin-bottom: 20px; }
.tdw-form :deep(.el-radio-button__inner) {
  padding: 9px 12px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
  border-radius: 0;
  box-shadow: none;
}
.tdw-form :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.tdw-form :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }
.tdw-form :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  color: #197afb;
  background: #d6eaff;
  border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
/* 线上：ⓘ 气泡图标 */
.tdw-qa {
  margin-left: 4px;
  font-size: 12px;
  color: #86909c;
  cursor: help;
}
/* 线上：说明行 12px #999 */
.tdw-tips {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #999;
}

.tdw-flex { display: flex; align-items: flex-start; gap: 0; width: 100%; }
/* 线上：左侧账户面板 148px */
.tdw-accounts {
  flex: 0 0 148px;
  width: 148px;
  padding-right: 12px;
  transition: opacity .15s;
}
.tdw-account {
  padding: 6px 8px;
  font-size: 12px;
  line-height: 18px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tdw-account.is-active { color: #197afb; background: #f2f7ff; }
.tdw-pack { flex: 1; min-width: 0; }

/* ============ 筛选行（线上 mg-filter-wrapper） ============ */
.tdw-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-bottom: 16px;
}
.tdw-filter__area { display: flex; align-items: center; gap: 8px; }
.tdw-filter__area > label { font-size: 12px; color: #4e5969; }
.tdw-select { width: 160px; }
.tdw-compare { display: flex; align-items: center; }
.tdw-compare__op { flex: none; width: 104px; }
.tdw-compare__val { flex: none; width: 140px; }
.tdw-compare__val :deep(.el-input__inner) { text-align: left; }
.tdw-filter__area--search { flex: 1; min-width: 240px; max-width: 360px; }
.tdw-search { width: 100%; }
.tdw-search__icon { cursor: pointer; color: #c0c4cc; }
.tdw-clear {
  font-size: 12px;
  color: #197afb;
  cursor: pointer;
  text-decoration: none;
}

/* ============ 工具条 ============ */
.tdw-toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.tdw-toolbar__ml16 { display: flex; gap: 16px; }
.tdw-btn { font-size: 12px; }
.tdw-btn--120 { min-width: 120px; }
.tdw-plus { margin-right: 4px; font-weight: 700; }
/* 线上：已选 n/上限 */
.tdw-selected { margin-left: auto; font-size: 12px; color: #4e5969; }
.tdw-selected__num { color: #197afb; font-weight: 600; }

/* ============ 表格 ============ */
.tdw-table { width: 100%; }
.tdw-table :deep(.el-table__header th .cell) { font-size: 12px; color: #333; }
.tdw-table :deep(.el-table__body td .cell) { font-size: 12px; color: #606266; }
.tdw-pop__ref { cursor: pointer; color: #197afb; }
.tdw-pop__line { margin: 0; font-size: 12px; line-height: 18px; color: #606266; }
/* 线上：拒审/建议次数红色标签 */
.tdw-tag {
  display: inline-block;
  padding: 0 6px;
  font-size: 12px;
  line-height: 20px;
  border-radius: 3px;
}
.tdw-tag--red { color: #f53f3f; background: #ffece8; }

/* ============ 分页 ============ */
.tdw-pager { display: flex; justify-content: flex-start; margin-top: 12px; }

/* ============ 动态选取规则 ============ */
.tdw-section {
  margin: 4px 0 12px;
  padding-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  border-bottom: 1px solid #f2f3f5;
}
.tdw-dynrule { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.tdw-dynrule__label { font-size: 13px; color: #4e5969; }

/* ============ 底部按钮 ============ */
.tdw-foot { display: flex; justify-content: flex-end; gap: 16px; }
</style>

<style>
/* 抽屉外壳（teleport 到 body，需全局样式）
   线上实测：抽屉 1016px 固定右侧；抽屉底 #f0f2f5；header/footer #fff + 下/上边线 #e8eaec；
   header 高 50px、padding 0 16px；关闭按钮为左侧蓝色方块 30×30 */
.tdw-drawer { background: #f0f2f5; }
.tdw-drawer .el-drawer__header {
  height: 50px;
  margin-bottom: 0;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
}
.tdw-drawer.rtl .el-drawer__close-btn {
  order: -1;
  width: 30px;
  height: 30px;
  margin: 0 12px 0 0;
  font-size: 14px;
  color: #fff;
  background: #197afb;
  border-radius: 4px;
}
.tdw-drawer .el-drawer__body { padding: 0; background: #fff; }
.tdw-drawer .el-drawer__footer {
  padding: 12px 16px 24px;
  background: #fff;
  border-top: 1px solid #e8eaec;
}
/* 线上页脚按钮 80×32（12px/500，圆角 3px） */
.tdw-drawer .el-drawer__footer .el-button {
  width: 80px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
.tdw-drawer .el-button--primary:not(.is-link) { background: #197afb; border-color: #197afb; }
.tdw-drawer .el-button--primary:not(.is-link):hover { background: #4a9bff; border-color: #4a9bff; }
/* 小尺寸控件统一 32px（EP 的 small 为 24px，线上为 32px） */
.tdw-drawer .el-button--small { height: 32px; }
.tdw-drawer .el-radio-button--small .el-radio-button__inner { height: 32px; }
.tdw-drawer .el-input--small .el-input__wrapper { min-height: 32px; }
.tdw-drawer .el-input-number--small { width: 100%; }
.tdw-drawer .el-input-number--small .el-input__inner { height: 30px; font-size: 12px; text-align: left; }
</style>
