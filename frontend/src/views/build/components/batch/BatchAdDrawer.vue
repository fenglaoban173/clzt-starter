<template>
  <el-drawer
    v-model="visible"
    title="广告基本信息"
    size="1016px"
    direction="rtl"
    class="batch-ad-drawer"
  >
    <!-- 线上：右上角「预估广告数」浮层 -->
    <div class="ad-est">
      <div class="ad-est__title">预估广告数</div>
      <div class="ad-est__row"><span>账户数：</span><b>{{ adEstimate.accounts }}</b></div>
      <div class="ad-est__row"><span>项目数：</span><b>{{ adEstimate.projects }}</b></div>
      <div class="ad-est__row"><span>广告数：</span><b>{{ adEstimate.ads }}</b></div>
    </div>

    <el-form :model="form.ad" label-position="left" label-width="144px" class="ad-form">
      <!-- ① 推广身份 -->
      <div class="form-section">
        <div class="form-section__title">推广身份</div>
        <el-form-item label="推广身份" required>
          <el-radio-group v-model="form.ad.promotion_identity" size="small">
            <el-radio-button value="AWEME">
              抖音号
              <el-tooltip content="抖音号作为推广身份，可获得更多流量；需在巨量广告-账户-账号管理中完成授权。" placement="top">
                <el-icon class="q-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-radio-button>
            <el-radio-button value="ACCOUNT">
              账户信息
              <el-tooltip content="账户信息作为推广身份，无法获得更多流量" placement="top">
                <el-icon class="q-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.ad.promotion_identity === 'AWEME'" label="抖音号">
          <el-select v-model="form.ad.aweme_id" multiple filterable placeholder="请选择抖音号" style="width: 100%">
            <el-option v-for="a in awemeList" :key="a.aweme_id" :label="a.nickname" :value="a.aweme_id" />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="账户信息">
          <el-select v-model="form.ad.account_ids" multiple filterable placeholder="请选择账户" style="width: 100%">
            <el-option v-for="a in selectedAccounts" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>

        <!-- 线上：推广身份投放链路示意（广告审核 → 通过/不通过 → 内容审核 → 获得流量） -->
        <div class="ad-flow">
          <div class="ad-flow__box">广告审核</div>
          <div class="ad-flow__branches">
            <div class="ad-flow__branch">
              <span class="ad-flow__tag">通过</span>
              <span class="ad-flow__ico ad-flow__ico--ok">✔</span>
              <span class="ad-flow__txt">投放中</span>
            </div>
            <div class="ad-flow__branch">
              <span class="ad-flow__tag">不通过</span>
              <span class="ad-flow__ico ad-flow__ico--err">✖</span>
              <span class="ad-flow__txt">审核不通过</span>
            </div>
          </div>
          <div class="ad-flow__box ad-flow__box--dim">内容审核</div>
          <div class="ad-flow__notes">
            <div class="ad-flow__note">使用账户信息，无法获得更多流量</div>
            <div class="ad-flow__note ad-flow__note--dim">可优化</div>
          </div>
          <div class="ad-flow__gain">获得流量</div>
        </div>

        <div class="ad-promote-tips">
          <div>选择账户信息作为推广身份，无法获得更多流量</div>
          <div>推荐使用抖音号作为推广身份</div>
        </div>
      </div>

      <!-- ② 直达链接（转化优化版无此段） -->
      <div v-if="!isOc" class="form-section">
        <div class="form-section__title">直达链接</div>
        <el-form-item label="直达链接类型" required>
          <el-radio-group v-model="form.ad.link_type" size="small">
            <el-radio-button value="DEEPLINK">Deeplink直达链接</el-radio-button>
            <el-radio-button value="DEEPLINK_ULINK">Deeplink+Ulink直达链接</el-radio-button>
            <el-radio-button value="ULINK">Ulink直达链接</el-radio-button>
          </el-radio-group>
          <div class="ad-warn-hint">该直达链接类型仅Deeplink生效</div>
        </el-form-item>
        <el-form-item label="直达链接来源" required>
          <el-radio-group v-model="form.ad.link_source" size="small" @change="onLinkSourceChange">
            <el-radio-button value="IMPORT">导入直达链接</el-radio-button>
            <el-radio-button value="LP_AUTO">落地页自动关联</el-radio-button>
            <el-radio-button value="DYNAMIC">动态链接生成</el-radio-button>
            <el-radio-button value="LP_MANUAL">落地页自动生成</el-radio-button>
            <el-radio-button value="MANUAL">手动填写</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="匹配方式" required>
          <el-radio-group v-model="form.ad.link_match_mode" size="small">
            <el-radio-button value="PROJECT">所有项目选择一个直达链接</el-radio-button>
            <el-radio-button value="ACCOUNT">每个账户选择一个直达链接</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="['IMPORT', 'MANUAL'].includes(form.ad.link_source)" label="选择直达链接">
          <el-button type="primary" size="small" class="w120" @click="pickDeeplink">选择直达链接</el-button>
        </el-form-item>
        <el-form-item v-if="form.ad.link_source === 'DYNAMIC'" label="选择动态链接">
          <el-button type="primary" size="small" class="w120" @click="pickDynLink">选择动态链接</el-button>
        </el-form-item>
        <el-table :data="adLinkRows" size="small" border class="ad-link-table">
          <el-table-column label="账户" min-width="240">
            <template #default="{ row }">
              <div class="ad-link-cell">
                <span>{{ row.account }}</span>
                <span class="ad-link-cell__id">{{ row.accountId }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="直达链接" min-width="240">
            <template #default="{ row }">
              <el-tag v-if="row.url" closable class="ad-link-tag" @close="removeAdLink(row)">{{ row.url }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- ③ 创意组件 -->
      <div class="form-section">
        <div class="form-section__title">创意组件</div>
        <el-form-item label="附加创意组件" required>
          <el-radio-group v-model="form.ad.extra_component" size="small" @change="onExtraComponentChange">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">启用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.ad.extra_component === 'ON'" label="选择创意组件">
          <el-select v-model="form.ad.extra_component_ids" multiple filterable placeholder="请选择创意组件" style="width: 100%">
            <el-option v-for="c in extraComponentOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="行动号召" required>
          <div class="ad-kw-row">
            <el-input
              v-model="ctaInput"
              class="ad-kw-input cta-input"
              placeholder="空格分隔，最多10个，每个标签不超过6个字"
              @keyup.enter="addCtaTags"
            >
              <template #append>
                <el-button class="tags-add-btn" type="primary" size="small" @click="addCtaTags">添加（回车键)</el-button>
              </template>
            </el-input>
            <el-button size="small" @click="ctaRecommendVisible = true">查看推荐</el-button>
          </div>
          <div class="ad-kw-row ad-kw-row--tpl">
            <el-select v-model="ctaTemplate" class="sell-tpl" clearable placeholder="选择模板">
              <el-option v-for="c in CTA_PRESETS" :key="c" :value="c">{{ c }}</el-option>
            </el-select>
            <el-button size="small" @click="openCtaSaveTpl()">保存为模板</el-button>
          </div>
          <div class="mg-card">
            <div class="mg-card__head">
              <span class="mg-card__title">已添加标签</span>
              <el-button link type="primary" @click="form.ad.cta_tags = []">清空</el-button>
            </div>
            <div class="mg-card__body">
              <el-tag
                v-for="(t, ti) in form.ad.cta_tags"
                :key="t + ti"
                closable
                class="sell-tag"
                @close="form.ad.cta_tags.splice(ti, 1)"
              >{{ t }}</el-tag>
              <span v-if="!form.ad.cta_tags.length" class="sell-tags__empty">暂无</span>
            </div>
          </div>
          <el-checkbox v-model="form.ad.cta_smart" class="ad-smart">开启智能生成</el-checkbox>
        </el-form-item>
      </div>

      <!-- ④ 产品信息 -->
      <div class="form-section">
        <div class="form-section__title">产品信息</div>
        <el-form-item label="配置模式">
          <el-radio-group v-model="form.ad.product_info_mode" size="small">
            <el-radio-button v-for="o in CONFIG_MODES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-alert type="info" :closable="false" class="ad-alert">
          <template #title>
            <span class="ad-alert__text">点击引用上次信息可快速复用上次项目使用的产品信息</span>
            <el-button link type="primary" @click="copyLastProduct">引用上次信息</el-button>
          </template>
        </el-alert>
        <el-form-item label="产品名称" required>
          <el-input v-model="form.ad.product_name" :maxlength="20" placeholder="1-20个字符" class="ad-name-input">
            <template #suffix><span class="ad-count">{{ (form.ad.product_name || '').length }}/20</span></template>
          </el-input>
          <el-button link type="primary" class="ad-ref-btn" @click="form.ad.product_name = form.project.app_name">引用应用名称</el-button>
        </el-form-item>
        <el-form-item label="产品主图" required>
          <div class="pimg-row">
            <div class="pimg-logo">{{ (form.ad.product_name || form.project.app_name || '产品').slice(0, 2) }}</div>
            <div class="pimg-add" @click="onPickMainImage">
              <span class="pimg-add__plus">+</span>
              <span class="pimg-add__text">图片({{ form.ad.product_main_images.length }}/10)</span>
            </div>
            <el-tag
              v-for="(im, i) in form.ad.product_main_images"
              :key="im"
              closable
              class="pimg-tag"
              @close="form.ad.product_main_images.splice(i, 1)"
            >{{ (images.find(x => x.id === im) || {}).title || im }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="产品卖点" required>
          <div class="ad-kw-row">
            <el-input
              v-model="sellPointInput"
              class="ad-kw-input sell-input"
              placeholder="空格分隔,最多10个,每个标签不超过9个字"
              @keyup.enter="onAddSellPoint"
            >
              <template #append>
                <el-button class="tags-add-btn" type="primary" size="small" @click="onAddSellPoint">添加（回车键)</el-button>
              </template>
            </el-input>
            <el-button size="small" @click="ctaRecommendVisible = true">查看推荐</el-button>
          </div>
          <div class="ad-kw-row ad-kw-row--tpl">
            <el-select v-model="form.ad.sell_template" class="sell-tpl" clearable placeholder="选择模板">
              <el-option v-for="c in CTA_PRESETS" :key="c" :value="c">{{ c }}</el-option>
            </el-select>
            <el-button size="small" @click="openCtaSaveTpl()">保存为模板</el-button>
          </div>
          <div class="mg-card">
            <div class="mg-card__head">
              <span class="mg-card__title">已添加标签</span>
              <el-button link type="primary" @click="form.ad.product_sell_points = []">清空</el-button>
            </div>
            <div class="mg-card__body">
              <el-tag
                v-for="(t, ti) in form.ad.product_sell_points"
                :key="t + ti"
                closable
                class="sell-tag"
                @close="form.ad.product_sell_points.splice(ti, 1)"
              >{{ t }}</el-tag>
              <span v-if="!form.ad.product_sell_points.length" class="sell-tags__empty">暂无</span>
            </div>
          </div>
        </el-form-item>
      </div>

      <!-- ⑤ 广告设置 -->
      <div class="form-section">
        <div class="form-section__title">广告设置</div>
        <el-form-item label="配置模式">
          <el-radio-group v-model="form.ad.ad_setting_mode" size="small">
            <el-radio-button v-for="o in CONFIG_MODES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="广告评论" required>
          <el-radio-group v-model="form.ad.comment_disable" size="small">
            <el-radio-button :value="false">不启用</el-radio-button>
            <el-radio-button :value="true">启用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户端下载" required>
          <el-radio-group v-model="form.ad.client_download" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">启用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-alert type="info" :closable="false" title="以下内容非必填项，可根据实际投放要求设置。" class="ad-alert ad-alert--flat" />
        <el-form-item label="类别/品牌名称">
          <el-radio-group v-model="form.ad.brand_switch" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">启用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="form.ad.brand_switch === 'ON'">
          <el-form-item label="所属类别"><el-input v-model="form.ad.category" placeholder="-" /></el-form-item>
          <el-form-item label="品牌名称"><el-input v-model="form.ad.brand_name" placeholder="-" /></el-form-item>
          <el-form-item label="二级品牌名称"><el-input v-model="form.ad.second_brand_name" placeholder="-" /></el-form-item>
        </template>
      </div>

      <!-- ⑥ 广告预算与出价（转化优化版无此段） -->
      <div v-if="!isOc" id="ad-budget" class="form-section">
        <div class="form-section__title">
          广告预算与出价
          <el-button link type="primary" class="sec-collapse" @click="adBudget.folded = !adBudget.folded">
            {{ adBudget.folded ? '全部展开' : '全部收起' }}
          </el-button>
        </div>
        <div class="ad-mode-row">
          <span class="ad-mode-label">预算出价配置模式</span>
          <el-radio-group v-model="adBudget.config_mode" size="small">
            <el-radio-button value="UNIFIED">统一配置</el-radio-button>
            <el-radio-button value="ACCOUNT">分账户配置</el-radio-button>
            <el-radio-button value="SUBJECT">分主体配置</el-radio-button>
            <el-radio-button value="PROJECT">分项目配置</el-radio-button>
          </el-radio-group>
        </div>
        <div class="ad-summary">
          <span>竞价策略：<b>{{ adBudgetSummary.bid_strategy }}</b></span>
          <span>优化目标：<b>{{ adBudgetSummary.optimize_goal }}</b></span>
          <span>深度优化方式：<b>{{ adBudgetSummary.deep_bid_mode }}</b></span>
          <span>付费方式：<b>{{ adBudgetSummary.pay_mode }}</b></span>
        </div>
        <el-form-item label="预算出价规则1">
          <template #label>
            <span class="ad-rule-label">预算出价规则1</span>
            <el-button link type="primary" class="ad-rule-fold" @click="adBudget.folded = !adBudget.folded">
              {{ adBudget.folded ? '展开' : '收起' }}
            </el-button>
          </template>
          <div v-show="!adBudget.folded" class="ad-rule-box">
            <el-form-item label="预算" label-width="180px">
              <div class="ad-rule-budget">
                <el-input v-model="adBudget.budget" class="ad-rule-input">
                  <template #append>元</template>
                </el-input>
                <span class="ad-rule-quick">
                  <a v-for="q in [300, 500, 1000, 2000]" :key="q" @click="adBudget.budget = String(q)">{{ q }}</a>
                </span>
              </div>
            </el-form-item>
            <el-form-item label="出价方式" label-width="180px">
              <el-radio-group v-model="adBudget.bid_mode" size="small">
                <el-radio-button value="FIXED">固定出价</el-radio-button>
                <el-radio-button value="LADDER">阶梯出价</el-radio-button>
                <el-radio-button value="RANDOM">随机出价</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="出价" label-width="180px">
              <el-input v-model="adBudget.bid" class="ad-rule-input">
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </div>
        </el-form-item>
      </div>

      <!-- ⑦ 广告名称 -->
      <div class="form-section" id="ad-name">
        <div class="form-section__title">广告名称</div>
        <el-form-item label="广告默认状态" required>
          <el-radio-group v-model="form.ad.operation" size="small">
            <el-radio-button value="DISABLE">暂停</el-radio-button>
            <el-radio-button value="ENABLE">开启</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称配置模式" required>
          <el-radio-group v-model="form.ad.ad_name_mode" size="small">
            <el-radio-button value="UNIFIED">统一配置</el-radio-button>
            <el-radio-button value="PER_ACCOUNT">分账户配置</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="广告名称" required>
          <el-input v-model="form.ad.name_template" :maxlength="100" class="ad-name-input" placeholder="通配符：渠道包名 / 监测活动名 / 已有监测链接组名">
            <template #suffix><span class="ad-count">{{ nameLength }}</span></template>
          </el-input>
          <el-checkbox v-model="form.ad.ad_auto_truncate" class="ad-name-opt">
            自动截断
            <el-tooltip :content="TIPS.auto_truncate" placement="top"><el-icon class="q-icon"><QuestionFilled /></el-icon></el-tooltip>
          </el-checkbox>
          <el-checkbox v-model="form.ad.ad_random_suffix" class="ad-name-opt">
            随机数后缀
            <el-tooltip :content="TIPS.auto_truncate" placement="top"><el-icon class="q-icon"><QuestionFilled /></el-icon></el-tooltip>
          </el-checkbox>
        </el-form-item>
        <el-form-item label="广告动态标号">
          <el-switch v-model="form.ad.ad_dynamic_index" />
        </el-form-item>
        <div class="name-wildcards">
          <span class="name-wildcards__label">通配符:</span>
          <el-button link type="primary" @click="appendAdWildcard('下载链接标识')">下载链接标识</el-button>
          <el-button link type="primary" @click="appendAdWildcard('渠道包名')">渠道包名</el-button>
          <el-button link type="primary" @click="appendAdWildcard('监测活动名')">监测活动名</el-button>
          <el-button link type="primary" @click="wildcardMoreVisible = true">插入更多</el-button>
        </div>
        <div class="name-warn-hint">名称长度最多100字符（1汉字=2字符），使用通配符时，请注意控制自定义内容长度</div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="visible = false">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import { CONFIG_MODES, CTA_PRESETS } from '@/mock/data';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

/* R110：全部业务状态来自 Create.vue 通过 provide('batch') 暴露的 setup 作用域 */
const batch = inject('batch');
const {
  form, adEstimate, adBudget, adBudgetSummary, adLinkRows, removeAdLink,
  ctaInput, ctaTemplate, onPickMainImage, addCtaTags, TIPS, extraComponentOptions,
  onLinkSourceChange, onExtraComponentChange, awemeList, selectedAccounts, images,
  isOc, copyLastProduct, appendAdWildcard, wildcardMoreVisible,
  ctaRecommendVisible, openCtaSaveTpl, addSellPoint, pickDeeplink, pickDynLink,
} = batch;

/* 产品卖点输入（本地 addSellPoint 依赖 DOM 上的 .sell-input） */
const sellPointInput = ref('');

const nameLength = computed(() => {
  const s = String(form.ad.name_template || '');
  // 1 汉字 = 2 字符
  let n = 0;
  for (const ch of s) n += ch.charCodeAt(0) > 255 ? 2 : 1;
  return n;
});

/* 产品卖点：走 Create.vue 的 addSellPoint（读 .sell-input），再同步到展示用的 product_sell_points */
function onAddSellPoint() {
  const before = (form.ad.sell_points || []).length;
  addSellPoint();
  const pts = form.ad.sell_points || [];
  if (pts.length > before) {
    const v = pts[pts.length - 1];
    form.ad.product_sell_points = form.ad.product_sell_points || [];
    if (!form.ad.product_sell_points.includes(v)) form.ad.product_sell_points.push(v);
    sellPointInput.value = '';
  }
}

/* 线上默认态：账户信息 / Deeplink / 手动填写 / 所有项目选择一个直达链接 */
function ensureDefaults() {
  const ad = form.ad;
  if (!ad.promotion_identity) ad.promotion_identity = 'ACCOUNT';
  if (!ad.link_type) ad.link_type = 'DEEPLINK';
  if (!ad.link_source) ad.link_source = 'MANUAL';
  if (!ad.link_match_mode) ad.link_match_mode = 'PROJECT';
  if (!ad.client_download) ad.client_download = 'OFF';
  if (!Array.isArray(ad.account_ids)) ad.account_ids = [];
  if (ad.sell_template === undefined) ad.sell_template = '';
  if (!adBudget.bid_mode) adBudget.bid_mode = 'FIXED';
}

watch(
  () => props.modelValue,
  (v) => { if (v) ensureDefaults(); },
  { immediate: true }
);
</script>

<style scoped>
/* 线上抽屉：浅灰蓝底 + 每个板块白色圆角矩形 */
:deep(.el-drawer__body) { background: #f0f2f5; position: relative; }
.form-section { border: 1px solid #e5e6eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fff; }
.form-section__title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #f2f3f5; }

/* 表单：左侧标签（144px），控件区右对齐 */
.ad-form :deep(.el-form-item) { margin-bottom: 18px; }
.ad-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
.ad-form :deep(.el-form-item__label) { font-size: 13px; color: #1d2129; line-height: 1.5; padding-bottom: 0; }
.ad-form :deep(.el-form-item.is-required .el-form-item__label::before) { color: #f53f3f; margin-right: 4px; }
.ad-form :deep(.el-input__wrapper),
.ad-form :deep(.el-select__wrapper) { border-radius: 6px; }
.ad-form :deep(.el-radio-group) { display: flex; flex-wrap: wrap; gap: 8px 0; align-items: center; }

/* 预估广告数浮层（线上：抽屉右上角） */
.ad-est { position: absolute; right: 24px; top: 18px; z-index: 5; width: 200px; padding: 12px 14px; background: #fff; border: 1px solid #e5e6eb; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.08); font-size: 12px; color: #4e5969; }
.ad-est__title { font-weight: 600; color: #1d2129; margin-bottom: 6px; }
.ad-est__row { display: flex; justify-content: space-between; line-height: 1.9; }
.ad-est__row b { color: #197afb; }

/* 推广身份：投放链路示意 */
.ad-flow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px; margin: 0 0 12px 144px; border: 1px dashed #e5e6eb; border-radius: 6px; background: #fafbfc; font-size: 12px; color: #4e5969; }
.ad-flow__box { padding: 10px 14px; border: 1px solid #e5e6eb; border-radius: 4px; background: #fff; color: #1d2129; }
.ad-flow__box--dim { color: #c9cdd4; }
.ad-flow__branches { display: flex; flex-direction: column; gap: 4px; }
.ad-flow__branch { display: flex; align-items: center; gap: 6px; }
.ad-flow__tag { color: #86909c; }
.ad-flow__ico--ok { color: #00b42a; }
.ad-flow__ico--err { color: #f53f3f; }
.ad-flow__notes { display: flex; flex-direction: column; gap: 4px; }
.ad-flow__note { color: #86909c; }
.ad-flow__note--dim { color: #c9cdd4; }
.ad-flow__gain { padding: 10px 14px; border-radius: 4px; background: #e8f3ff; color: #165dff; }

.q-label { margin-right: 4px; }
.q-icon { color: #86909c; cursor: help; vertical-align: -2px; margin-left: 2px; }
.ad-promote-tips { font-size: 12px; color: #86909c; line-height: 1.8; margin: 0 0 0 144px; }
.ad-warn-hint { width: 100%; font-size: 12px; color: #e6a23c; margin-top: 4px; }

/* 直达链接表 */
.ad-link-table { margin: 4px 0 0; }
.ad-link-cell { display: flex; flex-direction: column; font-size: 12px; color: #1d2129; }
.ad-link-cell__id { color: #86909c; }
.ad-link-tag { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }

/* 行动号召 / 产品卖点：标签输入 + 已添加标签卡片 */
.ad-kw-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.ad-kw-row--tpl { width: 100%; margin-bottom: 10px; }
.ad-kw-input { width: 360px; flex: none; }
.sell-tpl { width: 220px; }
.mg-card { border: 1px solid #e5e6eb; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
.mg-card__head { width: 100%; display: flex; justify-content: space-between; font-size: 12px; color: #86909c; margin-bottom: 8px; }
.mg-card__title { color: #1d2129; }
.mg-card__body { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sell-tag { margin: 0; }
.sell-tags__empty { font-size: 12px; color: #c9cdd4; }
.ad-smart { margin-top: 2px; }

/* 产品信息 */
.ad-alert { margin: 0 0 18px 144px; width: auto; }
.ad-alert--flat { margin: -6px 0 18px 144px; }
.ad-alert__text { margin-right: 8px; }
.ad-name-input { width: 460px; }
.ad-count { font-size: 12px; color: #86909c; }
.ad-ref-btn { margin-left: 12px; }
.pimg-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pimg-logo { width: 56px; height: 56px; border-radius: 8px; background: #4d5cf0; color: #fff; font-size: 18px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.pimg-add { width: 84px; height: 84px; border: 1px dashed #c9cdd4; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; color: #86909c; }
.pimg-add:hover { border-color: #197afb; color: #197afb; }
.pimg-add__plus { font-size: 18px; line-height: 1; }
.pimg-add__text { font-size: 12px; }
.pimg-tag { margin: 0; }

/* 广告预算与出价 */
.sec-collapse { float: right; font-size: 12px; font-weight: 400; }
.ad-mode-row { display: flex; align-items: center; gap: 32px; margin-bottom: 12px; }
.ad-mode-label { font-size: 13px; color: #1d2129; }
.ad-summary { display: flex; gap: 28px; flex-wrap: wrap; padding: 10px 12px; margin-bottom: 12px; background: #f5f6f7; border-radius: 4px; font-size: 12px; color: #86909c; }
.ad-summary b { color: #1d2129; font-weight: 600; }
.ad-rule-label { margin-right: 12px; }
.ad-rule-fold { font-size: 12px; }
.ad-rule-box { display: block; }
.ad-rule-box :deep(.el-form-item) { margin-bottom: 12px; }
.ad-rule-box :deep(.el-form-item:last-child) { margin-bottom: 0; }
.ad-rule-budget { display: flex; align-items: center; gap: 10px; width: 100%; }
.ad-rule-input { width: 220px; }
.ad-rule-quick { display: flex; gap: 8px; font-size: 12px; }
.ad-rule-quick a { color: #197afb; cursor: pointer; }

/* 广告名称 */
.name-wildcards { display: flex; align-items: center; gap: 10px; margin: -6px 0 0 144px; font-size: 13px; color: #4e5969; }
.name-wildcards__label { color: #86909c; }
.name-warn-hint { font-size: 12px; color: #e6a23c; margin: 8px 0 0 144px; }
.ad-name-opt { margin-left: 16px; }
.w120 { width: 120px; }
</style>
