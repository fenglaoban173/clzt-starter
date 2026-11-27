<template>
  <!-- 直达链接「选择/填写」抽屉（线上 cl.mobgi.com 广告信息 → 直达链接 → 选择直达链接）
       * 760 宽右侧抽屉，标题随「直达链接来源」切换：
         - 导入直达链接 / 落地页自动关联 / 落地页自动生成 →「选择直达链接」（图1）
         - 手动填写 →「填写直达链接」（图2）
         - 动态链接生成 →「选择链接模板」（图3）
       * 图3 的「去新建」打开「新增链接模板」弹窗（图4） -->
  <BatchDrawer
    :model-value="modelValue"
    :title="drawerTitle"
    :width="760"
    :z-index="1401"
    :close-on-mask="true"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @ok="onOk"
  >
    <template #content>
      <div class="dlx">
        <!-- 图1：右上「清空所有资产」 -->
        <div v-if="mode === 'list'" class="dlx__bar">
          <el-button size="small" class="dlx__clear" @click="onClearAll">清空所有资产</el-button>
        </div>

        <div class="dlx__card" :class="{ 'dlx__card--tall': mode !== 'dynamic' }">
          <!-- ─────────── 图1：选择直达链接（列表） ─────────── -->
          <div v-if="mode === 'list'" class="dlx-cols">
            <div class="dlx-main">
              <div class="dlx-filter">
                <el-select v-model="tag" size="small" class="dlx-tag" placeholder="请选择标签">
                  <el-option label="全部标签" value="ALL" />
                  <el-option label="默认" value="DEFAULT" />
                </el-select>
                <el-input v-model="keyword" size="small" class="dlx-kw" placeholder="请输入关键词" />
                <button type="button" class="dlx-search" title="查询">
                  <el-icon><Search /></el-icon>
                </button>
                <span class="dlx-hint">找不到资产？<a class="dlx-link" @click="onCreateAsset">去新建</a></span>
              </div>

              <div class="dlx-meta">
                <span>项目数：{{ projectCount }}　广告数：{{ adCount }}</span>
                <el-button size="small" class="dlx-quick" @click="onQuickPick">
                  <el-icon class="dlx-quick__ico"><List /></el-icon>快速选择
                </el-button>
              </div>

              <div class="dlx-checks">
                <div class="dlx-checks__left">
                  <el-checkbox v-model="onlyUnbound" size="small" class="dlx-check">仅查看未绑定账户数据</el-checkbox>
                  <el-popover placement="top" trigger="hover" :width="300" popper-class="dlx-pop">
                    <template #reference>
                      <el-icon class="dlx-q dlx-q--sm"><QuestionFilled /></el-icon>
                    </template>
                    <span class="dlx-pop__text">勾选后仅展示未与任何账户绑定的直达链接</span>
                  </el-popover>
                </div>
                <el-checkbox v-model="onlyUnused" size="small" class="dlx-check">仅看未使用</el-checkbox>
              </div>

              <div class="dlx-table-wrap">
                <el-table
                  ref="tableRef"
                  :data="filteredRows"
                  height="100%"
                  class="dlx-table"
                  row-key="id"
                  @selection-change="onSelectionChange"
                >
                  <el-table-column type="selection" width="40" />
                  <el-table-column prop="name" label="直达链接名称" sortable min-width="150" />
                  <el-table-column prop="status" label="使用状态" width="82" />
                  <el-table-column prop="adCount" label="关联广告数" width="112" sortable />
                  <template #empty>
                    <div class="dlx-empty">
                      <i class="dlx-empty__icon"></i>
                      <p>没有找到想要的直达链接？可直接 <a class="dlx-link" @click="onImport">导入</a></p>
                    </div>
                  </template>
                </el-table>
              </div>

              <div class="dlx-pager">
                <span class="dlx-pager__arrow is-disabled">‹</span>
                <span class="dlx-pager__num">1</span>
                <span class="dlx-pager__arrow is-disabled">›</span>
              </div>
            </div>

            <div class="dlx-sel">
              <div class="dlx-sel__head">
                <span>已选({{ selected.length }})</span>
                <span class="dlx-sel__clear" @click="selected = []">清空<el-icon class="dlx-sel__del"><CircleClose /></el-icon></span>
              </div>
              <div class="dlx-sel__body">
                <div v-for="s in selected" :key="s.id" class="dlx-sel__item">
                  <span class="dlx-sel__name">{{ s.name }}</span>
                  <el-icon class="dlx-sel__x" @click="removeSelected(s)"><Close /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- ─────────── 图2：填写直达链接（手动填写） ─────────── -->
          <div v-else-if="mode === 'manual'" class="dlx-manual">
            <div class="dlx-row">
              <label class="dlx-label">输入DeepLink</label>
              <el-input v-model="manualUrl" class="dlx-manual__input" placeholder="输入DeepLink直达链接" />
            </div>
          </div>

          <!-- ─────────── 图3：选择链接模板（动态链接生成） ─────────── -->
          <div v-else class="dlx-tpl">
            <div class="dlx-row dlx-row--tpl">
              <label class="dlx-label">选择链接模板</label>
              <el-select v-model="template" class="dlx-tpl__select" placeholder="请选择链接模板">
                <el-option label="暂无链接模板" value="NONE" disabled />
              </el-select>
              <a class="dlx-link dlx-tpl__refresh" @click="onRefresh">刷新</a>
              <span class="dlx-hint dlx-hint--tpl">
                找不到资产？<a class="dlx-link" @click="tplDialog = true">去新建</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BatchDrawer>

  <!-- 图4：新增链接模板（放在抽屉外层，BatchDrawer 只渲染 content/footer 具名插槽） -->
  <BatchLinkTemplateDialog v-model="tplDialog" @confirm="onTemplateCreated" />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CircleClose, Close, List, QuestionFilled, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import BatchDrawer from './BatchDrawer.vue';
import BatchLinkTemplateDialog from './BatchLinkTemplateDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* list：导入/落地页自动关联/自动生成；manual：手动填写；dynamic：动态链接生成 */
  mode: { type: String, default: 'list' },
});
const emit = defineEmits(['update:modelValue', 'confirm']);
const router = useRouter();

const drawerTitle = computed(() => {
  if (props.mode === 'manual') return '填写直达链接';
  if (props.mode === 'dynamic') return '选择链接模板';
  return '选择直达链接';
});

const tag = ref('ALL');
const keyword = ref('');
const onlyUnbound = ref(true);
const onlyUnused = ref(false);
const tableRef = ref(null);
/* 线上直达链接资产（本地 mock：用于演示勾选 → 已选面板的完整流程） */
const rows = ref([
  { id: 'dl101', name: '知乎-投放直达链接-女频-01', tag: 'DEFAULT', status: '已使用', adCount: 3, used: true },
  { id: 'dl102', name: '知乎-投放直达链接-男频-02', tag: 'DEFAULT', status: '已使用', adCount: 1, used: true },
  { id: 'dl103', name: '知乎-投放直达链接-常规-03', tag: 'DEFAULT', status: '未使用', adCount: 0, used: false },
  { id: 'dl104', name: '知乎-投放直达链接-新客-04', tag: 'NEW', status: '未使用', adCount: 0, used: false },
  { id: 'dl105', name: '知乎-投放直达链接-回访-05', tag: 'NEW', status: '已使用', adCount: 2, used: true },
]);
const filteredRows = computed(() =>
  rows.value.filter((r) => {
    if (onlyUnused.value && r.used) return false;
    if (keyword.value && !r.name.includes(keyword.value.trim())) return false;
    return true;
  })
);
const selected = ref([]);
const projectCount = ref(1);
const adCount = ref(1);

const manualUrl = ref('');
const template = ref('');
const tplDialog = ref(false);

function onClearAll() {
  selected.value = [];
  ElMessage.success('已清空所有资产');
}
function onCreateAsset() {
  /* 「去新建」→ 本地资产模块的「直达链接」菜单页（站内路由） */
  emit('update:modelValue', false);
  router.push({ path: '/asset/list', query: { kind: 'deep_link' } });
}
function onQuickPick() {
  ElMessage.info('按账户快速选择直达链接');
}
function onImport() {
  ElMessage.info('导入直达链接');
}
function onSelectionChange(list) {
  selected.value = list || [];
}
function onRefresh() {
  ElMessage.success('已刷新链接模板');
}
function removeSelected(row) {
  selected.value = selected.value.filter((s) => s.id !== row.id);
  const tbl = tableRef.value;
  if (tbl) tbl.toggleRowSelection(row, false);
}
function onTemplateCreated(tpl) {
  if (!tpl || !tpl.name) return;
  ElMessage.success(`已新建链接模板「${tpl.name}」`);
}
function onOk() {
  if (props.mode === 'manual') {
    if (!manualUrl.value.trim()) {
      ElMessage.warning('请输入DeepLink');
      return;
    }
    emit('confirm', { url: manualUrl.value });
  } else if (props.mode === 'dynamic') {
    if (!template.value) {
      ElMessage.warning('请选择链接模板');
      return;
    }
    emit('confirm', { template: template.value });
  } else {
    emit('confirm', selected.value);
  }
  emit('update:modelValue', false);
}
</script>



