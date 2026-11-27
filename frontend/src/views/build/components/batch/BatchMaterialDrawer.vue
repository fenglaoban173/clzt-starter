<template>
  <!--
    创意素材抽屉（1:1 复刻线上 cl.mobgi.com「程序化批量/巨量广告」→ 创意素材列底「编辑」）

    线上基准（2026-11-26 实测，1920×1080 视口；证据 C:/tmp/verify/diff/）：
      外壳  .cl-drawer  x=904 w=1016 h=1080  右侧固定  底色 #f0f2f5  阴影 rgba(0,0,0,.2) -8px 0 8px
      头部  .drawer-header  x=904 y=0 w=1016 h=50  白底  padding 0 16px  下边框 1px #e8eaec
            头部里是 simple-tabs 页签「手动选取素材 / 动态选取素材」（**没有标题文字**）
            页签项 116×50，x=920 / x=1036；文字 16px/700；激活 #197afb，未激活 #666
            激活下划线 96×2 位于 y=48
      内容  .drawer-content  x=920 y=66 w=984 h=932  白底  1px #e8eaec  radius 3px  padding 16px
      底部  .drawer-footer  x=904 y=1010 w=1016 h=70  白底  上边框 1px #e8eaec  padding 12px 16px 24px
            按钮：取消 / 确 定   各 88×32，12px
      关闭键 .drawer-close  x=872 y=10 32×32（抽屉左侧外）
      表单   form.el-form.ml32-mr48.el-form--label-left
            label 宽 150px（14px #666 lh32），右侧内容 margin-left 150px
      控件   el-radio-button__inner / el-checkbox-button__inner：
            min-width 80px / height 32px / padding 9px 12px / 12px
            radio 选中 = 浅蓝底 #d6eaff + 蓝字；checkbox 选中 = 实心蓝底 #197afb + 白字

    依赖关系全部走 spec/material.spec.js + spec/resolve.js，模板里不写散落的 v-if 判定。
  -->
  <BatchDrawer
    v-model="visible"
    :title="''"
    :width="spec.geometry.drawer.width"
    :cancel-text="spec.footer.cancelText"
    :ok-text="spec.footer.okText"
    @close="onClose"
    @ok="onConfirm"
  >
    <template #footer>
      <div class="mat-footer">
        <button class="mat-btn mat-btn--plain" @click="onClose">取消</button>
        <button class="mat-btn mat-btn--primary" @click="onConfirm">确 定</button>
      </div>
    </template>
    <template #content>
      <div class="mat-root">
        <!-- 线上头部是 simple-tabs（不是标题文字） -->
        <div class="mat-tabs">
          <div
            v-for="t in spec.headerTabs"
            :key="t.value"
            class="mat-tabs__item"
            :class="{ 'is-active': matTab === t.value }"
            @click="onTabChange(t.value)"
          >
            <span class="mat-tab__text">{{ t.label }}</span>
          </div>
        </div>

        <!-- ① 手动选取素材 -->
        <div v-show="matTab === 'manual'" class="mat-pane">
          <div class="mat-form">
            <!-- 多账户分配规则（卡片三选一） -->
            <div class="mat-row" :style="rowStyle('assign_rule')">
              <div class="mat-row__label">多账户分配规则</div>
              <div class="mat-row__content">
                <div class="mat-cards">
                  <div
                    v-for="o in fieldOf('assign_rule').options"
                    :key="o.value"
                    class="mat-card"
                    :class="{ 'is-active': v.assign_rule === o.value }"
                    @click="v.assign_rule = o.value"
                  >
                    <p class="mat-card__title">{{ o.label }}</p>
                    <p class="mat-card__desc">{{ o.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 视频上传至 -->
            <div class="mat-row" :style="rowStyle('upload_scope')">
              <div class="mat-row__label">视频上传至</div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in fieldOf('upload_scope').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.upload_scope === o.value }"
                    @click="onUploadScope(o.value)"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 组织账户（线上：始终显示；组织账户下拉右侧跟一个共享提示 alert） -->
            <div v-if="isVisible('org_account')" class="mat-row" :style="rowStyle('org_account')">
              <div class="mat-row__label mat-row__label--req">组织账户</div>
              <div class="mat-row__content">
                <el-select v-model="v.org_account" class="mat-org-select" placeholder="请选择组织账户">
                  <el-option v-for="o in fieldOf('org_account').options" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                <div v-if="isVisible('org_share_tip')" class="mat-alert">
                  <ClIcon class="mat-alert__icon" :d="icon('question2').d" :size="16" color="#ff9b48" />
                  <span class="mat-alert__text">{{ fieldOf('org_share_tip').text }}</span>
                  <el-button link type="primary" class="mat-alert__link" @click="openEbpVideo">{{ fieldOf('org_share_tip').linkText }}</el-button>
                </div>
              </div>
            </div>

            <!-- 主页可见 -->
            <div class="mat-row" :style="rowStyle('home_visibility')">
              <div class="mat-row__label">主页可见<el-tooltip :content="bubbleOf('home_visibility')" placement="top" :show-after="200">
                  <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                </el-tooltip>
              </div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in fieldOf('home_visibility').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.home_visibility === o.value }"
                    @click="v.home_visibility = o.value"
                  >{{ o.label }}</button>
                </div>
                <div class="mat-tip mat-tip--warn mat-tip--lh32">{{ fieldOf('home_visibility').tip }}</div>
              </div>
            </div>

            <!-- 区分素材版式（按钮式勾选，选中 = 实心蓝底白字） -->
            <div class="mat-row" :style="rowStyle('separate_layout')">
              <div class="mat-row__label">区分素材版式</div>
              <div class="mat-row__content">
                <div class="mat-cgroup">
                  <button
                    v-for="o in fieldOf('separate_layout').options"
                    :key="o.value"
                    class="mat-cbtn"
                    :class="{ 'is-active': isLayoutOn(o.value), 'is-layout': o.value !== 'OFF' }"
                    @click="toggleLayout(o.value)"
                  >{{ o.label }}</button>
                </div>
                <!-- 线上：多账户分配规则 = 分账户选择 时，右侧多出「分账户配置」勾选 -->
                <label v-if="isVisible('per_account_config')" class="mat-acct-cb">
                  <input type="checkbox" :checked="v.per_account_config" @change="v.per_account_config = !v.per_account_config" />
                  <span>{{ fieldOf('per_account_config').text }}</span>
                </label>
              </div>
            </div>

            <!-- 每个创意组配置 -->
            <div class="mat-row" :style="rowStyle('group_config')">
              <div class="mat-row__label">每个创意组配置<el-tooltip :content="bubbleOf('group_config')" placement="top" :show-after="200">
                  <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                </el-tooltip>
              </div>
              <div class="mat-row__content">
                <div class="mat-gcount">
                  <div v-for="it in groupCountItems" :key="it.value" class="mat-gcount__item">
                    <div class="mat-gcount__box">
                      <span class="mat-gcount__pre">{{ it.label }}</span>
                      <input
                        class="mat-gcount__input"
                        type="text"
                        :value="v.group_counts[it.value]"
                        @input="onGroupCount(it.value, $event.target.value)"
                      />
                    </div>
                    <el-tooltip :content="lockTipOf(it)" placement="top" :show-after="200">
                      <ClIcon class="mat-lock" :d="icon('lock2').d" :size="14" color="#197afb" />
                    </el-tooltip>
                  </div>
                </div>
                <div class="mat-tip mat-tip--lh32 mat-tip--mt8">{{ fieldOf('group_config').tip }}</div>
              </div>
            </div>

            <!-- 统一配置创意组名 -->
            <div class="mat-row" :style="rowStyle('group_name_template')">
              <div class="mat-row__label">统一配置创意组名<el-tooltip :content="bubbleOf('group_name_template')" placement="top" :show-after="200">
                  <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                </el-tooltip>
              </div>
              <div class="mat-row__content">
                <div class="mat-kw-row">
                  <input
                    class="mat-kw-input"
                    type="text"
                    :value="v.group_name_template"
                    @input="v.group_name_template = $event.target.value"
                  />
                  <button
                    class="mat-btn mat-btn--primary mat-btn--sm mat-btn--w80 mat-kw-apply"
                    :disabled="!v.group_name_template"
                    @click="applyGroupName"
                  >统一配置</button>
                </div>
                <div class="mat-wildcards">
                  <span class="mat-wildcards__label">通配符:</span>
                  <el-tooltip
                    v-for="w in fieldOf('group_name_template').wildcards"
                    :key="w.label"
                    :content="w.text"
                    placement="top"
                    :show-after="200"
                  >
                    <button class="mat-link" @click="appendGroupWildcard(w.label)">
                      <ClIcon class="mat-plus" :d="icon('plus').d" :size="12" color="#197afb" />{{ w.label }}
                    </button>
                  </el-tooltip>
                  <el-dropdown trigger="click" @command="appendGroupWildcard">
                    <span class="mat-more">
                      <ClIcon class="mat-plus" :d="icon('insert').d" :size="12" color="#2681fc" />{{ fieldOf('group_name_template').moreText }}
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-for="w in groupMoreWildcards" :key="w" :command="w">+{{ w }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>

            <!-- 引导视频 -->
            <div class="mat-row" :style="rowStyle('guide_video')">
              <div class="mat-row__label">引导视频<el-tooltip :content="bubbleOf('guide_video')" placement="top" :show-after="200">
                  <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                </el-tooltip>
              </div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in fieldOf('guide_video').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.guide_video === o.value }"
                    @click="v.guide_video = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 分账户选择：账户切换条（线上位于「引导视频」之后、「创意制作」之前） -->
            <div v-if="isPerAccount" class="mat-acctbar">
              <button
                class="mat-acctbar__nav"
                :disabled="acctIndex === 0"
                @click="acctIndex = Math.max(0, acctIndex - 1)"
              >‹</button>
              <div class="mat-acctbar__list">
                <button
                  v-for="(a, i) in materialAccounts"
                  :key="a.accountId || i"
                  class="mat-acctbar__item"
                  :class="{ 'is-active': i === acctIndex }"
                  @click="acctIndex = i"
                >账户{{ i + 1 }}：{{ a.account }}-在投</button>
              </div>
              <button
                class="mat-acctbar__nav"
                :disabled="acctIndex >= materialAccounts.length - 1"
                @click="acctIndex = Math.min(materialAccounts.length - 1, acctIndex + 1)"
              >›</button>
            </div>
          </div>

          <!-- 创意制作 -->
          <div class="mat-creative">
            <div class="mat-creative__head">
              <div class="mat-creative__title">
                <span class="mat-group-label">创意制作</span>
                <span class="mat-group-count">(创意组数量：{{ form.materials.creative_groups.length }})</span>
              </div>
              <div class="mat-creative__tools">
                <el-tooltip content="请完成素材添加后再进行此操作" placement="top" :show-after="200">
                  <span>
                    <button class="mat-btn mat-btn--text mat-btn--sm" :disabled="isDisabled('shuffle_btn')" @click="shuffleGroups">乱序</button>
                  </span>
                </el-tooltip>
                <button class="mat-btn mat-btn--text mat-btn--sm" @click="onClearMaterials">清空</button>
                <el-dropdown trigger="click">
                  <button class="mat-btn mat-btn--default mat-btn--sm">
                    更多菜单<ClIcon class="mat-caret" :d="icon('caret').d" :size="12" color="#666" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="m in manualTab.toolbarMore" :key="m" @click="onMoreMenu(m)">{{ m }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <button class="mat-btn mat-btn--border mat-btn--primary mat-btn--sm mat-btn--w80" @click="randomPick">随机选择</button>
                <button class="mat-btn mat-btn--border mat-btn--primary mat-btn--sm mat-btn--w80" @click="smartPick">智能优选</button>
                <button class="mat-btn mat-btn--border mat-btn--primary mat-btn--sm mat-btn--w80" @click="refreshGroups">一键测新</button>
                <el-dropdown trigger="click">
                  <button class="mat-btn mat-btn--primary mat-btn--sm">
                    批量添加素材<ClIcon class="mat-caret" :d="icon('caret').d" :size="12" color="#fff" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="m in addMaterialItems" :key="m" @click="onAddMaterial(m)">{{ m }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div v-for="(g, gi) in form.materials.creative_groups" :key="gi" class="mat-cgroup-card">
              <div class="mat-cgroup-card__head">
                <span class="mat-cgroup-card__name">{{ groupTitle(g, gi) }}</span>
                <el-icon class="mat-cgroup-card__edit" @click="openGroupName(gi)"><EditPen /></el-icon>
                <div class="mat-cgroup-card__ops">
                  <button
                    v-if="form.materials.creative_groups.length > 1"
                    class="mat-cgroup-card__del"
                    @click="onRemoveGroup(gi)"
                  >删除</button>
                  <ClIcon class="mat-cgroup-card__caret" :d="icon('caretBottom').d" :size="16" color="#999" />
                </div>
              </div>
              <div class="mat-cgroup-card__body">
                <!-- 线上：页签与「添加素材 / 添加引导视频」同一行，按钮右对齐 -->
                <div class="mat-ctabsbar">
                  <div class="mat-ctabs">
                    <button
                      v-for="t in tabsOf(g)"
                      :key="t.value"
                      class="mat-ctab"
                      :class="{ 'is-active': (g.tab || 'video') === t.value }"
                      @click="g.tab = t.value"
                    >{{ t.label }}</button>
                  </div>
                  <div class="mat-ctabbar">
                    <button class="mat-btn mat-btn--plain mat-btn--sm" :disabled="isPerAccount" @click="pickMaterial(gi)">
                      <ClIcon class="mat-plus" :d="icon('plus').d" :size="12" color="#c0c4cc" />添加素材
                    </button>
                    <!-- 线上：引导视频 = 原链路 / 新链路 时出现「添加引导视频」 -->
                    <button
                      v-if="isVisible('guide_video_btn')"
                      class="mat-btn mat-btn--plain mat-btn--sm"
                      @click="pickGuideVideo"
                    ><ClIcon class="mat-plus" :d="icon('plus').d" :size="12" color="#c0c4cc" />{{ fieldOf('guide_video_btn').text }}</button>
                  </div>
                </div>
                <div class="mat-grid">
                  <div v-for="m in groupItems(g, g.tab)" :key="m.id" class="mat-item">
                    <div class="mat-item__thumb">
                      <span class="mat-item__ph">{{ shortName(m) }}</span>
                      <button class="mat-item__del" title="删除" @click.stop="removeMaterialItem(gi, m)">×</button>
                    </div>
                    <div class="mat-item__name">{{ m.title || m.name || m.id }}</div>
                    <!-- 线上：分账户选择 / 区分素材版式=视频/图片 时素材卡上的操作按钮收起 -->
                    <div v-if="isVisible('material_ops')" class="mat-item__ops">
                      <button class="mat-btn mat-btn--action mat-btn--w120" @click="onReupload(m)">重新上传</button>
                      <button class="mat-btn mat-btn--action mat-btn--w75" @click="pickSmartCover(gi, m)">智能封面</button>
                    </div>
                  </div>

                  <!-- 空态：默认一个虚线「+」框，点击后按当前页签展开上传区（视频=上传视频+封面，图片=上传图片） -->
                  <div v-if="!groupItems(g, g.tab).length" class="mat-uprow">
                    <div
                      v-if="!uploadOpen[`${gi}-${g.tab || 'vv'}`]"
                      class="mat-upempty"
                      @click="uploadOpen[`${gi}-${g.tab || 'vv'}`] = true"
                    >
                      <ClIcon class="mat-upempty__plus" :d="icon('plus').d" :size="30" color="#c9cdd4" />
                    </div>
                    <template v-else>
                      <!-- 线上：展开后两块上传位并排、外面套一个合并外框 -->
                      <div class="mat-upwrap">
                        <div class="mat-upbox" @click="pickMaterial(gi)">
                          <el-icon class="mat-upbox__ico">
                            <VideoCamera v-if="kindOfTab(g.tab) === 'video'" />
                            <Picture v-else />
                          </el-icon>
                          <div class="mat-upbox__text">{{ kindOfTab(g.tab) === 'video' ? '上传视频' : '上传图片' }}</div>
                        </div>
                        <!-- 只有视频类型需要上传封面 -->
                        <div v-if="kindOfTab(g.tab) === 'video'" class="mat-upbox">
                          <el-icon class="mat-upbox__ico"><Picture /></el-icon>
                          <div class="mat-upbox__text">
                            <span class="mat-upbox__link" @click="pickCover('one')">上传封面</span>
                            <i class="mat-upbox__sep">|</i>
                            <span class="mat-upbox__link" @click="pickSmartCover(gi)">智能封面</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <button class="mat-btn mat-btn--primary mat-btn--sm mat-btn--w120" @click="addGroup">
              <ClIcon class="mat-plus" :d="icon('plus').d" :size="12" color="#fff" />添加创意组
            </button>
          </div>
        </div>

        <!-- ② 动态选取素材 -->
        <div v-show="matTab === 'dynamic'" class="mat-pane">
          <div class="mat-form">
            <!-- 多账户分配规则（动态页签说明文案不同） -->
            <div class="mat-row" :style="rowStyle('assign_rule')">
              <div class="mat-row__label">多账户分配规则</div>
              <div class="mat-row__content">
                <div class="mat-cards">
                  <div
                    v-for="o in fieldOf('assign_rule').options"
                    :key="o.value"
                    class="mat-card"
                    :class="{ 'is-active': v.assign_rule === o.value }"
                    @click="v.assign_rule = o.value"
                  >
                    <p class="mat-card__title">{{ o.label }}</p>
                    <p class="mat-card__desc">{{ o.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 视频上传至 -->
            <div class="mat-row" :style="rowStyle('upload_scope')">
              <div class="mat-row__label">视频上传至</div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in fieldOf('upload_scope').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.upload_scope === o.value }"
                    @click="onUploadScope(o.value)"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 组织账户 -->
            <div v-if="isVisible('org_account')" class="mat-row" :style="rowStyle('org_account')">
              <div class="mat-row__label mat-row__label--req">组织账户</div>
              <div class="mat-row__content">
                <el-select v-model="v.org_account" class="mat-org-select" placeholder="请选择组织账户">
                  <el-option v-for="o in fieldOf('org_account').options" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                <div v-if="isVisible('org_share_tip')" class="mat-alert">
                  <ClIcon class="mat-alert__icon" :d="icon('question2').d" :size="16" color="#ff9b48" />
                  <span class="mat-alert__text">{{ fieldOf('org_share_tip').text }}</span>
                  <el-button link type="primary" class="mat-alert__link" @click="openEbpVideo">{{ fieldOf('org_share_tip').linkText }}</el-button>
                </div>
              </div>
            </div>

            <!-- 主页可见 -->
            <div class="mat-row" :style="rowStyle('home_visibility')">
              <div class="mat-row__label">主页可见<el-tooltip :content="bubbleOf('home_visibility')" placement="top" :show-after="200">
                  <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                </el-tooltip>
              </div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in fieldOf('home_visibility').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.home_visibility === o.value }"
                    @click="v.home_visibility = o.value"
                  >{{ o.label }}</button>
                </div>
                <div class="mat-tip mat-tip--warn mat-tip--lh32">{{ fieldOf('home_visibility').tip }}</div>
              </div>
            </div>

            <!-- 每个广告素材数量（动态页签独有；分规则设置时追加第三个选项） -->
            <div class="mat-row" :style="rowStyle('ad_material_count_mode')">
              <div class="mat-row__label">每个广告素材数量</div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in countModeOptions"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.ad_material_count_mode === o.value }"
                    @click="v.ad_material_count_mode = o.value"
                  >{{ o.label }}</button>
                </div>
                <!-- 线上：分规则设置时，单选组右侧同行出现橙色提示 -->
                <div v-if="isVisible('count_mode_tip')" class="mat-inline-tip">
                  <ClIcon class="mat-inline-tip__ico" :d="icon(fieldOf('count_mode_tip').icon || 'warning').d" :size="12" color="#ff7729" />
                  {{ fieldOf('count_mode_tip').text }}
                </div>
              </div>
            </div>

            <!-- 单规则满足时搭建广告（每个广告素材数量 = 分规则设置 时出现） -->
            <div v-if="isVisible('single_rule_ad')" class="mat-row" :style="rowStyle('single_rule_ad')">
              <div class="mat-row__label"></div>
              <div class="mat-row__content">
                <label class="mat-check">
                  <input type="checkbox" :checked="!!v.single_rule_ad" @change="v.single_rule_ad = $event.target.checked" />
                  <span class="mat-check__text">{{ fieldOf('single_rule_ad').text }}</span>
                </label>
                <el-tooltip :content="bubbleOf('single_rule_ad')" placement="top" :show-after="100">
                  <span class="mat-qwrap"><ClIcon class="mat-q mat-q--inline" :d="icon('question2').d" :size="14" color="#999" /></span>
                </el-tooltip>
              </div>
            </div>

            <!-- 区分素材版式（分规则设置时整行消失） -->
            <div v-if="isVisible('separate_layout')" class="mat-row" :style="rowStyle('separate_layout')">
              <div class="mat-row__label">区分素材版式</div>
              <div class="mat-row__content">
                <div class="mat-cgroup">
                  <button
                    v-for="o in fieldOf('separate_layout').options"
                    :key="o.value"
                    class="mat-cbtn"
                    :class="{ 'is-active': isLayoutOn(o.value), 'is-layout': o.value !== 'OFF' }"
                    @click="toggleLayout(o.value)"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 每个创意组配置（分规则设置时整行消失） -->
            <template v-if="isVisible('group_config')">
              <div class="mat-row" :style="rowStyle('group_config')">
                <div class="mat-row__label">每个创意组配置<el-tooltip :content="bubbleOf('group_config')" placement="top" :show-after="200">
                    <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                  </el-tooltip>
                </div>
                <div class="mat-row__content">
                  <div class="mat-gcount mat-gcount--four">
                    <div v-for="it in groupCountItems" :key="it.value" class="mat-gcount__item">
                      <div class="mat-gcount__box">
                        <span class="mat-gcount__pre">{{ it.label }}</span>
                        <input
                          class="mat-gcount__input"
                          type="text"
                          :value="v.group_counts[it.value]"
                          @input="onGroupCount(it.value, $event.target.value)"
                        />
                      </div>
                      <el-tooltip :content="lockTipOf(it)" placement="top" :show-after="200">
                        <ClIcon class="mat-lock" :d="icon('lock2').d" :size="14" color="#197afb" />
                      </el-tooltip>
                    </div>
                  </div>
                  <div class="mat-tip mat-tip--lh32 mat-tip--mt8">{{ fieldOf('group_config').tip }}</div>
                </div>
              </div>
            </template>

            <!-- 选取素材不足时 -->
            <div class="mat-row" :style="rowStyle('insufficient_rule')">
              <div class="mat-row__label">选取素材不足时</div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o in fieldOf('insufficient_rule').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.insufficient_rule === o.value }"
                    @click="v.insufficient_rule = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 素材循环使用上限（循环使用素材时出现） -->
            <div v-if="isVisible('loop_limit')" class="mat-row" :style="rowStyle('loop_limit')">
              <div class="mat-row__label">素材循环使用上限</div>
              <div class="mat-row__content">
                <input class="mat-num" type="text" :value="v.loop_limit" @input="v.loop_limit = $event.target.value" />
                <div v-for="(t, i) in fieldOf('loop_limit').tips" :key="i" class="mat-tip">{{ t }}</div>
              </div>
            </div>

            <!-- 余量广告按剩余素材搭建的说明 -->
            <div v-if="isVisible('partial_tip')" class="mat-row">
              <div class="mat-row__label"></div>
              <div class="mat-row__content">
                <div class="mat-tip">{{ fieldOf('partial_tip').text }}</div>
              </div>
            </div>

            <!-- 引导视频 -->
            <div class="mat-row" :style="rowStyle('guide_video')">
              <div class="mat-row__label">引导视频<el-tooltip :content="bubbleOf('guide_video')" placement="top" :show-after="200">
                  <ClIcon class="mat-q" :d="icon('question2').d" :size="14" color="#999" />
                </el-tooltip>
              </div>
              <div class="mat-row__content">
                <div class="mat-rgroup">
                  <button
                    v-for="o of fieldOf('guide_video').options"
                    :key="o.value"
                    class="mat-rbtn"
                    :class="{ 'is-active': v.guide_video === o.value }"
                    @click="v.guide_video = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 引导视频关键词（全部相同时出现） -->
            <div v-if="isVisible('guide_keyword')" class="mat-row" :style="rowStyle('guide_keyword')">
              <div class="mat-row__label">引导视频关键词</div>
              <div class="mat-row__content">
                <input class="mat-kw-input mat-kw-input--wide" type="text" :value="v.guide_keyword" @input="v.guide_keyword = $event.target.value" />
              </div>
            </div>

            <!-- 底部提示条 -->
            <div v-if="isVisible('dyn_note')" class="mat-row">
              <div class="mat-row__label"></div>
              <div class="mat-row__content">
                <div class="mat-alert mat-alert--info">
                  <ClIcon class="mat-alert__icon" :d="icon('question2').d" :size="16" color="#4e5969" />
                  <span class="mat-alert__text">{{ fieldOf('dyn_note').text }}</span>
                  <el-button link type="primary" class="mat-alert__link">{{ fieldOf('dyn_note').linkText }}</el-button>
                </div>
              </div>
            </div>

            <!-- 多账户分配规则 = 分账户选择：账户切换条（线上「账户1/账户2/账户3」横向 tab） -->
            <div v-if="isPerAccount" class="mat-acctbar">
              <button
                class="mat-acctbar__nav"
                :disabled="acctIndex === 0"
                @click="acctIndex = Math.max(0, acctIndex - 1)"
              >‹</button>
              <div class="mat-acctbar__list">
                <button
                  v-for="(a, i) in materialAccounts"
                  :key="a.accountId || i"
                  class="mat-acctbar__item"
                  :class="{ 'is-active': i === acctIndex }"
                  @click="acctIndex = i"
                >账户{{ i + 1 }}：{{ a.account }}-在投</button>
              </div>
              <button
                class="mat-acctbar__nav"
                :disabled="acctIndex >= materialAccounts.length - 1"
                @click="acctIndex = Math.min(materialAccounts.length - 1, acctIndex + 1)"
              >›</button>
            </div>
          </div>

          <!-- 动态选取规则（线上 .dynamic-area；分账户选择时每个账户各自一份规则） -->
          <div class="mat-creative mat-creative--rules">
            <div class="mat-creative__head">
              <div class="mat-creative__title">
                <span class="mat-rule-title">动态选取规则</span>
              </div>
              <div class="mat-creative__tools">
                <button class="mat-btn mat-btn--primary mat-btn--sm" @click="openDynRule()">+ 添加动态选取规则</button>
                <button
                  class="mat-btn mat-btn--default mat-btn--sm"
                  :disabled="isDisabled('add_fixed_rule_btn')"
                  @click="addFixedRule"
                >{{ fieldOf('add_fixed_rule_btn').text }}</button>
              </div>
            </div>

            <!-- 空态（线上：插图 +「暂无动态选取规则，点击添加」） -->
            <div v-if="!currentDynRules.length" class="mat-ruleempty">
              <svg class="mat-ruleempty__img" viewBox="0 0 124 112" width="124" height="112">
                <rect x="36" y="20" width="52" height="66" rx="5" fill="#f6f8ff" stroke="#c7d4f5" stroke-width="1.6" />
                <rect x="44" y="30" width="36" height="6" rx="3" fill="#dbe4fb" />
                <rect x="44" y="44" width="36" height="6" rx="3" fill="#e9efff" />
                <rect x="44" y="58" width="24" height="6" rx="3" fill="#e9efff" />
                <circle cx="95" cy="26" r="13" fill="#eef2ff" stroke="#b9c9f0" stroke-width="1.4" stroke-dasharray="3 3" />
                <path d="M95 20v12M89 26h12" stroke="#7f9cf5" stroke-width="2" stroke-linecap="round" />
                <circle cx="24" cy="82" r="11" fill="#eef2ff" stroke="#b9c9f0" stroke-width="1.4" stroke-dasharray="3 3" />
                <path d="M18 82h12" stroke="#7f9cf5" stroke-width="2" stroke-linecap="round" />
              </svg>
              <div class="mat-ruleempty__text">
                暂无动态选取规则，<button class="mat-link" @click="openDynRule()">点击添加</button>
              </div>
            </div>

            <!-- 规则回显：卡片式（素材来源 / 选取模式 / 使用情况 / 过滤条件 / 属性 / 上传时间 / 关键词 / 数量） -->
            <div v-if="currentDynRules.length" class="mat-rules">
              <article v-for="(r, ri) in currentDynRules" :key="r.id || ri" class="mat-rulecard">
                <h5 class="mat-rulecard__title">规则{{ ri + 1 }}</h5>
                <div class="mat-rulecard__grid">
                  <div class="mat-rulecard__cell"><span class="k">素材来源：</span><span class="v">创新素材</span></div>
                  <div class="mat-rulecard__cell"><span class="k">素材选取模式：</span><span class="v">{{ pickModeText(r) }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">素材使用情况：</span><span class="v">{{ useStatusText(r) }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">素材过滤条件：</span><span class="v">{{ filtersText(r) }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">素材属性：</span><span class="v">{{ attrText(r) }}</span></div>
                  <div class="mat-rulecard__cell mat-rulecard__cell--span2"><span class="k">素材上传时间：</span><span class="v">{{ uploadTimeText(r) }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">素材名称定向：</span><span class="v">{{ r.kwInclude || '—' }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">素材名称排除：</span><span class="v">{{ r.kwExclude || '—' }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">视频数量：</span><span class="v">{{ r.videoCount ?? 0 }}</span></div>
                  <div class="mat-rulecard__cell"><span class="k">图片数量：</span><span class="v">{{ r.imageCount ?? 0 }}</span></div>
                </div>
                <div class="mat-rulecard__ops">
                  <button class="mat-link" @click="openDynRule(ri)">编辑</button>
                  <button class="mat-link mat-link--danger" @click="removeDynRuleLocal(ri)">删除</button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BatchDrawer>

  <!-- 动态选取规则抽屉（图 1） -->
  <BatchDynRuleDrawer ref="dynRuleRef" @submit="onDynRuleSubmit" />

  <!-- 自定义创意组名称（图 6） -->
  <el-dialog
    v-model="groupNameVisible"
    title="自定义创意组名称"
    width="480px"
    append-to-body
    class="mat-gname-dialog"
  >
    <div class="mat-gname">
      <el-input v-model="groupNameDraft" class="mat-gname__input" placeholder="请输入创意组名称" />
      <div class="mat-gname__kw">
        <button
          v-for="w in GROUP_NAME_WORDS"
          :key="w"
          class="mat-gname__kwitem"
          @click="groupNameDraft += '{' + w + '}'"
        >+{{ w }}</button>
      </div>
      <div class="mat-gname__tip">创意组名称中默认设定创意编号，可在此修改；修改后将会以输入框中的名称作为所有账户内对应创意组名。</div>
    </div>
    <template #footer>
      <el-button @click="groupNameVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmGroupName">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, h, inject, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { EditPen, Picture, VideoCamera } from '@element-plus/icons-vue';
import BatchDrawer from './BatchDrawer.vue';
import BatchDynRuleDrawer from './BatchDynRuleDrawer.vue';
import spec from './spec/material.spec.js';
import {
  isVisible as specVisible,
  isDisabled as specDisabled,
  bubbleText,
  optionBubbleText,
} from './spec/resolve.js';

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
  form, matTab, videos, images,
  applyGroupName, shuffleGroups, clearMaterials, randomPick, smartPick, refreshGroups,
  pickMaterial, addLocalMaterial, pickTextImage, addSurgeMaterial,
  pickGuideVideo, pickCover, addGroup, removeGroup, addDynRule, removeDynRule,
  addFixedRule, confirmMaterials,
  openEbpVideo, onReupload, pickSmartCover, MORE_WILDCARDS,
} = batch;

/** 删除创意组：组内有素材时先二次确认（至少保留 1 组由 removeGroup 兜底） */
function onRemoveGroup(gi) {
  const g = form.materials.creative_groups[gi];
  if (!g) return;
  const count = (g.videos || []).length + (g.images || []).length + (g.text_images || []).length;
  if (!count) { removeGroup(gi); return; }
  ElMessageBox.confirm(
    `创意组${String(gi + 1).padStart(2, '0')} 下已有 ${count} 个素材，删除后这些素材配置将一并移除，是否继续？`,
    '删除创意组',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(() => removeGroup(gi)).catch(() => {});
}

/** 「插入更多」通配符列表（线上与项目名称的插入更多同源） */
const groupMoreWildcards = computed(() => MORE_WILDCARDS || []);

/** 「清空」：二次确认后清空全部创意组素材（创意组本身保留） */
function onClearMaterials() {
  const hasAny = form.materials.creative_groups.some(
    (g) => (g.videos || []).length || (g.images || []).length || (g.text_images || []).length
  );
  if (!hasAny) {
    ElMessage.warning('当前没有可清空的素材');
    return;
  }
  ElMessageBox.confirm('清空后将移除所有创意组内的素材（创意组本身保留），是否继续？', '清空素材', {
    type: 'warning',
    confirmButtonText: '清空',
    cancelButtonText: '取消',
  }).then(() => {
    clearMaterials();
    ElMessage.success('已清空全部创意组素材');
  }).catch(() => {});
}

const manualTab = spec.tabs.find((t) => t.value === 'manual');
const dynamicTab = spec.tabs.find((t) => t.value === 'dynamic');

/**
 * 线上 iconfont 字形 → 内联 SVG（本地无 iconfont 字体文件）。
 * viewBox 用字体的 em 盒（0 -128 1024 1024，upm=1024），保证与线上字形等比等位。
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

/** 线上图标（补充 caret 系列：Element UI 内置图标，本地用等价路径复刻） */
const EXTRA_ICONS = {
  /** el-icon-arrow-down（下拉箭头，实心三角） */
  caret: { d: 'M100 250H924L512 750Z', size: 12 },
  /** el-icon-caret-bottom（收起三角） */
  caretBottom: { d: 'M120 350H904L512 750Z', size: 16 },
};
function icon(name) {
  return (spec.icons && spec.icons[name]) || EXTRA_ICONS[name] || { d: '', size: 12 };
}

/* 抽屉内表单值（默认值统一来自 spec.values） */
const v = reactive(Object.assign({}, spec.values, {
  group_counts: Object.assign({}, spec.values.group_counts),
  separate_layout: (spec.values.separate_layout || []).slice(),
}));

const confirmed = { done: false };

/** 当前页签的 spec 字段表（按 key 索引） */
const fieldMap = computed(() => {
  const tab = spec.tabs.find((t) => t.value === matTab.value) || manualTab;
  const m = {};
  (tab.sections || []).forEach((s) => (s.fields || []).forEach((f) => { m[f.key] = f; }));
  return m;
});

function fieldOf(key) {
  return fieldMap.value[key] || {};
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

/** 行间距（线上实测） */
function gapOf(key) {
  const f = fieldOf(key);
  return f.gapAfter !== undefined ? f.gapAfter : 20;
}
/** 行高（线上实测 rect 高度）—— 保证各字段纵向位置与线上一致 */
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

/** 区分素材版式：「不启用」为互斥项，valueKey 映射到 values 里的标量键 */
function isLayoutOn(value) {
  const f = fieldOf('separate_layout');
  const key = (f.valueKeys || {})[value];
  if (key) return !!v[key];
  return (v.separate_layout || []).indexOf(value) >= 0;
}
function toggleLayout(value) {
  const f = fieldOf('separate_layout');
  const keys = f.valueKeys || {};
  if (value === 'OFF') {
    Object.keys(keys).forEach((k) => { v[keys[k]] = false; });
    v.separate_layout = ['OFF'];
    return;
  }
  const key = keys[value];
  if (key) v[key] = !v[key];
  // 注意：勾选状态存在 layout_video / layout_image 上，取值要走 keys 映射
  const on = Object.keys(keys).filter((k) => !!v[keys[k]]);
  v.separate_layout = on.length ? on : ['OFF'];
}

/** 每个广告素材数量：选「分规则设置」时线上追加第三个选项 */
const countModeOptions = computed(() => {
  const f = fieldOf('ad_material_count_mode');
  const base = f.options || [];
  const extra = (f.extraOptions || {})[v.ad_material_count_mode] || [];
  return base.concat(extra);
});

/**
 * 线上：多账户分配规则 = 分账户选择 或 区分素材版式 = 视频/图片 时，
 * 素材卡上的「重新上传 / 智能封面」收起（state_probe_online.json）
 */
const showMaterialOps = computed(() => isVisible('material_ops'));

/** 「批量添加素材」下拉：基础 4 项 + 按引导视频追加的 2 项（均置灰） */
const addMaterialItems = computed(() => {
  const base = (manualTab.toolbarAddMaterial || []).slice();
  const extra = (manualTab.toolbarAddMaterialGuide || {})[v.guide_video] || [];
  return base.concat(extra);
});

/* ---------------- 创意组：名称 / 页签 / 素材（按版本版式拆分） ---------------- */
const groupNameVisible = ref(false);
const groupNameDraft = ref('');
const groupNameIdx = ref(-1);
const GROUP_NAME_WORDS = ['素材名', '横版视频名', '竖版视频名', '横版图片名', '竖版图片名'];
/** 创意组空态：点「+」后展开上传区的状态（按 组序号-页签 记录） */
const uploadOpen = reactive({});

/** 组名：默认「创意组NN」，可自定义（图 6 弹窗） */
function groupTitle(g, gi) {
  const n = (g && g.name ? String(g.name) : '').trim();
  return n || `创意组${String(gi + 1).padStart(2, '0')}`;
}
function openGroupName(gi) {
  groupNameIdx.value = gi;
  groupNameDraft.value = groupTitle(form.materials.creative_groups[gi], gi);
  groupNameVisible.value = true;
}
function confirmGroupName() {
  const g = form.materials.creative_groups[groupNameIdx.value];
  const name = groupNameDraft.value.trim();
  if (g && name) g.name = name;
  groupNameVisible.value = false;
  ElMessage.success(`创意组名称已改为「${name}」`);
}
/** 「插入更多」已按线上移除（组名只保留 5 个通配符按钮） */

const TAB_NAMES = {
  video: '视频', image: '图片', text: '图文',
  vv: '竖版视频', vh: '横版视频',
  iv: '竖版图片', ih: '横版图片', small: '小图',
};
const TAB_LAYOUT = {
  vv: 'VIDEO_VERTICAL', vh: 'VIDEO_HORIZONTAL',
  iv: 'IMAGE_VERTICAL', ih: 'IMAGE_HORIZONTAL', small: 'IMAGE_SMALL',
};

/** 素材库「图文」页签的 mock 素材（仅展示名称） */
const TEXT_TITLES = {
  ti_1: '图文-短剧通用-01', ti_2: '图文-短剧通用-02', ti_3: '图文-短剧通用-03',
  ti_4: '图文-短剧通用-04', ti_5: '图文-短剧通用-05', ti_6: '图文-短剧通用-06',
};
function materialOf(id) {
  return (videos.value || []).find((x) => x.id === id)
    || (images.value || []).find((x) => x.id === id)
    || (TEXT_TITLES[id] ? { id, title: TEXT_TITLES[id], type: '图文' } : null)
    || { id, title: String(id) };
}
/** 素材归属的版式（mock 素材无版式字段，按名称关键词判定，兜底：视频=横版、图片=竖版） */
function layoutOf(id) {
  const m = materialOf(id);
  const text = String(m.title || m.name || '');
  if (text.includes('小图')) return 'IMAGE_SMALL';
  if (text.includes('竖') && text.includes('图片')) return 'IMAGE_VERTICAL';
  if (text.includes('横') && text.includes('图片')) return 'IMAGE_HORIZONTAL';
  if (text.includes('竖')) return 'VIDEO_VERTICAL';
  if (text.includes('横')) return 'VIDEO_HORIZONTAL';
  const isVideo = (videos.value || []).some((x) => x.id === id);
  return isVideo ? 'VIDEO_HORIZONTAL' : 'IMAGE_VERTICAL';
}

/** 素材卡右上角 ×：从当前创意组移除该素材（不区分页签） */
function removeMaterialItem(gi, m) {
  if (!m) return;
  const g = (form.materials.creative_groups || [])[gi];
  if (!g) return;
  ['videos', 'images', 'text_images'].forEach((key) => {
    const arr = g[key];
    if (Array.isArray(arr)) {
      const i = arr.indexOf(m.id);
      if (i >= 0) arr.splice(i, 1);
    }
  });
  ElMessage.success('已移除该素材');
}

/** 某个页签下的素材列表 */
function groupItems(g, tab) {
  const t = tab || 'video';
  if (t === 'text') return (g.text_images || []).map(materialOf);
  if (t === 'video') return (g.videos || []).map(materialOf);
  if (t === 'image') return (g.images || []).map(materialOf);
  const key = TAB_LAYOUT[t];
  if (!key) return [];
  if (key.startsWith('VIDEO')) return (g.videos || []).filter((id) => layoutOf(id) === key).map(materialOf);
  return (g.images || []).filter((id) => layoutOf(id) === key).map(materialOf);
}
function limitOfTab(tab) {
  const c = v.group_counts || {};
  const map = {
    video: c.VIDEO, image: c.IMAGE, text: c.TEXT_IMAGE,
    vv: c.VIDEO_VERTICAL, vh: c.VIDEO_HORIZONTAL,
    iv: c.IMAGE_VERTICAL, ih: c.IMAGE_HORIZONTAL, small: c.IMAGE_SMALL,
  };
  return map[tab] || 0;
}
/** 创意组页签：固定 6 个素材类型（竖版视频 / 横版视频 / 竖版图片 / 横版图片 / 小图 / 图文） */
function tabsOf(g) {
  return ['vv', 'vh', 'iv', 'ih', 'small', 'text'].map((value) => {
    const used = groupItems(g, value).length;
    /* 实际素材多于配置上限时（如后加的图文），右侧上限同步抬高，避免出现 1/0 */
    const limit = Math.max(Number(limitOfTab(value)) || 0, used);
    return { value, label: `${TAB_NAMES[value]}(${used}/${limit})` };
  });
}
function kindOfTab(tab) {
  if (tab === 'text') return 'text';
  if (tab === 'image' || tab === 'iv' || tab === 'ih' || tab === 'small') return 'image';
  return 'video';
}
/** 版式切换后把失效的当前页签归位 */
watch([() => v.layout_video, () => v.layout_image], () => {
  (form.materials.creative_groups || []).forEach((g) => {
    const list = tabsOf(g).map((t) => t.value);
    if (!list.includes(g.tab || '')) g.tab = list[0];
  });
}, { immediate: true });
/** 图文素材由素材库弹窗追加后，配置中的「图文」数量同步抬高到实际条数，避免 1/0 或输入框 0 与页签不符 */
watch(
  () => (form.materials.creative_groups || []).map((g) => (g.text_images || []).length).join(','),
  () => {
    const maxUsed = (form.materials.creative_groups || []).reduce(
      (m, g) => Math.max(m, (g.text_images || []).length), 0,
    );
    if (maxUsed > (Number(v.group_counts.TEXT_IMAGE) || 0)) {
      v.group_counts.TEXT_IMAGE = String(maxUsed);
      syncCountsToForm();
    }
  },
);
function shortName(m) {
  const t = String(m.title || m.name || m.id || '');
  return t.slice(0, 2);
}

/* ================= 分账户选择：账户切换 + 每个账户各自一份动态选取规则 ================= */
const isPerAccount = computed(() => v.assign_rule === 'PER_ACCOUNT');
/** 账户行（与标题抽屉同源，来自已选账户） */
const materialAccounts = computed(() => {
  const rows = batch.titleAccountRows;
  const list = rows ? (rows.value || []) : [];
  return list.length ? list : [{ account: '央广-雷盟-知乎-APP内付费-124-792335571', accountId: 'acc1' }];
});
const acctIndex = ref(0);
/** 分账户选择时按账户隔离；其余分配规则共用全局 dynamic_rules */
const currentDynRules = computed(() => {
  if (!isPerAccount.value) {
    if (!form.materials.dynamic_rules) form.materials.dynamic_rules = [];
    return form.materials.dynamic_rules;
  }
  const acc = materialAccounts.value[acctIndex.value] || materialAccounts.value[0];
  const key = acc ? (acc.accountId || `acc${acctIndex.value}`) : 'acc0';
  if (!form.materials.dynamic_rules_by_account) form.materials.dynamic_rules_by_account = {};
  const m = form.materials.dynamic_rules_by_account;
  if (!m[key]) m[key] = [];
  return m[key];
});
/* ============ 动态选取规则：抽屉（图1）+ 卡片回显（图2） ============ */
const dynRuleRef = ref(null);
const dynRuleIdx = ref(-1);

const PICK_TEXT = { RANDOM: '随机选取', LATEST: '最新素材', OLDEST: '优先老素材' };
const USE_TEXT = { ALL: '不限', UNUSED: '未使用', NO_COST: '无消耗', HAS_COST: '有消耗', BOOM: '爆量' };
const ATTR_TEXT = { ALL: '不限', QUALITY: '优质', FIRST: '首发' };
const FILTER_TEXT = {
  USED_TODAY: '今日已使用素材',
  LOW_EFFECT: '低效素材',
  LOW_QUALITY: '低质素材',
  SQUEEZE: '同质化挤压严重',
  QUEUE: '同质化排队',
  MOVE_DOWN: '搬运打压',
  PRE_AUDIT_REJECT: '预审拒绝素材',
  SIMILAR: '极端相似素材',
  WATERMARK: '暗水印素材',
  SUGGEST_COUNT: '建议次数',
  REJECT_COUNT: '拒审次数',
};
function pickModeText(r) { return PICK_TEXT[r.pickMode] || '随机选取'; }
function useStatusText(r) { return USE_TEXT[r.useStatus] || '不限'; }
function attrText(r) { return ATTR_TEXT[r.attr] || '不限'; }
function filtersText(r) {
  const list = r.filters || [];
  if (!list.length) return '—';
  return list.map((x) => FILTER_TEXT[x] || x).join('、');
}
function uploadTimeText(r) {
  if (r.timeMode === 'RELATIVE') return `近 ${r.relativeDay || 7} 天`;
  const range = r.dateRange || [];
  return range.length === 2 ? `${range[0]} 至 ${range[1]}` : '—';
}

/** 新增（不传 ri）/ 编辑（传 ri）某条规则 */
function openDynRule(ri) {
  dynRuleIdx.value = ri === undefined ? -1 : ri;
  const rule = ri === undefined ? null : currentDynRules.value[ri];
  if (dynRuleRef.value) dynRuleRef.value.open(rule);
}
function onDynRuleSubmit(data) {
  const rules = currentDynRules.value;
  if (dynRuleIdx.value >= 0 && rules[dynRuleIdx.value]) {
    Object.assign(rules[dynRuleIdx.value], data);
    ElMessage.success(`已更新「规则${dynRuleIdx.value + 1}」`);
  } else {
    rules.push(Object.assign({ id: `dyn_${Date.now()}` }, data));
    ElMessage.success(`已添加「规则${rules.length}」`);
  }
  dynRuleIdx.value = -1;
}

function addDynRuleLocal() {
  openDynRule();
}
function removeDynRuleLocal(ri) {
  currentDynRules.value.splice(ri, 1);
  ElMessage.success('已删除该动态选取规则');
}
/** 视频上传至：选「广告主账户」需二次确认，确认后才切换；「组织账户」只在升级版工作台组织时显示 */
function onUploadScope(val) {
  if (val === v.upload_scope) return;
  if (val !== 'ADVERTISER') {
    v.upload_scope = val;
    return;
  }
  ElMessageBox.confirm(
    '<div style="color:#ff7729;font-size:13px;line-height:22px">上传到广告主账户的素材仅该账户可用，账号维度不可共享，其他账户需要使用同一素材时须重复上传，会影响广告下发效率。</div>',
    '确认上传到广告主账户',
    {
      type: 'warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: '继续（账户上传）',
      cancelButtonText: '取消',
    }
  ).then(() => {
    v.upload_scope = 'ADVERTISER';
    ElMessage.success('已切换为上传到广告主账户');
  }).catch(() => {});
}

/** 数量输入 */
function onGroupCount(key, val) {
  v.group_counts[key] = val;
  if (key === 'VIDEO') form.materials.group_video_count = Number(val) || 0;
  if (key === 'IMAGE') form.materials.group_image_count = Number(val) || 0;
  if (key === 'TEXT_IMAGE') form.materials.group_text_count = Number(val) || 0;
  syncCountsToForm();
}

/**
 * 「区分素材版式」联动：每个创意组配置的项
 *   不启用 → 视频 / 图片 / 图文
 *   视频   → 竖版视频 / 横版视频 / 图片 / 图文
 *   图片   → 视频 / 竖版图片 / 横版图片 / 小图 / 图文
 *   视频+图片 → 竖版视频 / 横版视频 / 竖版图片 / 横版图片 / 小图 / 图文
 */
const groupCountItems = computed(() => {
  const f = fieldOf('group_config');
  const table = f.layoutItems || {};
  const hasVideo = !!v.layout_video;
  const hasImage = !!v.layout_image;
  const key = hasVideo && hasImage ? 'BOTH' : hasVideo ? 'VIDEO' : hasImage ? 'IMAGE' : 'NONE';
  return (table[key] || f.items || []).map((it) => ({
    ...it,
    cur: v.group_counts[it.value] !== undefined ? v.group_counts[it.value] : (it.default || '0'),
  }));
});
/** 切换版式后补齐新出现的细分项默认值（竖版视频/横版视频/竖版图片/横版图片/小图） */
watch(groupCountItems, (items) => {
  items.forEach((it) => {
    if (v.group_counts[it.value] === undefined) v.group_counts[it.value] = it.default || '0';
  });
  syncCountsToForm();
}, { immediate: true });

/** 把「每个创意组配置」的数字回写到 form（智能优选 / 一键测新 取素材时要用） */
function syncCountsToForm() {
  const c = v.group_counts || {};
  const vCount = v.layout_video
    ? (Number(c.VIDEO_VERTICAL) || 0) + (Number(c.VIDEO_HORIZONTAL) || 0)
    : (Number(c.VIDEO) || 0);
  const iCount = v.layout_image
    ? (Number(c.IMAGE_VERTICAL) || 0) + (Number(c.IMAGE_HORIZONTAL) || 0) + (Number(c.IMAGE_SMALL) || 0)
    : (Number(c.IMAGE) || 0);
  form.materials.group_video_count = vCount;
  form.materials.group_image_count = iCount;
  form.materials.group_text_count = Number(c.TEXT_IMAGE ?? 0) || 0;
}

function lockTipOf(it) {
  return `未锁定，锁定后所有创意组都将使用相同的${it.label}素材组合`;
}

/** 通配符追加 */
function appendGroupWildcard(text) {
  const cur = v.group_name_template || '';
  v.group_name_template = cur ? `${cur}{${text}}` : `{${text}}`;
}

/** 更多菜单：批量添加封面 / 一键指定封面 都打开素材库弹窗（图 4） */
function onMoreMenu(m) {
  if (m === '批量添加封面') pickCover('all');
  else if (m === '一键指定封面') pickCover('one');
}
function onAddMaterial(m) {
  if (m === '添加本地素材') addLocalMaterial();
  else if (m === '添加已有图文') pickTextImage();
}

function onTabChange(val) {
  matTab.value = val;
}

/** 打开时把本地 form 同步进抽屉 */
function syncFromForm() {
  const m = form.materials;
  v.assign_rule = m.assign_rule || 'REUSE';
  v.upload_scope = m.upload_scope === 'ADVERTISER' ? 'ADVERTISER' : 'EBP';
  v.org_account = m.org_account || '1873939327613259';
  v.home_visibility = m.home_visibility === 'ALWAYS' ? 'ALWAYS_VISIBLE' : 'HIDE_VIDEO_ON_HP';
  v.separate_layout = m.separate_layout === 'OFF' || !m.separate_layout ? ['OFF'] : [m.separate_layout];
  v.layout_video = (v.separate_layout || []).indexOf('VIDEO') >= 0;
  v.layout_image = (v.separate_layout || []).indexOf('IMAGE') >= 0;
  v.group_counts = {
    VIDEO: String(m.group_video_count ?? 10),
    VIDEO_VERTICAL: String(m.group_counts_sc?.['VIDEO_VERTICAL'] ?? 2),
    VIDEO_HORIZONTAL: String(m.group_counts_sc?.['VIDEO_HORIZONTAL'] ?? 1),
    IMAGE_VERTICAL: String(m.group_counts_sc?.['IMAGE_VERTICAL'] ?? 1),
    IMAGE_HORIZONTAL: String(m.group_counts_sc?.['IMAGE_HORIZONTAL'] ?? 1),
    IMAGE_SMALL: String(m.group_counts_sc?.['IMAGE_SMALL'] ?? 1),
    IMAGE: String(m.group_image_count ?? 0),
    TEXT_IMAGE: String(m.group_text_count ?? 0),
  };
  v.group_name_template = m.group_name_template || '';
  v.guide_video = m.guide_video || 'OFF';
  v.ad_material_count_mode = m.ad_material_count_mode || 'SAME';
  v.single_rule_ad = m.single_rule_ad !== false;
  v.insufficient_rule = m.insufficient_rule === 'LOOP' ? 'LOOP' : m.insufficient_rule === 'REMAIN' ? 'PARTIAL' : 'TERMINATION';
}

/** 确认时把抽屉值写回 form */
function syncToForm() {
  confirmed.done = true;
  const m = form.materials;
  m.assign_rule = v.assign_rule;
  m.upload_scope = v.upload_scope === 'ADVERTISER' ? 'ADVERTISER' : 'ORG';
  m.org_account = v.org_account;
  m.home_visibility = v.home_visibility === 'ALWAYS_VISIBLE' ? 'ALWAYS' : 'SINGLE';
  m.separate_layout = (v.separate_layout || []).length === 1 && v.separate_layout[0] === 'OFF'
    ? 'OFF'
    : (v.separate_layout || []).filter((x) => x !== 'OFF')[0] || 'OFF';
  m.group_name_template = v.group_name_template;
  m.guide_video = v.guide_video;
  m.ad_material_count_mode = v.ad_material_count_mode;
  m.single_rule_ad = !!v.single_rule_ad;
  m.group_counts_sc = {
    VIDEO_VERTICAL: v.group_counts.VIDEO_VERTICAL,
    VIDEO_HORIZONTAL: v.group_counts.VIDEO_HORIZONTAL,
    IMAGE_VERTICAL: v.group_counts.IMAGE_VERTICAL,
    IMAGE_HORIZONTAL: v.group_counts.IMAGE_HORIZONTAL,
    IMAGE_SMALL: v.group_counts.IMAGE_SMALL,
  };
  m.insufficient_rule = v.insufficient_rule === 'PARTIAL' ? 'REMAIN' : v.insufficient_rule;
}

watch(
  () => props.modelValue,
  (val) => { if (val && confirmed.done) syncFromForm(); },
  { immediate: true }
);

function onConfirm() {
  syncToForm();
  confirmMaterials();
  visible.value = false;
}
function onClose() {
  visible.value = false;
}
</script>

<style>
/* 自定义创意组名称弹窗（teleport 到 body，不能放 scoped） */
.mat-gname-dialog .el-dialog__header { padding: 18px 20px 10px; margin-right: 0; }
.mat-gname-dialog .el-dialog__title { font-size: 15px; font-weight: 600; color: #1d2129; }
.mat-gname-dialog .el-dialog__body { padding: 4px 20px 0; }
.mat-gname-dialog .el-dialog__footer { padding: 16px 20px 18px; }
.mat-gname__input .el-input__wrapper { min-height: 32px; }
.mat-gname__kw {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #197afb;
}
.mat-gname__kwitem,
.mat-gname__more {
  padding: 0;
  font-size: 12px;
  color: #197afb;
  background: none;
  border: none;
  cursor: pointer;
}
.mat-gname__kwitem:hover,
.mat-gname__more:hover { color: #4080ff; text-decoration: underline; }
.mat-gname__more { margin-left: auto; }
.mat-gname__tip { margin-top: 12px; font-size: 12px; line-height: 20px; color: #86909c; }

/* ===== 线上 cl-drawer 外壳微调（BatchDrawer.vue 提供基础版式） =====
   线上实测（创意素材抽屉）：
     .drawer-header   h=50（里面是 simple-tabs，没有标题文字）
     .drawer-content  x=920 y=66 w=984 h=932  margin 16px padding 16px 白底 1px #e8eaec radius 3px
     .drawer-footer   x=904 y=1010 w=1016 h=70  absolute bottom:0  padding 12px 16px 24px
     页脚按钮 88×32 12px/500；取消 x=1712 确 定 x=1816（间距 16） */
.cl-drawer:has(.mat-root) .cl-drawer__header {
  box-sizing: border-box;
  height: 50px;
  padding: 0 16px;
}
.cl-drawer:has(.mat-root) .cl-drawer__title { display: none; }
.cl-drawer:has(.mat-root) .cl-drawer__content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  box-sizing: border-box;
  height: calc(100vh - 148px);
  flex: none;
}
.cl-drawer:has(.mat-root) .cl-drawer__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  padding: 12px 16px 24px;
  align-items: flex-start;
}
.cl-drawer:has(.mat-root) .cl-drawer__footer .mat-btn {
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
   线上：项 116×50，x=920 / x=1036；文字 16px/700；激活 #197afb，未激活 #666；下划线 96×2 @ y=48 */
/* 线上元素尺寸按 border-box 计（卡片 200×70 / 按钮 32px / 标签 150px） */
.mat-root, .mat-root *, .mat-root *::before, .mat-root *::after { box-sizing: border-box; }

/* 内联 iconfont 复刻图标 */
.cl-ico { vertical-align: -2px; flex: none; }

.mat-tabs {
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 50px;
  display: flex;
  align-items: center;
}
.mat-tabs__item {
  position: relative;
  height: 50px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 700;
  line-height: 50px;
  color: #666;
  cursor: pointer;
}
.mat-tabs__item:first-child { padding-left: 0; }
.mat-tabs__item:last-child { padding-right: 0; }
.mat-tab__text { position: relative; display: inline-block; line-height: 20px; }
.mat-tabs__item.is-active { color: #197afb; }
.mat-tabs__item.is-active .mat-tab__text::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -13px;
  height: 2px;
  background: #197afb;
}

/* 页脚（线上 .dialog-footer：padding-top 12px，按钮右对齐 88×32，间距 16） */
.mat-footer { display: flex; justify-content: flex-end; gap: 16px; padding-top: 12px; width: 100%; }

/* ===== 表单（线上 el-form ml32-mr48 el-form--label-left） =====
   线上：label 宽 150px 14px #666 lh32 padding-right 12px；内容 margin-left 150px */
.mat-form { width: 100%; }
.mat-row { display: flex; align-items: flex-start; }
.mat-row__label {
  flex: 0 0 150px;
  width: 150px;
  padding-right: 12px;
  font-size: 14px;
  line-height: 32px;
  color: #666;
}
.mat-row__label--req::before { content: '*'; margin-right: 4px; color: #f53f3f; }
.mat-row__content { flex: 1; min-width: 0; }
.mat-q { margin-left: 8px; color: #999; cursor: help; vertical-align: -3px; }
.mat-qwrap { display: inline-flex; align-items: center; margin-left: 6px; cursor: help; }
/* 勾选项（单规则满足时搭建广告）：蓝勾 + 蓝字 + 灰 ? */
.mat-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.mat-check input { width: 14px; height: 14px; margin: 0; accent-color: #197afb; cursor: pointer; }
.mat-check__text { font-size: 13px; color: #197afb; }
.mat-q--inline { margin-left: 0; }

/* 卡片式三选一（线上 custom-radio-group：200×70，间距 16px，内边距 12px） */
.mat-cards { display: flex; gap: 16px; }
.mat-card {
  width: 200px;
  height: 70px;
  padding: 12px;
  border: 1px solid #e5e6eb;
  border-radius: 3px;
  background: #fff;
  cursor: pointer;
}
.mat-card.is-active { border-color: #197afb; }
.mat-card__title { margin: 0; font-size: 14px; line-height: 20px; color: #333; }
.mat-card__desc { margin: 7px 0 0; font-size: 12px; line-height: 18px; color: #999; }
.mat-card.is-active .mat-card__title,
.mat-card.is-active .mat-card__desc { color: #197afb; }

/* 单选按钮组（线上 el-radio-button：min-width 80px / padding 9px 12px / 高 32px） */
.mat-rgroup { display: flex; align-items: center; }
.mat-rbtn {
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
.mat-rbtn:first-child { border-radius: 3px 0 0 3px; }
/* 线上 Element UI：非首项 border-left:0（宽 0），相邻项紧贴无负 margin */
.mat-rbtn + .mat-rbtn { border-left-width: 0; }
.mat-rbtn:last-child { border-radius: 0 3px 3px 0; }
.mat-rbtn.is-active { color: #197afb; background: #d6eaff; border-color: #197afb; z-index: 1; }

/* 勾选按钮组（线上 el-checkbox-button：min-width 80px；选中=实心蓝底白字） */
.mat-cgroup { display: inline-flex; }
.mat-cbtn {
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
  top: 2px;
}
.mat-cbtn:first-child { border-radius: 3px 0 0 3px; }
/* 线上 Element UI：非首项 border-left:0（宽 0），相邻项紧贴无负 margin */
.mat-cbtn + .mat-cbtn { border-left-width: 0; }
.mat-cbtn:last-child { border-radius: 0 3px 3px 0; }
.mat-cbtn.is-active { color: #fff; background: #197afb; border-color: #197afb; z-index: 1; }
/* 线上：版式项（视频 / 图片）选中为浅蓝底蓝字，只有「不启用」是实心蓝底白字 */
.mat-cbtn.is-active.is-layout { color: #197afb; background: #d6eaff; border-color: #197afb; }

/* 线上 el-checkbox「分账户配置」（紧跟区分素材版式按钮组） */
.mat-acct-cb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 16px;
  font-size: 14px;
  color: #606266;
  vertical-align: middle;
  cursor: pointer;
}

/* 组织账户 */
.mat-org-select { width: 300px; }
.mat-alert {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 18px;
  color: #ff9b48;
  background: #fdf6ec;
  border-radius: 3px;
  vertical-align: middle;
}
.mat-alert--info { display: flex; margin-left: 0; color: #4e5969; background: #f2f3f5; }
.mat-alert__icon { flex: none; }
.mat-alert__link { font-size: 12px; height: auto; padding: 0; }

/* 每个创意组配置（线上 el-input-group prepend + 右侧锁图标）
   版式拆分后项数变多：三列 182 宽、列间无间距、行距 16（图文落到第二行） */
.mat-gcount {
  display: grid;
  grid-template-columns: repeat(3, 182px);
  row-gap: 16px;
  align-items: center;
}
/* 动态选取素材页签：每行 4 个（竖版视频 / 横版视频 / 竖版图片 / 横版图片，小图落第二行） */
.mat-gcount--four { grid-template-columns: repeat(4, 190px); }
.mat-gcount__item { display: flex; align-items: center; gap: 10px; }
.mat-gcount__box {
  display: inline-flex;
  align-items: center;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}
.mat-gcount__pre {
  flex: none;
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  white-space: nowrap;
}
.mat-gcount__input {
  flex: none;
  width: 56px;
  height: 30px;
  padding: 0 8px;
  font-size: 13px;
  color: #606266;
  border: none;
  outline: none;
  background: #fff;
}
/* 锁形图标本身画成了锁体在上、锁环在下，翻转 180° 让挂圈朝上（正面朝上） */
.mat-lock { color: #197afb; transform: rotate(180deg); display: inline-flex; }

/* 统一配置创意组名 */
.mat-kw-row { display: flex; align-items: center; }
.mat-kw-input {
  width: 360px;
  height: 32px;
  padding: 0 15px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.mat-kw-input--wide { width: 500px; }
.mat-kw-apply { margin-left: 16px; }
.mat-wildcards { display: flex; align-items: center; margin-top: 9px; height: 15px; }
.mat-wildcards__label { font-size: 12px; color: #999; margin-right: 5px; }
.mat-link {
  height: 28px;
  padding: 0;
  margin-right: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 28px;
  color: #197afb;
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.mat-link--danger { color: #f53f3f; }
.mat-plus { margin-right: 2px; }
.mat-more {
  display: inline-flex;
  align-items: center;
  margin-top: 0;
  font-size: 12px;
  color: #197afb;
  cursor: pointer;
}

/* 提示行 */
.mat-tip { width: 100%; margin-top: 4px; font-size: 12px; line-height: 18px; color: #999; }
.mat-tip--lh32 { line-height: 32px; }
.mat-tip--mt8 { margin-top: 8px; }
.mat-tip--warn { color: #ff7729; }
/* 行内提示（线上 div.ml16.fs12.text-warning.inline-block） */
.mat-inline-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  font-size: 12px;
  line-height: 18px;
  color: #ff7729;
  vertical-align: middle;
}

/* ===== 创意制作 ===== */
.mat-creative { margin-top: 20px; }
.mat-creative__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 56px;
  padding-right: 67px;
  margin-bottom: 14px;
}
.mat-creative__title { display: flex; align-items: baseline; gap: 4px; }
.mat-group-label { font-size: 14px; font-weight: 600; color: #333; }
.mat-group-count { font-size: 12px; color: #999; }
.mat-creative__tools { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

/* 通用按钮（线上 el-button 小号） */
.mat-btn {
  height: 32px;
  padding: 0 15px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  cursor: pointer;
}
.mat-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.mat-btn--border { color: #197afb; background: #fff; border-color: #197afb; }
.mat-btn--text { color: #197afb; background: transparent; border-color: transparent; padding: 0; }
.mat-btn--plain { color: #606266; background: #fff; border-color: #d0d0d0; }
.mat-btn--copy { margin-top: 8px; }
.mat-btn--sm { font-size: 12px; }
.mat-btn--w80 { width: 80px; }
.mat-btn--w120 { width: 120px; }
.mat-btn--w75 { width: 75px; }
.mat-btn:disabled { color: #c0c4cc; background: #f5f7fa; border-color: #e4e7ed; cursor: not-allowed; }
/* 线上 Element UI：主色按钮禁用 = 白字 + #a0cfff 底（覆盖通用禁用态） */
.mat-btn--primary:disabled { color: #fff; background: #a0cfff; border-color: #a0cfff; }
.mat-btn--action {
  height: 24px;
  padding: 0 15px;
  font-size: 14px;
  color: #fff;
  background: #197afb;
  border-color: #197afb;
  border-radius: 4px;
}
.mat-caret { margin-left: 5px; vertical-align: -1px; }

/* 创意组卡片 */
.mat-cgroup-card { border: 1px solid #e5e6eb; border-radius: 4px; margin-bottom: 12px; }
.mat-cgroup-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #f2f3f5;
}
.mat-cgroup-card__name { font-size: 13px; font-weight: 600; color: #333; }
/* 组名右侧铅笔：点击打开「自定义创意组名称」弹窗（图 5 / 图 6） */
.mat-cgroup-card__edit {
  margin-left: 6px;
  margin-right: auto;
  font-size: 13px;
  color: #197afb;
  cursor: pointer;
}
.mat-cgroup-card__edit:hover { color: #4080ff; }
.mat-cgroup-card__ops { display: flex; align-items: center; gap: 12px; }
.mat-cgroup-card__del {
  padding: 0;
  font-size: 12px;
  color: #f53f3f;
  background: none;
  border: none;
  cursor: pointer;
}
.mat-cgroup-card__caret { color: #999; }
.mat-cgroup-card__body { padding: 12px; }
/* 页签行：页签左、按钮右（线上图1 同一行） */
.mat-ctabsbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.mat-ctabbar { display: flex; gap: 8px; margin-left: auto; }
.mat-ctabs { display: flex; }
.mat-ctab {
  height: 32px;
  padding: 0 16px;
  font-size: 14px;
  line-height: 30px;
  color: #606266;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 0;
  cursor: pointer;
  margin-right: -1px;
}
.mat-ctab:first-child { border-radius: 4px 0 0 4px; }
.mat-ctab:last-child { border-radius: 0 4px 4px 0; margin-right: 0; }
.mat-ctab.is-active {
  color: #197afb;
  background: #ecf5ff;
  border-color: #dcdfe6;
  border-bottom: 2px solid #197afb;
}

/* 素材网格 */
.mat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
/* 空态整行 */
.mat-uprow { display: flex; grid-column: 1 / -1; }
/* 空态初始：虚线 + 框（图 1：384×133） */
.mat-upempty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 384px;
  height: 133px;
  background: #fbfcfd;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}
.mat-upempty:hover { border-color: #a0cfff; }
/* 展开后：外面套一个合并外框，内部两块并排（图 2） */
.mat-upwrap {
  display: flex;
  gap: 6px;
  width: 384px;
  height: 133px;
  padding: 6px;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}
.mat-upbox {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  cursor: pointer;
}
.mat-upbox:hover { border-color: #a0cfff; }
.mat-upbox__ico { font-size: 30px; color: #c9cdd4; }
.mat-upbox__text { font-size: 13px; color: #4e5969; }
.mat-upbox__link { color: #4e5969; }
.mat-upbox__link:hover { color: #197afb; }
.mat-upbox__sep { margin: 0 6px; color: #c9cdd4; font-style: normal; }
.mat-item { border: 1px solid #e5e6eb; border-radius: 4px; padding: 8px; position: relative; }
.mat-item__thumb {
  display: flex; align-items: center; justify-content: center;
  position: relative;
  height: 110px; border-radius: 4px;
  background: linear-gradient(135deg, #f2f3f5, #e5e6eb);
  color: #86909c; font-size: 18px;
}
.mat-item__del {
  position: absolute; top: 4px; right: 4px;
  width: 20px; height: 20px; padding: 0; line-height: 18px;
  font-size: 14px; color: #86909c;
  background: rgba(255, 255, 255, 0.9);
  border: 0; border-radius: 2px; cursor: pointer;
}
.mat-item__del:hover { color: #f53f3f; }
.mat-item__name { margin-top: 6px; font-size: 12px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mat-item__ops { display: flex; gap: 10px; margin-top: 4px; }

/* 动态选取规则 */
.mat-empty { padding: 24px 0; text-align: center; }
.mat-empty__text { font-size: 13px; color: #197afb; cursor: pointer; }
.mat-dynrule { display: flex; align-items: center; gap: 10px; margin-top: 10px; }

/* 动态选取规则：卡片回显（图 2） */
.mat-rules { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
.mat-rulecard {
  width: 306px;
  padding: 10px 12px 8px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}
.mat-rulecard__title { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #1d2129; }
.mat-rulecard__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 10px;
  font-size: 12px;
  line-height: 18px;
}
.mat-rulecard__cell { display: flex; min-width: 0; }
.mat-rulecard__cell--span2 { grid-column: span 2; }
.mat-rulecard__cell .k { flex: none; color: #86909c; }
.mat-rulecard__cell .v { color: #1d2129; overflow: hidden; text-overflow: ellipsis; }
.mat-rulecard__ops { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.mat-dynrule__label { font-size: 13px; color: #4e5969; }

/* 分账户选择：账户切换条（横向 tab + 左右箭头） */
.mat-acctbar { display: flex; align-items: center; gap: 8px; margin-top: 18px; }
.mat-acctbar__nav {
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 16px;
  line-height: 20px;
  color: #197afb;
  background: none;
  border: none;
  cursor: pointer;
}
.mat-acctbar__nav:disabled { color: #c9cdd4; cursor: not-allowed; }
.mat-acctbar__list { display: flex; align-items: center; gap: 32px; flex: 1; overflow-x: auto; }
.mat-acctbar__item {
  position: relative;
  padding: 0 2px 9px;
  font-size: 13px;
  color: #4e5969;
  background: none;
  border: none;
  white-space: nowrap;
  cursor: pointer;
}
.mat-acctbar__item.is-active { color: #197afb; font-weight: 500; }
.mat-acctbar__item.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #197afb;
}

/* 动态选取规则区块（标题 + 复制到其他账户 + 右侧按钮组 + 空态插图） */
.mat-creative--rules { margin-top: 20px; }
.mat-rule-title { font-size: 14px; font-weight: 700; color: #1d2129; }
.mat-rule-copy { margin-left: 12px; font-size: 12px; }
.mat-ruleempty {
  padding: 34px 0 42px;
  text-align: center;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}
.mat-ruleempty__img { display: block; margin: 0 auto 10px; }
.mat-ruleempty__text { font-size: 13px; color: #86909c; }
.mat-ruleempty__text .mat-link { font-size: 13px; }
.mat-select, .mat-num {
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}
.mat-select { width: 180px; }
.mat-num { width: 80px; }
</style>
