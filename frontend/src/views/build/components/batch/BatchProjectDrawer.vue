<template>
  <BatchDrawer
    v-model="visible"
    :title="spec.title"
    :width="spec.width"
    :z-index="1101"
    :cancel-text="spec.footer.cancelText"
    :ok-text="spec.footer.okText"
    :close-on-mask="false"
    @close="onProjectCancel"
    @ok="onProjectConfirm"
  >
    <template #content>
      <div class="proj-root">
        <!-- 右上角悬浮卡：预估广告数（线上 .estimate-promotion-number-wrapper：fixed top:64 right:49 w:240） -->
        <div class="proj-est">
          <div class="proj-est__panel" :class="{ 'is-folded': estFolded }">
            <div class="proj-est__title">{{ spec.estimate.title }}</div>
            <div v-for="r in spec.estimate.rows" :key="r.field" class="proj-est__row">
              <span class="proj-est__label">{{ r.label }}</span>
              <span class="proj-est__num">{{ estimate[r.field] }}</span>
            </div>
          </div>
          <span class="proj-est__fold" @click="estFolded = !estFolded">
            <el-icon><component :is="estFolded ? Expand : Fold" /></el-icon>
          </span>
        </div>

        <!-- 分区（线上 .module-container + .cl-form-block-title） -->
        <div v-for="sec in visibleSections" :key="sec.key" class="cl-module">
          <div class="cl-module__title">{{ sec.title }}</div>
          <div class="cl-module__body">
            <template v-for="f in sec.fields" :key="f.key">
              <div
                v-if="isVisible(f, values) && !f.inRule"
                class="proj-field"
                :class="[
                  { 'proj-field--bare': !f.label, 'is-disabled': isDisabled(f, values) },
                  labelWidthClass(sec, f),
                  { 'proj-field--indent': f.kind === 'weekTimeGrid' },
                ]"
                :style="{ marginBottom: fieldMargin(sec, f) + 'px' }"
              >
                <div class="proj-field__label" :class="{ 'is-required': f.required }">
                  <span>{{ labelOf(f) }}</span>
                  <!-- 线上：label 右侧 .mg-icon-question2（14×14 / #999 / margin-left 8px）
                       + el-popover hover 显示提示文案 -->
                  <el-popover
                    v-if="bubbleOf(f)"
                    placement="top"
                    :width="240"
                    trigger="hover"
                    :teleported="false"
                  >
                    <!-- 线上部分气泡是结构化内容：.intro > .intro-title + .intro-content -->
                    <!-- 无标题时用 span 直出正文（此前用 <template v-else> 会被 slot 吞掉，气泡空白） -->
                    <!-- 线上部分气泡是结构化内容：.intro > .intro-title + .intro-content
                         注意：el-popover 的内容插槽是 `#default`，写 `#content` 不会渲染（气泡会是空白） -->
                    <template #default>
                      <div v-if="bubbleTitle(f)" class="proj-bubble">
                        <p class="proj-bubble__title">{{ bubbleTitle(f) }}</p>
                        <p class="proj-bubble__content">{{ bubbleContent(f) }}</p>
                      </div>
                      <span v-else class="proj-bubble__content">{{ bubbleContent(f) }}</span>
                    </template>
                    <template #reference>
                      <i class="proj-field__qicon"></i>
                    </template>
                  </el-popover>
                </div>

                <div class="proj-field__content">
                  <!-- ── 组块（线上 .convert-content：1px 边框 + 16px padding，内嵌子 el-form-item） ── -->
                  <div v-if="f.type === 'group'" class="proj-group">
                    <template v-for="cf in f.fields || []" :key="cf.key">
                      <div
                        v-if="isVisible(cf, values)"
                        class="proj-field proj-field--nested"
                        :class="{ 'is-disabled': isDisabled(cf, values) }"
                      >
                        <div class="proj-field__label" :class="{ 'is-required': cf.required }">
                          {{ labelOf(cf) }}
                        </div>
                        <div class="proj-field__content">
                          <el-radio-group
                            v-if="cf.type === 'radio'"
                            :model-value="values[cf.key]"
                            size="small"
                            class="proj-radio"
                            @update:model-value="(v) => onRadioChange(cf, v)"
                          >
                            <el-radio-button v-for="o in optionsOf(cf)" :key="o.value" :value="o.value">
                              {{ o.label }}
                            </el-radio-button>
                          </el-radio-group>
                          <el-select
                            v-else-if="cf.type === 'select'"
                            :model-value="values[cf.key]"
                            size="small"
                            class="proj-select"
                            :class="{ 'proj-select--w360': cf.width === 360 }"
                            :placeholder="cf.placeholder || '请选择'"
                            @update:model-value="(v) => onRadioChange(cf, v)"
                          >
                            <el-option v-for="o in optionsOf(cf)" :key="o.value" :label="o.label" :value="o.value" />
                          </el-select>
                          <div v-if="fieldTip(cf)" class="proj-tip" :class="{ 'proj-tip--warn': cf.tipType === 'warn' }">
                            {{ fieldTip(cf) }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- ── 卡片组（推广目的 7 张 / 竞价策略 N 张） ── -->
                  <div v-if="f.type === 'cards'" class="proj-cards" :class="'proj-cards--' + f.cardStyle">
                    <div
                      v-for="o in optionsOf(f)"
                      :key="o.value"
                      class="proj-card"
                      :class="[
                        'proj-card--' + f.cardStyle,
                        { 'is-active': values[f.key] === o.value },
                      ]"
                      @click="setVal(f, o.value)"
                    >
                      <div class="proj-card__title">{{ o.label }}</div>
                      <div class="proj-card__desc">{{ o.desc }}</div>
                      <img v-if="f.cardStyle === 'objective'" class="proj-card__img" :src="o.img" :alt="o.label" />
                    </div>
                  </div>

                  <!-- ── 单选 ── -->
                  <el-radio-group
                    v-else-if="f.type === 'radio'"
                    :model-value="values[f.key]"
                    size="small"
                    class="proj-radio"
                    :class="{ 'proj-radio--seg': !!f.seg }"
                    @update:model-value="(v) => onRadioChange(f, v)"
                  >
                    <el-radio-button
                      v-for="o in optionsOf(f)"
                      :key="o.value"
                      :value="o.value"
                      :disabled="isOptDisabled(f, o.value)"
                    >
                      <el-popover
                        v-if="optBubble(f, o)"
                        :content="optBubble(f, o)"
                        placement="top"
                        :width="240"
                        trigger="hover"
                      >
                        <template #reference><span class="proj-radio__txt">{{ o.label }}</span></template>
                      </el-popover>
                      <template v-else>{{ o.label }}</template>
                    </el-radio-button>
                  </el-radio-group>

                  <!-- ── 多选 ── -->
                  <el-checkbox-group
                    v-else-if="f.type === 'checkbox'"
                    :model-value="values[f.key]"
                    size="small"
                    class="proj-check"
                    @update:model-value="(v) => setVal(f, v)"
                  >
                    <el-checkbox v-for="o in optionsOf(f)" :key="String(o.value)" :value="o.value">
                      {{ o.label }}
                    </el-checkbox>
                    <span v-if="f.suffix" class="proj-check__suffix">{{ f.suffix }}</span>
                  </el-checkbox-group>

                  <!-- ── 下拉 ── -->
                  <div v-else-if="f.type === 'select'" class="proj-inline">
                    <el-select
                      :model-value="values[f.key]"
                      size="small"
                      class="proj-select"
                      placeholder="请选择"
                      @update:model-value="(v) => setVal(f, v)"
                    >
                      <el-option v-for="o in optionsOf(f)" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                    <el-button v-if="f.kind === 'selectWithRefresh'" size="small" @click="onRefresh(f)">刷新</el-button>
                  </div>

                  <!-- ── 文本（项目名称行：输入框 + 两个勾选 + 通配符） ── -->
                  <div v-else-if="f.type === 'input'" class="proj-input-row">
                    <div class="proj-inline">
                      <el-input
                        :model-value="values[f.key]"
                        size="small"
                        :maxlength="f.maxlength || 100"
                        :placeholder="f.placeholder || ''"
                        :class="{ 'proj-input--w360': f.width === 360, 'proj-input--w160': f.width === 160 }"
                        @update:model-value="(v) => setVal(f, v)"
                      />
                      <template v-for="x in f.extras || []" :key="x.key">
                        <el-checkbox
                          :model-value="values[x.key]"
                          @update:model-value="(v) => setExtra(x, v)"
                        >{{ x.label }}</el-checkbox>
                        <!-- 线上：每个 checkbox 后跟 ⓘ（mg-icon-question2 / popover width 350） -->
                        <el-popover
                          v-if="x.bubble"
                          :content="x.bubble"
                          placement="top"
                          :width="350"
                          trigger="hover"
                          :teleported="false"
                        >
                          <template #reference>
                            <i class="proj-field__qicon proj-field__qicon--inline"></i>
                          </template>
                        </el-popover>
                      </template>
                    </div>
                    <div v-if="f.wildcards" class="proj-wildcards">
                      <span class="proj-wildcards__label">通配符:</span>
                      <el-popover
                        v-for="w in f.wildcards"
                        :key="w.label"
                        :content="w.tip || ''"
                        placement="top"
                        :width="296"
                        trigger="hover"
                      >
                        <template #reference>
                          <el-button link type="primary" size="small" @click="appendWildcard(w.label)">
                            <el-icon class="proj-wildcards__icon"><Plus /></el-icon>{{ w.label }}
                          </el-button>
                        </template>
                      </el-popover>
                      <span class="proj-wildcards__more" @click="wildcardMoreVisible = true">
                        <el-icon class="proj-wildcards__icon"><Plus /></el-icon>插入更多
                      </span>
                    </div>
                  </div>

                  <!-- ── 数字 / 日期 ── -->
                  <!-- 线上「日预算」：.w160.mr8 普通输入框（placeholder「请输入预算金额」）+
                       「元」+ 快捷值 300|500|1000|2000（.opt-link），
                       不是 el-input-number（线上无步进按钮） -->
                  <div v-else-if="f.type === 'number'" class="proj-amount">
                    <el-input
                      :model-value="values[f.key]"
                      size="small"
                      class="proj-amount__input"
                      placeholder="请输入预算金额"
                      @update:model-value="(v) => setVal(f, v)"
                    />
                    <span class="proj-amount__unit">元</span>
                    <template v-for="(q, qi) in f.quick || []" :key="'q' + qi">
                      <span class="proj-amount__sep">|</span>
                      <span class="proj-amount__quick" @click="setVal(f, q)">{{ q }}</span>
                    </template>
                  </div>
                  <el-date-picker
                    v-else-if="f.type === 'date'"
                    :model-value="values[f.key]"
                    type="date"
                    size="small"
                    value-format="YYYY-MM-DD"
                    @update:model-value="(v) => setVal(f, v)"
                  />

                  <!-- ── 自定义（kind 分发） ── -->
                  <template v-else-if="f.type === 'custom'">
                    <!-- 选择资产组 -->
                    <div v-if="f.kind === 'assetGroupPick'" class="proj-inline">
                      <el-button type="primary" size="small" class="proj-btn120" @click="pickAssetGroup">选择资产组</el-button>
                      <span class="proj-picked">已选 {{ (form.project.asset_group_ids || []).length }}/1000</span>
                    </div>

                    <!-- 事件资产表格 / 分包链接组表格（线上：独立的一行） -->
                    <template v-else-if="f.kind === 'eventAssetTable'">
                      <el-table :data="projEventRows" size="small" border class="proj-table proj-table--3col">
                        <el-table-column label="账户" min-width="200">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="事件资产" min-width="240">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.asset }}</span><span class="proj-cell__id">{{ row.pkg }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default><el-button link type="primary" @click="pickEventAsset">选择</el-button></template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 分包和链接组内联表（线上图：账户 | 分包和链接组(链接卡片 url+名称 + ×) | 操作「添加」） -->
                    <template v-else-if="f.kind === 'linkGroupTable'">
                      <el-table :data="projLinkRows" size="small" border class="proj-table proj-table--3col">
                        <el-table-column label="账户" min-width="220">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="分包和链接组" min-width="260">
                          <template #default="{ row }">
                            <div v-if="row.group" class="proj-card">
                              <el-icon class="proj-card__x" @click="removeLinkGroup(row.accountId)"><Close /></el-icon>
                              <div class="proj-card__name">{{ row.group.url }}</div>
                              <div class="proj-card__name">{{ row.group.name }}</div>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default="{ row }"><el-button link type="primary" @click="openMonitorGroup('选择监测链接组', row.accountId)">添加</el-button></template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 资产表格（线上：独立的一行，el-form-item__content margin-left:0，
                         不在字段行内 —— 线上「选择产品」「选择定向包」「选择分包和链接组」
                         的字段行只有按钮，表格另起一行） -->
                    <template v-else-if="f.kind === 'assetTable'">
                      <el-table
                        v-if="f.table === 'product'"
                        :data="projProductRows"
                        size="small"
                        border
                        class="proj-table"
                      >
                        <el-table-column label="账户" min-width="220">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="产品" min-width="220">
                          <template #default="{ row }">
                            <el-tag
                              v-for="p in row.products"
                              :key="p"
                              closable
                              class="proj-tag"
                              @close="row.products = row.products.filter((x) => x !== p)"
                            >{{ p }}</el-tag>
                          </template>
                        </el-table-column>
                      </el-table>
                      <el-table
                        v-else-if="f.table === 'target'"
                        :data="projAudienceRows"
                        size="small"
                        border
                        class="proj-table"
                      >
                        <el-table-column label="账户名称" min-width="200">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="定向包" min-width="240">
                          <template #default="{ row }">
                            <div v-if="row.pack" class="proj-card">
                              <el-icon class="proj-card__x" @click="removeTargetPackage(row.accountId)"><Close /></el-icon>
                              <div class="proj-card__name">{{ row.pack.name }}</div>
                              <div class="proj-card__name">{{ row.pack.id }}</div>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default="{ row }"><el-button link type="primary" @click="openTargetPackage(row.accountId)">添加</el-button></template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 选择产品 -->
                    <template v-else-if="f.kind === 'productPick'">
                      <div class="proj-inline">
                        <el-button type="primary" size="small" class="proj-btn120" @click="relatedVisible = true">选择产品</el-button>
                        <span v-if="(form.project.product_ids || []).length" class="proj-picked">
                          已选 {{ form.project.product_ids.length }} 个产品
                        </span>
                      </div>
                      <el-table v-if="!f.hideTable" :data="projProductRows" size="small" border class="proj-table">
                        <el-table-column label="账户" min-width="220">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="产品" min-width="220">
                          <template #default="{ row }">
                            <el-tag
                              v-for="p in row.products"
                              :key="p"
                              closable
                              class="proj-tag"
                              @close="row.products = row.products.filter((x) => x !== p)"
                            >{{ p }}</el-tag>
                          </template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 选择事件资产 -->
                    <template v-else-if="f.kind === 'eventAssetPick'">
                      <el-button type="primary" size="small" class="proj-btn120" @click="pickEventAsset">选择事件资产</el-button>
                      <el-table v-if="!f.hideTable" :data="projEventRows" size="small" border class="proj-table">
                        <el-table-column label="账户" min-width="200">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="事件资产" min-width="240">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.asset }}</span><span class="proj-cell__id">{{ row.pkg }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default><el-button link type="primary" @click="pickEventAsset">选择</el-button></template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 选择分包和链接组 / 选择链接组 -->
                    <template v-else-if="f.kind === 'linkGroupPick'">
                      <el-button type="primary" size="small" class="proj-btn120" @click="openMonitorGroup('选择监测链接组')">
                        选择分包和链接组
                      </el-button>
                      <el-table v-if="!f.hideTable" :data="projLinkRows" size="small" border class="proj-table proj-table--3col">
                        <el-table-column label="账户" min-width="220">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="分包和链接组" min-width="260">
                          <template #default="{ row }">
                            <div v-if="row.group" class="proj-card">
                              <el-icon class="proj-card__x" @click="removeLinkGroup(row.accountId)"><Close /></el-icon>
                              <div class="proj-card__name">{{ row.group.url }}</div>
                              <div class="proj-card__name">{{ row.group.name }}</div>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default="{ row }"><el-button link type="primary" @click="openMonitorGroup('选择监测链接组', row.accountId)">添加</el-button></template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 选择应用分包 -->
                    <template v-else-if="f.kind === 'appPkgPick'">
                      <el-button type="primary" size="small" class="proj-btn120" @click="onPickStub('选择应用分包')">
                        选择应用分包
                      </el-button>
                    </template>

                    <!-- 选择关键词包 -->
                    <template v-else-if="f.kind === 'keywordPackPick'">
                      <el-button type="primary" size="small" class="proj-btn120" @click="onPickStub('选择关键词包')">
                        选择关键词包
                      </el-button>
                    </template>

                    <!-- 选择定向包（回显：账户名称 | 定向包卡片(名称+ID+×) | 添加） -->
                    <template v-else-if="f.kind === 'targetPick'">
                      <el-button type="primary" size="small" class="proj-btn120" @click="openTargetPackage()">选择定向包</el-button>
                      <el-table v-if="!f.hideTable" :data="projAudienceRows" size="small" border class="proj-table proj-table--3col">
                        <el-table-column label="账户名称" width="200">
                          <template #default="{ row }">
                            <div class="proj-cell"><span>{{ row.account }}</span><span class="proj-cell__id">{{ row.accountId }}</span></div>
                          </template>
                        </el-table-column>
                        <el-table-column label="定向包">
                          <template #default="{ row }">
                            <div v-if="row.pack" class="proj-card">
                              <el-icon class="proj-card__x" @click="removeTargetPackage(row.accountId)"><Close /></el-icon>
                              <div class="proj-card__name">{{ row.pack.name }}</div>
                              <div class="proj-card__name">{{ row.pack.id }}</div>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="90" align="center">
                          <template #default="{ row }"><el-button link type="primary" @click="openTargetPackage(row.accountId)">添加</el-button></template>
                        </el-table-column>
                      </el-table>
                    </template>

                    <!-- 投放时段 · 指定时间段 → 周时段网格
                         线上：表头 星期/时间 | 00:00-12:00 | 12:00-24:00，
                         每列 24px 一小时（12+12），7 行周一~周日，行标签列 70px，
                         格 24×24、边框 #ccc、表头底 #f8f9fa；
                         底部「可拖动鼠标选择时间段」+ 右侧「清空选择」 -->
                    <div v-else-if="f.kind === 'weekTimeGrid'" class="proj-week">
                      <table class="proj-week__table">
                        <colgroup>
                          <col style="width: 70px" />
                          <col v-for="h in 24" :key="'c' + h" style="width: 12px" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th class="proj-week__corner" rowspan="2">星期/时间</th>
                            <th class="proj-week__half" colspan="12">00:00 - 12:00</th>
                            <th class="proj-week__half" colspan="12">12:00 - 24:00</th>
                          </tr>
                          <tr>
                            <th
                              v-for="h in 24"
                              :key="'h' + h"
                              class="proj-week__hour"
                              style="width: 12px"
                            >{{ h - 1 }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="row in weekRows" :key="row.day">
                            <th class="proj-week__day">{{ row.day }}</th>
                            <td
                              v-for="h in 24"
                              :key="row.day + '-' + h"
                              class="proj-week__td"
                              style="width: 12px"
                              :class="{ 'selected': isWeekOn(row.day, h - 1) }"
                              @mousedown="onWeekDown(row.day, h - 1)"
                              @mouseenter="onWeekEnter(row.day, h - 1)"
                            ></td>
                          </tr>
                          <tr class="proj-week__trfoot">
                            <td colspan="25">
                              <div class="proj-week__foot">
                                <span class="proj-week__tip">已选择时间段</span>
                                <a class="proj-week__clear" @click="clearWeek">清空选择</a>
                              </div>
                            </td>
                          </tr>
                          <tr v-for="it in weekSummaryList" :key="'s' + it.day" class="proj-week__trsum">
                            <td colspan="25">
                              <span class="proj-week__sumlabel">{{ it.day }}：</span>
                              <span class="proj-week__sumval">{{ it.text }}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- 首选媒体（线上 .dv2 盒子：dv3 标题条 + 每行一个 checkbox） -->
                    <div v-else-if="f.kind === 'preferredMedia'" class="proj-dv2">
                      <div class="proj-dv3">首选媒体</div>
                      <div v-for="o in preferredMediaOptions" :key="o.value" class="proj-dv5">
                        <div class="proj-dv5__item" :class="{ 'is-selected': isMediaSelected(o.value) }">
                          <el-checkbox
                            :model-value="isMediaSelected(o.value)"
                            :indeterminate="o.value === 'ALL' && preferredMediaIndeterminate"
                            @update:model-value="(v) => onMediaCheck(o.value, v)"
                          />
                          <span class="proj-dv5__txt">{{ o.label }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 搜索快投豁免（线上：无 label 的独立行，勾选框 + 灰色说明） -->
                    <div v-else-if="f.kind === 'searchExempt'" class="proj-service">
                      <el-checkbox
                        :model-value="!!searchForm.service"
                        @update:model-value="(v) => (searchForm.service = v)"
                      >搜索快投豁免</el-checkbox>
                      <span class="proj-service__suffix">
                        （仅支持媒体平台申请了搜索快投豁免账户，否则“出价系数”和“定向拓展”媒体API将默认开启)
                      </span>
                    </div>

                    <!-- 出价（线上 .w160 输入框 + .suffix「元」，无快捷值） -->
                    <div v-else-if="f.kind === 'bidAmount'" class="proj-amount">
                      <el-input
                        :model-value="values[f.key]"
                        size="small"
                        class="proj-amount__input"
                        placeholder="请输入出价"
                        @update:model-value="(v) => setVal(f, v)"
                      />
                      <span class="proj-amount__unit">元</span>
                    </div>

                    <!-- 预算出价配置模式（线上 .budget-and-bid-wrapper > .mb16 > .mode-label + .ml32）
                         注意：label 由外层字段行渲染，这里不要再写一次（否则出现两个「预算出价配置模式」） -->
                    <div v-else-if="f.kind === 'budgetConfigMode'" class="proj-budmode">
                      <el-radio-group
                        :model-value="values[f.key]"
                        size="small"
                        class="proj-radio proj-budmode__group"
                        @update:model-value="(v) => setVal(f, v)"
                      >
                        <el-radio-button v-for="o in optionsOf(f)" :key="o.value" :value="o.value">
                          {{ o.label }}
                        </el-radio-button>
                      </el-radio-group>
                    </div>

                    <!-- 预算出价区（统一配置 / 分账户配置 / 分主体配置 三态）
                         统一配置：只有右侧内容；分账户、分主体：左侧账户/主体列表 + 右侧内容 -->
                    <div
                      v-else-if="f.kind === 'budgetPanel'"
                      class="proj-bpanel"
                      :class="{ 'proj-bpanel--split': budgetSplit }"
                    >
                      <!-- 左侧：账户 / 主体列表 -->
                      <div v-if="budgetSplit" class="proj-bpanel__aside">
                        <div
                          v-for="it in budgetSideItems"
                          :key="it.id"
                          class="proj-bpanel__item"
                          :class="{ 'is-active': it.id === budgetSideActive }"
                          @click="budgetSideActive = it.id"
                        >
                          <div class="proj-bpanel__item-main">
                            <div class="proj-bpanel__item-name" :title="it.name">{{ it.name }}</div>
                            <div class="proj-bpanel__item-sub">{{ it.sub }}</div>
                          </div>
                          <i v-if="it.id === budgetSideActive" class="proj-bpanel__check"></i>
                        </div>
                      </div>

                      <div class="proj-bpanel__main">
                        <div class="proj-bpanel__bar">
                          <el-button
                            v-if="budgetSplit"
                            link
                            type="primary"
                            size="small"
                            class="proj-bpanel__copy"
                            :disabled="!budgetSideCandidates.length"
                            @click="openBudgetCopy"
                          >{{ budgetCopyText }}</el-button>
                          <el-button link type="primary" size="small" @click="allFolded = !allFolded">
                            {{ allFolded ? '全部展开' : '全部收起' }}
                          </el-button>
                        </div>

                        <div v-show="!allFolded" class="proj-summary">
                          <span><i class="proj-summary__label">竞价策略：</i><b>{{ summary.bid_strategy }}</b></span>
                          <span><i class="proj-summary__label">优化目标：</i><b>{{ summary.optimize_goal }}</b></span>
                          <span><i class="proj-summary__label">深度优化方式：</i><b>{{ summary.deep_bid_type }}</b></span>
                          <span><i class="proj-summary__label">付费方式：</i><b>{{ summary.pay_mode }}</b></span>
                        </div>

                        <div v-show="!allFolded" class="proj-rule">
                          <div class="proj-rule__head">
                            <span class="proj-rule__title">预算出价规则1</span>
                            <el-button link type="primary" size="small" @click="projectRuleFolded = !projectRuleFolded">
                              {{ projectRuleFolded ? '展开' : '收起' }}
                            </el-button>
                          </div>
                          <div v-show="!projectRuleFolded" class="proj-rule__body">
                            <!-- 日预算（线上在规则卡内：输入框 + 元 + 快捷值） -->
                            <div v-if="budgetVisible" class="proj-rule__row">
                              <div class="proj-rule__label">日预算</div>
                              <div class="proj-rule__ctrl proj-budget">
                                <el-input
                                  :model-value="values.budget === 0 || values.budget === '' ? '' : values.budget"
                                  size="small"
                                  class="proj-budget__input"
                                  :class="{ 'is-error': budgetError }"
                                  placeholder="请输入预算金额"
                                  @update:model-value="(v) => setVal({ key: 'budget' }, v === '' ? '' : Number(v))"
                                />
                                <span class="proj-budget__unit">元</span>
                                <a
                                  v-for="(q, i) in budgetQuicks"
                                  :key="q"
                                  class="proj-budget__quick"
                                  @click="setVal({ key: 'budget' }, q)"
                                >{{ i === 0 ? '' : '| ' }}{{ q }}</a>
                                <span v-if="budgetError" class="proj-budget__err">请填写预算金额</span>
                              </div>
                            </div>

                            <!-- 出价方式（截图：三选一分段按钮 + ⓘ 气泡） -->
                            <div class="proj-rule__row">
                              <div class="proj-rule__label">
                                出价方式
                                <el-popover placement="top" :width="300" trigger="hover" :teleported="false">
                                  <template #default>
                                    <span class="proj-bubble__content">阶梯出价是指根据您的出价范围，在生成的项目中做等差分配出价，随机出价是指会在出价范围内随机分配出价</span>
                                  </template>
                                  <template #reference>
                                    <i class="proj-field__qicon"></i>
                                  </template>
                                </el-popover>
                              </div>
                              <div class="proj-rule__ctrl">
                                <el-radio-group
                                  :model-value="values.bid_method || 'FIXED'"
                                  size="small"
                                  class="proj-radio"
                                  @update:model-value="(v) => (values.bid_method = v)"
                                >
                                  <el-radio-button value="FIXED">固定出价</el-radio-button>
                                  <el-radio-button value="LADDER">阶梯出价</el-radio-button>
                                  <el-radio-button value="RANDOM">随机出价</el-radio-button>
                                </el-radio-group>
                              </div>
                            </div>

                            <!-- 跨账户递增（仅阶梯出价出现；截图：不开启 / 开启） -->
                            <div v-if="values.bid_method === 'LADDER'" class="proj-rule__row">
                              <div class="proj-rule__label">跨账户递增</div>
                              <div class="proj-rule__ctrl">
                                <el-radio-group
                                  :model-value="values.cross_step || 'OFF'"
                                  size="small"
                                  class="proj-radio"
                                  @update:model-value="(v) => (values.cross_step = v)"
                                >
                                  <el-radio-button value="OFF">不开启</el-radio-button>
                                  <el-radio-button value="ON">开启</el-radio-button>
                                </el-radio-group>
                              </div>
                            </div>

                            <!-- 出价（仅固定出价；截图：单输入框 + 元 + 红字「请输入出价」） -->
                            <div v-if="(values.bid_method || 'FIXED') === 'FIXED'" class="proj-rule__row">
                              <div class="proj-rule__label">出价</div>
                              <div class="proj-rule__ctrl proj-budget">
                                <el-input
                                  :model-value="values.bid === '' || values.bid === undefined ? '' : values.bid"
                                  size="small"
                                  class="proj-budget__input proj-budget__input--bid"
                                  :class="{ 'is-error': !values.bid }"
                                  placeholder="请输入出价"
                                  @update:model-value="(v) => (values.bid = v === '' ? '' : Number(v))"
                                />
                                <span class="proj-budget__unit">元</span>
                                <span v-if="!values.bid" class="proj-budget__err">请输入出价</span>
                              </div>
                            </div>

                            <!-- 出价范围（阶梯出价 / 随机出价出现；截图：最低出价 - 最高出价 元，各自下方红字） -->
                            <div v-if="(values.bid_method || 'FIXED') !== 'FIXED'" class="proj-rule__row">
                              <div class="proj-rule__label">
                                出价范围
                                <el-popover placement="top" :width="280" trigger="hover" :teleported="false">
                                  <template #default>
                                    <span class="proj-bubble__content">输入出价范围，系统将随机为您的项目匹配范围中的出价</span>
                                  </template>
                                  <template #reference>
                                    <i class="proj-field__qicon"></i>
                                  </template>
                                </el-popover>
                              </div>
                              <div class="proj-rule__ctrl proj-budget proj-range">
                                <div class="proj-range__cell">
                                  <el-input
                                    :model-value="values.bid_min === undefined ? '' : values.bid_min"
                                    size="small"
                                    class="proj-range__input"
                                    :class="{ 'is-error': !values.bid_min }"
                                    placeholder="最低出价"
                                    @update:model-value="(v) => (values.bid_min = v === '' ? '' : Number(v))"
                                  />
                                  <span v-if="!values.bid_min" class="proj-budget__err">请输入最低出价</span>
                                </div>
                                <span class="proj-range__dash">-</span>
                                <div class="proj-range__cell">
                                  <el-input
                                    :model-value="values.bid_max === undefined ? '' : values.bid_max"
                                    size="small"
                                    class="proj-range__input"
                                    :class="{ 'is-error': !values.bid_max }"
                                    placeholder="最高出价"
                                    @update:model-value="(v) => (values.bid_max = v === '' ? '' : Number(v))"
                                  />
                                  <span v-if="!values.bid_max" class="proj-budget__err">请输入最高出价</span>
                                </div>
                                <span class="proj-budget__unit proj-range__unit">元</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 搜索快投 · 关键词（线上：灰底框内文本 + 右端「编辑 / 清空」） -->
                    <div v-else-if="f.kind === 'keywordOps'" class="proj-kwbox">
                      <span class="proj-kwbox__txt">{{ searchForm.keyword || '未添加关键词' }}</span>
                      <span class="proj-kwbox__act" @click="onKeywordEdit">编辑</span>
                      <span class="proj-kwbox__act" @click="clearKeyword">清空</span>
                    </div>

                    <!-- 搜索快投 · 出价系数（启用后出现的输入框） -->
                    <div v-else-if="f.kind === 'coefInput'" class="proj-inline">
                      <el-input
                        v-model="searchForm.bid_coef_value"
                        size="small"
                        class="proj-coef__input"
                        placeholder="请输入出价系数"
                      />
                    </div>

                    <!-- 竞价策略 / 优化目标 / 深度优化方式 / 付费方式 汇总 -->
                    <template v-else-if="f.kind === 'bidSummary'">
                      <div class="proj-summary__bar">
                        <el-button link type="primary" size="small" @click="allFolded = !allFolded">
                          {{ allFolded ? '全部展开' : '全部收起' }}
                        </el-button>
                      </div>
                      <div class="proj-summary">
                        <span><i class="proj-summary__label">竞价策略：</i><b>{{ summary.bid_strategy }}</b></span>
                        <span><i class="proj-summary__label">优化目标：</i><b>{{ summary.optimize_goal }}</b></span>
                        <span><i class="proj-summary__label">深度优化方式：</i><b>{{ summary.deep_bid_type }}</b></span>
                        <span><i class="proj-summary__label">付费方式：</i><b>{{ summary.pay_mode }}</b></span>
                      </div>
                    </template>

                    <!-- 预算出价规则1 -->
                    <template v-else-if="f.kind === 'budgetRule'">
                      <div class="proj-rule__head">
                        <span class="proj-rule__title">预算出价规则1</span>
                        <div class="proj-rule__btns">
                          <el-button link type="primary" size="small" @click="projectRuleFolded = !projectRuleFolded">
                            {{ projectRuleFolded ? '展开' : '收起' }}
                          </el-button>
                        </div>
                      </div>
                      <div v-show="!projectRuleFolded" class="proj-rule__body">
                        <template v-for="rf in ruleFields" :key="rf.key">
                          <div v-if="isVisible(rf, values)" class="proj-rule__row">
                            <div class="proj-rule__label">{{ labelOf(rf) }}</div>
                            <div class="proj-rule__ctrl">
                              <el-input-number
                                v-if="rf.type === 'number'"
                                :model-value="values[rf.key]"
                                :min="budgetMin"
                                :step="50"
                                controls-position="right"
                                size="small"
                                @update:model-value="(v) => setVal(rf, v)"
                              />
                              <el-radio-group
                                v-else-if="rf.type === 'radio'"
                                :model-value="values[rf.key]"
                                size="small"
                                class="proj-radio"
                                @update:model-value="(v) => setVal(rf, v)"
                              >
                                <el-radio-button v-for="o in optionsOf(rf)" :key="o.value" :value="o.value">
                                  {{ o.label }}
                                </el-radio-button>
                              </el-radio-group>
                              <div v-if="rf.key === 'bid_method'" class="proj-tip proj-tip--warn">
                                阶梯出价是指根据您的出价范围，在生成的项目中做等差分配出价；随机出价是指会在出价范围内随机分配出价
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                    </template>
                  </template>

                  <!-- ── 字段右侧链接（如「加白指引」） ── -->
                  <a
                    v-if="f.link"
                    class="proj-link"
                    :href="f.link.href || 'javascript:void(0)'"
                    :target="f.link.href ? '_blank' : undefined"
                    rel="noopener noreferrer"
                    @click="!f.link.href && onLink(f)"
                  >
                    <el-icon v-if="f.link.icon" class="proj-link__icon"><Link /></el-icon>
                    {{ f.link.text }}
                  </a>

                  <!-- ── 提示文案 ──
                       线上有两种：
                       ① block 变体 .interest-action-info（12px #999 / line-height 32px + ⚠ 12×12 图标）
                       ② inline 变体（inline / margin-left 16px / ⚠ 14×14 图标 / 12px #999 或橙色 #f7aa47） -->
                  <div
                    v-if="fieldTip(f)"
                    class="proj-tip"
                    :class="{
                      'proj-tip--warn': f.tipType === 'warn',
                      'proj-tip--inline': f.tipStyle === 'inline',
                    }"
                  >
                    <i
                      v-if="f.tipStyle === 'inline'"
                      class="proj-tip__warn"
                    ></i>
                    <i
                      v-else-if="f.tipStyle === 'block'"
                      class="proj-tip__warn proj-tip__warn--sm"
                    ></i>
                    {{ fieldTip(f) }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </BatchDrawer>

    <!-- 复制预算与出价到其他账户 / 其他主体（线上一套壳，标题与列名随模式切换）
         注：放在 BatchDrawer 外层——该组件只渲染具名插槽 content/footer，放进插槽里
         会和表单模板层级冲突，放外面则可正常挂载（dialog 自身 append-to-body） -->
    <el-dialog
      v-model="budgetCopyVisible"
      :title="budgetCopyTitle"
      width="400px"
      class="proj-copy-dialog"
      align-center
      :close-on-click-modal="false"
      append-to-body
    >
      <p class="proj-copy__tip">{{ budgetCopyTip }}</p>

      <div class="proj-copy__filter">
        <el-select v-model="budgetCopyType" size="small" class="proj-copy__type">
          <el-option :label="budgetIsSubject ? '主体名称' : '账户名称'" value="name" />
          <el-option :label="budgetIsSubject ? '主体ID' : '账户ID'" value="id" />
        </el-select>
        <el-input
          v-model="budgetCopyKw"
          size="small"
          class="proj-copy__kw"
          placeholder="请输入关键词"
          clearable
        />
        <button type="button" class="proj-copy__search" title="搜索">
          <el-icon><Search /></el-icon>
        </button>
      </div>

      <el-table
        :data="budgetCopyRows"
        height="130"
        class="proj-copy__table"
        @selection-change="(rows) => (budgetCopyChecked = rows)"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column :label="budgetIsSubject ? '主体名称' : '账户名称'" prop="name" show-overflow-tooltip />
        <el-table-column :label="budgetIsSubject ? '主体ID' : '账户ID'" prop="id" width="150" />
      </el-table>

      <template #footer>
        <el-button @click="budgetCopyVisible = false">取消</el-button>
        <el-button type="primary" @click="onBudgetCopyConfirm">确定</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
/* 「批量新建」页 · 新建项目抽屉（对齐线上 cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch）
 *
 * 渲染完全由 spec/project.spec.js 驱动：分区 / 字段 / 选项 / 依赖（visibleWhen / disabledWhen /
 * optionBubble / optionDisabled / optionsWhen / labelWhen）全部声明在 spec 里，组件只做通用渲染。
 */
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, Expand, Fold, Link, Plus, Search } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';
import spec from './spec/project.spec.js';
import { isVisible, isSectionVisible, isDisabled, bubbleText, optionBubbleText } from './spec/resolve.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  focus: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

/* R110：全部业务状态来自 Create.vue 通过 provide('batch') 暴露的 setup 作用域 */
const batch = inject('batch');
const {
  form, adEstimate, searchForm, projectRuleFolded, budgetMin,
  relatedVisible, targetingVisible, wildcardMoreVisible,
  projProductRows, projLinkRows, projAudienceRows, projEventRows,
  onObjectiveChange, onAppPromoChange, onAdTypeChange, onMarketingGoalChange,
  onAssetGroupChange, onBudgetModeChange, onActionChange,
  pickAssetGroup, pickEventAsset, openMonitorGroup, removeLinkGroup, openTargetPackage, removeTargetPackage, appendWildcard,
  openKeywordEditor, clearKeyword,
  onProjectConfirm, onProjectCancel,
} = batch;

/* 线上：右上角「预估广告数」浮层可折叠；「全部收起」控制规则区展开 */
const estFolded = ref(false);
const allFolded = ref(false);

/* ───────────────────────── spec → 本地模型 的映射 ───────────────────────── */
/* spec 里没写 model 的字段，key 即 form.project 的字段名；写了的按 model 路径走。 */
const MODEL = {};
const EXTRA = reactive({
  dynamic_index: '',
  search_blue_ocean: 'OFF',
  search_keyword_switch: 'ON',
  search_keyword_match_mode: 'ALL_SAME',
  search_smart_expand: 'OFF',
});

function resolveModel(path) {
  if (!path) return null;
  if (path.indexOf('searchForm.') === 0) return { obj: searchForm, key: path.slice('searchForm.'.length) };
  if (path.indexOf('form.project.') === 0) return { obj: form.project, key: path.slice('form.project.'.length) };
  if (path.indexOf('form.') === 0) return { obj: form, key: path.slice('form.'.length) };
  if (path in form.project) return { obj: form.project, key: path };
  return { obj: EXTRA, key: path };
}

/* spec 字段展平：含 type='group' 的子字段（线上 .convert-content 内的嵌套 el-form-item） */
function flatFields() {
  const out = [];
  spec.sections.forEach((s) =>
    (s.fields || []).forEach((f) => {
      out.push(f);
      if (f.type === 'group') (f.fields || []).forEach((cf) => out.push(cf));
    })
  );
  return out;
}

spec.sections.forEach((s) =>
  (s.fields || []).forEach((f) => {
    MODEL[f.key] = resolveModel(f.model || f.key);
    (f.extras || []).forEach((x) => {
      MODEL[x.key] = resolveModel(x.model || x.key);
    });
  })
);
/* 组块子字段也要能读写本地表单 */
flatFields().forEach((f) => {
  if (f.type === 'group') return;
  MODEL[f.key] = resolveModel(f.model || f.key);
  (f.extras || []).forEach((x) => {
    MODEL[x.key] = resolveModel(x.model || x.key);
  });
});

/* ───────────────────────── 值容器 ───────────────────────── */
/* 派生值 searchFast（线上依赖实测 2026-11-26）：
   「搜索快投」分区在 **广告类型≠搜索广告 且 投放模式=手动投放** 时出现；
   切到「自动投放(UBMax)」→ 该分区消失，「使用运营商定向」「出价方式」「出价」出现。
   切到「广告类型=搜索广告」→ 出现的是另一个「搜索流量」分区。 */
const rawValues = {};
Object.defineProperty(rawValues, 'searchFast', {
  get() {
    return rawValues.ad_type !== 'SEARCH' && rawValues.delivery_mode === 'MANUAL';
  },
  enumerable: true,
  configurable: true,
});
const values = reactive(rawValues);
let syncing = false;

/* 线上默认态（2026-11-26 实测 _probe_budget.py「默认选中值」表）。
   注意：这里的值用 **本 spec 自己的 value 命名**，不是线上的原始 value。
   线上原始 value 对照：
     投放模式 PROCEDURAL=自动投放(UBMax) → 本地 UBMAX
     产品版本 COMMON_PRODUCT=通用版       → 本地 GENERAL
     产品来源 EXIST=选择已有               → 本地 EXISTING
     应用来源 EXIST=已有应用 / INTERNAL=内广应用 → 本地 SINGLE / INTERNAL
     数据跟踪方式 SUB_PACKAGE_AND_MONITOR_LINK   → 本地 SUB_AND_MONITOR
     事件回传方式 APPLICATION_API=应用API回传    → 本地 API
     投放时间 SCHEDULE_FROM_NOW=从今天到长期投放 → 本地 LONG_TERM
     定向包来源 LOCAL=智投定向包             → 本地 CL
     优先应用商店下载 APP_STORE_DELIVERY=启用  → 本地 ON
     匹配方式 SAME=统一/所有项目选择同一组   → 本地 ALL_SAME / UNIFIED
     数据对接方式 ASSET=事件管理            → 本地 EVENT
     预算出价配置模式 SAME=统一配置         → 本地 UNIFIED
     出价方式 fixed=固定出价                → 本地 FIXED
     使用运营商定向 0=不使用                → 本地 OFF  */
const ONLINE_DEFAULTS = {
  asset_group: 'OFF',
  ad_type: 'ALL',
  delivery_type: 'NORMAL',
  delivery_mode: 'UBMAX',          // 线上默认 = 自动投放(UBMax)
  marketing_goal: 'VIDEO_AND_IMAGE',
  inner_ad: 'OFF',
  app_promotion_type: 'LAUNCH',
  related_product: 'ON',
  product_version: 'GENERAL',      // 线上 = 通用版
  product_source: 'EXISTING',
  product_workbench_version: 'NEW',
  product_match_mode: 'ALL_SAME',
  aigc_creative: 'OFF',
  star_task: 'OFF',
  platform_type: 'APP_ANDROID',
  app_source: 'INTERNAL',          // 线上默认 = 内广应用
  event_asset_match_mode: 'PER_ACCOUNT',
  track_way: 'SUB_AND_MONITOR',
  track_link_source: 'EXIST',
  link_group_match_mode: 'PER_ACCOUNT',
  download_type: 'DOWNLOAD_URL',
  app_store_first: 'ON',           // 线上默认 = 启用
  data_dock_type: 'EVENT',
  event_callback_type: 'API',
  inventory_catalog: 'UNIVERSAL_SMART',
  target_package_source: 'CL',
  target_match_mode: 'ALL_SAME',
  carrier_targeting: 'OFF',
  schedule_config_mode: 'UNIFIED',
  schedule_time: 'LONG_TERM',
  schedule_period: 'ALL',
  budget_mode: 'DAY',
  pay_method: 'PRICING_OCPM',
  bid_method: 'FIXED',
  cross_step: 'OFF',               // 跨账户递增（阶梯出价时出现）
  bid_min: '',                     // 出价范围-最低（阶梯/随机出价时出现）
  bid_max: '',                     // 出价范围-最高
  operation: 'ENABLE',
  project_name_mode: 'UNIFIED',
  budget_config_mode: 'UNIFIED',
};

const DEFAULTS = {};
flatFields().forEach((f) => {
  if (f.default !== undefined) DEFAULTS[f.key] = f.default;
});

const visibleSections = computed(() => spec.sections.filter((s) => isSectionVisible(s, values)));

/* 线上实测：普通字段行 margin-bottom = 24px，
   分区**最后一个**可见字段 = 16px（表格行也是 16px）。
   spec 可用 f.mb 显式覆盖。 */
function fieldMargin(sec, f) {
  if (f.mb !== undefined) return f.mb;
  const vis = (sec.fields || []).filter(
    (x) => isVisible(x, values) && !x.inRule && !(x.type === 'group')
  );
  const idx = vis.findIndex((x) => x.key === f.key);
  if (idx >= 0 && idx === vis.length - 1) return 16;
  return 24;
}

/* 条件求值（与 spec/resolve.js 同语义；用于 optionsWhen / optionDisabled / labelWhen） */
function matchCond(c) {
  if (!c || !c.field) return true;
  const actual = values[c.field];
  if ('eq' in c) return actual === c.eq;
  if ('neq' in c) return actual !== c.eq;
  if ('in' in c) return Array.isArray(c.in) && c.in.indexOf(actual) >= 0;
  if ('notIn' in c) return Array.isArray(c.notIn) && c.notIn.indexOf(actual) < 0;
  if ('truthy' in c) return !!actual === !!c.truthy;
  return true;
}

function labelOf(f) {
  if (!f || !f.label) return '';
  if (f.labelWhen) {
    const dep = f.labelWhenField || Object.keys(f.labelWhen)[0];
    const hit = f.labelWhen[values[dep]];
    if (hit) return hit;
  }
  return f.label;
}

function optionsOf(f) {
  if (!f) return [];
  if (Array.isArray(f.optionsWhen)) {
    for (const o of f.optionsWhen) {
      if (!o.when || matchCond(o.when)) return o.options || [];
    }
    return [];
  }
  if (f.optionsWhen && f.optionsWhenField) {
    const alt = f.optionsWhen[values[f.optionsWhenField]];
    if (alt) return alt;
  }
  return f.options || [];
}

function isOptDisabled(f, value) {
  if (!f.optionDisabled) return false;
  const hit = f.optionDisabled.find((d) => d.value === value);
  if (!hit) return false;
  if (!hit.when) return true;
  return matchCond(hit.when);
}

function optBubble(f, o) {
  return optionBubbleText(f, values, o.value);
}

function fieldTip(f) {
  if (f.tipsByOption) {
    return f.tipsByOption[values[f.key]] || '';
  }
  /* 行内提示与 ⓘ 气泡线上是并存的，各自独立 */
  return f.tip || '';
}

/* label 右侧 ⓘ 气泡（线上 .mg-icon-question2 + el-popover） */
function bubbleOf(f) {
  return bubbleText(f, values) || '';
}
/* 结构化气泡的标题 / 正文（线上 .intro-title + .intro-content） */
function bubbleTitle(f) {
  const b = f.bubble;
  return b && b.title ? b.title : '';
}
function bubbleContent(f) {
  const b = f.bubble;
  if (!b) return '';
  return b.text || '';
}

/* ───────────────────────── 读写 ───────────────────────── */
function setVal(f, v) {
  values[f.key] = v;
}
function setExtra(x, v) {
  values[x.key] = v;
}
function onRadioChange(f, v) {
  values[f.key] = v;
  switch (f.key) {
    case 'objective': onObjectiveChange(v); break;
    case 'app_promotion_type': onAppPromoChange(); break;
    case 'ad_type':
      onAdTypeChange();
      /* 线上实测：搜索广告时投放类型=极速智投、项目预算=不限 */
      values.delivery_type = v === 'SEARCH' ? 'RAPID' : 'NORMAL';
      values.budget_mode = v === 'SEARCH' ? 'OFF' : 'DAY';
      break;
    case 'marketing_goal': onMarketingGoalChange(); break;
    case 'asset_group': onAssetGroupChange(v); break;
    case 'budget_mode': onBudgetModeChange(v); break;
    case 'external_action': onActionChange(); break;
    default: break;
  }
}
function onRefresh(f) {
  ElMessage.success('已刷新（原型模拟）');
}
function onLink(f) {
  ElMessage.info('原型：' + f.link.text);
}
function onKeywordEdit() {
  openKeywordEditor();
}
function onPickStub(label) {
  ElMessage.info('原型：打开' + label + '弹窗');
}

/* ───────────────────────── 与 Create.vue 的 form.project 双向同步 ───────────────────────── */
function seedValues() {
  syncing = true;
  flatFields().forEach((f) => {
    if (f.type === 'group') return;
    const m = MODEL[f.key];
    let v = m ? m.obj[m.key] : undefined;
    if (v === undefined || v === null) v = DEFAULTS[f.key];
    values[f.key] = v;
    (f.extras || []).forEach((x) => {
      const xm = MODEL[x.key];
      values[x.key] = xm ? xm.obj[xm.key] : undefined;
    });
  });
  syncing = false;
}

function syncToForm() {
  if (syncing) return;
  syncing = true;
  flatFields().forEach((f) => {
    if (f.type === 'group') return;
    const m = MODEL[f.key];
    if (m && values[f.key] !== undefined) m.obj[m.key] = values[f.key];
    (f.extras || []).forEach((x) => {
      const xm = MODEL[x.key];
      if (xm && values[x.key] !== undefined) xm.obj[xm.key] = values[x.key];
    });
  });
  syncing = false;
}

watch(values, syncToForm, { deep: true });

/* 首次打开：按线上默认态对齐（只做一次，之后尊重用户选择） */
const onlineDefaultApplied = ref(false);
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    seedValues();
    if (!onlineDefaultApplied.value) {
      onlineDefaultApplied.value = true;
      Object.keys(ONLINE_DEFAULTS).forEach((k) => {
        if (values[k] !== undefined) values[k] = ONLINE_DEFAULTS[k];
      });
      syncToForm();
    }
  },
  { immediate: true }
);

/* ── 8 个配置项按钮的分区定位 ──
   线上实测：点「分包与监测活动 / 定向包 / 项目预算与出价」等按钮会打开本抽屉
   并**滚动到对应分区**（不是新开面板）。
   线上 scrollTop 实测：分包与监测活动 816 / 项目预算与出价 3732 */
const FOCUS_SECTION = {
  related_product: '关联产品投放', // 关联产品
  goal: '投放内容与目标',           // 分包与监测活动
  targeting: '用户定向',            // 定向包
  project_budget: '项目排期与预算',  // 项目预算与出价
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
      /* 让目标分区标题距内容区顶部约 0px（线上实测 首屏分区 top≈0~52） */
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

/* Create.vue 侧的处理器会改写 form.project，把外部改动同步回 values */
watch(
  () => [
    form.project.objective,
    form.project.ad_type,
    form.project.app_promotion_type,
    form.project.related_product,
    form.project.asset_group,
    form.project.delivery_type,
    form.project.delivery_mode,
    form.project.inventory_catalog,
    form.project.track_link_source,
    form.project.platform_type,
  ],
  () => {
    if (syncing) return;
    syncing = true;
    Object.keys(MODEL).forEach((k) => {
      const m = MODEL[k];
      const v = m ? m.obj[m.key] : undefined;
      if (v !== undefined && values[k] !== v) values[k] = v;
    });
    syncing = false;
  }
);

const estimate = computed(() => (adEstimate && adEstimate.value) || { accounts: 0, projects: 0 });

/* 「预算出价规则1」内部的字段（spec 里 inRule=true） */
/* 「预算出价规则1」内部的字段（spec 里 inRule=true）。日预算由 budget_panel 单独渲染，这里排除 */
const ruleFields = computed(() => flatFields().filter((f) => f.inRule && f.key !== 'budget'));

/* ───────────────── 预算出价区：统一 / 分账户 / 分主体 ───────────────── */
/* 账户与主体用模拟数据（名称、ID 对齐线上截图口径）
   主体左栏只有当前 1 个（对齐图3），弹窗里给 2 个「其他主体」候选（需求 6） */
const BUDGET_ACCOUNTS = [
  { id: '187375636298507', name: '央广-雷盟-知乎-APP内付费-143', sub: '187375636298507' },
  { id: '187375866298507', name: '央广-雷盟-知乎-APP内付费-145', sub: '187375866298507' },
  { id: '1873502811396124', name: '央广-雷盟-知乎-APP内付费-147', sub: '1873502811396124' },
];
const BUDGET_SUBJECTS = [
  { id: '1732019288', name: '北京雷盟盛通文化发展有限公司', sub: '3 个账户' },
];
/* 复制到其他主体：可覆盖的其他主体（模拟 2 条） */
const BUDGET_SUBJECT_OTHERS = [
  { id: '1754829011', name: '北京央广时代文化传播有限公司', sub: '3 个账户' },
  { id: '1728394015', name: '北京雷盟盛通文化传播有限公司', sub: '3 个账户' },
];

const budgetMode = computed(() => values.budget_config_mode || 'UNIFIED');
const budgetIsSubject = computed(() => budgetMode.value === 'PER_SUBJECT');
/** 分账户 / 分主体时左侧出现列表 */
const budgetSplit = computed(() => budgetMode.value === 'PER_ACCOUNT' || budgetMode.value === 'PER_SUBJECT');
const budgetSideItems = computed(() => (budgetIsSubject.value ? BUDGET_SUBJECTS : BUDGET_ACCOUNTS));
const budgetSideActive = ref(BUDGET_ACCOUNTS[0].id);
/** 「复制到其他账户 / 复制到其他主体」的可覆盖对象（排除当前选中项的全部账户 / 2 个其他主体） */
const budgetSideCandidates = computed(() => (
  budgetIsSubject.value
    ? BUDGET_SUBJECT_OTHERS
    : BUDGET_ACCOUNTS.filter((it) => it.id !== budgetSideActive.value)
));
const budgetCopyText = computed(() => (budgetIsSubject.value ? '复制到其他主体' : '复制到其他账户'));
const budgetCurrentItem = computed(() => (
  (budgetIsSubject.value ? BUDGET_SUBJECTS : BUDGET_ACCOUNTS)
    .find((it) => it.id === budgetSideActive.value) || BUDGET_ACCOUNTS[0]
));

/* 日预算：与 spec 的 visibleWhenAll 保持一致（日预算 + 非搜索广告） */
const budgetVisible = computed(() => values.budget_mode === 'DAY' && values.ad_type !== 'SEARCH');
const budgetQuicks = [300, 500, 1000, 2000];
const budgetError = computed(() => !values.budget);

/* 复制弹窗（账户 / 主体共用一套壳） */
const budgetCopyVisible = ref(false);
const budgetCopyType = ref('name');
const budgetCopyKw = ref('');
const budgetCopyChecked = ref([]);
function openBudgetCopy() {
  /* 没有可覆盖的其他账户 / 主体时，链接置灰不可点 */
  if (!budgetSideCandidates.value.length) return;
  budgetCopyType.value = 'name';
  budgetCopyKw.value = '';
  budgetCopyChecked.value = [];
  budgetCopyVisible.value = true;
}
const budgetCopyRows = computed(() => {
  const kw = budgetCopyKw.value.trim().toLowerCase();
  return budgetSideCandidates.value.filter((it) => {
    if (!kw) return true;
    const target = budgetCopyType.value === 'id' ? it.id : it.name;
    return String(target).toLowerCase().includes(kw);
  });
});
const budgetCopyTitle = computed(() => (budgetIsSubject.value ? '复用到其他主体' : '复用到其他账户'));
const budgetCopyTip = computed(() => {
  if (budgetIsSubject.value) {
    return `此操作会将把当前主体${budgetCurrentItem.value.name || ''}的预算与出价覆盖指定主体。`;
  }
  return `此操作会将把当前账户${budgetCurrentItem.value.name || ''}-在投的预算与出价覆盖指定账户。`;
});
function onBudgetCopyConfirm() {
  if (!budgetCopyChecked.value.length) {
    ElMessage.warning(`请选择要覆盖的${budgetIsSubject.value ? '主体' : '账户'}`);
    return;
  }
  ElMessage.success(`已将预算与出价复制到 ${budgetCopyChecked.value.length} 个${budgetIsSubject.value ? '主体' : '账户'}`);
  budgetCopyVisible.value = false;
}

/* ── 首选媒体（线上 .dv2 盒子） ──
 * 线上是 7 行 checkbox：「全选」是半选（indeterminate），其余 6 个媒体各一行。
 * 勾选状态存在 values.preferred_media（数组），「全选」行只是聚合视图。 */
const PREFERRED_MEDIA = [
  { value: 'ALL', label: '全选' },
  { value: 'TODAY', label: '今日头条' },
  { value: 'XIGUA', label: '西瓜视频' },
  { value: 'DOUYIN', label: '抖音' },
  { value: 'FANQIE', label: '番茄小说' },
  { value: 'CSJ', label: '穿山甲' },
  { value: 'OHAYOO', label: 'ohayoo精品游戏' },
];
const preferredMediaOptions = PREFERRED_MEDIA;
const MEDIA_KEYS = PREFERRED_MEDIA.filter((o) => o.value !== 'ALL').map((o) => o.value);

/* ── 投放时段 · 周时段网格（线上 .week-td 表格） ──
   线上实测：table 647×318 / 日期列 70px / 小时列 12px×24 / 行高 30px
   选中格 class=selected，底色 #197afb，边框仍 1px #ccc
   鼠标可按下拖拽连续选择（可跨行），松手结束 */
const WEEK_DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const weekRows = WEEK_DAYS.map((day) => ({ day }));
/* 已选时段：{ '星期一': [0,1,2], ... }（存小时序号 0..23） */
const weekSlots = reactive({});
/* 拖拽状态：按下时的目标值 + 起点 */
let weekDrag = null;

function isWeekOn(day, hour) {
  const arr = weekSlots[day];
  return Array.isArray(arr) && arr.indexOf(hour) >= 0;
}
/* 按下：记录这次拖拽是「选中」还是「取消」，并立即切换该格 */
function onWeekDown(day, hour) {
  const on = isWeekOn(day, hour);
  weekDrag = { on: !on };
  applyWeek(day, hour, !on);
}
/* 拖过：同一次拖拽内所有经过的格都跟随按下时的目标值 */
function onWeekEnter(day, hour) {
  if (!weekDrag) return;
  applyWeek(day, hour, weekDrag.on);
}
function applyWeek(day, hour, on) {
  const arr = Array.isArray(weekSlots[day]) ? weekSlots[day].slice() : [];
  const i = arr.indexOf(hour);
  if (on && i < 0) arr.push(hour);
  if (!on && i >= 0) arr.splice(i, 1);
  arr.sort((a, b) => a - b);
  weekSlots[day] = arr;
}
function clearWeek() {
  Object.keys(weekSlots).forEach((k) => delete weekSlots[k]);
}
/* 底部「已选择时间段」列表：星期一：01:00~09:30
   线上示例：星期一: 01:00~09:30 —— 半小时粒度，结束时间为最后一个选中格的结束 */
function weekSummary() {
  return WEEK_DAYS.map((day) => {
    const arr = (weekSlots[day] || []).slice().sort((a, b) => a - b);
    if (!arr.length) return null;
    /* 连续段 → "HH:MM~HH:MM"，多段用 "、" 连接 */
    const segs = [];
    let s = arr[0];
    let prev = arr[0];
    for (let i = 1; i <= arr.length; i++) {
      const cur = arr[i];
      if (cur !== prev + 1) {
        segs.push([s, prev + 1]);
        s = cur;
      }
      prev = cur;
    }
    const fmt = (h) => String(h).padStart(2, '0') + ':00';
    const text = segs
      .map(([a, b]) => fmt(a) + '~' + fmt(b))
      .join('、');
    return { day: day, text: text };
  }).filter(Boolean);
}
const weekSummaryList = computed(weekSummary);

/* 松开鼠标结束拖拽 */
function endWeekDrag() {
  weekDrag = null;
}
onMounted(() => window.addEventListener('mouseup', endWeekDrag));
onBeforeUnmount(() => window.removeEventListener('mouseup', endWeekDrag));

function mediaSelectedList() {
  const v = values.preferred_media;
  return Array.isArray(v) ? v : [];
}
function isMediaSelected(key) {
  if (key === 'ALL') return mediaSelectedList().length === MEDIA_KEYS.length;
  return mediaSelectedList().indexOf(key) >= 0;
}
/* 线上「全选」在部分选中时是半选态（is-indeterminate） */
const preferredMediaIndeterminate = computed(() => {
  const n = mediaSelectedList().length;
  return n > 0 && n < MEDIA_KEYS.length;
});
function onMediaCheck(key, checked) {
  const cur = mediaSelectedList();
  if (key === 'ALL') {
    values.preferred_media = checked ? MEDIA_KEYS.slice() : [];
    return;
  }
  const next = checked ? cur.concat([key]) : cur.filter((x) => x !== key);
  values.preferred_media = MEDIA_KEYS.filter((k) => next.indexOf(k) >= 0);
}

const summary = computed(() => ({
  bid_strategy: labelOfOption('bid_strategy', '稳定成本（常规版）'),
  optimize_goal: `${labelOfOption('external_action', 'app内付费')}/${labelOfOption('deep_external_action', '无')}`,
  deep_bid_type: labelOfOption('deep_bid_type', '无'),
  pay_mode: labelOfOption('pay_method', '目标转化出价-按展示付费'),
}));

/* 线上 label 宽度按分区不同：
 *   资产组 120 / 推广目的·关联产品投放·AIGC·投放版位·用户定向·排期预算·搜索快投·项目名称 144
 *   投放内容与目标 150
 * 字段自身的 labelWidth 优先。 */
function labelWidthClass(sec, f) {
  const w = f.labelWidth || sec.labelWidth || 144;
  return 'proj-field--w' + w;
}

function labelOfOption(key, fallback) {
  const f = flatFields().find((x) => x.key === key);
  if (!f) return fallback;
  const hit = optionsOf(f).find((o) => o.value === values[key]);
  return hit ? hit.label : fallback;
}
</script>

<style>
/* ───────────────────────────────────────────────────────────────
   线上 cl-drawer 外壳微调（BatchDrawer.vue 已提供基础版式）
   线上实测：.drawer-content 底色 #f0f2f5；分区块为白底 .module-container
   ─────────────────────────────────────────────────────────────── */
.cl-drawer .cl-drawer__content {
  background: #f0f2f5;
}

/* ── 复制到其他账户 / 其他主体 弹窗（400×，对齐线上截图） ── */
.proj-copy-dialog.el-dialog { padding: 0; border-radius: 2px; }
.proj-copy-dialog .el-dialog__header {
  padding: 16px 20px 12px; margin-right: 0;
}
.proj-copy-dialog .el-dialog__title { font-size: 16px; font-weight: 500; color: #1d2129; }
.proj-copy-dialog .el-dialog__headerbtn { top: 14px; right: 12px; }
.proj-copy-dialog .el-dialog__body { padding: 0 20px 8px; }
.proj-copy-dialog .el-dialog__footer { padding: 12px 20px 16px; }
.proj-copy__tip { margin: 0 0 14px; font-size: 12px; line-height: 18px; color: #4e5969; }
.proj-copy__filter { display: flex; align-items: center; height: 32px; margin-bottom: 10px; border: 1px solid #dcdfe6; border-radius: 2px; overflow: hidden; }
.proj-copy__type { flex: none; width: 92px; }
.proj-copy__type :deep(.el-select__wrapper) { height: 30px; min-height: 30px; box-shadow: none !important; border-right: 1px solid #dcdfe6; border-radius: 0; font-size: 12px; }
.proj-copy__kw { flex: 1 1 auto; }
.proj-copy__kw :deep(.el-input__wrapper) { height: 30px; box-shadow: none !important; font-size: 12px; }
.proj-copy__search {
  flex: none; width: 34px; height: 30px; border: 0; background: #fff;
  color: #606266; font-size: 13px; cursor: pointer; border-left: 1px solid #dcdfe6;
}
.proj-copy__search:hover { color: #197afb; }
.proj-copy__table :deep(th.el-table__cell) { height: 38px; padding: 0; background: #fff; font-size: 12px; color: #86909c; }
.proj-copy__table :deep(td.el-table__cell) { height: 44px; padding: 0; font-size: 12px; color: #1d2129; }
.proj-copy__table :deep(.el-table__inner-wrapper::before) { display: none; }
</style>

<style scoped>
.proj-root { position: relative; padding-bottom: 16px; }

/* 预估广告数（线上 .estimate-promotion-number-wrapper：fixed top:64 right:49 w:240） */
.proj-est {
  position: fixed; top: 64px; right: 49px; z-index: 15;
  box-sizing: border-box; width: 240px; font-size: 12px;
}
.proj-est__panel {
  padding: 8px 16px;
  background: rgba(247, 247, 250, .49);
  border-bottom: 1px solid #dcdde2;
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, .2) 0 2px 4px;
}
.proj-est__panel.is-folded { display: none; }
.proj-est__title { margin: 16px 0; font-size: 14px; font-weight: 700; color: #17233d; }
.proj-est__row { line-height: 17px; color: #515a6e; }
.proj-est__row + .proj-est__row { margin-top: 8px; }
.proj-est__label { font-weight: 700; color: #515a6e; }
.proj-est__num { margin-left: 4px; color: #2e71ea; }
.proj-est__fold {
  position: absolute; top: 0; right: -24px;
  font-size: 20px; color: #197afb; cursor: pointer;
}

/* 字段行：label 144px + 控件区（线上 .el-form-item__label：fs14 / #666 / lh32 / pr12） */
.proj-field { display: grid; grid-template-columns: 144px 1fr; }
.proj-field--w120 { grid-template-columns: 120px 1fr; }
.proj-field--w150 { grid-template-columns: 150px 1fr; }
.proj-field--w180 { grid-template-columns: 180px 1fr; }
.proj-field--w120 .proj-field__label { width: 120px; }
.proj-field--w150 .proj-field__label { width: 150px; }
.proj-field--w180 .proj-field__label { width: 180px; }
/* label 右侧 ⓘ（线上 .mg-icon-question2：14×14 / #999 / margin-left 8px） */
.proj-field__qicon {
  display: inline-block; width: 14px; height: 14px; margin-left: 8px;
  vertical-align: -2px; cursor: pointer;
  background: no-repeat center / 14px 14px
    url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Ccircle cx='7' cy='7' r='6' fill='none' stroke='%23999' stroke-width='1'/%3E%3Cpath d='M5.2 5.4c0-1 0.85-1.7 1.8-1.7s1.8.7 1.8 1.7c0 1.4-1.8 1.4-1.8 2.7' fill='none' stroke='%23999' stroke-width='1.2' stroke-linecap='round'/%3E%3Ccircle cx='7' cy='10.2' r='0.75' fill='%23999'/%3E%3C/svg%3E");
}
/* 结构化气泡（线上 .intro > .intro-title.fs12 / .intro-content.fs12） */
.proj-bubble__title { margin: 0 0 4px; font-size: 12px; color: #333; font-weight: 500; }
.proj-bubble__content { margin: 0; font-size: 12px; color: #666; white-space: pre-line; }

/* checkbox 后的 ⓘ：跟在文字右侧，margin-left 4px */
.proj-field__qicon--inline { margin-left: 4px; vertical-align: -1px; }
.proj-field--bare { grid-template-columns: 1fr; }
/* 周时段网格：线上与「投放时段」的 radio 左边缘对齐（缩进 144px）
   注意：bare 行是单列网格，.proj-field__content 会占满 1fr，
   所以缩进要用 padding-left 而不是 grid 列。 */
.proj-field--indent .proj-field__content { padding-left: 144px; }
.proj-field__label {
  width: 144px; padding-right: 12px;
  font-size: 14px; line-height: 32px; color: #666; text-align: left;
}
.proj-field--bare .proj-field__label { display: none; }
.proj-field__label.is-required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.proj-field.is-disabled .proj-field__content { opacity: .6; }
/* 线上 .el-form-item__content 实测高 33px（line-height 32px，行盒 +1） */
.proj-field__content { font-size: 14px; line-height: 32px; min-height: 33px; color: #000; }

/* 单选（线上 el-radio-button--small：h32 / fs12 / fw500 / pad 9px 12px） */
.proj-radio { display: inline-flex; flex-wrap: wrap; vertical-align: top; }
.proj-radio :deep(.el-radio-button) { margin-right: 0; }
.proj-radio :deep(.el-radio-button__inner) {
  padding: 9px 12px; font-size: 12px; font-weight: 500; line-height: 12px;
  height: 32px; color: #606266; background: #fff;
  border: 1px solid #dcdfe6; border-radius: 0; box-shadow: none;
}
.proj-radio :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 3px 0 0 3px; }
.proj-radio :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0 3px 3px 0; }
.proj-radio :deep(.el-radio-button__original-radio) { display: none; }
.proj-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: #197afb; background: #d6eaff; border-color: #197afb; box-shadow: -1px 0 0 0 #197afb;
}
.proj-radio :deep(.el-radio-button.is-active:first-child .el-radio-button__inner) { box-shadow: none; }
.proj-radio :deep(.el-radio-button__inner:hover) { color: #197afb; }
.proj-radio :deep(.el-radio-button.is-disabled .el-radio-button__inner) {
  color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed;
}

/* 多选 */
.proj-check { display: inline-flex; flex-wrap: wrap; align-items: center; }
.proj-check :deep(.el-checkbox) { margin-right: 16px; height: 32px; }
.proj-check__suffix { font-size: 12px; color: #86909c; }

/* 推广目的卡片（线上 .box-card-new：208×94 / pad 12px 16px / radius 3px） */
.proj-cards { display: flex; flex-wrap: wrap; }
.proj-cards--objective { margin-top: -2px; }
.proj-card {
  box-sizing: border-box; cursor: pointer; background: #fff;
  border: 1px solid #e8eaec; transition: border-color .2s;
}
.proj-card--objective {
  position: relative; width: 208px; min-height: 94px;
  margin: 0 16px 16px 0; padding: 12px 16px; border-radius: 3px;
}
.proj-card--objective .proj-card__title { font-size: 14px; line-height: 32px; color: #333; }
.proj-card--objective .proj-card__desc {
  width: 110px; font-size: 12px; line-height: 18px; color: #999; word-break: break-all;
}
.proj-card--objective.is-active { border-color: #197afb; }
.proj-card__img {
  position: absolute; top: 48px; right: 40px;
  width: 48px; height: 48px; object-fit: contain;
  transform: translate(50%, -50%);
}

/* 竞价策略卡片（线上 .bid-type-way-item：150×88 / pad 12px / radius 4px / gap 8） */
.proj-cards--bid { gap: 8px; }
.proj-card--bid { width: 150px; height: 88px; padding: 12px; border-radius: 4px; }
.proj-card--bid .proj-card__title { font-size: 14px; line-height: 32px; color: #333; }
.proj-card--bid .proj-card__desc { font-size: 12px; line-height: 18px; color: #999; }
.proj-card--bid.is-active { border-color: #4080ff; }

/* 通用小组件 */
.proj-inline { display: flex; align-items: center; gap: 10px; width: 100%; }
.proj-input-row { width: 100%; }
/* 线上 el-button--small 高 32（EP 默认 24） */
.proj-root :deep(.el-button--small) { min-height: 32px; padding: 9px 12px; }
.proj-root :deep(.el-button--mini) { min-height: 28px; padding: 5px 11px; }
.proj-btn120 { width: 120px; }
/* 组块（线上 .convert-content：padding 16px / border 1px #e8eaec） */
.proj-group {
  padding: 16px;
  border: 1px solid #e8eaec;
  background: #fff;
}
.proj-field--nested { grid-template-columns: 150px 1fr; margin-bottom: 24px; }
.proj-field--nested:last-child { margin-bottom: 16px; }
.proj-field--nested .proj-field__label { width: 150px; }
.proj-select--w360 { width: 360px; }
.proj-select { width: 240px; }
.proj-input--w360 { width: 360px; }
.proj-input--w160 { width: 160px; flex: none; }
.proj-picked { font-size: 12px; color: #86909c; margin-left: 2px; }
.proj-keyword { flex: 1; font-size: 14px; color: #1d2129; }
/* 搜索快投 · 关键词灰底框（线上 286×48，文本 + 右端编辑/清空） */
.proj-kwbox {
  width: 286px; height: 48px; padding: 0 12px;
  display: flex; align-items: center; gap: 12px;
  background: #f7f8fa; border-radius: 2px; box-sizing: border-box;
}
.proj-kwbox__txt { flex: 1; min-width: 0; font-size: 14px; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.proj-kwbox__act { font-size: 13px; color: #197afb; cursor: pointer; white-space: nowrap; }
.proj-coef__input { width: 132px; }
/* 线上提示两种变体：
   ① .interest-action-info（block）：12px / #999 / line-height 32px / 高 32px + ⚠ 12×12 图标
   ② inline：inline / margin-left 16px / 12px / ⚠ 14×14 图标（色 #ff9b48, margin-right 8px） */
.proj-tip { width: 100%; font-size: 12px; line-height: 24px; color: #999; margin-top: 0; }
.proj-tip--warn { color: #f7aa47; }
.proj-tip--inline {
  display: inline; width: auto; line-height: 32px; margin-left: 16px;
  vertical-align: baseline;
}
/* block 变体 .interest-action-info：line-height 32px（高 32px）+ ⚠ 12×12 图标 margin-right 6px */
.proj-tip--block { line-height: 32px; height: 32px; }
.proj-tip__warn--sm {
  width: 12px; height: 12px; margin-right: 6px; vertical-align: -1px;
  background-size: 12px 12px;
  background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 1 11 10.6H1z' fill='none' stroke='%23ff9b48' stroke-width='1' stroke-linejoin='round'/%3E%3Cpath d='M6 4.6v2.6' stroke='%23ff9b48' stroke-width='1.1' stroke-linecap='round'/%3E%3Ccircle cx='6' cy='8.9' r='0.6' fill='%23ff9b48'/%3E%3C/svg%3E");
}
.proj-tip__warn {
  display: inline-block; width: 14px; height: 14px; margin-right: 8px;
  vertical-align: -2px;
  background: no-repeat center / 14px 14px
    url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath d='M7 1.2 13 12.2H1z' fill='none' stroke='%23ff9b48' stroke-width='1' stroke-linejoin='round'/%3E%3Cpath d='M7 5.4v3' stroke='%23ff9b48' stroke-width='1.2' stroke-linecap='round'/%3E%3Ccircle cx='7' cy='10.2' r='0.7' fill='%23ff9b48'/%3E%3C/svg%3E");
}
.proj-link { margin-left: 12px; font-size: 12px; color: #197afb; text-decoration: none; cursor: pointer; }
.proj-link__icon { margin-right: 2px; vertical-align: -2px; }
/* 线上 .cl-name-tag-wrapper：通配符区
   .tag-desc「通配符:」+ .external-name-tag > el-button--text--mini（+ 图标 + 文字）
   tooltip width 296px / fs12 */
.proj-wildcards { display: flex; align-items: center; gap: 10px; margin-top: 6px; font-size: 12px; color: #4e5969; }
.proj-wildcards__label { color: #86909c; }
.proj-wildcards :deep(.el-button--small) { font-size: 12px; min-height: 24px; padding: 4px 6px; }
.proj-wildcards__icon { margin-right: 2px; vertical-align: -1px; }
/* 线上「插入更多」是灰色文字链接（.click-more-item），不是 primary 按钮 */
.proj-wildcards__more {
  display: inline-flex; align-items: center; font-size: 13px; color: #86909c; cursor: pointer;
}
.proj-wildcards__more:hover { color: #197afb; }

/* ── 投放时段 · 周时段网格 ──
   线上实测：table 647×318 / 日期列 70px / 小时列 12px×24 / 正文行高 30px
   选中格 class=selected 底色 #197afb、边框仍 1px #ccc
   表尾两行：已选择时间段 + 清空选择 / 逐行「星期一：01:00~09:30」 */
.proj-week { margin-bottom: 16px; }
.proj-week__table {
  /* 线上 .week-time-table 实测：width 647px / table-layout auto /
     日期列 70px / 小时列 12px（内容只有一个数字）/ 两个 colspan=12 表头各 288px */
  width: 647px; border-collapse: collapse; table-layout: auto;
  font-size: 12px; color: #333; background: #fff;
}
.proj-week__col-day { width: 70px; }
.proj-week__col-hour { width: 12px; }
.proj-week__table th,
.proj-week__table td {
  border: 1px solid #ccc; padding: 0; text-align: center;
  font-weight: 400; background: #f8f9fa;
}
.proj-week__table tbody td { background: #fff; }
.proj-week__corner { width: 70px; height: 48px; }
.proj-week__half { height: 24px; font-size: 12px; color: #333; background: #f8f9fa; }
.proj-week__hour { height: 24px; font-size: 12px; color: #333; background: #f8f9fa; }
.proj-week__day { width: 70px; height: 30px; font-size: 12px; color: #333; background: #fff; }
.proj-week__td { height: 30px; background: #fff; cursor: pointer; user-select: none; }
.proj-week__td.selected { background: #197afb; }
.proj-week__trfoot td,
.proj-week__trsum td {
  height: 29px; padding: 0 12px; text-align: left; background: #fff;
}
.proj-week__trfoot td { border-top: 1px solid #ccc; }
.proj-week__trsum td { border-top: none; }
.proj-week__foot {
  display: flex; align-items: center; justify-content: space-between;
}
.proj-week__tip { font-size: 12px; color: #999; }
.proj-week__clear { font-size: 12px; color: #197afb; cursor: pointer; text-decoration: none; }
.proj-week__clear:hover { color: #4a9bff; }
.proj-week__sumlabel { font-size: 12px; color: #999; margin-right: 4px; }
.proj-week__sumval { font-size: 12px; color: #333; }

/* ── 预算出价区：统一 / 分账户 / 分主体（截图：整块 1px 灰边框白底卡片） ── */
.proj-bpanel {
  display: flex; align-items: stretch;
  background: #fff; border: 1px solid #e5e6eb;
  margin-bottom: 8px;
  min-height: 210px;
}
/* 左侧账户 / 主体列表（截图：约 172px 宽、白底、右侧 1px 分隔线、选中行淡蓝底 + 蓝勾） */
.proj-bpanel__aside {
  flex: none;
  width: 172px;
  max-height: 258px;
  overflow: auto;
  border-right: 1px solid #e5e6eb;
  background: #fff;
}
.proj-bpanel__item {
  position: relative;
  padding: 8px 26px 8px 14px;
  cursor: pointer;
}
.proj-bpanel__item.is-active { background: #f2f7ff; }
.proj-bpanel__item-name {
  font-size: 12px; line-height: 20px; color: #197afb;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.proj-bpanel__item-sub { font-size: 12px; line-height: 18px; color: #86909c; }
.proj-bpanel__check {
  position: absolute; right: 8px; top: 12px;
  width: 12px; height: 12px; border-radius: 50%;
  border: 1px solid #197afb; background: #fff;
  color: #197afb; font-size: 9px; line-height: 12px; text-align: center; font-style: normal;
}
.proj-bpanel__check::after { content: '✓'; }
.proj-bpanel__main { flex: 1 1 auto; min-width: 0; padding: 10px 12px 14px; }
.proj-bpanel__bar { display: flex; align-items: center; justify-content: flex-end; gap: 18px; height: 26px; }
.proj-bpanel__bar .el-button { font-size: 12px; height: 26px; padding: 0; }
.proj-bpanel__copy { font-size: 12px; color: #197afb; line-height: 26px; height: 26px; padding: 0; margin-right: 2px; }
.proj-bpanel__copy:hover { color: #4a9bff; }
.proj-bpanel__copy.is-disabled { color: #c0c4cc; cursor: not-allowed; }

/* 预算出价规则卡（截图：1px 灰边框、灰底头行 h40、内容 padding 16 24） */
.proj-rule { background: #fff; border: 1px solid #e5e6eb; margin-top: 10px; }
.proj-rule__head {
  display: flex; align-items: center; justify-content: space-between;
  height: 40px; padding: 0 12px;
  background: #f7f8fa; border-bottom: 1px solid #e5e6eb;
}
.proj-rule__title { font-size: 14px; color: #1d2129; }
.proj-rule__body { padding: 16px 24px; }
.proj-rule__row { display: grid; grid-template-columns: 174px 1fr; margin-bottom: 16px; }
.proj-rule__label { font-size: 14px; line-height: 32px; color: #666; }
.proj-rule__ctrl { font-size: 14px; line-height: 32px; }

/* 日预算（截图：168px 输入框 + 元 + 300|500|1000|2000；空值时红边 + 下方红字） */
.proj-budget { display: flex; flex-wrap: wrap; align-items: center; }
.proj-budget__input { width: 168px; flex: none; }
.proj-budget__input.is-error :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px #f54a45 inset; }
.proj-budget__unit { flex: none; margin: 0 20px 0 8px; font-size: 14px; color: #1d2129; }
.proj-budget__quick { flex: none; margin-right: 6px; font-size: 12px; color: #197afb; cursor: pointer; }
.proj-budget__quick:hover { color: #4a9bff; }
.proj-budget__err { flex-basis: 100%; margin-top: 4px; font-size: 12px; line-height: 18px; color: #f54a45; }
/* 单值出价输入框（截图：约 155px） */
.proj-budget__input--bid { width: 155px; }
/* 出价范围（截图：96px 最低 - 96px 最高 + 元；各自框下方红字，整体顶对齐） */
.proj-range { align-items: flex-start; }
.proj-range__cell { display: flex; flex-direction: column; flex: none; }
.proj-range__input { width: 96px; }
.proj-range__dash { flex: none; margin: 0 8px; font-size: 14px; line-height: 32px; color: #1d2129; }
.proj-range__unit { margin: 0 0 0 40px; line-height: 32px; }
/* 规则卡内的 label 行内 ⓘ（与文字同一行，垂直居中） */
.proj-rule__label { display: flex; align-items: center; gap: 4px; }

/* 汇总条（截图：h42 灰底、四段横排、两端对齐） */
.proj-summary__bar { display: flex; justify-content: flex-end; }
.proj-summary {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 42px; padding: 0 12px; margin: 8px 0 0;
  background: #f2f3f5; font-size: 12px; color: #86909c;
}
.proj-summary > span { white-space: nowrap; }
.proj-summary__label { font-style: normal; color: #86909c; }
.proj-summary b { color: #1d2129; font-weight: 600; }

/* 投放版位「广告位置」分段按钮（截图款：白底 / 选中蓝边蓝字、未选灰边灰字 / h32 fs14）
   两个按钮紧贴为一组，中间只留 1px 分隔线，无圆角 */
.proj-radio--seg :deep(.el-radio-button__inner) {
  height: 32px; padding: 0 6px; line-height: 30px;
  font-size: 14px; font-weight: 400;
  color: #606266; background: #fff;
  border: 1px solid #dcdfe6; border-radius: 0;
}
.proj-radio--seg :deep(.el-radio-button:first-child .el-radio-button__inner) { border-radius: 0; }
.proj-radio--seg :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 0; }
.proj-radio--seg :deep(.el-radio-button:not(:first-child) .el-radio-button__inner) { border-left: 0; }
.proj-radio--seg :deep(.el-radio-button.is-active .el-radio-button__inner) {
  z-index: 1;
  color: #197afb; background: #fff;
  border: 1px solid #197afb; box-shadow: none;
}
.proj-radio--seg :deep(.el-radio-button.is-active:first-child .el-radio-button__inner) { box-shadow: none; }
.proj-radio--seg :deep(.el-radio-button__inner:hover) { color: #197afb; }

/* 首选媒体（线上 .dv2 盒子：w400 / border 1px #dee4f5；.dv3 标题条 h40 bg #fafbfe） */
.proj-dv2 {
  display: inline-block; box-sizing: border-box; width: 400px; margin-top: 12px;
  border: 1px solid #e5e6eb; background: #fff;
}
.proj-dv3 {
  height: 42px; padding: 0 11px; line-height: 42px;
  background: #fafbfe; font-size: 14px; color: #333;
}
/* 逐行容器：只做左右内缩，垂直方向不加 padding（否则每行被撑高） */
.proj-dv5 { padding: 0 11px; }
.proj-dv5__item {
  display: flex; align-items: center; height: 32px;
  font-size: 14px; line-height: 32px; color: #666;
}
.proj-dv5__item.is-selected { color: #197afb; }
.proj-dv5__txt { margin-left: 8px; }

/* 搜索快投豁免（线上：无 label 的独立行，说明文字 12px #999） */
.proj-service { display: flex; align-items: center; }
.proj-service__suffix { margin-left: 8px; font-size: 12px; color: #999; }

/* 预算出价配置模式（线上 .mode-label 112×18 / 14px #666 + .ml32 单选组） */
.proj-budmode { display: flex; align-items: center; margin-bottom: 16px; }
.proj-budmode__label {
  flex: none; width: 112px; font-size: 14px; line-height: 32px; color: #666;
}
.proj-budmode__group { margin-left: 32px; }

/* 日预算（线上 .w160.mr8 输入框 160px + 「元」+ .opt-link 快捷值 300|500|1000|2000） */
.proj-amount { display: flex; align-items: center; }
.proj-amount__input { width: 160px; margin-right: 8px; }
.proj-amount__unit { margin-right: 16px; font-size: 14px; color: #333; }
.proj-amount__sep { margin: 0 4px; font-size: 12px; color: #86909c; }
.proj-amount__quick { font-size: 12px; color: #197afb; cursor: pointer; }
.proj-amount__quick:hover { color: #4a9bff; }

/* 内联表 */
/* 资产表格（线上 .cl-table 实测：宽 934 / x=953 不缩进 / 表头 56px）
   2 列表格行高 69px；3 列表格（事件资产）行高 87px */
.proj-table { margin-top: 0; width: 100%; }
.proj-table :deep(.el-table__header th) { height: 56px; padding: 0; background: #f8f9fa; }
.proj-table :deep(.el-table__row td) { height: 69px; padding: 0; }
.proj-table--3col :deep(.el-table__row td) { height: 87px; }
.proj-cell { display: flex; flex-direction: column; font-size: 12px; color: #1d2129; }
.proj-cell__id { color: #86909c; }
.proj-tag { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
/* 链接卡片（线上：url + 名称 两行，右上 ×） */
.proj-card { position: relative; display: inline-block; max-width: 100%; padding: 6px 22px 6px 8px; background: #f5f7fa; border-radius: 2px; font-size: 12px; color: #1d2129; line-height: 18px; }
.proj-card__name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.proj-card__x { position: absolute; right: 4px; top: 4px; font-size: 12px; color: #86909c; cursor: pointer; }
.proj-card__x:hover { color: #197afb; }
</style>
