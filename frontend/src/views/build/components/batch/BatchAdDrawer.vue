<template>
  <BatchDrawer
    v-model="visible"
    :title="spec.title"
    :width="spec.width"
    :cancel-text="spec.footer.cancelText"
    :ok-text="spec.footer.okText"
    :close-on-mask="false"
    :z-index="1301"
    @close="onClose"
  >
    <template #content>
      <div class="ad-root">
        <!-- 右上角悬浮卡：预估广告数（点右侧按钮可收起 / 展开） -->
        <div class="ad-est" :class="{ 'ad-est--folded': !estVisible }">
          <div v-show="estVisible" class="ad-est__card">
            <div class="ad-est__title">{{ spec.estimate.title }}</div>
            <div v-for="r in spec.estimate.rows" :key="r.field" class="ad-est__row">
              <span class="ad-est__label">{{ r.label }}</span>
              <span class="ad-est__num">{{ estimate[r.field] }}</span>
            </div>
          </div>
          <div class="ad-est__fold" @click="estVisible = !estVisible">
            <ClIcon class="ad-est__fold__ico" :d="icon('unfold').d" :size="24" color="#197afb" />
          </div>
        </div>

        <!-- 分区 -->
        <div v-for="sec in visibleSections" :key="sec.key" class="cl-module" :data-section="sec.key">
          <div class="cl-module__title">{{ sec.title }}</div>
          <div class="cl-module__body" :style="sec.extraBottom ? { paddingBottom: 16 + sec.extraBottom + 'px' } : null">
            <div
              v-for="f in sec.fields"
              v-show="isVisible(f, values) && !alertClosed[f.key]"
              :key="f.key"
              class="ad-field"
              :class="{
                'ad-field--bare': !f.label,
                'ad-field--alert': f.type === 'alert',
                'ad-field--last': isLastVisible(sec, f),
              }"
            >
              <div class="ad-field__label" :class="{ 'is-required': f.required }">
                {{ labelOf(f) }}
                <!-- 线上：部分 label 尾部跟一个 ⓘ（mg-icon-question2） -->
                <el-popover
                  v-if="f.labelBubble"
                  placement="top"
                  trigger="hover"
                  :width="f.labelBubble.width || 300"
                  popper-class="ad-pop"
                >
                  <template #reference>
                    <ClIcon
                      class="ad-labelq"
                      :d="icon(f.labelBubble.icon || 'question2').d"
                      :size="f.labelBubble.size || 14"
                      color="#999"
                    />
                  </template>
                  <span class="ad-pop__text">{{ f.labelBubble.text }}</span>
                </el-popover>
              </div>

              <div class="ad-field__content">
                <!-- radio -->
                <template v-if="f.type === 'radio'">
                  <el-radio-group
                    v-model="values[f.key]"
                    class="ad-radio"
                    size="small"
                    :disabled="isDisabled(f, values)"
                  >
                    <el-radio-button
                      v-for="o in optionsOf(f)"
                      :key="o.value"
                      :value="o.value"
                      :disabled="isOptDisabled(f, o.value)"
                    >
                      <!-- 线上：选项文字可挂 popover（推广身份=图片，落地页两项=灰底文字，
                           其余（匹配方式 / 广告默认状态 / 名称配置模式 / Ulink）是空内容 popover） -->
                      <el-popover
                        v-if="optBubbleOf(f, o)"
                        placement="top"
                        trigger="hover"
                        :width="optBubbleOf(f, o).width || (optBubbleOf(f, o).image ? 226 : 260)"
                        :popper-class="optBubbleOf(f, o).plain ? 'ad-pop ad-pop--plain' : 'ad-pop'"
                      >
                        <template #reference>
                          <span class="ad-opt">
                            {{ o.label }}
                            <ClIcon
                              v-if="optBubbleOf(f, o).image"
                              class="ad-q ad-q--img"
                              :d="icon('question2').d"
                              :size="12"
                              color="#999"
                            />
                          </span>
                        </template>
                        <img
                          v-if="optBubbleOf(f, o).image"
                          class="ad-pop__img"
                          :src="optBubbleOf(f, o).image"
                          alt=""
                        />
                        <span v-else class="ad-pop__text">{{ optBubbleOf(f, o).text }}</span>
                      </el-popover>
                      <template v-else>{{ o.label }}</template>
                    </el-radio-button>
                  </el-radio-group>
                </template>

                <!-- 提示条 -->
                <div v-else-if="f.type === 'tip'" class="ad-tip">{{ f.text }}</div>

                <!-- 说明条 -->
                <div v-else-if="f.type === 'alert'" class="ad-alert">
                  <ClIcon class="ad-alert__icon" :d="icon('info').d" :size="16" color="#197afb" />
                  <span class="ad-alert__text">{{ f.text }}</span>
                  <a
                    v-if="f.linkText"
                    class="ad-alert__link"
                    href="javascript:void(0)"
                    @click.prevent="onRefLast"
                  >{{ f.linkText }}</a>
                  <ClIcon class="ad-alert__close" :d="icon('closeEl').d" :size="12" color="#c0c4cc" @click="closeAlert(f)" />
                </div>

                <!-- 按钮（线上：部分按钮上挂 popover） -->
                <template v-else-if="f.type === 'button'">
                  <el-popover
                    v-if="bubbleText(f, values)"
                    placement="top"
                    trigger="hover"
                    :width="260"
                    :popper-class="f.bubble && f.bubble.plain ? 'ad-pop ad-pop--plain' : 'ad-pop'"
                  >
                    <template #reference>
                      <el-button
                        type="primary"
                        size="small"
                        class="ad-btn120"
                        :disabled="isDisabled(f, values)"
                        @click="onPick(f)"
                      >
                        {{ f.text }}
                      </el-button>
                    </template>
                    <span class="ad-pop__text">{{ bubbleText(f, values) }}</span>
                  </el-popover>
                  <el-button
                    v-else
                    type="primary"
                    size="small"
                    class="ad-btn120"
                    :disabled="isDisabled(f, values)"
                    @click="onPick(f)"
                  >
                    {{ f.text }}
                  </el-button>
                  <div v-if="f.hint" class="ad-btn-hint">{{ f.hint }}</div>
                </template>

                <!-- 输入框 -->
                <template v-else-if="f.type === 'input'">
                  <div class="ad-input-row">
                    <el-input
                      :model-value="inputValue(f)"
                      class="ad-input"
                      :style="{ width: (f.width || 360) + 'px' }"
                      :placeholder="f.placeholder || ''"
                      size="small"
                      :disabled="isDisabled(f, values)"
                      @update:model-value="setInputValue(f, $event)"
                    >
                      <template v-if="f.countSuffix" #suffix>
                        <span class="ad-count">{{ countOf(f) }}</span>
                      </template>
                    </el-input>
                    <el-button
                      v-if="f.refText"
                      text
                      type="primary"
                      size="small"
                      class="ad-textbtn ad-ref"
                      @click="onRefAppName"
                    >{{ f.refText }}</el-button>
                  </div>
                </template>

                <!-- 产品主图 -->
                <div v-else-if="f.type === 'upload'" class="ad-upload">
                  <div class="ad-upload__imgs">
                    <div v-for="(im, i) in form.ad.product_main_images" :key="im" class="ad-upload__single">
                      <img v-if="imgUrl(im)" :src="imgUrl(im)" :alt="imgTitle(im)" />
                      <div v-else class="ad-upload__ph">{{ (imgTitle(im) || '图').slice(0, 2) }}</div>
                      <ClIcon
                        class="ad-upload__del"
                        :d="icon('close').d"
                        :size="16"
                        color="#fff"
                        @click="form.ad.product_main_images.splice(i, 1)"
                      />
                    </div>
                    <div class="ad-upload__content" @click="materialVisible = true">
                      <div class="ad-upload__empty">
                        <ClIcon :d="icon('plusEl').d" :size="14" color="#666" />
                        <span>图片({{ form.ad.product_main_images.length }}/10)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 标签输入（行动号召 / 产品卖点） -->
                <div v-else-if="f.type === 'tags'" class="ad-tags-wrap">
                  <div class="ad-tags-row">
                    <el-input
                      v-model="tagInput[f.key]"
                      class="ad-input ad-input--360"
                      :placeholder="f.placeholder"
                      size="small"
                      @keyup.enter="onAddTag(f)"
                    >
                      <template #append>
                        <el-button
                          type="primary"
                          size="small"
                          class="ad-tags-add"
                          :class="{ 'ad-tags-add--cta': f.key === 'cta' }"
                          @click="onAddTag(f)"
                        >
                          {{ f.addText }}
                        </el-button>
                      </template>
                    </el-input>
                    <el-button size="small" plain class="ad-recommend" @click="onRecommend(f)">
                      查看推荐
                    </el-button>
                  </div>
                  <div class="ad-tpl-row">
                    <el-select
                      v-model="tagTemplate[f.key]"
                      class="ad-tpl-select"
                      clearable
                      placeholder="选择模板"
                      size="small"
                    >
                      <el-option v-for="c in tplOptions(f)" :key="c" :label="c" :value="c" />
                    </el-select>
                    <el-button
                      size="small"
                      class="ad-tpl-save"
                      @click="f.key === 'product_sell_points' ? (tplSaveVisible = true) : openCtaSaveTpl()"
                    >保存为模板</el-button>
                  </div>
                  <div class="mg-card mt16">
                    <div class="mg-card-header flex">
                      <span class="mg-card-title">已添加标签</span>
                      <span class="tag-clear" @click="clearTags(f)">
                        清空<ClIcon class="ad-icon-refresh" :d="icon('refreshRight').d" :size="12" color="#2e71ea" />
                      </span>
                    </div>
                    <div class="mg-card-body ad-tags clearfix">
                      <div v-for="(t, ti) in tagList(f)" :key="t + ti" class="mg-tag flex">
                        <span class="ellipsis" :title="t">{{ t }}</span>
                        <ClIcon class="mg-icon-close" :d="icon('close').d" :size="14" color="#bfc4d0" @click="removeTag(f, ti)" />
                      </div>
                    </div>
                  </div>
                  <el-checkbox
                    v-if="f.smart"
                    v-model="values[f.smartKey]"
                    true-value="ON"
                    false-value="OFF"
                    class="ad-smart"
                  >
                    开启智能生成
                  </el-checkbox>
                </div>

                <!-- 广告名称：分账户配置（左账户列表 + 右侧广告名称） -->
                <div v-else-if="f.kind === 'adNamePanel'" class="ad-adname-panel">
                  <BatchAdNamePanel />
                </div>

                <!-- 广告名称 -->
                <div v-else-if="f.type === 'adName'" class="ad-adname">
                  <div class="ad-adname__row">
                    <el-input
                      v-model="form.ad.name_template"
                      class="ad-input ad-input--360"
                      :maxlength="100"
                      size="small"
                    >
                      <template #suffix><span class="ad-count">{{ nameLength }}</span></template>
                    </el-input>
                    <el-checkbox
                      v-for="c in f.checkboxes || []"
                      :key="c.key"
                      v-model="values[c.key]"
                      true-value="ON"
                      false-value="OFF"
                      class="ad-adname__ck"
                    >
                      {{ c.label }}
                      <el-popover placement="top" trigger="hover" :width="260" popper-class="ad-pop">
                        <template #reference>
                          <ClIcon class="ad-q ad-q--lg" :d="icon('question2').d" :size="14" color="#999" />
                        </template>
                        <span class="ad-pop__text">{{ c.bubble }}</span>
                      </el-popover>
                    </el-checkbox>
                  </div>
                  <div class="ad-adname__tags">
                    <span class="ad-adname__tagtext">通配符:</span>
                    <el-popover
                      v-for="w in wildcardsOf(f)"
                      :key="w.value"
                      placement="top"
                      trigger="hover"
                      :width="260"
                      popper-class="ad-pop"
                    >
                      <template #reference>
                        <el-button
                          text
                          type="primary"
                          size="small"
                          class="ad-textbtn ad-wild"
                          @click="appendAdWildcard(w.value)"
                        ><ClIcon class="ad-wild__plus" :d="icon('plusEl').d" :size="12" color="#197afb" />{{ w.value }}</el-button>
                      </template>
                      <span class="ad-pop__text">{{ w.tip }}</span>
                    </el-popover>
                    <span class="ad-more" @click="wildcardMoreVisible = true">
                      <ClIcon class="ad-more__icon" :d="icon('insert').d" :size="12" color="#2681fc" />插入更多
                    </span>
                  </div>
                  <div class="ad-warning">
                    <ClIcon class="ad-warning__icon" :d="icon('warning').d" :size="14" color="#ff9b48" />
                    名称长度最多100字符（1汉字=2字符），使用通配符时，请注意控制自定义内容长度
                  </div>
                </div>

                <!-- 直达链接表 -->
                <div v-else-if="f.kind === 'linkTable'" class="ad-link-table">
                  <el-table :data="adLinkRows" size="small" border class="ad-cl-table">
                    <el-table-column label="账户" width="300">
                      <template #default="{ row }">
                        <div class="ad-link-cell">
                          <p class="ellipsis" :title="row.account">{{ row.account }}</p>
                          <p class="ad-link-cell__id">{{ row.accountId }}</p>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="直达链接" width="633">
                      <template #default="{ row }">
                        <div v-if="row.url" class="ad-link-url">
                          <p class="ellipsis ad-link-url__text" :title="row.url">{{ row.url }}</p>
                          <ClIcon class="ad-link-url__x" :d="icon('close').d" :size="16" color="#999" @click="removeAdLink(row)" />
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 已选原生锚点：账户 / 锚点模板名称 -->
                <div v-else-if="f.kind === 'anchorTable' && anchorRows.length" class="ad-link-table">
                  <el-table :data="anchorRows" size="small" border class="ad-cl-table">
                    <el-table-column label="账户" width="300">
                      <template #default="{ row }">
                        <div class="ad-link-cell">
                          <p class="ellipsis" :title="row.account">{{ row.account }}</p>
                          <p class="ad-link-cell__id">{{ row.accountId }}</p>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="锚点模板名称" width="633">
                      <template #default="{ row }">
                        <div class="ad-link-url">
                          <p class="ellipsis ad-link-url__text" :title="row.name">{{ row.name }}</p>
                          <ClIcon
                            class="ad-link-url__x"
                            :d="icon('close').d"
                            :size="16"
                            color="#999"
                            @click="removeAnchorRow(row)"
                          />
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 已选创意组件：账户 / 创意组件名称 -->
                <div v-else-if="f.kind === 'componentTable' && componentRows.length" class="ad-link-table">
                  <el-table :data="componentRows" size="small" border class="ad-cl-table">
                    <el-table-column label="账户" width="300">
                      <template #default="{ row }">
                        <div class="ad-link-cell">
                          <p class="ellipsis" :title="row.account">{{ row.account }}</p>
                          <p class="ad-link-cell__id">{{ row.accountId }}</p>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="创意组件名称" width="633">
                      <template #default="{ row }">
                        <div class="ad-link-url">
                          <p class="ellipsis ad-link-url__text" :title="row.name">{{ row.name }}</p>
                          <ClIcon
                            class="ad-link-url__x"
                            :d="icon('close').d"
                            :size="16"
                            color="#999"
                            @click="removeComponentRow(row)"
                          />
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <!-- 产品信息：分账户 / 分主体 / 分项目 面板；分项目可添加规则 -->
                <div v-else-if="f.kind === 'productPanel'" class="ad-product-panel">
                  <BatchProductPanel :mode="values.product_info_mode" />
                </div>

                <!-- 账户 / 主体 / 项目 分配块 -->
                <div v-else-if="f.kind === 'allocation'" class="ad-alloc">
                  <div class="ad-alloc__list">
                    <div v-for="(row, i) in allocRows(f)" :key="i" class="ad-alloc__row">
                      <span class="ad-alloc__name">{{ row.name }}</span>
                      <span class="ad-alloc__id">{{ row.id }}</span>
                    </div>
                  </div>
                  <div class="ad-alloc__ops">
                    <el-button
                      v-if="allocMode(f) === 'PROJECT'"
                      type="primary"
                      size="small"
                      class="ad-btn-addrule"
                    >添加规则</el-button>
                    <el-button link type="primary" size="small" class="ad-alloc__copy">
                      {{ allocCopyText(f) }}
                    </el-button>
                  </div>
                </div>

                <!-- 类别 / 品牌名称设置 -->
                <div v-else-if="f.kind === 'adSettingPanel'" class="ad-product-panel">
                  <BatchAdSettingPanel :mode="values.ad_setting_mode" />
                </div>

                <!-- 类别 / 品牌名称设置（统一配置：设置按钮 + 已设置摘要行） -->
                <div v-else-if="f.kind === 'brandSetting' && values.brand_switch === 'ON'" class="ad-brand">
                  <el-button type="primary" size="small" class="ad-brand__set" @click="brandDialog = true">设置</el-button>
                  <div class="ad-brand__summary">
                    <span>所属类别： <em>{{ form.ad.category || '-' }}</em></span>
                    <span>品牌名称： <em>{{ form.ad.brand_name || '-' }}</em></span>
                    <span>二级品牌名称： <em>{{ form.ad.second_brand_name || '-' }}</em></span>
                  </div>
                  <p v-if="values.brand_switch === 'ON' && !form.ad.category" class="ad-brand__warn">
                    请选择类别/品牌名称
                  </p>
                </div>

                <!-- 广告预算与出价 -->
                <div v-else-if="f.kind === 'budget'" class="ad-budget">
                  <div class="mb16 ad-moderow">
                    <span class="mode-label">{{ f.modeLabel }}</span>
                    <el-radio-group v-model="values[f.key]" class="ad-radio ad-radio--ml32" size="small">
                      <el-radio-button
                        v-for="o in optionsOf(f)"
                        :key="o.value"
                        :value="o.value"
                      >{{ o.label }}</el-radio-button>
                    </el-radio-group>
                  </div>
                  <BatchBudgetPanel :mode="values[f.key]" />
                </div>

                <!-- 同一行控件列内的附加块（线上 tip / 说明图） -->
                <template v-for="a in f.after || []" :key="a.key">
                  <div v-if="isVisible(a, values) && a.type === 'tip'" class="ad-tip">{{ a.text }}</div>
                  <div v-else-if="isVisible(a, values) && a.kind === 'promotionHelp'" class="ad-help">
                    <img class="ad-help__img" :src="promotionHelp.img" alt="推广身份说明" />
                    <div class="ad-help__tips">
                      <p v-for="(t, i) in promotionHelp.tips" :key="i" class="ad-help__tip">{{ t }}</p>
                    </div>
                    <div v-if="values.promotion_identity === 'ON'" class="ad-warning ad-warning--promotion">
                      <el-icon class="ad-warning__icon"><WarningFilled /></el-icon>
                      主页作品隐藏广告视频已下线，请在素材模块操作“主页可见性”
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="ad-footer">
        <el-button class="ad-footer__btn" @click="visible = false">取消</el-button>
        <el-button class="ad-footer__btn ad-footer__btn--primary" @click="visible = false">确 定</el-button>
      </div>
    </template>
  </BatchDrawer>

  <!-- 二级资产池弹窗：必须放在 BatchDrawer 之外（BatchDrawer 只渲染 content/footer 具名插槽） -->
  <BatchDouyinDialog v-model="pickDouyin" @confirm="onDouyinConfirm" />
  <!-- 原生锚点：选择已有 →「选择原生锚点」；模板生成 →「选择原生锚点模板」 -->
  <BatchAnchorPickDialog v-model="pickAnchorPick" @confirm="onAnchorPickConfirm" />
  <BatchAnchorTemplateDialog v-model="pickAnchor" @confirm="onAnchorConfirm" />
  <BatchComponentDialog v-model="pickComponent" @confirm="onComponentConfirm" />
  <!-- 查看推荐：行动号召 / 产品卖点 -->
  <BatchActionCtaDialog v-model="ctaDialog" :existing="form.ad.cta_tags || []" @confirm="onCtaConfirm" />
  <BatchSellingPointDialog
    v-model="sellingDialog"
    :existing="form.ad.sell_points || []"
    @confirm="onSellingConfirm"
  />
  <!-- 直达链接：选择/填写抽屉（760×，z 1401 压在广告信息抽屉 1301 之上） -->
  <BatchDeeplinkDrawer v-model="pickLink" :mode="linkMode" @confirm="onLinkConfirm" />
  <!-- 产品卖点：保存为模板 -->
  <BatchSaveTemplateDialog v-model="tplSaveVisible" @confirm="onTplSaved" />
  <!-- 广告设置：设置类别/品牌名称 -->
  <BatchBrandSettingDialog
    v-model="brandDialog"
    :current="brandCurrent"
    :value="{ category: form.ad.category, brand: form.ad.brand_name, secondBrand: form.ad.second_brand_name }"
    @confirm="onBrandConfirm"
  />
  <MaterialPickerDialog v-model="materialVisible" @submit="onMainImageSubmit" />
</template>

<script setup>
import { computed, h, inject, nextTick, reactive, ref, watch } from 'vue';
import BatchDrawer from './BatchDrawer.vue';
import BatchDouyinDialog from './BatchDouyinDialog.vue';
import BatchAnchorPickDialog from './BatchAnchorPickDialog.vue';
import BatchAnchorTemplateDialog from './BatchAnchorTemplateDialog.vue';
import BatchComponentDialog from './BatchComponentDialog.vue';
import BatchActionCtaDialog from './BatchActionCtaDialog.vue';
import BatchSellingPointDialog from './BatchSellingPointDialog.vue';
import BatchDeeplinkDrawer from './BatchDeeplinkDrawer.vue';
import BatchProductPanel from './BatchProductPanel.vue';
import BatchAdSettingPanel from './BatchAdSettingPanel.vue';
import BatchAdNamePanel from './BatchAdNamePanel.vue';
import BatchBudgetPanel from './BatchBudgetPanel.vue';
import BatchBrandSettingDialog from './BatchBrandSettingDialog.vue';
import BatchSaveTemplateDialog from './BatchSaveTemplateDialog.vue';
import MaterialPickerDialog from '../MaterialPickerDialog.vue';
import { ElMessage } from 'element-plus';
import spec from './spec/ad.spec.js';
import { isVisible, isSectionVisible, isDisabled, bubbleText } from './spec/resolve.js';
import { CTA_PRESETS } from '@/mock/data';

/**
 * 线上 iconfont 字形 → 内联 SVG（本地无 iconfont 字体文件）。
 * viewBox 用字体的 em 盒（0 -128 1024 1024，upm=1024，ascent 896 / descent -128），
 * 与线上 <i class="mg-icon-*"> 的绘制方式一致。
 */
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

/** 线上图标（字形表在 spec.icons 里） */
function icon(name) {
  return (spec.icons && spec.icons[name]) || { d: '', size: 12, color: 'currentColor' };
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  focus: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

/* 预估广告数卡片：右侧按钮点击可收起 / 再点展开 */
const estVisible = ref(true);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

/* R110：全部业务状态来自 Create.vue 通过 provide('batch') 暴露的 setup 作用域 */
const batch = inject('batch');
const {
  form, adEstimate, adLinkRows, removeAdLink, openCtaSaveTpl,
  onPickMainImage, appendAdWildcard, wildcardMoreVisible, images,
} = batch;

/* ─────────────── 值容器：spec 字段 key → 当前值 ─────────────── */
const values = reactive({});
const tagInput = reactive({});
/* 线上 el-alert 是可关闭的（右上角 ×） */
const alertClosed = reactive({});
const tagTemplate = reactive({});
const allFolded = ref(false);

/* ─────────────── 默认值：统一来自 spec.values ─────────────── */
const DEFAULTS = Object.assign({}, spec.values || {});

const visibleSections = computed(() =>
  spec.sections.filter((s) => isSectionVisible(s, values))
);

/* 通配符列表（线上 ad_name 字段的 wildcards 声明） */
function wildcardsOf(f) {
  return f.wildcards || [];
}

/* 字段 label：支持 labelWhen（随依赖字段换文案） */
function labelOf(f) {
  if (!f.label) return '';
  if (f.labelWhen) {
    const dep = f.labelWhenField || Object.keys(f.labelWhen)[0];
    const hit = f.labelWhen[values[dep]];
    if (hit) return hit;
  }
  return f.label;
}

/* 是否是本分区最后一个「可见」字段（线上最后一个 el-form-item 没有下边距） */
function isLastVisible(sec, f) {
  const list = sec.fields || [];
  const idx = list.indexOf(f);
  if (idx < 0) return false;
  for (let i = idx + 1; i < list.length; i++) {
    if (isVisible(list[i], values)) return false;
  }
  return true;
}

/* 选项集合：支持 optionsWhen（随依赖字段换集合） */
function optionsOf(f) {
  if (f.optionsWhen && f.optionsWhenField) {
    const alt = f.optionsWhen[values[f.optionsWhenField]];
    if (alt) return alt;
  }
  return f.options || [];
}

/* 选项级禁用（spec.optionDisabled） */
function isOptDisabled(f, value) {
  if (!f.optionDisabled) return false;
  const hit = f.optionDisabled.find((d) => d.value === value);
  if (!hit || !hit.when) return false;
  return matchCond(hit.when);
}

/* 选项级气泡：spec.optionBubble（可带 when 条件 / image 气泡） */
function optBubbleOf(f, o) {
  if (!f.optionBubble) return null;
  const hit = f.optionBubble.find((b) => b.value === o.value);
  if (!hit) return null;
  if (hit.when && !matchCond(hit.when)) return null;
  return hit;
}

/* 条件求值（与 spec/resolve.js 同语义；用于 optionDisabled / labelWhen 等扩展声明） */
function matchCond(c) {
  if (!c || !c.field) return true;
  const actual = values[c.field];
  if ('eq' in c) return actual === c.eq;
  if ('neq' in c) return actual !== c.neq;
  if ('in' in c) return Array.isArray(c.in) && c.in.indexOf(actual) >= 0;
  if ('notIn' in c) return Array.isArray(c.notIn) && c.notIn.indexOf(actual) < 0;
  if ('truthy' in c) return !!actual === !!c.truthy;
  return true;
}

const estimate = computed(() => (adEstimate && adEstimate.value) || { accounts: 0, projects: 0, ads: 0 });

/* ─────────────── 推广身份说明块（文案 / 示意图都在 spec 的 help 里） ─────────────── */
const promotionHelp = computed(() => {
  const sec = spec.sections.find((s) => s.key === 'promotion_identity') || {};
  const fld = (sec.fields || []).find((f) => f.key === 'promotion_identity') || {};
  const help = fld.help || {};
  return help[values.promotion_identity] || {};
});

/* ─────────────── 分配块（账户 / 主体 / 项目） ─────────────── */
const ALLOC_ROWS = [
  { name: '央广-雷盟-知乎-APP内付费-148-792335571-在投', id: '1873735638015043' },
  { name: '央广-雷盟-知乎-APP内付费-143-792335571-在投', id: '1873758636298507' },
  { name: '央广-雷盟-知乎-APP内付费-149-792335571-在投', id: '1873502811396124' },
];
const SUBJECT_NAME = '北京雷盟盛通文化发展有限公司';

function allocMode(f) {
  return values[f.modeField] || 'SAME';
}
function allocRows(f) {
  const mode = allocMode(f);
  if (mode === 'COMPANY') return [{ name: SUBJECT_NAME, id: `${ALLOC_ROWS.length} 个账户` }];
  if (mode === 'PROJECT') {
    return ALLOC_ROWS.map((r, i) => ({ name: `项目${i + 1} · ${r.name}`, id: r.id }));
  }
  return ALLOC_ROWS.map((r) => ({ name: r.name, id: r.id }));
}
function allocCopyText(f) {
  const mode = allocMode(f);
  if (mode === 'COMPANY') return '复制到其他主体';
  return '复制到其他账户';
}

/* ─────────────── 预算出价规则 ─────────────── */
const budgetRules = reactive([
  { key: 'b0', name: '预算出价规则1', folded: false, budget: '999999', bid: '52', bid_mode: 'fixed', ladder: 'OFF', min_bid: '', max_bid: '' },
]);

/* ─────────────── 标签（行动号召 / 产品卖点） ─────────────── */
function tagList(f) {
  if (f.key === 'cta') return form.ad.cta_tags || [];
  return form.ad.product_sell_points || [];
}
function onAddTag(f) {
  const raw = String(tagInput[f.key] || '').trim();
  if (!raw) return;
  const parts = raw.split(/[\s,，]+/).filter(Boolean);
  const list = tagList(f);
  parts.forEach((p) => {
    if (list.length >= (f.max || 10)) return;
    if (!list.includes(p)) list.push(p);
  });
  if (f.key === 'cta') form.ad.cta_tags = list;
  else form.ad.product_sell_points = list;
  tagInput[f.key] = '';
}
function removeTag(f, i) {
  const list = tagList(f);
  list.splice(i, 1);
  if (f.key === 'cta') form.ad.cta_tags = list;
  else form.ad.product_sell_points = list;
}
function clearTags(f) {
  if (f.key === 'cta') form.ad.cta_tags = [];
  else form.ad.product_sell_points = [];
}

/* ─────────────── 名称 / 引用 ─────────────── */
const nameLength = computed(() => {
  const s = String(form.ad.name_template || '');
  let n = 0;
  for (const ch of s) n += ch.charCodeAt(0) > 255 ? 2 : 1;
  return n;
});
function onRefAppName() {
  form.ad.product_name = form.project ? form.project.app_name : form.ad.product_name;
}
function closeAlert(f) {
  alertClosed[f.key] = true;
}
function onRefLast() {
  if (typeof batch.copyLastProduct === 'function') batch.copyLastProduct();
}
function onPick(f) {
  if (f.key === 'link_pick') {
    /* 直达链接：按「直达链接来源」决定抽屉形态（图1 列表 / 图2 手动填写 / 图3 链接模板） */
    pickLink.value = true;
    return;
  }
  /* 选择抖音号 / 选择原生锚点 / 选择创意组件 —— 线上都是二级资产池弹窗 */
  if (f.key === 'douyin_pick') {
    pickDouyin.value = true;
    return;
  }
  if (f.key === 'native_anchor_pick') {
    /* 线上：原生锚点类型 = 选择已有 →「选择原生锚点」；模板生成 →「选择原生锚点模板」 */
    if (values.native_anchor_type === 'EXIST') pickAnchorPick.value = true;
    else pickAnchor.value = true;
    return;
  }
  if (f.key === 'component_pick') {
    pickComponent.value = true;
    return;
  }
}
/* 三个二级弹窗（点击外部按钮打开，弹窗组件放在 BatchDrawer 之外） */
const pickDouyin = ref(false);
const pickAnchor = ref(false);
const pickAnchorPick = ref(false);
const pickComponent = ref(false);
/* 查看推荐：行动号召 / 产品卖点 */
const ctaDialog = ref(false);
const sellingDialog = ref(false);

/* 直达链接抽屉：mode 跟随来源 */
const pickLink = ref(false);
const linkMode = computed(() => {
  if (values.link_source === 'MANUAL') return 'manual';
  if (values.link_source === 'DYNAMIC') return 'dynamic';
  return 'list';
});

function onLinkConfirm(payload) {
  if (linkMode.value === 'manual') {
    values.link_pick_summary = payload.url;
  } else if (linkMode.value === 'dynamic') {
    values.link_pick_summary = payload.template;
  } else {
    values.link_pick_summary = (payload || []).map((x) => x.name).join('、');
  }
}

function onDouyinConfirm(list) {
  values.douyin_pick_summary = (list || []).map((x) => x.name).join('、');
}
/* 已选原生锚点 / 创意组件：按「账户 + 名称」回显成列表 */
const anchorRows = ref([]);
const componentRows = ref([]);
function onAnchorPickConfirm(list) {
  anchorRows.value = list || [];
  values.native_anchor_pick_summary = (list || []).map((x) => x.name).join('、');
  if (list && list.length) ElMessage.success(`已选择 ${list.length} 个原生锚点`);
}
function removeAnchorRow(row) {
  anchorRows.value = anchorRows.value.filter((r) => !(r.id === row.id && r.accountId === row.accountId));
  values.native_anchor_pick_summary = anchorRows.value.map((x) => x.name).join('、');
}
function removeComponentRow(row) {
  componentRows.value = componentRows.value.filter((r) => !(r.id === row.id && r.accountId === row.accountId));
  values.component_pick_summary = componentRows.value.map((x) => x.name).join('、');
}
/* 产品卖点：保存为模板（图3 小弹窗） */
const tplSaveVisible = ref(false);
const sellPointTpls = ref([]);
function tplOptions(f) {
  if (f.key === 'product_sell_points' && sellPointTpls.value.length) {
    return [...sellPointTpls.value, ...CTA_PRESETS];
  }
  return CTA_PRESETS;
}
function onTplSaved(name) {
  if (!sellPointTpls.value.includes(name)) sellPointTpls.value.unshift(name);
  tagTemplate.product_sell_points = name;
  ElMessage.success(`已保存为模板「${name}」`);
}
/* 广告设置：设置类别/品牌名称（统一配置） */
const brandDialog = ref(false);
const brandCurrent = '央广-雷盟-知乎-APP内付费-124-792335571-在投';
function onBrandConfirm(payload) {
  form.ad.category = payload.category || '';
  form.ad.brand_name = payload.brand || '';
  form.ad.second_brand_name = payload.secondBrand || '';
  ElMessage.success('已设置类别/品牌名称');
}
/* 产品主图：点「+图片」打开素材库弹窗（与账户列表查询条件里的选择素材同一套） */
const materialVisible = ref(false);
function onMainImageSubmit(list) {
  if (!list || !list.length) return;
  const dict = images && images.value ? images.value : images;
  list.forEach((m) => {
    if (!dict.find((x) => x.id === m.id)) dict.push({ id: m.id, url: '', title: m.name });
    if (form.ad.product_main_images.length >= 10) return;
    if (!form.ad.product_main_images.includes(m.id)) form.ad.product_main_images.push(m.id);
  });
  ElMessage.success(`已添加 ${list.length} 张产品主图`);
}
/* 「查看推荐」：行动号召 → 行动号召弹窗；产品卖点 → 产品卖点弹窗 */
function onRecommend(f) {
  if (f.key === 'product_sell_points') sellingDialog.value = true;
  else ctaDialog.value = true;
}
function onCtaConfirm(list) {
  if (!list || !list.length) return;
  form.ad.cta_tags = [...new Set([...(form.ad.cta_tags || []), ...list])];
  ElMessage.success(`已添加 ${list.length} 条行动号召`);
}
function onSellingConfirm(list) {
  if (!list || !list.length) return;
  form.ad.sell_points = [...new Set([...(form.ad.sell_points || []), ...list])];
  ElMessage.success(`已添加 ${list.length} 条产品卖点`);
}
function onAnchorConfirm(payload) {
  /* 模板生成：确认后是单个模板，按「账户 / 锚点模板名称」回显一行 */
  const name = payload && typeof payload === 'object' ? payload.template || '' : payload || '';
  values.native_anchor_pick_summary = name ? '已选择 1 个模板' : '';
  anchorRows.value = name
    ? [{ id: `tpl-${name}`, account: '全部账户', accountId: '按模板生成', name }]
    : [];
}
function onComponentConfirm(list) {
  componentRows.value = list || [];
  values.component_pick_summary = (list || []).map((x) => x.name).join('、');
}
function imgUrl(id) {
  const im = ((images && images.value) || []).find((x) => x.id === id);
  return im && im.url ? im.url : '';
}
function imgTitle(id) {
  const im = ((images && images.value) || []).find((x) => x.id === id);
  return im && im.title ? im.title : '';
}

/* ─────────────── 输入类字段取值 ─────────────── */
function inputValue(f) {
  if (f.key === 'product_name') return form.ad.product_name;
  return values[f.key];
}
function setInputValue(f, v) {
  if (f.key === 'product_name') form.ad.product_name = v;
  else values[f.key] = v;
}
function countOf(f) {
  if (f.key === 'product_name') return `${(form.ad.product_name || '').length}/20`;
  return '';
}

/* ─────────────── 初始化 + 与 Create.vue 的 form.ad 双向同步 ─────────────── */
const TO_FORM = {
  promotion_identity: 'promotion_identity',
  link_type: 'link_type',
  link_source: 'link_source',
  link_match_mode: 'link_match_mode',
  extra_component: 'extra_component',
  product_info_mode: 'product_info_mode',
  ad_setting_mode: 'ad_setting_mode',
  ad_operation: 'operation',
  ad_name_mode: 'ad_name_mode',
};
/* ad_name_mode：线上 SAME/ACCOUNT ↔ 本地 UNIFIED/PER_ACCOUNT */
const AD_NAME_MODE_MAP = { SAME: 'UNIFIED', ACCOUNT: 'PER_ACCOUNT' };

/**
 * 线上实测：抽屉关闭后再次打开，字段会回到「默认 / 上次保存」状态，
 * 不会保留上一次未保存的改动。本地同样在打开时重置为 spec 默认值。
 */
function resetValues() {
  Object.keys(values).forEach((k) => { delete values[k]; });
  Object.keys(alertClosed).forEach((k) => { delete alertClosed[k]; });
  Object.keys(DEFAULTS).forEach((k) => { values[k] = DEFAULTS[k]; });
}

function syncToForm() {
  Object.keys(TO_FORM).forEach((k) => {
    const target = TO_FORM[k];
    if (target === 'ad_name_mode') {
      form.ad.ad_name_mode = AD_NAME_MODE_MAP[values.ad_name_mode] || 'UNIFIED';
    } else {
      form.ad[target] = values[k];
    }
  });
  form.ad.comment_disable = values.ad_comment !== 'OFF';
  form.ad.download_video = values.client_download;
  form.ad.cta_smart = values.cta_smart === 'ON';
  form.ad.ad_auto_truncate = values.ad_auto_truncate === 'ON';
  form.ad.ad_random_suffix = values.ad_random_suffix === 'ON';
  if (values.ad_dynamic_index !== undefined) form.ad.ad_dynamic_index = values.ad_dynamic_index;
}

watch(
  values,
  () => {
    syncToForm();
    if (typeof batch.onLinkSourceChange === 'function' && values.link_source) {
      batch.onLinkSourceChange(values.link_source);
    }
    if (typeof batch.onExtraComponentChange === 'function' && values.extra_component) {
      batch.onExtraComponentChange(values.extra_component);
    }
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      resetValues();
      syncToForm();
    }
  },
  { immediate: true }
);

/* ── 8 个配置项按钮的分区定位 ──
   线上实测：点「直达链接 / 产品信息 / 广告设置 / 广告预算与出价」会打开本抽屉
   并**滚动到对应分区**（线上 scrollTop 实测：产品信息 522 / 广告设置 1201） */
const FOCUS_SECTION = {
  deeplink: '直达链接',
  product: '产品信息',
  ad_setting: '广告设置',
  ad_budget: '广告预算与出价',
};

function scrollToFocus() {
  const sec = FOCUS_SECTION[props.focus];
  if (!sec) return;
  nextTick(() => {
    setTimeout(() => {
      const root = document.querySelector('.cl-drawer__content');
      if (!root) return;
      const el = Array.from(root.querySelectorAll('.cl-module__title')).find(
        (e) => (e.textContent || '').trim() === sec
      );
      if (!el) return;
      const mod = el.closest('.cl-module');
      if (!mod) return;
      root.scrollTop = mod.offsetTop - root.offsetTop;
    }, 120);
  });
}

watch(
  () => [props.modelValue, props.focus],
  ([open]) => {
    if (open) scrollToFocus();
  }
);

function onClose() {
  emit('update:modelValue', false);
}
</script>

<style>
/* ───────────────────────────────────────────────────────────────
   线上 cl-drawer 外壳微调（BatchDrawer.vue 已提供基础版式）
   线上实测：
     .drawer-content  高 calc(100vh - 148px)、底色 #f0f2f5、不占滚动条宽度
     .drawer-footer   absolute bottom:0，按钮距顶 12px（.dialog-footer padding-top）
   ─────────────────────────────────────────────────────────────── */
.cl-drawer .cl-drawer__content {
  height: calc(100vh - 148px);
  flex: none;
  background: #f0f2f5;
  scrollbar-width: none;
}
.cl-drawer .cl-drawer__content::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.cl-drawer .cl-drawer__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  align-items: flex-start;
}
.cl-drawer .cl-drawer__footer .el-button + .el-button {
  margin-left: 0;
}

/* 线上字体栈（Element UI 全站）：本地默认栈在 Windows 上会落到 Segoe UI，
   导致拉丁字宽不同（radio 宽度差 2~3px）。这里在「广告基本信息」抽屉内对齐。 */
.ad-root {
  font-family: "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Helvetica Neue",
    Helvetica, "Hiragino Sans GB", Arial, sans-serif;
  --el-color-primary: #197afb;
  --el-color-primary-light-3: #4a9bff;
  --el-color-primary-light-5: #7ab6ff;
  --el-color-primary-light-7: #aad2ff;
  --el-color-primary-light-8: #c2e0ff;
  --el-color-primary-light-9: #d6eaff;
  --el-color-primary-dark-2: #1276db;
}
/* 线上 el-button--small：padding 9px 15px（EP 默认 5px 11px） */
.ad-root .el-button--small {
  padding: 9px 15px;
}
/* 线上 popover：mg-popover / el-popover--plain */
.ad-pop {
  font-size: 12px;
  line-height: 18px;
}
.ad-pop__text {
  display: block;
  max-width: 236px;
  font-size: 12px;
  line-height: 18px;
  color: #515a6e;
}
.ad-pop__img {
  display: block;
  max-width: 100%;
}
</style>

<style scoped>
.ad-root { position: relative; padding-bottom: 16px; }

/* 预估广告数（线上 .estimate-promotion-number-wrapper）：卡片可收起/展开 */
.ad-est {
  position: fixed; top: 64px; right: 49px; z-index: 15;
  box-sizing: border-box; width: 240px; font-size: 12px;
}
.ad-est__card {
  box-sizing: border-box; padding: 8px 16px 0;
  background: rgba(247, 247, 250, .49);
  border-bottom: 1px solid #dcdee6; border-radius: 8px;
  box-shadow: rgba(0, 0, 0, .2) 0 2px 4px;
}
.ad-est__title {
  margin: 16px 0; font-size: 14px; font-weight: 700; color: #17233d; line-height: 18px;
}
.ad-est__row {
  display: flex; align-items: center; height: 17px; line-height: 17px;
  margin-bottom: 8px; color: #808695;
}
.ad-est__label { color: #515a6e; font-weight: 700; margin-right: 4px; }
.ad-est__num { color: #2e71ea; }
/* 线上 .expend：24×30，图标 24px，挂在卡片右侧外沿 */
.ad-est__fold {
  position: absolute; top: 0; right: -24px;
  width: 24px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #197afb; cursor: pointer;
}

/* 字段行：label 144px + 控件区（align-items:start —— 线上 label 不被行高拉伸） */
.ad-field {
  display: grid; grid-template-columns: 144px 1fr; align-items: start;
  margin-bottom: 24px;
}
.ad-field:last-child { margin-bottom: 0; }
.ad-field--bare { grid-template-columns: 1fr; }
/* 说明条自带 margin（-6 / 18），不再叠加行间距 */
.ad-field--alert { margin-bottom: 0; }
/* 最后一个可见字段没有下边距 */
.ad-field--last { margin-bottom: 0; }
.ad-field__label {
  box-sizing: border-box;
  width: 144px; padding-right: 12px;
  font-size: 14px; line-height: 32px; color: #666;
  text-align: left;
}
.ad-field--bare .ad-field__label { display: none; }
/* 线上 label::before 的 content 为空串 —— 必填项也不显示红色星号 */
.ad-field__label.is-required::before { content: ''; }
.ad-field__content { font-size: 14px; line-height: 32px; color: #000; }

/* radio（线上 el-radio-button--small：h32 / fs12 / fw500 / min-width 80） */
.ad-radio { display: inline-flex; flex-wrap: wrap; vertical-align: top; margin-top: 1px; }
.ad-radio--ml32 { margin-left: 32px; }
.ad-radio :deep(.el-radio-button) { margin-right: 0; }
.ad-radio :deep(.el-radio-button__inner) {
  box-sizing: border-box;
  min-width: 80px;
  padding: 9px 12px; font-size: 12px; font-weight: 500; line-height: 12px;
  height: 32px; color: #606266; background: #fff;
  border: 1px solid #dcdfe6; border-radius: 0;
  box-shadow: none;
}
.ad-radio :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 3px 0 0 3px;
}
.ad-radio :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 3px 3px 0;
}
.ad-radio :deep(.el-radio-button__original-radio) { display: none; }
.ad-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb; background: #d6eaff; border-color: #197afb;
  box-shadow: -1px 0 0 0 #197afb;
}
.ad-radio :deep(.el-radio-button.is-active:first-child .el-radio-button__inner) {
  box-shadow: none;
}
.ad-radio :deep(.el-radio-button__inner:hover) { color: #197afb; }
.ad-radio :deep(.el-radio-button.is-disabled .el-radio-button__inner) {
  color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed;
}
/* 选项文字挂在 popover 上时保持内联 */
.ad-opt { display: inline-flex; align-items: center; }

/* ⓘ 图标（线上 mg-icon-question2：12×13 / fs12 / #999） */
.ad-q {
  margin-left: 8px; font-size: 12px; line-height: 12px;
  color: #999; vertical-align: -1px; cursor: help;
}
.ad-q--lg { font-size: 14px; line-height: 14px; margin-left: 4px; }

/* 提示条 / 说明条 */
.ad-tip { font-size: 12px; line-height: 32px; color: #f7aa47; }
.ad-alert {
  display: flex; align-items: center; gap: 8px;
  box-sizing: border-box; height: 34px;
  padding: 9px 12px; margin: -6px 0 18px;
  font-size: 16px; line-height: 16px; color: #909399;
  background: #d6eaff; border-radius: 4px;
}
.ad-alert { position: relative; }
.ad-alert__icon { font-size: 16px; color: #197afb; }
/* 线上 el-alert 右上角的关闭 × （12×12 / #c0c4cc） */
.ad-alert__close {
  position: absolute; top: 11px; right: 12px;
  font-size: 12px; color: #c0c4cc; cursor: pointer;
}
.ad-alert__link {
  font-size: 16px; font-weight: 400; line-height: 16px; color: #197afb;
  text-decoration: none; cursor: pointer;
}

/* 文字型按钮（对齐线上 el-button--text el-button--small：h32 / padding 9px 0） */
.ad-textbtn {
  height: 32px; padding: 9px 0;
  font-size: 12px; font-weight: 500; color: #197afb;
  background: transparent; border: 1px solid transparent; border-radius: 3px;
  box-shadow: none;
}
.ad-textbtn:hover { color: #4a9bff; background: transparent; border-color: transparent; }

/* 按钮 */
.ad-btn120 {
  width: 120px; height: 32px; font-size: 12px; font-weight: 500;
  border-radius: 3px; background: #197afb; border-color: #197afb;
}
.ad-btn120:hover { background: #4a9bff; border-color: #4a9bff; }
.ad-btn-hint { margin-top: 6px; font-size: 12px; color: #909399; }
.ad-btn-addrule { height: 32px; font-size: 12px; }
.ad-btn-addrule--hidden { display: none; }

/* 输入 */
.ad-input-row { display: flex; align-items: center; }
.ad-input :deep(.el-input__wrapper) { padding: 0 12px; border-radius: 2px; }
.ad-input :deep(.el-input__inner) { font-size: 13px; color: #606266; height: 32px; line-height: 32px; }
.ad-input--360 { width: 360px; }
/* 广告名称：线上输入框宽 630（名称配置模式统一配置） */
.ad-adname .ad-input--360 { width: auto; flex: 1; min-width: 0; max-width: 630px; }
.ad-input--160 { width: 160px; }
.ad-ref { margin-left: 16px; font-size: 12px; font-weight: 500; }
.ad-count { font-size: 12px; color: #dcdee6; }
.ad-suffix { font-size: 12px; color: #515a6e; }

/* 产品主图 */
.ad-upload { box-sizing: border-box; min-height: 138px; padding-bottom: 10px; margin-bottom: 8px; }
.ad-upload__imgs { display: flex; flex-wrap: wrap; padding-top: 10px; margin-bottom: 10px; }
.ad-upload__single {
  position: relative; width: 108px; height: 108px; margin-right: 10px;
  overflow: hidden; border-radius: 4px; background: #f8f8f8;
}
.ad-upload__single img { width: 100%; height: 100%; object-fit: cover; }
.ad-upload__ph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 13px;
  color: #86909c;
  background: #f2f3f5;
}
.ad-upload__del {
  position: absolute; top: 2px; right: 2px;
  width: 16px; height: 16px; font-size: 12px; line-height: 16px; text-align: center;
  background: rgba(0, 0, 0, .45); color: #fff; border-radius: 50%; cursor: pointer;
}
.ad-upload__content { width: 108px; height: 108px; margin-right: 20px; }
.ad-upload__empty {
  box-sizing: border-box; width: 95px; height: 95px; margin: 7px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  font-size: 12px; color: #666; background: #f8f8f8;
  border: 1px dashed #d6d6d6; border-radius: 4px; cursor: pointer;
}
.ad-upload__empty .el-icon { font-size: 14px; color: #666; }
.ad-upload__empty:hover { border-color: #197afb; color: #197afb; }

/* 标签输入 */
.ad-tags-wrap { width: 100%; }
.ad-tags-row { display: flex; align-items: center; }
.ad-tags-row > :first-child { margin-right: 16px; }
.ad-tags-row :deep(.el-input-group__append) {
  padding: 0 20px; background: #f5f7fa; border-radius: 0 4px 4px 0;
}
.ad-tags-row :deep(.el-input-group__append .el-input__wrapper),
.ad-tags-row :deep(.el-input-group__append .el-input__inner) { border-radius: 0 2px 2px 0; }
.ad-tags-row :deep(.el-input__wrapper) { border-radius: 3px 0 0 3px; }
/* 线上 .tags-add-btn：fs13 / #197afb 字 / #d6eaff 底 / 1px #197afb 边
   ※ Element Plus 有一条 `.el-input-group__append button.el-button { color:inherit; background:transparent }`
     会盖住普通 class，这里用更高优先级复刻线上样式。 */
.ad-tags-row :deep(.el-input-group__append button.el-button.ad-tags-add) {
  height: 32px; padding: 9px 15px; margin: 0 -20px;
  font-size: 13px; font-weight: 500; line-height: 13px;
  color: #197afb; background: #d6eaff; border-color: #197afb; border-radius: 3px;
}
/* 线上「行动号召」的添加按钮带 .tags-add-btn：padding 0 8px、右下圆角 */
.ad-tags-row :deep(.el-input-group__append button.el-button.ad-tags-add--cta) {
  padding: 0 8px; border-radius: 0 2px 2px 0;
}
.ad-tags-row :deep(.el-input-group__append button.el-button.ad-tags-add:hover) {
  color: #197afb; background: #d6eaff; border-color: #197afb;
}
.ad-recommend {
  width: 80px; height: 32px; font-size: 12px; font-weight: 500;
  color: #666; background: #fff; border-color: #d0d0d0; border-radius: 3px;
}
.ad-recommend:hover { color: #197afb; border-color: #c0c4cc; background: #fff; }
.ad-tpl-row { display: flex; align-items: center; width: 360px; margin-top: 16px; }
.ad-tpl-select { flex: 1; min-width: 0; }
.ad-tpl-select :deep(.el-input__wrapper) { border-radius: 4px 0 0 4px; }
/* 线上 el-select 的下拉箭头（element-icons 14px / #c0c4cc） */
.ad-tpl-select :deep(.el-select__caret) { font-size: 14px; color: #c0c4cc; }
.ad-tpl-save {
  height: 32px; padding: 9px 15px; margin-left: -1px;
  font-size: 12px; font-weight: 500; color: #666; background: #fff;
  border-color: #d0d0d0; border-radius: 0 3px 3px 0;
}
.ad-tpl-save:hover { color: #197afb; border-color: #c0c4cc; background: #fff; }
/* 线上「开启智能生成」：蓝色文字，已勾选 */
.ad-smart { height: 32px; margin-left: 0; }
.ad-smart :deep(.el-checkbox__label) {
  font-size: 16px; font-weight: 400; line-height: 19px; color: #197afb;
}
.ad-smart :deep(.el-checkbox__inner) { border-radius: 2px; }
.ad-smart :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #197afb; border-color: #197afb;
}

/* 已添加标签卡片（线上 .mg-card / .mg-card-header / .mg-card-title / .tag-clear / .mg-card-body / .mg-tag） */
.mg-card {
  box-sizing: border-box;
  width: 360px; margin-top: 16px;
  background: #fff; border: 1px solid #dcdee6; border-radius: 4px;
}
.mg-card-header {
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between;
  height: 32px; padding: 0 8px; background: #f8f9fd; border-bottom: 1px solid #dcdee6;
}
.mg-card-title { font-size: 12px; color: #515a6e; line-height: 32px; }
.tag-clear { font-size: 12px; color: #2e71ea; line-height: 32px; cursor: pointer; }
.ad-icon-refresh { margin-left: 3px; font-size: 12px; color: #2e71ea; vertical-align: -1px; }
.mg-card-body {
  box-sizing: border-box;
  display: grid; grid-template-columns: repeat(2, 166px); gap: 8px;
  min-height: 160px; padding: 10px 7px; align-content: start;
}
.mg-tag {
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between;
  width: 166px; height: 24px; padding: 0 8px 0 9px; margin-bottom: 0;
  font-size: 14px; color: #515a6e; background: #f4f5fc; border-radius: 4px;
}
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mg-icon-close { flex: none; font-size: 14px; color: #bfc4d0; cursor: pointer; }

/* 广告名称 */
.ad-adname { width: 100%; }
.ad-adname__row { display: flex; align-items: center; gap: 12px; }
.ad-adname__ck { flex: none; white-space: nowrap; margin-left: 0; font-size: 16px; font-weight: 500; color: #606266; }
.ad-adname__ck :deep(.el-checkbox__label) { font-size: 16px; color: #606266; }
.ad-adname__tags { display: flex; align-items: center; width: 400px; height: 32px; margin-top: 0; }
.ad-adname__tags > * { flex: none; }
.ad-adname__tagtext { font-size: 12px; color: #17233d; margin-right: 5px; white-space: nowrap; }
/* 线上通配符：el-button--text el-button--mini（透明底 / 12px / 500 / + 图标） */
.ad-wild {
  height: 28px; padding: 7px 0; margin-right: 12px;
  font-size: 12px; font-weight: 500; color: #197afb;
  background: transparent; border: 1px solid transparent; border-radius: 3px;
}
.ad-wild:hover { color: #4a9bff; background: transparent; border-color: transparent; }
.ad-wild__plus { margin-right: 2px; font-size: 12px; vertical-align: -1px; }
.ad-more { font-size: 12px; color: #515a6e; cursor: pointer; }
.ad-more__icon { margin-left: 2px; font-size: 12px; color: #2681fc; vertical-align: -1px; }
.ad-warning {
  margin-top: 0; font-size: 12px; line-height: 20px; color: #f7aa47;
}
.ad-warning__icon { margin-right: 8px; font-size: 14px; color: #ff9b48; vertical-align: -2px; }
.ad-warning--promotion { margin-top: 4px; }

/* 推广身份说明（线上 .help-content） */
.ad-help {
  box-sizing: border-box; width: 540px; margin-top: 16px;
  border: 1px solid #e8eaec;
}
.ad-help__img { display: block; width: 538px; height: 105px; object-fit: cover; }
.ad-help__tips { margin-top: 11px; padding: 0 0 12px 12px; }
.ad-help__tip { margin: 0; font-size: 12px; line-height: 24px; color: #999; }

/* 直达链接表 */
.ad-link-table { width: 100%; }
.ad-cl-table :deep(th.el-table__cell) {
  background: #f5f7fa; height: 56px; padding: 0;
}
.ad-cl-table :deep(td.el-table__cell) { height: 56px; padding: 0; }
.ad-cl-table :deep(th .cell) {
  font-size: 12px; font-weight: 700; color: #333; padding: 0 12px; line-height: 18px;
}
.ad-cl-table :deep(td .cell) { font-size: 14px; color: #606266; padding: 0 12px; line-height: 20px; }
.ad-link-cell { font-size: 14px; line-height: 20px; color: #17233d; }
.ad-link-cell p { margin: 0; }
.ad-link-cell__id { font-size: 14px; line-height: 18px; color: #ccc; }
.ad-link-url {
  display: inline-flex; align-items: center; gap: 6px;
  max-width: 100%; padding: 2px 8px;
  font-size: 14px; color: #606266; background: #f5f7fa; border-radius: 2px;
}
.ad-link-url p { margin: 0; }
.ad-link-url__text { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-link-url__x { flex: none; font-size: 16px; color: #999; cursor: pointer; }

/* 分配块 */
.ad-alloc { width: 100%; margin-bottom: 16px; }
.ad-product-panel { width: 100%; margin-bottom: 16px; }
.ad-alloc__list { display: flex; flex-direction: column; gap: 8px; }
.ad-alloc__row {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 12px; background: #f7f8fa; border-radius: 4px;
}
.ad-alloc__name { font-size: 13px; color: #17233d; }
.ad-alloc__id { font-size: 12px; color: #909399; }
.ad-alloc__ops { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.ad-alloc__copy { font-size: 12px; font-weight: 400; }

/* 类别 / 品牌 */
.ad-brand { width: 100%; }
.ad-brand__row { display: flex; align-items: center; margin-bottom: 8px; font-size: 14px; color: #17233d; }
.ad-brand__label { width: 96px; flex: none; }
.ad-brand__input { width: 160px; }
.ad-brand__input :deep(.el-input__wrapper) { border-radius: 2px; }
.ad-brand__set { width: 120px; height: 36px; margin: 4px 0 16px; }
.ad-brand__summary { display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #86909c; }
.ad-brand__summary em { font-style: normal; color: #4e5969; }
.ad-brand__warn { margin: 6px 0 0; font-size: 13px; color: #f53f3f; }

/* 预算与出价（线上 .budget-and-bid-wrapper） */
.ad-budget { width: 100%; }
.ad-moderow { display: flex; align-items: center; margin-bottom: 16px; }
.mode-label { width: 112px; flex: none; font-size: 14px; line-height: 18px; color: #666; }
.content-wrapper { width: 100%; }
.content-title {
  box-sizing: border-box;
  display: flex; align-items: flex-start; justify-content: space-between;
  height: 64px; padding: 16px; border: 1px solid #dcdee2;
}
.right-buttons { margin-left: auto; }
.ad-fold { font-size: 12px; font-weight: 500; }
.right-title {
  box-sizing: border-box;
  display: flex; justify-content: space-between; align-items: center;
  height: 36px; padding: 12px;
  font-size: 12px; line-height: 12px; color: #000;
  background: #f2f2f2; border-bottom: 1px solid #dcdee2;
}
.title-label { color: #999; }
.title-text { color: #000; }
.right-content { padding: 16px; }
.project-bid {
  box-sizing: border-box;
  margin-bottom: 16px;
  border: 1px solid #dcdee2; border-bottom: none;
}
.project-bid-title {
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between;
  height: 36px; padding: 12px;
  font-size: 12px; line-height: 12px; color: #000; background: #f2f2f2;
  border-bottom: 1px solid #dcdee2;
}
.project-bid-form { padding: 16px; }
.ad-rule__row { display: flex; align-items: center; min-height: 33px; margin-bottom: 24px; }
.ad-rule__row:last-child { margin-bottom: 0; }
.ad-rule__label { width: 180px; flex: none; font-size: 14px; line-height: 32px; color: #17233d; }
.ad-rule__q { margin-left: 8px; }
.ad-rule__sep { margin: 0 8px; color: #c9cdd4; }

/* 底部 */
.ad-footer { display: flex; align-items: flex-start; justify-content: flex-end; gap: 16px; padding-top: 12px; }
.ad-footer__btn {
  width: 88px; height: 32px; padding: 9px 15px; font-size: 12px; font-weight: 500;
  color: #666; background: #fff; border: 1px solid #d0d0d0; border-radius: 3px;
}
.ad-footer__btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.ad-footer__btn--primary:hover { background: #4a9bff; border-color: #4a9bff; }
</style>