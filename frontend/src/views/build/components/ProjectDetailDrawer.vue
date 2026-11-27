<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="min(1000px, 96vw)"
    :with-header="false"
    :close-on-click-modal="false"
    append-to-body
    class="pd-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="pd-wrap">
      <!-- 关闭按钮：贴附在抽屉左边缘（与线上一致，悬浮在抽屉外的蒙层上） -->
      <button class="pd-close" title="关闭" @click="close">
        <el-icon><Close /></el-icon>
      </button>

      <div class="pd-scroll">
      <!-- 顶部：项目名称 -->
      <div class="pd-head">
        <div class="pd-title" :title="d.name">{{ d.name }}</div>
      </div>

      <!-- 项目摘要：状态 / 项目ID / 预算 / 出价 / 深度出价 / ROI系数 / 启停开关 -->
      <div class="pd-meta">
        <span class="pd-state" :class="d.enabled ? 'is-on' : 'is-off'">{{ d.stateText }}</span>
        <span class="pd-kv"><i>项目ID:&nbsp;</i>{{ d.campaign_id }}</span>
        <span class="pd-kv"><i>预算:&nbsp;</i>{{ d.budget }}</span>
        <span class="pd-kv"><i>出价:&nbsp;</i>{{ d.bid }}</span>
        <span class="pd-kv"><i>深度出价:&nbsp;</i>{{ d.deepBid }}</span>
        <span class="pd-kv"><i>ROI系数:&nbsp;</i>{{ d.roi }}</span>
        <el-switch
          v-model="d.enabled"
          class="pd-switch"
          size="small"
          @change="(v) => emit('toggle', props.row, v)"
        />
      </div>

      <!-- 页签 -->
      <div class="pd-tabs">
        <span class="pd-tab active">项目</span>
      </div>

      <!-- 详情内容 -->
      <div class="pd-body">
        <!-- 基础信息（通栏，仅提供「查看项目下广告」入口） -->
        <section class="pd-sec">
          <div class="pd-sec-hd pd-hd-base">
            <span class="pd-sec-title">基础信息</span>
            <a class="pd-link" @click="onViewAds">查看项目下广告</a>
          </div>
        </section>

        <div class="pd-cols">
          <div class="pd-col">
            <section v-for="sec in d.left" :key="sec.title" class="pd-sec">
              <div class="pd-sec-hd"><span class="pd-sec-title">{{ sec.title }}</span></div>
              <div class="pd-rows">
                <div v-for="row in sec.rows" :key="row.label" class="pd-row">
                  <div class="pd-label">{{ row.label }}</div>
                  <div
                    class="pd-value"
                    :class="{ 'is-link': row.link }"
                    :title="row.link ? row.value : ''"
                    @click="row.link && onLink(row)"
                  >{{ row.value }}</div>
                </div>
              </div>
            </section>
          </div>

          <div class="pd-col">
            <section v-for="sec in d.right" :key="sec.title" class="pd-sec">
              <div class="pd-sec-hd"><span class="pd-sec-title">{{ sec.title }}</span></div>
              <div class="pd-rows">
                <div v-for="row in sec.rows" :key="row.label" class="pd-row">
                  <div class="pd-label">{{ row.label }}</div>
                  <div
                    class="pd-value"
                    :class="{ 'is-link': row.link }"
                    :title="row.link ? row.value : ''"
                    @click="row.link && onLink(row)"
                  >{{ row.value }}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import { buildProjectDetail } from '@/mock/projectDetail';

const props = defineProps({
  modelValue: Boolean,
  // 项目列表行
  row: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'toggle', 'view-ads']);

// 详情数据（随打开的行重建）
const d = ref(buildProjectDetail(props.row));

watch(
  () => [props.modelValue, props.row],
  () => {
    if (props.modelValue) d.value = buildProjectDetail(props.row);
  },
  { deep: false }
);

function close() { emit('update:modelValue', false); }

function onLink(row) {
  ElMessage.info(`原型：打开链接 ${row.value}`);
}

function onViewAds() {
  emit('view-ads', props.row);
}
</script>

<style scoped>
.pd-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 14px 20px 20px;
}

/* 抽屉外壳：相对定位，关闭按钮贴附在左边缘 */
.pd-wrap {
  /* 取色对齐智投线上项目详情抽屉 */
  --pd-blue: #546ef7;
  --pd-text: #333;
  --pd-text-weak: #999;
  --pd-bar: #f2f2f2;
  --pd-line: #e5e7ed;
  position: absolute;
  inset: 0;
}

.pd {
  color: var(--pd-text);
  font-size: 13px;
}

/* 顶部：标题 */
.pd-head { display: flex; align-items: center; gap: 12px; }
/* 关闭按钮：贴在抽屉左边缘外侧（线上为悬浮在蒙层上的蓝色方块） */
.pd-close {
  position: absolute;
  left: -36px;
  top: 8px;
  z-index: 2;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: var(--pd-blue);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pd-close:hover { opacity: 0.85; }
.pd-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--pd-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 项目摘要行 */
.pd-meta { display: flex; align-items: center; gap: 20px; margin-top: 14px; }
.pd-state { padding: 2px 8px; border-radius: 3px; font-size: 12px; color: #fff; }
.pd-state.is-on { background: #60c344; }
.pd-state.is-off { background: var(--pd-text-weak); }
.pd-kv { font-size: 13px; color: var(--pd-text); white-space: nowrap; }
.pd-kv i { font-style: normal; color: var(--pd-text-weak); }
.pd-switch { margin-left: auto; }
.pd-switch :deep(.el-switch.is-checked .el-switch__core) { background-color: var(--pd-blue); border-color: var(--pd-blue); }

/* 页签 */
.pd-tabs { margin-top: 16px; border-bottom: 1px solid var(--pd-line); }
.pd-tab {
  display: inline-block;
  padding-bottom: 8px;
  font-size: 15px;
  color: var(--pd-blue);
  border-bottom: 2px solid var(--pd-blue);
  margin-bottom: -1px;
}

/* 内容 */
.pd-body { padding-top: 14px; }
.pd-cols { display: flex; gap: 20px; margin-top: 14px; }
.pd-col { flex: 1; min-width: 0; }
.pd-sec + .pd-sec { margin-top: 16px; }

.pd-sec-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--pd-bar);
  font-size: 14px;
  font-weight: 600;
  color: var(--pd-text);
}
.pd-hd-base { padding: 12px 16px; font-size: 16px; }
.pd-sec-title { font-weight: 600; }
.pd-link { font-size: 13px; font-weight: 400; color: var(--pd-blue); cursor: pointer; }

.pd-row { display: flex; align-items: flex-start; padding: 8px 16px; }
.pd-label { width: 114px; flex: none; font-size: 13px; line-height: 20px; color: var(--pd-text-weak); }
.pd-value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--pd-text);
  word-break: break-all;
}
.pd-value.is-link {
  color: var(--pd-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
</style>

<!-- 抽屉本体：去掉内边距并允许溢出，使关闭按钮能贴附在抽屉左边缘外侧 -->
<style>
.pd-drawer .el-drawer__body { padding: 0; overflow: visible; min-height: 0; }
</style>
