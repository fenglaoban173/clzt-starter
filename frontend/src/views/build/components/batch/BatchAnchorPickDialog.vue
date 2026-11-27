<template>
  <!-- 选择原生锚点（对齐线上 cl.mobgi.com 广告信息 → 原生锚点 →「选择原生锚点」按钮）
       * 960×，标题「选择原生锚点」
       * 左：账户栏（单选，首条默认选中）；右：筛选行 + 项目数/广告数 + 锚点表格 + 已选面板 + 分页
       * 空态：「当前账户无可用的锚点，去新建>>」 -->
  <el-dialog
    :model-value="modelValue"
    title="选择原生锚点"
    width="960px"
    class="anp-dialog"
    align-center
    append-to-body
    :z-index="2600"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="anp">
      <!-- 左：账户栏 -->
      <div class="anp-accts">
        <div
          v-for="(a, i) in accounts"
          :key="a.id"
          class="anp-acct"
          :class="{ 'is-active': active === i }"
          :title="a.name"
          @click="active = i"
        >
          <span class="anp-acct__name">{{ a.name }}</span>
          <el-popover placement="top" trigger="hover" :width="260" popper-class="anp-pop">
            <template #reference>
              <el-icon class="anp-acct__q"><QuestionFilled /></el-icon>
            </template>
            <span class="anp-pop__text">当前账户可选的锚点资产，切换账户可查看该账户下的锚点</span>
          </el-popover>
        </div>
      </div>

      <!-- 右：内容 -->
      <div class="anp-main">
        <div class="anp-filter">
          <el-input v-model="keyword" size="small" class="anp-kw" placeholder="请输入关键词" />
          <el-button size="small" class="anp-btn anp-btn--plain" @click="onSearch">查 询</el-button>
          <el-button size="small" class="anp-btn anp-btn--outline" @click="onSync">同步原生锚点</el-button>
          <el-button size="small" class="anp-btn anp-btn--outline" @click="onClearAll">清空所有资产</el-button>
          <el-button size="small" class="anp-btn anp-btn--outline" @click="onQuickPick">多账户快速选择</el-button>
        </div>

        <div class="anp-cols">
          <div class="anp-left">
            <div class="anp-meta">项目数: {{ projectCount }}　广告数: {{ adCount }}</div>
            <div class="anp-table-wrap">
              <el-table
                :data="rows"
                height="100%"
                class="anp-table"
                highlight-current-row
                :row-class-name="rowClass"
                @row-click="onRowClick"
              >
                <el-table-column label="锚点名称（ID）" min-width="170">
                  <template #default="{ row }">
                    <div class="anp-cell">
                      <span class="anp-cell__name">{{ row.name }}</span>
                      <span class="anp-cell__id">{{ row.id }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="锚点类型" width="110" />
                <el-table-column prop="share" label="锚点共享关系" width="124" />
                <template #empty>
                  <div class="anp-empty">
                    <span>当前账户无可用的锚点</span>
                  </div>
                </template>
              </el-table>
            </div>
            <div class="anp-pager">
              <span class="anp-pager__arrow is-disabled">‹</span>
              <span class="anp-pager__num">1</span>
              <span class="anp-pager__arrow is-disabled">›</span>
            </div>
          </div>

          <div class="anp-sel">
            <div class="anp-sel__head">
              <span>已选({{ selected.length }})</span>
              <span class="anp-sel__clear" @click="selected = []">
                清空<el-icon class="anp-sel__del"><CircleClose /></el-icon>
              </span>
            </div>
            <div class="anp-sel__body">
              <div v-for="s in selected" :key="s.id" class="anp-sel__item">
                <span class="anp-sel__name" :title="s.name">{{ s.name }}</span>
                <el-icon class="anp-sel__x" @click="removeSelected(s)"><Close /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button class="anp-foot-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="anp-foot-btn anp-foot-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { CircleClose, Close, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

const accounts = ref([
  { id: 'a1', no: '1373758649506203', name: '央广-雷盟-知乎-APP内付费-124-7923355', short: '央广-雷盟-知乎-APP内付费' },
  { id: 'a2', no: '1373758652234324', name: '央广-雷盟-知乎-APP内付费-124-7923357', short: '央广-雷盟-知乎-APP内付费' },
  { id: 'a3', no: '1373758652954056', name: '央广-雷盟-知乎-APP内付费-124-7923358', short: '央广-雷盟-知乎-APP内付费' },
  { id: 'a4', no: '1373758651659018', name: '央广-雷盟-知乎-APP内付费-124-7923359', short: '央广-雷盟-知乎-APP内付费' },
]);
const active = ref(0);

/* 点「同步原生锚点」后按账户拉取的模拟数据（本地 mock，用于演示选中 → 提交） */
const ANCHOR_MOCK = {
  a1: [
    { id: '1908821101', name: '知乎-原生锚点-女频-01', type: '应用下载', share: '项目共享' },
    { id: '1908821102', name: '知乎-原生锚点-男频-02', type: '应用下载', share: '账户共享' },
    { id: '1908821103', name: '知乎-原生锚点-落地页-03', type: '落地页', share: '项目共享' },
  ],
  a2: [
    { id: '1908821104', name: '知乎-原生锚点-新客-04', type: '应用下载', share: '项目共享' },
    { id: '1908821105', name: '知乎-原生锚点-回访-05', type: '落地页', share: '项目共享' },
  ],
  a3: [
    { id: '1908821106', name: '知乎-原生锚点-活动-06', type: '应用下载', share: '账户共享' },
    { id: '1908821107', name: '知乎-原生锚点-活动-07', type: '落地页', share: '项目共享' },
    { id: '1908821108', name: '知乎-原生锚点-活动-08', type: '应用下载', share: '项目共享' },
  ],
  a4: [
    { id: '1908821109', name: '知乎-原生锚点-测试-09', type: '应用下载', share: '项目共享' },
  ],
};

const keyword = ref('');
const synced = ref(false);
const rows = computed(() => (synced.value ? ANCHOR_MOCK[accounts.value[active.value].id] || [] : []));
/* 已选按账户分别存放，支持跨账户累计（多账户快速选择 / 切换账户后仍保留） */
const pickedMap = ref({});
const curAccountId = computed(() => accounts.value[active.value].id);
const currentPicked = computed(() => pickedMap.value[curAccountId.value] || []);
const selected = computed(() => accounts.value.flatMap((a) => pickedMap.value[a.id] || []));
const projectCount = computed(() => (synced.value ? 1 : 1));
const adCount = ref(1);

function onSearch() {
  ElMessage.info('已按关键词筛选原生锚点');
}
/* 新增：同步原生锚点 —— 把每个账户下的原生锚点拉回来，给表格用 */
function onSync() {
  if (synced.value) {
    ElMessage.info('原生锚点已同步');
    return;
  }
  synced.value = true;
  const total = Object.values(ANCHOR_MOCK).reduce((n, arr) => n + arr.length, 0);
  ElMessage.success(`已同步 ${total} 个原生锚点，可勾选后提交`);
}
function onClearAll() {
  pickedMap.value = {};
  ElMessage.success('已清空所有资产');
}
/* 多账户快速选择：每个账户默认勾选该账户列表里的一条到已选区 */
function onQuickPick() {
  synced.value = true;
  const map = {};
  accounts.value.forEach((a) => {
    const list = ANCHOR_MOCK[a.id] || [];
    if (list.length) map[a.id] = [list[0]];
  });
  pickedMap.value = map;
  ElMessage.success(`已为 ${Object.keys(map).length} 个账户各勾选 1 个原生锚点`);
}
function rowClass({ row }) {
  return currentPicked.value.some((s) => s.id === row.id) ? 'is-picked' : '';
}
function onRowClick(row) {
  const list = [...currentPicked.value];
  const hit = list.findIndex((s) => s.id === row.id);
  if (hit >= 0) list.splice(hit, 1);
  else list.push(row);
  pickedMap.value = { ...pickedMap.value, [curAccountId.value]: list };
}
function removeSelected(row) {
  const map = { ...pickedMap.value };
  Object.keys(map).forEach((k) => {
    map[k] = (map[k] || []).filter((s) => s.id !== row.id);
  });
  pickedMap.value = map;
}
function onConfirm() {
  /* 回传时带上所属账户，供抽屉按「账户 / 名称」列表回显 */
  const list = accounts.value.flatMap((a) =>
    (pickedMap.value[a.id] || []).map((r) => ({ ...r, account: a.name, accountId: a.no || a.id }))
  );
  emit('confirm', list);
  emit('update:modelValue', false);
}

/* 每次重新打开都从当前账户、未同步、无已选开始 */
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      active.value = 0;
      synced.value = false;
      pickedMap.value = {};
      keyword.value = '';
    }
  }
);
</script>

<style scoped>
.anp {
  display: flex;
  height: 500px;
  border: 1px solid #e8eaec;
  background: #fff;
}
.anp-accts {
  width: 194px;
  flex: none;
  border-right: 1px solid #e8eaec;
  overflow-y: auto;
}
.anp-acct {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 62px;
  padding: 0 10px;
  cursor: pointer;
}
.anp-acct.is-active {
  background: #eef4ff;
}
.anp-acct:hover {
  background: #f7f8fa;
}
.anp-acct.is-active:hover {
  background: #eef4ff;
}
.anp-acct__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #1d2129;
}
.anp-acct__q {
  flex: none;
  font-size: 13px;
  color: #b1b7c3;
  cursor: pointer;
}
.anp-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.anp-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}
.anp-kw {
  width: 387px;
}
.anp-btn {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  color: #1d2129;
  border-color: #d9dbe1;
  background: #fff;
}
.anp-btn--outline {
  color: #197afb;
  border-color: #197afb;
}
.anp-btn--outline:hover {
  color: #197afb;
  border-color: #4a95fc;
  background: #f2f7ff;
}
.anp-cols {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.anp-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.anp-meta {
  font-size: 13px;
  color: #1d2129;
  line-height: 26px;
}
.anp-table-wrap {
  flex: 1;
  min-height: 0;
}
.anp-table {
  height: 100%;
}
.anp-table :deep(.el-table__header th) {
  background: #f7f8fa;
  color: #4e5969;
  font-weight: 400;
  height: 34px;
  padding: 0 8px;
}
.anp-table :deep(.el-table__body td) {
  padding: 0 8px;
  height: 44px;
}
.anp-table :deep(th .cell),
.anp-table :deep(td .cell) {
  white-space: nowrap;
}
.anp-table :deep(.el-table__row.is-picked > td) {
  background: #eef4ff;
}
.anp-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.anp-cell__name {
  font-size: 13px;
  color: #1d2129;
}
.anp-cell__id {
  font-size: 12px;
  color: #8a8f99;
}
.anp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #4e5969;
  padding: 20px 0;
}
.anp-link {
  color: #197afb;
  cursor: pointer;
}
.anp-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 40px;
  flex: none;
}
.anp-pager__arrow {
  color: #c9cdd4;
  font-size: 13px;
}

.anp-pager__num {
  width: 22px;
  text-align: center;
  font-size: 12px;
  color: #4e5969;
}
.anp-sel {
  width: 198px;
  flex: none;
  border: 1px solid #e8eaec;
  display: flex;
  flex-direction: column;
}
.anp-sel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 10px;
  background: #f7f8fa;
  border-bottom: 1px solid #e8eaec;
  font-size: 13px;
  color: #1d2129;
}
.anp-sel__clear {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #197afb;
  cursor: pointer;
}
.anp-sel__del {
  font-size: 13px;
  color: #197afb;
}
.anp-sel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
}
.anp-sel__item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px;
  font-size: 13px;
  border-radius: 3px;
}
.anp-sel__item:hover {
  background: #f7f8fa;
}
.anp-sel__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.anp-sel__x {
  flex: none;
  color: #b1b7c3;
  cursor: pointer;
}
.anp-foot-btn {
  width: 108px;
  height: 32px;
  font-size: 14px;
  border-color: #d9dbe1;
  color: #1d2129;
}
.anp-foot-btn--primary {
  background: #197afb;
  border-color: #197afb;
  color: #fff;
}
.anp-foot-btn--primary:hover {
  background: #4a95fc;
  border-color: #4a95fc;
  color: #fff;
}
</style>



