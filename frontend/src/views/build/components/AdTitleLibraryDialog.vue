<template>
  <el-dialog
    :model-value="modelValue"
    width="1320px"
    top="6vh"
    class="atl-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <template #header="{ close }">
      <div class="atl-head">
        <span class="atl-tab active">标题库</span>
      </div>
    </template>

    <div class="atl-body">
      <!-- 查询条件：分类 + 关键词 -->
      <div class="atl-filters">
        <span class="atl-chip">分类</span>
        <el-select v-model="f.category" class="atl-select" placeholder="全部" @change="page = 1">
          <el-option label="全部" value="" />
          <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
        <el-input v-model="f.keyword" class="atl-input" placeholder="请输入关键词" @keyup.enter="page = 1">
          <template #suffix><el-icon class="atl-suffix"><Search /></el-icon></template>
        </el-input>
        <el-button class="atl-btn" @click="page = 1"><el-icon><Search /></el-icon></el-button>
        <a class="atl-link" @click="clearFilter">清空</a>
      </div>

      <!-- 工具条 -->
      <div class="atl-toolbar">
        <el-button type="primary" class="atl-new" @click="openCreate">+ 新建标题</el-button>
        <span class="atl-count">已选: {{ selected.length }}/10</span>
      </div>

      <!-- 标题列表 -->
      <el-table
        :data="pageRows"
        border
        size="small"
        class="atl-table"
        :row-key="(r) => r.id"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" :selectable="(r) => canSelect(r)" />
        <el-table-column prop="text" label="标题名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="creator" label="创建者" width="100" />
        <el-table-column prop="d3click" label="近3日点击" width="115" align="right" sortable />
        <el-table-column prop="d3cost" label="近3日消耗" width="105" align="right" sortable />
        <el-table-column prop="d90click" label="近90天点击" width="125" align="right" sortable />
        <el-table-column prop="d90cost" label="近90天消耗" width="115" align="right" sortable />
        <el-table-column prop="adCount" label="关联广告数" width="105" align="right" sortable />
        <el-table-column prop="createdAt" label="创建时间" width="130" sortable />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="primary" class="atl-op" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="atl-pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50]"
          :total="filtered.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :disabled="!selected.length" @click="confirm">确定</el-button>
    </template>

    <!-- 新建 / 编辑标题 -->
    <AdTitleEditorDialog
      ref="editorRef"
      v-model="editorVisible"
      :mode="editorMode"
      :title-text="editorText"
      @confirm="onEditorConfirm"
      @wordpack="wordpackVisible = true"
    />

    <!-- 公共词包 -->
    <AdWordPackDialog v-model="wordpackVisible" @insert="onWordPackInsert" />
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import AdTitleEditorDialog from './AdTitleEditorDialog.vue';
import AdWordPackDialog from './AdWordPackDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 主弹窗已选中的标题（回显勾选状态）
  selected: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const CATEGORIES = ['短剧', '小说', '通用'];

const SEEDS = [
  '火爆短剧来袭好看又上头的短剧', '短剧全集免费观看', '一秒就上瘾的超爽短剧', '2025火爆热播短剧推荐',
  '新剧抢先看抢先尝鲜', '热搜短剧抢先看', '都市爽剧逆袭归来', '霸总甜宠日常更新中', '重生之我在都市当大佬',
  '古风言情虐恋来袭', '穿越王妃爆笑日常', '末世求生囤货指南', '悬疑推理不容错过', '萌宝助攻甜妻上位',
  '逆袭归来打脸渣男', '神医下山救都市', '玄学大佬在线算命', '都市修仙高手下山', '重生之豪门弃女归来',
];
const CREATORS = ['杨语檬', '林一诺', '赵小九'];

/** 标题库假数据（线上共 602 条，这里按 602 条生成，字段与线上一致） */
const LIB = Array.from({ length: 602 }, (_, i) => {
  const base = SEEDS[i % SEEDS.length];
  const suffix = i < SEEDS.length ? '' : `（${Math.floor(i / SEEDS.length) + 1}）`;
  const text = `${base}${suffix}`;
  return {
    id: `T${1000 + i}`,
    text,
    category: CATEGORIES[i % CATEGORIES.length],
    creator: CREATORS[i % CREATORS.length],
    d3click: (i * 7) % 101,
    d3cost: ((i * 13) % 90) / 10,
    d90click: (i * 11) % 101,
    d90cost: ((i * 17) % 900) / 10,
    adCount: 6 + (i % 3),
    createdAt: `2026-11-${String(((i % 28) + 1)).padStart(2, '0')} 10:00`,
  };
});

const f = ref({ category: '', keyword: '' });
const page = ref(1);
const size = ref(10);
const picked = ref([]);
const editorVisible = ref(false);
const editorMode = ref('create');
const editorText = ref('');
const editingId = ref('');
const wordpackVisible = ref(false);
/** 新建/编辑标题弹窗实例（R78：词包占位符插入到输入框光标处） */
const editorRef = ref(null);

const filtered = computed(() => {
  const kw = String(f.value.keyword || '').trim();
  return LIB.filter((r) => {
    if (f.value.category && r.category !== f.value.category) return false;
    if (kw && !r.text.includes(kw)) return false;
    return true;
  });
});

const pageRows = computed(() => {
  const start = (page.value - 1) * size.value;
  return filtered.value.slice(start, start + size.value);
});

const selected = computed(() => picked.value);

function init() {
  f.value = { category: '', keyword: '' };
  page.value = 1;
  size.value = 10;
  picked.value = [];
  // 回显主弹窗已选标题
  const pre = (props.selected || []).filter((t) => LIB.some((r) => r.text === t.text));
  picked.value = pre.map((t) => LIB.find((r) => r.text === t.text));
}

function clearFilter() {
  f.value = { category: '', keyword: '' };
  page.value = 1;
}

function canSelect(row) {
  return picked.value.some((r) => r.id === row.id) || picked.value.length < 10;
}

function onSelectionChange(rows) {
  picked.value = rows;
}

function openCreate() {
  editorMode.value = 'create';
  editorText.value = '';
  editingId.value = '';
  editorVisible.value = true;
}

function openEdit(row) {
  editorMode.value = 'edit';
  editorText.value = row.text;
  editingId.value = row.id;
  editorVisible.value = true;
}

function onEditorConfirm({ text, category }) {
  const row = LIB.find((r) => r.id === editingId.value);
  if (row) {
    row.text = text;
    if (category) row.category = category;
    ElMessage.success('标题已更新（原型：仅本地生效）');
  } else {
    LIB.unshift({
      id: `T${2000 + LIB.length}`,
      text,
      category: category || '通用',
      creator: '杨语檬',
      d3click: 0,
      d3cost: 0,
      d90click: 0,
      d90cost: 0,
      adCount: 0,
      createdAt: '2026-11-20 10:00',
    });
    ElMessage.success('标题已创建（原型：仅本地生效）');
  }
}

/** 插入动态词包：占位符 {词包名} 插入到新建/编辑标题输入框的光标处 */
function onWordPackInsert(pack) {
  editorRef.value?.insertWordPack(pack);
}

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  const list = picked.value.map((r) => ({ id: r.id, text: r.text }));
  emit('confirm', list);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.atl-body { --el-font-size-base: 14px; font-size: 14px; color: #606266; }
.atl-head { display: flex; align-items: center; }
.atl-tab { font-size: 16px; font-weight: 700; color: #333; padding-bottom: 8px; border-bottom: 2px solid #197afb; }

.atl-filters { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.atl-chip { width: 54px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #dcdfe6; border-radius: 4px; color: #606266; font-size: 13px; background: #fff; }
.atl-select { width: 220px; }
.atl-input { width: 220px; }
.atl-btn { width: 32px; height: 32px; padding: 0; }
.atl-suffix { cursor: pointer; }
.atl-link { color: #197afb; cursor: pointer; font-size: 13px; margin-left: 6px; }

.atl-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.atl-new { height: 32px; padding: 0 16px; font-size: 12px; }
.atl-count { color: #606266; font-size: 13px; }

.atl-table :deep(th) { background: #f5f7fa; }
.atl-op { font-size: 12px; }

.atl-pager { display: flex; justify-content: flex-end; padding-top: 12px; }
</style>

<style>
.atl-dialog { padding: 0; }
.atl-dialog .el-dialog__header { margin-right: 0; padding: 14px 24px 0; }
.atl-dialog .el-dialog__body { padding: 16px 24px 20px; }
.atl-dialog .el-dialog__footer { padding: 0 24px 20px; }
.atl-dialog .el-dialog__footer .el-button { width: 80px; height: 32px; }
.atl-dialog .el-dialog__footer .el-button + .el-button { margin-left: 16px; }
.atl-dialog .el-dialog__footer .el-button--primary { background: #197afb; border-color: #197afb; }
.atl-dialog .el-dialog__footer .el-button--primary:hover { background: #4a9bff; border-color: #4a9bff; }
.atl-dialog .el-dialog__footer .el-button:not(.el-button--primary) { border-color: #d0d0d0; color: #666; }
.atl-dialog .el-button--small { height: 32px; }
.atl-dialog .el-pagination { --el-pagination-button-bg-color: #f4f4f5; }
</style>
