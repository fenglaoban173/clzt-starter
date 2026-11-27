<template>
  <el-drawer
    v-model="visible"
    title="选择资产组"
    direction="rtl"
    size="1136px"
    class="agp-drawer"
    @closed="reset"
  >
    <div class="agp-wrap">
      <!-- ① 顶部三筛选（label 与下拉同一描边框） -->
      <div class="agp-filters">
        <div class="agp-fbox">
          <span class="agp-flabel">资产组类型</span>
          <el-select v-model="fType" class="agp-fsel" placeholder="请选择">
            <el-option label="全部" value="" />
          </el-select>
        </div>
        <div class="agp-fbox">
          <span class="agp-flabel">投放内容</span>
          <el-select v-model="fContent" class="agp-fsel" placeholder="请选择">
            <el-option label="全部" value="" />
          </el-select>
        </div>
        <div class="agp-fbox agp-fbox--wide">
          <span class="agp-flabel">使用状态</span>
          <el-select v-model="fStatus" class="agp-fsel" placeholder="请选择使用状态">
            <el-option label="未使用" value="未使用" />
            <el-option label="使用中" value="使用中" />
          </el-select>
        </div>
      </div>

      <!-- ② 名称搜索 -->
      <div class="agp-search">
        <el-select v-model="fField" class="agp-sfield" placeholder="资产组名称">
          <el-option label="资产组名称" value="name" />
          <el-option label="资产组ID" value="id" />
        </el-select>
        <el-input v-model="keyword" class="agp-sinput" placeholder="请输入关键词" clearable @keyup.enter="page = 1" />
        <button class="agp-sbtn" @click="page = 1">
          <el-icon><Search /></el-icon>
        </button>
      </div>

      <!-- ③ 主体：账户列 + 右侧面板 -->
      <div class="agp-main">
        <div class="agp-accs">
          <div
            v-for="a in accounts"
            :key="a.id"
            class="agp-acc"
            :class="{ 'is-on': curAccount === a.id }"
            @click="curAccount = a.id"
          >
            <div class="agp-acc__txt">
              <span class="agp-acc__name">{{ a.name }}</span>
              <span class="agp-acc__id">ID: {{ a.advertiser_id || a.displayId || a.id }}</span>
            </div>
            <span class="agp-acc__radio" :class="{ 'is-on': curAccount === a.id }" />
          </div>
        </div>

        <div class="agp-right">
          <div class="agp-onlyrow">
            <el-checkbox v-model="onlyLinked">仅看关联账户</el-checkbox>
          </div>

          <div class="agp-panels">
            <!-- 主列表 -->
            <div class="agp-panel">
              <div class="agp-panel__head">
                <span>已选: {{ selected.length }}/{{ limit }}</span>
                <span class="agp-link" @click="clearSelected">清空 <el-icon><RefreshRight /></el-icon></span>
              </div>
              <div class="agp-thead">
                <span class="agp-tc agp-tc--check">
                  <span class="agp-box" :class="{ 'is-on': allChecked }" @click="toggleAll">
                    <el-icon v-if="allChecked"><Check /></el-icon>
                  </span>
                </span>
                <span class="agp-tc agp-tc--name">资产组名称</span>
                <span class="agp-tc agp-tc--status">使用状态</span>
                <span class="agp-tc agp-tc--content">投放内容</span>
              </div>
              <div class="agp-tbody">
                <div
                  v-for="r in rows"
                  :key="r.id"
                  class="agp-trow"
                  :class="{ 'is-checked': isChecked(r) }"
                  @click="toggleRow(r)"
                >
                  <span class="agp-tc agp-tc--check">
                    <span class="agp-box" :class="{ 'is-on': isChecked(r) }">
                      <el-icon v-if="isChecked(r)"><Check /></el-icon>
                    </span>
                  </span>
                  <span class="agp-tc agp-tc--name" :title="r.name">{{ r.name }}</span>
                  <span class="agp-tc agp-tc--status">{{ r.status || '--' }}</span>
                  <span class="agp-tc agp-tc--content">{{ r.content || '--' }}</span>
                </div>
                <div v-if="!rows.length" class="agp-empty">暂无数据</div>
              </div>
            </div>

            <!-- 已选栏 -->
            <div class="agp-picked">
              <div class="agp-picked__head">
                <span>已选: {{ selected.length }}</span>
                <span class="agp-link" @click="clearSelected">清空</span>
              </div>
              <div class="agp-picked__body">
                <div v-for="r in selected" :key="'p' + r.id" class="agp-prow">
                  <span class="agp-prow__name" :title="r.name">{{ r.name }}</span>
                  <el-icon class="agp-prow__del" @click="toggleRow(r)"><Close /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <div class="agp-pager">
            <span>共 {{ rows.length }} 条</span>
            <el-select v-model="pageSize" class="agp-psize">
              <el-option :value="50" label="50 条/页" />
              <el-option :value="100" label="100 条/页" />
            </el-select>
            <span class="agp-pgbtn is-dis"><el-icon><ArrowLeft /></el-icon></span>
            <span class="agp-pgbtn is-on">1</span>
            <span class="agp-pgbtn is-dis"><el-icon><ArrowRight /></el-icon></span>
            <span>跳至</span>
            <el-input v-model="jump" class="agp-jump" />
            <span>页</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Search, Check, Close, RefreshRight, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  accounts: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  limit: { type: Number, default: 1000 },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const fType = ref('');
const fContent = ref('');
const fStatus = ref('');
const fField = ref('name');
const keyword = ref('');
const onlyLinked = ref(true);
const curAccount = ref('');
const selected = ref([]);
const pageSize = ref(50);
const jump = ref('1');

watch(() => props.modelValue, (v) => {
  if (v) {
    keyword.value = '';
    fType.value = '';
    fContent.value = '';
    fStatus.value = '';
    fField.value = 'name';
    onlyLinked.value = true;
    selected.value = [];
    pageSize.value = 50;
    jump.value = '1';
    curAccount.value = props.accounts.length ? props.accounts[0].id : '';
  }
});

const rows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return props.rows.filter((r) => {
    if (kw) {
      const v = fField.value === 'id' ? String(r.id) : String(r.name);
      if (!v.toLowerCase().includes(kw)) return false;
    }
    if (fStatus.value && r.status !== fStatus.value) return false;
    return true;
  });
});
const allChecked = computed(() => !!rows.value.length && rows.value.every((r) => isChecked(r)));
function isChecked(r) { return selected.value.some((x) => x.id === r.id); }
function toggleRow(r) {
  if (isChecked(r)) selected.value = selected.value.filter((x) => x.id !== r.id);
  else if (selected.value.length < props.limit) selected.value = [...selected.value, r];
}
function toggleAll() {
  if (allChecked.value) {
    selected.value = selected.value.filter((x) => !rows.value.some((r) => r.id === x.id));
  } else {
    const add = rows.value.filter((r) => !isChecked(r));
    const room = Math.max(0, props.limit - selected.value.length);
    selected.value = [...selected.value, ...add.slice(0, room)];
  }
}
function clearSelected() { selected.value = []; }
function confirm() { emit('confirm', selected.value); visible.value = false; }
function reset() { selected.value = []; keyword.value = ''; }
</script>

<style scoped>
.agp-wrap { display: flex; flex-direction: column; height: 100%; padding: 0 16px; box-sizing: border-box; }
.agp-filters { display: flex; gap: 8px; margin-bottom: 8px; }
.agp-fbox {
  width: 168px; height: 32px; flex: none;
  display: flex; align-items: center;
  border: 1px solid #dcdfe6; border-radius: 2px; background: #fff;
  padding: 0 8px; box-sizing: border-box;
}
.agp-fbox--wide { width: 196px; }
.agp-flabel { font-size: 12px; color: #1d2129; white-space: nowrap; margin-right: 4px; }
.agp-fsel { flex: 1; min-width: 0; }
.agp-fsel :deep(.el-select__wrapper) {
  box-shadow: none !important; background: transparent; padding: 0; min-height: 30px;
}
.agp-fsel :deep(.el-select__placeholder) { font-size: 12px; color: #86909c; }
.agp-search { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.agp-sfield { width: 128px; }
.agp-sinput { flex: 1; }
.agp-sbtn {
  width: 32px; height: 32px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid #dcdfe6; border-radius: 2px; background: #fff; color: #4e5969; cursor: pointer;
}
.agp-main { flex: 1; min-height: 0; display: flex; gap: 10px; }
.agp-accs { width: 160px; flex: none; border: 1px solid #e5e6eb; border-radius: 2px; overflow-y: auto; }
.agp-acc {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 8px 8px 10px; cursor: pointer;
  border-bottom: 1px solid #f2f3f5;
}
.agp-acc.is-on { background: #eef4ff; }
.agp-acc__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.agp-acc__name { font-size: 12px; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agp-acc.is-on .agp-acc__name { color: #197afb; }
.agp-acc__id { font-size: 11px; color: #86909c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agp-acc__radio {
  width: 14px; height: 14px; flex: none; border-radius: 50%;
  border: 1px solid #dcdfe6; background: #fff;
  display: inline-flex; align-items: center; justify-content: center;
}
.agp-acc__radio.is-on { border-color: #197afb; }
.agp-acc__radio.is-on::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #197afb; }
.agp-right { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.agp-onlyrow {
  height: 28px; display: flex; align-items: center; padding: 0 8px;
  background: #f7f8fa; border-radius: 2px;
}
.agp-onlyrow :deep(.el-checkbox__label) { font-size: 12px; color: #4e5969; }
.agp-panels { flex: 1; min-height: 0; display: flex; gap: 10px; margin-top: 8px; }
.agp-panel { flex: 1; min-width: 0; border: 1px solid #e5e6eb; border-radius: 2px; display: flex; flex-direction: column; }
.agp-panel__head {
  height: 34px; padding: 0 10px; flex: none;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; color: #4e5969;
  border-bottom: 1px solid #e5e6eb; background: #fff;
}
.agp-link { color: #197afb; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
.agp-thead {
  height: 34px; flex: none; display: flex; align-items: center; padding: 0 10px;
  font-size: 12px; color: #4e5969; background: #fff;
  border-bottom: 1px solid #e5e6eb;
}
.agp-tbody { flex: 1; min-height: 0; overflow-y: auto; }
.agp-trow {
  height: 36px; display: flex; align-items: center; padding: 0 10px;
  font-size: 12px; color: #1d2129; cursor: pointer;
  border-bottom: 1px solid #f7f8fa;
}
.agp-trow:hover { background: #f7f8fa; }
.agp-trow.is-checked { background: #eef4ff; }
.agp-tc { flex: none; min-width: 0; display: flex; align-items: center; }
.agp-tc--check { width: 26px; }
.agp-tc--name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agp-tc--status { width: 96px; }
.agp-tc--content { width: 96px; }
.agp-box {
  width: 14px; height: 14px; border: 1px solid #dcdfe6; border-radius: 2px;
  background: #fff; display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; color: #fff;
}
.agp-box.is-on { background: #197afb; border-color: #197afb; }
.agp-empty {
  height: 100%; min-height: 320px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #86909c;
}
.agp-picked { width: 160px; flex: none; border: 1px solid #e5e6eb; border-radius: 2px; display: flex; flex-direction: column; }
.agp-picked__head {
  height: 34px; padding: 0 10px; flex: none;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; color: #4e5969; border-bottom: 1px solid #e5e6eb;
}
.agp-picked__body { flex: 1; min-height: 0; overflow-y: auto; }
.agp-prow { display: flex; align-items: center; gap: 6px; padding: 7px 8px; border-bottom: 1px solid #f7f8fa; }
.agp-prow__name { flex: 1; min-width: 0; font-size: 12px; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agp-prow__del { color: #86909c; cursor: pointer; }
.agp-pager {
  flex: none; height: 36px; margin-top: 6px;
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  font-size: 12px; color: #4e5969;
}
.agp-psize { width: 100px; }
.agp-pgbtn {
  min-width: 24px; height: 24px; padding: 0 4px;
  border: 1px solid #e5e6eb; border-radius: 2px; background: #fff;
  display: inline-flex; align-items: center; justify-content: center;
}
.agp-pgbtn.is-on { border-color: #197afb; color: #197afb; }
.agp-pgbtn.is-dis { color: #c9cdd4; }
.agp-jump { width: 44px; }
</style>
