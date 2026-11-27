<template>
  <div class="pd-page">
    <!-- ① 页面标题 -->
    <div class="asset-title-bar">
      <span class="asset-title">巨量商品库</span>
    </div>

    <!-- ② 二级页签（线上 cl-minor-nav：商品库-通用版 / 商品-通用版 / 商品-升级版） -->
    <div class="asset-sub-tabs">
      <div
        v-for="t in TABS"
        :key="t.key"
        class="asset-sub-tab"
        :class="{ active: t.key === tabKey }"
        @click="onTabChange(t.key)"
      >{{ t.text }}</div>
    </div>

    <!-- ③ 查询条件（工作台 / 商品库类型）+ 关键词搜索 + 清空；右侧「同步资产」 -->
    <div class="filter-row">
      <div class="filter-left">
        <!-- 工作台 -->
        <div v-if="cfg.filters.includes('workspace')" class="filter-cell">
          <label class="filter-label">工作台：</label>
          <el-select
            v-model="query.workspace"
            class="filter-select pd-fs-workspace"
            size="small"
            placeholder="请选择工作台"
            @change="onFilterChange"
          >
            <el-option v-for="o in WORKBENCH" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 商品库类型（40 个选项） -->
        <div v-if="cfg.filters.includes('libType')" class="filter-cell">
          <label class="filter-label">商品库类型：</label>
          <el-select
            v-model="query.libType"
            class="filter-select pd-fs-libtype"
            size="small"
            placeholder="不限"
            @change="onFilterChange"
          >
            <el-option v-for="o in LIB_TYPES" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 商品库（商品-通用版页签，末位「搜索更多(N)…」） -->
        <div v-if="cfg.filters.includes('libName')" class="filter-cell">
          <label class="filter-label">商品库：</label>
          <el-select
            v-model="query.libName"
            class="filter-select pd-fs-libname"
            size="small"
            placeholder="不限"
            @change="onFilterChange"
          >
            <el-option v-for="o in shownLibNames" :key="o" :label="o" :value="o" />
            <template #footer>
              <li
                v-if="libPage < libMaxPage"
                class="el-select-dropdown__item el-select-dropdown__item--tips pd-more-item"
                @click.stop="loadMoreLibs"
              > 搜索更多({{ LIB_NAMES.length }})... </li>
            </template>
          </el-select>
        </div>

        <!-- 关键词搜索（字段类型下拉 100px + 关键词输入 200px + ⊞ 批量搜索 + 🔍） -->
        <div class="pd-search-cell">
          <div class="cl-search">
            <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
              <el-option v-for="o in SEARCH_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              class="search-input pd-search-input"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="onSearch"
              @clear="onSearch"
            >
              <template #suffix>
                <el-popover placement="bottom-end" :width="320" trigger="click" popper-class="pd-batch-popper">
                  <template #reference>
                    <el-icon class="pd-more-icon" title="批量搜索">
                      <!-- 线上批量搜索图标是「圆 + 横线」，不是 MoreFilled 的三个点 -->
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                        <circle cx="12" cy="12" r="9" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                      </svg>
                    </el-icon>
                  </template>
                  <div class="pd-batch">
                    <div class="pd-batch__hd">
                      <span class="pd-batch__title">请输入{{ currentSearchLabel }}（{{ batchText.length }}/1000）</span>
                      <el-link type="primary" :underline="false" @click="clearBatch">清空</el-link>
                    </div>
                    <div class="pd-batch__tip">每一行为一个关键词，批量搜索将执行<el-link type="primary" :underline="false">精确匹配</el-link>。</div>
                    <el-input
                      v-model="batchText"
                      type="textarea"
                      :rows="8"
                      resize="none"
                      placeholder="请粘贴或输入商品名称，回车可换行"
                    />
                    <div class="batch-search-ops">
                      <el-button size="small" @click="clearBatch">清空</el-button>
                      <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                    </div>
                  </div>
                </el-popover>
              </template>
              <template #append>
                <el-button class="pd-search-btn" :icon="Search" title="搜索" @click="onSearch" />
              </template>
            </el-input>
          </div>
        </div>

        <!-- 清空 -->
        <a class="filter-clear" @click="clearFilters">清空</a>
      </div>

      <!-- 筛选区右侧「同步资产」（线上位于筛选行最右） -->
      <div class="filter-right">
        <el-button type="primary" size="small" class="tool-btn" :loading="syncing" @click="openSyncDialog">同步资产</el-button>
      </div>
    </div>

    <!-- ④ 工具栏：批量操作（下拉按钮式，未勾选行时置灰）+ 创建商品 -->
    <div class="table-toolbar">
      <el-dropdown v-if="cfg.batch" @command="onBatchCommand">
        <el-button
          type="primary"
          plain
          size="small"
          class="tool-btn pd-batch-btn"
          :disabled="!selectedRows.length"
        >
          批量操作<span v-if="selectedRows.length">({{ selectedRows.length }})</span><el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="o in BATCH_ITEMS" :key="o.command" :command="o.command" custom>
              <div class="pd-batch-card">
                <div class="pd-batch-card__icon" :class="'is-' + o.command">{{ o.icon }}</div>
                <div class="pd-batch-card__body">
                  <div class="pd-batch-card__title">{{ o.title }}</div>
                  <div class="pd-batch-card__subtitle">{{ o.subtitle }}</div>
                </div>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button v-if="cfg.create" type="primary" size="small" class="tool-btn" @click="openDrawer">创建商品</el-button>
    </div>

    <!-- ⑤ 列表（线上 el-table--border，列宽与线上一致） -->
    <el-table
      :data="pagedRows"
      row-key="id"
      border
      class="asset-table pd-table"
      @selection-change="onSelectionChange"
    >
      <el-table-column v-if="cfg.selection" type="selection" width="60" fixed="left" />
      <el-table-column
        v-for="c in cfg.columns"
        :key="c.label"
        :label="c.label"
        :prop="c.prop"
        :min-width="c.width"
        :show-overflow-tooltip="c.type !== 'desc'"
      >
        <template v-if="c.type === 'desc'" #default="{ row }">
          <div class="desc-cell">
            <div class="desc-cell__title" :title="row[c.prop]">{{ row[c.prop] || '—' }}</div>
            <div class="desc-cell__desc" :title="row[c.sub]">{{ row[c.sub] || '' }}</div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- ⑥ 分页（线上 共 51 条 / 20条每页 / 前往页） -->
    <div class="pager-card">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="filteredRows.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ⑦ 新建抽屉「生成巨量商品」（线上 cl-drawer，宽度 1016px） -->
    <el-drawer
      v-model="drawerVisible"
      :size="1016"
      direction="rtl"
      :with-header="false"
      class="pd-drawer"
    >
      <div class="cl-drawer">
        <!-- 抽屉左侧悬浮关闭按钮（线上：蓝色方块 X，压在抽屉左边界） -->
        <button class="pd-drawer-close" title="关闭" @click="closeDrawer">
          <el-icon><Close /></el-icon>
        </button>

        <div class="drawer-header">
          <span class="header-title">生成巨量商品</span>
        </div>

        <div class="drawer-content">
          <!-- 分区 ① 任务策略 -->
          <div class="module-container">
            <div class="cl-form-block-title">任务策略</div>
            <el-form class="cl-drawer-form" label-width="144px" label-position="left" size="small">
              <el-form-item label="引用策略或任务">
                <el-radio-group v-model="form.taskSource" class="ag-radio">
                  <el-radio-button v-for="o in TASK_SOURCES" :key="o" :value="o">{{ o }}</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="引用历史任务">
                <el-select
                  v-model="form.historyTask"
                  class="ag-select pd-history-select"
                  size="small"
                  filterable
                  placeholder="请输入任务名称搜索"
                >
                  <el-option v-for="t in HISTORY_TASKS" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
                <el-button class="ml8" size="small" type="primary" @click="onReuseTask">复用</el-button>
                <div class="pd-tips">选择近30天历史任务快速回显。</div>
              </el-form-item>
            </el-form>
          </div>

          <!-- 分区 ② 商品库 -->
          <div class="module-container">
            <div class="cl-form-block-title">商品库</div>
            <el-form class="cl-drawer-form" label-width="144px" label-position="left" size="small">
              <el-form-item label="工作台来源">
                <el-radio-group v-model="form.workbench" class="ag-radio">
                  <el-radio-button v-for="o in WORKBENCH_SOURCES" :key="o" :value="o">{{ o }}</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <!-- 联动（线上实测）：工作台来源=新版工作台 时隐藏「商品库类型」「链接来源」「变现内容」三组 -->
              <el-form-item v-if="form.workbench !== '新版工作台'" label="商品库类型" required>
                <el-radio-group v-model="form.libType" class="ag-radio">
                  <el-radio-button v-for="o in DRAWER_LIB_TYPES" :key="o" :value="o">{{ o }}</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="指定商品库" required>
                <el-button size="small" type="primary" @click="libPickerVisible = true">选择商品库</el-button>
                <span v-if="form.libName" class="pd-picked ml8">{{ form.libName }}</span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 分区 ③ 商品投放载体 -->
          <div class="module-container">
            <div class="cl-form-block-title">商品投放载体</div>
            <el-form class="cl-drawer-form" label-width="144px" label-position="left" size="small">
              <el-form-item label="投放载体" required>
                <el-checkbox-group v-model="form.carriers" class="pd-carrier">
                  <el-checkbox-button v-for="o in CARRIERS" :key="o" :value="o" :label="o">{{ o }}</el-checkbox-button>
                </el-checkbox-group>
              </el-form-item>

              <!-- 联动（线上实测）：工作台来源=新版工作台 时隐藏「链接来源」整组 -->
              <el-form-item v-if="form.workbench !== '新版工作台'" label="链接来源">
                <el-radio-group v-model="form.linkSource" class="ag-radio">
                  <el-radio-button v-for="o in LINK_SOURCES" :key="o" :value="o">{{ o }}</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label=" ">
                <el-button size="small" type="primary" @click="linkPickerVisible = true">
                  {{ carrierLinkText }}
                </el-button>
                <span v-if="form.linkUrl" class="pd-picked ml8">{{ form.linkUrl }}</span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 分区 ④ 商品基础配置 -->
          <div class="module-container">
            <div class="cl-form-block-title">商品基础配置</div>
            <el-form class="cl-drawer-form" label-width="144px" label-position="left" size="small">
              <el-form-item label="版权方主体名称" required>
                <el-input
                  v-model="form.copyrightOwner"
                  class="ag-input"
                  size="small"
                  placeholder="请填写版权方主体名称"
                />
              </el-form-item>

              <el-form-item v-if="form.workbench !== '新版工作台'" label="变现内容" required>
                <el-radio-group v-model="form.monetize" class="ag-radio">
                  <el-radio-button v-for="o in MONETIZE_TYPES" :key="o" :value="o">{{ o }}</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <!-- 分区 ⑤ 多商品配置 -->
          <div class="module-container pd-multi-config">
            <div class="cl-form-block-title">多商品配置</div>
            <div class="pd-multi-config__toolbar">
              <el-button size="small" type="primary" @click="imagePickerVisible = true">批量选择商品图片</el-button>
            </div>

            <!-- 批量设置模板 -->
            <div class="pd-multi-config__header">
              <div class="pd-mc-title pd-mc-title--fixed">批量设置模板</div>
              <div class="pd-mc-title">商品图片</div>
              <div class="pd-mc-title pd-mc-title--w260">
                <span>类目</span>
                <el-button class="btn-refresh" size="small" text @click="onRefreshCategory">刷新</el-button>
              </div>
              <div class="pd-mc-title">漫剧制作类型</div>
              <div class="pd-mc-title pd-mc-title--w120">短剧男女频</div>
              <div class="pd-mc-title">起始解锁集数</div>
              <div class="pd-mc-title">单集剧集时长(分钟)</div>
            </div>
            <div class="pd-multi-config__content">
              <div class="pd-mc-cell pd-mc-cell--fixed">
                <el-button class="btn-refresh" size="small" text @click="copyVisible = true">复制到其他商品</el-button>
              </div>
              <div class="pd-mc-cell">
                <div class="pd-mc-noimage">+添加图片</div>
              </div>
              <div class="pd-mc-cell pd-mc-cell--w260">
                <el-cascader
                  v-model="form.category"
                  class="ag-select"
                  size="small"
                  placeholder="请选择类目"
                  :options="CATEGORY_OPTIONS"
                />
              </div>
              <div class="pd-mc-cell">--</div>
              <div class="pd-mc-cell pd-mc-cell--w120">--</div>
              <div class="pd-mc-cell">--</div>
              <div class="pd-mc-cell">--</div>
            </div>
            <div class="pd-multi-config__tip">
              <el-icon><InfoFilled /></el-icon>
              根据剧目ID归类，本次将创建{{ form.carriers.length }}个商品
            </div>

            <!-- 小程序链接备注 -->
            <div class="pd-multi-config__header">
              <div class="pd-mc-title pd-mc-title--fixed">小程序链接备注</div>
              <div class="pd-mc-title">商品图片</div>
              <div class="pd-mc-title pd-mc-title--w260">
                <span>类目</span>
                <el-button class="btn-refresh" size="small" text @click="onRefreshCategory">刷新</el-button>
              </div>
              <div class="pd-mc-title">漫剧制作类型</div>
              <div class="pd-mc-title pd-mc-title--w120">短剧男女频</div>
              <div class="pd-mc-title">起始解锁集数</div>
              <div class="pd-mc-title">单集剧集时长(分钟)</div>
            </div>
            <div class="pd-multi-config__content">
              <div class="pd-mc-empty">暂无数据，清添加投放载体</div>
            </div>
          </div>
        </div>

        <!-- 抽屉底部：左侧「策略名称 + 存为策略」，右侧「取 消 / 确 定」 -->
        <div class="drawer-footer">
          <div class="dialog-footer flex pd-footer">
            <div class="pd-footer__left">
              <div class="ag-input-wrap has-counter pd-strategy-wrap">
                <el-input
                  v-model="form.strategyName"
                  class="ag-input"
                  size="small"
                  maxlength="100"
                  placeholder=""
                />
                <span class="input-suffix">{{ (form.strategyName || '').length }}/100</span>
              </div>
              <el-button class="ml16" size="small" type="primary" @click="onSaveStrategy">存为策略</el-button>
            </div>
            <div class="operate-button">
              <el-button size="small" plain @click="closeDrawer">取 消</el-button>
              <el-button size="small" type="primary" @click="submitDrawer">确 定</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ⑧ 选择商品库（线上：选择商品库弹窗） -->
    <el-dialog
      v-model="libPickerVisible"
      title="选择商品库"
      width="720px"
      append-to-body
      :close-on-click-modal="false"
      class="pd-dialog"
    >
      <el-input v-model="libPickerKeyword" size="small" placeholder="请输入关键词" style="width: 240px; margin-bottom: 12px" />
      <el-table :data="filteredPickerLibs" border size="small" max-height="360" class="pd-picker-table">
        <el-table-column prop="name" label="商品库名称" min-width="220" />
        <el-table-column prop="type" label="商品库类型" width="160" />
        <el-table-column prop="id" label="商品库ID" width="200" />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="libPickerVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="confirmLibPick">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑨ 选择投放载体链接 -->
    <el-dialog
      v-model="linkPickerVisible"
      :title="carrierLinkText"
      width="720px"
      append-to-body
      :close-on-click-modal="false"
      class="pd-dialog"
    >
      <el-input v-model="linkPickerKeyword" size="small" placeholder="请输入链接名称" style="width: 240px; margin-bottom: 12px" />
      <el-table :data="filteredPickerLinks" border size="small" max-height="360" class="pd-picker-table">
        <el-table-column prop="name" label="链接名称" min-width="240" />
        <el-table-column prop="url" label="链接地址" min-width="280" />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="linkPickerVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="confirmLinkPick">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑩ 批量选择商品图片 -->
    <el-dialog
      v-model="imagePickerVisible"
      title="批量选择商品图片"
      width="720px"
      append-to-body
      :close-on-click-modal="false"
      class="pd-dialog"
    >
      <el-checkbox-group v-model="pickedImages" class="pd-image-group">
        <el-checkbox v-for="o in IMAGE_OPTIONS" :key="o" :value="o" :label="o" class="pd-image-item">{{ o }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="imagePickerVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="confirmImagePick">提交</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑪ 复制到其他商品 -->
    <el-dialog
      v-model="copyVisible"
      title="复制到其他商品"
      width="600px"
      append-to-body
      :close-on-click-modal="false"
      class="pd-dialog"
    >
      <el-checkbox-group v-model="copyTargets" class="pd-image-group">
        <el-checkbox v-for="o in copyTargetOptions" :key="o" :value="o" :label="o" class="pd-image-item">{{ o }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="copyVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="confirmCopy">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑩ 同步商品 弹窗（线上 el-dialog「同步商品」；工作台×商品类型 四组合联动） -->
    <el-dialog
      v-model="syncDialogVisible"
      title="同步商品"
      width="960px"
      top="8vh"
      :close-on-click-modal="false"
      append-to-body
      class="pd-share-dialog"
    >
      <el-form :model="syncForm" label-width="130px" label-position="right" class="pd-dialog-form">
        <el-form-item label="工作台">
          <el-radio-group v-model="syncForm.workspace" size="small" @change="onSyncWorkspaceChange">
            <el-radio-button value="旧版">旧版</el-radio-button>
            <el-radio-button value="新版">新版</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="商品类型">
          <el-radio-group v-model="syncForm.goodsType" size="small" @change="onSyncTypeChange">
            <el-radio-button v-for="t in SYNC_GOODS_TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 新版 + 商品-通用版：同步范围卡片二选一 -->
        <el-form-item v-if="isNewGeneral" label="同步范围">
          <div class="pd-scope-cards">
            <div
              class="pd-scope-card"
              :class="{ active: syncForm.scope === '近1000条' }"
              @click="syncForm.scope = '近1000条'"
            >
              <div class="pd-scope-card__head">近1000条<span class="pd-scope-card__tag">推荐</span></div>
              <div class="pd-scope-card__desc">速度较快，满足常规同步需求。</div>
            </div>
            <div
              class="pd-scope-card"
              :class="{ active: syncForm.scope === '全量同步' }"
              @click="syncForm.scope = '全量同步'"
            >
              <div class="pd-scope-card__head">全量同步<span class="pd-scope-card__muted">较慢</span></div>
              <div class="pd-scope-card__desc">拉取商品库全部商品，低优先级排队执行。</div>
            </div>
          </div>
        </el-form-item>

        <!-- 旧版 + 商品-通用版：所属账户下拉 -->
        <el-form-item v-if="isLegacyGeneral" label="所属账户">
          <el-select v-model="syncForm.account" class="pd-dialog-select" size="small" filterable placeholder="请选择所属账户">
            <el-option v-for="a in SYNC_ACCOUNT_OPTIONS" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>

        <!-- 新版 + 商品-通用版：组织账户下拉 -->
        <el-form-item v-if="isNewGeneral" label="组织账户">
          <el-select v-model="syncForm.orgAccount" class="pd-dialog-select" size="small" filterable placeholder="请选择组织账户">
            <el-option v-for="o in ORG_ACCOUNT_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>

        <!-- 选择商品库（旧版通用版 / 新版通用版） -->
        <el-form-item v-if="showLibPicker" label="选择商品库">
          <div class="pd-share-transfer">
            <div class="pd-share-col pd-sync-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">商品库</span>
                <a class="pd-share-refresh" @click="onSyncRefresh"><el-icon><Refresh /></el-icon>刷新</a>
              </div>
              <div class="pd-share-checkall">
                <el-checkbox :model-value="syncAllChecked" :indeterminate="syncIndeterminate" @change="toggleSyncAll">全选</el-checkbox>
              </div>
              <div class="pd-share-list">
                <el-checkbox-group v-model="syncPicked">
                  <el-checkbox v-for="l in LIB_NAMES" :key="l" :value="l" class="pd-share-item">
                    <span class="pd-share-item__label" :title="l">{{ l }}</span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            <div class="pd-share-col pd-sync-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">已选：{{ syncSelected.length }}/200</span>
                <a class="pd-share-clear" @click="clearSyncSelected">清空</a>
              </div>
              <div class="pd-share-list">
                <div v-if="syncSelected.length" class="pd-share-selected">
                  <div v-for="s in syncSelected" :key="s" class="pd-share-selected__item">
                    <span>{{ s }}</span>
                    <el-icon class="pd-share-selected__del" @click="removeSyncSelected(s)"><Close /></el-icon>
                  </div>
                </div>
                <div v-else class="pd-share-empty">
                  <svg class="pd-share-empty__icon" viewBox="0 0 64 64" fill="none" stroke="#c0c4cc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="23" y="16" width="18" height="24" rx="2" />
                    <line x1="28" y1="24" x2="36" y2="24" />
                    <line x1="28" y1="30" x2="36" y2="30" />
                    <path d="M16 44 L48 44 L43 55 L21 55 Z" />
                  </svg>
                  <span>暂无数据</span>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 旧版 + 商品-升级版：选择广告主账户 -->
        <el-form-item v-if="isLegacyAdv" label="选择广告主账户">
          <div class="pd-share-transfer">
            <div class="pd-share-col pd-sync-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">广告主账户</span>
                <a class="pd-share-refresh" @click="onSyncRefresh"><el-icon><Refresh /></el-icon>刷新</a>
              </div>
              <div class="pd-share-checkall">
                <el-checkbox :model-value="syncAllChecked" :indeterminate="syncIndeterminate" @change="toggleSyncAll">全选</el-checkbox>
              </div>
              <div class="pd-share-list">
                <el-checkbox-group v-model="syncPicked">
                  <el-checkbox v-for="a in SYNC_ACCOUNT_OPTIONS" :key="a" :value="a" class="pd-share-item">
                    <span class="pd-share-item__label" :title="a">{{ a }}</span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            <div class="pd-share-col pd-sync-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">已选：{{ syncSelected.length }}/200</span>
                <a class="pd-share-clear" @click="clearSyncSelected">清空</a>
              </div>
              <div class="pd-share-list">
                <div v-if="syncSelected.length" class="pd-share-selected">
                  <div v-for="s in syncSelected" :key="s" class="pd-share-selected__item">
                    <span>{{ s }}</span>
                    <el-icon class="pd-share-selected__del" @click="removeSyncSelected(s)"><Close /></el-icon>
                  </div>
                </div>
                <div v-else class="pd-share-empty">
                  <svg class="pd-share-empty__icon" viewBox="0 0 64 64" fill="none" stroke="#c0c4cc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="23" y="16" width="18" height="24" rx="2" />
                    <line x1="28" y1="24" x2="36" y2="24" />
                    <line x1="28" y1="30" x2="36" y2="30" />
                    <path d="M16 44 L48 44 L43 55 L21 55 Z" />
                  </svg>
                  <span>暂无数据</span>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 新版 + 商品-升级版：选择组织账户 -->
        <el-form-item v-if="isNewAdv" label="选择组织账户">
          <div class="pd-share-transfer">
            <div class="pd-share-col pd-sync-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">组织账户</span>
                <a class="pd-share-refresh" @click="onSyncRefresh"><el-icon><Refresh /></el-icon>刷新</a>
              </div>
              <div class="pd-share-checkall">
                <el-checkbox :model-value="syncAllChecked" :indeterminate="syncIndeterminate" @change="toggleSyncAll">全选</el-checkbox>
              </div>
              <div class="pd-share-list">
                <el-checkbox-group v-model="syncPicked">
                  <el-checkbox v-for="o in ORG_ACCOUNT_OPTIONS" :key="o" :value="o" class="pd-share-item">
                    <span class="pd-share-item__label" :title="o">{{ o }}</span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            <div class="pd-share-col pd-sync-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">已选：{{ syncSelected.length }}/200</span>
                <a class="pd-share-clear" @click="clearSyncSelected">清空</a>
              </div>
              <div class="pd-share-list">
                <div v-if="syncSelected.length" class="pd-share-selected">
                  <div v-for="s in syncSelected" :key="s" class="pd-share-selected__item">
                    <span>{{ s }}</span>
                    <el-icon class="pd-share-selected__del" @click="removeSyncSelected(s)"><Close /></el-icon>
                  </div>
                </div>
                <div v-else class="pd-share-empty">
                  <svg class="pd-share-empty__icon" viewBox="0 0 64 64" fill="none" stroke="#c0c4cc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="23" y="16" width="18" height="24" rx="2" />
                    <line x1="28" y1="24" x2="36" y2="24" />
                    <line x1="28" y1="30" x2="36" y2="30" />
                    <path d="M16 44 L48 44 L43 55 L21 55 Z" />
                  </svg>
                  <span>暂无数据</span>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="operate-button pd-share-footer">
          <el-button size="small" plain @click="syncDialogVisible = false">取消</el-button>
          <el-button size="small" type="primary" @click="onSyncSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ⑪ 共享巨量商品库 弹窗（线上 el-dialog，标题「共享巨量商品库」，宽 760px）
         布局：工作台管理账户 / 账户主体 两个下拉 + 「添加授权账户」左右两栏联动（候选账户 ⇄ 已选，上限 200） -->
    <el-dialog
      v-model="shareDialogVisible"
      title="共享巨量商品库"
      width="960px"
      top="8vh"
      :close-on-click-modal="false"
      append-to-body
      class="pd-share-dialog"
    >
      <el-form label-width="130px" label-position="right" class="pd-dialog-form">
        <el-form-item label="工作台管理员账户">
          <el-select v-model="shareForm.workspaceAccount" class="pd-dialog-select" size="small" filterable placeholder="请选择工作台管理员账户">
            <el-option v-for="a in SHARE_ACCOUNT_OPTIONS" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="账户主体">
          <el-select v-model="shareForm.entity" class="pd-dialog-select" size="small" filterable placeholder="不限">
            <el-option label="不限" value="" />
            <el-option v-for="e in SHARE_ENTITY_OPTIONS" :key="e" :label="e" :value="e" />
          </el-select>
        </el-form-item>

        <el-form-item label="选择推送账户">
          <div class="pd-share-transfer">
            <!-- 左栏：媒体账户 -->
            <div class="pd-share-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">媒体账户</span>
                <a class="pd-share-refresh" @click="onShareRefresh">
                  <el-icon><Refresh /></el-icon>刷新
                </a>
              </div>
              <el-input v-model="shareCandidateKeyword" class="pd-share-search" size="small" placeholder="请输入关键词" clearable @clear="onShareSearch">
                <template #append>
                  <el-button class="pd-share-search-btn" :icon="Search" @click="onShareSearch" />
                </template>
              </el-input>
              <div class="pd-share-checkall">
                <el-checkbox
                  :model-value="allChecked"
                  :indeterminate="isIndeterminate"
                  @change="toggleCheckAll"
                >全选</el-checkbox>
              </div>
              <div class="pd-share-list">
                <el-checkbox-group v-model="sharePicked">
                  <el-checkbox
                    v-for="c in shownShareCandidates"
                    :key="c.id"
                    :value="c.id"
                    class="pd-share-item"
                    :disabled="shareSelected.length >= 200 && !shareSelected.includes(c.id)"
                  >
                    <span class="pd-share-item__label" :title="c.label">{{ c.label }}</span>
                  </el-checkbox>
                </el-checkbox-group>
                <div v-if="!shownShareCandidates.length" class="pd-share-empty">暂无数据</div>
              </div>
              <div class="pd-share-pager">
                <el-pagination
                  v-model:current-page="shareCandidatePage"
                  :page-size="20"
                  :total="shareCandidatesTotal"
                  layout="prev, pager, next"
                  small
                  background
                />
              </div>
            </div>

            <!-- 右栏：已选 -->
            <div class="pd-share-col">
              <div class="pd-share-col__head">
                <span class="pd-share-col__title">已选：{{ shareSelected.length }}/200</span>
                <a class="pd-share-clear" @click="clearShareSelected">清空</a>
              </div>
              <div class="pd-share-list">
                <div v-if="shareSelected.length" class="pd-share-selected">
                  <div v-for="s in shareSelected" :key="s" class="pd-share-selected__item">
                    <span>{{ shareCandidateMap[s] }}</span>
                    <el-icon class="pd-share-selected__del" @click="removeShareSelected(s)"><Close /></el-icon>
                  </div>
                </div>
                <div v-else class="pd-share-empty">
                  <svg class="pd-share-empty__icon" viewBox="0 0 64 64" fill="none" stroke="#c0c4cc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <!-- 纸张 -->
                    <rect x="23" y="16" width="18" height="24" rx="2" />
                    <line x1="28" y1="24" x2="36" y2="24" />
                    <line x1="28" y1="30" x2="36" y2="30" />
                    <!-- 托盘 -->
                    <path d="M16 44 L48 44 L43 55 L21 55 Z" />
                    <!-- 星星点缀 -->
                    <path d="M48 14 l1.2 2.4 2.6.4 -2 1.8.6 2.6 -2.4-1.4 -2.4 1.4.6-2.6 -2-1.8 2.6-.4 Z" />
                  </svg>
                  <span>暂无数据</span>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="operate-button pd-share-footer">
          <el-button size="small" plain @click="shareDialogVisible = false">取消</el-button>
          <el-button size="small" type="primary" @click="onShareSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ASSET_LIB_TYPE_OPTIONS, ASSET_ACCOUNT_OPTIONS } from './assetOptions';
import { ElMessage } from 'element-plus';
import { ArrowDown, Close, InfoFilled, MoreFilled, Refresh, Search } from '@element-plus/icons-vue';

/* ------------------------------------------------------------------
 * 智投标准版「巨量广告·标准 → 资产 → 巨量商品库」
 * 线上：https://cl.mobgi.com/property/toutiao/product/product-platform-universal
 *
 * 采集自线上 DOM / 线上构建产物（2026-11-18 实测）：
 *   - 二级页签：商品库-通用版（默认）/ 商品-通用版 / 商品-升级版，
 *     三个页签的筛选项、按钮、列、数据完全不同。
 *   - 商品库-通用版：筛选「工作台(124) / 商品库类型(180)」，右侧「同步资产」，
 *     工具栏「批量操作(下拉) / 创建商品」，列 [勾选框60|商品库818|商品库类型817]。
 *   - 商品-通用版：筛选「工作台(124) / 商品库(204)」，无批量操作、无勾选框，
 *     列 [商品465|商品库465|商品库类型465|创建时间150|更新时间150]。
 *   - 商品-升级版：仅筛选「工作台」，仅「同步资产」，列
 *     [勾选框60|商品445|商品标题445|商品类目445|创建时间150|更新时间150]。
 *   - 新建抽屉「生成巨量商品」宽 1016px，分区：任务策略 / 商品库 /
 *     商品投放载体 / 商品基础配置 / 多商品配置，底部「存为策略 + 取 消 / 确 定」。
 * ------------------------------------------------------------------ */

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------ 线上枚举 ------------------------------ */

const TABS = [
  { key: 'lib', text: '商品库-通用版' },
  { key: 'goods', text: '商品-通用版' },
];

/** 工作台（筛选 + 抽屉「工作台来源」） */
const WORKBENCH = ['旧版', '新版'];
const WORKBENCH_SOURCES = ['旧版工作台', '新版工作台'];

/** 商品库类型（线上 36 项，顺序照抄线上 DOM） */
const LIB_TYPES = ASSET_LIB_TYPE_OPTIONS;

/** 关键词搜索的字段类型 */
const SEARCH_FIELDS = [
  { label: '名称', value: 'name' },
  { label: 'ID', value: 'id' },
];

/** 抽屉：引用策略或任务 */
const TASK_SOURCES = ['近30天任务', '策略'];
/** 抽屉：商品库类型（短剧库） */
const DRAWER_LIB_TYPES = ['付费短剧库', '免费短剧库'];
/** 抽屉：投放载体 */
const CARRIERS = ['字节小程序', '微信小程序', '端原生组件', '安卓/iOS应用'];
/** 抽屉：链接来源 */
const LINK_SOURCES = ['同步本地', '手动填写'];
/** 抽屉：变现内容 */
const MONETIZE_TYPES = ['混合', '免费'];
/** 抽屉：类目级联 */
const CATEGORY_OPTIONS = [
  { value: '单剧目-短剧', label: '单剧目-短剧' },
  { value: '单剧目-漫剧', label: '单剧目-漫剧' },
];

/** 批量操作下拉（线上顺序：智投创意云 / 万镜台 / 共享；R88 按用户要求只保留「共享」） */
const BATCH_ITEMS = [
  { command: 'share', icon: '共', title: '共享', subtitle: '' },
];

/** 抽屉「引用历史任务」（线上远程搜索，此处用 mock） */
const HISTORY_TASKS = [
  { id: 't1', name: '2026-11-10 短剧批量上架-女频' },
  { id: 't2', name: '2026-11-06 免费短剧库上新' },
  { id: 't3', name: '2026-10-28 IAP漫剧商品库补录' },
  { id: 't4', name: '2026-10-20 短剧小说库同步' },
];

/** 批量选择商品图片 */
const IMAGE_OPTIONS = [
  '短剧封面-女频-竖版', '短剧封面-男频-竖版', '短剧封面-通用-方版',
  '商品主图-通用-白底', '商品主图-通用-场景', '商品主图-剧照-第一集',
];

/* ------------------------------ mock 数据 ------------------------------ */

/** 商品库名称（线上「商品库-通用版」共 51 个商品库） */
/** 同步商品弹窗（线上 el-dialog「同步商品」，宽 992px，4 字段：工作台 / 商品类型 / 所属账户 / 选择商品库） */
const SYNC_GOODS_TYPES = ['商品-通用版', '商品-升级版'];
const SYNC_ACCOUNT_OPTIONS = ASSET_ACCOUNT_OPTIONS;
/** 组织账户（线上「新版+升级版」穿梭框，纯名称列表） */
const ORG_ACCOUNT_OPTIONS = [
  '央广-红果-自负亏损测试', '央广漫剧R3', '央广时代', '代理央广时代',
  'AI漫剧创作神器', '代理liruohan', 'chenpeihua代理', '代理liuziyuan01',
  '漫剧-央广时代-iap', '漫剧-央广时代',
];
const syncDialogVisible = ref(false);
const syncForm = ref({ workspace: '旧版', goodsType: '商品-通用版', scope: '近1000条', account: '', orgAccount: '' });
const syncPicked = ref([]);
const syncSelected = ref([]);

/* 工作台 × 商品类型 四组合 */
const isLegacyGeneral = computed(() => syncForm.value.workspace === '旧版' && syncForm.value.goodsType === '商品-通用版');
const isLegacyAdv = computed(() => syncForm.value.workspace === '旧版' && syncForm.value.goodsType === '商品-升级版');
const isNewGeneral = computed(() => syncForm.value.workspace === '新版' && syncForm.value.goodsType === '商品-通用版');
const isNewAdv = computed(() => syncForm.value.workspace === '新版' && syncForm.value.goodsType === '商品-升级版');
/** 旧版/新版通用版都用「选择商品库」穿梭框 */
const showLibPicker = computed(() => isLegacyGeneral.value || isNewGeneral.value);

/** 当前穿梭框候选列表（随组合切换） */
const currentPickerList = computed(() => {
  if (isLegacyAdv.value) return SYNC_ACCOUNT_OPTIONS;
  if (isNewAdv.value) return ORG_ACCOUNT_OPTIONS;
  return LIB_NAMES;
});

const syncAllChecked = computed(() => currentPickerList.value.length > 0
  && currentPickerList.value.every((x) => syncSelected.value.includes(x)));
const syncIndeterminate = computed(() => {
  const sel = currentPickerList.value.filter((x) => syncSelected.value.includes(x)).length;
  return sel > 0 && sel < currentPickerList.value.length;
});

/** 勾选变化 → 同步已选（上限 200；取消即移除） */
watch(syncPicked, (val) => {
  syncSelected.value = val.filter((x) => currentPickerList.value.includes(x)).slice(0, 200);
});

function toggleSyncAll(checked) {
  let next = [...syncSelected.value];
  if (checked) {
    currentPickerList.value.forEach((x) => { if (!next.includes(x)) next.push(x); });
  } else {
    next = next.filter((x) => !currentPickerList.value.includes(x));
  }
  syncSelected.value = next.slice(0, 200);
  syncPicked.value = syncSelected.value.slice();
}

function removeSyncSelected(s) {
  syncSelected.value = syncSelected.value.filter((x) => x !== s);
  syncPicked.value = syncSelected.value.slice();
}
function clearSyncSelected() {
  syncSelected.value = [];
  syncPicked.value = [];
}

function onSyncWorkspaceChange() { clearSyncSelected(); }
function onSyncTypeChange() { clearSyncSelected(); }
function onSyncRefresh() { ElMessage.success('原型：已刷新候选列表'); }

function openSyncDialog() {
  syncForm.value = { workspace: '旧版', goodsType: '商品-通用版', scope: '近1000条', account: '', orgAccount: '' };
  clearSyncSelected();
  syncDialogVisible.value = true;
}

function onSyncSubmit() {
  if (isLegacyGeneral.value && !syncForm.value.account) { ElMessage.warning('请选择所属账户'); return; }
  if (isNewGeneral.value && !syncForm.value.orgAccount) { ElMessage.warning('请选择组织账户'); return; }
  if (!syncSelected.value.length) { ElMessage.warning('请选择至少一项'); return; }
  syncDialogVisible.value = false;
  ElMessage.success('原型：已提交同步商品');
}

/* ------------------------------ 共享巨量商品库 ------------------------------ */

/** 工作台管理账户下拉（线上为账户列表，此处用本地账户选项） */
const SHARE_ACCOUNT_OPTIONS = ASSET_ACCOUNT_OPTIONS.map((label) => {
  const m = label.match(/\((\d+)\)/);
  return { label, value: m ? m[1] : label };
});

/** 账户主体（线上「不限」下拉） */
const SHARE_ENTITY_OPTIONS = [
  '北京高途云集教育科技有限公司',
  '北京百度网讯科技有限公司',
  '北京智者天下科技有限公司',
  '上海得物信息集团有限公司',
];

/** 候选媒体账户（线上：账户名(广告主ID)，与左栏「媒体账户」列表一致，直接取 ASSET_ACCOUNT_OPTIONS） */
const SHARE_CANDIDATES = ASSET_ACCOUNT_OPTIONS.map((label) => {
  const m = label.match(/^(.*)\((\d+)\)$/);
  return { label, name: m ? m[1] : label, id: m ? m[2] : label };
});

const shareDialogVisible = ref(false);
const shareForm = ref({ workspaceAccount: '', entity: '' });
const shareCandidateKeyword = ref('');
const shareCandidatePage = ref(1);
const sharePicked = ref([]);
const shareSelected = ref([]);

const shareCandidateMap = SHARE_CANDIDATES.reduce((m, c) => {
  m[c.id] = c.label;
  return m;
}, {});

const shareCandidatesTotal = computed(() => SHARE_CANDIDATES.length);

const shownShareCandidates = computed(() => {
  const kw = shareCandidateKeyword.value.trim();
  const list = SHARE_CANDIDATES.filter((c) => !kw || c.label.includes(kw));
  const start = (shareCandidatePage.value - 1) * 20;
  return list.slice(start, start + 20);
});

/** 当前页全选 / 半选状态 */
const allChecked = computed(() => shownShareCandidates.value.length > 0
  && shownShareCandidates.value.every((c) => shareSelected.value.includes(c.id)));
const isIndeterminate = computed(() => {
  const sel = shownShareCandidates.value.filter((c) => shareSelected.value.includes(c.id)).length;
  return sel > 0 && sel < shownShareCandidates.value.length;
});

/** 打开共享弹窗（由批量操作「共享」触发） */
function openShareDialog() {
  shareForm.value = { workspaceAccount: '', entity: '' };
  shareCandidateKeyword.value = '';
  shareCandidatePage.value = 1;
  sharePicked.value = [];
  shareSelected.value = [];
  shareDialogVisible.value = true;
}

/** 左侧勾选变化 → 同步到右侧已选（上限 200；取消勾选即从已选移除） */
watch(sharePicked, (val) => {
  const next = val.filter((id) => SHARE_CANDIDATES.some((c) => c.id === id));
  shareSelected.value = next.slice(0, 200);
});

/** 当前页全选 / 取消全选 */
function toggleCheckAll(checked) {
  const pageIds = shownShareCandidates.value.map((c) => c.id);
  let next = [...shareSelected.value];
  if (checked) {
    pageIds.forEach((id) => { if (!next.includes(id)) next.push(id); });
  } else {
    next = next.filter((id) => !pageIds.includes(id));
  }
  shareSelected.value = next.slice(0, 200);
  sharePicked.value = shareSelected.value.slice();
}

function removeShareSelected(id) {
  shareSelected.value = shareSelected.value.filter((s) => s !== id);
  sharePicked.value = shareSelected.value.slice();
}

function clearShareSelected() {
  shareSelected.value = [];
  sharePicked.value = [];
}

/** 搜索候选账户（点放大镜 / 清空后回到第一页） */
function onShareSearch() {
  shareCandidatePage.value = 1;
}

/** 左栏「刷新」：重新拉取媒体账户 */
function onShareRefresh() {
  ElMessage.success('原型：已刷新媒体账户列表');
}

function onShareSubmit() {
  if (!shareSelected.value.length) { ElMessage.warning('请选择要授权的账户'); return; }
  shareDialogVisible.value = false;
  ElMessage.success(`已共享至 ${shareSelected.value.length} 个账户`);
}

const LIB_NAMES = [
  'IAP-JNX-0415-2.9', '付费热门漫剧-女频', '付费热门漫剧-男频', '免费漫剧-男频', '免费漫剧-女频',
  '付费-男剧', '付费-女剧', '小说库', 'WS-IAA', 'NSZ 付费5分短剧库',
  '付费商品库9.9面板', 'fjf-iap漫剧', '免费短剧-fjf', 'iaa-yg', '免费短剧',
  'iaa', 'IAA-QLK-4月', 'IAP漫剧API', 'NSZ免费商品库IAA-4月', '4月-WBL-IAA漫剧',
  '5月-WBL-IAP漫剧', '5月-付费短剧库', '5月-免费短剧库', '短剧库-通用', '短剧库-男频',
  '短剧库-女频', '抖音精选短剧', '西瓜短剧库', '番茄短剧库', '快手短剧库',
  '短剧小说库', '短剧通用库', 'IAP短剧库-4月', 'IAA短剧库-4月', 'nsz-iap短剧库',
  'NSZ-IAA短剧库', '商品库-通用', '小说付费库', '小说免费库', '短剧-经典',
  '短剧-热门', '短剧-新剧', '短剧-甜宠', '短剧-都市', '短剧-逆袭',
  '短剧-重生', '短剧-穿越', '短剧-复仇', '短剧-战神', '短剧-赘婿',
  '短剧-神医', '短剧-玄幻',
];

/** 商品库类型取值（线上按商品库名称推断：IAP→IAP短剧库 / 免费·IAA→IAA短剧库 / 小说库→电商） */
function typeOfLib(name) {
  const n = String(name || '').toUpperCase();
  if (n.indexOf('IAP') > -1) return 'IAP短剧库';
  if (n.indexOf('IAA') > -1 || n.indexOf('免费') > -1) return 'IAA短剧库';
  if (n.indexOf('小说') > -1) return '电商';
  if (n.indexOf('付费') > -1) return 'IAP短剧库';
  return '通用';
}

/** 商品名称池（商品-通用版） */
const GOODS_NAMES = [
  '泪的痕迹', '恶毒女配偏要跻身上流', '爱我', '风揭纸背，情字尽成灰', '千岁诱宠：乱世红颜',
  '重生之将门毒妃', '萌宝助攻：家有萌娃太软萌', '长安第一美人', '与君歌', '穿成男主后，我逆袭了',
  '离婚后前夫跪求复婚', '假千金下乡种田了', '闪婚后，豪门老公马甲藏不住了', '替嫁糙汉：娘子是大佬', '我靠种田暴富了',
  '惊！豪门千金竟是玄学大佬', '权臣的心尖宠：海棠', '王妃她只想和离', '七零年代：糙汉宠妻有一套', '神医嫡女：空间药园种田忙',
  '大佬的小娇妻马甲藏不住', '穿书后我成了反派他妈', '女配在线等反转剧本', '摄政王的病弱小美人', '甜宠：傅总的隐婚小娇妻',
];

/** 商品类目池（商品-升级版） */
const CATEGORY_POOL = ['短剧-女频', '短剧-男频', '小说-女频', '小说-男频', '短剧-通用'];

/** 确定性伪随机（xorshift32，保证每次刷新 mock 数据一致且分布均匀） */
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** 生成 19 位商品 / 商品库 ID */
function makeId(base, i) {
  return String(base + i * 7919 + Math.floor(i / 7));
}

/** 生成倒序时间字符串 */
function makeTime(baseTs, offsetMin) {
  const d = new Date(baseTs - offsetMin * 60000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const NOW = new Date(2026, 10, 18, 9, 30, 0).getTime();

/** 商品库-通用版：51 个商品库（旧版工作台）+ 12 个（新版工作台） */
function buildLibRows(workspace, count) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const name = LIB_NAMES[i % LIB_NAMES.length];
    rows.push({
      id: `${workspace}-${i}`,
      name,
      libId: makeId(8788477390915374, i),
      type: typeOfLib(name),
      workspace,
    });
  }
  return rows;
}

/** 商品-通用版：商品列表 */
function buildGoodsRows(workspace, count, seed) {
  const rnd = seeded(seed);
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const base = GOODS_NAMES[i % GOODS_NAMES.length];
    const name = i < GOODS_NAMES.length ? base : `${base}-第${Math.floor(i / GOODS_NAMES.length) + 1}季`;
    const libIdx = Math.floor(rnd() * LIB_NAMES.length);
    rows.push({
      id: `${workspace}-${i}`,
      name,
      libId: makeId(1794374983024159801, i),
      libName: LIB_NAMES[libIdx],
      libCode: makeId(7346985216526130, libIdx),
      type: typeOfLib(LIB_NAMES[libIdx]),
      created: makeTime(NOW, i * 2 + 10),
      updated: makeTime(NOW, i * 2 + 5),
      workspace,
    });
  }
  return rows;
}

/** 商品-升级版：商品列表 */
function buildUpRows(workspace, count, seed) {
  const rnd = seeded(seed);
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const base = GOODS_NAMES[(i * 3) % GOODS_NAMES.length];
    rows.push({
      id: `${workspace}-${i}`,
      name: base,
      libId: makeId(1794881407444232016, i),
      title: `${base}｜${i + 1}-${i + 12}集全 ${i + 60} 集`,
      category: CATEGORY_POOL[Math.floor(rnd() * CATEGORY_POOL.length)],
      created: makeTime(NOW, i * 9 + 30),
      updated: makeTime(NOW, i * 9 + 20),
      workspace,
    });
  }
  return rows;
}

const DATA = {
  lib: [...buildLibRows('旧版', 51), ...buildLibRows('新版', 12)],
  goods: [...buildGoodsRows('旧版', 1070, 303), ...buildGoodsRows('新版', 120, 404)],
  up: [...buildUpRows('旧版', 18, 505), ...buildUpRows('新版', 6, 606)],
};

/* ------------------------------ 页签配置 ------------------------------ */

const TAB_CONFIG = {
  lib: {
    filters: ['workspace', 'libType'],
    selection: true,
    create: true,
    batch: true,
    columns: [
      { label: '商品库', prop: 'name', sub: 'libId', width: 498, type: 'desc' },
      { label: '商品库类型', prop: 'type', width: 497, type: 'text' },
    ],
  },
  goods: {
    filters: ['workspace', 'libName'],
    selection: false,
    create: true,
    batch: false,
    columns: [
      { label: '商品', prop: 'name', sub: 'libId', width: 253, type: 'desc' },
      { label: '商品库', prop: 'libName', sub: 'libCode', width: 251, type: 'desc' },
      { label: '商品库类型', prop: 'type', width: 251, type: 'text' },
      { label: '创建时间', prop: 'created', width: 150, type: 'text' },
      { label: '更新时间', prop: 'updated', width: 150, type: 'text' },
    ],
  },
  up: {
    filters: ['workspace'],
    selection: true,
    create: false,
    batch: true,
    columns: [
      { label: '商品', prop: 'name', sub: 'libId', width: 233, type: 'desc' },
      { label: '商品标题', prop: 'title', width: 231, type: 'text' },
      { label: '商品类目', prop: 'category', width: 231, type: 'text' },
      { label: '创建时间', prop: 'created', width: 150, type: 'text' },
      { label: '更新时间', prop: 'updated', width: 150, type: 'text' },
    ],
  },
};

/* ------------------------------ 状态 ------------------------------ */

const tabKey = ref('lib');
const cfg = computed(() => TAB_CONFIG[tabKey.value]);

const query = ref({ workspace: '旧版', libType: '', libName: '' });
const searchField = ref('name');
const searchKeyword = ref('');
const batchText = ref('');

const selectedRows = ref([]);
const pageNo = ref(1);
const pageSize = ref(20);

const syncing = ref(false);
const drawerVisible = ref(false);

/** 商品库下拉：每次 20 条，末尾「搜索更多(N)…」 */
const libPage = ref(1);
const LIB_PAGE_SIZE = 20;
const libMaxPage = computed(() => Math.ceil(LIB_NAMES.length / LIB_PAGE_SIZE));
const shownLibNames = computed(() => LIB_NAMES.slice(0, libPage.value * LIB_PAGE_SIZE));

/** 抽屉表单 */
const form = ref(emptyForm());

function emptyForm() {
  return {
    taskSource: '近30天任务',
    historyTask: '',
    workbench: '旧版工作台',
    libType: '免费短剧库',
    libName: '',
    carriers: ['字节小程序'],
    linkSource: '同步本地',
    linkUrl: '',
    copyrightOwner: '',
    monetize: '',
    strategyName: '',
    category: '',
  };
}

/* ------------------------------ 弹窗状态 ------------------------------ */

const libPickerVisible = ref(false);
const libPickerKeyword = ref('');
const libPickTarget = ref(null);

const linkPickerVisible = ref(false);
const linkPickerKeyword = ref('');
const linkPickTarget = ref(null);

const imagePickerVisible = ref(false);
const pickedImages = ref([]);

const copyVisible = ref(false);
const copyTargets = ref([]);

const LINK_OPTIONS = [
  { name: '字节小程序-短剧女频', url: 'wx://shortplay/female' },
  { name: '字节小程序-短剧男频', url: 'wx://shortplay/male' },
  { name: '字节小程序-小说库', url: 'wx://novel/library' },
  { name: '微信小程序-短剧通用', url: 'weixin://shortplay/common' },
];

/* ------------------------------ 计算 ------------------------------ */

const currentSearchLabel = computed(
  () => (SEARCH_FIELDS.find((f) => f.value === searchField.value) || SEARCH_FIELDS[0]).label,
);

/** 当前页签 + 筛选 + 关键词过滤后的数据 */
const filteredRows = computed(() => {
  const q = query.value;
  let rows = DATA[tabKey.value] || [];
  if (q.workspace) rows = rows.filter((r) => r.workspace === q.workspace);
  if (q.libType) rows = rows.filter((r) => r.type === q.libType);
  if (q.libName) rows = rows.filter((r) => r.libName === q.libName);

  const kw = (searchKeyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      const hay = searchField.value === 'id' ? String(r.libId) : String(r.name);
      return keys.some((k) => hay.indexOf(k) > -1);
    });
  }
  return rows;
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

/** 抽屉：投放载体 → 链接按钮文案 */
const carrierLinkText = computed(() => {
  const c = form.value.carriers[0] || '字节小程序';
  return `请选择${c}链接`;
});

const filteredPickerLibs = computed(() => {
  const kw = (libPickerKeyword.value || '').trim();
  // 联动：指定商品库的候选跟着「工作台来源」走（旧版工作台 / 新版工作台）
  const ws = form.value.workbench === '新版工作台' ? '新版' : '旧版';
  const list = DATA.lib.filter((r) => r.workspace === ws);
  return kw ? list.filter((r) => r.name.indexOf(kw) > -1) : list;
});

const filteredPickerLinks = computed(() => {
  const kw = (linkPickerKeyword.value || '').trim();
  return kw ? LINK_OPTIONS.filter((o) => o.name.indexOf(kw) > -1) : LINK_OPTIONS;
});

const copyTargetOptions = computed(() => DATA.lib.slice(0, 12).map((r) => r.name));

/* ------------------------------ 方法 ------------------------------ */

/** 切换二级页签：筛选 / 列 / 数据都变 */
function onTabChange(key) {
  if (key === tabKey.value) return;
  tabKey.value = key;
  query.value = { workspace: '旧版', libType: '', libName: '' };
  searchKeyword.value = '';
  batchText.value = '';
  selectedRows.value = [];
  pageNo.value = 1;
}

function onFilterChange() {
  pageNo.value = 1;
}

function onSearch() {
  pageNo.value = 1;
}

function loadMoreLibs() {
  libPage.value += 1;
}

function clearBatch() {
  batchText.value = '';
}

function applyBatchSearch() {
  searchKeyword.value = batchText.value;
  pageNo.value = 1;
}

/** 清空筛选条件 */
function clearFilters() {
  query.value = { workspace: '旧版', libType: '', libName: '' };
  searchKeyword.value = '';
  batchText.value = '';
  pageNo.value = 1;
  ElMessage.info('已清空筛选条件');
}

function onSelectionChange(rows) {
  selectedRows.value = rows;
}

/** 同步资产 */
async function onSync() {
  if (syncing.value) return;
  syncing.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 900));
    ElMessage.success('同步成功');
  } finally {
    syncing.value = false;
  }
}

/** 批量操作：推送到智投创意云 / 万镜台 / 共享 */
function onBatchCommand(command) {
  const n = selectedRows.value.length;
  if (!n) {
    ElMessage.warning('请先选择数据');
    return;
  }
  if (command === 'share') {
    openShareDialog();
    return;
  }
  const target = BATCH_ITEMS.find((o) => o.command === command);
  ElMessage.success(`已将 ${n} 条商品推送到${target ? target.title : '批量平台'}`);
  selectedRows.value = [];
}

/* ------------------------------ 抽屉 ------------------------------ */

function openDrawer() {
  form.value = emptyForm();
  drawerVisible.value = true;
}

function closeDrawer() {
  drawerVisible.value = false;
}

/** 复用历史任务 */
function onReuseTask() {
  if (!form.value.historyTask) {
    ElMessage.warning('请先选择历史任务');
    return;
  }
  ElMessage.success('已回显所选历史任务的配置');
}

/** 选择商品库 */
function confirmLibPick() {
  if (!libPickTarget.value) {
    ElMessage.warning('请选择商品库');
    return;
  }
  form.value.libName = libPickTarget.value.name;
  libPickerVisible.value = false;
  ElMessage.success('已选择商品库');
}

/** 选择投放载体链接 */
function confirmLinkPick() {
  if (!linkPickTarget.value) {
    ElMessage.warning('请选择链接');
    return;
  }
  form.value.linkUrl = linkPickTarget.value.name;
  linkPickerVisible.value = false;
  ElMessage.success('已选择链接');
}

/** 批量选择商品图片 */
function confirmImagePick() {
  imagePickerVisible.value = false;
  ElMessage.success(`已选择 ${pickedImages.value.length} 张商品图片`);
}

/** 复制到其他商品 */
function confirmCopy() {
  copyVisible.value = false;
  ElMessage.success(`已复制到 ${copyTargets.value.length} 个商品`);
}

/** 刷新类目 */
function onRefreshCategory() {
  ElMessage.success('类目已刷新');
}

/** 存为策略 */
function onSaveStrategy() {
  if (!form.value.strategyName.trim()) {
    ElMessage.warning('请填写策略名称');
    return;
  }
  ElMessage.success('已存为策略');
}

/** 抽屉提交（必填校验：商品库类型 / 指定商品库 / 投放载体 / 版权方主体名称 / 变现内容） */
function submitDrawer() {
  if (!form.value.libType) {
    ElMessage.warning('请选择商品库类型');
    return;
  }
  if (!form.value.libName) {
    ElMessage.warning('请选择指定商品库');
    return;
  }
  if (!form.value.carriers.length) {
    ElMessage.warning('请选择投放载体');
    return;
  }
  if (!form.value.copyrightOwner.trim()) {
    ElMessage.warning('请填写版权方主体名称');
    return;
  }
  if (!form.value.monetize) {
    ElMessage.warning('请选择变现内容');
    return;
  }
  drawerVisible.value = false;
  ElMessage.success('商品创建任务已提交');
}

watch(pageSize, () => { pageNo.value = 1; });
</script>

<style scoped>
/* ---------- 页面骨架 ---------- */
.pd-page { padding: 16px; min-height: 100%; box-sizing: border-box; background: #fff; }

/* ---------- 查询条件 ---------- */
/* 线上：工作台 124px / 商品库类型 180px / 商品库 204px */
.pd-fs-workspace { width: 124px; }
.pd-fs-libtype { width: 180px; }
.pd-fs-libname { width: 204px; }

/* 关键词搜索（线上：字段类型 100px + 关键词 200px + ⊞ + 🔍，整体 360px） */
.pd-search-cell { display: flex; align-items: center; height: 28px; margin: 0 8px 8px 0; }
.pd-search-cell .cl-search { width: 360px; }
.pd-search-cell .search-field { width: 100px; flex: none; }
.pd-search-cell .search-input { width: 228px; }
.pd-search-input :deep(.el-input__inner) { padding-right: 30px; }
.pd-more-icon { cursor: pointer; color: #c0c4cc; font-size: 15px; }
.pd-more-icon:hover { color: #909399; }
.pd-search-btn { width: 32px; height: 28px; padding: 0; border-radius: 0 3px 3px 0; border-left: 0; }
.pd-search-btn :deep(.el-icon) { margin: 0; }

.pd-more-item { font-size: 12px; cursor: pointer; color: #606266; }
.pd-more-item:hover { color: #197afb; }

.pd-batch__hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.pd-batch__title { font-size: 13px; color: #333; }
.pd-batch__tip { font-size: 12px; color: #909399; margin-bottom: 8px; }

/* ---------- 工具栏 ---------- */
.pd-batch-btn { min-width: 96px; }
.pd-batch-card { display: flex; align-items: center; gap: 10px; padding: 4px 2px; }
.pd-batch-card__icon {
  width: 32px; height: 32px; flex: none; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; color: #fff; background: #197afb;
}
.pd-batch-card__icon.is-4 { background: #ff7a45; }
.pd-batch-card__title { font-size: 13px; color: #333; line-height: 18px; }
.pd-batch-card__subtitle { font-size: 12px; color: #909399; line-height: 16px; }

/* ---------- 表格 ---------- */
.pd-table { font-size: 12px; width: 100%; }
.pd-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.pd-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.pd-table :deep(.desc-cell__title) { color: #333; font-size: 13px; line-height: 20px; }
.pd-table :deep(.desc-cell__desc) { color: #909399; font-size: 12px; line-height: 18px; }

/* ---------- 抽屉 ---------- */
.pd-drawer-close {
  position: absolute; left: -36px; top: 0; z-index: 2;
  width: 36px; height: 36px; padding: 0;
  background: #197afb; color: #fff; border: 0; border-radius: 4px 0 0 4px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.pd-drawer-close:hover { background: #4b95ff; }
.pd-drawer-close :deep(.el-icon) { font-size: 18px; }

.pd-tips { width: 100%; font-size: 12px; color: #909399; line-height: 18px; margin-top: 2px; }
.pd-picked { font-size: 12px; color: #333; }

/* ---------- 单选 / 多选按钮 ----------
   线上选中态为浅蓝底 #d6eaff + 蓝字蓝边 #197afb。
   Element Plus 2.14 用主题变量控制选中态（assetPage.css 里的 .is-active 规则特异性低于 EP，已失效），
   故在本组件内覆盖主题变量（assetPage.css 只读，不做修改）。 */
.pd-carrier :deep(.el-checkbox-button) {
  --el-checkbox-button-checked-bg-color: #d6eaff;
  --el-checkbox-button-checked-text-color: #197afb;
  --el-checkbox-button-checked-border-color: #197afb;
}

/* 投放载体：el-checkbox-button（右上角三角标记 + 选中浅蓝底） */
.pd-carrier :deep(.el-checkbox-button__inner) { position: relative; padding: 9px 12px; font-size: 12px; }
.pd-carrier :deep(.el-checkbox-button__inner)::after {
  content: ''; position: absolute; right: 0; top: 0;
  width: 0; height: 0; border-top: 6px solid #dcdfe6; border-left: 6px solid transparent;
}
.pd-carrier :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) {
  background: #d6eaff; border-color: #197afb; color: #197afb; box-shadow: -1px 0 0 0 #197afb;
}
.pd-carrier :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner)::after { border-top-color: #197afb; }

/* ---------- 多商品配置 ---------- */
.pd-multi-config { padding-bottom: 16px; }
.pd-multi-config__toolbar { padding: 16px 16px 8px; }
.pd-multi-config__header, .pd-multi-config__content {
  display: flex; margin: 0 16px; border: 1px solid #e8eaec; border-bottom: 0;
}
.pd-multi-config__content { border-bottom: 1px solid #e8eaec; }
.pd-mc-title, .pd-mc-cell {
  flex: 1; min-width: 0; padding: 10px 12px;
  font-size: 12px; color: #606266; border-right: 1px solid #e8eaec;
  box-sizing: border-box;
}
.pd-mc-title { background: #fafafa; color: #909399; }
.pd-mc-title--fixed, .pd-mc-cell--fixed { flex: none; width: 150px; }
.pd-mc-title--w260, .pd-mc-cell--w260 { flex: none; width: 260px; }
.pd-mc-title--w120, .pd-mc-cell--w120 { flex: none; width: 120px; }
.pd-mc-title--w260 { display: flex; align-items: center; justify-content: space-between; }
.pd-mc-cell { background: #fff; min-height: 64px; }
.pd-mc-cell--w260 :deep(.ag-select) { width: 100%; }
.pd-mc-noimage {
  height: 64px; border: 1px dashed #dcdfe6; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #909399; cursor: pointer;
}
.pd-mc-noimage:hover { border-color: #197afb; color: #197afb; }
.pd-mc-empty { flex: 1; padding: 20px 12px; text-align: center; font-size: 12px; color: #909399; }
.pd-multi-config__tip {
  margin: 8px 16px 16px; padding: 8px 12px; font-size: 12px; color: #409eff;
  background: #ecf5ff; border-radius: 3px; display: flex; align-items: center; gap: 6px;
}

/* ---------- 抽屉底部 ---------- */
.pd-footer { display: flex; align-items: center; justify-content: space-between; }
.pd-footer__left { display: flex; align-items: center; }
.pd-strategy-wrap { margin-right: 16px; }

/* ---------- 弹窗 ---------- */
.pd-picker-table { font-size: 12px; width: 100%; }
.pd-picker-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; }
.pd-picker-table :deep(.el-table__cell) { font-size: 12px; color: #606266; }
.pd-image-group { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.pd-image-item { font-size: 13px; color: #606266; height: 28px; }

/* ---------- 共享巨量商品库 弹窗（线上宽弹窗：控件定宽 380px、两栏等高 360px、按钮靠右） ---------- */
.pd-share-dialog .pd-dialog-select { width: 380px; }
.pd-share-footer { justify-content: flex-end; }
.pd-share-transfer { display: flex; gap: 16px; width: 100%; }
.pd-share-col {
  flex: 1; min-width: 0; border: 1px solid #e8eaec; border-radius: 3px;
  display: flex; flex-direction: column; height: 360px; overflow: hidden;
}
.pd-share-transfer > .pd-share-col:first-child { flex: 1.15; }
.pd-share-col__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #fafafa; border-bottom: 1px solid #e8eaec;
}
.pd-share-col__title { font-size: 13px; color: #333; font-weight: 500; }
.pd-share-refresh, .pd-share-clear { font-size: 12px; color: #197afb; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.pd-share-refresh:hover, .pd-share-clear:hover { text-decoration: underline; }
.pd-share-refresh .el-icon { font-size: 12px; }
.pd-share-search { margin: 10px 14px 0; }
.pd-share-search :deep(.el-input__wrapper) { border-radius: 3px; }
.pd-share-search-btn { width: 32px; padding: 0; border-left: 0; }
.pd-share-checkall { padding: 6px 14px 2px; }
.pd-share-checkall :deep(.el-checkbox__label) { font-size: 12px; color: #333; }
.pd-share-list { flex: 1; overflow-y: auto; padding: 4px 0; }
.pd-share-item {
  display: flex; align-items: center; width: 100%; height: 36px; padding: 0 14px;
  box-sizing: border-box; margin: 0;
}
.pd-share-item__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #333; }
.pd-share-empty {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; font-size: 12px; color: #c0c4cc;
}
.pd-share-empty__icon { opacity: 0.7; width: 64px; height: 64px; }
.pd-share-pager { padding: 8px 12px; border-top: 1px solid #e8eaec; display: flex; justify-content: flex-end; }
.pd-share-selected { padding: 4px 12px; }
.pd-share-selected__item {
  display: flex; align-items: center; justify-content: space-between;
  height: 34px; font-size: 12px; color: #333; border-bottom: 1px solid #f0f2f5;
}
.pd-share-selected__del { color: #c0c4cc; cursor: pointer; }
.pd-share-selected__del:hover { color: #f53f3f; }

/* ---------- 同步商品弹窗：同步范围卡片二选一 ---------- */
.pd-scope-cards { display: flex; gap: 12px; width: 380px; }
.pd-scope-card {
  flex: 1; border: 1px solid #e8eaec; border-radius: 4px; padding: 12px 14px;
  cursor: pointer; background: #fff; transition: all .15s;
}
.pd-scope-card:hover { border-color: #197afb; }
.pd-scope-card.active { border-color: #197afb; background: #ecf5ff; }
.pd-scope-card__head { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 4px; }
.pd-scope-card__tag {
  margin-left: 6px; font-size: 12px; color: #197afb; background: #d6eaff;
  border-radius: 2px; padding: 0 4px; line-height: 16px;
}
.pd-scope-card__muted { margin-left: 6px; font-size: 12px; color: #909399; }
.pd-scope-card__desc { font-size: 12px; color: #909399; line-height: 18px; }

/* 同步弹窗穿梭框列：与共享弹窗等高 */
.pd-sync-col { height: 320px; }
</style>

<!--
  抽屉通过 teleport 渲染到 body，Element Plus 内部节点不携带本组件的 scoped 属性，
  scoped 选择器无法命中；此处用本页独有的 .pd-drawer 前缀做全局覆盖。
-->
<style>
.pd-drawer .el-drawer__body { padding: 0; background: #f0f2f5; overflow: hidden; }
/* 关闭按钮定位在抽屉左缘之外：其包含块为 .el-drawer，故不会被 .el-drawer__body 的 overflow 裁剪 */

/* 线上选中态：浅蓝底 #d6eaff + 蓝字蓝边 #197afb（EP 2.14 主题变量优先级高于 assetPage.css） */
.pd-drawer .el-radio-button {
  --el-radio-button-checked-bg-color: #d6eaff;
  --el-radio-button-checked-text-color: #197afb;
  --el-radio-button-checked-border-color: #197afb;
}
.pd-drawer .el-checkbox-button {
  --el-checkbox-button-checked-bg-color: #d6eaff;
  --el-checkbox-button-checked-text-color: #197afb;
  --el-checkbox-button-checked-border-color: #197afb;
}
.pd-drawer .el-radio-button.is-active .el-radio-button__original-radio:not(:disabled) + .el-radio-button__inner {
  background: #d6eaff; border-color: #197afb; color: #197afb; box-shadow: -1px 0 0 0 #197afb;
}

/* 共享弹窗：标题下通栏分隔线（线上） */
.pd-share-dialog .el-dialog__header { border-bottom: 1px solid #e8eaec; padding-bottom: 14px; margin-right: 0; }
.pd-share-dialog .el-dialog__body { padding-top: 20px; }
</style>
