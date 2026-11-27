<template>
  <!-- 广告预算与出价 · 四种配置模式面板
       * 统一配置：无侧栏，直接是「竞价策略 / 优化目标…」+ 预算出价规则卡片
       * 分账户：左账户列表 + 右上「复制到其他账户」
       * 分主体：左主体 + 右上「复制到其他主体」
       * 分项目：左账户列表 + 添加规则 + 复制到其他账户 / 全部收起 + 规则卡片（可删除） -->
  <div class="bp" :class="{ 'bp--same': isSame }">
    <div v-if="!isSame" class="bp__top">
      <div class="bp__top-left">
        <el-button
          v-if="mode === 'PROJECT'"
          type="primary"
          size="small"
          class="bp__add-rule"
          @click="addRule"
        >添加规则</el-button>
      </div>
      <div class="bp__top-right">
        <a class="bp__link" @click="copyVisible = true">
          {{ mode === 'COMPANY' ? '复制到其他主体' : '复制到其他账户' }}
        </a>
        <a v-if="mode === 'PROJECT'" class="bp__link" @click="toggleAll">
          {{ allFolded ? '全部展开' : '全部收起' }}
        </a>
      </div>
    </div>

    <div class="bp__main">
      <div v-if="!isSame" class="bp__side">
        <div
          v-for="a in sideList"
          :key="a.id"
          class="bp__row"
          :class="{ 'is-active': a.id === activeId }"
          @click="activeId = a.id"
        >
          <div class="bp__row-txt">
            <p class="bp__row-name ellipsis" :title="a.name">{{ a.name }}</p>
            <p class="bp__row-sub">{{ a.sub }}</p>
          </div>
          <span class="bp__ok">✓</span>
        </div>
      </div>

      <div class="bp__right">
        <div class="right-title">
          <span><span class="title-label">竞价策略：</span><span class="title-text">稳定成本（常规版）</span></span>
          <span><span class="title-label">优化目标：</span><span class="title-text">app内付费/无</span></span>
          <span><span class="title-label">深度优化方式：</span><span class="title-text">无</span></span>
          <span><span class="title-label">付费方式：</span><span class="title-text">目标转化出价-按展示付费</span></span>
        </div>

        <div class="right-content">
          <div v-for="r in currentRules" :key="r.key" class="project-bid">
            <div class="project-bid-title">
              <span>{{ r.name }}</span>
              <span class="project-bid-ops">
                <a class="bp__link" @click="r.collapsed = !r.collapsed">{{ r.collapsed ? '展开' : '收起' }}</a>
                <a v-if="currentRules.length > 1" class="bp__del" @click="removeRule(r)">删除</a>
              </span>
            </div>
            <div v-show="!r.collapsed" class="project-bid-form">
              <div class="ad-rule__row">
                <div class="ad-rule__label">日预算</div>
                <el-input v-model="r.budget" class="ad-input ad-input--160" placeholder="请输入预算" size="small">
                  <template #suffix><span class="ad-suffix">元</span></template>
                </el-input>
                <span class="ad-rule__quick">
                  <a v-for="(q, qi) in BUDGET_PRESETS" :key="q" class="ad-rule__quick-item" @click="r.budget = q">
                    {{ q }}<span v-if="qi < BUDGET_PRESETS.length - 1" class="ad-rule__quick-sep">|</span>
                  </a>
                </span>
              </div>
              <div class="ad-rule__row">
                <div class="ad-rule__label">出价方式</div>
                <el-radio-group v-model="r.bid_mode" class="ad-radio" size="small">
                  <el-radio-button value="fixed">固定出价</el-radio-button>
                  <el-radio-button value="ladder">阶梯出价</el-radio-button>
                  <el-radio-button value="random">随机出价</el-radio-button>
                </el-radio-group>
                <el-tooltip content="选择阶梯/随机出价后需填写最低与最高出价" placement="top" :show-after="200">
                  <el-icon class="ad-q ad-q--lg ad-rule__q"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="ad-rule__row">
                <div class="ad-rule__label">出价</div>
                <el-input v-model="r.bid" class="ad-input ad-input--160" placeholder="请输入出价" size="small">
                  <template #suffix><span class="ad-suffix">元</span></template>
                </el-input>
              </div>
              <div v-if="r.bid_mode === 'ladder'" class="ad-rule__row">
                <div class="ad-rule__label">阶梯出价</div>
                <el-input v-model="r.min_bid" class="ad-input ad-input--160" placeholder="请输入最低出价" size="small" />
                <span class="ad-rule__sep">-</span>
                <el-input v-model="r.max_bid" class="ad-input ad-input--160" placeholder="请输入最高出价" size="small" />
              </div>
              <div v-else-if="r.bid_mode === 'random'" class="ad-rule__row">
                <div class="ad-rule__label">随机出价</div>
                <el-input v-model="r.min_bid" class="ad-input ad-input--160" placeholder="请输入最低出价" size="small" />
                <span class="ad-rule__sep">-</span>
                <el-input v-model="r.max_bid" class="ad-input ad-input--160" placeholder="请输入最高出价" size="small" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BatchCopyToDialog
      v-model="copyVisible"
      :mode="mode === 'COMPANY' ? 'COMPANY' : 'ACCOUNT'"
      :current="copyCurrent"
      :width="395"
      object-name="广告预算与出价"
      @confirm="copyVisible = false"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import BatchCopyToDialog from './BatchCopyToDialog.vue';

const props = defineProps({
  mode: { type: String, default: 'SAME' },
});

const ACCOUNTS = [
  { id: 'a1', no: '1373758649506203', name: '央广-雷盟-知乎-APP内付费-124-7923355' },
  { id: 'a2', no: '1373758652234324', name: '央广-雷盟-知乎-APP内付费-124-7923357' },
  { id: 'a3', no: '1373758652954056', name: '央广-雷盟-知乎-APP内付费-124-7923358' },
  { id: 'a4', no: '1373758651659018', name: '央广-雷盟-知乎-APP内付费-124-7923359' },
];

const isSame = computed(() => props.mode === 'SAME');
/* 线上日预算快捷值 */
const BUDGET_PRESETS = [300, 500, 1000, 2000];

let seq = 1;
/* 规则编号连续：只在这里 +1，外部不再自增 */
function newRule() {
  seq += 1;
  return {
    key: `b${seq}`,
    name: `预算出价规则${seq}`,
    collapsed: false,
    budget: '',
    bid_mode: 'fixed',
    bid: '',
    min_bid: '',
    max_bid: '',
  };
}
function seedRule() {
  return {
    key: 'b1',
    name: '预算出价规则1',
    collapsed: false,
    budget: '999999',
    bid_mode: 'fixed',
    bid: '52',
    min_bid: '',
    max_bid: '',
  };
}

const activeId = ref('a1');
/* 每账户各一份规则；分项目时同一账户下可多规则 */
const rulesMap = reactive({});
ACCOUNTS.forEach((a) => {
  rulesMap[a.id] = [seedRule()];
});
const companyRules = reactive([seedRule()]);
const sameRules = reactive([seedRule()]);

const sideList = computed(() => {
  if (props.mode === 'COMPANY') {
    return [{ id: 'c1', name: '北京雷盟盛通文化发展有限公司', sub: '4 个账户' }];
  }
  return ACCOUNTS.map((a) => ({ id: a.id, name: a.name, sub: a.no }));
});

const currentRules = computed(() => {
  if (isSame.value) return sameRules;
  if (props.mode === 'COMPANY') return companyRules;
  return rulesMap[activeId.value];
});

const allFolded = computed(() => currentRules.value.length > 0 && currentRules.value.every((r) => r.collapsed));

function addRule() {
  const list = currentRules.value;
  if (list.length >= 20) {
    ElMessage.warning('最多添加 20 条规则');
    return;
  }
  const r = newRule();
  list.push(r);
  ElMessage.success(`已添加${r.name}`);
}
function removeRule(r) {
  const list = currentRules.value;
  if (list.length <= 1) return;
  const i = list.findIndex((x) => x.key === r.key);
  if (i < 0) return;
  list.splice(i, 1);
  ElMessage.success('已删除该规则');
}
function toggleAll() {
  const next = !allFolded.value;
  currentRules.value.forEach((r) => { r.collapsed = next; });
}

const copyVisible = ref(false);
const copyCurrent = computed(() => {
  if (props.mode === 'COMPANY') return '北京雷盟盛通文化发展有限公司';
  const a = ACCOUNTS.find((x) => x.id === activeId.value);
  return a ? a.name : '';
});
</script>

<style scoped>
.bp {
  border: 1px solid #e5e6eb;
  background: #fff;
}
.bp--same {
  border: 0;
}
.bp--same .bp__right {
  padding: 0;
}
.bp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px 0 0;
  border-bottom: 1px solid #f2f3f5;
}
.bp__top-left {
  width: 200px;
  padding-left: 16px;
}
.bp__add-rule {
  width: 84px;
}
.bp__top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.bp__link {
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.bp__del {
  font-size: 13px;
  color: #f53f3f;
  cursor: pointer;
}
.bp__main {
  display: flex;
  align-items: flex-start;
}
.bp__side {
  flex: none;
  width: 200px;
  border-right: 1px solid #f2f3f5;
}
.bp__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}
.bp__row.is-active {
  background: #f2f7ff;
}
.bp__row-txt {
  flex: 1;
  min-width: 0;
}
.bp__row-name {
  margin: 0;
  font-size: 13px;
  color: #1d2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bp__row-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #86909c;
}
.bp__ok {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #fff;
  background: #00b42a;
  border-radius: 50%;
}
.bp__right {
  flex: 1;
  min-width: 0;
  padding: 16px;
}
.content-title {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  height: 64px;
  padding: 16px;
  border: 1px solid #dcdee2;
  border-bottom: 0;
}
.content-title__add {
  margin-left: auto;
}
.right-title {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  padding: 12px;
  font-size: 12px;
  line-height: 12px;
  color: #000;
  background: #f2f2f2;
  border: 1px solid #dcdee2;
  border-bottom: 0;
}
.title-label {
  color: #999;
}
.title-text {
  color: #000;
}
.right-content {
  padding: 16px;
  border: 1px solid #dcdee2;
  border-top: 0;
}
.project-bid {
  box-sizing: border-box;
  margin-bottom: 16px;
  border: 1px solid #dcdee2;
  border-bottom: none;
}
.project-bid-title {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 12px;
  font-size: 12px;
  line-height: 12px;
  color: #000;
  background: #f2f2f2;
  border-bottom: 1px solid #dcdee2;
}
.project-bid-ops {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.project-bid-form {
  padding: 16px;
}
.ad-rule__row {
  display: flex;
  align-items: center;
  min-height: 33px;
  margin-bottom: 24px;
}
.ad-rule__row:last-child {
  margin-bottom: 0;
}
.ad-rule__label {
  width: 180px;
  flex: none;
  font-size: 14px;
  line-height: 32px;
  color: #17233d;
}
.ad-rule__q {
  margin-left: 8px;
}
.ad-rule__sep {
  margin: 0 8px;
  color: #c9cdd4;
}
.ad-rule__quick {
  display: inline-flex;
  align-items: center;
  margin-left: 16px;
  font-size: 13px;
}
.ad-rule__quick-item {
  color: #197afb;
  cursor: pointer;
}
.ad-rule__quick-sep {
  margin: 0 4px;
  color: #197afb;
}
</style>
