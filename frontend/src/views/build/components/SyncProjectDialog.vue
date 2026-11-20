<template>
  <el-dialog
    :model-value="modelValue"
    title="同步项目与广告"
    width="1004px"
    top="10vh"
    class="sp-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => emit('update:modelValue', v)"
    @open="init"
  >
    <div class="sp-body">
      <div class="sp-row">
        <div class="sp-label">账户</div>
        <div class="sp-cols">
          <!-- 左：媒体账户 -->
          <div class="sp-panel sp-left">
            <div class="sp-panel-head">媒体账户</div>
            <div class="sp-search">
              <el-select v-model="searchField" class="sp-field">
                <el-option label="ID" value="id" />
                <el-option label="名称" value="name" />
              </el-select>
              <el-input v-model="keyword" class="sp-keyword" placeholder="请输入关键词">
                <template #suffix><el-icon class="sp-suffix"><Filter /></el-icon></template>
              </el-input>
              <el-button class="sp-search-btn" @click="page = 1"><el-icon><Search /></el-icon></el-button>
            </div>
            <div class="sp-list">
              <div class="sp-check-all">
                <el-checkbox :model-value="pageAllChecked" @change="toggleAll">全选</el-checkbox>
              </div>
              <div v-for="a in pageAccounts" :key="a.id" class="sp-acc">
                <el-checkbox
                  :model-value="selected.includes(a.id)"
                  @change="(v) => toggle(a.id, v)"
                />
                <a class="sp-acc-name" :title="accountLabel(a)" @click="toggle(a.id, !selected.includes(a.id))">
                  {{ accountLabel(a) }}
                </a>
              </div>
              <div v-if="!pageAccounts.length" class="sp-empty">未找到匹配的媒体账户</div>
            </div>
            <div class="sp-pager">
              <el-pagination
                v-model:current-page="page"
                :page-size="pageSize"
                :total="filtered.length"
                layout="prev, pager, next"
                :pager-count="5"
                background
              />
            </div>
          </div>

          <!-- 右：已选 -->
          <div class="sp-panel sp-right">
            <div class="sp-panel-head sp-head-selected">
              <span>已选：{{ selected.length }}/{{ MAX_SELECT }}</span>
              <a class="sp-link" @click="selected = []">清空</a>
            </div>
            <div class="sp-sel-list">
              <div v-for="a in selectedAccounts" :key="a.id" class="sp-sel">
                <span class="sp-sel-name" :title="accountLabel(a)">{{ accountLabel(a) }}</span>
                <el-icon class="sp-del" @click="toggle(a.id, false)"><Close /></el-icon>
              </div>
              <div v-if="!selectedAccounts.length" class="sp-empty">暂未选择媒体账户</div>
            </div>
          </div>
        </div>
      </div>

      <div class="sp-row">
        <div class="sp-label">更新时间</div>
        <div class="sp-range">
          <el-date-picker
            v-model="range"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="sp-date"
          />
          <div class="sp-tip">建议选择更新时间同步，减少拉取不必要的数据，降低等待时间。</div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, Filter, Search } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { mediaApi } from '@/api/media';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'confirm']);

const MAX_SELECT = 500;
const accounts = ref([]);
const selected = ref([]);
const keyword = ref('');
const searchField = ref('id');
const page = ref(1);
const pageSize = 10;
const range = ref([dayjs().subtract(14, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]);

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return accounts.value;
  return accounts.value.filter((a) => {
    const name = String(a.name || '').toLowerCase();
    const id = String(a.advertiser_id || '').toLowerCase();
    return searchField.value === 'id' ? id.includes(kw) : name.includes(kw);
  });
});

const pageAccounts = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

const selectedAccounts = computed(() => accounts.value.filter((a) => selected.value.includes(a.id)));
const pageAllChecked = computed(() => pageAccounts.value.length > 0 && pageAccounts.value.every((a) => selected.value.includes(a.id)));

function accountLabel(a) {
  return `${a.name}--${a.advertiser_id}`;
}

async function init() {
  selected.value = [];
  keyword.value = '';
  page.value = 1;
  if (!accounts.value.length) {
    const res = await mediaApi.accounts();
    accounts.value = res.data?.list || [];
  }
}

function toggle(id, v) {
  if (v) {
    if (selected.value.length >= MAX_SELECT) {
      ElMessage.warning(`最多只能选择 ${MAX_SELECT} 个媒体账户`);
      return;
    }
    selected.value = [...selected.value, id];
  } else {
    selected.value = selected.value.filter((x) => x !== id);
  }
}

function toggleAll(v) {
  const ids = pageAccounts.value.map((a) => a.id);
  if (v) {
    selected.value = [...new Set([...selected.value, ...ids])].slice(0, MAX_SELECT);
  } else {
    selected.value = selected.value.filter((x) => !ids.includes(x));
  }
}

function close() { emit('update:modelValue', false); }

function confirm() {
  if (!selected.value.length) {
    ElMessage.warning('请至少选择一个媒体账户');
    return;
  }
  emit('confirm', { accounts: selectedAccounts.value, range: range.value });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.sp-body {
  --el-font-size-base: 14px;
  font-size: 14px;
  color: #1d2129;
}
.sp-row { display: flex; gap: 16px; margin-bottom: 18px; }
.sp-label { width: 60px; flex: none; padding-top: 10px; color: #1d2129; }
.sp-cols { flex: 1; min-width: 0; display: flex; gap: 16px; }

.sp-panel { border: 1px solid #e5e6eb; border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; }
/* R80：左侧账户列表加宽，保证「账户名--账户ID」一行显示完整；右侧「已选」宽度保持不变 */
.sp-left { width: 444px; flex: none; }
.sp-right { flex: 1; min-width: 0; }
.sp-panel-head { padding: 12px 14px; border-bottom: 1px solid #f2f3f5; font-size: 15px; color: #1d2129; }
.sp-head-selected { display: flex; align-items: center; justify-content: space-between; }
.sp-link { color: #165dff; cursor: pointer; font-size: 14px; }

.sp-search { display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid #f2f3f5; }
.sp-field { width: 78px; flex: none; }
.sp-keyword { flex: 1; min-width: 0; }
.sp-keyword :deep(.el-input__wrapper) { border-radius: 4px 0 0 4px; }
.sp-suffix { color: #86909c; cursor: pointer; }
.sp-search-btn { width: 38px; margin-left: -1px; padding: 0; border-radius: 0 4px 4px 0; border-left: none; color: #4e5969; }

.sp-list { height: 300px; overflow-y: auto; padding: 6px 12px; }
.sp-check-all { padding: 2px 0 6px; }
.sp-acc { display: flex; align-items: center; gap: 8px; height: 30px; }
.sp-acc-name {
  color: #165dff;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sp-empty { padding: 30px 0; text-align: center; color: #86909c; font-size: 13px; }
.sp-pager { padding: 8px 12px; border-top: 1px solid #f2f3f5; }

.sp-sel-list { height: 368px; overflow-y: auto; padding: 8px 12px; }
.sp-sel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 38px;
  padding: 0 12px;
  margin-bottom: 8px;
  background: #f7f8fa;
  border-radius: 2px;
}
.sp-sel-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-del { color: #86909c; cursor: pointer; }
.sp-del:hover { color: #f53f3f; }

.sp-range { flex: 1; }
.sp-date { width: 340px !important; }
.sp-tip { margin-top: 8px; color: #86909c; font-size: 13px; }
</style>

<style>
/* R80：弹窗加宽后避免小屏溢出 */
.sp-dialog { max-width: calc(100vw - 40px); }
</style>
