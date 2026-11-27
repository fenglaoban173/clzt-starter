<template>
  <!-- 选择抖音号（对齐线上 cl.mobgi.com 广告信息抽屉 →「选择抖音号」弹窗）
       * 700×，标题「选择抖音号」
       * 顶部橙色提示两行，其中「绑定抖音号」是外链：
         https://ad.oceanengine.com/pages/login/index.html
       * 卡片内：标题行 + 多账户刷新 / 清空所有资产；筛选行；左表 + 右「已选」面板 -->
  <el-dialog
    :model-value="modelValue"
    title="选择抖音号"
    width="700px"
    class="adpick-dialog"
    align-center
    append-to-body
    :z-index="2600"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="adpick-tip">
      <span class="adpick-tip__icon">!</span>
      <div class="adpick-tip__text">
        <p>
          抖音号需要提前在巨量引擎进行绑定，绑点后，可以通过刷新获取已经绑定的抖音号，
          <a :href="BIND_URL" target="_blank" rel="noopener">绑定抖音号</a>
        </p>
        <p>匹配方式为所有广告选择一个抖音号时，所有账户均需授权同一个抖音号</p>
      </div>
    </div>

    <div class="adpick-panel">
      <div class="adpick-head">
        <span class="adpick-head__title">选择抖音号</span>
        <div class="adpick-head__actions">
          <el-button size="small" class="adpick-btn" @click="onRefresh">多账户刷新</el-button>
          <el-button size="small" class="adpick-btn" @click="onClearAll">清空所有资产</el-button>
        </div>
      </div>

      <div class="adpick-filter">
        <el-select v-model="field" size="small" class="adpick-field">
          <el-option label="抖音号名称" value="name" />
          <el-option label="抖音号ID" value="id" />
        </el-select>
        <el-input v-model="keyword" size="small" class="adpick-kw" placeholder="请输入关键词" />
        <button type="button" class="adpick-search" title="查询">
          <el-icon><Search /></el-icon>
        </button>
        <el-checkbox v-model="onlyUnused" size="small" class="adpick-unused">仅查看未使用抖音号</el-checkbox>
      </div>

      <div class="adpick-cols">
        <div class="adpick-list">
          <div class="adpick-meta">项目数：{{ projectCount }}　广告数：{{ adCount }}</div>
          <el-table :data="rows" height="250" class="adpick-table">
            <el-table-column label="抖音号">
              <template #default="{ row }">
                <div class="adpick-cell">
                  <span>{{ row.name }}</span>
                  <span class="adpick-cell__sub">{{ row.id }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="使用状态" width="110" prop="status" />
            <template #empty>
              <div class="adpick-empty">
                <i class="adpick-empty__icon"></i>
                <p>当前账户下所有抖音号均已使用，可取消勾选查看全部</p>
              </div>
            </template>
          </el-table>
        </div>

        <div class="adpick-sel">
          <div class="adpick-sel__head">
            <span>已选({{ selected.length }})</span>
            <a class="adpick-link" @click="selected = []">清空</a>
          </div>
          <div class="adpick-sel__body">
            <div v-for="s in selected" :key="s.id" class="adpick-sel__item">
              <span>{{ s.name }}</span>
              <el-icon class="adpick-sel__x" @click="removeSelected(s)"><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button class="adpick-foot-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="adpick-foot-btn adpick-foot-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { Close, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

/* 线上「绑定抖音号」外链 */
const BIND_URL = 'https://ad.oceanengine.com/pages/login/index.html';

const field = ref('name');
const keyword = ref('');
const onlyUnused = ref(false);
const rows = ref([]);
const selected = ref([]);
const projectCount = ref(1);
const adCount = ref(10);

function onRefresh() {
  ElMessage.success('已刷新抖音号');
}
function onClearAll() {
  selected.value = [];
  ElMessage.success('已清空所有资产');
}
function removeSelected(row) {
  selected.value = selected.value.filter((s) => s.id !== row.id);
}
function onConfirm() {
  emit('confirm', selected.value);
  emit('update:modelValue', false);
}
</script>
