<template>
  <!--
    落地页抽屉（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 落地页列底「编辑」）

    线上基准（2026-11-26 实测，1920×1080；证据 C:/tmp/verify/diff/）：
      外壳  .cl-drawer  x=904 y=0 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 -8px 0 8px #0003
      头部  .drawer-header  x=904 y=0 w=1016 h=49  白底  padding 0 16px  下边框 1px #e8eaec
            头部标题 .header-title「选择落地页」16px/700/#333 lh48
      内容  .drawer-content  x=920 y=65 w=984 h=932  白底 1px #e8eaec radius 3px padding 16px
      底部  .drawer-footer  x=904 y=1010 w=1016 h=70  白底 上边框 1px #e8eaec padding 12px 16px 24px
            按钮：取 消 / 确 定   各 88×32  12px/500
      关闭键 .drawer-close  x=872 y=10 32×32
      表单   form.el-form.content-table.el-form--label-left
            label 宽 140px（14px #666 lh32），右侧内容 margin-left 140px
      控件   el-radio-button__inner：min-width 80px / height 32px / padding 9px 12px / 12px

    依赖关系全部走 spec/landing.spec.js + spec/resolve.js，模板里不写散落的 v-if 判定。
  -->
  <BatchDrawer
    v-model="visible"
    :title="spec.headerTitle"
    :width="spec.geometry.drawer.width"
    :cancel-text="spec.footer.cancelText"
    :ok-text="spec.footer.okText"
    @close="onClose"
    @ok="onConfirm"
  >
    <template #footer>
      <div class="lp-footer">
        <button class="lp-btn lp-btn--plain" @click="onClose">取 消</button>
        <button class="lp-btn lp-btn--primary" @click="onConfirm">确 定</button>
      </div>
    </template>
    <template #content>
      <div class="lp-root">
        <div class="lp-form">
          <!-- 每个广告配置 -->
          <div class="lp-row" :style="rowStyle('per_ad_count')">
            <div class="lp-row__label">{{ fieldOf('per_ad_count').label }}</div>
            <div class="lp-row__content">
              <input v-model="v.per_ad_count" class="lp-num" type="text" />
              <span class="lp-unit">{{ fieldOf('per_ad_count').suffix }}</span>
            </div>
          </div>

          <!-- 落地页类型 -->
          <div class="lp-row" :style="rowStyle('landing_page_type')">
            <div class="lp-row__label lp-row__label--req">{{ fieldOf('landing_page_type').label }}</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button
                  v-for="o in fieldOf('landing_page_type').options"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.landing_page_type === o.value }"
                  :disabled="!!o.disabled"
                  @click="onTypeChange(o)"
                >{{ o.label }}</button>
              </div>
              <div v-if="typeTip" class="lp-tip">{{ typeTip }}</div>
            </div>
          </div>

          <!-- 落地页选择方式（仅第三方落地页） -->
          <div v-if="isVisible('landing_select_way')" class="lp-row" :style="rowStyle('landing_select_way')">
            <div class="lp-row__label">{{ fieldOf('landing_select_way').label }}</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button
                  v-for="o in fieldOf('landing_select_way').options"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.landing_select_way === o.value }"
                  @click="v.landing_select_way = o.value"
                >{{ o.label }}</button>
              </div>
            </div>
          </div>

          <!-- 第三方落地页 · 自动选择：匹配方式 -->
          <div v-if="isAutoSelect" class="lp-row lp-tpauto">
            <div class="lp-row__label">匹配方式</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button class="lp-rbtn is-active">素材备注</button>
              </div>
              <div class="lp-tpauto__desc">
                取广告创意组首个素材备注,匹配与之同名的落地页。若监测活动与自动直达链接（多直达）同时开启关联第方落地页,还会校验资产中是否有对应的链接
              </div>
              <label class="tp-check tp-check--auto" :class="{ 'is-on': tpAllowUnlinked }">
                <input v-model="tpAllowUnlinked" type="checkbox" class="tp-check__box" />
                <span>允许匹配未关联账户的资产</span>
              </label>
            </div>
          </div>

          <!-- 落地页分配方式（选项随类型增减；自动选择时整行隐藏） -->
          <div v-if="!isAutoSelect" class="lp-row" :style="rowStyle('landing_page_rule')">
            <div class="lp-row__label lp-row__label--req">{{ fieldOf('landing_page_rule').label }}</div>
            <div class="lp-row__content">
              <div class="lp-rulerow">
              <div class="lp-rgroup">
                <button
                  v-for="o in visibleRuleOptions"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.landing_page_rule === o.value }"
                  @click="v.landing_page_rule = o.value"
                >{{ o.label }}</button>
              </div>
              <!-- 线上：分配方式 = 按账户分配 时出现「复制到其他账户」 -->
              <button
                v-if="!isOrange && !isThirdParty && isVisible('copy_to_other_account')"
                class="lp-btn lp-btn--copy"
                :disabled="isDisabled('copy_to_other_account')"
                @click="openCopyAccounts"
              >{{ fieldOf('copy_to_other_account').text }}</button>
              </div>
            </div>
          </div>

          <!-- 循环使用账户 / 循环使用资产（按项目分配、按广告分配 时出现） -->
          <div v-if="showLoopRow" class="lp-row lp-looprow">
            <div class="lp-row__label">{{ loopLabel }}</div>
            <div class="lp-row__content">
              <div class="lp-rgroup">
                <button
                  v-for="o in LOOP_OPTIONS"
                  :key="o.value"
                  class="lp-rbtn"
                  :class="{ 'is-active': v.loop_account === o.value }"
                  @click="v.loop_account = o.value"
                >{{ o.label }}</button>
              </div>
              <div v-if="v.loop_account === 'ON'" class="lp-loop-tip">
                <span class="lp-loop-tip__ico">!</span>
                未选满时系统将自动根据匹配方式循环使用落地页，请预览后核实每个广告分配的落地页
              </div>
            </div>
          </div>

          <!-- 选择链接模板（仅动态链接生成） -->
          <div v-if="isVisible('link_template')" class="lp-row">
            <div class="lp-row__label">{{ fieldOf('link_template').label }}</div>
            <div class="lp-row__content">
              <select v-model="v.link_template" class="lp-select lp-select--wide">
                <option value="">请选择链接模板</option>
                <option v-for="o in LINK_TEMPLATES" :key="o" :value="o">{{ o }}</option>
              </select>
              <div class="lp-panelbtns">
                <button
                  v-for="b in typePanel.panel"
                  :key="b"
                  class="lp-btn lp-btn--text"
                  @click="onPanelBtn(b)"
                >{{ b }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 手动填写：输入落地页（线上图：按账户分配时左侧账户列 + 右侧逐账户链接） -->
        <div v-if="isVisible('manual_url')" class="lp-manual">
          <div class="lp-manual__inner" :class="{ 'is-accs': v.landing_page_rule === 'PER_ACCOUNT' }">
            <div v-if="v.landing_page_rule === 'PER_ACCOUNT'" class="lp-manual__accs">
              <div
                v-for="(a, i) in orangeAccounts"
                :key="a.id"
                class="lp-manual__acc"
                :class="{ 'is-active': i === accIndex }"
                @click="accIndex = i"
              >
                <span class="lp-manual__accname" :title="a.name">{{ a.name }}</span>
                <span class="lp-manual__accid">{{ a.displayId }}</span>
                <span class="lp-manual__ok">
                  <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#00b42a" /><path d="M3.6 7.1l2.2 2.2 4.6-4.7" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
              </div>
            </div>
            <div class="lp-manual__main">
              <div v-if="v.landing_page_rule === 'PER_ACCOUNT'" class="lp-manual__row" :style="rowStyle('manual_url')">
                <div class="lp-manual__label">{{ fieldOf('manual_url').label }}</div>
                <input
                  class="lp-manual__input"
                  type="text"
                  :placeholder="fieldOf('manual_url').placeholder"
                  :value="manualCur"
                  @input="onManualInput($event.target.value)"
                />
              </div>
              <div v-for="(u, i) in manualUrls" v-else :key="i" class="lp-manual__row" :style="rowStyle('manual_url')">
                <div class="lp-manual__label">{{ fieldOf('manual_url').label }}</div>
                <input
                  class="lp-manual__input"
                  type="text"
                  :placeholder="fieldOf('manual_url').placeholder"
                  :value="u"
                  @input="onManualUrl(i, $event.target.value)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 橙子建站模板：分项目/分广告 时，整宽橙色提示（无「循环使用账户」行） -->
        <div v-if="isOSite && showOSiteLoopTip" class="lp-loop-tip lp-loop-tip--wide">
          <span class="lp-loop-tip__ico">!</span>
          未选满时系统将自动根据匹配方式循环使用落地页，请预览后核实每个广告分配的落地页
        </div>

        <!-- 橙子落地页 / 橙子建站模板（线上 2026-11-27） -->
        <div v-if="isOrange" class="lp-orange">
          <!-- 左侧账户面板（分账户 / 分项目 / 分广告 时出现） -->
          <div v-if="v.landing_page_rule !== 'ALL'" class="lp-orange__accs">
            <div
              v-for="(a, i) in orangeAccounts"
              :key="a.id"
              class="lp-orange__acc"
              :class="{ 'is-active': i === accIndex }"
              @click="accIndex = i"
            >
              <span class="lp-orange__accname" :title="a.name">{{ a.name }}</span>
              <span class="lp-orange__accid">{{ a.displayId }}</span>
              <span v-if="isOSite" class="lp-oradio" :class="{ 'is-on': i === accIndex }">
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1"/><path v-if="i === accIndex" d="M3.6 7.2l2.3 2.3 4.5-4.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>

          <div class="lp-orange__main">
            <div class="lp-ocard" :class="{ 'lp-ocard--plain': isOSite }">
              <div v-if="!isOSite" class="lp-ocard__head">
                <span class="lp-ocard__title">选择落地页</span>
                <div class="lp-ocard__ops">
                  <button class="lp-btn lp-btn--primary lp-btn--sm" @click="onOrangeRefresh">多账户刷新</button>
                  <button class="lp-btn lp-btn--border lp-btn--sm" @click="sharedVisible = true">获取共享建站</button>
                  <button class="lp-btn lp-btn--border lp-btn--sm" @click="clearAllAccounts">清空所有账户</button>
                  <button
                    v-if="v.landing_page_rule !== 'ALL'"
                    class="lp-btn lp-btn--primary lp-btn--sm"
                    @click="quickSelectAll"
                  >多账户快速选择</button>
                </div>
              </div>

              <!-- 全部相同：账户下拉 -->
              <div v-if="v.landing_page_rule === 'ALL'" class="lp-ocard__acctrow">
                <select v-model="allAccount" class="lp-select lp-select--acctwide">
                  <option v-for="a in orangeAccounts" :key="a.id" :value="a.id">{{ a.name }}-在投({{ a.displayId }})</option>
                </select>
                <button class="lp-link lp-ocard__refresh" @click="onOrangeRefresh">刷新</button>
              </div>

              <!-- 搜索行 -->
              <div class="lp-ocard__search">
                <select v-model="lpField" class="lp-select lp-select--name">
                  <option value="name">名称</option>
                  <option value="remark">备注</option>
                </select>
                <input v-model="lpKeyword" class="lp-search lp-search--grow" type="text" placeholder="请输入关键词" />
                <button class="lp-iconbtn" aria-label="查询" @click="onSearch">
                  <el-icon><Search /></el-icon>
                </button>
                <button class="lp-iconbtn" aria-label="更多" @click="onSearch">
                  <el-icon><Filter /></el-icon>
                </button>
                <span v-if="v.landing_page_rule === 'ALL' || isOSite" class="lp-ocard__jump" @click="openOrangeSite">
                  <el-icon><Link /></el-icon>{{ isOSite ? '跳转橙子建站模板' : '跳转橙子建站' }}
                </span>
              </div>

              <!-- 项目数 / 广告数 + 快速选择 -->
              <div class="lp-ocard__sum">
                <span>项目数：{{ projectCount }}</span>
                <span>广告数：{{ adCount }}</span>
                <button class="lp-btn lp-btn--quickselect lp-btn--sm" @click="quickSelect">
                  <ClIcon :d="icon('quickselect').d" :size="12" color="#606266" />快速选择
                </button>
              </div>

              <!-- 表格 -->
              <div class="lp-otable">
                <div class="lp-otable__head">
                  <template v-if="isOSite">
                    <span class="lp-otable__c1">落地页模板名称
                      <el-icon><Sort /></el-icon>
                    </span>
                    <span class="lp-otable__c2 lp-otable__c2--sorting">关联广告数
                      <el-icon><Sort /></el-icon>
                    </span>
                  </template>
                  <template v-else>
                    <span class="lp-otable__c1">落地页名称
                      <el-icon><Sort /></el-icon>
                    </span>
                    <span class="lp-otable__c2">关联广告数
                      <el-icon><Sort /></el-icon>
                    </span>
                    <span class="lp-otable__c3">备注</span>
                  </template>
                </div>
                <div class="lp-otable__body">
                  <div
                    v-for="lp in filteredPages"
                    :key="lp.id"
                    class="lp-otable__row"
                    :class="{ 'is-checked': currentChecked.includes(lp.id) }"
                    @click="toggleChecked(lp.id)"
                  >
                    <span class="lp-otable__c1" :title="lp.title">{{ lp.title }}</span>
                    <span class="lp-otable__c2">{{ lp.ad_count ?? '--' }}</span>
                    <span v-if="!isOSite" class="lp-otable__c3">{{ lp.remark || '--' }}</span>
                  </div>
                  <div v-if="!filteredPages.length" class="lp-oempty">
                    <svg width="88" height="76" viewBox="0 0 88 76">
                      <rect x="32" y="6" width="24" height="34" rx="1" fill="#fff" stroke="#e5e6eb" />
                      <path d="M37 15h14M37 21h14M37 27h9" stroke="#f0f1f3" stroke-width="2" />
                      <path d="M18 44h52l6 12H12z" fill="#fff" stroke="#e5e6eb" />
                      <path d="M12 56h64" stroke="#f0f1f3" />
                      <path d="M25 8l-3-3M63 8l3-3M44 2v-3" stroke="#e5e6eb" />
                    </svg>
                    <div class="lp-oempty__txt">暂无数据</div>
                  </div>
                </div>
              </div>

              <div class="lp-ocard__pager">
                <span class="lp-pager__ico">&lt;</span>
                <span class="lp-pager__page">1</span>
                <span class="lp-pager__ico">&gt;</span>
              </div>

              <div class="lp-ocard__hint">
                没找到已有落地页？<a class="lp-link" @click="openOrangeSite">去列表同步</a>后再刷新
              </div>
            </div>
          </div>

          <!-- 右侧已选 -->
          <div class="lp-opicked">
            <div class="lp-opicked__head">
              <span>已选 <b>{{ currentChecked.length }}/{{ maxCount }}</b></span>
              <a class="lp-link" @click="clearAll">清空
                <ClIcon :d="icon('refreshRight').d" :size="10" color="#197afb" />
              </a>
            </div>
            <div class="lp-opicked__body">
              <div v-for="id in currentChecked" :key="id" class="lp-opicked__row">
                <span class="lp-opicked__name" :title="pageById(id)?.title">{{ pageById(id)?.title }}</span>
                <el-icon class="lp-picked__x" @click.stop="removePicked(id)"><Close /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 第三方落地页 · 手动选择（线上图：卡头 + 项目下拉 + 搜索 + 筛选 + 四列表格） -->
        <div v-else-if="isThirdParty && !isAutoSelect" class="lp-orange lp-tp">
          <div v-if="v.landing_page_rule !== 'ALL'" class="lp-orange__accs">
            <div
              v-for="(a, i) in orangeAccounts"
              :key="a.id"
              class="lp-orange__acc"
              :class="{ 'is-active': i === accIndex }"
              @click="accIndex = i"
            >
              <span class="lp-orange__accname" :title="a.name">{{ a.name }}</span>
              <span class="lp-orange__accid">{{ a.displayId }}</span>
              <span class="lp-oradio" :class="{ 'is-on': i === accIndex }">
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1"/><path v-if="i === accIndex" d="M3.6 7.2l2.3 2.3 4.5-4.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>

          <div class="lp-orange__main">
            <div class="lp-ocard lp-tpcard">
              <div class="lp-tpcard__head">
                <span class="lp-tpcard__title">选择落地页</span>
                <div class="lp-ocard__ops">
                  <button class="lp-btn lp-btn--border lp-btn--sm" @click="clearAllAccounts">清空所有资产</button>
                  <button
                    v-if="v.landing_page_rule !== 'ALL'"
                    class="lp-btn lp-btn--primary lp-btn--sm"
                    @click="quickSelectAll"
                  >多账户快速选择</button>
                </div>
              </div>

              <div class="lp-tpcard__row">
                <select v-model="tpProject" class="lp-select lp-select--full">
                  <option value="">请选择智投项目</option>
                  <option v-for="p in TP_PROJECTS" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>

              <div class="lp-tpcard__row lp-tpcard__search">
                <select v-model="lpField" class="lp-select lp-select--name">
                  <option value="name">名称</option>
                  <option value="remark">备注</option>
                </select>
                <div class="lp-searchgroup">
                  <input v-model="lpKeyword" class="lp-search lp-search--grow" type="text" placeholder="请输入关键词" />
                  <button class="lp-iconbtn lp-iconbtn--joined" aria-label="更多">
                    <el-icon><Filter /></el-icon>
                  </button>
                  <button class="lp-iconbtn lp-iconbtn--joined" aria-label="查询">
                    <el-icon><Search /></el-icon>
                  </button>
                </div>
                <span class="lp-ocard__jump" @click="openThirdPartySite">跳转第三方落地页</span>
              </div>

              <div class="lp-tpcard__row lp-tpcard__sum">
                <span>项目数：{{ projectCount }}</span>
                <span>广告数：{{ adCount }}</span>
                <button class="lp-btn lp-btn--quickselect lp-btn--sm" @click="quickSelect">
                  <ClIcon :d="icon('quickselect').d" :size="12" color="#606266" />快速选择
                </button>
              </div>

              <div class="lp-tpcard__row lp-tpcard__filters">
                <label class="tp-check">
                  <input v-model="tpOnlyUnlinked" type="checkbox" class="tp-check__box" />
                  <span class="tp-check__blue">仅看未绑定账户数据</span>
                  <span class="tp-check__info">?</span>
                </label>
                <label class="tp-check">
                  <input v-model="tpOnlyZero" type="checkbox" class="tp-check__box" />
                  <span>仅看关联数为0</span>
                </label>
                <label class="tp-check">
                  <input v-model="tpOnlyUnused" type="checkbox" class="tp-check__box" />
                  <span>仅看未使用</span>
                </label>
              </div>

              <div class="lp-tptable">
                <div class="lp-tptable__head">
                  <span class="lp-tpc lp-tpc--check"></span>
                  <span class="lp-tpc lp-tpc--name">落地页名称
                    <el-icon><Sort /></el-icon>
                  </span>
                  <span class="lp-tpc lp-tpc--remark">落地页备注</span>
                  <span class="lp-tpc lp-tpc--status">使用状态</span>
                  <span class="lp-tpc lp-tpc--ad lp-otable__c2--sorting">关联广告数
                    <el-icon><Sort /></el-icon>
                  </span>
                </div>
                <div class="lp-tptable__body">
                  <div
                    v-for="p in tpRows"
                    :key="p.id"
                    class="lp-tptable__row"
                    :class="{ 'is-checked': currentChecked.includes(p.id) }"
                    @click="toggleChecked(p.id)"
                  >
                    <span class="lp-tpc lp-tpc--check">
                      <span class="tp-box" :class="{ 'is-on': currentChecked.includes(p.id) }">
                        <svg v-if="currentChecked.includes(p.id)" width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5.2l2.2 2.2L8.5 2.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>
                      </span>
                    </span>
                    <span class="lp-tpc lp-tpc--name" :title="p.title">{{ p.title }}</span>
                    <span class="lp-tpc lp-tpc--remark">{{ p.remark || '--' }}</span>
                    <span class="lp-tpc lp-tpc--status">
                      <span class="tp-dot" :class="p.used ? 'is-used' : 'is-idle'"></span>{{ p.used ? '已使用' : '未使用' }}
                    </span>
                    <span class="lp-tpc lp-tpc--ad">
                      <span class="tp-adnum">{{ p.adCount }}</span>
                      <a class="lp-link tp-preview" @click.stop>预览</a>
                    </span>
                  </div>
                  <div v-if="!tpRows.length" class="lp-oempty">
                    <div class="lp-oempty__txt">暂无数据</div>
                  </div>
                </div>
              </div>

              <div class="lp-tpcard__pager">
                <span class="lp-pager__ico">&lt;</span>
                <span class="lp-pager__page">1</span>
                <span class="lp-pager__ico">&gt;</span>
              </div>
            </div>
          </div>

          <div class="lp-opicked">
            <div class="lp-opicked__head">
              <span>已选<b>{{ currentChecked.length }}/{{ maxCount }}</b></span>
              <a class="lp-link" @click="clearAll">清空
                <ClIcon :d="icon('refreshRight').d" :size="10" color="#197afb" />
              </a>
            </div>
            <div class="lp-opicked__body">
              <div v-for="id in currentChecked" :key="id" class="lp-opicked__row">
                <span class="lp-opicked__name" :title="tpPageById(id)?.title">{{ tpPageById(id)?.title }}</span>
                <el-icon class="lp-picked__x" @click.stop="removePicked(id)"><Close /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 资产类落地页面板 -->
        <div v-else-if="isVisible('asset_panel') && !isThirdParty" class="lp-asset">
          <div class="lp-asset__head">
            <!-- 线上：只有橙子落地页 / 第三方落地页 有 .head-title，且与抽屉标题同名 -->
            <span v-if="typePanel.headTitle" class="lp-asset__title">{{ typePanel.headTitle }}</span>
            <div class="lp-asset__ops">
              <button
                v-for="b in typePanel.head"
                :key="b"
                class="lp-btn"
                :class="headBtnClass(b)"
                @click="onPanelBtn(b)"
              >{{ b }}</button>
            </div>
          </div>

          <div class="lp-asset__right">
            <!-- 搜索行 -->
            <div class="lp-searchrow">
              <select v-model="filter.account" class="lp-select lp-select--acct">
                <option value="">所有账户</option>
                <option v-for="a in selectedAccounts" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
              <input v-model="filter.keyword" class="lp-search" type="text" :placeholder="spec.assetSearch.placeholder" @keyup.enter="onSearch" />
              <button class="lp-btn lp-btn--plain" @click="onSearch">{{ spec.assetSearch.buttons[0] }}</button>
              <button class="lp-btn lp-btn--plain" @click="clearFilter">{{ spec.assetSearch.buttons[1] }}</button>
              <!-- 线上：搜索框右侧的跳转按钮 -->
              <button v-if="typePanel.jump" class="lp-btn lp-btn--text" @click="onPanelBtn(typePanel.jump)">{{ typePanel.jump }}</button>
            </div>

            <!-- 落地页列表 -->
            <div class="lp-list">
              <div class="lp-list__head">
                <span class="lp-table-header-title">落地页名称</span>
                <span class="lp-table-header-title">落地页地址</span>
                <span class="lp-table-header-title">状态</span>
                <span class="lp-table-header-title">操作</span>
                <div class="lp-list__ops">
                  <button
                    v-for="b in typePanel.panel"
                    :key="b"
                    class="lp-btn lp-btn--sm"
                    :class="b === '快速选择' ? 'lp-btn--quickselect' : 'lp-btn--text'"
                    @click="onPanelBtn(b)"
                  >
                    <ClIcon class="lp-ico" :d="panelIcon(b).d" :size="12" :color="panelIcon(b).color" />{{ b }}
                  </button>
                </div>
              </div>
              <div class="lp-list__body">
                <label v-for="lp in filteredPages" :key="lp.id" class="lp-item">
                  <input type="checkbox" :checked="checkedIds.includes(lp.id)" @change="toggleChecked(lp.id)" />
                  <span class="lp-item__name" :title="lp.title">{{ lp.title }}</span>
                  <span class="lp-item__url" :title="lp.url">{{ lp.url }}</span>
                  <span class="lp-item__status">{{ lp.platform_status === 'available' ? '可用' : '--' }}</span>
                  <span class="lp-item__preview">预览</span>
                </label>
                <div v-if="!filteredPages.length" class="lp-empty">暂无数据</div>
              </div>
            </div>

            <!-- 已选面板 -->
            <div class="lp-picked">
              <div class="lp-picked__head">
                <span>已选 <b class="lp-picked__num">{{ checkedIds.length }}/{{ maxCount }}</b></span>
                <button class="lp-link" @click="clearAll">清空</button>
              </div>
              <div class="lp-picked__body">
                <div v-for="id in checkedIds" :key="id" class="lp-picked__row">
                  <span class="lp-picked__name" :title="pageById(id)?.title">{{ pageById(id)?.title }}</span>
                  <el-icon class="lp-picked__x" @click="removePicked(id)"><Close /></el-icon>
                </div>
                <div v-if="!checkedIds.length" class="lp-empty">暂无数据</div>
              </div>
            </div>
          </div>

          <div v-if="typePanel.extraTip" class="lp-extra">{{ typePanel.extraTip }}</div>
        </div>

        <!-- 获取共享建站（线上图5：444 宽，输入关键词后确定） -->
        <div v-if="sharedVisible" class="lp-shared-mask" @click="sharedVisible = false"></div>
        <div v-if="sharedVisible" class="lp-shared" role="dialog" aria-modal="true" aria-label="获取共享建站">
          <div class="lp-shared__head">
            <span>获取共享建站</span>
            <button class="lp-shared__close" @click="sharedVisible = false">✕</button>
          </div>
          <div class="lp-shared__body">
            由于媒体接口不支持长时间拉取，若账户内资产数量极大<br />
            会导致同步十分缓慢，建议您输入关键词进行同步，减少<br />
            同步等待时间。
            <input v-model="sharedKeyword" class="lp-shared__input" type="text" />
          </div>
          <div class="lp-shared__foot">
            <button class="lp-btn lp-btn--plain" @click="sharedVisible = false">取 消</button>
            <button class="lp-btn lp-btn--primary" @click="onSharedConfirm">确 定</button>
          </div>
        </div>

        <!-- 复制到其他账户（手动填写 · 按账户分配） -->
        <BatchCopyAccountDialog
          v-model="copyVisible"
          :current-account="copyCurrentName"
          :tip="copyTip"
          :rows="copyRows"
          :width="512"
          success-text="落地页已覆盖至选中的账户"
          @confirm="onCopyConfirm"
        />
      </div>
    </template>
  </BatchDrawer>
</template>

<script setup>
import { computed, h, inject, reactive, ref, watch } from 'vue';
import { Close, Filter, Link, Search, Sort } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';
import BatchCopyAccountDialog from './BatchCopyAccountDialog.vue';
import spec from './spec/landing.spec.js';
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

const batch = inject('batch');
const {
  form,
  lpVisible,
  landingPages,
  selectedAccounts,
  onLandingSelect,
} = batch;

const visible = computed({
  get: () => (props.modelValue === undefined ? !!lpVisible.value : props.modelValue),
  set: (v) => {
    if (lpVisible) lpVisible.value = v;
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
/** 线上卡片区表头按钮的图标：快速选择 = mg-icon-quickselect，清空 = mg-icon-refresh-right */
function panelIcon(text) {
  if (text === '快速选择') return { d: icon('quickselect').d, color: '#606266' };
  return { d: icon('refreshRight').d, color: '#197afb' };
}

/** 线上：动态链接生成的链接模板（本地 mock） */
const LINK_TEMPLATES = ['通用链接模板', '618大促模板', '直播间跳转模板'];

/* 抽屉内表单值（默认值统一来自 spec.values） */
const v = reactive(Object.assign({}, spec.values));

const filter = reactive({ account: '', keyword: '' });
const checkedIds = ref([]);
const MANUAL_DEFAULT_URL = 'https://www.chengjizhanchan.com/tetris/page/7676317811270926362/';
const manualUrls = ref([MANUAL_DEFAULT_URL]);

/* ---- 橙子落地页（2026-11-27 线上图①②③④） ---- */
const LOOP_OPTIONS = [
  { value: 'OFF', label: '不开启' },
  { value: 'ON', label: '开启' },
];
/** 橙子落地页 / 橙子建站模板共用同一套「账户列 + 卡片 + 已选」骨架 */
const isOrange = computed(() => v.landing_page_type === 'ORANGE' || v.landing_page_type === 'ORANGE_SITE');
const isOSite = computed(() => v.landing_page_type === 'ORANGE_SITE');
/** 橙子建站模板：分项目 / 分广告 时整宽显示循环使用提示 */
const showOSiteLoopTip = computed(() => isOSite.value
  && (v.landing_page_rule === 'PER_PROJECT' || v.landing_page_rule === 'PER_AD'));
/** 循环使用账户 / 资产：橙子落地页、第三方落地页 + 按项目分配 / 按广告分配 */
const showLoopRow = computed(() => (v.landing_page_type === 'ORANGE' || v.landing_page_type === 'THIRDPARTY')
  && (v.landing_page_rule === 'PER_PROJECT' || v.landing_page_rule === 'PER_AD'));
const isThirdParty = computed(() => v.landing_page_type === 'THIRDPARTY');
const isAutoSelect = computed(() => isThirdParty.value && v.landing_select_way === 'AUTO');
const loopLabel = computed(() => (isThirdParty.value ? '循环使用资产' : '循环使用账户'));
/** 橙子落地页的账户列（线上：名称 + 账户ID 两行） */
const orangeAccounts = computed(() => (selectedAccounts.value || []).map((a, i) => ({
  id: a.id,
  name: a.name,
  displayId: String(a.accountId || (187375864950680 + i * 100000)),
})));
const accIndex = ref(0);
/** 手动填写：逐账户的落地页链接 */
const manualMap = reactive({});
watch(() => (selectedAccounts.value || []).map((a) => a.id), (ids) => {
  ids.forEach((id) => {
    if (manualMap[id] === undefined) manualMap[id] = MANUAL_DEFAULT_URL;
  });
}, { immediate: true });
const manualCur = computed(() => manualMap[orangeAccounts.value[accIndex.value]?.id] || '');
function onManualInput(val) {
  const id = orangeAccounts.value[accIndex.value]?.id;
  if (id) manualMap[id] = val;
}
/* 复制到其他账户（手动填写 · 按账户分配） */
const copyVisible = ref(false);
const copyCurrentName = computed(() => orangeAccounts.value[accIndex.value]?.name || '');
const copyRows = computed(() => orangeAccounts.value
  .filter((a, i) => i !== accIndex.value)
  .map((a) => ({ account: a.name, accountId: a.displayId })));
const copyTip = computed(() => `此操作将会把当前账户「${copyCurrentName.value}」在投的落地页覆盖至指定账户。`);
function openCopyAccounts() {
  copyVisible.value = true;
}
function onCopyConfirm(ids) {
  copyVisible.value = false;
  const val = manualCur.value;
  (ids || []).forEach((id) => { manualMap[id] = val; });
}
const allAccount = ref('');
const lpField = ref('name');
const lpKeyword = ref('');
/** 每个账户各自的已选（全部相同时共用一个 key） */
const checkedMap = reactive({});
const curKey = computed(() => (v.landing_page_rule === 'ALL'
  ? '__all'
  : (orangeAccounts.value[accIndex.value]?.id || '__all')));
const currentChecked = computed(() => checkedMap[curKey.value] || []);
watch(curKey, (k) => {
  if (!checkedMap[k]) checkedMap[k] = [];
}, { immediate: true });
/** 线上：项目数 / 广告数（按当前账户在投） */
const projectCount = computed(() => 1);
const adCount = computed(() => 1);
/** 切到橙子落地页时给账户下拉补默认值 */
watch([() => v.landing_page_type, () => selectedAccounts.value.length], () => {
  if (!allAccount.value && selectedAccounts.value && selectedAccounts.value[0]) {
    allAccount.value = selectedAccounts.value[0].id;
  }
}, { immediate: true });
const sharedVisible = ref(false);
const sharedKeyword = ref('');
function onSharedConfirm() {
  sharedVisible.value = false;
  ElMessage.success('已提交共享建站同步');
}

/* ---- 第三方落地页（2026-11-27 线上图：手动选择 / 自动选择） ---- */
const TP_PROJECTS = ['智投-美妆项目', '智投-漫剧项目', '智投-游戏项目'];
const TP_PAGES = [
  { id: 'tp1', title: '硬币见人心', remark: '', used: false, adCount: 0 },
  { id: 'tp2', title: 'hzb-dy8', remark: '', used: false, adCount: 0 },
  { id: 'tp3', title: '凤凰拐了战神爹', remark: '', used: true, adCount: 1 },
  { id: 'tp4', title: '秀域轰脂', remark: '', used: true, adCount: 4 },
  { id: 'tp5', title: '御赐的良缘', remark: '', used: true, adCount: 6 },
  { id: 'tp6', title: '奔旧等新', remark: '', used: true, adCount: 6 },
  { id: 'tp7', title: '振图zch10dy7', remark: '', used: true, adCount: 7 },
  { id: 'tp8', title: 'zch-dy8', remark: '', used: true, adCount: 11 },
  { id: 'tp9', title: 'zch-dy9', remark: '', used: true, adCount: 11 },
  { id: 'tp10', title: '青川辞', remark: '', used: true, adCount: 80 },
  { id: 'tp11', title: '晚风拂柳', remark: '', used: true, adCount: 3 },
];
const tpProject = ref('');
const tpAllowUnlinked = ref(true);
const tpOnlyUnlinked = ref(true);
const tpOnlyZero = ref(false);
const tpOnlyUnused = ref(false);
const tpRows = computed(() => {
  const kw = String(lpKeyword.value || '').trim().toLowerCase();
  return TP_PAGES.filter((p) => {
    if (tpOnlyZero.value && p.adCount !== 0) return false;
    if (tpOnlyUnused.value && p.used) return false;
    if (kw) {
      const t = String(lpField.value === 'remark' ? p.remark : p.title).toLowerCase();
      if (!t.includes(kw)) return false;
    }
    return true;
  });
});
function tpPageById(id) {
  return TP_PAGES.find((p) => p.id === id);
}
/** 跳转第三方落地页（本地 mock：与橙子同为巨量登录页） */
function openThirdPartySite() {
  window.open(ORANGE_LOGIN_URL, '_blank', 'noopener');
}


/** 当前 spec 字段表 */
const fieldMap = computed(() => {
  const m = {};
  (spec.sections || []).forEach((s) => (s.fields || []).forEach((f) => { m[f.key] = f; }));
  return m;
});
function fieldOf(key) {
  return fieldMap.value[key] || {};
}
/** 行间距 / 行高（线上实测） */
function gapOf(key) {
  const f = fieldOf(key);
  return f.gapAfter !== undefined ? f.gapAfter : 20;
}
function rowH(key) {
  const f = fieldOf(key);
  return f.rowHeight !== undefined ? f.rowHeight : 0;
}
/**
 * 线上「落地页类型」行高会随说明行出现而变（33 → 57 = 33 + tipHeight 24）
 */
function rowStyle(key) {
  const f = fieldOf(key);
  let h = f.rowHeight !== undefined ? f.rowHeight : 0;
  if (key === 'landing_page_type' && typeTip.value && f.tipHeight) h += f.tipHeight;
  return {
    marginBottom: gapOf(key) + 'px',
    minHeight: h ? h + 'px' : '0',
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

/** 线上：落地页类型下方的说明行 */
const typeTip = computed(() => {
  const tips = fieldOf('landing_page_type').tip || {};
  return tips[v.landing_page_type] || '';
});

/** 线上：落地页分配方式的选项随类型增减（optionVisibleWhen） */
const visibleRuleOptions = computed(() => {
  const f = fieldOf('landing_page_rule');
  const opts = f.options || [];
  const ov = f.optionVisibleWhen || {};
  return opts.filter((o) => {
    const cond = ov[o.value];
    if (!cond) return true;
    const actual = v[cond.field];
    if ('eq' in cond) return actual === cond.eq;
    if ('neq' in cond) return actual !== cond.neq;
    if ('in' in cond) return (cond.in || []).indexOf(actual) >= 0;
    if ('notIn' in cond) return (cond.notIn || []).indexOf(actual) < 0;
    return true;
  });
});

/** 线上：各落地页类型对应的面板 */
const typePanel = computed(() => (spec.typePanels || {})[v.landing_page_type]
  || { headTitle: '', head: [], jump: '', panel: [], extraTip: '' });

/** 每个广告配置的落地页链接数量 */
const linkCount = computed(() => Math.max(1, Number(v.per_ad_count) || 1));

/** 最多可选数量 */
const maxCount = computed(() => linkCount.value);

/** 落地页资产列表 */
const filteredPages = computed(() => {
  const rows = landingPages.value || [];
  // 橙子建站模板：线上拉取的是「模板」资产，当前账户无模板 → 空态
  if (isOSite.value) return [];
  if (isOrange.value) {
    const kw = String(lpKeyword.value || '').trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((p) => String(lpField.value === 'remark' ? (p.remark || '') : (p.title || '')).toLowerCase().includes(kw));
  }
  const kw = String(filter.keyword || '').trim().toLowerCase();
  if (!kw) return rows;
  return rows.filter((p) => `${p.title || ''} ${p.url || ''}`.toLowerCase().includes(kw));
});

function pageById(id) {
  return (landingPages.value || []).find((p) => p.id === id);
}

function onTypeChange(o) {
  if (o.disabled) return;
  v.landing_page_type = o.value;
  // 线上：类型变化后，分配方式里被隐藏的选项自动回退
  const allowed = visibleRuleOptions.value.map((x) => x.value);
  if (allowed.indexOf(v.landing_page_rule) < 0) {
    v.landing_page_rule = allowed[0] || 'ALL';
  }
  if (o.value === 'MANUAL') syncManualUrls();
}

function onManualUrl(i, val) {
  manualUrls.value[i] = val;
}
function syncManualUrls() {
  const n = linkCount.value;
  const old = Array.isArray(manualUrls.value) ? manualUrls.value.slice() : [];
  const cur = old[0] || form?.landing?.landing_page_url || '';
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(old[i] !== undefined ? old[i] : (i === 0 ? cur : ''));
  manualUrls.value = out;
}

function onSearch() { /* 线上：查询后刷新列表 */ }
function clearFilter() {
  filter.account = '';
  filter.keyword = '';
}
function currentList() {
  const k = curKey.value;
  if (!checkedMap[k]) checkedMap[k] = [];
  return checkedMap[k];
}
function toggleChecked(id) {
  if (isOrange.value || isThirdParty.value) {
    const list = currentList();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.push(id);
    return;
  }
  const i = checkedIds.value.indexOf(id);
  if (i >= 0) checkedIds.value.splice(i, 1);
  else checkedIds.value.push(id);
}
function removePicked(id) {
  if (isOrange.value || isThirdParty.value) {
    const list = currentList();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    return;
  }
  checkedIds.value = checkedIds.value.filter((x) => x !== id);
}
function clearAll() {
  if (isOrange.value || isThirdParty.value) {
    checkedMap[curKey.value] = [];
    return;
  }
  checkedIds.value = [];
}
function clearAllAccounts() {
  Object.keys(checkedMap).forEach((k) => { checkedMap[k] = []; });
}
/** 卡内「快速选择」：选中当前账户列表里的落地页（受上限约束） */
function quickSelect() {
  const list = isThirdParty.value ? tpRows.value : filteredPages.value;
  const ids = list.map((p) => p.id).slice(0, maxCount.value);
  checkedMap[curKey.value] = ids;
}
/** 「多账户快速选择」：每个账户都按上限快速选 */
function quickSelectAll() {
  (orangeAccounts.value || []).forEach((a) => {
    checkedMap[a.id] = (isThirdParty.value ? tpRows.value : filteredPages.value).map((p) => p.id).slice(0, maxCount.value);
  });
}
function onOrangeRefresh() {
  ElMessage.success('已刷新');
}
/** 跳转橙子建站 */
const ORANGE_LOGIN_URL = 'https://ad.oceanengine.com/pages/login/index.html';
function openOrangeSite() {
  window.open(ORANGE_LOGIN_URL, '_blank', 'noopener');
}

/** 线上按钮的视觉分类（线上 .operate-button 内 el-button 变体） */
function headBtnClass(b) {
  if (b === '多账户刷新' || b === '多账户快速选择') return 'lp-btn--primary';
  if (b === '获取共享建站' || b === '清空所有资产') return 'lp-btn--border';
  return '';
}
function onPanelBtn(b) {
  if (b === '快速选择') {
    checkedIds.value = filteredPages.value.map((p) => p.id);
  } else if (b === '清空' || b === '清空所有资产') {
    checkedIds.value = [];
  }
}

watch(() => v.per_ad_count, () => {
  if (isVisible('manual_url')) syncManualUrls();
});

/** 已确认过的抽屉值（回显用）；未确认过时用线上默认值 */
const confirmed = { done: false };

watch(visible, (val) => {
  if (val) {
    const l = confirmed.done ? (form?.landing || {}) : {};
    v.per_ad_count = String(l.per_ad_count ?? 1);
    v.landing_page_type = l.landing_page_type || 'MANUAL';
    v.landing_page_rule = l.landing_page_rule || 'ALL';
    filter.account = '';
    filter.keyword = '';
    checkedIds.value = l.landing_page_id ? [l.landing_page_id] : [];
    syncManualUrls();
  }
}, { immediate: true });

function onConfirm() {
  confirmed.done = true;
  const l = form.landing;
  l.per_ad_count = Number(v.per_ad_count) || 1;
  l.landing_page_type = v.landing_page_type;
  l.landing_page_rule = v.landing_page_rule;
  if (v.landing_page_type === 'MANUAL') {
    const url = v.landing_page_rule === 'PER_ACCOUNT'
      ? (manualCur.value || '').trim()
      : ((manualUrls.value || []).find((u) => String(u || '').trim()) || '');
    l.landing_page_url = url;
    l.landing_page_name = url ? '手动填写落地页' : '';
    if (url) {
      const exist = (landingPages.value || []).find((p) => p.url === url);
      const id = exist ? exist.id : `lp_manual_${Date.now()}`;
      if (!exist) {
        landingPages.value.push({ id, type: 'landing_page', title: '手动填写落地页', url, platform_status: 'available' });
      }
      l.landing_page_id = id;
    } else {
      l.landing_page_id = null;
    }
  } else if (v.landing_page_type === 'DYNAMIC') {
    l.landing_page_id = null;
  } else if (isOrange.value) {
    const first = Object.keys(checkedMap).reduce((acc, k) => acc || (checkedMap[k] || [])[0], null);
    l.landing_page_id = first || null;
    l.loop_account = v.loop_account;
    if (first) onLandingSelect(first);
  } else if (isThirdParty.value) {
    const cur = checkedMap[curKey.value] || [];
    const first = cur[0] || Object.keys(checkedMap).reduce((acc, k) => acc || (checkedMap[k] || [])[0], null);
    l.landing_page_id = first || null;
    l.loop_account = v.loop_account;
  } else {
    const id = checkedIds.value[0] || null;
    l.landing_page_id = id;
    if (id) onLandingSelect(id);
  }
  visible.value = false;
}
function onClose() {
  visible.value = false;
}
</script>

<style>
/* ===== 线上 cl-drawer 外壳微调（BatchDrawer.vue 提供基础版式） =====
   线上实测（落地页抽屉）：
     .drawer-header   h=49；标题 .header-title「选择落地页」16px/700/#333 lh48
     .drawer-content  x=920 y=65 w=984 h=932  margin 16px padding 16px 白底 1px #e8eaec radius 3px
     .drawer-footer   x=904 y=1010 w=1016 h=70  absolute bottom:0  padding 12px 16px 24px
     页脚按钮 88×32 12px/500；取 消 x=1712 确 定 x=1816（间距 16） */
.cl-drawer:has(.lp-root) .cl-drawer__header {
  box-sizing: border-box;
  height: 49px;
  padding: 0 16px;
}
.cl-drawer:has(.lp-root) .cl-drawer__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 48px;
  color: #333;
}
.cl-drawer:has(.lp-root) .cl-drawer__content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  box-sizing: border-box;
  height: calc(100vh - 148px);
  flex: none;
}
.cl-drawer:has(.lp-root) .cl-drawer__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  padding: 12px 16px 24px;
  align-items: flex-start;
}
.cl-drawer:has(.lp-root) .cl-drawer__footer .lp-btn {
  width: 88px;
  height: 32px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 3px;
}
</style>

<style scoped>
/* ===== 表单行（线上 el-form content-table el-form--label-left） =====
   线上：label 宽 140px 14px #666 lh32 padding-right 12px；内容 margin-left 140px */
/* 线上元素尺寸按 border-box 计（输入框 32px / 标签 140px） */
.lp-root, .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
/* 内联 iconfont 复刻图标 */
.cl-ico { vertical-align: -2px; flex: none; }
.lp-root { width: 100%; }
.lp-form { width: 100%; }
.lp-row { display: flex; align-items: flex-start; }
.lp-row__label {
  flex: 0 0 140px;
  width: 140px;
  padding-right: 12px;
  font-size: 14px;
  line-height: 32px;
  color: #666;
}
.lp-row__label--req::before { content: '*'; margin-right: 4px; color: #f53f3f; }
.lp-row__content { flex: 1; min-width: 0; }

/* 单选按钮组（线上 el-radio-button：min-width 80px / padding 9px 12px） */
.lp-rgroup { display: flex; align-items: center; flex-wrap: wrap; }
.lp-rbtn {
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
  position: relative;
  top: 1px;
}
.lp-rbtn:first-child { border-radius: 3px 0 0 3px; }
/* 线上 Element UI：非首项 border-left:0（宽 0），相邻项紧贴无负 margin */
.lp-rbtn + .lp-rbtn { border-left-width: 0; }
.lp-rbtn:last-child { border-radius: 0 3px 3px 0; }
.lp-rbtn.is-active { color: #197afb; background: #d6eaff; border-color: #197afb; z-index: 1; }
.lp-rbtn:disabled { color: #c0c4cc; background: #fff; border-color: #ebeef5; cursor: not-allowed; }

/* 说明行（线上 .form-item-tips：12px #999，行高 24px） */
.lp-tip { width: 100%; margin-top: 1px; font-size: 12px; line-height: 24px; color: #999; }

/* 每个广告配置 */
.lp-num {
  width: 80px;
  height: 32px;
  margin-right: 8px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.lp-unit { font-size: 14px; color: #606266; }

/* 手动填写 */
/* 线上右侧面板 form.right-panel 实测宽 640 */
.lp-manual { margin-top: 0; width: 640px; }
.lp-input {
  height: 32px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.lp-input--wide { width: 500px; }

/* 选择 */
.lp-select {
  height: 32px;
  padding: 0 10px;
  font-size: 14px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  background: #fff;
}
.lp-select--wide { width: 480px; }
.lp-select--acct { width: 480px; }

/* 按钮 */
.lp-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.lp-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.lp-btn--plain { color: #606266; background: #fff; border-color: #d0d0d0; }
.lp-btn--border { color: #197afb; background: #fff; border-color: #197afb; }
.lp-btn--text { color: #197afb; background: transparent; border-color: transparent; }
.lp-btn--quickselect { color: #606266; background: #fff; border-color: #dcdfe6; }
.lp-btn--copy { margin-left: 8px; }
.lp-btn--sm { height: 28px; font-size: 12px; }
.lp-btn:disabled { color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed; cursor: not-allowed; }
.lp-link { font-size: 12px; color: #197afb; background: none; border: none; padding: 0; cursor: pointer; }
.lp-ico { margin-right: 4px; }

/* 资产面板 */
.lp-asset { margin-top: 16px; }
.lp-asset__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.lp-asset__title { font-size: 14px; font-weight: 600; color: #1d2129; }
.lp-asset__ops { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lp-asset__right { width: 100%; }
.lp-panelbtns { display: flex; gap: 8px; margin-top: 8px; }

.lp-searchrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.lp-search {
  width: 360px;
  height: 32px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}

.lp-list { border: 1px solid #e5e6eb; border-radius: 4px; margin-bottom: 12px; }
.lp-list__head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  font-size: 13px;
  color: #4e5969;
  border-bottom: 1px solid #f2f3f5;
}
.lp-table-header-title { width: 220px; color: #86909c; font-size: 12px; }
.lp-list__ops { margin-left: auto; display: flex; gap: 8px; }
.lp-list__body { max-height: 260px; overflow-y: auto; padding: 8px 16px; }
.lp-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1d2129; padding: 4px 0; }
.lp-item__name { width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-item__url { width: 320px; color: #86909c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-item__status { width: 120px; }
.lp-item__preview { font-size: 12px; color: #197afb; cursor: pointer; }
.lp-empty { padding: 24px 0; text-align: center; font-size: 13px; color: #86909c; }

.lp-picked { border: 1px solid #e5e6eb; border-radius: 4px; }
.lp-picked__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 13px;
  color: #4e5969;
}
.lp-picked__num { color: #197afb; }
.lp-picked__body { max-height: 180px; overflow-y: auto; padding: 0 16px 12px; }
.lp-picked__row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #1d2129; }
.lp-picked__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-picked__x { cursor: pointer; color: #86909c; }

.lp-extra { margin-top: 12px; font-size: 12px; color: #999; }

/* ===== 橙子落地页（2026-11-27 线上图①②③④） ===== */
.lp-orange { display: flex; align-items: stretch; gap: 8px; }
.lp-orange__accs {
  flex: 0 0 148px;
  width: 148px;
  border: 1px solid #e5e6eb;
  border-radius: 3px;
  overflow: hidden;
  background: #fff;
}
.lp-orange__acc {
  height: 56px;
  padding: 8px 8px;
  border-bottom: 1px solid #e5e6eb;
  cursor: pointer;
}
.lp-orange__acc:last-child { border-bottom: none; }
.lp-orange__acc.is-active { background: #eef4ff; }
.lp-orange__accname {
  display: block;
  font-size: 13px;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lp-orange__acc.is-active .lp-orange__accname { color: #197afb; }
.lp-orange__accid { display: block; margin-top: 4px; font-size: 12px; color: #86909c; }
.lp-orange__main { flex: 1; min-width: 0; }

.lp-ocard { border: 1px solid #e5e6eb; border-radius: 3px; background: #fff; }
.lp-ocard__head {
  height: 44px; padding: 0 12px;
  display: flex; align-items: center;
}
.lp-ocard__title { font-size: 13px; color: #1d2129; }
.lp-ocard__ops { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.lp-ocard__acctrow { padding: 0 12px 10px; display: flex; align-items: center; gap: 10px; }
.lp-select--acctwide { width: 100%; max-width: 420px; height: 32px; }
.lp-ocard__refresh { font-size: 13px; }
.lp-ocard__search { padding: 0 12px 10px; display: flex; align-items: center; gap: 8px; }
.lp-select--name { width: 96px; height: 32px; flex: none; }
.lp-search--grow { flex: 1; min-width: 0; width: auto; height: 32px; }
.lp-iconbtn {
  width: 32px; height: 32px; flex: none;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #dcdfe6; border-radius: 2px; background: #fff; cursor: pointer;
}
.lp-iconbtn:hover { border-color: #197afb; }
.lp-ocard__jump {
  margin-left: auto; flex: none;
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #197afb; cursor: pointer;
}
.lp-ocard__sum {
  padding: 0 12px 10px;
  display: flex; align-items: center; gap: 16px;
  font-size: 12px; color: #4e5969;
}
.lp-ocard__sum .lp-btn--quickselect { margin-left: auto; }

.lp-otable { border-top: 1px solid #e5e6eb; }
.lp-otable__head {
  height: 40px; padding: 0 12px;
  display: flex; align-items: center;
  font-size: 12px; color: #4e5969;
  border-bottom: 1px solid #e5e6eb;
}
.lp-otable__head .el-icon, .lp-otable__head .cl-ico { margin-left: 2px; color: #c9cdd4; }
.lp-otable__body { min-height: 348px; max-height: 420px; overflow-y: auto; }
.lp-otable__row {
  height: 44px; padding: 0 12px;
  display: flex; align-items: center;
  font-size: 13px; color: #1d2129;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}
.lp-otable__row:hover { background: #f7f8fa; }
.lp-otable__row.is-checked { background: #eef4ff; }
.lp-otable__c1 { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-otable__c2 { width: 108px; flex: none; color: #4e5969; }
.lp-otable__c3 { width: 96px; flex: none; color: #4e5969; }
.lp-oempty { padding: 96px 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.lp-oempty__txt { font-size: 12px; color: #86909c; }

.lp-ocard__pager {
  height: 40px; display: flex; align-items: center; justify-content: flex-end; gap: 6px;
  padding: 0 12px; font-size: 12px; color: #86909c;
}
.lp-pager__ico { color: #c9cdd4; cursor: pointer; }
.lp-pager__page {
  min-width: 24px; height: 24px; line-height: 22px; text-align: center;
  border: 1px solid #e5e6eb; border-radius: 2px; color: #1d2129;
}
.lp-ocard__hint { padding: 0 12px 12px; font-size: 12px; color: #86909c; }

.lp-opicked {
  flex: 0 0 200px; width: 200px;
  border: 1px solid #e5e6eb; border-radius: 3px; background: #fff;
  display: flex; flex-direction: column;
}
.lp-opicked__head {
  height: 40px; padding: 0 10px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; color: #4e5969;
  border-bottom: 1px solid #f2f3f5;
}
.lp-opicked__head b { color: #1d2129; font-weight: 500; }
.lp-opicked__body { flex: 1; min-height: 260px; overflow-y: auto; padding: 8px 10px; }
.lp-opicked__row { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 0; font-size: 12px; color: #1d2129; }
.lp-opicked__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 循环使用账户 */
.lp-looprow { margin-bottom: 20px; }
.lp-loop-tip {
  margin-top: 8px;
  padding: 7px 10px;
  background: #fff8e8;
  border: 1px solid #ffe4b5;
  border-radius: 2px;
  font-size: 12px; line-height: 18px; color: #ff7d00;
}
.lp-loop-tip__ico {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; margin-right: 4px; border-radius: 50%;
  background: #ff7d00; color: #fff; font-size: 10px; vertical-align: 1px;
}

.lp-loop-tip--wide {
  margin: 0 0 10px;
  padding: 8px 12px;
}
/* 橙子建站模板：账户项右侧单选圈 */
.lp-orange__acc { position: relative; }
.lp-oradio {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  display: inline-flex; color: #c9cdd4;
}
.lp-oradio.is-on { color: #197afb; }
.lp-orange__acc .lp-orange__accname { padding-right: 18px; }
/* 橙子建站模板：卡片无卡头，搜索行贴顶 */
.lp-ocard--plain .lp-ocard__search { padding-top: 12px; }
.lp-otable__c2--sorting .el-icon { color: #197afb; }

/* ===== 第三方落地页（2026-11-27 线上图） ===== */
.lp-searchgroup { flex: 1; min-width: 0; display: flex; }
.lp-searchgroup .lp-search--grow { border-right: none; border-radius: 2px 0 0 2px; }
.lp-iconbtn--joined { border-left: none; border-radius: 0; }
.lp-iconbtn--joined:last-child { border-radius: 0 2px 2px 0; }
.lp-tpcard__head {
  height: 44px; padding: 0 12px;
  display: flex; align-items: center;
  border-bottom: 1px solid #e5e6eb;
}
.lp-tpcard__title { font-size: 13px; color: #1d2129; }
.lp-tpcard__row {
  padding: 7px 12px;
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid #f2f3f5;
}
.lp-select--full { width: 100%; height: 32px; }
.lp-tpcard__sum { font-size: 12px; color: #4e5969; gap: 16px; }
.lp-tpcard__sum .lp-btn--quickselect { margin-left: auto; }
.lp-tpcard__filters { gap: 24px; font-size: 12px; color: #4e5969; }
.tp-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.tp-check__box { width: 14px; height: 14px; accent-color: #197afb; }
.tp-check__blue { color: #197afb; }
.tp-check__info {
  width: 14px; height: 14px; border: 1px solid #c9cdd4; border-radius: 50%;
  color: #86909c; font-size: 10px;
  display: inline-flex; align-items: center; justify-content: center;
}
.tp-check--auto { margin-top: 22px; font-size: 12px; color: #1d2129; }
.tp-check--auto .tp-check__box { width: 15px; height: 15px; margin: 0; accent-color: #546ef7; }
.tp-check--auto.is-on span { color: #546ef7; }
.lp-tpauto__desc {
  margin-top: 6px; font-size: 12px; line-height: 20px; color: #1d2129;
  white-space: nowrap;
}
.lp-tptable { border-top: 1px solid #e5e6eb; }
.lp-tptable__head {
  height: 40px; padding: 0 12px;
  display: flex; align-items: center;
  font-size: 12px; color: #4e5969;
  border-bottom: 1px solid #e5e6eb;
}
.lp-tptable__head .el-icon { margin-left: 2px; color: #c9cdd4; }
.lp-tptable__body { min-height: 264px; max-height: 300px; overflow-y: auto; }
.lp-tptable__row {
  height: 34px; padding: 0 12px;
  display: flex; align-items: center;
  font-size: 12px; color: #1d2129;
  border-bottom: 1px solid #f7f8fa;
  cursor: pointer;
}
.lp-tptable__row:hover { background: #f7f8fa; }
.lp-tptable__row.is-checked { background: #eef4ff; }
.lp-tpc { display: flex; align-items: center; gap: 2px; min-width: 0; }
.lp-tpc--check { width: 28px; flex: none; }
.lp-tpc--name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-tpc--remark { width: 120px; flex: none; color: #86909c; }
.lp-tpc--status { width: 88px; flex: none; color: #4e5969; }
.lp-tpc--ad { width: 96px; flex: none; }
.tp-box {
  width: 14px; height: 14px; border: 1px solid #dcdfe6; border-radius: 2px;
  background: #fff; display: inline-flex; align-items: center; justify-content: center;
}
.tp-box.is-on { background: #197afb; border-color: #197afb; }
.tp-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.tp-dot.is-idle { background: #00b42a; }
.tp-dot.is-used { background: #f53f3f; }
.tp-adnum { margin-right: 8px; }
.tp-preview { font-size: 12px; }
.lp-tpcard__pager {
  height: 40px; padding: 0 12px;
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #197afb;
}
.lp-tpcard__pager .lp-pager__ico { color: #197afb; }
.lp-tpcard__pager .lp-pager__page { border: none; color: #197afb; }

/* ===== 手动填写（2026-11-27 线上图） ===== */
.lp-btn--copy { margin-left: auto; }
.lp-rulerow { display: flex; align-items: center; width: 100%; }
.lp-manual__inner { display: flex; align-items: stretch; }
.lp-manual__inner.is-accs .lp-manual__main { padding-left: 24px; }
.lp-manual__inner.is-accs .lp-manual__label { width: 120px; }
.lp-manual__accs {
  flex: 0 0 148px; width: 148px;
  background: #f7f8fa;
  min-height: 470px;
}
.lp-manual__acc {
  position: relative;
  height: 56px; padding: 8px 8px;
  border-bottom: 1px solid #fff;
  cursor: pointer;
}
.lp-manual__accname {
  display: block; padding-right: 18px;
  font-size: 13px; color: #1d2129;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.lp-manual__acc.is-active .lp-manual__accname { color: #197afb; }
.lp-manual__accid { display: block; margin-top: 4px; font-size: 12px; color: #86909c; }
.lp-manual__ok {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  display: inline-flex; line-height: 0;
}
.lp-manual__main { flex: 1; min-width: 0; }
.lp-manual__row { display: flex; align-items: flex-start; }
.lp-manual__label { width: 140px; flex: none; font-size: 14px; color: #666; line-height: 32px; }
.lp-manual__input {
  width: 470px; max-width: 100%; height: 32px; padding: 0 10px;
  border: 1px solid #dcdfe6; border-radius: 2px;
  font-size: 13px; color: #1d2129; outline: none;
}
.lp-manual__input:focus { border-color: #197afb; }

/* 获取共享建站 */
.lp-shared-mask { position: fixed; inset: 0; z-index: 2300; background: rgba(0, 0, 0, .5); }
.lp-shared {
  position: fixed; left: 50%; top: 50%; z-index: 2301;
  width: 444px; transform: translate(-50%, -50%);
  background: #fff; border-radius: 4px;
  box-shadow: 0 12px 32px 4px rgba(0, 0, 0, .36);
  font-size: 13px; color: #4e5969;
}
.lp-shared__head {
  position: relative; height: 44px; padding: 0 16px;
  display: flex; align-items: center;
  border-bottom: 1px solid #ebedf0;
  font-size: 14px; color: #1d2129;
}
.lp-shared__close {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  border: none; background: none; font-size: 14px; color: #86909c; cursor: pointer;
}
.lp-shared__body { padding: 16px; font-size: 13px; line-height: 22px; }
.lp-shared__input {
  width: 100%; height: 32px; margin-top: 12px; padding: 0 10px;
  border: 1px solid #197afb; border-radius: 2px; outline: none;
}
.lp-shared__foot { display: flex; justify-content: flex-end; gap: 8px; padding: 0 16px 16px; }

/* 页脚（线上 .dialog-footer：按钮右对齐 88×32，间距 16） */
.lp-footer { display: flex; justify-content: flex-end; gap: 16px; width: 100%; }
</style>
