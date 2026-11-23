<template>
  <div class="ori-page">
    <!-- 二级页签（线上「创量定向包 / 巨量定向包」） -->
    <div class="asset-sub-tabs">
      <div
        class="asset-sub-tab"
        :class="{ active: tab === 'cl' }"
        @click="switchTab('cl')"
      >创量定向包</div>
      <div
        class="asset-sub-tab"
        :class="{ active: tab === 'jy' }"
        @click="switchTab('jy')"
      >巨量定向包</div>
    </div>

    <!-- ================= 创量定向包 ================= -->
    <template v-if="tab === 'cl'">
      <!-- ① 查询条件（线上 form.filter-search-input） -->
      <div class="filter-row">
        <div class="filter-left">
          <!-- 智投项目 -->
          <div class="filter-cell">
            <label class="filter-label">智投项目：</label>
            <el-select
              v-model="query.project"
              class="filter-select"
              size="small"
              placeholder="全部"
              @change="onFilterChange"
            >
              <el-option v-for="o in PROJECTS" :key="o" :label="o" :value="o" />
            </el-select>
            <el-icon class="ori-icon-close" title="清空" @click="clearFilter('project')"><Close /></el-icon>
          </div>

          <!-- 企业名称 -->
          <div class="filter-cell">
            <label class="filter-label">企业名称：</label>
            <el-select
              v-model="query.company"
              class="filter-select"
              size="small"
              filterable
              placeholder="全部"
              @change="onFilterChange"
            >
              <el-option v-for="o in COMPANIES" :key="o" :label="o" :value="o" />
            </el-select>
            <el-icon class="ori-icon-close" title="清空" @click="clearFilter('company')"><Close /></el-icon>
          </div>

          <!-- 创建人员（多选） -->
          <div class="filter-cell">
            <label class="filter-label">创建人员：</label>
            <el-select
              v-model="query.creators"
              class="filter-select"
              size="small"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              placeholder="全部"
              @change="onFilterChange"
            >
              <el-option v-for="o in CREATORS" :key="o.label" :label="o.label" :value="o.label" />
            </el-select>
            <el-icon class="ori-icon-close" title="清空" @click="clearFilter('creators')"><Close /></el-icon>
          </div>

          <!-- 产品 -->
          <div class="filter-cell">
            <label class="filter-label">产品：</label>
            <el-select
              v-model="query.product"
              class="filter-select"
              size="small"
              placeholder="全部"
              @change="onFilterChange"
            >
              <el-option v-for="o in PRODUCTS" :key="o" :label="o" :value="o" />
            </el-select>
            <el-icon class="ori-icon-close" title="清空" @click="clearFilter('product')"><Close /></el-icon>
          </div>

          <!-- 关键词搜索（字段类型下拉 + 关键词输入 + 🔍 + 批量搜索气泡） -->
          <div class="ori-search-wrap">
            <el-input
              v-model="searchKeyword"
              class="cl-search-input"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="onSearch"
            >
              <template #prepend>
                <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
                  <el-option label="名称" value="name" />
                  <el-option label="ID" value="id" />
                </el-select>
              </template>
              <template #suffix>
                <el-popover
                  placement="bottom-end"
                  :width="640"
                  trigger="click"
                  popper-class="ori-batch-popper"
                >
                  <template #reference>
                    <span class="ori-batch-icon" title="批量搜索">
                      <svg
                        viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        width="1em" height="1em"
                      >
                        <path
                          d="M881.4 250.9H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h739.9c23.9 0 43.5 19.6 43.5 43.5S905.3 250.9 881.4 250.9zM272.1 454H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5S296 454 272.1 454zM272.1 657.1H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5S296 657.1 272.1 657.1zM853.8 847.5L715.3 709c-16.9-16.9-16.9-44.6 0-61.5s44.6-16.9 61.5 0L915.3 786c16.9 16.9 16.9 44.6 0 61.5s-44.6 16.9-61.5 0zM467.9 860.2H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h326.4c23.9 0 43.5 19.6 43.5 43.5S491.8 860.2 467.9 860.2z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </template>
                  <div class="ori-batch">
                    <div class="ori-batch__head">
                      <span class="ori-batch__title">请输入{{ searchFieldLabel }}（{{ batchText.length }}/1000）</span>
                      <el-button link type="primary" size="small" @click="batchText = ''">清空</el-button>
                    </div>
                    <div class="ori-batch__tips">
                      每一行为一个关键词，批量搜索将执行
                      <el-popover placement="right" :width="400" trigger="hover">
                        <template #reference>
                          <a class="ori-batch__link">精确匹配</a>
                        </template>
                        <div class="ori-batch__pop-title">精准匹配</div>
                        指被搜索的内容需要与搜索关键词完全一致。如：输入关键字为“爆款素材”时，精准匹配只能搜索到名称为“爆款素材”的内容
                      </el-popover>
                      。
                    </div>
                    <el-input
                      v-model="batchText"
                      type="textarea"
                      :rows="10"
                      resize="none"
                      placeholder="请粘贴或输入名称，回车可换行"
                    />
                    <div class="batch-search-ops">
                      <el-button size="small" plain @click="batchText = ''">清空</el-button>
                      <el-button size="small" type="primary" @click="onBatchSearch">搜索</el-button>
                    </div>
                  </div>
                </el-popover>
              </template>
              <template #append>
                <el-button class="search-more-btn" title="搜索" @click="onSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <a class="filter-clear" @click="onClearFilters">清空</a>
        </div>
      </div>

      <!-- ② 功能按钮条（线上 .table-toolbar） -->
      <div class="table-toolbar">
        <el-button type="primary" size="small" class="tool-btn ori-tool-btn--wide" @click="openCreate">
          <el-icon class="ori-btn-icon"><Plus /></el-icon>新建创量定向包
        </el-button>

        <el-button plain size="small" class="tool-btn" @click="openFetch">
          获取巨量定向
        </el-button>

        <!-- 批量操作：下拉选择式，未勾选行时置灰 -->
        <el-select
          v-model="batchOp"
          class="batch-select"
          size="small"
          clearable
          placeholder="批量操作"
          :disabled="!selectedRows.length"
          @change="onBatchOp"
        >
          <el-option label="共享" value="share" />
          <el-option label="添加巨量项目" value="addProject" />
          <el-option label="复制" value="copy" />
          <el-option label="删除" value="delete" />
        </el-select>

        <span v-if="selectedRows.length" class="ori-count">
          已选<span class="ori-count__num">{{ selectedRows.length }}</span>条
        </span>
      </div>

      <!-- ③ 列表（线上 el-table--border） -->
      <el-table
        ref="tableRef"
        :data="pagedList"
        row-key="id"
        border
        class="asset-table"
        show-overflow-tooltip
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" fixed="left" align="center" />
        <el-table-column prop="name" label="定向包名称" width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="400">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openShare(row)">共享</el-button>
            <el-button link type="primary" size="small" @click="openAddProject(row)">添加巨量项目</el-button>
            <el-button link type="primary" size="small" @click="copyRow(row)">复制</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="package_id" label="定向包ID" width="80" />
        <el-table-column prop="description" label="定向描述" width="200" show-overflow-tooltip />
        <el-table-column prop="package_type" label="定向包类型" width="120" show-overflow-tooltip />
        <el-table-column prop="delivery_range" label="投放范围" width="100" />
        <el-table-column prop="product" label="产品" width="120" show-overflow-tooltip />
        <el-table-column prop="project" label="智投项目" width="120" show-overflow-tooltip />
        <el-table-column prop="company" label="主体" width="210" show-overflow-tooltip />
        <el-table-column prop="creator" label="创建人员" width="100" />
        <el-table-column prop="related_count" label="关联项目数" width="100" />
        <el-table-column prop="create_time" label="创建时间" width="150" />

        <template #empty>
          <div class="ori-empty">暂无数据</div>
        </template>
      </el-table>

      <!-- ④ 分页（线上 .cl-table-pagination-layout） -->
      <div class="pager-card">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </template>

    <!-- ================= 巨量定向包 ================= -->
    <template v-else>
      <div class="filter-row">
        <div class="filter-left">
          <div class="filter-cell">
            <label class="filter-label">媒体账户：</label>
            <el-select
              v-model="jyQuery.account"
              class="filter-select"
              size="small"
              filterable
              placeholder="全部"
              @change="onJyFilterChange"
            >
              <el-option v-for="o in ACCOUNTS" :key="o" :label="o" :value="o" />
            </el-select>
            <el-icon class="ori-icon-close" title="清空" @click="clearJyFilter"><Close /></el-icon>
          </div>

          <div class="ori-search-wrap">
            <el-input
              v-model="jySearchKeyword"
              class="cl-search-input"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="onJySearch"
            >
              <template #prepend>
                <el-select v-model="jySearchField" class="search-field" size="small" placeholder="请选择">
                  <el-option label="名称" value="name" />
                  <el-option label="ID" value="id" />
                </el-select>
              </template>
              <template #append>
                <el-button class="search-more-btn" title="搜索" @click="onJySearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <a class="filter-clear" @click="onJyClearFilters">清空</a>
        </div>
      </div>

      <div class="table-toolbar">
        <el-button type="primary" size="small" class="tool-btn ori-tool-btn--wide" @click="openJyCreate">
          <el-icon class="ori-btn-icon"><Plus /></el-icon>新建媒体定向包
        </el-button>

        <el-button plain size="small" class="tool-btn" @click="onJySync">
          同步巨量定向包
        </el-button>

        <el-select
          v-model="jyBatchOp"
          class="batch-select"
          size="small"
          clearable
          placeholder="批量操作"
          :disabled="!jySelectedRows.length"
          @change="onJyBatchOp"
        >
          <el-option label="共享" value="share" />
          <el-option label="复制" value="copy" />
          <el-option label="删除" value="delete" />
        </el-select>

        <span v-if="jySelectedRows.length" class="ori-count">
          已选<span class="ori-count__num">{{ jySelectedRows.length }}</span>条
        </span>
      </div>

      <el-table
        :data="jyPagedList"
        row-key="id"
        border
        class="asset-table"
        show-overflow-tooltip
        @selection-change="(rows) => (jySelectedRows = rows)"
      >
        <el-table-column type="selection" width="48" fixed="left" align="center" />
        <el-table-column prop="name" label="定向包名称" width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row, true)">编辑</el-button>
            <el-button link type="primary" size="small" @click="copyRow(row, true)">复制</el-button>
            <el-button link type="primary" size="small" @click="removeRow(row, true)">删除</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="package_id" label="定向包ID" width="80" />
        <el-table-column prop="description" label="定向描述" width="200" show-overflow-tooltip />
        <el-table-column prop="package_type" label="定向包类型" width="120" show-overflow-tooltip />
        <el-table-column prop="delivery_range" label="投放范围" width="100" />
        <el-table-column prop="account" label="媒体账户" width="100" show-overflow-tooltip />
        <el-table-column prop="create_time" label="创建时间" width="150" />

        <template #empty>
          <div class="ori-empty">请选择媒体账户</div>
        </template>
      </el-table>

      <div class="pager-card">
        <el-pagination
          v-model:current-page="jyPageNo"
          v-model:page-size="jyPageSize"
          :total="jyTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </template>

    <!-- ⑤ 新增 / 编辑 创量定向包（线上 /audience/editor 新增创量定向包） -->
    <el-drawer
      v-model="formVisible"
      size="1016px"
      direction="rtl"
      :with-header="false"
      class="ori-drawer"
      append-to-body
    >
      <div class="cl-drawer">
        <div class="drawer-header">
          <span class="header-title">{{ formMode === 'create' ? '新增创量定向包' : '编辑创量定向包' }}</span>
        </div>

        <div class="drawer-content">
          <div class="ori-drawer-body">
            <div class="module-container">
              <div class="cl-form-block-title">定向包设置</div>
              <el-form :model="form" label-width="144px" class="cl-drawer-form">
                <el-form-item label="定向包名称" required>
                  <el-input
                    v-model="form.name"
                    class="ag-input"
                    maxlength="40"
                    show-word-limit
                    placeholder="请输入定向包名称，最多40个字符"
                  />
                </el-form-item>

                <el-form-item label="定向包描述" required>
                  <el-input
                    v-model="form.description"
                    class="ag-input"
                    type="textarea"
                    :rows="2"
                    maxlength="100"
                    show-word-limit
                    placeholder="请输入定向包描述，最多100个字符"
                  />
                </el-form-item>

                <el-form-item label="跨主体使用">
                  <el-radio-group v-model="form.cross_company" class="ag-radio">
                    <el-radio-button label="不启用" value="不启用" />
                    <el-radio-button label="启用" value="启用" />
                  </el-radio-group>
                  <el-popover placement="right" :width="320" trigger="hover">
                    <template #reference>
                      <el-icon class="ori-question"><QuestionFilled /></el-icon>
                    </template>
                    开启后，该定向包可用于当前主体下的其他企业（媒体账户）。
                  </el-popover>
                </el-form-item>

                <el-form-item label="智投项目（选填）">
                  <el-select v-model="form.project" class="ag-select" placeholder="不限">
                    <el-option label="不限" value="" />
                    <el-option v-for="o in PROJECTS" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>

                <el-form-item label="企业名称">
                  <el-select v-model="form.company" class="ag-select" filterable placeholder="企业名称">
                    <el-option v-for="o in COMPANIES" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>

                <el-form-item label="广告类型">
                  <el-radio-group v-model="form.ad_type" class="ag-radio">
                    <el-radio-button label="所有广告" value="所有广告" />
                    <el-radio-button label="搜索广告" value="搜索广告" />
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="定向包类型" required>
                  <el-select v-model="form.package_type" class="ag-select" placeholder="请选择">
                    <el-option v-for="o in PACKAGE_TYPES" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>

                <el-form-item label="产品（选填）">
                  <el-select v-model="form.product" class="ag-select" placeholder="请选择产品">
                    <el-option v-for="o in PRODUCTS" :key="o" :label="o" :value="o" />
                  </el-select>
                </el-form-item>

                <el-form-item label="投放范围" required>
                  <el-radio-group v-model="form.delivery_range" class="ag-radio">
                    <el-radio-button label="默认" value="默认" />
                    <el-radio-button label="穿山甲" value="穿山甲" />
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="地域">
                  <el-radio-group v-model="form.region" class="ag-radio">
                    <el-radio-button label="不限" value="不限" />
                    <el-radio-button label="按行政区划" value="按行政区划" />
                    <el-radio-button label="按商圈" value="按商圈" />
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="性别">
                  <el-radio-group v-model="form.gender" class="ag-radio">
                    <el-radio-button label="不限" value="不限" />
                    <el-radio-button label="男" value="男" />
                    <el-radio-button label="女" value="女" />
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="年龄">
                  <el-radio-group v-model="form.age" class="ag-radio">
                    <el-radio-button label="不限" value="不限" />
                    <el-radio-button label="原有分段" value="原有分段" />
                    <el-radio-button label="更多分段" value="更多分段" />
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="自定义人群">
                  <el-radio-group v-model="form.custom_audience" class="ag-radio">
                    <el-radio-button label="不限" value="不限" />
                    <el-radio-button label="同时定向排除" value="同时定向排除" disabled />
                  </el-radio-group>
                  <span class="ori-warn">
                    <el-icon><QuestionFilled /></el-icon>
                    请先选择企业名称
                  </span>
                </el-form-item>

                <el-form-item label="行为兴趣">
                  <el-radio-group v-model="form.behavior_interest" class="ag-radio">
                    <el-radio-button label="不限" value="不限" />
                    <el-radio-button label="系统推荐" value="系统推荐" />
                    <el-radio-button label="自定义" value="自定义" />
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="抖音达人">
                  <el-radio-group v-model="form.talent" class="ag-radio">
                    <el-radio-button label="不限" value="不限" />
                    <el-radio-button label="自定义" value="自定义" />
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>

            <!-- 右侧：预估可覆盖 + 受众信息 -->
            <aside class="ori-side">
              <div class="ori-side__card">
                <div class="ori-side__title">预估可覆盖</div>
                <div class="ori-side__row"><span>巨量广告：</span><b class="ori-side__num">0</b> 日活用户</div>
                <div class="ori-side__row"><span>抖音短视频：</span><b class="ori-side__num">0</b> 日活用户</div>
                <div class="ori-side__row"><span>西瓜视频：</span><b class="ori-side__num">0</b> 日活用户</div>
              </div>
              <div class="ori-side__card">
                <div class="ori-side__title">受众信息</div>
                <div class="ori-side__row"><span>性别: </span>{{ form.gender || '不限' }}</div>
                <div class="ori-side__row"><span>年龄: </span>{{ form.age || '不限' }}</div>
                <div class="ori-side__row"><span>平台: </span>不限</div>
                <div class="ori-side__row"><span>网络: </span>不限</div>
                <div class="ori-side__row"><span>运营商: </span>不限</div>
                <div class="ori-side__row"><span>新用户: </span>不限</div>
                <div class="ori-side__row"><span>手机品牌: </span>不限</div>
                <div class="ori-side__row"><span>手机价格: </span>不限</div>
              </div>
            </aside>
          </div>
        </div>

        <div class="drawer-footer">
          <div class="dialog-footer">
            <div class="operate-button">
              <el-button size="small" plain @click="formVisible = false">取 消</el-button>
              <el-button size="small" type="primary" @click="submitForm">确 定</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ⑥ 获取巨量定向 —— 选择媒体账户（线上 el-dialog） -->
    <el-dialog
      v-model="fetchVisible"
      title="选择媒体账户"
      width="800px"
      :close-on-click-modal="false"
      append-to-body
      class="ori-dialog"
    >
      <div class="ori-fetch__tip">
        <el-icon class="ori-fetch__warn"><WarningFilled /></el-icon>
        <span>不支持获取设备类型。媒体账户未关联产品时，需要您手动为定向包关联产品信息。</span>
      </div>

      <div class="ori-transfer">
        <div class="ori-transfer__panel">
          <div class="ori-transfer__hd">媒体账户</div>
          <div class="ori-transfer__search">
            <el-input
              v-model="fetchAccountKeyword"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="fetchAccountPage = 1"
            >
              <template #suffix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <div class="ori-transfer__list">
            <el-radio-group v-model="fetchAccount" class="ori-transfer__radio">
              <el-radio v-for="a in fetchAccountList" :key="a" :label="a" :value="a" class="ori-transfer__item">
                {{ a }}
              </el-radio>
            </el-radio-group>
            <div v-if="!fetchAccountList.length" class="ori-transfer__none">暂无数据</div>
          </div>
          <div class="ori-transfer__pager">
            <el-pagination
              v-model:current-page="fetchAccountPage"
              :page-size="fetchAccountPageSize"
              :total="fetchAccountTotal"
              layout="prev, pager, next"
              small
            />
          </div>
        </div>

        <div class="ori-transfer__panel">
          <div class="ori-transfer__hd">
            <span>定向包</span>
            <el-checkbox v-model="fetchOnlyAvailable" size="small">过滤不可用定向包</el-checkbox>
          </div>
          <div class="ori-transfer__search">
            <el-input v-model="fetchPackageKeyword" size="small" placeholder="请输入关键词">
              <template #suffix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <div class="ori-transfer__list">
            <div class="ori-transfer__none">暂无数据</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="fetchVisible = false">取 消</el-button>
            <el-button size="small" type="primary" :disabled="!fetchAccount" @click="submitFetch">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑦ 共享定向包 弹窗 -->
    <el-dialog
      v-model="shareVisible"
      title="共享定向包"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="ori-dialog__label">请选择要共享的成员：</div>
      <el-select
        v-model="shareTargets"
        class="ori-dialog__select"
        multiple
        collapse-tags
        collapse-tags-tooltip
        filterable
        placeholder="请选择成员"
      >
        <el-option v-for="c in CREATORS" :key="c.label" :label="c.label" :value="c.label" />
      </el-select>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="shareVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitShare">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑧ 添加巨量项目 弹窗 -->
    <el-dialog
      v-model="projectVisible"
      title="添加巨量项目"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="projectForm" label-width="100px" label-position="left">
        <el-form-item label="巨量项目ID">
          <el-input v-model="projectForm.pid" placeholder="请输入巨量项目ID" />
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="projectForm.pname" placeholder="请输入项目名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="projectVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitAddProject">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Close, QuestionFilled, WarningFilled } from '@element-plus/icons-vue';

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------ *
 * 线上固定选项（来源：创量线上「定向包」页采集规格 + 实页 DOM）
 * ------------------------------------------------------------------ */
const PROJECTS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

const COMPANIES = [
  '百度在线网络技术（北京）有限公司',
  '北京高途云集教育科技有限公司',
  '北京雷盟盛通文化发展有限公司',
  '北京笔墨留香科技有限公司海淀第一分公司',
  '北京百度网讯科技有限公司',
  '北京智者天下科技有限公司北京第二分公司',
  '北京智者天下科技有限公司北京第一分公司',
  '北京智者天下科技有限公司',
  '上海置潮信息科技有限公司',
  '上海得物信息集团有限公司',
  '上海任意门科技有限公司',
  'UG-端原生IAA-漫剧-免费roi-24020',
];

const CREATORS = [
  { label: '北京央广时代文化传播有限公司 (liuziyuan01@ygsdmedia.com)', name: '北京央广时代文化传播有限公司' },
  { label: '张从浩 (zhangconghao@ygsdmedia.com)', name: '张从浩' },
  { label: '王春雷 (wangchunlei@ygsdmedia.com)', name: '王春雷' },
  { label: '郭峻宇 (guojunyu@ygsdmedia.com)', name: '郭峻宇' },
  { label: '孙诗源 (sunshiyuan@ygsdmedia.com)', name: '孙诗源' },
  { label: 'gongwenqing (gongwenqing@ygsdmedia.com)', name: 'gongwenqing' },
  { label: 'lixue (lixue@ygsdmedia.com)', name: 'lixue' },
  { label: 'jiangxin (jiangxin@ygsdmedia.com)', name: 'jiangxin' },
  { label: 'chenpeihua (chenpeihua@ygsdmedia.com)', name: 'chenpeihua' },
  { label: '1304275504 (1304275504@qq.com)', name: '1304275504' },
  { label: '文清滨 (wenqingbin@ygsdmedia.com)', name: '文清滨' },
  { label: '李若涵 (liruohan@ygsdmedia.com)', name: '李若涵' },
  { label: '杨浩蒙 (yanghaomeng@ygsdmedia.com)', name: '杨浩蒙' },
  { label: '刘松涵 (liusonghan01@ygsdmedia.com)', name: '刘松涵' },
  { label: '申旭阳 (shenxuyang@ygsdmedia.com)', name: '申旭阳' },
];

const PRODUCTS = ['测试商品', '测试安卓应用(android)'];

const PACKAGE_TYPES = ['应用推广-Android', '应用推广-IOS', '应用推广-通用', '落地页推广-通用'];

const ACCOUNTS = [
  '北京高途云集教育科技有限公司-1 (18618113458800...)',
  '百度文库-央广时代-拉新-搜索-01 (186687739987066...)',
  '百度文库-央广时代-拉新-搜索-02 (186687739992304...)',
  '百度文库-央广时代-拉新-搜索-03 (186684965176570...)',
  '任意门-央广-代运营-36-安卓-UBA (186648987399640...)',
  '任意门-央广-代运营-22-安卓-UBA (186648985895020...)',
  '任意门-央广-代运营-10-ios-UBA (186648986030202...)',
  '任意门-央广-代运营-23-安卓-UBA (186648985957860...)',
  '任意门-央广-代运营-25-ios-UBA (186648986097610...)',
  '任意门-央广-代运营-30-ios-UBA (186648986477680...)',
  '上海置潮信息科技有限公司-23 (1872677289688)',
  '上海得物信息集团有限公司1-50 (183441963168116...)',
];

/* ------------------------------------------------------------------ *
 * 组件内 mock 列表（线上 total_count = 25）
 * [名称, 描述, 定向包类型, 投放范围, 产品, 智投项目, 主体, 创建人员, 关联项目数, 创建时间]
 * ------------------------------------------------------------------ */
const RAW = [
  ['红果短剧-定向', '通投', '应用推广-Android', '通投智选', '测试安卓应用(android)', '', '北京笔墨留香科技有限公司海淀第一分公司', '申旭阳', 0, '2026-11-18 15:36:41'],
  ['红果定向-ios', '红果定向包', '应用推广-IOS', '通投智选', '测试安卓应用(android)', '', '北京笔墨留香科技有限公司海淀第一分公司', '杨浩蒙', 0, '2026-11-18 15:29:47'],
  ['红果定向-安卓', '红果', '应用推广-Android', '通投智选', '', '', '北京笔墨留香科技有限公司海淀第一分公司', '杨浩蒙', 1, '2026-11-18 14:52:10'],
  ['正确测试_新', '使用前账户内要有对应排除人群', '应用推广-Android', '默认', '测试安卓应用(android)', '', '北京雷盟盛通文化发展有限公司', '刘松涵', 2, '2026-11-17 18:23:05'],
  ['智者二分', '1', '应用推广-Android', '默认', '知乎小说', '', '北京智者天下科技有限公司北京第一分公司', '刘松涵', 3, '2026-11-17 16:40:22'],
  ['智者一分', '新主体', '应用推广-Android', '默认', '', '', '北京智者天下科技有限公司北京第一分公司', '申旭阳', 0, '2026-11-17 11:08:36'],
  ['老主体', '新启动', '应用推广-Android', '默认', '测试安卓应用(android)', '', '北京智者天下科技有限公司', '刘松涵', 5, '2026-11-16 19:55:41'],
  ['智者天下-复制', '通用', '应用推广-Android', '默认', '', '', '北京智者天下科技有限公司', '申旭阳', 1, '2026-11-16 10:31:12'],
  ['正确测试', '使用前账户内要有对应排除人群', '应用推广-Android', '默认', '测试安卓应用(android)', '', '北京雷盟盛通文化发展有限公司', '刘松涵', 4, '2026-11-15 17:22:58'],
  ['知乎小说', '用于排除', '应用推广-Android', '通投智选', '', '知乎小说', '北京雷盟盛通文化发展有限公司', '刘松涵', 0, '2026-11-15 09:47:30'],
  ['漫剧端原生-安卓', '通投智选测试', '应用推广-Android', '通投智选', '测试安卓应用(android)', '漫剧端原生', '北京百度网讯科技有限公司', '张从浩', 2, '2026-11-14 16:13:07'],
  ['漫剧端原生-ios', '新剧拉新', '应用推广-IOS', '默认', '测试商品', '漫剧端原生', '北京百度网讯科技有限公司', '王春雷', 6, '2026-11-14 10:05:59'],
  ['soul-通用安卓', '通用人群', '应用推广-Android', '默认', '测试安卓应用(android)', 'soul', '上海得物信息集团有限公司', '郭峻宇', 1, '2026-11-13 20:41:33'],
  ['soul-通用ios', '通投', '应用推广-IOS', '通投智选', '测试商品', 'soul', '上海得物信息集团有限公司', '孙诗源', 0, '2026-11-13 14:26:18'],
  ['百度文库-搜索拉新', '搜索广告拉新人群', '应用推广-Android', '默认', '测试安卓应用(android)', '百度文库', '北京高途云集教育科技有限公司', '文清滨', 3, '2026-11-12 15:49:26'],
  ['百度文库-教育场景', '教育行业定向', '应用推广-Android', '默认', '测试商品', '百度文库', '北京高途云集教育科技有限公司', '李若涵', 8, '2026-11-12 09:17:44'],
  ['UG-端原生IAA-漫剧', '免费roi人群', '应用推广-Android', '穿山甲', '测试安卓应用(android)', '漫剧端原生', 'UG-端原生IAA-漫剧-免费roi-24020', '杨浩蒙', 12, '2026-11-11 18:03:15'],
  ['王者IP-中重度', '中重度游戏人群', '应用推广-Android', '默认', '测试安卓应用(android)', '', '上海置潮信息科技有限公司', '刘松涵', 5, '2026-11-11 11:32:50'],
  ['王者IP-女性向', '女性向游戏人群', '应用推广-IOS', '默认', '测试商品', '', '上海置潮信息科技有限公司', '申旭阳', 2, '2026-11-10 17:58:41'],
  ['短剧-下沉市场', '下沉市场短剧受众', '应用推广-Android', '通投智选', '测试安卓应用(android)', 'soul', '北京央广时代文化传播有限公司', '王春雷', 9, '2026-11-10 13:22:06'],
  ['短剧-一二线', '一二线短剧受众', '应用推广-Android', '默认', '测试安卓应用(android)', 'soul', '北京央广时代文化传播有限公司', '张从浩', 4, '2026-11-09 16:44:29'],
  ['测试安卓应用-默认', '默认定向测试', '应用推广-Android', '默认', '测试安卓应用(android)', '', '上海任意门科技有限公司', '郭峻宇', 0, '2026-11-09 10:11:37'],
  ['测试安卓应用-智选', '智选定向测试', '应用推广-Android', '通投智选', '测试安卓应用(android)', '', '上海任意门科技有限公司', '孙诗源', 1, '2026-11-08 19:37:52'],
  ['测试商品-拉新', '新用户拉新', '应用推广-Android', '默认', '测试商品', '', '北京智者天下科技有限公司北京第二分公司', '文清滨', 7, '2026-11-08 14:05:13'],
  ['测试商品-老用户', '老用户召回', '应用推广-IOS', '默认', '测试商品', '', '北京智者天下科技有限公司北京第二分公司', '李若涵', 2, '2026-11-07 10:50:44'],
];

const list = ref(
  RAW.map((r, i) => ({
    id: 17600000 + i * 37,
    package_id: 17326901565 - i * 23,
    name: r[0],
    description: r[1],
    package_type: r[2],
    delivery_range: r[3],
    product: r[4],
    project: r[5],
    company: r[6],
    creator: r[7],
    related_count: r[8],
    create_time: r[9],
  }))
);

/* ------------------------------------------------------------------ *
 * 巨量定向包（第二个页签）mock 数据
 * ------------------------------------------------------------------ */
const jyList = ref(
  RAW.slice(0, 12).map((r, i) => ({
    id: 18600000 + i * 41,
    package_id: 17826901565 - i * 31,
    name: `${r[0]}-媒体版`,
    description: r[1],
    package_type: r[2],
    delivery_range: r[3],
    account: ACCOUNTS[i % ACCOUNTS.length],
    create_time: r[9],
  }))
);

/* ------------------------------------------------------------------ *
 * 页签
 * ------------------------------------------------------------------ */
const tab = ref('cl');

function switchTab(t) {
  if (tab.value === t) return;
  tab.value = t;
  onFilterChange();
}

/* ------------------------------------------------------------------ *
 * 查询条件（创量定向包）
 * ------------------------------------------------------------------ */
const query = ref({ project: '', company: '', creators: [], product: '' });
const searchField = ref('name');
const searchKeyword = ref('');
const batchText = ref('');
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRows = ref([]);
const batchOp = ref('');
const tableRef = ref();

const searchFieldLabel = computed(() => (searchField.value === 'id' ? 'ID' : '名称'));

function onFilterChange() {
  pageNo.value = 1;
  tableRef.value && tableRef.value.clearSelection();
}

function onSearch() {
  pageNo.value = 1;
  tableRef.value && tableRef.value.clearSelection();
}

function onBatchSearch() {
  const keys = batchText.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!keys.length) {
    ElMessage.warning('请输入关键词');
    return;
  }
  searchKeyword.value = keys.join(',');
  if (!searchField.value) searchField.value = 'name';
  onSearch();
  ElMessage.success(`已按 ${keys.length} 个关键词批量搜索`);
}

function clearFilter(key) {
  query.value[key] = key === 'creators' ? [] : '';
  onFilterChange();
}

function onClearFilters() {
  query.value = { project: '', company: '', creators: [], product: '' };
  searchField.value = 'name';
  searchKeyword.value = '';
  batchText.value = '';
  onFilterChange();
}

/* ------------------------------------------------------------------ *
 * 列表数据（按筛选 / 关键词过滤）
 * ------------------------------------------------------------------ */
const filteredList = computed(() => {
  let rows = list.value;
  if (query.value.project) rows = rows.filter((r) => r.project === query.value.project);
  if (query.value.company) rows = rows.filter((r) => r.company === query.value.company);
  if (query.value.product) rows = rows.filter((r) => r.product === query.value.product);
  if (query.value.creators.length) {
    const names = query.value.creators.map((c) => creatorName(c));
    rows = rows.filter((r) => names.indexOf(r.creator) > -1);
  }
  const kw = searchKeyword.value.trim();
  if (kw) {
    const keys = kw.split(',').map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      if (searchField.value === 'id') return keys.some((k) => String(r.package_id) === k);
      if (searchField.value === 'name') return keys.some((k) => String(r.name).indexOf(k) > -1);
      return keys.some(
        (k) => String(r.name).indexOf(k) > -1 || String(r.package_id).indexOf(k) > -1
      );
    });
  }
  return rows;
});

const total = computed(() => filteredList.value.length);
const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

/** 筛选项「姓名 (邮箱)」→ 表格中展示的姓名 */
function creatorName(label) {
  const c = CREATORS.find((x) => x.label === label);
  return c ? c.name : label;
}

function onSelectionChange(rows) {
  selectedRows.value = rows;
}

/* ------------------------------------------------------------------ *
 * 查询条件（巨量定向包页签）
 * ------------------------------------------------------------------ */
const jyQuery = ref({ account: '' });
const jySearchField = ref('name');
const jySearchKeyword = ref('');
const jyPageNo = ref(1);
const jyPageSize = ref(10);
const jySelectedRows = ref([]);
const jyBatchOp = ref('');

function onJyFilterChange() {
  jyPageNo.value = 1;
}

function onJySearch() {
  jyPageNo.value = 1;
}

function clearJyFilter() {
  jyQuery.value = { account: '' };
  onJyFilterChange();
}

function onJyClearFilters() {
  jyQuery.value = { account: '' };
  jySearchField.value = 'name';
  jySearchKeyword.value = '';
  onJyFilterChange();
}

/** 线上：未选择媒体账户时列表为空（空状态「请选择媒体账户」） */
const jyFilteredList = computed(() => {
  if (!jyQuery.value.account) return [];
  let rows = jyList.value.filter((r) => r.account === jyQuery.value.account);
  const kw = jySearchKeyword.value.trim();
  if (kw) {
    const keys = kw.split(',').map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      if (jySearchField.value === 'id') return keys.some((k) => String(r.package_id) === k);
      return keys.some((k) => String(r.name).indexOf(k) > -1);
    });
  }
  return rows;
});
const jyTotal = computed(() => jyFilteredList.value.length);
const jyPagedList = computed(() => {
  const start = (jyPageNo.value - 1) * jyPageSize.value;
  return jyFilteredList.value.slice(start, start + jyPageSize.value);
});

function onJySync() {
  ElMessage.success('巨量定向包同步成功');
}

function onJyBatchOp(op) {
  const rows = jySelectedRows.value.slice();
  jyBatchOp.value = '';
  if (!op) return;
  if (!rows.length) {
    ElMessage.warning('请至少选择1行');
    return;
  }
  if (op === 'share') {
    shareRows.value = rows;
    shareTargets.value = [];
    shareVisible.value = true;
    return;
  }
  if (op === 'copy') {
    rows.forEach((r) => {
      jyList.value.splice(jyList.value.indexOf(r) + 1, 0, {
        ...r,
        id: 18600000 + jyList.value.length * 41 + 3,
        package_id: r.package_id + 1,
        name: `${r.name}-副本`,
      });
    });
    ElMessage.success(`已复制 ${rows.length} 条定向包`);
    return;
  }
  if (op === 'delete') {
    const ids = rows.map((r) => r.id);
    jyList.value = jyList.value.filter((x) => ids.indexOf(x.id) === -1);
    jySelectedRows.value = [];
    ElMessage.success('全部删除成功');
  }
}

/* ------------------------------------------------------------------ *
 * 获取巨量定向 —— 选择媒体账户
 * ------------------------------------------------------------------ */
const fetchVisible = ref(false);
const fetchAccount = ref('');
const fetchAccountKeyword = ref('');
const fetchPackageKeyword = ref('');
const fetchOnlyAvailable = ref(false);
const fetchAccountPage = ref(1);
const fetchAccountPageSize = 10;

const fetchAccountTotal = computed(() => ACCOUNTS.length);
const fetchAccountList = computed(() => {
  const k = fetchAccountKeyword.value.trim().toLowerCase();
  const start = (fetchAccountPage.value - 1) * fetchAccountPageSize;
  const list = k ? ACCOUNTS.filter((a) => a.toLowerCase().indexOf(k) > -1) : ACCOUNTS;
  return list.slice(start, start + fetchAccountPageSize);
});

function openFetch() {
  fetchAccount.value = '';
  fetchAccountKeyword.value = '';
  fetchPackageKeyword.value = '';
  fetchOnlyAvailable.value = false;
  fetchAccountPage.value = 1;
  fetchVisible.value = true;
}

function submitFetch() {
  if (!fetchAccount.value) {
    ElMessage.warning('请选择媒体账户');
    return;
  }
  ElMessage.success('巨量定向获取成功');
  fetchVisible.value = false;
}

/* ------------------------------------------------------------------ *
 * 新建 / 编辑 定向包抽屉（线上 /audience/editor 新增创量定向包）
 * ------------------------------------------------------------------ */
const formVisible = ref(false);
const formMode = ref('create');
const editingId = ref(null);
const editingIsJy = ref(false);

const emptyForm = () => ({
  name: '',
  description: '',
  cross_company: '不启用',
  project: '',
  company: '',
  ad_type: '所有广告',
  package_type: '',
  product: '',
  delivery_range: '默认',
  region: '不限',
  gender: '不限',
  age: '不限',
  custom_audience: '不限',
  behavior_interest: '不限',
  talent: '不限',
});
const form = ref(emptyForm());

function openCreate() {
  formMode.value = 'create';
  editingId.value = null;
  editingIsJy.value = false;
  form.value = emptyForm();
  formVisible.value = true;
}

function openJyCreate() {
  formMode.value = 'create';
  editingId.value = null;
  editingIsJy.value = true;
  form.value = emptyForm();
  formVisible.value = true;
}

function openEdit(row, isJy = false) {
  formMode.value = 'edit';
  editingId.value = row.id;
  editingIsJy.value = isJy;
  form.value = {
    ...emptyForm(),
    name: row.name,
    description: row.description,
    project: row.project || '',
    company: row.company || '',
    package_type: row.package_type,
    product: row.product || '',
    delivery_range: row.delivery_range,
  };
  formVisible.value = true;
}

function submitForm() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入定向包名称');
    return;
  }
  if (!form.value.description.trim()) {
    ElMessage.warning('请输入定向包描述');
    return;
  }
  if (!form.value.package_type) {
    ElMessage.warning('请选择定向包类型');
    return;
  }
  if (editingIsJy.value) {
    const row = jyList.value.find((x) => x.id === editingId.value);
    if (row) {
      row.name = form.value.name.trim();
      row.description = form.value.description.trim();
      row.package_type = form.value.package_type;
      row.delivery_range = form.value.delivery_range;
    }
    ElMessage.success('媒体定向包修改成功');
  } else if (formMode.value === 'create') {
    list.value.unshift({
      id: 17600000 + list.value.length * 37 + 1,
      package_id: 17326901565 - list.value.length * 23,
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      package_type: form.value.package_type,
      delivery_range: form.value.delivery_range,
      product: form.value.product || '测试安卓应用(android)',
      project: form.value.project || '',
      company: form.value.company || '北京百度网讯科技有限公司',
      creator: '张从浩',
      related_count: 0,
      create_time: nowText(),
    });
    ElMessage.success('创量定向包新建成功');
  } else {
    const row = list.value.find((x) => x.id === editingId.value);
    if (row) {
      row.name = form.value.name.trim();
      row.description = form.value.description.trim();
      row.package_type = form.value.package_type;
      row.delivery_range = form.value.delivery_range;
      row.product = form.value.product || row.product;
      row.project = form.value.project || row.project;
      row.company = form.value.company || row.company;
    }
    ElMessage.success('创量定向包修改成功');
  }
  formVisible.value = false;
  onSearch();
}

function nowText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ *
 * 行内操作 / 批量操作
 * ------------------------------------------------------------------ */
const shareVisible = ref(false);
const shareTargets = ref([]);
const shareRows = ref([]);

function openShare(row) {
  shareRows.value = [row];
  shareTargets.value = [];
  shareVisible.value = true;
}

function submitShare() {
  if (!shareTargets.value.length) {
    ElMessage.warning('请选择要共享的成员');
    return;
  }
  ElMessage.success(`已共享给 ${shareTargets.value.length} 位成员`);
  shareVisible.value = false;
}

const projectVisible = ref(false);
const projectForm = ref({ pid: '', pname: '' });
const projectRows = ref([]);

function openAddProject(row) {
  projectRows.value = [row];
  projectForm.value = { pid: '', pname: '' };
  projectVisible.value = true;
}

function submitAddProject() {
  if (!projectForm.value.pid.trim()) {
    ElMessage.warning('请输入巨量项目ID');
    return;
  }
  const pid = projectForm.value.pid.trim();
  projectRows.value.forEach((r) => {
    r.related_count += 1;
  });
  ElMessage.success(`已添加巨量项目 ${pid}`);
  projectVisible.value = false;
}

function copyRow(row, isJy = false) {
  const copy = {
    ...row,
    id: isJy ? 18600000 + jyList.value.length * 41 + 2 : 17600000 + list.value.length * 37 + 2,
    package_id: row.package_id + 1,
    name: `${row.name}-副本`,
    related_count: 0,
    create_time: nowText(),
  };
  if (isJy) jyList.value.splice(jyList.value.indexOf(row) + 1, 0, copy);
  else list.value.splice(list.value.indexOf(row) + 1, 0, copy);
  ElMessage.success('复制成功');
}

async function removeRow(row, isJy = false) {
  try {
    await ElMessageBox.confirm('确定要删除该定向包吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'cl-message-box--mini',
    });
  } catch (e) {
    return;
  }
  if (isJy) {
    jyList.value = jyList.value.filter((x) => x.id !== row.id);
    jySelectedRows.value = [];
  } else {
    list.value = list.value.filter((x) => x.id !== row.id);
    selectedRows.value = [];
  }
  ElMessage.success('删除成功');
}

async function onBatchOp(op) {
  const rows = selectedRows.value.slice();
  batchOp.value = '';
  if (!op) return;
  if (!rows.length) {
    ElMessage.warning('请至少选择1行');
    return;
  }
  if (op === 'share') {
    shareRows.value = rows;
    shareTargets.value = [];
    shareVisible.value = true;
    return;
  }
  if (op === 'addProject') {
    projectRows.value = rows;
    projectForm.value = { pid: '', pname: '' };
    projectVisible.value = true;
    return;
  }
  if (op === 'copy') {
    rows.forEach((r) => {
      list.value.splice(list.value.indexOf(r) + 1, 0, {
        ...r,
        id: 17600000 + list.value.length * 37 + 3,
        package_id: r.package_id + 1,
        name: `${r.name}-副本`,
        related_count: 0,
        create_time: nowText(),
      });
    });
    ElMessage.success(`已复制 ${rows.length} 条定向包`);
    return;
  }
  if (op === 'delete') {
    try {
      await ElMessageBox.confirm('此操作将删除选中的定向包, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'cl-message-box--mini',
      });
    } catch (e) {
      return;
    }
    const ids = rows.map((r) => r.id);
    list.value = list.value.filter((x) => ids.indexOf(x.id) === -1);
    selectedRows.value = [];
    ElMessage.success('全部删除成功');
  }
}

watch(pageSize, () => {
  pageNo.value = 1;
});
</script>

<style scoped>
.ori-page { width: 100%; }

/* ---------- 查询条件 ---------- */
/* 线上 .select-area 内层 el-select 无边框（外层 .filter-cell 提供方框） */
.filter-cell :deep(.el-select .el-input__wrapper) { box-shadow: none !important; padding: 0; }
.filter-cell :deep(.el-select .el-input__inner) { border: none; }
.filter-cell :deep(.el-select .el-input__suffix) { color: #c0c4cc; }
.ori-icon-close {
  font-size: 14px; color: #999; cursor: pointer; margin-left: 6px;
  padding-left: 6px; border-left: 1px solid #e8eaec;
}
.ori-icon-close:hover { color: #197afb; }
.ori-search-wrap { margin: 0 8px 8px 0; }

/* 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索 + 🔍 */
.ori-search-wrap :deep(.cl-search-input) { width: 280px; }
.ori-search-wrap :deep(.cl-search-input .el-input__inner) { height: 28px; font-size: 12px; }
.ori-search-wrap :deep(.cl-search-input .el-input-group__prepend) { padding: 0; background: #fff; }
.ori-search-wrap :deep(.cl-search-input .el-input-group__append) { padding: 0; background: #fff; }
.ori-search-wrap :deep(.search-field) { width: 80px; }
.ori-search-wrap :deep(.search-field .el-input__inner) { height: 28px; font-size: 12px; }
.ori-search-wrap :deep(.search-more-btn) { height: 28px; padding: 0 6px; border-radius: 0 3px 3px 0; }
.ori-batch-icon {
  display: inline-flex; align-items: center; font-size: 16px; color: #606266; cursor: pointer;
}
.ori-batch-icon:hover { color: #197afb; }
.ori-batch__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ori-batch__title { font-size: 14px; color: #333; font-weight: 500; }
.ori-batch__tips { font-size: 12px; color: #909399; margin-bottom: 6px; }
.ori-batch__link { color: #197afb; cursor: pointer; }
.ori-batch__pop-title { font-size: 14px; color: #303133; margin-bottom: 6px; }

/* ---------- 工具栏 ---------- */
.ori-count { font-size: 12px; color: #666; }
.ori-count__num { color: #197afb; }
.ori-tool-btn--wide { width: 136px; }
.ori-btn-icon { margin-right: 4px; vertical-align: -2px; }

/* ---------- 列表 ---------- */
.ori-empty { font-size: 13px; color: #909399; }
.asset-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.asset-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* ---------- 新增 / 编辑 抽屉 ---------- */
.ori-drawer :deep(.el-drawer__body) { padding: 0; height: 100%; overflow: hidden; }
.ori-drawer-body { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; }
.ori-drawer-body .module-container { flex: 1; min-width: 0; margin-bottom: 0; }
.ori-drawer :deep(.cl-drawer-form .el-form-item__content) { display: flex; align-items: center; }
.ori-drawer :deep(.cl-drawer-form .el-textarea) { width: 360px; }
.ori-drawer :deep(.cl-drawer-form .el-textarea__inner) { font-size: 13px; }
.ori-question { margin-left: 8px; color: #c0c4cc; cursor: help; }
.ori-warn { margin-left: 12px; font-size: 12px; color: #e6a23c; display: inline-flex; align-items: center; gap: 4px; }

/* 右侧信息卡 */
.ori-side { width: 220px; flex: none; }
.ori-side__card {
  background: #fff; border-radius: 3px; padding: 12px 16px; margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.ori-side__title { font-size: 14px; color: #333; font-weight: 600; margin-bottom: 10px; }
.ori-side__row { font-size: 12px; color: #606266; line-height: 22px; }
.ori-side__num { color: #197afb; font-weight: 600; }

/* ---------- 获取巨量定向（选择媒体账户） ---------- */
.ori-fetch__tip { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #f56c6c; margin-bottom: 14px; }
.ori-fetch__warn { color: #e6a23c; }
.ori-transfer { display: flex; gap: 16px; }
.ori-transfer__panel { flex: 1; border: 1px solid #e8eaec; border-radius: 3px; }
.ori-transfer__hd {
  display: flex; align-items: center; justify-content: space-between;
  height: 36px; padding: 0 12px; background: #f5f7fa; border-bottom: 1px solid #e8eaec;
  font-size: 13px; color: #333;
}
.ori-transfer__search { padding: 10px 12px 6px; }
.ori-transfer__list { height: 250px; overflow-y: auto; padding: 0 12px 10px; box-sizing: border-box; }
.ori-transfer__item { display: flex; width: 100%; margin: 0; }
.ori-transfer__item :deep(.el-radio__label) {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #333;
}
.ori-transfer__none { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #909399; }
.ori-transfer__pager { padding: 8px 12px; border-top: 1px solid #e8eaec; }

/* ---------- 弹窗 ---------- */
.ori-dialog__label { font-size: 13px; color: #333; margin-bottom: 8px; }
.ori-dialog__select { width: 100%; }
</style>
