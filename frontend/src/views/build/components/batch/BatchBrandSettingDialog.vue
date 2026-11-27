<template>
  <!-- 广告设置 · 类别/品牌名称「设置」弹窗（对齐线上截图：496 宽） -->
  <el-dialog
    v-model="visible"
    title="设置类别/品牌名称"
    width="496px"
    class="brand-dlg"
    :z-index="2800"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="bs">
      <div class="bs__row">
        <span class="bs__label">来源账户</span>
        <div class="bs__ctl">
          <el-select v-model="account" size="small" class="bs__select" placeholder="请选择来源账户">
            <el-option
              v-for="a in ACCOUNTS"
              :key="a.no"
              :label="`${a.name}-在投(${a.count})`"
              :value="a.no"
            />
          </el-select>
        </div>
      </div>
      <p class="bs__tip">
        <span class="bs__tip-dot">!</span>
        请确保行业/品牌已共享到其他账户，避免搭建失败。
      </p>

      <div class="bs__row">
        <span class="bs__label">所属类别</span>
        <div class="bs__ctl">
          <el-select v-model="category" size="small" class="bs__select" placeholder="请选择所属类别">
            <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
          </el-select>
          <a class="bs__link" @click="refresh">刷新</a>
        </div>
      </div>

      <div class="bs__row">
        <span class="bs__label">品牌名称（选填）</span>
        <div class="bs__ctl">
          <el-select v-model="brand" size="small" class="bs__select" placeholder="请选择品牌名称（选填）">
            <el-option v-for="b in BRANDS" :key="b" :label="b" :value="b" />
          </el-select>
          <a class="bs__link" @click="manualInput">手动输入</a>
          <a class="bs__link" @click="refresh">刷新</a>
        </div>
      </div>

      <div class="bs__row bs__row--top">
        <span class="bs__label">二级品牌名称（选填）</span>
        <div class="bs__ctl bs__dual">
          <!-- 左：可选列表 -->
          <div class="bs__pane">
            <div class="bs__pane-head">
              <span class="bs__pane-title">二级品牌名称</span>
              <a class="bs__link bs__link--xs" @click="refresh">刷新</a>
            </div>
            <div class="bs__search">
              <el-input v-model="keyword" size="small" placeholder="请输入关键词">
                <template #prefix><el-icon class="bs__search-ico"><Search /></el-icon></template>
              </el-input>
            </div>
            <div class="bs__all">
              <el-checkbox v-model="allChecked" size="small" @change="onAll">全选</el-checkbox>
            </div>
            <div class="bs__list">
              <div v-for="it in filtered" :key="it" class="bs__item">
                <el-checkbox
                  :model-value="picked.includes(it)"
                  size="small"
                  @change="(v) => toggle(it, v)"
                >{{ it }}</el-checkbox>
              </div>
              <div v-if="!filtered.length" class="bs__empty">
                <span class="bs__empty-ico">▤</span>
                <p>暂无数据</p>
              </div>
            </div>
          </div>

          <!-- 右：已选 -->
          <div class="bs__pane bs__pane--picked">
            <div class="bs__pane-head">
              <span class="bs__pane-title">已选: {{ picked.length }}</span>
              <a class="bs__link bs__link--xs" @click="picked = []">清空全部</a>
            </div>
            <div class="bs__list bs__list--picked">
              <div v-for="it in picked" :key="it" class="bs__picked">
                <span class="bs__picked-txt">{{ it }}</span>
                <el-icon class="bs__picked-x" @click="toggle(it, false)"><Close /></el-icon>
              </div>
              <div v-if="!picked.length" class="bs__empty">
                <span class="bs__empty-ico">▤</span>
                <p>暂无数据</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="bs__footer">
        <a class="bs__footer-clear" @click="clearAll">清空已选</a>
        <div class="bs__footer-btns">
          <el-button class="bs__btn" @click="visible = false">取消</el-button>
          <el-button type="primary" class="bs__btn bs__btn--primary" @click="onConfirm">确定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Close, Search } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /* 来源账户（从右侧表单传入的当前账户名） */
  current: { type: String, default: '' },
  /* 已设置的类别 / 品牌 / 二级品牌 */
  value: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const ACCOUNTS = [
  { no: '1373758649506203', name: '央广-雷盟-知乎-APP内付费-124-792335571', count: 187 },
  { no: '1373758652234324', name: '央广-雷盟-知乎-APP内付费-124-792335571', count: 187 },
  { no: '1373758652954056', name: '央广-雷盟-知乎-APP内付费-124-792335571', count: 187 },
  { no: '1373758651659018', name: '央广-雷盟-知乎-APP内付费-124-792335571', count: 187 },
];
const CATEGORIES = ['游戏', '应用', '电商', '教育', '金融', '其他'];
const BRANDS = ['知乎', '今日头条', '抖音', '西瓜视频', '红果短剧'];
const SECOND_BRANDS = [
  '知乎盐选', '知乎图书', '知乎课堂', '知乎live', '知乎会员',
  '红果短剧', '红果小说', '番茄小说', '番茄畅听',
];

const account = ref(props.current ? '1373758649506203' : '1373758649506203');
const category = ref('');
const brand = ref('');
const keyword = ref('');
const allChecked = ref(false);
const picked = ref([]);

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    category.value = props.value.category || '';
    brand.value = props.value.brand || '';
    picked.value = props.value.secondBrand ? [props.value.secondBrand] : [];
    keyword.value = '';
    allChecked.value = false;
  },
);

const filtered = computed(() => {
  const k = keyword.value.trim();
  if (!k) return SECOND_BRANDS;
  return SECOND_BRANDS.filter((x) => x.includes(k));
});

function toggle(it, on) {
  if (on) {
    if (!picked.value.includes(it)) picked.value = [...picked.value, it];
  } else {
    picked.value = picked.value.filter((x) => x !== it);
  }
  allChecked.value = filtered.value.length > 0 && filtered.value.every((x) => picked.value.includes(x));
}
function onAll(v) {
  if (v) picked.value = [...new Set([...picked.value, ...filtered.value])];
  else picked.value = picked.value.filter((x) => !filtered.value.includes(x));
}
function clearAll() {
  picked.value = [];
}
function refresh() {
  /* 本地原型：刷新仅重置搜索结果 */
  keyword.value = '';
}
function manualInput() {
  brand.value = '手动输入';
}
function onConfirm() {
  emit('confirm', {
    category: category.value,
    brand: brand.value,
    secondBrand: picked.value.join('、'),
  });
  visible.value = false;
}
</script>

<style scoped>
.bs {
  padding: 4px 0 8px;
}
.bs__row {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}
.bs__row--top {
  align-items: flex-start;
}
.bs__label { white-space: nowrap;
  flex: none;
  width: 126px;
  font-size: 13px;
  color: #4e5969;
  line-height: 32px;
}
.bs__ctl {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
.bs__select {
  width: 226px;
  flex: 0 0 226px;
}
.bs__tip {
  margin: -6px 0 16px;
  padding-left: 126px;
  font-size: 12px;
  color: #ff7d00;
  line-height: 18px;
}
.bs__tip-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 4px;
  font-size: 11px;
  color: #fff;
  background: #ff7d00;
  border-radius: 50%;
}
.bs__link {
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
  white-space: nowrap;
}
.bs__link--xs {
  font-size: 12px;
}
.bs__dual {
  align-items: stretch;
  gap: 12px;
  flex-wrap: nowrap;
}
.bs__pane {
  width: 198px;
  border: 1px solid #e5e6eb;
  border-radius: 3px;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 236px;
}
.bs__pane--picked {
  flex: 1;
  width: auto;
}
.bs__pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 10px;
  border-bottom: 1px solid #f2f3f5;
}
.bs__pane-title {
  font-size: 12px;
  color: #1d2129;
}
.bs__search {
  padding: 8px 10px 0;
}
.bs__search-ico {
  color: #86909c;
}
.bs__all {
  padding: 4px 10px 0;
}
.bs__list {
  flex: 1;
  overflow: auto;
  padding: 4px 10px 8px;
}
.bs__list--picked {
  padding-top: 8px;
}
.bs__item {
  line-height: 26px;
}
.bs__picked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 26px;
  font-size: 12px;
  color: #1d2129;
}
.bs__picked-txt {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bs__picked-x {
  font-size: 12px;
  color: #86909c;
  cursor: pointer;
}
.bs__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px 0;
  color: #86909c;
  font-size: 12px;
}
.bs__empty-ico {
  font-size: 26px;
  color: #c9cdd4;
  margin-bottom: 8px;
}
.bs__empty p {
  margin: 0;
}
.bs__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
}
.bs__footer-clear {
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
}
.bs__footer-btns {
  display: inline-flex;
  gap: 12px;
}
.bs__btn {
  width: 76px;
  height: 32px;
}
.bs__btn--primary {
  width: 76px;
}
</style>
