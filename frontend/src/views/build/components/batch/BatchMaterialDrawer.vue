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
                    @click="v.upload_scope = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 组织账户（线上：始终显示；组织账户下拉右侧跟一个共享提示 alert） -->
            <div class="mat-row" :style="rowStyle('org_account')">
              <div class="mat-row__label mat-row__label--req">组织账户</div>
              <div class="mat-row__content">
                <el-select v-model="v.org_account" class="mat-org-select" placeholder="请选择组织账户">
                  <el-option v-for="o in fieldOf('org_account').options" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                <div v-if="isVisible('org_share_tip')" class="mat-alert">
                  <ClIcon class="mat-alert__icon" :d="icon('question2').d" :size="16" color="#ff9b48" />
                  <span class="mat-alert__text">{{ fieldOf('org_share_tip').text }}</span>
                  <el-button link type="primary" class="mat-alert__link">{{ fieldOf('org_share_tip').linkText }}</el-button>
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
                    :class="{ 'is-active': isLayoutOn(o.value) }"
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
                <div class="mat-gcount" :style="{ gap: (fieldOf('group_config').itemGap || 32) + 'px' }">
                  <div
                    v-for="it in fieldOf('group_config').items"
                    :key="it.value"
                    class="mat-gcount__item"
                    :style="{ width: (fieldOf('group_config').itemWidth || 182) + 'px' }"
                  >
                    <div class="mat-gcount__box">
                      <span class="mat-gcount__pre">{{ it.label }}</span>
                      <input
                        class="mat-gcount__input"
                        type="text"
                        :value="v.group_counts[it.value]"
                        @input="onGroupCount(it.value, $event.target.value)"
                      />
                    </div>
                    <el-tooltip :content="it.lockTip" placement="top" :show-after="200">
                      <ClIcon class="mat-lock" :d="icon(it.lockIcon || 'lock2').d" :size="14" color="#197afb" />
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
                  <span class="mat-more" @click="onMoreMenu(fieldOf('group_name_template').moreText)">
                    <ClIcon class="mat-plus" :d="icon('insert').d" :size="12" color="#2681fc" />{{ fieldOf('group_name_template').moreText }}
                  </span>
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
                <button class="mat-btn mat-btn--text mat-btn--sm" @click="clearMaterials">清空</button>
                <el-dropdown>
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
                <el-dropdown>
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
                <span class="mat-cgroup-card__name">创意组{{ String(gi + 1).padStart(2, '0') }}</span>
                <ClIcon class="mat-cgroup-card__caret" :d="icon('caretBottom').d" :size="16" color="#999" />
              </div>
              <div class="mat-cgroup-card__body">
                <div class="mat-ctabbar">
                  <button class="mat-btn mat-btn--plain mat-btn--sm" @click="pickMaterial(gi)">
                    <ClIcon class="mat-plus" :d="icon('plus').d" :size="12" color="#c0c4cc" />添加素材
                  </button>
                  <!-- 线上：引导视频 = 原链路 / 新链路 时出现「添加引导视频」 -->
                  <button
                    v-if="isVisible('guide_video_btn')"
                    class="mat-btn mat-btn--plain mat-btn--sm"
                    @click="pickGuideVideo"
                  ><ClIcon class="mat-plus" :d="icon('plus').d" :size="12" color="#c0c4cc" />{{ fieldOf('guide_video_btn').text }}</button>
                </div>
                <div class="mat-ctabs">
                  <button
                    v-for="t in creativeTabs"
                    :key="t.value"
                    class="mat-ctab"
                    :class="{ 'is-active': g.tab === t.value }"
                    @click="g.tab = t.value"
                  >{{ t.label }}</button>
                </div>
                <div class="mat-grid">
                  <div v-for="m in groupItems(g, g.tab)" :key="m.id" class="mat-item">
                    <div class="mat-item__thumb"><span class="mat-item__ph">{{ shortName(m) }}</span></div>
                    <div class="mat-item__name">{{ m.title || m.name || m.id }}</div>
                    <!-- 线上：分账户选择 / 区分素材版式=视频/图片 时素材卡上的操作按钮收起 -->
                    <div v-if="isVisible('material_ops')" class="mat-item__ops">
                      <button class="mat-btn mat-btn--action mat-btn--w120">重新上传</button>
                      <button class="mat-btn mat-btn--action mat-btn--w75">智能封面</button>
                    </div>
                  </div>
                  <el-empty v-if="!groupItems(g, g.tab).length" description="暂无素材" :image-size="60" />
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
                    @click="v.upload_scope = o.value"
                  >{{ o.label }}</button>
                </div>
              </div>
            </div>

            <!-- 组织账户 -->
            <div class="mat-row" :style="rowStyle('org_account')">
              <div class="mat-row__label mat-row__label--req">组织账户</div>
              <div class="mat-row__content">
                <el-select v-model="v.org_account" class="mat-org-select" placeholder="请选择组织账户">
                  <el-option v-for="o in fieldOf('org_account').options" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                <div v-if="isVisible('org_share_tip')" class="mat-alert">
                  <ClIcon class="mat-alert__icon" :d="icon('question2').d" :size="16" color="#ff9b48" />
                  <span class="mat-alert__text">{{ fieldOf('org_share_tip').text }}</span>
                  <el-button link type="primary" class="mat-alert__link">{{ fieldOf('org_share_tip').linkText }}</el-button>
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

            <!-- 区分素材版式（分规则设置时整行消失） -->
            <div v-if="isVisible('separate_layout')" class="mat-row" :style="rowStyle('separate_layout')">
              <div class="mat-row__label">区分素材版式</div>
              <div class="mat-row__content">
                <div class="mat-cgroup">
                  <button
                    v-for="o in fieldOf('separate_layout').options"
                    :key="o.value"
                    class="mat-cbtn"
                    :class="{ 'is-active': isLayoutOn(o.value) }"
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
                  <div class="mat-gcount" :style="{ gap: (fieldOf('group_config').itemGap || 32) + 'px' }">
                    <div
                      v-for="it in fieldOf('group_config').items"
                      :key="it.value"
                      class="mat-gcount__item"
                      :style="{ width: (fieldOf('group_config').itemWidth || 182) + 'px' }"
                    >
                      <div class="mat-gcount__box">
                        <span class="mat-gcount__pre">{{ it.label }}</span>
                        <input
                          class="mat-gcount__input"
                          type="text"
                          :value="v.group_counts[it.value]"
                          @input="onGroupCount(it.value, $event.target.value)"
                        />
                      </div>
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

            <!-- 复制到其他账户（多账户分配规则 = 分账户选择 时出现，置灰） -->
            <div v-if="isVisible('copy_to_other_account')" class="mat-row">
              <div class="mat-row__label"></div>
              <div class="mat-row__content">
                <button class="mat-btn mat-btn--copy" disabled>{{ fieldOf('copy_to_other_account').text }}</button>
              </div>
            </div>
          </div>

          <!-- 动态选取规则 -->
          <div class="mat-creative">
            <div class="mat-creative__head">
              <div class="mat-creative__tools">
                <button class="mat-btn mat-btn--primary mat-btn--sm" @click="addDynRule">+ 添加动态选取规则</button>
                <button
                  class="mat-btn mat-btn--default mat-btn--sm"
                  :disabled="isDisabled('add_fixed_rule_btn')"
                  @click="addFixedRule"
                >{{ fieldOf('add_fixed_rule_btn').text }}</button>
              </div>
            </div>
            <div v-if="!form.materials.dynamic_rules.length" class="mat-empty">
              <span class="mat-empty__text">点击添加</span>
            </div>
            <div v-for="(r, ri) in form.materials.dynamic_rules" :key="ri" class="mat-dynrule">
              <select class="mat-select" :value="r.material_type" @change="onDynRuleType(ri, $event.target.value)">
                <option value="VIDEO">视频</option>
                <option value="IMAGE">图片</option>
                <option value="TEXT_IMAGE">图文</option>
              </select>
              <span class="mat-dynrule__label">每个广告使用</span>
              <input class="mat-num" type="text" :value="r.count" @input="onDynRuleCount(ri, $event.target.value)" />
              <button class="mat-link mat-link--danger" @click="removeDynRule(ri)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BatchDrawer>
</template>

<script setup>
import { computed, h, inject, reactive, watch } from 'vue';
import BatchDrawer from './BatchDrawer.vue';
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
  pickMaterial, addLocalMaterial, pickTextImage, autoCreateTextImage, addSurgeMaterial,
  pickGuideVideo, pickCover, addGroup, removeGroup, addDynRule, removeDynRule,
  addFixedRule, confirmMaterials,
} = batch;

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
    Object.keys(keys).forEach((k) => { v[k] = false; });
    v.separate_layout = ['OFF'];
    return;
  }
  const key = keys[value];
  if (key) v[key] = !v[key];
  const on = Object.keys(keys).filter((k) => v[k]).map((k) => Object.keys(keys).find((kk) => keys[kk] === k));
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

/** 创意组页签（线上：视频(10/10) 图片(0/1) 图文(0/1)） */
const creativeTabs = computed(() => [
  { value: 'video', label: `视频(${countOf('video')}/${v.group_counts.VIDEO || 0})` },
  { value: 'image', label: `图片(${countOf('image')}/${v.group_counts.IMAGE || 0})` },
  { value: 'text', label: `图文(${countOf('text')}/${v.group_counts.TEXT_IMAGE || 0})` },
]);

function countOf(kind) {
  const g = form.materials.creative_groups[0];
  if (!g) return 0;
  if (kind === 'video') return (g.videos || []).length;
  if (kind === 'image') return (g.images || []).length;
  return (g.text_images || []).length;
}

function groupItems(g, kind) {
  const ids = kind === 'video' ? (g.videos || []) : kind === 'image' ? (g.images || []) : (g.text_images || []);
  const pool = kind === 'video' ? (videos.value || []) : kind === 'image' ? (images.value || []) : [];
  return ids.map((id) => pool.find((x) => x.id === id) || { id, title: String(id) });
}
function shortName(m) {
  const t = String(m.title || m.name || m.id || '');
  return t.slice(0, 2);
}

/** 数量输入 */
function onGroupCount(key, val) {
  v.group_counts[key] = val;
  if (key === 'VIDEO') form.materials.group_video_count = Number(val) || 0;
  if (key === 'IMAGE') form.materials.group_image_count = Number(val) || 0;
  if (key === 'TEXT_IMAGE') form.materials.group_text_count = Number(val) || 0;
}

function onDynRuleType(ri, val) {
  const r = form.materials.dynamic_rules[ri];
  if (r) r.material_type = val;
}

function onDynRuleCount(ri, val) {
  const r = form.materials.dynamic_rules[ri];
  if (r) r.count = Number(val) || 0;
}

/** 通配符追加 */
function appendGroupWildcard(text) {
  const cur = v.group_name_template || '';
  v.group_name_template = cur ? `${cur}{${text}}` : `{${text}}`;
}

function onMoreMenu(m) {
  if (m === '批量添加封面') pickCover(true);
  else if (m === '一键指定封面') pickCover(false);
  else if (m === '插入更多') pickCover(false);
}
function onAddMaterial(m) {
  if (m === '添加本地素材') addLocalMaterial();
  else if (m === '添加冲量素材') addSurgeMaterial();
  else if (m === '添加已有图文') pickTextImage();
  else if (m === '自动新建图文') autoCreateTextImage();
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
    IMAGE: String(m.group_image_count ?? 1),
    TEXT_IMAGE: String(m.group_text_count ?? 1),
  };
  v.group_name_template = m.group_name_template || '';
  v.guide_video = m.guide_video || 'OFF';
  v.ad_material_count_mode = m.ad_material_count_mode || 'SAME';
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

/* 每个创意组配置（线上 el-input-group prepend + 右侧锁图标） */
.mat-gcount { display: flex; }
.mat-gcount__item { display: flex; align-items: center; justify-content: space-between; }
.mat-gcount__box {
  display: flex;
  align-items: center;
  width: 80px;
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
}
.mat-gcount__input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  font-size: 13px;
  color: #606266;
  border: none;
  outline: none;
  background: #fff;
}
.mat-lock { color: #197afb; }

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
.mat-cgroup-card__caret { color: #999; }
.mat-cgroup-card__body { padding: 12px; }
.mat-ctabbar { display: flex; gap: 8px; margin-bottom: 10px; }
.mat-ctabs { display: flex; margin-bottom: 12px; }
.mat-ctab {
  height: 32px;
  padding: 0 16px;
  font-size: 14px;
  line-height: 30px;
  color: #606266;
  background: none;
  border: 1px solid #e5e6eb;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  margin-right: 4px;
}
.mat-ctab.is-active { color: #197afb; border-top: 2px solid #197afb; background: #fff; }

/* 素材网格 */
.mat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.mat-item { border: 1px solid #e5e6eb; border-radius: 4px; padding: 8px; }
.mat-item__thumb {
  display: flex; align-items: center; justify-content: center;
  height: 110px; border-radius: 4px;
  background: linear-gradient(135deg, #f2f3f5, #e5e6eb);
  color: #86909c; font-size: 18px;
}
.mat-item__name { margin-top: 6px; font-size: 12px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mat-item__ops { display: flex; gap: 10px; margin-top: 4px; }

/* 动态选取规则 */
.mat-empty { padding: 24px 0; text-align: center; }
.mat-empty__text { font-size: 13px; color: #197afb; cursor: pointer; }
.mat-dynrule { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.mat-dynrule__label { font-size: 13px; color: #4e5969; }
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
