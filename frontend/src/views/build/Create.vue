<template>
  <div v-loading="submitting" class="batch-page">
    <!-- 顶部标题栏 -->
    <div class="top-bar">
      <div class="page-title">程序化批量 / {{ mediaTitle }}</div>
      <div class="top-right">
        <el-tag v-if="strategyGroup" type="primary" effect="light">
          已套用策略组：{{ strategyGroup.name }}
        </el-tag>
        <el-link class="task-link" @click="goTasks"><el-icon><Tickets /></el-icon> 查看任务管理</el-link>
      </div>
    </div>

    <div class="card main-card">
      <!-- 顶部操作区：选择策略 / 选择任务 + 预估生成（可展开分账户明细） -->
      <div class="seg-row">
        <div class="seg">
          <el-button type="primary" @click="strategyVisible = true">选择策略</el-button>
          <el-button type="primary" @click="taskVisible = true">选择任务</el-button>
        </div>
        <div class="est-wrap">
          <div class="est" @click="estOpen = !estOpen">
            预估生成 <b>{{ est.total }}</b> 条{{ isOc ? '项目' : '广告' }}
            <el-icon class="est__caret"><ArrowUp v-if="estOpen" /><ArrowDown v-else /></el-icon>
          </div>
          <div v-show="estOpen" class="est-panel">
            <el-table :data="est.rows" size="small" border>
              <el-table-column label="账户" prop="account" min-width="200" show-overflow-tooltip />
              <el-table-column label="项目数" prop="projects" width="90" align="right" />
              <el-table-column label="创意组数" prop="groups" width="100" align="right" />
              <el-table-column label="广告数" prop="ads" width="90" align="right" />
            </el-table>
            <div class="est-total">合计：{{ est.total }} 条{{ isOc ? '项目' : '广告' }}</div>
          </div>
        </div>
      </div>

      <!-- 媒体账户 / 规则配置 配置条（对齐线上：两组带边框的分组控件） -->
      <div class="rule-row">
        <div class="rule-box rule-box--acct">
          <span class="rule-box__label">媒体账户</span>
          <!-- 只展示第一个账户名称，鼠标移入展示全部已选账户 -->
          <el-tooltip placement="top" :disabled="selectedAccounts.length <= 1" :show-after="200">
            <template #content>
              <div class="acct-all">
                <div v-for="a in selectedAccounts" :key="a.id" class="acct-all__item">{{ a.name }}</div>
              </div>
            </template>
            <span class="rule-box__value" :class="{ placeholder: !form.account_ids.length }">{{ accountSummary }}</span>
          </el-tooltip>
          <el-button link type="primary" class="rule-box__act" @click="acctVisible = true">更改</el-button>
        </div>
        <div class="rule-box" v-if="isUpgrade">
          <span class="rule-box__label">规则配置</span>
          <span class="rule-box__value">{{ ruleSummary }}</span>
          <el-button link type="primary" class="rule-box__act" @click="ruleVisible = true">更改</el-button>
        </div>
        <div class="rule-item" v-if="isUni">
          <span class="rule-label">项目生成规则</span>
          <el-radio-group v-model="form.uni_rule_mode" size="small">
            <el-radio value="max_count">按抖音号或商品数量</el-radio>
            <el-radio value="cross_product">按抖音号数×商品数</el-radio>
          </el-radio-group>
        </div>
        <div class="rule-item" v-if="isOc">
          <span class="rule-label">项目规则</span>
          <span class="rule-value">按应用×抖音号</span>
        </div>
      </div>

      <!-- 五列配置区（对齐线上：项目 / 广告信息 / 创意素材 / 标题包 / 落地页） -->
      <div class="grid-cols">
        <!-- 新建项目 / 已有项目 -->
        <div class="col">
          <div class="col-head">{{ projColTitle }}</div>
          <div class="col-body col-body--center">
            <!-- 未选媒体账户时，线上仅展示居中的「请选择媒体账户」入口 -->
            <el-link v-if="!form.account_ids.length" type="primary" class="col-pick" @click="acctVisible = true">请选择媒体账户</el-link>
            <div v-else class="mode-split">
              <div class="mode-split__cell" :class="{ active: form.create_mode === 'EXIST' }" @click="openExisting">
                <span class="mode-split__text">选择已有项目</span>
              </div>
              <div class="mode-split__cell" :class="{ active: form.create_mode === 'NEW' }" @click="switchToNewProject">
                <span class="mode-split__text">新建项目</span>
              </div>
            </div>
          </div>
          <div class="col-foot">
            <el-tooltip content="请选择媒体账户" placement="top" :disabled="!!form.account_ids.length">
              <span>
                <el-button
                  link
                  type="primary"
                  :disabled="!form.account_ids.length"
                  @click="form.create_mode === 'EXIST' ? openExisting() : switchToNewProject()"
                >编辑</el-button>
              </span>
            </el-tooltip>
          </div>
        </div>

        <!-- 基础信息 / 广告信息 -->
        <div class="col">
          <div class="col-head"><span class="col-head__title">{{ cardTitle.ad }}</span></div>
          <div class="col-body">
            <div class="col-line">广告名称: {{ form.ad.name_template || '未设置' }}</div>
            <div class="col-line">产品名称: {{ form.ad.product_name || form.project.app_name || '无' }}</div>
          </div>
          <div class="col-foot">
            <el-tooltip content="请配置项目信息" placement="top" :disabled="projectConfigured">
              <span><el-button link type="primary" :disabled="!projectConfigured" @click="adVisible = true">编辑</el-button></span>
            </el-tooltip>
          </div>
        </div>

        <!-- 创意素材 -->
        <div class="col">
          <div class="col-head">
            <span class="col-head__title">创意素材</span>
            <span class="col-count">已选创意组: {{ materialCount }}/500</span>
            <el-button link type="primary" class="col-head__act" @click="clearMaterials">清空</el-button>
          </div>
          <div class="col-body">
            <el-empty v-if="!materialCount" description="暂无创意素材" :image-size="60" />
            <div v-else class="material-list">
              <div v-for="v in selectedVideos" :key="v.id" class="material-chip">🎬 {{ v.title }}</div>
              <div v-for="im in selectedImages" :key="im.id" class="material-chip">🖼 {{ im.title }}</div>
            </div>
          </div>
          <div class="col-foot">
            <el-button link type="primary" :disabled="!form.account_ids.length" @click="matVisible = true">编辑</el-button>
          </div>
        </div>

        <!-- 标题 / 标题包 -->
        <div class="col">
          <div class="col-head">
            <span class="col-head__title">{{ cardTitle.title }}</span>
            <span class="col-count">已选: {{ titleCount }}/{{ isUni ? 100 : 200 }}</span>
            <el-button link type="primary" class="col-head__act" @click="shuffleTitles">乱序</el-button>
            <el-button link type="primary" class="col-head__act" @click="clearTitles">清空</el-button>
          </div>
          <div class="col-body">
            <el-empty v-if="!titleCount" description="暂无" :image-size="60" />
            <div v-else class="material-list">
              <div v-for="t in selectedTitlePacks" :key="t.id" class="material-chip">📝 {{ t.title }}</div>
            </div>
          </div>
          <div class="col-foot">
            <el-button link type="primary" :disabled="!form.account_ids.length" @click="titleVisible = true">编辑</el-button>
          </div>
        </div>

        <!-- 落地页（仅标准） -->
        <div class="col" v-if="isUpgrade">
          <div class="col-head">
            <span class="col-head__title">落地页</span>
            <el-button link type="primary" class="col-head__act" @click="clearLanding">清空</el-button>
          </div>
          <div class="col-body">
            <el-empty v-if="!landingSelected" description="暂无" :image-size="60" />
            <div v-else class="col-line">{{ landingSummary }}</div>
          </div>
          <div class="col-foot">
            <el-tooltip content="请配置项目信息" placement="top" :disabled="projectConfigured">
              <span><el-button link type="primary" :disabled="!projectConfigured" @click="lpVisible = true">编辑</el-button></span>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 抖音号 / 产品信息 / 广告设置（项目信息配置完成后才出现，对齐线上默认页） -->
      <div class="cfg-btns" v-if="projectConfigured">
        <el-tooltip content="请配置项目信息" placement="top" :disabled="projectConfigured">
          <span><el-button :disabled="!projectConfigured" @click="awemeVisible = true">抖音号</el-button></span>
        </el-tooltip>
        <el-tooltip content="请配置项目信息" placement="top" :disabled="projectConfigured">
          <span><el-button :disabled="!projectConfigured" @click="productVisible = true">产品信息</el-button></span>
        </el-tooltip>
        <el-tooltip content="请配置项目信息" placement="top" :disabled="projectConfigured">
          <span><el-button :disabled="!projectConfigured" @click="adSettingVisible = true">广告设置</el-button></span>
        </el-tooltip>
      </div>
    </div>

    <!-- 底部操作条 -->
    <div class="action-bar">
      <el-button type="primary" @click="saveVisible = true">{{ isUni ? '保存策略' : '保存策略组' }}</el-button>
      <el-button v-if="isUni" @click="onSubmit">全部提交审核</el-button>
      <el-tooltip :content="previewTip" placement="top" :disabled="canPreview">
        <span>
          <el-button type="primary" :disabled="!canPreview" :loading="previewing" @click="onPreview">
            {{ isOc ? '生成项目预览' : '生成广告预览' }}
          </el-button>
        </span>
      </el-tooltip>
    </div>

    <!-- 预览区 -->
    <el-card class="preview-card">
      <div class="preview-title">预览区</div>
      <template v-if="preview">
        <div class="stat-block">
          <div class="stat-title">预估生成{{ isOc ? '项目' : '广告' }}数</div>
          <div class="stat-value">{{ preview.total }}</div>
        </div>
        <el-alert v-if="preview.truncated" type="warning" :closable="false" title="组合数已达系统上限，超出部分已截断" style="margin: 12px 0" />
        <div class="precheck-list">
          <div v-for="(w, i) in preview.precheck || []" :key="i" class="precheck-item">
            <el-tag :type="w.level === 'error' ? 'danger' : w.level === 'ok' ? 'success' : 'warning'">{{ w.level }}</el-tag>
            <span class="precheck-item__msg">{{ w.message }}</span>
          </div>
        </div>
        <el-table v-if="preview.combinations?.length" :data="preview.combinations" size="small" border style="margin-top: 12px">
          <el-table-column label="计划名" prop="name" />
        </el-table>
      </template>
      <el-empty v-else description="请先完成相应模块配置，再预览内容" />
    </el-card>

    <!-- 账户选择弹窗（对齐线上：一行筛选 + 左侧账户表 + 右侧「已选」面板 + 分页） -->
    <el-dialog
      v-model="acctVisible"
      title="选择媒体账户"
      width="1136px"
      class="acct-dialog"
      :close-on-click-modal="false"
      @open="onAcctOpen"
    >
      <div class="acct-filter">
        <el-select v-model="acctFilter.project" class="acct-f acct-f--project" clearable placeholder="智投项目">
          <template #prefix><span class="acct-f__label">智投项目:</span></template>
          <el-option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</el-option>
        </el-select>
        <el-select v-model="acctFilter.subject" class="acct-f acct-f--subject" clearable placeholder="账户主体">
          <template #prefix><span class="acct-f__label">账户主体:</span></template>
          <el-option :value="subject">{{ subject }}</el-option>
        </el-select>
        <!-- 搜索组（对齐线上 图2：[账户ID ∨] | [搜索媒体账户 + 批量搜索] | [搜索按钮]） -->
        <div class="acct-sg">
          <el-select v-model="acctFilter.id_type" class="acct-sg__type">
            <el-option label="账户ID" value="id" />
            <el-option label="账户名称" value="name" />
          </el-select>
          <el-input
            v-model="acctFilter.keyword"
            class="acct-sg__input"
            placeholder="搜索媒体账户"
            clearable
            @keyup.enter="onAcctSearch"
          >
            <template #suffix>
              <!-- 批量搜索：输入多个账户ID / 账户名称，一行一个 -->
              <el-popover
                v-model:visible="batchVisible"
                placement="bottom"
                trigger="click"
                :width="610"
                :offset="8"
                popper-class="acct-batch-pop"
              >
                <template #reference>
                  <el-icon class="acct-search__batch" title="批量搜索">
                    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                      <path d="M2.6 4.2h8.2M2.6 7.6h8.2M2.6 11h5.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      <circle cx="12.8" cy="12.8" r="4.4" fill="none" stroke="currentColor" stroke-width="1.5" />
                      <path d="M16.1 16.1 19.2 19.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                  </el-icon>
                </template>
                <div class="acct-batch">
                  <div class="acct-batch__head">
                    <span class="acct-batch__title">请输入{{ batchTypeLabel }} ({{ batchCount }}/1000)</span>
                    <el-button link type="primary" class="acct-batch__clear" @click="clearBatch">清空</el-button>
                  </div>
                  <div class="acct-batch__hint">
                    每一行为一个关键词，批量搜索将执行<span class="acct-batch__link" title="批量搜索按整行内容做精确匹配">精确匹配</span>。
                  </div>
                  <div class="acct-batch__editor">
                    <div ref="batchGutterRef" class="acct-batch__gutter">
                      <div v-for="n in batchLineCount" :key="n" class="acct-batch__ln">{{ n }}</div>
                    </div>
                    <el-input
                      v-model="batchText"
                      type="textarea"
                      class="acct-batch__input"
                      :rows="9"
                      resize="none"
                      :placeholder="`请粘贴或输入${batchTypeLabel}，回车可换行`"
                      @scroll="onBatchScroll"
                    />
                  </div>
                  <div class="acct-batch__foot">
                    <el-button @click="clearBatch">清空</el-button>
                    <el-button type="primary" @click="applyBatchSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </template>
          </el-input>
          <button type="button" class="acct-sg__btn" title="搜索" @click="onAcctSearch">
            <el-icon><Search /></el-icon>
          </button>
        </div>
        <el-button link type="primary" class="acct-clear" @click="clearAcctFilter">清空</el-button>
      </div>
      <div class="acct-tip"><el-icon class="acct-tip__icon"><Warning /></el-icon> 仅支持同主体账户</div>

      <div class="acct-body">
        <el-table
          ref="acctTableRef"
          :data="acctPageRows"
          row-key="id"
          border
          size="small"
          height="398"
          @selection-change="onAcctSelection"
        >
          <el-table-column type="selection" width="44" reserve-selection />
          <el-table-column label="账户名称" prop="name" min-width="230" sortable show-overflow-tooltip>
            <template #default="{ row }">
              <div class="acct-name">{{ row.name }}</div>
              <div class="acct-id">ID: {{ row.advertiser_id }}</div>
            </template>
          </el-table-column>
          <el-table-column label="账户主体" prop="subject" min-width="130" sortable show-overflow-tooltip>
            <template #default="{ row }">{{ row.subject || subject }}</template>
          </el-table-column>
          <el-table-column label="账户备注(巨量)" prop="remark_jl" min-width="135" show-overflow-tooltip>
            <template #default="{ row }">{{ row.remark_jl || '--' }}</template>
          </el-table-column>
          <el-table-column label="智投项目" prop="project" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project || '--' }}</template>
          </el-table-column>
          <el-table-column label="账户余额" prop="balance" min-width="110" sortable>
            <template #default="{ row }">{{ formatBalance(row.balance) }}</template>
          </el-table-column>
        </el-table>

        <!-- 右侧已选面板 -->
        <div class="acct-picked">
          <div class="acct-picked__head">
            <span class="acct-picked__title">已选({{ acctTemp.length }}/50)</span>
            <el-button link type="primary" class="acct-picked__clear" @click="clearAcctSelection">清空</el-button>
          </div>
          <div class="acct-picked__body">
            <div v-for="a in acctTemp" :key="a.id" class="acct-picked__item">
              <span class="acct-picked__name" :title="a.name">{{ a.name }}</span>
              <el-icon class="acct-picked__del" title="移除" @click="removeAccount(a)"><Close /></el-icon>
            </div>
            <el-empty v-if="!acctTemp.length" description="暂无" :image-size="48" />
          </div>
        </div>
      </div>

      <div class="acct-pager">
        <span class="acct-total">共 {{ filteredAccounts.length }} 条</span>
        <el-select v-model="acctPageSize" class="acct-size" size="small">
          <el-option v-for="s in [10, 20, 50, 100]" :key="s" :label="`${s}条/页`" :value="s" />
        </el-select>
        <el-pagination
          v-model:current-page="acctPage"
          :page-size="acctPageSize"
          :total="filteredAccounts.length"
          layout="prev, pager, next"
          size="small"
        />
        <span class="acct-jump">前往</span>
        <el-input v-model="acctJumpPage" class="acct-jump__input" size="small" />
        <span class="acct-jump">页</span>
      </div>

      <template #footer>
        <el-button @click="acctVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAccounts">确定</el-button>
      </template>
    </el-dialog>

    <!-- 规则配置弹窗（卡片式，对齐线上：新建项目 / 已有项目 两套内容） -->
    <el-dialog v-model="ruleVisible" title="规则配置" width="1136px" class="rule-dialog">
      <el-form label-position="left" label-width="160px" class="rule-form">
        <el-form-item label="创建方式">
          <el-radio-group v-model="form.create_mode">
            <el-radio-button value="NEW">新建项目</el-radio-button>
            <el-radio-button value="EXIST">已有项目</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <!-- 新建项目：项目生成规则（5 张卡片，按资产组恒置灰） -->
        <template v-if="form.create_mode === 'NEW'">
          <el-form-item label="项目生成规则">
            <div class="rule-cards">
              <div
                v-for="r in PROJECT_RULES" :key="r.value"
                class="rule-card" :class="{ active: form.project_rule === r.value, disabled: r.disabled }"
                @click="pickRule('project_rule', r)"
              >
                <div class="rule-card__title">{{ r.label }}</div>
                <div class="rule-card__desc">{{ r.desc }}</div>
              </div>
            </div>
          </el-form-item>
          <!-- 项目生成规则=指定数量：每个账户指定项目数 -->
          <el-form-item v-if="form.project_rule === 'BY_COUNT'" label="每个账户指定项目数" class="rule-inline-item">
            <el-input-number v-model="form.projects_per_account" :min="1" :max="500" controls-position="right" />
          </el-form-item>
        </template>
        <!-- 广告生成规则（两种创建方式都有；卡片可用性随创建方式 / 项目生成规则联动） -->
        <el-form-item label="广告生成规则">
          <div class="rule-cards">
            <div
              v-for="r in AD_RULES" :key="r.value"
              class="rule-card" :class="{ active: form.ad_rule === r.value, disabled: isAdRuleDisabled(r) }"
              @click="pickRule('ad_rule', r)"
            >
              <div class="rule-card__title">{{ r.label }}</div>
              <div class="rule-card__desc">{{ adRuleDesc(r) }}</div>
            </div>
          </div>
        </el-form-item>
        <!-- 项目生成规则=按总广告数/每项目广告数：每个项目广告数上限（单行展示，不换行） -->
        <el-form-item
          v-if="form.create_mode === 'NEW' && form.project_rule === 'BY_TOTAL'"
          label="每个项目广告数上限" class="rule-inline-item"
        >
          <el-tooltip content="已生成的广告数，超过项目内广告数上限时，自动填充到新的项目内；广告数未达上限时则不生成新项目" placement="top">
            <span class="rule-qa">ⓘ</span>
          </el-tooltip>
          <el-input-number v-model="form.ads_limit_per_project" :min="1" :max="500" :step="10" controls-position="right" />
        </el-form-item>
        <!-- 广告生成规则=指定数量：每个项目指定广告数（单行展示，不换行） -->
        <el-form-item v-if="form.ad_rule === 'BY_COUNT'" label="每个项目指定广告数" class="rule-inline-item">
          <el-tooltip content="指定每个项目内包含的广告数量，广告数量不足时重复使用广告" placement="top">
            <span class="rule-qa">ⓘ</span>
          </el-tooltip>
          <el-input-number v-model="form.ads_per_project" :min="1" :max="500" :step="10" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleVisible = false">取消</el-button>
        <el-button type="primary" @click="ruleVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 项目配置弹窗 -->
    <el-drawer v-model="projVisible" :title="cardTitle.proj" size="780px" direction="rtl">
      <el-form :model="form.project" class="drawer-form" label-position="top">
        <!-- 推广目的 -->
        <div class="form-section">
          <div class="form-section__title">推广目的</div>
        <el-radio-group v-model="form.project.objective" @change="onObjectiveChange" class="obj-grid">
          <el-radio v-for="o in OBJECTIVES" :key="o.value" :value="o.value" class="obj-card">
            <span class="obj-label">{{ o.label }}</span>
            <span class="obj-desc">{{ o.desc }}</span>
          </el-radio>
        </el-radio-group>
        <el-row v-if="form.project.objective === 'APP'" :gutter="12" style="margin-top: 12px">
          <el-col :span="12">
            <el-form-item label="应用子目标" required>
              <el-radio-group v-model="form.project.app_promotion_type" @change="onAppPromoChange">
                <el-radio v-for="o in APP_PROMOTION_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 基础属性 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">基础属性</div>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="广告类型" required>
              <el-select v-model="form.project.ad_type" style="width: 100%">
                <el-option v-for="o in AD_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="投放类型">
              <el-select v-model="form.project.delivery_type" style="width: 100%">
                <el-option v-for="o in AD_DELIVERY_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="投放模式">
              <el-select v-model="form.project.delivery_mode" style="width: 100%">
                <el-option v-for="o in DELIVERY_MODE_EXTRA" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="营销场景" required>
              <el-select v-model="form.project.marketing_goal" style="width: 100%">
                <el-option v-for="o in MARKETING_GOALS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内广项目">
              <el-radio-group v-model="form.project.inner_promotion">
                <el-radio value="OFF">不开启</el-radio>
                <el-radio value="ON">开启</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="项目默认状态">
              <el-radio-group v-model="form.project.operation">
                <el-radio value="DISABLE">暂停</el-radio>
                <el-radio value="ENABLE">开启</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.project.objective === 'MICRO_GAME'" :gutter="12">
          <el-col :span="8">
            <el-form-item label="小程序类型" required>
              <el-select v-model="form.project.micro_promotion_type" style="width: 100%">
                <el-option v-for="o in MICRO_PROMOTION_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="assetTypeOptions.length" :gutter="12">
          <el-col :span="8">
            <el-form-item label="投放载体" required>
              <el-select v-model="form.project.asset_type" style="width: 100%">
                <el-option v-for="o in assetTypeOptions" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 关联产品投放 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">关联产品投放</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="关联产品">
              <el-radio-group v-model="form.project.related_product">
                <el-radio value="OFF">不启用</el-radio>
                <el-radio value="ON">启用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <template v-if="form.project.related_product === 'ON'">
          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="每个项目配置产品数">
                <el-input-number v-model="form.project.product_count" :min="1" :max="20" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产品版本">
                <el-select v-model="form.project.product_version" style="width: 100%">
                  <el-option v-for="o in PRODUCT_VERSIONS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="产品来源">
                <el-select v-model="form.project.product_source" style="width: 100%">
                  <el-option v-for="o in PRODUCT_SOURCES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="工作台版本">
                <el-select v-model="form.project.workbench_version" style="width: 100%">
                  <el-option v-for="o in WORKBENCH_VERSIONS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="匹配方式">
                <el-select v-model="form.project.product_match_mode" style="width: 100%">
                  <el-option value="ALL_SAME" label="所有项目选择同一组产品" />
                  <el-option value="PER_ACCOUNT" label="每个账户选择一组产品" />
                  <el-option value="PER_SUBJECT" label="每个主体选择一组产品" />
                  <el-option value="PER_PROJECT" label="每个项目选择一组产品" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="24">
              <el-form-item label="选择产品">
                <el-select v-model="form.project.product_ids" multiple filterable placeholder="选择产品" style="width: 100%">
                  <el-option v-for="p in productOptions" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- AIGC 动态创意 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">AIGC动态创意</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="AIGC动态创意">
              <el-radio-group v-model="form.project.aigc_creative">
                <el-radio value="OFF">不启用</el-radio>
                <el-radio value="ON">启用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="dlg-tip">白名单功能。开启 AIGC 动态创意，请确保产品所有者在行业产品中心已申请获取短副原片的使用授权，如未完成，可能影响素材生成效果。</div>

        <!-- 投放内容与目标 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">投放内容与目标</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="关联星广联投任务">
              <el-radio-group v-model="form.project.star_task">
                <el-radio value="OFF">不启用</el-radio>
                <el-radio value="ON">启用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="dlg-tip">账户需开通星广联投白名单，否则新建会报错。</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="平台类型">
              <el-checkbox-group v-model="form.project.platform_types">
                <el-checkbox v-for="o in PLATFORM_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应用名称">
              <el-input v-model="form.project.app_name" placeholder="请输入应用名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="24">
            <el-form-item label="监测链接来源">
              <el-radio-group v-model="form.project.track_link_source">
                <el-radio v-for="o in TRACK_LINK_SOURCES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="匹配方式">
              <el-radio-group v-model="form.project.link_group_match">
                <el-radio value="PER_ACCOUNT">每个账户选择一个链接组</el-radio>
                <el-radio value="PER_PROJECT">每个项目选择一个链接组</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选择链接组">
              <el-select v-model="form.project.link_group_id" clearable placeholder="选择链接组" style="width: 100%">
                <el-option v-for="g in monitorActivities" :key="g.id" :value="g.id" :label="g.name">{{ g.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12" v-if="form.project.app_promotion_type !== 'RESERVE'">
            <el-form-item label="下载方式">
              <el-select v-model="form.project.download_type" style="width: 100%">
                <el-option v-for="o in DOWNLOAD_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据对接方式">
              <el-select v-model="form.project.data_dock_type" style="width: 100%">
                <el-option value="EVENT" label="事件管理" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="事件回传方式">
              <el-radio-group v-model="form.project.event_callback_type">
                <el-radio v-for="o in EVENT_CALLBACK_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优化目标" required>
              <el-select v-model="form.project.external_action" @change="onActionChange" style="width: 100%">
                <el-option v-for="o in externalActionOptions" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="深度优化目标">
              <el-select v-model="form.project.deep_external_action" style="width: 100%">
                <el-option v-for="o in DEEP_ACTIONS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="needEventAsset">
            <el-form-item label="事件管理资产">
              <el-select v-model="form.project.asset_ids" multiple filterable placeholder="选择事件资产（可设备用兜底）">
                <el-option v-for="e in eventAssets" :key="e.id" :value="e.id" :label="e.name">{{ e.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 投放版位 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">投放版位</div>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="广告位置" required>
              <el-select v-model="form.project.inventory_catalog" style="width: 100%">
                <el-option v-for="o in INVENTORY_CATALOGS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item v-if="form.project.inventory_catalog === 'MANUAL'" label="投放位置" required>
              <el-select v-model="form.project.inventory_type" multiple>
                <el-option v-for="o in INVENTORY_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="优选/穿山甲视频类型">
              <el-select v-model="form.project.union_video_type" style="width: 100%">
                <el-option v-for="o in UNION_VIDEO_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 用户定向 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">用户定向</div>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="定向包来源">
              <el-select v-model="form.project.target_package_source" style="width: 100%">
                <el-option v-for="o in TARGET_PACKAGE_SOURCES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="匹配方式">
              <el-select v-model="form.project.target_match_mode" style="width: 100%">
                <el-option value="ALL_SAME" label="所有账户选择一个定向包" />
                <el-option value="PER_ACCOUNT" label="每个账户选择一个定向包" />
                <el-option value="PER_PROJECT" label="每个项目选择一个定向包" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="使用运营商定向">
              <el-radio-group v-model="form.project.carrier_targeting">
                <el-radio value="OFF">不使用</el-radio>
                <el-radio value="ON">使用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="选择定向包">
              <el-select v-model="form.project.audience_package_id" clearable placeholder="选择定向包（优先于自定义定向）" style="width: 100%">
                <el-option v-for="o in orientationPackages" :key="o.id" :value="o.id" :label="o.name">{{ o.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地域类型">
              <el-select v-model="form.project.district" style="width: 100%">
                <el-option value="NONE" label="不限" /><el-option value="REGION" label="行政区域" /><el-option value="BUSINESS_DISTRICT" label="商圈" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="form.project.district !== 'NONE'">
            <el-form-item label="位置类型">
              <el-select v-model="form.project.location_type" style="width: 100%">
                <el-option v-for="o in LOCATION_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="性别">
              <el-select v-model="form.project.gender" style="width: 100%">
                <el-option v-for="o in GENDERS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-select v-model="form.project.age" multiple>
                <el-option v-for="o in AGES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="过滤已转化用户">
              <el-select v-model="form.project.hide_if_converted" style="width: 100%">
                <el-option v-for="o in HIDE_CONVERTED" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="定向人群包">
              <el-select v-model="form.project.include_packages" multiple placeholder="包含的自定义人群">
                <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排除人群包">
              <el-select v-model="form.project.exclude_packages" multiple placeholder="排除的自定义人群">
                <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="行为兴趣定向">
              <el-select v-model="form.project.interest_action_mode" @change="onInterestModeChange" style="width: 100%">
                <el-option v-for="o in INTEREST_ACTION_MODES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="needActionTargeting">
            <el-form-item label="行为天数">
              <el-select v-model="form.project.action_days" style="width: 100%">
                <el-option v-for="o in ACTION_DAYS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="needActionTargeting">
            <el-form-item label="行为关键词">
              <el-input v-model="form.project.action_words" placeholder="多个关键词用逗号分隔" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="needActionTargeting" :gutter="12">
          <el-col :span="12">
            <el-form-item label="行为类目">
              <el-select v-model="form.project.action_categories" multiple filterable allow-create default-first-option placeholder="输入并选择行为类目" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="重定向人群包（包含）">
              <el-select v-model="form.project.retargeting_tags_include" multiple placeholder="包含的重定向人群">
                <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重定向人群包（排除）">
              <el-select v-model="form.project.retargeting_tags_exclude" multiple placeholder="排除的重定向人群">
                <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 项目排期与预算 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">项目排期与预算</div>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="配置模式">
              <el-select v-model="form.project.schedule_config_mode" style="width: 100%">
                <el-option v-for="o in CONFIG_MODES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="投放时间">
              <el-select v-model="form.project.schedule_time" style="width: 100%">
                <el-option v-for="o in SCHEDULE_TIMES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="投放时段">
              <el-select v-model="form.project.schedule_period" style="width: 100%">
                <el-option v-for="o in SCHEDULE_PERIODS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 分时投放网格：星期 × 小时，支持点击单元格与拖动圈选 -->
        <el-row v-if="form.project.schedule_period === 'CUSTOM'" :gutter="12">
          <el-col :span="24">
            <el-form-item label="分时投放">
              <div
                class="slot-grid"
                @mouseup="endDrag"
                @mouseleave="endDrag"
              >
                <div class="slot-row slot-head">
                  <div class="slot-corner">时段</div>
                  <div v-for="w in WEEK_DAYS" :key="w.value" class="slot-col">{{ w.label }}</div>
                </div>
                <div v-for="h in SCHEDULE_HOURS" :key="h.value" class="slot-row">
                  <div class="slot-hour">{{ h.label }}</div>
                  <div
                    v-for="w in WEEK_DAYS"
                    :key="w.value"
                    class="slot-cell"
                    :class="{ on: isSlotOn(w.value, h.value) }"
                    @mousedown.prevent="onSlotMouseDown(w.value, h.value)"
                    @mouseenter="onSlotEnter(w.value, h.value)"
                  ></div>
                </div>
              </div>
              <div class="slot-actions">
                <el-button link type="primary" size="small" @click="fillAllSlots(true)">全选</el-button>
                <el-button link type="primary" size="small" @click="fillAllSlots(false)">清空</el-button>
                <span class="slot-hint">点击单元格切换投放；按住鼠标划过可批量圈选/取消</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.project.schedule_time === 'CUSTOM'" :gutter="12">
          <el-col :span="12">
            <el-form-item label="开始日期"><el-date-picker v-model="form.project.start_date" type="date" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期"><el-date-picker v-model="form.project.end_date" type="date" style="width: 100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="竞价策略">
              <el-select v-model="form.project.bid_strategy" style="width: 100%">
                <el-option v-for="o in BID_STRATEGIES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付费方式">
              <el-select v-model="form.project.pay_method" style="width: 100%">
                <el-option value="PRICING_OCPM" label="目标转化出价-按展示付费(OCPM)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预算出价配置模式">
              <el-select v-model="form.project.budget_config_mode" style="width: 100%">
                <el-option v-for="o in CONFIG_MODES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="日预算（元）" required>
              <el-input-number v-model="form.project.budget" :min="budgetMin" :step="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出价方式">
              <el-select v-model="form.project.bid_method" style="width: 100%">
                <el-option v-for="o in BID_METHODS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出价（元）">
              <el-input-number v-model="form.project.bid" :min="bidMin" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="名称配置模式">
              <el-select v-model="form.project.project_name_mode" style="width: 100%">
                <el-option value="UNIFIED" label="统一配置" />
                <el-option value="PER_ACCOUNT" label="分账户配置" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="项目名称" required>
              <el-input v-model="form.project.name" :maxlength="100" placeholder="通配符：渠道包名 / 监测活动名 / 已有监测链接组名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="自动截断"><el-switch v-model="form.project.auto_truncate" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="随机数后缀"><el-switch v-model="form.project.random_suffix" /></el-form-item>
          </el-col>
        </el-row>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="onProjectCancel">取消</el-button>
        <el-button type="primary" @click="onProjectConfirm">确定</el-button>
      </template>
    </el-drawer>

    <!-- 抖音号抽屉 -->
    <el-drawer v-model="awemeVisible" title="抖音号" size="780px" direction="rtl">
      <el-form :model="form.ad" class="drawer-form" label-position="top">
        <div class="form-section">
          <div class="form-section__title">推广身份</div>
          <el-form-item label="推广身份">
            <div class="dlg-tip">选择抖音号作为推广身份，即进行原生广告投放；计划将在广告审核通过后进行内容审核，内容审通过后可获得更多流量。主页作品隐藏广告视频已下线，请在素材模块操作“主页可见性”。</div>
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="抖音号来源">
                <el-select v-model="form.ad.aweme_source" style="width: 100%">
                  <el-option v-for="o in AWEME_SOURCES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="匹配方式">
                <el-select v-model="form.ad.aweme_match_mode" style="width: 100%">
                  <el-option value="PER_AD" label="所有广告选择同一个抖音号" />
                  <el-option value="PER_ACCOUNT" label="每个账户选择一个抖音号" />
                  <el-option value="PER_PROJECT" label="每个项目选择一个抖音号" />
                  <el-option value="PER_AD_SINGLE" label="每个广告选择一个抖音号" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="选择抖音号">
                <el-select v-model="form.ad.aweme_id" clearable filterable placeholder="选择抖音号" style="width: 100%">
                  <el-option v-for="a in awemeList" :key="a.aweme_id" :value="a.aweme_id" :label="a.nickname">{{ a.nickname }}（{{ a.aweme_id }}）</el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="原生锚点类型">
                <el-select v-model="form.ad.anchor_type" style="width: 100%">
                  <el-option v-for="o in ANCHOR_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <template #footer>
          <el-button @click="awemeVisible = false">取消</el-button>
          <el-button type="primary" @click="awemeVisible = false">确定</el-button>
        </template>
      </el-form>
    </el-drawer>

    <!-- 广告信息弹窗 -->
    <el-drawer v-model="adVisible" :title="cardTitle.ad" size="780px" direction="rtl">
      <el-form :model="form.ad" class="drawer-form" label-position="top">
        <div class="form-section">
          <div class="form-section__title">创意组件</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="附加创意组件">
              <el-radio-group v-model="form.ad.extra_component">
                <el-radio value="OFF">不启用</el-radio>
                <el-radio value="ON">启用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 行动号召 -->
        </div>
        <div class="form-section">
          <div class="form-section__title">行动号召</div>
        <el-form-item label="行动号召文案">
          <el-select v-model="form.ad.cta_tags" multiple filterable allow-create default-first-option placeholder="输入后回车添加，2-6 字" style="width: 100%">
            <el-option v-for="c in CTA_PRESETS" :key="c" :value="c">{{ c }}</el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-button size="small" @click="ElMessage.info('原型：查看推荐文案')">查看推荐</el-button></el-col>
          <el-col :span="8"><el-button size="small" @click="ElMessage.info('原型：保存为模板')">保存为模板</el-button></el-col>
          <el-col :span="8"><el-form-item label="开启智能生成"><el-switch v-model="form.ad.cta_smart" /></el-form-item></el-col>
        </el-row>

        </div>
      </el-form>
      <template #footer>
        <el-button @click="adVisible = false">取消</el-button>
        <el-button type="primary" @click="adVisible = false">确定</el-button>
      </template>
    </el-drawer>

    <!-- 产品信息抽屉 -->
    <el-drawer v-model="productVisible" title="产品信息" size="780px" direction="rtl">
      <el-form :model="form.ad" class="drawer-form" label-position="top">
        <div class="form-section">
          <div class="form-section__title">产品信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="配置模式">
              <el-select v-model="form.ad.product_info_mode" style="width: 100%">
                <el-option v-for="o in CONFIG_MODES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="引用上次信息">
              <el-button size="small" @click="copyLastProduct">引用上次信息</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="产品名称（0/20）">
              <el-input v-model="form.ad.product_name" :maxlength="20" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="引用应用名称">
              <el-button size="small" @click="form.ad.product_name = form.project.app_name">引用应用名称</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="产品主图（图片 0/10）">
              <el-select v-model="form.ad.product_main_images" multiple filterable allow-create default-first-option placeholder="选择产品主图" style="width: 100%">
                <el-option v-for="im in images" :key="im.id" :value="im.id" :label="im.title">{{ im.title }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品卖点">
              <el-select v-model="form.ad.product_sell_points" multiple filterable allow-create default-first-option placeholder="输入后回车添加卖点" style="width: 100%">
                <el-option v-for="c in CTA_PRESETS" :key="c" :value="c">{{ c }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        </div>
        <template #footer>
          <el-button @click="productVisible = false">取消</el-button>
          <el-button type="primary" @click="productVisible = false">确定</el-button>
        </template>
      </el-form>
    </el-drawer>

    <!-- 广告设置抽屉 -->
    <el-drawer v-model="adSettingVisible" title="广告设置" size="780px" direction="rtl">
      <el-form :model="form.ad" class="drawer-form" label-position="top">
        <div class="form-section">
          <div class="form-section__title">广告设置</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="配置模式">
              <el-select v-model="form.ad.ad_setting_mode" style="width: 100%">
                <el-option v-for="o in CONFIG_MODES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="广告评论">
              <el-radio-group v-model="form.ad.comment_disable">
                <el-radio :value="false">不启用</el-radio>
                <el-radio :value="true">启用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="类别/品牌名称">
              <el-radio-group v-model="form.ad.brand_switch">
                <el-radio value="OFF">不启用</el-radio>
                <el-radio value="ON">启用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <template v-if="form.ad.brand_switch === 'ON'">
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item label="所属类别"><el-input v-model="form.ad.category" placeholder="-" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="品牌名称"><el-input v-model="form.ad.brand_name" placeholder="-" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="二级品牌名称"><el-input v-model="form.ad.second_brand_name" placeholder="-" /></el-form-item></el-col>
          </el-row>
        </template>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="广告默认状态">
              <el-radio-group v-model="form.ad.operation">
                <el-radio value="DISABLE">暂停</el-radio>
                <el-radio value="ENABLE">开启</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称配置模式">
              <el-select v-model="form.ad.ad_name_mode" style="width: 100%">
                <el-option value="UNIFIED" label="统一配置" />
                <el-option value="PER_ACCOUNT" label="分账户配置" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="24">
            <el-form-item label="广告名称" required>
              <el-input v-model="form.ad.name_template" :maxlength="100" placeholder="通配符：渠道包名 / 监测活动名 / 已有监测链接组名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="自动截断"><el-switch v-model="form.ad.ad_auto_truncate" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="随机数后缀"><el-switch v-model="form.ad.ad_random_suffix" /></el-form-item></el-col>
        </el-row>
        </div>
        <template #footer>
          <el-button @click="adSettingVisible = false">取消</el-button>
          <el-button type="primary" @click="adSettingVisible = false">确定</el-button>
        </template>
      </el-form>
    </el-drawer>

    <!-- 创意素材弹窗 -->
    <el-drawer v-model="matVisible" title="创意素材" size="1024px" direction="rtl">
      <el-tabs v-model="matTab" class="mat-tabs">
        <!-- 手动选取素材 -->
        <el-tab-pane label="手动选取素材" name="manual">
          <el-form :model="form.materials" class="drawer-form" label-position="top">
            <div class="form-section">
              <div class="form-section__title">素材设置</div>
              <el-form-item label="多账户分配规则">
                <div class="card-choices">
                  <div
                    v-for="o in ASSIGN_RULES" :key="o.value"
                    class="choice-card" :class="{ active: form.materials.assign_rule === o.value }"
                    @click="form.materials.assign_rule = o.value"
                  >
                    <div class="choice-card__title">{{ o.label }}</div>
                    <div class="choice-card__desc">{{ o.desc }}</div>
                  </div>
                </div>
              </el-form-item>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="视频上传至">
                    <el-radio-group v-model="form.materials.upload_scope">
                      <el-radio v-for="o in UPLOAD_SCOPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="主页可见">
                    <el-radio-group v-model="form.materials.home_visibility">
                      <el-radio v-for="o in HOME_VISIBILITIES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
                    </el-radio-group>
                    <div class="dlg-tip warn">仅视频及图文素材、且来源不为抖音页素材时生效</div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="区分素材版式">
                    <el-radio-group v-model="form.materials.separate_layout">
                      <el-radio value="OFF">不启用</el-radio>
                      <el-radio value="VIDEO">视频</el-radio>
                      <el-radio value="IMAGE">图片</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="引导视频">
                    <el-radio-group v-model="form.materials.guide_video">
                      <el-radio value="OFF">不启用</el-radio>
                      <el-radio value="ON">原链路</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="每个创意组配置">
                <div class="count-row">
                  <div class="count-item">
                    <span class="count-item__label">视频</span>
                    <el-input-number v-model="form.materials.group_video_count" :min="0" :max="30" controls-position="right" size="small" />
                  </div>
                  <div class="count-item">
                    <span class="count-item__label">图片</span>
                    <el-input-number v-model="form.materials.group_image_count" :min="0" :max="50" controls-position="right" size="small" />
                  </div>
                  <div class="count-item">
                    <span class="count-item__label">图文</span>
                    <el-input-number v-model="form.materials.group_text_count" :min="0" :max="10" controls-position="right" size="small" />
                  </div>
                </div>
                <div class="dlg-tip">即单个广告内的素材数量。注：视频不限，视频最多30个，图片最多50个，图文最多10个。</div>
              </el-form-item>
              <el-form-item label="统一配置创意组名">
                <div class="inline-row">
                  <el-input v-model="form.materials.group_name_template" placeholder="请输入创意组名称" />
                  <el-button @click="applyGroupName">统一配置</el-button>
                </div>
                <div class="dlg-tip">适配符：+素材名　+模版视频名　+竖版视频名　⧉ 插入更多</div>
              </el-form-item>
              <el-form-item label="素材类型">
                <el-checkbox-group v-model="form.materials.material_types">
                  <el-checkbox v-for="o in MATERIAL_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </div>
            <div class="form-section">
              <div class="form-section__title">
                创意制作
                <span class="form-section__extra">（创意组数量：{{ form.materials.creative_groups.length }}）</span>
              </div>
              <div class="creative-toolbar">
                <el-button link @click="shuffleGroups">乱序</el-button>
                <el-button link @click="clearMaterials">清空</el-button>
                <el-dropdown>
                  <el-button>更多菜单<el-icon><ArrowDown /></el-icon></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="addGroup">添加创意组</el-dropdown-item>
                      <el-dropdown-item @click="copyFirstGroup">复制创意组</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button @click="randomPick">随机选择</el-button>
                <el-button @click="smartPick">智能优选</el-button>
                <el-button @click="refreshGroups">一键刷新</el-button>
                <el-button type="primary">批量添加素材<el-icon><ArrowDown /></el-icon></el-button>
              </div>
              <div v-for="(g, gi) in form.materials.creative_groups" :key="gi" class="creative-group">
                <div class="group-head">
                  <el-input v-model="g.name" placeholder="创意组名称" style="width: 220px" />
                  <el-button v-if="form.materials.creative_groups.length > 1" link type="danger" @click="removeGroup(gi)">删除创意组</el-button>
                </div>
                <el-tabs v-model="g.tab" class="group-tabs">
                  <el-tab-pane :label="`视频(${g.videos.length}/1)`" name="video">
                    <el-select v-model="g.videos" multiple filterable placeholder="选择视频" style="width: 100%">
                      <el-option v-for="v in videos" :key="v.id" :value="v.id" :label="v.title">{{ v.title }}</el-option>
                    </el-select>
                  </el-tab-pane>
                  <el-tab-pane :label="`图片(${g.images.length}/1)`" name="image">
                    <el-select v-model="g.images" multiple filterable placeholder="选择图片" style="width: 100%">
                      <el-option v-for="im in images" :key="im.id" :value="im.id" :label="im.title">{{ im.title }}</el-option>
                    </el-select>
                  </el-tab-pane>
                  <el-tab-pane :label="`图文(${g.text_images.length}/1)`" name="text">
                    <el-select v-model="g.text_images" multiple filterable placeholder="选择图文" style="width: 100%">
                      <el-option v-for="im in images" :key="im.id" :value="im.id" :label="im.title">{{ im.title }}</el-option>
                    </el-select>
                  </el-tab-pane>
                </el-tabs>
              </div>
              <el-button type="primary" plain @click="addGroup">+ 添加创意组</el-button>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- 动态选取素材 -->
        <el-tab-pane label="动态选取素材" name="dynamic">
          <el-form :model="form.materials" class="drawer-form" label-position="top">
            <div class="form-section">
              <div class="form-section__title">素材设置</div>
              <el-form-item label="多账户分配规则">
                <div class="card-choices">
                  <div
                    v-for="o in ASSIGN_RULES" :key="o.value"
                    class="choice-card" :class="{ active: form.materials.assign_rule === o.value }"
                    @click="form.materials.assign_rule = o.value"
                  >
                    <div class="choice-card__title">{{ o.label }}</div>
                    <div class="choice-card__desc">{{ o.desc }}</div>
                  </div>
                </div>
              </el-form-item>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="视频上传至">
                    <el-radio-group v-model="form.materials.upload_scope">
                      <el-radio v-for="o in UPLOAD_SCOPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="主页可见">
                    <el-radio-group v-model="form.materials.home_visibility">
                      <el-radio v-for="o in HOME_VISIBILITIES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
                    </el-radio-group>
                    <div class="dlg-tip warn">仅视频及图文素材、且来源不为抖音页素材时生效</div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="每个广告素材数量">
                    <el-radio-group v-model="form.materials.ad_material_count_mode">
                      <el-radio value="UNIFIED">统一设置</el-radio>
                      <el-radio value="RULE">分规则设置</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="区分素材版式">
                    <el-radio-group v-model="form.materials.separate_layout">
                      <el-radio value="OFF">不启用</el-radio>
                      <el-radio value="VIDEO">视频</el-radio>
                      <el-radio value="IMAGE">图片</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="每个创意组配置">
                <div class="count-row">
                  <div class="count-item">
                    <span class="count-item__label">视频</span>
                    <el-input-number v-model="form.materials.group_video_count" :min="0" :max="30" controls-position="right" size="small" />
                  </div>
                  <div class="count-item">
                    <span class="count-item__label">图片</span>
                    <el-input-number v-model="form.materials.group_image_count" :min="0" :max="50" controls-position="right" size="small" />
                  </div>
                </div>
                <div class="dlg-tip">动态选取时为每个广告使用的素材数量，不需要的素材类型请设置为0。</div>
              </el-form-item>
              <el-form-item label="选取素材不足时">
                <el-radio-group v-model="form.materials.insufficient_rule">
                  <el-radio value="SKIP">余量广告不搭建</el-radio>
                  <el-radio value="LOOP">循环使用素材</el-radio>
                  <el-radio value="REMAIN">余量广告按剩余素材搭建</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-alert
                type="info" :closable="false" show-icon
                title="使用动态选取时将为每个创意组参与叉乘，若需生成更多项目广告，请修改规则配置为指定数量"
              />
            </div>
            <div class="form-section">
              <div class="form-section__title">动态选取规则</div>
              <div class="creative-toolbar">
                <el-button type="primary" @click="addDynRule">+ 添加动态选取规则</el-button>
                <el-button @click="addFixedRule">添加指定素材规则</el-button>
              </div>
              <el-empty v-if="!form.materials.dynamic_rules.length" description="暂无动态选取规则，点击添加" :image-size="80" />
              <div v-for="(r, ri) in form.materials.dynamic_rules" :key="ri" class="dyn-rule">
                <el-select v-model="r.material_type" placeholder="素材类型" style="width: 180px">
                  <el-option v-for="o in MATERIAL_TYPES" :key="o.value" :value="o.value" :label="o.label" />
                </el-select>
                <span class="dyn-rule__label">每个广告使用</span>
                <el-input-number v-model="r.count" :min="0" :max="50" controls-position="right" size="small" />
                <el-button link type="danger" @click="removeDynRule(ri)">删除</el-button>
              </div>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="matVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMaterials">确定</el-button>
      </template>
    </el-drawer>

    <!-- 标题包抽屉 -->
    <el-drawer v-model="titleVisible" :title="cardTitle.title" size="1024px" direction="rtl">
      <el-form :model="form.titles" class="drawer-form" label-position="top">
        <div class="form-section">
          <div class="form-section__title">标题设置</div>
          <el-form-item label="多账户分配规则">
            <div class="card-choices">
              <div
                v-for="o in ASSIGN_RULES" :key="o.value"
                class="choice-card" :class="{ active: form.titles.assign_rule === o.value }"
                @click="form.titles.assign_rule = o.value"
              >
                <div class="choice-card__title">{{ o.label }}</div>
                <div class="choice-card__desc">{{ o.desc }}</div>
              </div>
            </div>
          </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="选取方式">
              <el-radio-group v-model="form.titles.pick_mode">
                <el-radio value="MANUAL">手动选取标题</el-radio>
                <el-radio value="DYNAMIC">动态选取标题</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题来源">
              <el-select v-model="form.titles.title_source" style="width: 100%">
                <el-option v-for="o in TITLE_SOURCES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="标题分配方式">
              <el-select v-model="form.titles.assign_rule" style="width: 100%">
                <el-option v-for="o in ASSIGN_RULES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="form.titles.title_source === 'TITLE_PACK'" label="标题包（0/200）">
          <el-select v-model="form.ad.title_packs" multiple filterable placeholder="选择标题包" style="width: 100%">
            <el-option v-for="p in titlePacks" :key="p.id" :value="p.id" :label="p.title">{{ p.title }}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-else-if="form.titles.title_source === 'TITLE_LIB'" label="标题库">
          <el-input v-model="form.titles.title_source" disabled placeholder="原型：从标题库动态选取标题" />
        </el-form-item>
        <el-form-item v-else label="素材名称作为标题">
          <div class="dlg-tip">将使用所选素材名称作为广告标题，无需单独选择标题包。</div>
        </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="titleVisible = false">取消</el-button>
        <el-button type="primary" @click="titleVisible = false">确定</el-button>
      </template>
    </el-drawer>

    <!-- 落地页抽屉 -->
    <el-drawer v-model="lpVisible" title="落地页" size="720px" direction="rtl">
      <el-form :model="form.landing" class="drawer-form" label-position="top">
        <div class="form-section">
          <div class="form-section__title">落地页设置</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="落地页类型">
              <el-select v-model="form.landing.landing_page_type" style="width: 100%">
                <el-option v-for="o in LANDING_PAGE_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选择落地页">
              <el-select v-model="form.ad.landing_page_id" clearable filterable placeholder="选择已登记落地页" style="width: 100%" @change="onLandingSelect">
                <el-option v-for="lp in landingPages" :key="lp.id" :value="lp.id" :label="lp.title">{{ lp.title }}（{{ lp.url }}）</el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="落地页名称">
              <el-input v-model="form.landing.landing_page_name" placeholder="请输入落地页名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="监测链接">
              <el-input v-model="form.landing.track_url" placeholder="请输入监测链接（可选）" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 应用下载 / 调起场景专属字段 -->
        <template v-if="form.project.landing_type === 'APP'">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="下载方式">
                <el-select v-model="form.landing.download_type" style="width: 100%">
                  <el-option v-for="o in DOWNLOAD_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="调起方式">
                <el-select v-model="form.landing.launch_type" style="width: 100%">
                  <el-option v-for="o in LAUNCH_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item v-if="form.landing.download_type === 'EXTERNAL_URL'" label="下载地址">
                <el-input v-model="form.landing.download_url" placeholder="请输入应用下载链接" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item v-if="form.landing.landing_page_type === 'DEEPLINK'" label="直达链接">
                <el-input v-model="form.landing.deeplink_url" placeholder="请输入 deeplink 直达链接" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="lpVisible = false">取消</el-button>
        <el-button type="primary" @click="lpVisible = false">确定</el-button>
      </template>
    </el-drawer>

    <!-- 选择策略（策略组）弹窗 -->
    <StrategyGroupDialog v-model="strategyVisible" @confirm="onStrategyConfirm" />

    <!-- 选择任务弹窗 -->
    <el-dialog v-model="taskVisible" title="选择任务" width="1024px" class="task-dialog" :close-on-click-modal="false">
      <div class="dlg-filter task-filter">
        <el-select v-model="taskFilter.account_id" clearable placeholder="媒体账户：全部" style="width: 210px">
          <el-option v-for="a in accounts" :key="a.id" :value="a.id" :label="a.name" />
        </el-select>
        <el-date-picker
          v-model="taskFilter.date_range" type="daterange" unlink-panels range-separator="至"
          start-placeholder="创建时间" end-placeholder="结束时间" value-format="YYYY-MM-DD" style="width: 260px"
        />
        <el-select v-model="taskFilter.name_type" style="width: 120px">
          <el-option label="任务名称" value="name" />
          <el-option label="任务ID" value="id" />
        </el-select>
        <el-input v-model="taskFilter.keyword" clearable placeholder="请输入关键词" style="width: 200px" />
        <el-button link type="primary" @click="resetTaskFilter">清空</el-button>
      </div>
      <el-table :data="taskPageRows" border size="small" height="400" highlight-current-row @row-click="selectTask">
        <el-table-column width="44" align="center">
          <template #default="{ row }">
            <el-radio :model-value="taskSelectedId" :value="row.id" @change="selectTask(row)" @click.stop />
          </template>
        </el-table-column>
        <el-table-column label="任务ID" prop="task_no" width="170" />
        <el-table-column label="任务名称" prop="name" min-width="320" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="created_at" width="180" />
      </el-table>
      <div class="sg-pager">
        <span class="sg-total">共 {{ taskFiltered.length }} 条</span>
        <el-pagination v-model:current-page="taskPage" :page-size="taskPageSize" :total="taskFiltered.length" layout="prev, pager, next" size="small" />
        <span class="sg-jump">前往</span>
        <el-input v-model="taskJumpPage" class="sg-jump-input" size="small" />
        <span class="sg-jump">页</span>
      </div>
      <template #footer>
        <el-button @click="taskVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!taskSelected" @click="confirmTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 选择已有项目抽屉（对齐线上：大卡片 = 筛选 + 当前项目 + 选择已有项目 + 项目表 + 分页） -->
    <el-drawer v-model="existingVisible" title="选择已有项目" size="1040px" direction="rtl">
      <div class="ex-card">
        <!-- 筛选区：每项为「标签 + 控件」合成输入框 -->
        <div class="ex-filter-grid" v-show="!exFilterFolded">
          <div class="ex-field">
            <span class="ex-field__label">推广目的</span>
            <el-select v-model="exFilter.objective" class="ex-field__ctrl" clearable placeholder="请选择推广目的" @change="onExObjectiveChange">
              <el-option v-for="o in EX_OBJECTIVES" :key="o" :value="o" :label="o" />
            </el-select>
          </div>
          <div class="ex-field">
            <span class="ex-field__label">子目标</span>
            <el-select v-model="exFilter.sub_objective" class="ex-field__ctrl" clearable :disabled="!exFilter.objective" placeholder="请选择子目标" @change="onExSearch">
              <el-option v-for="o in exSubObjectives" :key="o" :value="o" :label="o" />
            </el-select>
          </div>
          <div class="ex-field">
            <span class="ex-field__label">投放模式</span>
            <el-select v-model="exFilter.delivery_mode" class="ex-field__ctrl" clearable placeholder="请选择投放模式" @change="onExSearch">
              <el-option v-for="o in EX_DELIVERY_MODES" :key="o" :value="o" :label="o" />
            </el-select>
          </div>
          <div class="ex-field">
            <span class="ex-field__label">营销场景</span>
            <el-select v-model="exFilter.marketing_goal" class="ex-field__ctrl" clearable placeholder="请选择营销场景" @change="onExSearch">
              <el-option v-for="o in EX_MARKETING_GOALS" :key="o" :value="o" :label="o" />
            </el-select>
          </div>
          <div class="ex-field">
            <span class="ex-field__label">广告类型</span>
            <el-select v-model="exFilter.ad_type" class="ex-field__ctrl" clearable placeholder="请选择广告类型" @change="onExSearch">
              <el-option v-for="o in EX_AD_TYPES" :key="o" :value="o" :label="o" />
            </el-select>
          </div>
          <div class="ex-field">
            <span class="ex-field__label">星广联投</span>
            <el-select v-model="exFilter.xing_task" class="ex-field__ctrl" clearable placeholder="请选择星广联投" @change="onExSearch">
              <el-option v-for="o in EX_XING_TASKS" :key="o" :value="o" :label="o" />
            </el-select>
          </div>
          <div class="ex-field">
            <span class="ex-field__label">状态</span>
            <div class="ex-field__ctrl">
              <el-cascader
                v-model="exFilter.status"
                :options="EX_STATUS_OPTIONS"
                :props="EX_STATUS_PROPS"
                :show-all-levels="false"
                clearable
                placeholder="请选择"
                @change="onExSearch"
              />
            </div>
          </div>
          <div class="ex-field">
            <span class="ex-field__label ex-field__label--type">
              名称
              <el-dropdown trigger="click" @command="(c) => { exFilter.name_type = c; onExSearch(); }">
                <span class="ex-field__caret" title="按名称/ID 搜索"><el-icon><ArrowDown /></el-icon></span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="name">名称</el-dropdown-item>
                    <el-dropdown-item command="id">ID</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </span>
            <el-input
              v-model="exFilter.keyword"
              class="ex-field__ctrl ex-field__ctrl--input"
              clearable
              placeholder="请输入关键词"
              @keyup.enter="onExSearch"
            />
            <span class="ex-field__btn" title="搜索" @click="onExSearch"><el-icon><Search /></el-icon></span>
          </div>
        </div>
        <el-icon class="ex-card__fold" :title="exFilterFolded ? '展开筛选' : '收起筛选'" @click="exFilterFolded = !exFilterFolded">
          <ArrowUp v-if="exFilterFolded" /><ArrowDown v-else />
        </el-icon>

        <!-- 当前项目 -->
        <div class="ex-current">
          <div class="ex-current__label">当前项目：</div>
          <div class="ex-current__detail" v-if="exCurrentProject">
            <template v-for="(item, i) in exCurrentProjectItems" :key="item.k">
              {{ item.k }}：<b>{{ item.v }}</b><span v-if="i < exCurrentProjectItems.length - 1">；</span>
            </template>
          </div>
          <div class="ex-current__none" v-else>暂时未选择项目</div>
        </div>

        <!-- 选择已有项目 -->
        <div class="ex-pick">
          <div class="ex-pick__left">
            <span class="ex-pick__title">选择已有项目</span>
            <el-checkbox v-model="exShowCost" class="ex-pick__cost">查看消耗/关联广告数</el-checkbox>
            <div class="ex-pick__range" v-if="exShowCost">
              <el-date-picker
                v-model="exCostRange"
                type="daterange"
                unlink-panels
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                size="small"
              />
            </div>
          </div>
          <div class="ex-pick__right">
            <el-button class="ex-btn" @click="openSyncDialog">同步项目</el-button>
            <el-button class="ex-btn" @click="clearSelectedProjects">清空已选</el-button>
          </div>
        </div>

        <!-- 项目表 + 分页 -->
        <div class="ex-table">
          <el-table
            ref="exTableRef"
            :data="exPageRows"
            row-key="id"
            border
            size="small"
            height="420"
            :span-method="exSpanMethod"
            @selection-change="onExSelection"
          >
            <!-- 账户列：外面选中的每个媒体账户独占一行（纵向合并该项目下的所有项目行） -->
            <el-table-column
              width="190"
              fixed="left"
              label="媒体账户"
              label-class-name="ex-acct-th"
              class-name="ex-acct-td"
            >
              <template #default="{ row }">
                <span v-if="row.__acctFirst" class="ex-acct-cell">
                  <span class="ex-acct-cell__name">{{ exAccountName(row.account_id) }}</span>
                  <el-icon v-if="exAccountHasSelection(row.account_id)" class="ex-acct-head__check"><CircleCheck /></el-icon>
                </span>
              </template>
            </el-table-column>
            <el-table-column type="selection" width="44" reserve-selection />
            <el-table-column label="项目名称和ID" min-width="230">
              <template #default="{ row }">
                <div class="ex-pname">{{ row.name }}</div>
                <div class="ex-pid">ID: {{ row.project_id }}</div>
              </template>
            </el-table-column>
            <el-table-column label="推广目的" prop="objective" width="100" show-overflow-tooltip />
            <el-table-column label="子目标" prop="sub_objective" width="100" show-overflow-tooltip />
            <el-table-column label="投放模式" prop="delivery_mode" width="140" show-overflow-tooltip />
            <el-table-column label="营销场景" prop="marketing_goal" width="110" show-overflow-tooltip />
            <el-table-column label="投放形式" prop="delivery_form" width="100" show-overflow-tooltip />
            <el-table-column label="展位" prop="position" width="90" show-overflow-tooltip />
            <el-table-column label="蓝海流量" prop="blue_ocean" width="90" show-overflow-tooltip />
            <el-table-column label="穿山甲投放形式" prop="csj_form" width="130" show-overflow-tooltip />
            <el-table-column label="星广联投任务" prop="xing_task" width="120" show-overflow-tooltip />
            <el-table-column label="自动优先素材" prop="auto_material" width="110" show-overflow-tooltip />
            <el-table-column v-if="exShowCost" label="消耗" prop="cost" width="90" show-overflow-tooltip />
            <el-table-column v-if="exShowCost" label="关联广告数" prop="ad_count" width="100" show-overflow-tooltip />
            <el-table-column v-if="exShowCost" label="择优分配" prop="priority_allocation" width="100" show-overflow-tooltip />
            <el-table-column v-if="exShowCost" label="平台类型" prop="platform_type" width="90" show-overflow-tooltip />
          </el-table>
          <div class="ex-pager">
            <span class="ex-total">共 {{ exFiltered.length }} 条</span>
            <el-select v-model="exPageSize" class="ex-size" size="small">
              <el-option v-for="s in [10, 20, 50, 100]" :key="s" :label="`${s}条/页`" :value="s" />
            </el-select>
            <el-pagination
              v-model:current-page="exPage"
              :page-size="exPageSize"
              :total="exFiltered.length"
              layout="prev, pager, next"
              size="small"
            />
            <span class="ex-jump">前往</span>
            <el-input v-model="exJumpPage" class="ex-jump__input" size="small" @change="onExJump" @keyup.enter="onExJump" />
            <span class="ex-jump">页</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="existingVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExistingProjects">确定</el-button>
      </template>
    </el-drawer>

    <!-- 同步项目与广告弹窗（对齐线上 图3：左侧媒体账户列表 + 右侧已选 + 更新时间区间） -->
    <el-dialog
      v-model="syncVisible"
      title="同步项目与广告"
      width="820px"
      class="sync-dialog"
      :close-on-click-modal="false"
      @open="onSyncOpen"
    >
      <div class="sync-form">
        <div class="sync-label">账户</div>
        <div class="sync-content">
          <div class="sync-panels">
            <!-- 左：媒体账户列表 -->
            <div class="sync-panel left">
              <div class="panel-head">媒体账户</div>
              <div class="panel-search">
                <el-select v-model="syncSearchType" class="sync-type">
                  <el-option label="ID" value="id" />
                  <el-option label="账户名称" value="name" />
                </el-select>
                <el-input v-model="syncKeyword" class="sync-input" placeholder="请输入关键词" clearable @keyup.enter="onSyncSearch" />
                <el-button class="sync-search-btn" title="搜索" @click="onSyncSearch"><el-icon><Search /></el-icon></el-button>
              </div>
              <div class="panel-list">
                <el-checkbox
                  class="check-all"
                  :model-value="syncAllChecked"
                  :indeterminate="syncHalfChecked"
                  @change="toggleSyncAll"
                >全选</el-checkbox>
                <div class="list-scroll">
                  <el-checkbox
                    v-for="a in syncPageRows"
                    :key="a.id"
                    class="list-item"
                    :model-value="syncChecked.includes(a.id)"
                    @change="(v) => toggleSyncOne(a, v)"
                  >
                    {{ a.name }}({{ a.advertiser_id }})
                  </el-checkbox>
                  <div v-if="!syncPageRows.length" class="list-empty">暂无数据</div>
                </div>
              </div>
              <el-pagination
                class="sync-pager"
                layout="prev, pager, next"
                :total="syncList.length"
                :page-size="syncPageSize"
                :current-page="syncPage"
                @current-change="onSyncPage"
              />
            </div>

            <!-- 右：已选账户 -->
            <div class="sync-panel right">
              <div class="panel-head sel-head">
                <span>已选：{{ syncChecked.length }}/500</span>
                <el-button link type="primary" @click="syncChecked = []">清空</el-button>
              </div>
              <div class="sel-body">
                <el-empty v-if="!syncCheckedAccounts.length" description="暂无数据" :image-size="90" />
                <div v-else class="sel-scroll">
                  <div v-for="a in syncCheckedAccounts" :key="a.id" class="sel-item" :title="a.name">
                    {{ a.advertiser_id }}
                    <el-icon class="sel-item__del" title="移除" @click="removeSyncAccount(a)"><Close /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sync-label">更新时间</div>
        <div class="sync-content">
          <el-date-picker
            v-model="syncDateRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="sync-date"
          />
          <div class="sync-tip">建议选择更新时间同步，减少拉取不必要的数据，降低等待时间。</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="syncVisible = false">取消</el-button>
        <el-button type="primary" @click="onSyncConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 保存策略组弹窗 -->
    <el-dialog v-model="saveVisible" title="保存策略组" width="520px" class="save-dialog">
      <el-form label-width="96px">
        <el-form-item label="策略组名称" required>
          <el-input v-model="sgForm.name" maxlength="50" show-word-limit placeholder="请输入策略组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="sgForm.description" type="textarea" :rows="3" maxlength="200"
            show-word-limit placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!sgForm.name.trim()" @click="onSaveStrategy">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown, ArrowUp, Tickets } from '@element-plus/icons-vue';
import { mediaApi, assetApi, buildApi } from '@/api/media';
import {
  LANDING_TYPES, APP_PROMOTION_TYPES, MARKETING_GOALS, AD_TYPES, DELIVERY_MODES,
  DELIVERY_TYPES, ASSET_TYPES, EXTERNAL_ACTIONS, DEEP_ACTIONS, DEEP_BID_TYPES,
  INVENTORY_CATALOGS, INVENTORY_TYPES, PRICINGS, CTA_PRESETS,
  MICRO_PROMOTION_TYPES, DOWNLOAD_TYPES, LAUNCH_TYPES, VIDEO_MODES, IMAGE_MODES,
  GENDERS, AGES, MATCH_TYPES, LOCATION_TYPES, HIDE_CONVERTED,
  UNION_VIDEO_TYPES, INTEREST_ACTION_MODES, ACTION_DAYS, AD_SOURCES,
  AD_DOWNLOAD_STATUS, AWEME_SETTING_TYPES,
  OBJECTIVES, AD_DELIVERY_TYPES, DELIVERY_MODE_EXTRA, PRODUCT_VERSIONS,
  PRODUCT_SOURCES, WORKBENCH_VERSIONS, PLATFORM_TYPES, TRACK_LINK_SOURCES,
  EVENT_CALLBACK_TYPES, TARGET_PACKAGE_SOURCES, BID_STRATEGIES, BID_METHODS,
  CONFIG_MODES, SCHEDULE_TIMES, SCHEDULE_PERIODS, WEEK_DAYS, SCHEDULE_HOURS, ASSIGN_RULES, AWEME_SOURCES,
  ANCHOR_TYPES, MATERIAL_TYPES, UPLOAD_SCOPES, HOME_VISIBILITIES, TITLE_SOURCES,
  LANDING_PAGE_TYPES, mockDb,
} from '@/mock/data';
import { findStrategyGroup } from '@/mock/strategyGroups';
import { existingProjects } from '@/mock/buildProjects';
import StrategyGroupDialog from '@/views/media/components/StrategyGroupDialog.vue';

const route = useRoute();
const router = useRouter();
const subject = '北京央广时代文化传播有限公司';
const media = computed(() => route.query.media || 'upgrade');
const mediaTitle = computed(() => ({ upgrade: '巨量广告·标准', uni: '巨量广告·全域', oc: '巨量广告·智擎' }[media.value] || '巨量广告·标准'));
const isUpgrade = computed(() => media.value === 'upgrade');
const isUni = computed(() => media.value === 'uni');
const isOc = computed(() => media.value === 'oc');
// 卡片标题按媒体收敛：标准=新建项目/广告信息/创意素材/标题包/落地页；全域智擎=投放内容/基础信息/创意素材/标题
const cardTitle = computed(() => ({
  proj: isUpgrade.value ? '新建项目' : '投放内容',
  ad: isUpgrade.value ? '广告信息' : '基础信息',
  title: isUni.value ? '标题' : '标题包',
}));
// 首列标题随「创建方式」变化（对齐线上：已有项目 / 新建项目）
const projColTitle = computed(() => (
  form.create_mode === 'EXIST' ? '已有项目' : cardTitle.value.proj
));

const previewing = ref(false);
const submitting = ref(false);
const preview = ref(null);
const estOpen = ref(false);
const matTab = ref('manual');
const activeTab = ref(route.query.tab === 'strategy' ? 'strategy' : 'task');

// 弹窗 / 抽屉可见性
const acctVisible = ref(false);
const ruleVisible = ref(false);
const projVisible = ref(false);
const adVisible = ref(false);
const awemeVisible = ref(false);
const productVisible = ref(false);
const adSettingVisible = ref(false);
const matVisible = ref(false);
const titleVisible = ref(false);
const lpVisible = ref(false);
const strategyVisible = ref(false);
const taskVisible = ref(false);
const saveVisible = ref(false);
const existingVisible = ref(false);

// 规则卡片（对齐线上「规则配置」弹窗，实机核对文案与联动关系）
const PROJECT_RULES = [
  { value: 'BY_TOTAL', label: '按总广告数/每项目广告数', desc: '根据生成的广告总数与项目内广告数上限，自动生成项目' },
  { value: 'BY_CREATIVE', label: '根据创意组生成', desc: '项目数量与创意组数量相等，项目中的广告都使用相同的素材' },
  { value: 'BY_TITLE', label: '根据标题包生成', desc: '项目数量与标题包数量相等，项目中的广告都使用相同的标题包' },
  { value: 'BY_COUNT', label: '指定数量', desc: '手动指定每个账户的项目数量' },
  { value: 'BY_ASSET', label: '按资产组', desc: '项目数量与资产组数量相等，项目中的广告都使用相同的资产组', disabled: true },
];
const AD_RULES = [
  { value: 'BY_CREATIVE', label: '按创意组数', desc: '基于创意组数生成广告，自动匹配标题包，标题包不同时循环使用' },
  { value: 'BY_CREATIVE_TITLE', label: '按创意组*标题包', desc: '基于创意组*标题包自动生成广告' },
  { value: 'BY_PROJECT_CREATIVE', label: '按项目数*创意组', desc: '基于项目数*创意组自动生成广告' },
  { value: 'BY_COUNT', label: '指定数量', desc: '先指定广告数量，自动循环使用素材和标题，多选少补' },
  { value: 'BY_CREATIVE_ASSET', label: '按创意组*资产组', desc: '基于创意组*资产组自动生成广告', disabled: true },
  { value: 'BY_CREATIVE_TITLE_ASSET', label: '按创意组*标题包*资产组', desc: '基于创意组*标题包*资产组自动生成广告', disabled: true },
];

/**
 * 广告生成规则是否置灰（对齐线上联动关系）：
 * 已有项目：前 4 条规则全部可用，仅资产组两条恒置灰；
 * 新建项目：可用性取决于「项目生成规则」——
 *   按创意组数      —— 仅「根据标题包生成」下不可用
 *   按创意组*标题包 —— 始终可用
 *   按项目数*创意组 —— 仅「指定数量」下可用
 *   指定数量        —— 仅「根据创意组生成」「指定数量」及已有项目下可用
 */
function isAdRuleDisabled(rule) {
  if (rule.disabled) return true;
  if (form.create_mode === 'EXIST') return false;
  switch (rule.value) {
    case 'BY_CREATIVE':
      return form.project_rule === 'BY_TITLE';
    case 'BY_CREATIVE_TITLE':
      return false;
    case 'BY_PROJECT_CREATIVE':
      return form.project_rule !== 'BY_COUNT';
    case 'BY_COUNT':
      return form.project_rule !== 'BY_CREATIVE' && form.project_rule !== 'BY_COUNT';
    default:
      return true;
  }
}

/** 广告规则说明文案：线上「指定数量」随项目生成规则切换两种表述 */
function adRuleDesc(rule) {
  if (rule.value !== 'BY_COUNT') return rule.desc;
  const byCreativeBase = form.create_mode === 'EXIST' || form.project_rule === 'BY_COUNT';
  return byCreativeBase
    ? '先基于创意组数生成广告，未达到指定生成的广告数量时，循环使用创意组；超过，则舍弃多余广告'
    : '先指定广告数量，自动循环使用素材和标题，多选少补';
}

/** 当前广告规则不可用时，自动回退到第一个可用规则（线上同款联动） */
function ensureAdRuleAvailable() {
  const cur = AD_RULES.find((r) => r.value === form.ad_rule);
  if (cur && !isAdRuleDisabled(cur)) return;
  const next = AD_RULES.find((r) => !isAdRuleDisabled(r));
  if (next) form.ad_rule = next.value;
}

// 「选择已有项目」筛选项（口径对齐线上「选择已有项目」抽屉，2026-11-17 实测）
const EX_OBJECTIVES = ['应用推广', '销售线索', '小程序', '电商', '快应用', '商品', '内容营销'];
// 子目标：随「推广目的」联动，线上未选推广目的时该条件不可用
const EX_SUB_OBJECTIVE_MAP = {
  应用推广: ['应用下载', '应用调起', '预约下载'], // 线上实测
  销售线索: ['线索收集', '线索提交', '私信咨询', '电话咨询'],
  小程序: ['小程序拉新', '小程序推广', '小程序下单'],
  电商: ['商品购买', '店铺购买', '店铺引流'],
  快应用: ['快应用拉新', '快应用推广'],
  商品: ['商品购买', '商品推广'],
  内容营销: ['内容互动', '粉丝增长', '直播推广'],
};
const EX_DELIVERY_MODES = ['手动投放', '自动投放(UBMax)'];
const EX_MARKETING_GOALS = ['短视频/图片', '直播'];
const EX_AD_TYPES = ['通投广告', '搜索广告'];
const EX_XING_TASKS = ['是', '否'];
// 状态：线上为二级联动（已完成 / 未投放 > 5 项 / 启用中）
const EX_STATUS_OPTIONS = [
  { value: '已完成', label: '已完成' },
  {
    value: '未投放',
    label: '未投放',
    children: [
      { value: '已暂停', label: '已暂停' },
      { value: '项目超出预算', label: '项目超出预算' },
      { value: '未达投放时间', label: '未达投放时间' },
      { value: '不在投放时段', label: '不在投放时段' },
      { value: '预算组超出预算', label: '预算组超出预算' },
    ],
  },
  { value: '启用中', label: '启用中' },
];
const EX_STATUS_PROPS = { expandTrigger: 'hover', checkStrictly: false, emitPath: false };

const accounts = ref([]);
const videos = ref([]);
const images = ref([]);
const titlePacks = ref([]);
const landingPages = ref([]);
const eventAssets = ref([]);
const audiencePackages = ref([]);
const orientationPackages = ref([]);
const products = ref([]);
const monitorActivities = ref([]);
const awemeList = ref([
  { aweme_id: 'dy8821001', nickname: '央广官方号' },
  { aweme_id: 'dy8821002', nickname: '智者天下官方号' },
]);

const acctFilter = reactive({ project: '', subject: '', keyword: '', id_type: 'id' });
const acctTemp = ref([]);
const acctTableRef = ref(null);
const acctSyncing = ref(false);
const acctPage = ref(1);
const acctPageSize = ref(20);
const acctJumpPage = ref('1');

// 批量搜索（账户ID / 账户名称，一行一个，最多 1000 条）
const batchVisible = ref(false);
const batchText = ref('');
const acctBatch = ref([]);
const batchGutterRef = ref(null);
const batchTypeLabel = computed(() => (acctFilter.id_type === 'name' ? '账户名称' : '账户ID'));
const batchKeywords = computed(() => batchText.value
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(0, 1000));
const batchCount = computed(() => Math.max(1, batchKeywords.value.length));
const batchLineCount = computed(() => Math.max(1, batchText.value ? batchText.value.split('\n').length : 1));

// 选择任务弹窗
const taskFilter = reactive({ account_id: '', date_range: [], name_type: 'name', keyword: '' });
const taskPage = ref(1);
const taskPageSize = 10;
const taskJumpPage = ref('1');
const taskSelectedId = ref('');

// 选择已有项目抽屉
const exFilter = reactive({
  objective: '', sub_objective: '', delivery_mode: '', marketing_goal: '',
  ad_type: '', xing_task: '', status: '', name_type: 'name', keyword: '',
});
/** 子目标候选项：随推广目的联动（线上：未选推广目的时子目标为空且不可用） */
const exSubObjectives = computed(() => (exFilter.objective ? (EX_SUB_OBJECTIVE_MAP[exFilter.objective] || []) : []));
const exPage = ref(1);
const exPageSize = ref(20);
const exJumpPage = ref('1');
const exFilterFolded = ref(false);   // 筛选卡是否收起
const exShowCost = ref(false);       // 是否展示消耗/关联广告数
const exCostRange = ref([]);         // 消耗统计日期区间
// 抽屉内已勾选的项目（跨账户、跨筛选/翻页保留）
const exSelection = ref([]);
const exSelected = computed(() => exSelection.value);
const exTableRef = ref(null);

// 同步项目与广告弹窗（对齐线上 图3）
const syncVisible = ref(false);
const syncSearchType = ref('id');
const syncKeyword = ref('');
const syncChecked = ref([]);
const syncPage = ref(1);
const syncPageSize = ref(8);
const syncDateRange = ref([]);

// 保存策略组
const sgForm = reactive({ name: '', description: '' });

const form = reactive({
  name: '',
  account_ids: [],
  creative_project: '',
  create_mode: 'NEW',
  project_rule: 'BY_TOTAL',
  ad_rule: 'BY_CREATIVE',
  ads_limit_per_project: 100, // 每个项目广告数上限（项目生成规则=按总广告数/每项目广告数）
  ads_per_project: 100,        // 每个项目指定广告数（广告生成规则=指定数量）
  projects_per_account: 1,
  // 已有项目：[{ account_id, project_id }]
  existing_projects: [],
  uni_rule_mode: 'max_count',
  project: {
    operation: 'ENABLE',
    objective: 'APP',
    landing_type: 'APP',
    app_promotion_type: 'DOWNLOAD',
    marketing_goal: 'VIDEO_AND_IMAGE',
    ad_type: 'ALL',
    delivery_mode: 'MANUAL',
    delivery_type: 'NORMAL',
    inner_promotion: 'OFF',
    asset_type: 'ORANGE',
    micro_promotion_type: 'BYTE_GAME',
    name: '',
    // 关联产品投放
    related_product: 'OFF',
    product_count: 1,
    product_version: 'UPGRADE',
    product_source: 'EXISTING',
    workbench_version: 'NEW',
    product_match_mode: 'PER_PROJECT',
    product_ids: [],
    // AIGC 动态创意
    aigc_creative: 'OFF',
    // 投放内容与目标
    star_task: 'OFF',
    platform_types: ['APP_ANDROID'],
    app_name: '',
    track_link_source: 'EXIST',
    link_group_match: 'PER_ACCOUNT',
    link_group_id: null,
    download_type: 'DOWNLOAD_URL',
    launch_type: 'DIRECT_OPEN',
    download_url: '',
    open_url: '',
    subscribe_url: '',
    data_dock_type: 'EVENT',
    event_callback_type: 'SDK',
    external_action: 'AD_CONVERT_TYPE_ACTIVE',
    deep_external_action: '',
    deep_bid_type: 'NONE',
    asset_ids: [],
    // 投放版位
    inventory_catalog: 'UNIVERSAL_SMART',
    inventory_type: ['INVENTORY_AWEME_FEED'],
    union_video_type: 'NONE',
    // 用户定向
    target_package_source: 'ACCOUNT',
    target_match_mode: 'PER_PROJECT',
    carrier_targeting: 'OFF',
    audience_package_id: null,
    district: 'NONE',
    geolocation: '',
    location_type: 'CURRENT',
    gender: 'NONE',
    age: [],
    interest_action_mode: 'NONE',
    action_days: 'DAYS_30',
    action_categories: [],
    action_words: '',
    include_packages: [],
    exclude_packages: [],
    retargeting_tags_include: [],
    retargeting_tags_exclude: [],
    hide_if_converted: 'NO_EXCLUDE',
    // 项目排期与预算
    schedule_config_mode: 'UNIFIED',
    schedule_time: 'LONG_TERM',
    schedule_period: 'ALL',
    timeSlots: Object.fromEntries(Array.from({ length: 7 }, (_, d) => [d + 1, []])),
    start_date: '',
    end_date: '',
    bid_strategy: 'STABLE_COST',
    pay_method: 'PRICING_OCPM',
    budget_config_mode: 'UNIFIED',
    budget_mode: 'BUDGET_MODE_DAY',
    budget: 300,
    bid_method: 'FIXED',
    bid: 30,
    project_name_mode: 'UNIFIED',
    auto_truncate: true,
    random_suffix: false,
  },
  ad: {
    operation: 'ENABLE',
    name_template: '{date}-{time}-{index}',
    // 推广身份
    aweme_source: 'MANUAL',
    aweme_match_mode: 'PER_AD',
    aweme_id: '',
    anchor_type: 'OFF',
    // 创意组件 / 行动号召
    extra_component: 'OFF',
    cta: '立即咨询',
    cta_tags: ['立即咨询'],
    cta_smart: false,
    // 产品信息
    product_info_mode: 'UNIFIED',
    product_name: '',
    product_main_images: [],
    product_sell_points: [],
    // 广告设置
    ad_setting_mode: 'UNIFIED',
    comment_disable: true,
    brand_switch: 'OFF',
    category: '',
    brand_name: '',
    second_brand_name: '',
    ad_name_mode: 'UNIFIED',
    ad_auto_truncate: true,
    ad_random_suffix: false,
    // 兼容旧字段（素材/标题/落地页在独立抽屉）
    video_ids: [],
    video_mode: 'CREATIVE_IMAGE_MODE_VIDEO_VERTICAL',
    image_ids: [],
    image_mode: 'CREATIVE_IMAGE_MODE_SMALL',
    title_packs: [],
    landing_page_id: null,
    aweme_setting_type: 'MANUAL',
    source: 'SOURCES_SELF',
    ad_download_status: 'DOWNLOAD_STATUS_ALLOW',
    pricing: 'PRICING_OCPM',
    cpa_bid: 30,
    deep_cpabid: 20,
    roi_goal: 1,
    first_roi_goal: 1,
    auto_extend: true,
    keywords: [{ word: '', match_type: 'EXTENSIVE', bid: 1 }],
  },
  materials: {
    pick_mode: 'MANUAL',
    assign_rule: 'REUSE',
    upload_scope: 'ADVERTISER',
    home_visibility: 'ALWAYS',
    separate_layout: 'OFF',
    material_types: ['VIDEO'],
    guide_video: 'OFF',
    // 每个创意组配置（即单个广告内的素材数量）
    group_video_count: 1,
    group_image_count: 1,
    group_text_count: 1,
    group_name_template: '',
    ad_material_count_mode: 'UNIFIED',
    insufficient_rule: 'SKIP',
    dynamic_rules: [],
    creative_groups: [{ name: '创意组01', tab: 'video', videos: [], images: [], text_images: [] }],
  },
  titles: {
    pick_mode: 'MANUAL',
    title_source: 'TITLE_PACK',
    assign_rule: 'REUSE',
  },
  landing: {
    landing_page_type: 'ORANGE',
    landing_page_id: null,
    landing_page_name: '',
    track_url: '',
    download_type: 'DOWNLOAD_URL',
    launch_type: 'DIRECT_OPEN',
    download_url: '',
    deeplink_url: '',
  },
});

// ---- 摘要 ----
// 当前媒体类型下的媒体账户（选择媒体账户弹窗只展示本媒体的账户）
const mediaAccounts = computed(() => accounts.value.filter((a) => (a.media || 'upgrade') === media.value));
const selectedAccounts = computed(() => accounts.value.filter((a) => form.account_ids.includes(a.id)));
const accountSummary = computed(() => {
  if (!form.account_ids.length) return '请选择媒体账户';
  // 只展示第一个账户名称，其余通过鼠标移入浮层查看
  return selectedAccounts.value[0]?.name || '请选择媒体账户';
});
const ruleSummary = computed(() => {
  const ar = AD_RULES.find((r) => r.value === form.ad_rule)?.label || '';
  if (form.create_mode === 'EXIST') return `已有项目 广告规则: ${ar}`;
  const pr = PROJECT_RULES.find((r) => r.value === form.project_rule)?.label || '';
  return `项目规则: ${pr} 广告规则: ${ar}`;
});
const externalActionLabel = computed(() => {
  const all = Object.values(EXTERNAL_ACTIONS).flat();
  return all.find((o) => o.value === form.project.external_action)?.label || form.project.external_action;
});
const projectSummary = computed(() => {
  const lines = [];
  if (form.project.name) lines.push(`项目名称：${form.project.name}`);
  if (externalActionLabel.value) lines.push(`优化目标：${externalActionLabel.value}`);
  return lines;
});
const selectedVideos = computed(() => videos.value.filter((v) => form.ad.video_ids.includes(v.id)));
const selectedImages = computed(() => images.value.filter((i) => form.ad.image_ids.includes(i.id)));
const materialCount = computed(() => selectedVideos.value.length + selectedImages.value.length);
const selectedTitlePacks = computed(() => titlePacks.value.filter((t) => form.ad.title_packs.includes(t.id)));
const titleCount = computed(() => selectedTitlePacks.value.reduce((n, t) => n + (t.titles?.length || 1), 0));
const landingSelected = computed(() => !!form.ad.landing_page_id);
const landingSummary = computed(() => landingPages.value.find((l) => l.id === form.ad.landing_page_id)?.title || '');

const projectOptions = computed(() => [...new Set(mediaAccounts.value.map((a) => a.project))]);
const filteredAccounts = computed(() => {
  let rows = mediaAccounts.value;
  if (acctFilter.project) rows = rows.filter((a) => a.project === acctFilter.project);
  if (acctFilter.subject) rows = rows.filter((a) => (a.subject || subject) === acctFilter.subject);
  // 批量搜索：每行一个关键词，精确匹配账户ID 或 账户名称
  if (acctBatch.value.length) {
    const set = new Set(acctBatch.value.map((k) => k.toLowerCase()));
    rows = rows.filter((a) => (
      set.has(String(a.advertiser_id).toLowerCase()) || set.has(String(a.name).toLowerCase())
    ));
  }
  const kw = String(acctFilter.keyword || '').trim().toLowerCase();
  if (kw) {
    rows = rows.filter((a) => (
      acctFilter.id_type === 'name'
        ? a.name.toLowerCase().includes(kw)
        : String(a.advertiser_id).toLowerCase().includes(kw)
    ));
  }
  return rows;
});
const acctPageRows = computed(() => {
  const size = acctPageSize.value || 20;
  return filteredAccounts.value.slice((acctPage.value - 1) * size, acctPage.value * size);
});

// 项目是否已配置（广告信息 / 抖音号 / 产品信息 / 广告设置 / 落地页 均依赖它）
const projectConfigured = computed(() => (
  form.create_mode === 'NEW' ? !!form.project.name.trim() : form.existing_projects.length > 0
));

// ---- 选择任务（弹窗） ----
const taskFiltered = computed(() => {
  const kw = String(taskFilter.keyword || '').trim().toLowerCase();
  const [start, end] = taskFilter.date_range || [];
  return (mockDb.tasks || []).filter((t) => {
    if (taskFilter.account_id && t.account_id && String(t.account_id) !== String(taskFilter.account_id)) return false;
    if (kw) {
      const hit = taskFilter.name_type === 'id'
        ? String(t.task_no).toLowerCase().includes(kw)
        : String(t.name).toLowerCase().includes(kw);
      if (!hit) return false;
    }
    if (start && t.created_at < start) return false;
    if (end && t.created_at > `${end} 23:59:59`) return false;
    return true;
  });
});
const taskPageRows = computed(() => taskFiltered.value.slice((taskPage.value - 1) * taskPageSize, taskPage.value * taskPageSize));
const taskSelected = computed(() => (mockDb.tasks || []).find((t) => String(t.id) === String(taskSelectedId.value)) || null);

function resetTaskFilter() {
  Object.assign(taskFilter, { account_id: '', date_range: [], name_type: 'name', keyword: '' });
  taskPage.value = 1;
}
function selectTask(row) { taskSelectedId.value = row.id; }
function confirmTask() {
  if (!taskSelected.value) { ElMessage.warning('请选择一个任务'); return; }
  ElMessage.success(`已选择任务「${taskSelected.value.name}」`);
  taskVisible.value = false;
}

// ---- 选择已有项目（抽屉） ----
/** 抽屉内展示的账户：外面已选的媒体账户（按选择顺序） */
const exAccounts = computed(() => selectedAccounts.value);
/** 第一个账户 id（用于「当前项目」回显兜底） */
const exCurrentAccountId = computed(() => (exAccounts.value[0] ? String(exAccounts.value[0].id) : ''));
/** 抽屉内项目：受筛选条件影响，并按账户分组（每个账户的项目连续排列） */
const exFiltered = computed(() => {
  const kw = String(exFilter.keyword || '').trim().toLowerCase();
  const byId = exFilter.name_type === 'id';
  const order = new Map(exAccounts.value.map((a, i) => [String(a.id), i]));
  const list = existingProjects.filter((p) => {
    if (!order.has(String(p.account_id))) return false;
    if (exFilter.objective && p.objective !== exFilter.objective) return false;
    if (exFilter.sub_objective && p.sub_objective !== exFilter.sub_objective) return false;
    if (exFilter.delivery_mode && p.delivery_mode !== exFilter.delivery_mode) return false;
    if (exFilter.marketing_goal && p.marketing_goal !== exFilter.marketing_goal) return false;
    if (exFilter.ad_type && p.ad_type !== exFilter.ad_type) return false;
    // 星广联投为「是否使用星广联投任务」开关（线上是/否），非任务类型
    if (exFilter.xing_task) {
      const used = !!(p.xing_task && p.xing_task !== '--');
      if ((exFilter.xing_task === '是') !== used) return false;
    }
    if (exFilter.status && p.status !== exFilter.status) return false;
    if (kw) {
      const target = byId ? String(p.project_id) : `${p.name} ${p.project_id}`;
      if (!target.toLowerCase().includes(kw)) return false;
    }
    return true;
  });
  // 按账户顺序分组（组内保持原有顺序）
  const rows = list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (order.get(String(a.p.account_id)) - order.get(String(b.p.account_id))) || (a.i - b.i))
    .map(({ p }) => p);
  // 标记每个账户的首行（首列按账户合并成一行）
  let prev = '';
  return rows.map((p) => {
    const aid = String(p.account_id);
    const first = aid !== prev;
    prev = aid;
    return { ...p, __acctId: aid, __acctFirst: first };
  });
});
const exPageRows = computed(() => exFiltered.value.slice((exPage.value - 1) * exPageSize.value, exPage.value * exPageSize.value));
/** 首列合并：同一账户的项目合并为一个单元格（每个账户独占一行） */
const exSpanMethod = ({ row, columnIndex }) => {
  if (columnIndex !== 0) return;
  const rows = exPageRows.value;
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx < 0) return;
  if (!row.__acctFirst) return { rowspan: 0, colspan: 0 };
  let n = 1;
  for (let i = idx + 1; i < rows.length; i += 1) {
    if (rows[i].__acctId === row.__acctId) n += 1;
    else break;
  }
  return { rowspan: n, colspan: 1 };
};
/** 账户是否已勾选项目 */
const exAccountHasSelection = (accountId) => exSelection.value.some((r) => String(r.account_id) === String(accountId));
/** 账户名称（表格首列逐行展示） */
const exAccountName = (accountId) => {
  const a = selectedAccounts.value.find((x) => String(x.id) === String(accountId));
  return a ? a.name : `账户${accountId}`;
};
/** 当前账户下已选中的项目（用于「当前项目」摘要） */
const exCurrentProject = computed(() => {
  if (exSelection.value.length) return exSelection.value[0];
  const picked = (form.existing_projects || []).find((x) => String(x.account_id) === String(exCurrentAccountId.value));
  if (!picked) return null;
  return existingProjects.find((p) => String(p.id) === String(picked.project_id)) || null;
});
/** 「当前项目」明细：标签 + 值（线上口径，灰色标签 + 加粗深色值） */
const exCurrentProjectItems = computed(() => {
  const p = exCurrentProject.value;
  if (!p) return [];
  return [
    { k: '推广目的', v: p.objective },
    { k: '子目标', v: p.sub_objective },
    { k: '投放模式', v: p.delivery_mode },
    { k: '营销场景', v: p.marketing_goal },
    { k: '广告类型', v: p.ad_type },
    { k: '投放类型', v: p.delivery_type },
    { k: '优化目标', v: p.optimization_goal },
    { k: '竞价策略', v: p.bid_strategy },
    { k: '择优分配', v: p.priority_allocation },
    { k: '平台类型', v: p.platform_type },
    { k: '投放形式', v: p.delivery_form },
    { k: '展位', v: p.position },
    { k: '蓝海流量', v: p.blue_ocean },
  ].filter((i) => i.v);
});
const canPreview = computed(() => (
  form.account_ids.length > 0
  && projectConfigured.value
  && materialCount.value > 0
  && form.ad.title_packs.length > 0
  && (!isUpgrade.value || !!form.ad.landing_page_id)
));

const creativeGroupCount = computed(() => form.materials.creative_groups.length);
const titlePackCount = computed(() => form.ad.title_packs.length);

// 预估生成（分账户明细，口径对齐线上右上角折叠表）
const est = computed(() => {
  const groups = creativeGroupCount.value;
  const packs = titlePackCount.value;
  const rows = selectedAccounts.value.map((a) => {
    let ads = groups;
    if (form.ad_rule === 'BY_CREATIVE_TITLE') ads = groups * packs;
    else if (form.ad_rule === 'BY_PROJECT_CREATIVE') ads = groups * Math.max(1, form.projects_per_account);
    else if (form.ad_rule === 'BY_COUNT') ads = Math.max(1, form.ads_per_project);
    let projects = groups;
    if (form.project_rule === 'BY_TOTAL') projects = ads ? Math.ceil(ads / Math.max(1, form.ads_limit_per_project)) : 0;
    else if (form.project_rule === 'BY_TITLE') projects = packs;
    else if (form.project_rule === 'BY_COUNT') projects = form.projects_per_account || 0;
    return { account: a.name, projects, groups, ads };
  });
  const total = rows.reduce((n, r) => n + (isOc.value ? r.projects : r.ads), 0);
  return { rows, total };
});

// 生成预览的阻塞项提示
const previewTip = computed(() => {
  const miss = [];
  if (!form.account_ids.length) miss.push('媒体账户');
  if (!projectConfigured.value) miss.push('项目信息');
  if (!materialCount.value) miss.push('创意素材');
  if (!form.ad.title_packs.length) miss.push('标题包');
  if (isUpgrade.value && !form.ad.landing_page_id) miss.push('落地页');
  return miss.length ? `请先配置：${miss.join('、')}` : '';
});

// ---- 官方口径联动 ----
const assetTypeOptions = computed(() => ASSET_TYPES[form.project.landing_type] || []);
const externalActionOptions = computed(() => EXTERNAL_ACTIONS[form.project.landing_type] || []);
const needEventAsset = computed(() => ['APP', 'QUICK_APP'].includes(form.project.landing_type) || ['THIRDPARTY', 'MICRO_APP', 'WECHAT_APPLET'].includes(form.project.asset_type));
const needActionTargeting = computed(() => ['ACTION', 'INTEREST_ACTION'].includes(form.project.interest_action_mode));

const productOptions = computed(() => products.value);

function onObjectiveChange() {
  // objective 与官方 landing_type 枚举一致，直接同步
  form.project.landing_type = form.project.objective;
  onLandingTypeChange();
}

// ---- 分时投放网格（星期 × 小时，点击切换 / 拖动圈选）----
const dragActive = ref(false);
const dragValue = ref(true);
function isSlotOn(day, hour) {
  return (form.project.timeSlots[day] || []).includes(hour);
}
function setSlot(day, hour, on) {
  const list = form.project.timeSlots[day] || (form.project.timeSlots[day] = []);
  const idx = list.indexOf(hour);
  if (on && idx === -1) list.push(hour);
  if (!on && idx > -1) list.splice(idx, 1);
}
function onSlotMouseDown(day, hour) {
  dragActive.value = true;
  dragValue.value = !isSlotOn(day, hour);
  setSlot(day, hour, dragValue.value);
}
function onSlotEnter(day, hour) {
  if (!dragActive.value) return;
  setSlot(day, hour, dragValue.value);
}
function endDrag() {
  dragActive.value = false;
}
function fillAllSlots(on) {
  WEEK_DAYS.forEach((w) => {
    form.project.timeSlots[w.value] = on ? SCHEDULE_HOURS.map((h) => h.value) : [];
  });
}
function onLandingTypeChange() {
  const opts = ASSET_TYPES[form.project.landing_type];
  if (opts && !opts.some((o) => o.value === form.project.asset_type)) form.project.asset_type = opts[0]?.value || '';
  const ea = EXTERNAL_ACTIONS[form.project.landing_type];
  if (ea && !ea.some((o) => o.value === form.project.external_action)) form.project.external_action = ea[0]?.value || '';
}
function onAppPromoChange() {
  form.project.download_url = ''; form.project.open_url = ''; form.project.subscribe_url = '';
}
function onActionChange() { form.project.deep_external_action = ''; }
function copyLastProduct() { ElMessage.info('原型：引用上次广告的产品信息'); }
function onInterestModeChange() {
  form.project.action_categories = [];
  form.project.action_words = '';
  form.project.action_days = 'DAYS_30';
}

const isCpmCpc = computed(() => ['PRICING_CPM', 'PRICING_CPC'].includes(form.ad.pricing));
const budgetMin = computed(() => (isCpmCpc.value ? 100 : 300));
const bidMin = computed(() => {
  const p = form.ad.pricing;
  if (p === 'PRICING_CPM') return 4;
  if (p === 'PRICING_CPC') return 0.1;
  return 0.01;
});
function onPricingChange() {
  if (form.ad.budget < budgetMin.value) form.ad.budget = budgetMin.value;
  if (form.ad.bid < bidMin.value) form.ad.bid = bidMin.value;
}

function addKw() { form.ad.keywords.push({ word: '', match_type: 'EXTENSIVE', bid: 1 }); }
function removeKw(i) { form.ad.keywords.splice(i, 1); }

function onAcctSelection(rows) {
  if (acctSyncing.value) return;
  acctTemp.value = rows;
}
// 已选面板中移除单个账户（同时取消左侧表格勾选）
function removeAccount(a) {
  acctSyncing.value = true;
  const row = filteredAccounts.value.find((r) => r.id === a.id);
  if (acctTableRef.value && row) acctTableRef.value.toggleRowSelection(row, false);
  acctTemp.value = acctTemp.value.filter((x) => x.id !== a.id);
  nextTick(() => { acctSyncing.value = false; });
}
/** 打开弹窗时回显已选账户 */
function onAcctOpen() {
  acctPage.value = 1;
  acctJumpPage.value = '1';
  acctTemp.value = mediaAccounts.value.filter((a) => form.account_ids.includes(a.id));
  nextTick(() => {
    const tb = acctTableRef.value;
    if (!tb) return;
    tb.clearSelection();
    acctPageRows.value.forEach((row) => {
      if (acctTemp.value.some((a) => a.id === row.id)) tb.toggleRowSelection(row, true);
    });
  });
}
function onAcctSearch() { acctPage.value = 1; }
function clearAcctFilter() {
  Object.assign(acctFilter, { project: '', subject: '', keyword: '', id_type: 'id' });
  acctBatch.value = [];
  batchText.value = '';
  acctPage.value = 1;
}
// 批量搜索：按行拆分关键词，精确匹配账户ID / 账户名称
function applyBatchSearch() {
  acctBatch.value = batchKeywords.value;
  acctFilter.keyword = '';
  acctPage.value = 1;
  batchVisible.value = false;
}
function clearBatch() {
  batchText.value = '';
  acctBatch.value = [];
  acctPage.value = 1;
}
function onBatchScroll(e) {
  const t = e?.target;
  if (batchGutterRef.value && t) batchGutterRef.value.scrollTop = t.scrollTop;
}
function formatBalance(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '--';
}
// 单个关键字搜索时清空批量搜索条件，两者互斥
watch(() => acctFilter.keyword, (v) => {
  if (String(v || '').trim()) acctBatch.value = [];
});
function clearAcctSelection() {
  acctSyncing.value = true;
  acctTemp.value = [];
  acctTableRef.value?.clearSelection();
  nextTick(() => { acctSyncing.value = false; });
}
function confirmAccounts() {
  form.account_ids = acctTemp.value.map((a) => a.id);
  acctVisible.value = false;
}
function addGroup() {
  const n = form.materials.creative_groups.length + 1;
  form.materials.creative_groups.push({ name: `创意组${String(n).padStart(2, '0')}`, tab: 'video', videos: [], images: [], text_images: [] });
}
function removeGroup(i) { form.materials.creative_groups.splice(i, 1); }
function syncMaterials() {
  const vids = new Set(); const imgs = new Set();
  form.materials.creative_groups.forEach((g) => {
    if (!g.tab) g.tab = 'video';
    (g.videos || []).forEach((id) => vids.add(id));
    (g.images || []).forEach((id) => imgs.add(id));
  });
  form.ad.video_ids = [...vids];
  form.ad.image_ids = [...imgs];
}
function confirmMaterials() { syncMaterials(); matVisible.value = false; }
function onLandingSelect(id) {
  const lp = landingPages.value.find((l) => l.id === id);
  form.landing.landing_page_name = lp ? lp.title : '';
}
function clearMaterials() {
  form.ad.video_ids = []; form.ad.image_ids = [];
  form.materials.creative_groups.forEach((g) => { g.videos = []; g.images = []; g.text_images = []; });
}
function clearTitles() { form.ad.title_packs = []; }
function shuffleTitles() { ElMessage.info('原型：标题已乱序（本地模拟）'); }
function clearLanding() {
  form.ad.landing_page_id = null;
  form.landing.landing_page_name = ''; form.landing.track_url = '';
  form.landing.download_url = ''; form.landing.deeplink_url = '';
}

// ---- 规则配置（卡片式） ----
function pickRule(field, rule) {
  if (rule.disabled) {
    ElMessage.warning(`「${rule.label}」当前场景暂不支持`);
    return;
  }
  if (field === 'ad_rule' && isAdRuleDisabled(rule)) {
    ElMessage.warning(`「${rule.label}」当前创建方式暂不支持`);
    return;
  }
  form[field] = rule.value;
  // 项目生成规则变化后，若当前广告规则变为不可用则自动回退到第一个可用规则
  if (field === 'project_rule') ensureAdRuleAvailable();
}

// ---- 选择策略（策略组） ----
function onStrategyConfirm(sg) {
  applyStrategyGroup(sg.id);
}

// ---- 选择已有项目 ----
function openExisting() {
  existingVisible.value = true;
}
/** 切到「新建项目」：点击磁贴即表示创建方式切换 */
function switchToNewProject() {
  form.create_mode = 'NEW';
  projVisible.value = true;
}
/** 新建项目抽屉：确定 */
function onProjectConfirm() {
  form.create_mode = 'NEW';
  projVisible.value = false;
}
/** 新建项目抽屉：取消（不改变创建方式） */
function onProjectCancel() {
  projVisible.value = false;
}
function onExSelection(rows) {
  exSelection.value = rows;
}
/** 筛选搜索 */
function onExSearch() {
  exPage.value = 1;
}
/** 推广目的切换：子目标候选项联动，需清空已选子目标 */
function onExObjectiveChange() {
  exFilter.sub_objective = '';
  onExSearch();
}
/** 前往第 N 页 */
function onExJump() {
  const max = Math.max(1, Math.ceil(exFiltered.value.length / exPageSize.value));
  const n = parseInt(exJumpPage.value, 10);
  exPage.value = Math.min(Math.max(1, n || 1), max);
}
function clearSelectedProjects() {
  exSelection.value = [];
  if (exTableRef.value) exTableRef.value.clearSelection();
  form.existing_projects = [];
}
function confirmExistingProjects() {
  const picks = exSelected.value.map((p) => ({ account_id: p.account_id, project_id: p.id }));
  form.existing_projects = picks;
  // 确认选择后才切换创建方式（打开抽屉不改变当前模式）
  if (form.existing_projects.length) form.create_mode = 'EXIST';
  existingVisible.value = false;
  ElMessage.success(`已选择 ${form.existing_projects.length} 个已有项目`);
}
// ---- 同步项目与广告（对齐线上 图3） ----
/** 打开同步弹窗：默认勾选外面已选的媒体账户，更新时间默认近 14 天 */
function openSyncDialog() {
  syncChecked.value = form.account_ids.map(Number);
  syncVisible.value = true;
}
function onSyncOpen() {
  const end = new Date();
  const start = new Date(end.getTime() - 13 * 86400000);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  syncDateRange.value = [fmt(start), fmt(end)];
}
/** 可同步的账户：当前媒体下的媒体账户 */
const syncList = computed(() => mediaAccounts.value);
/** 左侧列表：按 ID / 名称过滤 */
const syncFilteredList = computed(() => {
  const kw = String(syncKeyword.value || '').trim().toLowerCase();
  if (!kw) return syncList.value;
  return syncList.value.filter((a) => (
    syncSearchType.value === 'name'
      ? String(a.name).toLowerCase().includes(kw)
      : String(a.advertiser_id).toLowerCase().includes(kw)
  ));
});
/** 左侧分页行 */
const syncPageRows = computed(() => {
  const size = syncPageSize.value || 8;
  return syncFilteredList.value.slice((syncPage.value - 1) * size, syncPage.value * size);
});
/** 右侧已选账户 */
const syncCheckedAccounts = computed(() => syncList.value.filter((a) => syncChecked.value.includes(a.id)));
const syncAllChecked = computed(() => syncFilteredList.value.length > 0 && syncFilteredList.value.every((a) => syncChecked.value.includes(a.id)));
const syncHalfChecked = computed(() => syncChecked.value.length > 0 && !syncAllChecked.value);
function toggleSyncAll(v) {
  const ids = syncFilteredList.value.map((a) => a.id);
  syncChecked.value = v
    ? Array.from(new Set([...syncChecked.value, ...ids]))
    : syncChecked.value.filter((id) => !ids.includes(id));
}
function toggleSyncOne(a, v) {
  syncChecked.value = v
    ? Array.from(new Set([...syncChecked.value, a.id]))
    : syncChecked.value.filter((id) => id !== a.id);
}
function removeSyncAccount(a) {
  syncChecked.value = syncChecked.value.filter((id) => id !== a.id);
}
function onSyncSearch() {
  syncPage.value = 1;
}
function onSyncPage(p) {
  syncPage.value = p;
}
function onSyncConfirm() {
  const n = syncChecked.value.length;
  const range = syncDateRange.value || [];
  syncVisible.value = false;
  ElMessage.success(`已同步 ${n} 个账户的项目与广告${range.length ? `（${range[0]} 至 ${range[1]}）` : ''}（原型模拟）`);
}

// ---- 创意素材辅助 ----
function applyGroupName() {
  const tpl = form.materials.group_name_template;
  if (!tpl) { ElMessage.warning('请先输入创意组名称模板'); return; }
  form.materials.creative_groups.forEach((g, i) => {
    g.name = tpl.replace('{index}', String(i + 1).padStart(2, '0'));
  });
  ElMessage.success('已统一配置创意组名称');
}
function shuffleGroups() {
  const gs = form.materials.creative_groups;
  for (let i = gs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [gs[i], gs[j]] = [gs[j], gs[i]];
  }
  ElMessage.info('原型：创意组已乱序（本地模拟）');
}
function copyFirstGroup() {
  const first = form.materials.creative_groups[0];
  if (!first) return;
  const n = form.materials.creative_groups.length + 1;
  form.materials.creative_groups.push({
    ...JSON.parse(JSON.stringify(first)),
    name: `创意组${String(n).padStart(2, '0')}`,
    tab: 'video',
  });
}
function randomPick() {
  ElMessage.info('原型：已随机为每个创意组分配素材（本地模拟）');
}
function smartPick() {
  ElMessage.info('原型：已智能优选素材（本地模拟）');
}
function refreshGroups() {
  ElMessage.info('原型：已一键刷新创意组（本地模拟）');
}
function addDynRule() {
  form.materials.dynamic_rules.push({ material_type: 'VIDEO', count: 1 });
}
function removeDynRule(i) { form.materials.dynamic_rules.splice(i, 1); }
function addFixedRule() {
  ElMessage.info('原型：添加指定素材规则（本地模拟）');
}

async function loadBase() {
  const [acc, assets, aud, ori] = await Promise.all([
    mediaApi.accounts(),
    assetApi.list({ page_size: 100 }),
    assetApi.byKind('audience'),
    assetApi.byKind('orientation'),
  ]);
  accounts.value = acc.data?.list || [];
  const all = assets.data?.list || [];
  videos.value = all.filter((a) => a.type === 'video');
  images.value = all.filter((a) => a.type === 'image');
  titlePacks.value = all.filter((a) => a.type === 'title_pack');
  landingPages.value = all.filter((a) => a.type === 'landing_page');
  eventAssets.value = mockDb.eventAssets;
  audiencePackages.value = aud.data?.list || [];
  orientationPackages.value = ori.data?.list || [];
  products.value = mockDb.products || [];
  monitorActivities.value = mockDb.monitorActivities || [];
}

function buildPlan() { return JSON.parse(JSON.stringify(form)); }

// ---------- 使用已有策略新建：套用策略组并自动回填各板块 ----------
// 策略组由账户列表「使用已有策略新建」带入（route.query.strategy），
// 回填范围：新建项目 / 广告信息 / 创意素材 / 标题包 / 落地页。
const strategyGroup = ref(null);

function applyStrategyGroup(id) {
  const sg = findStrategyGroup(id);
  if (!sg) return;
  strategyGroup.value = sg;
  // 来自「使用已有策略新建」/ 顶部「选择策略」
  activeTab.value = 'strategy';
  // 搭建模式决定「新建项目 / 已有项目」
  form.create_mode = sg.build_mode === '已有项目' ? 'EXIST' : 'NEW';
  const payload = sg.payload || {};
  Object.keys(payload).forEach((section) => {
    const target = form[section];
    if (!target || typeof target !== 'object') return;
    Object.assign(target, payload[section]);
  });
  // 派生字段：项目名称 / 落地页名称
  if (!form.project.name) form.project.name = `${sg.name}-新建项目`;
  if (form.ad.landing_page_id && !form.landing.landing_page_name) {
    const lp = landingPages.value.find((l) => l.id === form.ad.landing_page_id);
    form.landing.landing_page_name = lp ? lp.title : '';
  }
  // 创意组与广告素材保持一致
  syncMaterials();
  ElMessage.success(`已按策略组「${sg.name}」自动填充各板块配置`);
}

async function onPreview() {
  previewing.value = true;
  try {
    const res = await buildApi.preview(buildPlan());
    preview.value = res.data;
  } finally {
    previewing.value = false;
  }
}

function onSaveStrategy() {
  if (!sgForm.name.trim()) { ElMessage.warning('请输入策略组名称'); return; }
  ElMessage.success(`策略组「${sgForm.name}」已保存（原型模拟）`);
  saveVisible.value = false;
}

function goTasks() { router.push({ name: 'tasks' }); }

async function onSubmit() {
  if (!form.account_ids.length) { ElMessage.warning('请至少选择一个媒体账户'); return; }
  if (!form.project.name) { ElMessage.warning('请填写项目名称'); return; }
  if (!form.ad.video_ids.length && !form.ad.image_ids.length) { ElMessage.warning('请至少选择一个视频或图片素材'); return; }
  submitting.value = true;
  try {
    const res = await buildApi.submit({ plan: buildPlan(), idempotency_key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    ElMessage.success(`任务已提交（原型模拟，共 ${res.data?.total ?? 0} 条）`);
    router.push({ name: 'tasks' });
  } finally {
    submitting.value = false;
  }
}

const onDocMouseUp = () => endDrag();
// 创建方式切换：两种创建方式各自记住一条广告规则（线上行为：切到「已有项目」默认「按创意组数」，切回「新建项目」恢复原选择）
const adRuleMemory = { NEW: 'BY_CREATIVE', EXIST: 'BY_CREATIVE' };
watch(() => form.create_mode, (mode, oldMode) => {
  if (oldMode) adRuleMemory[oldMode] = form.ad_rule;
  form.ad_rule = adRuleMemory[mode] || 'BY_CREATIVE';
  ensureAdRuleAvailable();
});
onMounted(async () => {
  await loadBase();
  // 带策略组进入时自动回填各板块
  if (route.query.strategy) applyStrategyGroup(route.query.strategy);
  document.addEventListener('mouseup', onDocMouseUp);
});
onBeforeUnmount(() => document.removeEventListener('mouseup', onDocMouseUp));
</script>

<style scoped>
.batch-page { display: flex; flex-direction: column; gap: 16px; padding: 16px 20px 20px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; height: 48px; }
.top-right { display: flex; align-items: center; gap: 12px; }
.page-title { font-size: 16px; font-weight: 600; color: #1d2129; }
.task-link { font-size: 13px; }
.card { background: #fff; border-radius: 6px; padding: 16px; }
.seg-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.seg { display: flex; gap: 12px; }
.seg :deep(.el-button) { min-width: 120px; margin-left: 0; }
.est-wrap { position: relative; }
.est { font-size: 14px; color: #4e5969; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 6px 0; }
.est b { color: #2563eb; font-size: 18px; }
.est__caret { font-size: 12px; color: #86909c; }
.est-panel { position: absolute; top: 100%; right: 0; z-index: 20; width: 560px; margin-top: 8px; background: #fff; border: 1px solid #e5e6eb; border-radius: 8px; box-shadow: 0 6px 16px rgba(0, 0, 0, .08); padding: 12px; }
.est-total { margin-top: 10px; text-align: right; font-size: 13px; color: #4e5969; }
.rule-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.rule-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.rule-label { color: #86909c; }
.rule-value { color: #1d2129; }
/* 媒体账户 / 规则配置：带边框的分组控件（对齐线上） */
.rule-box { display: inline-flex; align-items: center; height: 32px; border: 1px solid #e5e6eb; border-radius: 4px; background: #fff; overflow: hidden; max-width: 100%; }
.rule-box__label { padding: 0 12px; font-size: 13px; color: #86909c; border-right: 1px solid #e5e6eb; align-self: stretch; display: flex; align-items: center; white-space: nowrap; }
.rule-box__value { padding: 0 16px; font-size: 13px; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rule-box__value.placeholder { color: #c9cdd4; }
/* 媒体账户：只展示一个账户名，宽度随内容收缩（多账户通过浮层查看） */
.rule-box--acct { flex: none; max-width: 360px; }
.rule-box--acct .rule-box__value { max-width: 220px; }
/* 浮层：全部已选账户名称 */
.acct-all { max-width: 320px; max-height: 260px; overflow-y: auto; }
.acct-all__item { font-size: 13px; line-height: 22px; word-break: break-all; }
.rule-box .rule-box__act { margin-left: 0; padding: 0 12px; font-size: 13px; }
.rule-value.placeholder { color: #c9cdd4; }
.rule-input { width: 220px; }
/* 五列配置区（列宽比例对齐线上：项目 19.2% / 广告信息 15.4% / 创意素材 30.8% / 标题包 19.2% / 落地页 15.4%） */
.grid-cols { display: grid; grid-template-columns: 19.2% 15.4% 30.8% 19.2% 15.4%; border: 1px solid #e5e6eb; border-radius: 4px; overflow: hidden; }
.col { display: flex; flex-direction: column; min-height: 300px; border-right: 1px solid #e5e6eb; }
.col:last-child { border-right: none; }
.col-head { padding: 12px 16px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #f2f3f5; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.col-head__title { color: #1d2129; }
.col-count { font-size: 12px; font-weight: 400; color: #86909c; }
.col-head .col-head__act { margin-left: auto; padding: 0; font-size: 12px; }
.col-head .col-head__act + .col-head__act { margin-left: 0; }
.col-body { flex: 1; padding: 12px 16px; overflow-y: auto; }
.col-body--center { display: flex; align-items: center; justify-content: center; }
.col-pick { font-size: 13px; }
.col-line { font-size: 13px; color: #4e5969; margin-bottom: 8px; }
.material-list { display: flex; flex-direction: column; gap: 6px; }
.material-chip { font-size: 12px; color: #4e5969; background: #f7f8fa; border-radius: 4px; padding: 6px 8px; }
.col-foot { padding: 10px 16px; border-top: 1px solid #f2f3f5; text-align: center; }
.action-bar { display: flex; justify-content: center; gap: 12px; background: #fff; border-radius: 6px; padding: 16px; }
.preview-card { min-height: 280px; }
.preview-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.stat-block { padding: 4px 0; }
.stat-title { color: #86909c; font-size: 13px; }
.stat-value { margin-top: 8px; font-size: 28px; font-weight: 600; color: #1d2129; }
.precheck-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.precheck-item { display: flex; align-items: center; gap: 8px; }
.precheck-item__msg { font-size: 13px; color: #4e5969; }
.dlg-filter { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.dlg-tip { font-size: 12px; color: #86909c; margin-bottom: 12px; }
/* ===== 选择媒体账户弹窗（对齐线上 49.png） ===== */
.acct-filter { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
.acct-f { flex: none; }
.acct-f--project { width: 235px !important; flex: 0 0 235px; }
.acct-f--subject { width: 290px !important; flex: 0 0 290px; }
.acct-f__label { font-size: 13px; color: #4e5969; white-space: nowrap; }
.acct-search__icon { cursor: pointer; }
.acct-search__batch { cursor: pointer; color: #86909c; transition: color .15s; }
.acct-search__batch:hover { color: #165dff; }
/* 搜索组（对齐线上 图2：[账户ID ∨] | [搜索媒体账户 + 批量搜索] | [搜索按钮]，三者共用一个外框） */
.acct-sg {
  display: inline-flex;
  align-items: stretch;
  height: 32px;
  flex: none;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
  transition: border-color .2s;
}
.acct-sg:hover { border-color: var(--el-border-color-darker); }
.acct-sg:focus-within { border-color: var(--el-color-primary); }
.acct-sg__type { width: 118px !important; flex: 0 0 118px; }
.acct-sg__type :deep(.el-select__wrapper) {
  height: 30px;
  padding-left: 12px;
  padding-right: 26px;
  border-radius: 6px 0 0 6px;
  background: transparent;
  box-shadow: none !important;
  border-right: 1px solid var(--el-border-color);
}
.acct-sg__type :deep(.el-select__caret) { color: var(--el-text-color-placeholder); }
.acct-sg__input { width: 215px !important; flex: 0 0 215px; }
.acct-sg__input :deep(.el-input__wrapper) {
  height: 30px;
  padding-left: 12px;
  background: transparent;
  box-shadow: none !important;
}
.acct-sg__btn {
  flex: none;
  width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-left: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 15px;
  cursor: pointer;
  transition: color .15s;
}
.acct-sg__btn:hover { color: var(--el-color-primary); }
.acct-clear { padding: 0 4px; font-size: 13px; }
.acct-tip { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #86909c; margin-bottom: 8px; }
.acct-tip__icon { color: #f77234; font-size: 14px; }
.acct-body { display: flex; gap: 12px; align-items: flex-start; }
.acct-body .el-table { flex: 1; min-width: 0; }
.acct-name { font-size: 13px; color: #1d2129; line-height: 1.4; }
.acct-id { font-size: 12px; color: #86909c; line-height: 1.4; }
/* 批量搜索弹层（对齐线上 图2：标题 + 清空 + 精确匹配提示 + 行号文本域 + 清空/搜索） */
.acct-batch { width: 100%; }
.acct-batch__head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; }
.acct-batch__title { font-size: 15px; font-weight: 600; color: #1d2129; }
.acct-batch__clear { padding: 0; font-size: 13px; }
.acct-batch__hint { padding: 10px 16px; font-size: 13px; color: #4e5969; background: #f7f8fa; }
.acct-batch__link { color: #165dff; cursor: pointer; }
.acct-batch__editor { display: flex; margin: 0 16px; border: 1px solid #e5e6eb; border-radius: 4px; overflow: hidden; height: 320px; }
.acct-batch__gutter { width: 46px; flex: 0 0 46px; overflow: hidden; background: #fff; border-right: 1px solid #e5e6eb; padding: 10px 0; text-align: right; }
.acct-batch__ln { font-size: 13px; line-height: 20px; color: #86909c; padding-right: 10px; }
.acct-batch__input { flex: 1; min-width: 0; }
.acct-batch__input :deep(.el-textarea__inner) { height: 100%; border: none; box-shadow: none; border-radius: 0; padding: 10px 12px; font-size: 13px; line-height: 20px; color: #1d2129; }
.acct-batch__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px 16px; }
.acct-picked { width: 200px; flex: 0 0 200px; border: 1px solid #e5e6eb; border-radius: 4px; display: flex; flex-direction: column; height: 398px; }
.acct-picked__head { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f2f3f5; font-size: 13px; color: #1d2129; }
.acct-picked__clear { padding: 0; font-size: 12px; }
.acct-picked__body { flex: 1; overflow-y: auto; padding: 8px 12px; }
/* 已选：每个账户一个矩形，可单独移除 */
.acct-picked__item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px 0 10px;
  margin-bottom: 6px;
  background: #f7f8fa;
  border-radius: 4px;
}
.acct-picked__name { flex: 1; min-width: 0; font-size: 12px; color: #4e5969; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acct-picked__del { flex: none; cursor: pointer; font-size: 13px; color: #86909c; transition: color .15s; }
.acct-picked__del:hover { color: #165dff; }
.acct-pager { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.acct-total { font-size: 13px; color: #4e5969; }
.acct-size { width: 96px; }
.acct-jump { font-size: 13px; color: #4e5969; }
.acct-jump__input { width: 46px; }
/* 抽屉分组：独立矩形卡片 */
.form-section { border: 1px solid #e5e6eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fff; }
.form-section__title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #f2f3f5; }
/* 抽屉表单字段统一纵向单列排列 */
.drawer-form :deep(.el-row) { display: block; margin-left: 0; margin-right: 0; }
.drawer-form :deep(.el-col) { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
.drawer-form :deep(.el-form-item) { margin-bottom: 18px; }
.drawer-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
/* 标签与控件视觉优化 */
.drawer-form :deep(.el-form-item__label) { font-size: 13px; color: #1d2129; line-height: 1.5; padding-bottom: 6px; }
.drawer-form :deep(.el-form-item.is-required .el-form-item__label::before) { color: #f53f3f; margin-right: 4px; }
.drawer-form :deep(.el-input__wrapper),
.drawer-form :deep(.el-select__wrapper) { border-radius: 6px; }
.drawer-form :deep(.el-radio-group),
.drawer-form :deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; }
.kw-row { margin-top: 8px; }
.slot-grid { width: 100%; border: 1px solid #e5e6eb; border-radius: 8px; overflow-x: hidden; overflow-y: auto; max-height: 300px; user-select: none; background: #fff; }
.slot-row { display: grid; grid-template-columns: 56px repeat(7, 1fr); align-items: center; }
.slot-head { position: sticky; top: 0; z-index: 2; background: #f7f8fa; border-bottom: 1px solid #e5e6eb; }
.slot-corner, .slot-col, .slot-hour { font-size: 11px; text-align: center; padding: 5px 0; }
.slot-corner { color: #86909c; }
.slot-col { font-weight: 500; color: #1d2129; }
.slot-hour { color: #86909c; }
.slot-cell { height: 14px; margin: 2px 6px; border-radius: 3px; background: #f2f3f5; cursor: pointer; transition: background .15s; }
.slot-cell.on { background: #2563eb; }
.slot-cell:hover { background: #94bfff; }
.slot-cell.on:hover { background: #1d4fd7; }
.slot-actions { width: 100%; display: flex; align-items: center; gap: 12px; margin-top: 10px; padding: 0 2px; }
.slot-hint { font-size: 12px; color: #86909c; }

/* ===== 同步项目与广告弹窗（对齐线上 图3） ===== */
.sync-form { display: grid; grid-template-columns: 92px 1fr; row-gap: 18px; align-items: start; }
.sync-label { font-size: 15px; color: #4e5969; padding-top: 9px; }
.sync-content { min-width: 0; }
.sync-panels { display: flex; gap: 16px; align-items: flex-start; }
.sync-panel { border: 1px solid #e5e6eb; border-radius: 4px; background: #fff; overflow: hidden; }
.sync-panel.left { flex: 1; min-width: 0; }
.sync-panel.right { width: 250px; }
.panel-head {
  height: 38px; display: flex; align-items: center; padding: 0 12px;
  border-bottom: 1px solid #e5e6eb; font-size: 14px; color: #1d2129;
}
.sel-head { justify-content: space-between; }
.panel-search { display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid #e5e6eb; }
.sync-type { width: 92px !important; border-radius: 4px 0 0 4px; }
.sync-input { flex: 1; min-width: 0; border-radius: 0; }
.sync-input :deep(.el-input__wrapper) { border-left: none; border-radius: 0; box-shadow: 0 0 0 1px var(--el-input-border-color) inset; }
.sync-search-btn { width: 40px; padding: 8px 0; margin-left: -1px; border-radius: 0 4px 4px 0; border-left: none; color: #4e5969; }
.panel-list { padding: 10px 12px 0; }
.check-all { display: flex; height: 28px; }
.list-scroll { max-height: 286px; overflow-y: auto; }
.list-item { display: flex; height: 32px; align-items: center; }
.list-item :deep(.el-checkbox__label) {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 14px; color: #1d2129;
}
.list-empty { padding: 48px 0; text-align: center; color: #86909c; font-size: 14px; }
.sync-pager { padding: 8px 12px 10px; justify-content: flex-start; }
.sel-body { min-height: 386px; display: flex; flex-direction: column; justify-content: center; }
.sel-scroll { max-height: 386px; overflow-y: auto; padding: 4px 12px; }
.sel-item { padding: 8px 0; font-size: 14px; color: #1d2129; border-bottom: 1px dashed #f2f3f5; }
.sel-item__del { margin-left: 8px; color: #86909c; cursor: pointer; }
.sel-item__del:hover { color: #f53f3f; }
.sync-date { width: 320px !important; }
.sync-tip { margin-top: 8px; font-size: 13px; color: #86909c; }

/* ===== 线上批量搭建页对齐（新增） ===== */
/* 项目列：选择已有项目 / 新建项目 双磁贴 */
/* 项目列：选择已有项目 / 新建项目 各占一半（对齐线上 图1） */
.mode-split { display: flex; width: 100%; height: 100%; }
.mode-split__cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  cursor: pointer;
  transition: background .15s;
}
.mode-split__cell.active { background: #f2f3f5; }
.mode-split__text { font-size: 14px; color: #165dff; }
.mode-split__cell.active .mode-split__text { color: #1d2129; font-weight: 600; }
/* 抖音号 / 产品信息 / 广告设置 按钮行 */
.cfg-btns { display: flex; gap: 12px; margin-top: 14px; }
/* 规则配置：卡片式 */
.rule-form :deep(.el-form-item__label) { font-size: 14px; color: #1d2129; white-space: nowrap; word-break: keep-all; }
/* 底部单行字段（每个账户指定项目数 / 每个项目广告数上限 / 每个项目指定广告数）：标签 + ⓘ + 输入框同行不换行 */
.rule-inline-item :deep(.el-form-item__content) { flex-wrap: nowrap; white-space: nowrap; align-items: center; }
.rule-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%; }
.rule-card { border: 1px solid #e5e6eb; border-radius: 6px; padding: 12px; cursor: pointer; transition: border-color .15s, background .15s; min-height: 100px; }
.rule-card:hover { border-color: #94bfff; }
.rule-card.active { border-color: #2563eb; background: #f2f7ff; }
.rule-card.disabled { background: #f7f8fa; cursor: not-allowed; }
.rule-card.disabled .rule-card__title { color: #86909c; }
.rule-card__title { font-size: 14px; color: #1d2129; margin-bottom: 6px; }
.rule-card__desc { font-size: 12px; color: #86909c; line-height: 1.6; }
.rule-qa { color: #86909c; cursor: help; margin-right: 6px; }
/* 多账户分配规则等三选一卡片 */
.card-choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; }
.choice-card { border: 1px solid #e5e6eb; border-radius: 6px; padding: 12px; cursor: pointer; transition: border-color .15s, background .15s; }
.choice-card:hover { border-color: #94bfff; }
.choice-card.active { border-color: #2563eb; background: #f2f7ff; }
.choice-card__title { font-size: 14px; color: #1d2129; margin-bottom: 4px; }
.choice-card__desc { font-size: 12px; color: #86909c; }
/* 每个创意组配置：数量输入 */
.count-row { display: flex; gap: 24px; flex-wrap: wrap; }
.count-item { display: flex; align-items: center; gap: 8px; }
.count-item__label { font-size: 13px; color: #4e5969; }
/* 统一配置创意组名 */
.inline-row { display: flex; gap: 8px; align-items: center; width: 100%; }
.inline-row .el-input { flex: 1; }
/* 创意制作工具条 */
.creative-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.creative-group { border: 1px solid #e5e6eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.group-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.group-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
/* 动态选取规则 */
.dyn-rule { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.dyn-rule__label { font-size: 13px; color: #4e5969; }
/* 抽屉分组附加说明 */
.form-section__extra { font-size: 13px; font-weight: 400; color: #86909c; }
.dlg-tip.warn { color: #f77234; }
/* 选择已有项目抽屉（对齐线上：大卡片 = 筛选 + 当前项目 + 选择已有项目 + 项目表 + 分页） */
.ex-card { position: relative; border: 1px solid #e5e6eb; border-radius: 4px; background: #fff; padding: 16px 20px 20px; }
.ex-card__fold { position: absolute; right: 16px; top: 24px; font-size: 16px; color: #86909c; cursor: pointer; transition: color .15s; }
.ex-card__fold:hover { color: #165dff; }
/* 筛选：3 列「标签 + 控件」合成输入框 */
.ex-filter-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 16px; padding-right: 56px; }
.ex-field {
  display: flex; align-items: center; height: 32px; min-width: 0;
  border: 1px solid var(--el-border-color); border-radius: 4px;
  background: var(--el-fill-color-blank); overflow: hidden; transition: border-color .2s;
}
.ex-field:hover { border-color: var(--el-border-color-darker); }
.ex-field:focus-within { border-color: var(--el-color-primary); }
.ex-field__label {
  flex: none; display: inline-flex; align-items: center; justify-content: flex-end; gap: 2px; height: 100%;
  padding: 0 10px 0 12px; font-size: 14px; color: #1d2129; white-space: nowrap;
  border-right: 1px solid var(--el-border-color); cursor: pointer;
}
.ex-field__label--type { cursor: pointer; }
.ex-field__caret { font-size: 12px; display: inline-flex; color: #86909c; }
.ex-field__ctrl { flex: 1; min-width: 0; }
.ex-field__ctrl :deep(.el-select__wrapper) { height: 30px; padding-left: 10px; background: transparent; box-shadow: none !important; }
.ex-field__ctrl :deep(.el-select__caret) { color: var(--el-text-color-placeholder); }
.ex-field__ctrl :deep(.el-select__placeholder) { font-size: 14px; }
.ex-field__ctrl :deep(.el-input__wrapper) { height: 30px; padding-left: 10px; background: transparent; box-shadow: none !important; }
/* 状态（线上为二级联动）*/
.ex-field__ctrl :deep(.el-cascader) { width: 100%; }
.ex-field__ctrl :deep(.el-cascader .el-input__suffix) { color: var(--el-text-color-placeholder); }
.ex-field__btn {
  flex: none; width: 34px; height: 100%; display: inline-flex; align-items: center; justify-content: center;
  border-left: 1px solid var(--el-border-color); color: var(--el-text-color-regular); cursor: pointer; transition: color .15s;
}
.ex-field__btn:hover { color: var(--el-color-primary); }
/* 当前项目 */
.ex-current { margin: 14px 0 12px; }
.ex-current__label { font-size: 15px; font-weight: 600; color: #1d2129; }
.ex-current__detail { margin-top: 4px; font-size: 13px; line-height: 22px; color: #86909c; }
.ex-current__detail b { color: #1d2129; font-weight: 600; }
.ex-current__none { margin-top: 4px; font-size: 13px; line-height: 22px; color: #86909c; }
/* 选择已有项目 */
.ex-pick {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 12px 14px; border: 1px solid #e5e6eb; border-radius: 4px; background: #f7f8fa;
}
.ex-pick__left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; flex: 1; min-width: 0; }
.ex-pick__title { font-size: 15px; font-weight: 600; color: #1d2129; }
.ex-pick__cost { font-size: 14px; }
.ex-pick__range { width: 250px; flex: none; }
.ex-pick__range :deep(.el-date-editor) { width: 100% !important; }
.ex-pick__right { display: flex; gap: 10px; flex: none; }
.ex-btn { border-radius: 4px; color: #165dff; border-color: #165dff; background: #fff; }
.ex-btn:hover { color: #fff; border-color: #165dff; background: #165dff; }
/* 项目表 + 分页 */
.ex-table { margin-top: 12px; }
.ex-acct-head__check { color: #00b42a; }
/* 账户名称吸顶：滚动时始终能看到当前账户名 */
.ex-acct-cell {
  position: sticky;
  top: 4px;
  z-index: 1;
  display: flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  background: #fff;
  font-size: 13px;
  color: #1d2129;
}
.ex-acct-cell__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ex-table :deep(th.ex-acct-th) { background: #e8f3ff; }
/* 账户列：同一账户的项目合并为一个单元格（每个账户独占一行） */
.ex-table :deep(td.ex-acct-td) { vertical-align: top; }
/* 让 .cell 撑满合并后的单元格，账户名才能在单元格内吸顶 */
.ex-table :deep(td.ex-acct-td .cell) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: visible;
}
.ex-pname { font-size: 13px; font-weight: 600; color: #1d2129; }
.ex-pid { font-size: 12px; color: #86909c; }
/* 分页 */
.ex-pager { display: flex; align-items: center; gap: 12px; padding: 12px 4px 0; }
.ex-total { font-size: 14px; color: #4e5969; }
.ex-size { width: 104px; }
.ex-jump { font-size: 14px; color: #4e5969; }
.ex-jump__input { width: 46px; }
/* 任务筛选 */
.task-filter { align-items: center; }
/* 分页 */
.sg-pager { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.sg-total { font-size: 14px; color: #4e5969; }
.sg-jump { font-size: 14px; color: #4e5969; }
.sg-jump-input { width: 46px; }
</style>

<style>
/* 弹窗外壳（teleport 到 body，需全局样式） */
.rule-dialog .el-dialog__title,
.acct-dialog .el-dialog__title,
.task-dialog .el-dialog__title,
.save-dialog .el-dialog__title,
.sync-dialog .el-dialog__title { color: #1d2129; font-size: 16px; font-weight: 600; }
.rule-dialog .el-dialog__body { padding-top: 16px; }
.rule-dialog { max-width: calc(100vw - 40px); }
.acct-dialog { max-width: calc(100vw - 40px); }
.acct-dialog .el-dialog__body { padding-top: 16px; }
/* 批量搜索浮层外壳（teleport 到 body，需全局样式） */
.acct-batch-pop.el-popover { --el-popover-padding: 0; border-radius: 6px; }
.task-dialog .el-dialog__body { padding-top: 12px; }
</style>
