<template>
  <!--
    标题包抽屉（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 标题包列底「编辑」）

    线上基准（2026-11-26 实测，1920×1080；证据 C:/tmp/verify/diff/）：
      外壳  .cl-drawer  x=904 y=0 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 -8px 0 8px #0003
      头部  .drawer-header  h=50  白底  padding 0 16px  下边框 1px #e8eaec
            头部里是 simple-tabs 页签「手动选取标题 / 动态选取标题」（**没有标题文字**）
            页签项 116×50，x=920 / x=1036；文字 16px/700；激活 #197afb，未激活 #666；下划线 96×2
      内容  .drawer-content  x=920 y=66 w=984 h=944  白底 1px #e8eaec radius 3px padding 16px
      底部  .drawer-footer  x=904 y=1024 w=1016 h=56  白底 上边框 1px #e8eaec padding 12px 16px
            按钮：取 消 / 确 定   各 88×32  12px/500
      关闭键 .drawer-close  x=872 y=10 32×32
      表单   form.el-form  label 宽 160px（14px #666 lh32），右侧内容 margin-left 160px
      控件   el-radio-button__inner：min-width 80px / height 32px / padding 9px 12px / 12px

    依赖关系全部走 spec/title.spec.js + spec/resolve.js，模板里不写散落的 v-if 判定。
  -->
  <BatchDrawer
    v-model="visible"
    :title="''"
    :width="spec.width"
    :cancel-text="spec.footer.cancelText"
    :ok-text="spec.footer.okText"
    @close="onClose"
    @ok="onConfirm"
  >
    <template #footer>
      <div class="tit-footer">
        <button class="tit-btn tit-btn--plain" @click="onClose">取 消</button>
        <button class="tit-btn tit-btn--primary" @click="onConfirm">确 定</button>
      </div>
    </template>
    <template #content>
      <div class="tit-root">
        <!-- 线上头部是页签（不是标题文字） -->
        <div class="tit-tabs">
          <div
            v-for="t in spec.headerTabs"
            :key="t.value"
            class="tit-tabs__item"
            :class="{ 'is-active': titleTab === t.value }"
            @click="onTabChange(t.value)"
          >{{ t.label }}</div>
        </div>

        <!-- ① 手动选取标题 -->
        <div v-show="titleTab === 'manual'" class="tit-body">
          <div class="tit-form">
            <!-- 标题来源 -->
            <div class="tit-row" :style="rowStyle('title_source')">
              <div class="tit-row__label">{{ fieldOf('title_source').label }}</div>
              <div class="tit-row__content">
                <div class="tit-rgroup">
                  <button
                    v-for="o in titleSourceOptions"
                    :key="o.value"
                    class="tit-rbtn"
                    :class="{ 'is-active': v.title_source === o.value }"
                    @click="v.title_source = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 标题分配方式（线上每个选项带 mg-icon-question2 气泡 + 下方说明行） -->
            <div class="tit-row" :style="rowStyle('assign_rule')">
              <div class="tit-row__label">{{ fieldOf('assign_rule').label }}</div>
              <div class="tit-row__content">
                <div class="tit-rgroup">
                  <button
                    v-for="o in fieldOf('assign_rule').options"
                    :key="o.value"
                    class="tit-rbtn"
                    :class="{ 'is-active': v.assign_rule === o.value }"
                    @click="v.assign_rule = o.value"
                  >
                    {{ o.label }}
                    <el-tooltip :content="optionBubbleOf('assign_rule', o.value)" placement="top" :show-after="200">
                      <ClIcon class="tit-qa" :d="icon('question2').d" :size="12" color="#999" />
                    </el-tooltip>
                  </button>
                </div>
                <div class="tit-tip">{{ optionDescOf('assign_rule', v.assign_rule) }}</div>
              </div>
            </div>

            <!-- 每个标题包（线上：标题来源 = 标题库 时出现） -->
            <div v-if="isVisible('title_pack_count')" class="tit-row" :style="rowStyle('title_pack_count')">
              <div class="tit-row__label">{{ fieldOf('title_pack_count').label }}</div>
              <div class="tit-row__content">
                <div class="tit-packcount">
                  <div class="tit-packcount__item">
                    <span class="tit-packcount__pre">{{ fieldOf('title_pack_count').newTitleLabel }}</span>
                    <input
                      class="tit-packcount__input"
                      type="text"
                      :value="v.new_title_count"
                      @input="v.new_title_count = $event.target.value"
                    />
                    <span class="tit-packcount__unit">个新标题</span>
                  </div>
                  <div class="tit-packcount__item">
                    <span class="tit-packcount__pre">{{ fieldOf('title_pack_count').fixedTitleLabel }}</span>
                    <input
                      class="tit-packcount__input"
                      type="text"
                      :value="v.fixed_title_count"
                      @input="v.fixed_title_count = $event.target.value"
                    />
                    <span class="tit-packcount__unit">个固定标题</span>
                  </div>
                </div>
                <div class="tit-tip">{{ fieldOf('title_pack_count').tip }}</div>
              </div>
            </div>
          </div>

          <div class="tit-flex">
            <!-- 左侧账户面板（线上 148px：始终渲染，但非「分账户选择」时 opacity=0） -->
            <div
              v-if="isVisible('account_panel')"
              class="tit-accounts"
              :style="{ opacity: v.assign_rule === 'PER_ACCOUNT' ? 1 : 0 }"
            >
              <div
                v-for="(a, i) in titleAccountRows"
                :key="a.accountId || i"
                class="tit-account"
                :class="{ 'is-active': i === accountIndex }"
                @click="accountIndex = i"
              >
                <span class="tit-account__name" :title="a.account">{{ a.account }}</span>
                <ClIcon
                  class="tit-account__ico"
                  :d="icon('rightBig').d"
                  :size="14"
                  :color="i === accountIndex ? '#197afb' : '#333'"
                />
              </div>
            </div>

            <!-- 右侧标题包列表 -->
            <div class="tit-main">
              <!-- 筛选行 -->
              <div class="tit-filter">
                <!-- 优化师（标题来源 = 标题包） -->
                <div v-if="isVisible('optimizer')" class="tit-filter__area">
                  <label>{{ fieldOf('optimizer').label }}</label>
                  <select v-model="filter.optimizer" class="tit-select tit-select--opt">
                    <option value="">{{ fieldOf('optimizer').placeholder }}</option>
                    <option v-for="o in optimizerOptions" :key="o" :value="o">{{ o }}</option>
                  </select>
                </div>
                <!-- 创建者（标题来源 = 标题库） -->
                <div v-if="isVisible('creator')" class="tit-filter__area">
                  <label>{{ fieldOf('creator').label }}</label>
                  <select v-model="filter.creator" class="tit-select tit-select--opt">
                    <option value="">{{ fieldOf('creator').placeholder }}</option>
                    <option v-for="o in creatorOptions" :key="o" :value="o">{{ o }}</option>
                  </select>
                </div>
                <!-- 分类（标题来源 = 标题库） -->
                <div v-if="isVisible('category')" class="tit-filter__area">
                  <label>{{ fieldOf('category').label }}</label>
                  <select v-model="filter.category" class="tit-select tit-select--cat">
                    <option value="">{{ fieldOf('category').placeholder }}</option>
                    <option v-for="o in categoryOptions" :key="o" :value="o">{{ o }}</option>
                  </select>
                </div>
                <!-- 拒审次数 -->
                <div class="tit-filter__area">
                  <label>{{ fieldOf('reject_count').label }}</label>
                  <div class="tit-compare">
                    <select v-model="filter.rejectOp" class="tit-select tit-select--op">
                      <option v-for="o in fieldOf('reject_count').opOptions" :key="o" :value="o">{{ o }}</option>
                    </select>
                    <input v-model="filter.rejectVal" class="tit-num" type="text" />
                  </div>
                </div>
                <!-- 建议次数 -->
                <div class="tit-filter__area">
                  <label>{{ fieldOf('suggest_count').label }}</label>
                  <div class="tit-compare">
                    <select v-model="filter.suggestOp" class="tit-select tit-select--op">
                      <option v-for="o in fieldOf('suggest_count').opOptions" :key="o" :value="o">{{ o }}</option>
                    </select>
                    <input v-model="filter.suggestVal" class="tit-num" type="text" />
                  </div>
                </div>
                <!-- 关键词 -->
                <div class="tit-filter__area tit-filter__area--search">
                  <input v-model="filter.keyword" class="tit-search" type="text" :placeholder="fieldOf('keyword').placeholder" @keyup.enter="onSearch" />
                  <el-icon class="tit-search__icon" @click="onSearch"><Search /></el-icon>
                </div>
                <button class="tit-clear" @click="onReset">{{ fieldOf('clear').text }}</button>
              </div>

              <!-- 工具条 -->
              <div class="tit-toolbar">
                <button class="tit-btn tit-btn--primary tit-btn--w120" @click="onPrimary">
                  <ClIcon class="tit-plus" :d="icon('plus').d" :size="12" color="#fff" />{{ primaryBtnText }}
                </button>
                <div class="tit-toolbar__ml16">
                  <button
                    v-for="b in secondaryButtons"
                    :key="b"
                    class="tit-btn tit-btn--w120"
                    @click="openScreenDialog(b)"
                  >{{ b }}</button>
                </div>
                <span class="tit-selected">已选：<span class="tit-selected__num">{{ picked.length }}</span>/{{ limitCount }}</span>
              </div>

              <!-- 标题包表（线上 12 列：多选 + 10 列 + 操作） -->
              <div class="tit-table-wrap">
              <table class="tit-table">
                <thead>
                  <tr>
                    <th v-for="c in tableColumns" :key="c.key" :style="{ width: c.width + 'px' }" :class="{ 'is-center': c.align === 'center' }">
                      {{ c.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in packRows" :key="ri">
                    <td
                      v-for="c in tableColumns"
                      :key="c.key"
                      :class="{ 'is-center': c.align === 'center' }"
                      :style="{ width: c.width + 'px', minWidth: c.width + 'px', maxWidth: c.width + 'px' }"
                    >
                      <template v-if="c.key === '__selection'">
                        <input type="checkbox" :checked="picked.includes(row)" @change="togglePick(row)" />
                      </template>
                      <template v-else-if="c.key === 'name'">
                        <span class="tit-pop__ref">{{ row.name }}</span>
                      </template>
                      <template v-else-if="c.key === 'reject' || c.key === 'suggest'">
                        <span v-if="row[c.key] && row[c.key] !== '--'" class="tit-tag tit-tag--red">{{ row[c.key] }}次</span>
                        <span v-else>--</span>
                      </template>
                      <template v-else-if="c.key === 'op'">
                        <button class="tit-link" @click="editRow(row)">编辑</button>
                      </template>
                      <template v-else>{{ row[c.key] ?? '--' }}</template>
                    </td>
                  </tr>
                  <tr v-if="!packRows.length">
                    <td :colspan="tableColumns.length" class="tit-empty">暂无数据</td>
                  </tr>
                </tbody>
              </table>
              </div>

              <!-- 分页 -->
              <div class="tit-pager">
                <span class="tit-pager__total">共 {{ packRows.length }} 条</span>
                <select v-model="pageSize" class="tit-select tit-select--size">
                  <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}条/页</option>
                </select>
                <button class="tit-pager__btn" :disabled="page <= 1" @click="page -= 1">‹</button>
                <span class="tit-pager__num">{{ page }}</span>
                <button class="tit-pager__btn" :disabled="page >= totalPages" @click="page += 1">›</button>
                <span class="tit-pager__jump">前往</span>
                <input v-model="jumpPage" class="tit-num tit-num--jump" type="text" @keyup.enter="onJump" />
                <span class="tit-pager__jump">页</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ② 动态选取标题 -->
        <div v-show="titleTab === 'dynamic'" class="tit-body">
          <div class="tit-form">
            <!-- 每个广告标题数量（模式） -->
            <div class="tit-row" :style="rowStyle('dyn_count_mode')">
              <div class="tit-row__label">{{ fieldOf('dyn_count_mode').label }}</div>
              <div class="tit-row__content">
                <div class="tit-rgroup">
                  <button
                    v-for="o in fieldOf('dyn_count_mode').options"
                    :key="o.value"
                    class="tit-rbtn"
                    :class="{ 'is-active': v.dyn_count_mode === o.value }"
                    @click="v.dyn_count_mode = o.value"
                  >
                    {{ o.label }}
                    <el-tooltip
                      :content="o.value === 'SAME' ? '每个账户都按该规则设置' : '每条规则单独设置每个广告标题数量'"
                      placement="top"
                      :show-after="200"
                    >
                      <ClIcon class="tit-qa" :d="icon('question2').d" :size="12" color="#999" />
                    </el-tooltip>
                  </button>
                </div>
              </div>
            </div>

            <!-- 每个广告标题数量（数值） -->
            <div v-if="isVisible('dyn_count')" class="tit-row" :style="rowStyle('dyn_count')">
              <div class="tit-row__label">{{ fieldOf('dyn_count').label }}</div>
              <div class="tit-row__content">
                <input v-model="v.dyn_count" class="tit-num tit-num--wide" type="text" />
              </div>
            </div>

            <!-- 规则分配方式 -->
            <div class="tit-row" :style="rowStyle('dyn_rule_match')">
              <div class="tit-row__label">{{ fieldOf('dyn_rule_match').label }}</div>
              <div class="tit-row__content">
                <div class="tit-rgroup">
                  <button
                    v-for="o in fieldOf('dyn_rule_match').options"
                    :key="o.value"
                    class="tit-rbtn"
                    :class="{ 'is-active': v.dyn_rule_match === o.value }"
                    @click="v.dyn_rule_match = o.value"
                  >
                    {{ o.label }}
                    <el-tooltip :content="optionBubbleOf('dyn_rule_match', o.value)" placement="top" :show-after="200">
                      <ClIcon class="tit-qa" :d="icon('question2').d" :size="12" color="#999" />
                    </el-tooltip>
                  </button>
                </div>
                <div class="tit-tip">{{ optionDescOf('dyn_rule_match', v.dyn_rule_match) }}</div>
              </div>
            </div>

            <!-- 选取标题不足时 -->
            <div class="tit-row" :style="rowStyle('dyn_shortage')">
              <div class="tit-row__label">{{ fieldOf('dyn_shortage').label }}</div>
              <div class="tit-row__content">
                <div class="tit-rgroup">
                  <button
                    v-for="o in fieldOf('dyn_shortage').options"
                    :key="o.value"
                    class="tit-rbtn"
                    :class="{ 'is-active': v.dyn_shortage === o.value }"
                    @click="v.dyn_shortage = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 标题循环使用上限 -->
            <div v-if="isVisible('loop_limit')" class="tit-row" :style="rowStyle('loop_limit')">
              <div class="tit-row__label">{{ fieldOf('loop_limit').label }}</div>
              <div class="tit-row__content">
                <input v-model="v.loop_limit" class="tit-num" type="text" />
                <span class="tit-unit">{{ fieldOf('loop_limit').unit }}</span>
                <div v-for="(t, i) in fieldOf('loop_limit').tips" :key="i" class="tit-tip">{{ t }}</div>
              </div>
            </div>
          </div>

          <!-- 动态选取标题主体：分账户选择时左侧账户列 + 右侧规则卡片 -->
          <div class="tit-dynbody">
            <!-- 分账户选择时的账户列表（线上左侧账户列，行高 54） -->
            <div v-if="isVisible('account_panel')" class="tit-accounts tit-accounts--dyn">
              <div
                v-for="(a, i) in titleAccountRows"
                :key="a.accountId || i"
                class="tit-account"
                :class="{ 'is-active': i === accountIndex }"
                @click="accountIndex = i"
              >
                <span class="tit-account__name" :title="a.account">{{ a.account }}</span>
                <ClIcon
                  class="tit-account__ico"
                  :d="icon('rightBig').d"
                  :size="14"
                  :color="i === accountIndex ? '#197afb' : '#333'"
                />
              </div>
            </div>

            <!-- 动态选取规则卡片 -->
            <div class="tit-rules">
              <div class="tit-rules__head">
                <span class="tit-rules__title">动态选取规则</span>
                <button
                  v-if="isVisible('copy_to_other_account')"
                  class="tit-link tit-rules__copy"
                  :disabled="!copyAccountRows.length"
                  @click="copyRulesToOtherAccounts"
                >{{ fieldOf('copy_to_other_account').text }}</button>
                <button
                  v-for="b in dynamicTab.toolbar"
                  :key="b"
                  class="tit-btn tit-btn--primary tit-rules__add"
                  :disabled="dynRuleCount >= (fieldOf('dyn_rules').maxRules || 2)"
                  @click="openRuleDrawer(-1)"
                >
                  <ClIcon class="tit-plus" :d="icon('plus').d" :size="12" color="#fff" />{{ b }}
                </button>
              </div>

              <!-- 空态（线上：插画 + 「暂无动态选取规则，点击添加」） -->
              <div v-if="!dynRules.length" class="tit-emptybox">
                <svg class="tit-emptybox__pic" viewBox="0 0 160 140" aria-hidden="true">
                  <rect x="30" y="18" width="96" height="104" rx="8" fill="#f2f7ff" stroke="#c7ddff" stroke-width="2" />
                  <rect x="44" y="34" width="60" height="6" rx="3" fill="#dbe8ff" />
                  <rect x="44" y="50" width="68" height="6" rx="3" fill="#dbe8ff" />
                  <rect x="44" y="66" width="52" height="6" rx="3" fill="#dbe8ff" />
                  <rect x="44" y="82" width="64" height="6" rx="3" fill="#dbe8ff" />
                  <circle cx="112" cy="96" r="22" fill="#ffffff" stroke="#5b8ff9" stroke-width="3" />
                  <path d="M102 96l7 8 13-15" fill="none" stroke="#5b8ff9" stroke-width="3" stroke-linecap="round" />
                  <circle cx="126" cy="34" r="10" fill="#7f9cf5" opacity=".25" />
                  <circle cx="36" cy="112" r="8" fill="#7f9cf5" opacity=".2" />
                </svg>
                <div class="tit-emptybox__text">
                  <span>{{ emptyDynRuleText }}</span>
                  <button
                    class="tit-link"
                    :disabled="dynRuleCount >= (fieldOf('dyn_rules').maxRules || 2)"
                    @click="openRuleDrawer(-1)"
                  >点击添加</button>
                </div>
              </div>

              <!-- 规则列表（线上 DynamicRuleItem：规则列 + 复制/编辑/删除） -->
              <div v-for="(r, ri) in dynRules" :key="ri" class="tit-dynrule">
                <span class="tit-dynrule__col">{{ ruleFetchLabel(r) }}</span>
                <span class="tit-dynrule__col">{{ ruleFilterLabel(r) }}</span>
                <span class="tit-dynrule__col">{{ ruleTimeLabel(r) }}</span>
                <span v-if="isDynamicRuleCount" class="tit-dynrule__col">{{ r.count ?? '—' }}</span>
                <span class="tit-dynrule__ops">
                  <button class="tit-link" @click="copyRule(ri)">复制</button>
                  <button class="tit-link" @click="openRuleDrawer(ri)">编辑</button>
                  <button class="tit-link tit-link--danger" @click="removeDynRule(ri)">删除</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 二级弹窗（2026-11-27 线上取证新增，见 capture/online-title/SOURCE-FINDINGS.md） -->
      <BatchTitlePackageDialog
        v-model="pkgDialogVisible"
        :mode="pkgDialogMode"
        :init="pkgDialogInit"
        :max-titles="maxTitleCount"
        @confirm="onPackageConfirm"
      />
      <BatchTitleAddDialog
        v-model="titleAddVisible"
        :categories="titleCategories"
        :init="titleAddInit"
        @confirm="onTitleAddConfirm"
      />
      <BatchTitleScreenDialog
        v-model="screenDialogVisible"
        :variant="screenVariant"
        :categories="titleCategories"
        :max-title-count="maxTitleCount"
        :fixed-title-count="Number(v.fixed_title_count || 0)"
        @confirm="onScreenConfirm"
      />
      <BatchCopyAccountDialog
        v-model="copyAccountVisible"
        :current-account="currentCopyAccount"
        :rows="copyAccountRows"
      />
      <BatchTitleRuleDrawer
        v-model="ruleDrawerVisible"
        :init="ruleDraft"
        :categories="titleCategories"
        :is-dynamic-rule-count="isDynamicRuleCount"
        :max-title-count="maxTitleCount"
        @confirm="onRuleConfirm"
      />
    </template>
  </BatchDrawer>
</template>

<script setup>
import { computed, h, inject, reactive, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import BatchDrawer from './BatchDrawer.vue';
import BatchTitlePackageDialog from './BatchTitlePackageDialog.vue';
import BatchTitleAddDialog from './BatchTitleAddDialog.vue';
import BatchCopyAccountDialog from './BatchCopyAccountDialog.vue';
import BatchTitleScreenDialog from './BatchTitleScreenDialog.vue';
import BatchTitleRuleDrawer from './BatchTitleRuleDrawer.vue';
import spec from './spec/title.spec.js';
import {
  isVisible as specVisible,
  isDisabled as specDisabled,
  bubbleText,
  optionBubbleText,
} from './spec/resolve.js';

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
});
const emit = defineEmits(['update:modelValue']);

/* R110：整个 setup 作用域由 Create.vue 通过 provide('batch') 暴露 */
const batch = inject('batch');
const {
  form,
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

const manualTab = spec.tabs.find((t) => t.value === 'manual');
const dynamicTab = spec.tabs.find((t) => t.value === 'dynamic');

/**
 * 打开状态直接跟随 v-model。
 *
 * R115 时 Create.vue 里还残留一份旧版「添加标题包」内联抽屉（el-drawer），
 * 它与本组件绑定同一个 titleVisible，且 EP 弹层 z-index(2042) > 本抽屉(2001)，
 * 旧版会整块盖住本抽屉，只能用「接管 titleVisible 再复位」的 hack 绕开。
 * 现已删除 Create.vue 里的旧版内联抽屉，本组件是 titleVisible 的唯一消费者，
 * 故恢复为最直接的 v-model 绑定。
 */
const visible = computed({
  get: () => props.modelValue === true,
  set: (v) => {
    emit('update:modelValue', v);
  },
});

/** 线上 iconfont 字形 → 内联 SVG（本地无 iconfont 字体文件） */
const ClIcon = (props) => h(
  'svg',
  {
    class: 'cl-ico',
    width: props.size,
    height: props.size,
    viewBox: '0 -128 1024 1024',
    style: { color: props.color || 'currentColor' },
  },
  [h('path', { d: props.d, fill: 'currentColor' })],
);
function icon(name) {
  return (spec.icons && spec.icons[name]) || { d: '', size: 12 };
}

/* 抽屉内表单值（默认值统一来自 spec.values） */
const v = reactive(Object.assign({}, spec.values));

const filter = reactive({
  optimizer: '',
  creator: '',
  category: '',
  rejectOp: '小于或等于',
  rejectVal: '',
  suggestOp: '小于或等于',
  suggestVal: '',
  keyword: '',
});

const picked = ref([]);
const page = ref(1);
const pageSize = ref(10);
const jumpPage = ref('');
const accountIndex = ref(0);

const pageSizes = manualTab.pagination.pageSizes;

/** 当前页签的 spec 字段表（sections.fields + 筛选行配置） */
const fieldMap = computed(() => {
  const tab = spec.tabs.find((t) => t.value === titleTab.value) || manualTab;
  const m = {};
  (tab.sections || []).forEach((s) => (s.fields || []).forEach((f) => { m[f.key] = f; }));
  /* 非当前页签的区块也会被渲染（如「动态选取规则」空态），若字段只存在于别的页签，
   * 上面这句取不到 → fieldOf 返回 {} → 模板取 emptyText 等属性时报 undefined 崩溃。
   * 这里把所有页签的字段兜底合并进来（同 key 以当前页签为准）。 */
  (spec.tabs || []).forEach((t) => {
    if (t === tab) return;
    (t.sections || []).forEach((s) => (s.fields || []).forEach((f) => {
      if (!m[f.key]) m[f.key] = f;
    }));
  });
  Object.keys(tab.filter || {}).forEach((k) => {
    if (!m[k]) m[k] = Object.assign({ key: k }, tab.filter[k]);
  });
  return m;
});
function fieldOf(key) {
  return fieldMap.value[key] || {};
}
/* 动态规则空态文案：「暂无动态选取规则， 点击添加」取逗号前半句 + 逗号 */
const emptyDynRuleText = computed(() => {
  const raw = String(fieldOf('dyn_rules').emptyText || '暂无动态选取规则，点击添加');
  return `${raw.split('，')[0]}，`;
});
/** 行间距 / 行高（线上实测） */
function gapOf(key) {
  const f = fieldOf(key);
  return f.gapAfter !== undefined ? f.gapAfter : 20;
}
function rowH(key) {
  const f = fieldOf(key);
  return f.rowHeight !== undefined ? f.rowHeight : 0;
}
function rowStyle(key) {
  return {
    marginBottom: gapOf(key) + 'px',
    minHeight: rowH(key) ? rowH(key) + 'px' : '0',
  };
}
/** 依赖判定统一走 resolve.js */
function isVisible(key) {
  return specVisible(fieldOf(key), v);
}
function isDisabled(key) {
  return specDisabled(fieldOf(key), v);
}
function bubbleOf(key) {
  return bubbleText(fieldOf(key), v);
}
function optionBubbleOf(key, ov) {
  return optionBubbleText(fieldOf(key), v, ov);
}
/** 选中项的说明文案（线上：随选中项变化的一行说明） */
function optionDescOf(key, value) {
  const o = (fieldOf(key).options || []).find((x) => x.value === value);
  return o ? o.desc : '';
}

/**
 * 标题来源选项（线上源码共 4 个 radio-button，但只有 2 个默认渲染）：
 *   titlePackage(showTitlePackageSource) / titleLibrary(恒显示)
 *   materialName(showMaterialNameTitleSource，默认 false) / originalVideoTitle(showOriginalVideoTitle，默认 false)
 * 开关由父组件 props 下发；本地未接到该开关时，后两个保持隐藏（与线上一致）。
 */
const titleSourceOptions = computed(() => {
  const list = fieldOf('title_source').options || [];
  const flags = {
    showMaterialNameTitleSource: false,
    showOriginalVideoTitle: false,
    showTitlePackageSource: true,
  };
  return list.filter((o) => !o.flag || flags[o.flag] !== false);
});

/** 动态选取规则条数（线上「复制到其他账户」在无规则时置灰；规则最多 2 条） */
const dynRuleCount = computed(() => ((form && form.titles && form.titles.dyn_rules) || []).length);

/* ==================================================================
 * 【2026-11-27 线上取证新增】二级弹窗的状态与交互
 * 证据：capture/online-title/SOURCE-FINDINGS.md §4 / §5
 * ================================================================== */

/** 线上 maxTitleCount 默认 10（每个标题包最多几个标题） */
const maxTitleCount = computed(() => (spec.onlineProps && spec.onlineProps.maxTitleCount) || 10);

/** 动态选取规则（线上 form.titles.dyn_rules，元素为完整规则对象） */
const dynRules = computed(() => ((form && form.titles && form.titles.dyn_rules) || []));
/** 「分规则设置」→ 每个广告标题数量在规则里设置 */
const isDynamicRuleCount = computed(() => v.dyn_count_mode === 'RULE');

/** 标题分类（线上来自 /Media/Title/listTitleCategory，本地取 mock 列表） */
const titleCategories = computed(() => categoryOptions.value.map((name, i) => ({ id: i + 1, name })));

/* --- 新建 / 编辑 标题包弹窗 --- */
const pkgDialogVisible = ref(false);
const pkgDialogMode = ref('add');
const pkgDialogInit = ref({});

/* --- 添加标题弹窗（标题库来源下「+ 新建标题」，线上图3） --- */
const titleAddVisible = ref(false);
const titleAddInit = ref({});
/** 当前正在编辑的标题行（null = 新建） */
const editingTitleRow = ref(null);

/* --- 随机选择 / 智能优选 / 一键测新 弹窗 --- */
const screenDialogVisible = ref(false);
const screenVariant = ref('random');

/* --- 动态选取规则编辑抽屉 --- */
const ruleDrawerVisible = ref(false);
const ruleDraft = ref(null);
const ruleEditIndex = ref(-1);

function onPrimary() {
  if (v.title_source === 'TITLE_LIB') {
    // 线上：标题库模式下主按钮「新建标题」→ 打开「添加标题」弹窗（含插入动态词包）
    editingTitleRow.value = null;
    titleAddInit.value = {};
    titleAddVisible.value = true;
    return;
  }
  pkgDialogMode.value = 'add';
  pkgDialogInit.value = {};
  pkgDialogVisible.value = true;
}

/** 列表「编辑」：把该行标题回填到「添加标题」弹窗 */
function editRow(row) {
  editingTitleRow.value = row;
  titleAddInit.value = {
    category: row.category && row.category !== '--' ? row.category : '',
    text: (row.titles && row.titles.length ? row.titles : [row.name]).join('\n'),
  };
  titleAddVisible.value = true;
}

/** 添加标题确定：新建写入列表 / 编辑回写原行 */
function onTitleAddConfirm({ category: cat, titles }) {
  const editing = editingTitleRow.value;
  const patch = {
    name: titles[0],
    title: titles[0],
    titles,
    category: cat || '--',
    count: titles.length,
  };
  if (editing) {
    Object.assign(editing, patch);
    editingTitleRow.value = null;
    ElMessage.success('修改成功');
    return;
  }
  const row = {
    ...patch,
    reject: '--',
    suggest: '--',
    creator: '北京央广时代文化传播有限公司',
    ctr3: '--',
    cost3: '--',
    ctr90: '--',
    cost90: '--',
    created: new Date().toISOString().slice(0, 10),
  };
  titlePackRows.value = [row, ...(titlePackRows.value || [])];
  picked.value = [row];
  ElMessage.success('新建成功');
}

/** 三个副按钮 → 共用弹窗，variant 决定标题/气泡/接口 */
function openScreenDialog(label) {
  const map = { 随机选择: 'random', 智能优选: 'smart', 一键测新: 'recent' };
  screenVariant.value = map[label] || 'random';
  screenDialogVisible.value = true;
}

function onPackageConfirm({ name, titles }) {
  // 线上确定后会把新标题包写回列表并选中
  const row = {
    name,
    title: name,
    titles,
    count: titles.length,
    reject: '--',
    suggest: '--',
    creator: '北京央广时代文化传播有限公司',
    ctr3: '--',
    cost3: '--',
    ctr90: '--',
    cost90: '--',
    created: new Date().toISOString().slice(0, 10),
  };
  const rows = titlePackRows.value || [];
  titlePackRows.value = [row, ...rows];
  picked.value = [row];
  ElMessage.success('新建成功');
}

function onScreenConfirm(payload) {
  // 线上按 variant 调不同接口拿标题；本地用 mock 行回填
  const rows = titlePackRows.value || [];
  const row = {
    name: `${screenVariant.value === 'smart' ? '智能优选' : screenVariant.value === 'recent' ? '一键测新' : '随机选择'}标题包`,
    title: '随机选择标题包',
    reject: '--',
    suggest: '--',
    creator: '北京央广时代文化传播有限公司',
    ctr3: '--',
    cost3: '--',
    ctr90: '--',
    cost90: '--',
    count: Number(payload.limit_num) || 0,
    created: new Date().toISOString().slice(0, 10),
  };
  titlePackRows.value = [row, ...rows];
  picked.value = [row];
  ElMessage.success('添加标题成功');
}

/** 打开规则编辑抽屉；index=-1 新增，否则编辑 */
function openRuleDrawer(index) {
  ruleEditIndex.value = index;
  ruleDraft.value = index >= 0 ? JSON.parse(JSON.stringify(dynRules.value[index] || {})) : null;
  ruleDrawerVisible.value = true;
}

function onRuleConfirm(rule) {
  const list = dynRules.value;
  if (ruleEditIndex.value >= 0 && list[ruleEditIndex.value]) {
    list.splice(ruleEditIndex.value, 1, rule);
  } else {
    list.push(rule);
  }
  ruleDrawerVisible.value = false;
  ElMessage.success(ruleEditIndex.value >= 0 ? '规则已更新' : '添加动态选取规则');
}

/** 复制一条规则（线上 DynamicRuleItem「复制」） */
function copyRule(index) {
  const src = dynRules.value[index];
  if (!src) return;
  const max = fieldOf('dyn_rules').maxRules || 2;
  if (dynRuleCount.value >= max) {
    ElMessage.warning(`动态选取规则最多 ${max} 条`);
    return;
  }
  dynRules.value.splice(index + 1, 0, JSON.parse(JSON.stringify(src)));
}

/** 复制到其他账户：线上为「复用到其他账户」弹窗（勾选目标账户后确定） */
const copyAccountVisible = ref(false);
const currentCopyAccount = computed(() => {
  const row = (titleAccountRows.value || [])[accountIndex.value];
  return row ? row.account : '';
});
/** 目标账户 = 除当前在投账户外的其他账户 */
const copyAccountRows = computed(() => (titleAccountRows.value || [])
  .map((row, i) => ({ row, i }))
  .filter((it) => it.i !== accountIndex.value)
  .map((it) => ({ account: it.row.account, accountId: it.row.accountId })));

function copyRulesToOtherAccounts() {
  copyAccountVisible.value = true;
}

/* --- 规则列表的列文案（线上 dynamic-title-DGnKLaF3.js 的列 formatter） --- */
const FETCH_METHOD_LABELS = { random: '随机选择', new: '最新标题' };
const FILTER_LABELS = {
  '': '不限',
  exclude_today_is_used: '当日已使用',
  suggestion_num: '建议次数',
  reject_num: '拒审次数',
};
const TIME_RELATE_LABELS = {
  1: '当日', '-1': '仅昨日', 2: '2天内', 3: '3天内', 7: '7天内',
  14: '14天内', 30: '30天内', 60: '60天内', 90: '90天内',
};

function ruleFetchLabel(r) {
  if (!r) return '—';
  if (r.fetch_method) return FETCH_METHOD_LABELS[r.fetch_method] || '—';
  return '随机选择';
}
function ruleFilterLabel(r) {
  const list = (r && r.filter_conditions) || [];
  if (!list.length) return '不限';
  return list.map((c) => FILTER_LABELS[c] || c).join('、');
}
function ruleTimeLabel(r) {
  if (!r) return '—';
  if (r.time_type === 1) return TIME_RELATE_LABELS[r.time_days] || '—';
  return `${r.start_time || ''} 至 ${r.end_time || ''}`;
}

/** 优化师下拉 */
const optimizerOptions = computed(() => {
  const list = (titleAccountRows.value || []).map((a) => a.optimizer).filter(Boolean);
  return Array.from(new Set(list));
});
/** 创建者下拉（线上标题库表格的创建者列） */
const creatorOptions = computed(() => {
  const list = (titlePackRows.value || []).map((r) => r.creator).filter(Boolean);
  return Array.from(new Set(list));
});
/** 分类下拉（线上标题库表格的分类筛选项） */
const categoryOptions = computed(() => ['通用', '游戏', '电商', '教育', '金融']);

/** 工具条主按钮：标题来源 = 标题库 时「新建标题包」→「新建标题」 */
const primaryBtnText = computed(() => {
  const rename = manualTab.toolbar.primaryButtonRename || {};
  const base = manualTab.toolbar.buttons.find((b) => rename[b]) || manualTab.toolbar.buttons[0];
  return rename[base] || base;
});
/** 工具条其余按钮（去掉主按钮） */
const secondaryButtons = computed(() => {
  const rename = manualTab.toolbar.primaryButtonRename || {};
  return manualTab.toolbar.buttons.filter((b) => !rename[b] && b !== primaryBtnText.value);
});

/** 上限：线上 标准版 200 / 全域 100 */
const limitCount = computed(() => {
  const total = (isUni && isUni.value) ? 100 : 200;
  const used = (form?.ad?.title_packs || []).length;
  return Math.max(0, total - used);
});

/** 表格列：标题来源 = 标题库 时换成标题库表格 */
const tableColumns = computed(() => {
  if (v.title_source === 'TITLE_LIB') return manualTab.titleLibTable.columns;
  return manualTab.table.columns;
});

/** 表格数据 */
const packRows = computed(() => {
  const rows = titlePackRows.value || [];
  const kw = String(filter.keyword || '').trim().toLowerCase();
  if (!kw) return rows;
  return rows.filter((r) => Object.values(r || {}).some((x) => String(x).toLowerCase().includes(kw)));
});

const totalPages = computed(() => Math.max(1, Math.ceil(packRows.value.length / pageSize.value)));

function togglePick(row) {
  const i = picked.value.indexOf(row);
  if (i >= 0) picked.value.splice(i, 1);
  else picked.value.push(row);
}

function onSearch() {
  page.value = 1;
}
function onReset() {
  filter.optimizer = '';
  filter.creator = '';
  filter.category = '';
  filter.rejectOp = '小于或等于';
  filter.rejectVal = '';
  filter.suggestOp = '小于或等于';
  filter.suggestVal = '';
  filter.keyword = '';
  form.titles.reject_count = 0;
  form.titles.suggest_count = 0;
  page.value = 1;
}
function onJump() {
  const n = Number(jumpPage.value);
  if (n >= 1 && n <= totalPages.value) page.value = n;
}
function removeDynRule(ri) {
  form.titles.dyn_rules.splice(ri, 1);
}
function onTabChange(val) {
  titleTab.value = val;
}

/** 已确认过的抽屉值（回显用）；未确认过时用线上默认值 */
const confirmed = { done: false };

watch(visible, (val) => {
  if (val) {
    const t = confirmed.done ? (form?.titles || {}) : {};
    /* 规则数组兜底（Create.vue 的旧 addTitleDynRule 也会往这里 push） */
    if (form && form.titles && !Array.isArray(form.titles.dyn_rules)) form.titles.dyn_rules = [];
    v.title_source = t.title_source || 'TITLE_PACK';
    v.assign_rule = t.assign_rule || 'REUSE';
    v.new_title_count = String(t.new_title_count ?? 10);
    v.fixed_title_count = String(t.fixed_title_count ?? 0);
    v.dyn_count_mode = t.dyn_count_mode || 'SAME';
    v.dyn_count = String(t.dyn_count ?? 1);
    v.dyn_rule_match = t.dyn_rule_match || 'REUSE';
    v.dyn_shortage = t.dyn_shortage || 'SKIP';
    filter.optimizer = '';
    filter.creator = '';
    filter.category = '';
    filter.rejectOp = '小于或等于';
    filter.rejectVal = '';
    filter.suggestOp = '小于或等于';
    filter.suggestVal = '';
    filter.keyword = '';
    picked.value = [];
    page.value = 1;
    accountIndex.value = 0;
  }
}, { immediate: true });

function onConfirm() {
  confirmed.done = true;
  const names = picked.value.map((r) => r.name).filter(Boolean);
  form.titles.title_pack_ids = names;
  const ids = (titlePacks.value || [])
    .filter((t) => names.includes(t.title))
    .map((t) => t.id);
  if (ids.length) form.ad.title_packs = ids;
  form.titles.title_source = v.title_source;
  form.titles.assign_rule = v.assign_rule;
  form.titles.new_title_count = Number(v.new_title_count) || 0;
  form.titles.fixed_title_count = Number(v.fixed_title_count) || 0;
  form.titles.dyn_count_mode = v.dyn_count_mode;
  form.titles.dyn_count = Number(v.dyn_count) || 1;
  form.titles.dyn_rule_match = v.dyn_rule_match;
  form.titles.dyn_shortage = v.dyn_shortage;
  visible.value = false;
}
function onClose() {
  visible.value = false;
}
</script>

<style>
/* ===== 线上 cl-drawer 外壳微调（BatchDrawer.vue 提供基础版式） =====
   线上实测（标题包抽屉）：
     .drawer-header   h=50（里面是 simple-tabs，没有标题文字）
     .drawer-content  x=920 y=66 w=984 h=944  margin 16px padding 16px 白底 1px #e8eaec radius 3px
     .drawer-footer   x=904 y=1024 w=1016 h=56  absolute bottom:0  padding 12px 16px
     页脚按钮 88×32 12px/500；取 消 x=1712 确 定 x=1816（间距 16） */
.cl-drawer:has(.tit-root) .cl-drawer__header {
  box-sizing: border-box;
  height: 50px;
  padding: 0 16px;
}
.cl-drawer:has(.tit-root) .cl-drawer__title { display: none; }
.cl-drawer:has(.tit-root) .cl-drawer__content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  box-sizing: border-box;
  height: calc(100vh - 136px);
  flex: none;
}
.cl-drawer:has(.tit-root) .cl-drawer__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 56px;
  padding: 12px 16px;
  align-items: flex-start;
}
.cl-drawer:has(.tit-root) .cl-drawer__footer .tit-btn {
  width: 88px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
</style>

<style scoped>
/* ===== 头部页签（线上 simple-tabs header-tabs） =====
   线上：项 116×50，x=920 / x=1036；文字 16px/700；激活 #197afb，未激活 #666；下划线 96×2 */
.tit-root, .tit-root *, .tit-root *::before, .tit-root *::after { box-sizing: border-box; }

/* 内联 iconfont 复刻图标 */
.cl-ico { vertical-align: -2px; flex: none; }

.tit-tabs {
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 50px;
  display: flex;
  align-items: center;
}
.tit-tabs__item {
  position: relative;
  flex: 0 0 116px;
  width: 116px;
  height: 50px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 700;
  line-height: 50px;
  color: #666;
  white-space: nowrap;
  cursor: pointer;
}
.tit-tabs__item:first-child { padding-left: 0; }
.tit-tabs__item:last-child { padding-right: 0; }
.tit-tabs__item.is-active { color: #197afb; }
.tit-tabs__item.is-active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 2px;
  background: #197afb;
}
.tit-tabs__item:first-child.is-active::after { left: 0; right: 10px; }
.tit-tabs__item:last-child.is-active::after { left: 10px; right: 0; }

/* ===== 表单行（线上 label 宽 160px 左对齐） ===== */
.tit-row { display: flex; align-items: flex-start; }
.tit-row__label {
  flex: 0 0 160px;
  width: 160px;
  padding-right: 12px;
  font-size: 14px;
  line-height: 32px;
  color: #666;
}
.tit-row__label--req::before { content: '*'; margin-right: 4px; color: #f53f3f; }
.tit-row__content { flex: 1; min-width: 0; }

.tit-rgroup { display: flex; align-items: center; }
.tit-rbtn {
  min-width: 80px;
  height: 32px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  margin-right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: 1px;
}
.tit-rbtn:first-child { border-radius: 3px 0 0 3px; }
/* 线上 Element UI：非首项 border-left:0（宽 0），相邻项紧贴无负 margin */
.tit-rbtn + .tit-rbtn { border-left-width: 0; }
.tit-rbtn:last-child { border-radius: 0 3px 3px 0; }
.tit-rbtn.is-active { color: #197afb; background: #d6eaff; border-color: #197afb; z-index: 1; }
.tit-qa { margin-left: 12px; color: #999; cursor: help; vertical-align: -3px; }

/* 说明行（线上 .form-item-tips：12px #999，行高 24px） */
.tit-tip { width: 100%; margin-top: 1px; font-size: 12px; line-height: 24px; color: #999; }

/* 每个标题包（线上 el-input-number 宽 70px） */
.tit-packcount { display: flex; align-items: center; gap: 24px; }
.tit-packcount__item { display: flex; align-items: center; gap: 8px; }
.tit-packcount__pre { font-size: 14px; color: #606266; }
.tit-packcount__input {
  width: 70px;
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  text-align: center;
}
.tit-packcount__unit { font-size: 14px; color: #606266; }

/* 主体布局 */
.tit-flex { display: flex; align-items: flex-start; }
.tit-accounts {
  /* 线上 .account-panel：账户竖列 148 宽，行高 56，选中行浅蓝底 */
  flex: 0 0 148px;
  width: 148px;
  margin-right: 12px;
  border: 1px solid #ebedf0;
  box-sizing: border-box;
}
.tit-accounts--dyn { margin-top: 12px; }
.tit-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: 56px;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 20px;
  color: #4e5969;
  cursor: pointer;
  border-bottom: 1px solid #ebedf0;
  overflow: hidden;
}
.tit-account:last-child { border-bottom: 0; }
.tit-account:hover { background: #f7f8fa; }
.tit-account.is-active { color: #197afb; background: #eef4ff; }
.tit-account__name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tit-account__ico { flex: none; }
.tit-main { flex: 1; min-width: 0; }

/* 筛选行 */
.tit-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; margin-bottom: 16px; }
.tit-filter__area { display: flex; align-items: center; gap: 8px; }
.tit-filter__area > label { font-size: 12px; color: #4e5969; }
.tit-filter__area--search { position: relative; flex: 1; min-width: 240px; max-width: 360px; }
.tit-compare { display: flex; align-items: center; }
.tit-search {
  width: 100%;
  height: 32px;
  padding: 0 36px 0 15px;
  font-size: 14px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.tit-search__icon { position: absolute; right: 10px; top: 8px; color: #c0c4cc; cursor: pointer; }
.tit-clear { font-size: 14px; color: #197afb; background: none; border: none; padding: 0; cursor: pointer; }

.tit-select, .tit-num {
  height: 32px;
  padding: 0 10px;
  font-size: 14px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  background: #fff;
}
.tit-select--opt { width: 167px; }
.tit-select--cat { width: 119px; }
.tit-select--op { width: 99px; }
.tit-select--size { width: 100px; font-size: 13px; }
.tit-select--wide { width: 180px; }
.tit-num { width: 101px; font-size: 13px; }
.tit-num--wide { width: 130px; }
.tit-num--jump { width: 46px; text-align: center; margin: 0 4px; }
.tit-unit { font-size: 14px; color: #606266; margin-left: 8px; }

/* 工具条 */
.tit-toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; padding-left: 17px; min-height: 50px; }
.tit-toolbar__ml16 { display: flex; gap: 16px; }
.tit-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  cursor: pointer;
}
.tit-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.tit-btn--w120 { width: 120px; }
.tit-btn--copy { margin-top: 8px; }
.tit-btn:disabled { color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed; cursor: not-allowed; }
.tit-plus { margin-right: 4px; vertical-align: -1px; }
.tit-selected { margin-left: auto; font-size: 12px; color: #4e5969; }
.tit-selected__num { color: #197afb; font-weight: 600; }

/* 表格 */
.tit-table-wrap { overflow-x: auto; }
.tit-table { width: auto; min-width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }
.tit-table th, .tit-table td {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e6eb;
  color: #606266;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tit-table th { background: #f8f8f9; color: #333; font-weight: 500; }
/* 操作列贴右侧固定（线上 el-table fixed="right"） */
.tit-table th:last-child,
.tit-table td:last-child {
  position: sticky; right: 0; z-index: 2;
  background: #fff;
  box-shadow: -4px 0 6px -6px rgba(0, 0, 0, .24);
}
.tit-table th:last-child { background: #f8f8f9; }
.tit-table td.is-center, .tit-table th.is-center { text-align: center; }
.tit-pop__ref { color: #197afb; cursor: pointer; }
.tit-tag { display: inline-block; padding: 0 6px; line-height: 20px; border-radius: 3px; }
.tit-tag--red { color: #f53f3f; background: #ffece8; }
.tit-link { font-size: 12px; color: #197afb; background: none; border: none; padding: 0; cursor: pointer; }
.tit-link + .tit-link { margin-left: 8px; }
.tit-link:hover { text-decoration: underline; }
.tit-link--danger { color: #f53f3f; }
.tit-empty { text-align: center; color: #86909c; }

/* 页脚（线上 .dialog-footer：按钮右对齐 88×32，间距 16） */
.tit-footer { display: flex; justify-content: flex-end; gap: 16px; width: 100%; }
.tit-btn--plain { color: #606266; background: #fff; border-color: #d0d0d0; }

/* 分页 */
.tit-pager { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; color: #333; }
.tit-pager__total { margin-right: 8px; }
.tit-pager__btn {
  width: 36px; height: 32px; font-size: 13px; color: #606266;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer;
}
.tit-pager__btn:disabled { color: #c0c4cc; cursor: not-allowed; }
.tit-pager__num { min-width: 32px; text-align: center; }
.tit-pager__jump { margin-left: 8px; }

/* 动态选取规则 */
/* 动态选取规则（线上 .dynamic-area：头部标题 + 右侧主按钮；规则行 = 规则列 + 操作列） */
.tit-dynbody { display: flex; align-items: stretch; gap: 12px; margin-top: 24px; }
.tit-accounts--dyn { margin-top: 0; margin-right: 0; flex: 0 0 148px; align-self: flex-start; }
.tit-rules {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  min-height: 620px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 2px;
}
.tit-rules__head {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
}
.tit-rules__title { font-size: 13px; color: #1d2129; }
.tit-rules__copy { font-size: 12px; }
.tit-rules__add { margin-left: auto; }
.tit-btn--ml8 { margin-left: 8px; }
.tit-emptybox {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px 0 80px;
}
.tit-emptybox__pic { width: 160px; height: 140px; }
.tit-emptybox__text { margin-top: 8px; font-size: 13px; color: #86909c; }
.tit-dynrule {
  display: flex; align-items: center; gap: 16px;
  padding: 8px 12px; margin-top: 8px;
  font-size: 12px; color: #606266;
  background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
}
.tit-dynrule__col { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tit-dynrule__ops { flex: none; display: flex; align-items: center; gap: 12px; }
</style>
