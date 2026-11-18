<template>
  <div class="ia-page">
    <!-- 页面标题 -->
    <div class="asset-title-bar">
      <span class="asset-title">试玩/直玩素材</span>
    </div>

    <!-- ① 二级页签 + 顶部右侧（提示横幅 / 批量新建 / 使用已有策略新建） -->
    <div class="ia-topbar">
      <div class="asset-sub-tabs">
        <div
          v-for="t in SUB_TABS"
          :key="t.key"
          class="asset-sub-tab"
          :class="{ active: t.key === activeTab }"
          @click="onTab(t.key)"
        >{{ t.label }}</div>
      </div>

      <div class="ia-topbar__right">
        <div class="ia-banner">
          近15天一键过滤已为<b>47</b>条广告产生<b>75</b>个修复方案。
          <a class="ia-banner__link" @click="onBanner('view')">立即查看</a>
          <a class="ia-banner__link" @click="onBanner('auto')">自动采纳</a>
        </div>
        <el-button class="tool-btn ia-btn-intelligence" size="small" @click="openBatchCreate">
          <el-icon><MagicStick /></el-icon><span class="ml16">批量新建</span>
        </el-button>
        <el-button class="tool-btn ia-btn-intelligence" size="small" @click="openStrategyCreate">
          使用已有策略新建
        </el-button>
        <!-- 线上：统计日期区间在页头右上角（两个绿色按钮之后），不在查询条件行里 -->
        <el-date-picker
          v-model="query.date"
          class="ia-date ia-date--top"
          type="daterange"
          size="small"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="onFilterChange"
        />
      </div>
    </div>

    <!-- ② 查询条件（线上 form.filter-search-input） -->
    <div class="filter-row">
      <div class="filter-left">

        <!-- 账户主体：多选 -->
        <div class="filter-cell">
          <label class="filter-label">账户主体：</label>
          <el-select
            v-model="query.subjects"
            class="filter-select"
            size="small"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in SUBJECTS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 智投项目：多选 -->
        <div class="filter-cell">
          <label class="filter-label">智投项目：</label>
          <el-select
            v-model="query.projects"
            class="filter-select"
            size="small"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in PROJECTS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 优化师：多选 -->
        <div class="filter-cell">
          <label class="filter-label">优化师：</label>
          <el-select
            v-model="query.optimizers"
            class="filter-select"
            size="small"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in OPTIMIZERS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 部门：文本输入（线上为 el-select-tree，此处按简报用 text 承载） -->
        <div class="filter-cell">
          <label class="filter-label">部门：</label>
          <el-input
            v-model="query.dept"
            class="filter-select ia-dept"
            size="small"
            placeholder="请选择部门"
            @keyup.enter="onFilterChange"
          >
            <template #suffix>
              <el-popover placement="bottom-start" :width="240" trigger="click" popper-class="ia-dept-popper">
                <template #reference>
                  <el-icon class="ia-dept__caret" title="选择部门"><CaretBottom /></el-icon>
                </template>
                <div class="ia-dept-tree">
                  <div class="ia-dept-tree__hd">部门</div>
                  <el-tree
                    :data="DEPT_TREE"
                    show-checkbox
                    node-key="id"
                    :default-checked-keys="checkedDepts"
                    @check="onDeptCheck"
                  />
                </div>
              </el-popover>
            </template>
          </el-input>
        </div>

        <!-- 产品：多选 -->
        <div class="filter-cell">
          <label class="filter-label">产品：</label>
          <el-select
            v-model="query.products"
            class="filter-select"
            size="small"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in PRODUCTS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 自动修复拒审素材 -->
        <div class="filter-cell">
          <label class="filter-label">自动修复拒审素材：</label>
          <el-select
            v-model="query.autoFix"
            class="filter-select"
            size="small"
            placeholder="全部"
            @change="onFilterChange"
          >
            <el-option v-for="o in AUTO_FIX_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 关键词搜索（线上 .cl-search-input：前置字段下拉 + 关键词输入 + 批量气泡 + 🔍） -->
        <div class="filter-cell ia-search-cell">
          <el-input
            v-model="searchKeyword"
            class="cl-search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
          >
            <template #prepend>
              <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
                <el-option v-for="o in SEARCH_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </template>
            <template #suffix>
              <el-popover placement="bottom-end" :width="520" trigger="click" popper-class="ia-batch-popper">
                <template #reference>
                  <el-icon class="ia-batch-icon" title="批量搜索"><MoreFilled /></el-icon>
                </template>
                <div class="ia-batch">
                  <div class="ia-batch__hd">
                    <span class="ia-batch__title">请输入{{ currentSearchLabel }}（{{ batchText.length }}/1000）</span>
                    <el-link type="primary" :underline="false" @click="batchText = ''">清空</el-link>
                  </div>
                  <div class="ia-batch__tip">每一行为一个关键词，批量搜索将执行精确匹配。</div>
                  <el-input
                    v-model="batchText"
                    type="textarea"
                    :rows="8"
                    resize="none"
                    placeholder="请粘贴或输入名称，回车可换行"
                  />
                  <div class="batch-search-ops">
                    <el-button size="small" @click="batchText = ''">清空</el-button>
                    <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
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

        <!-- 清空（线上 .clear-box > a.clear-btn） -->
        <div class="clear-box">
          <a class="clear-btn" @click="clearFilters">清空</a>
        </div>
      </div>

      <!-- 查询按钮（线上 .otp-btn） -->
      <div class="filter-right">
        <div class="otp-btn">
          <el-button type="primary" size="small" @click="onQuery">查询</el-button>
        </div>
      </div>
    </div>

    <!-- ③ 功能按钮条（线上 .table-toolbar） -->
    <div class="table-toolbar">
      <div class="table-filters-left">
        <el-button class="tool-btn w120" size="small" plain @click="openAddAccount">+ 添加账户</el-button>

        <!-- 批量操作：下拉选择式（未勾选行时置灰） -->
        <el-select
          v-model="batchOp"
          class="batch-select"
          size="small"
          placeholder="批量操作"
          :disabled="!selectedRows.length"
          @change="onBatchOp"
        >
          <el-option v-for="o in BATCH_OPTIONS" :key="o" :label="o" :value="o" />
        </el-select>

        <el-button class="tool-btn" type="primary" size="small" @click="onCreativeClean">创意清理</el-button>
      </div>

      <div class="table-filters-right">
        <el-button class="tool-btn" type="primary" size="default" plain @click="onManualSync">手动同步</el-button>
        <el-button class="tool-btn" size="default" plain disabled>导出数据</el-button>
        <el-button class="tool-btn" size="small" plain @click="openMetricDialog">自定义指标</el-button>
        <el-button class="tool-btn" type="primary" size="small" @click="openInstantQuery">立即查询</el-button>
        <a class="ia-collapse" @click="toggleCollapse">{{ collapsed ? '展开' : '收起' }}</a>
      </div>
    </div>

    <!-- ④ 列表（线上 el-table--border，首行为「合计」行） -->
    <el-table
      ref="tableRef"
      :data="tableRows"
      row-key="id"
      border
      class="asset-table"
      @selection-change="onSelectionChange"
    >
      <template v-for="c in columns" :key="c.label">
        <el-table-column
          v-if="c.type === 'selection'"
          type="selection"
          :width="c.width"
          fixed="left"
          align="center"
          :selectable="rowSelectable"
        />

        <el-table-column
          v-else-if="c.type === 'action'"
          :label="c.label"
          :width="c.width"
          fixed="left"
          align="center"
        >
          <template #default="{ row }">
            <template v-if="!row.isSummary">
              <el-button
                v-for="a in rowActions"
                :key="a"
                link
                type="primary"
                size="small"
                @click="onRowAction(a, row)"
              >{{ a }}</el-button>
            </template>
          </template>
        </el-table-column>

        <el-table-column
          v-else
          :label="c.label"
          :prop="c.prop"
          :width="c.width"
          :fixed="c.fixed ? 'left' : undefined"
          :align="c.align"
          :sortable="!!c.sortable"
          :show-overflow-tooltip="c.type === 'text'"
        >
          <template #default="{ row }">
            <!-- 账户名称（蓝链 + ID 第二行） -->
            <div v-if="c.type === 'account'" class="desc-cell">
              <a
                class="desc-cell__title ia-link"
                :title="row.name"
                @click="openAccountDetail(row)"
              >{{ row.name }}</a>
              <div v-if="!row.isSummary" class="desc-cell__desc">ID：{{ row.advertiserId }}</div>
            </div>

            <!-- 自动修复拒审素材 -->
            <span v-else-if="c.type === 'switch'">{{ row.isSummary ? '' : row.autoFix }}</span>

            <!-- 账户状态（红点 + 文案） -->
            <span v-else-if="c.type === 'status'" class="ia-status">
              <i v-if="!row.isSummary" class="ia-status__dot" :class="{ 'is-warn': row.status !== '账户余额不足' }" />
              {{ row.isSummary ? '' : row.status }}
            </span>

            <!-- 数值 / 文本 -->
            <span v-else>{{ cellText(row, c) }}</span>
          </template>
        </el-table-column>
      </template>
    </el-table>

    <!-- ⑤ 批量新建（弹窗） -->
    <el-dialog v-model="batchCreateVisible" title="批量新建" width="640px" :close-on-click-modal="false" append-to-body>
      <el-form :model="batchCreateForm" label-width="110px" size="small">
        <el-form-item label="账户主体" required>
          <el-select v-model="batchCreateForm.subject" placeholder="请选择账户主体" style="width: 100%">
            <el-option v-for="o in SUBJECTS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="智投项目" required>
          <el-select v-model="batchCreateForm.project" placeholder="请选择智投项目" style="width: 100%">
            <el-option v-for="o in PROJECTS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="素材类型" required>
          <el-radio-group v-model="batchCreateForm.materialType">
            <el-radio-button label="试玩素材" />
            <el-radio-button label="直玩素材" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="新建数量" required>
          <el-input v-model="batchCreateForm.count" placeholder="请输入新建数量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="batchCreateVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitBatchCreate">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑥ 使用已有策略新建（弹窗） -->
    <el-dialog v-model="strategyVisible" title="使用已有策略新建" width="640px" :close-on-click-modal="false" append-to-body>
      <el-form :model="strategyForm" label-width="110px" size="small">
        <el-form-item label="已有策略" required>
          <el-select v-model="strategyForm.strategy" placeholder="请选择已有策略" style="width: 100%">
            <el-option v-for="o in STRATEGIES" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用账户" required>
          <el-select v-model="strategyForm.accounts" multiple collapse-tags placeholder="请选择应用账户" style="width: 100%">
            <el-option v-for="a in accountOptions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="strategyVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitStrategy">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑦ 添加账户（弹窗） -->
    <el-dialog v-model="addAccountVisible" title="添加账户" width="640px" :close-on-click-modal="false" append-to-body>
      <el-form :model="addAccountForm" label-width="110px" size="small">
        <el-form-item label="账户ID" required>
          <el-input v-model="addAccountForm.advertiserId" placeholder="请输入账户ID" />
        </el-form-item>
        <el-form-item label="账户名称" required>
          <el-input v-model="addAccountForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="账户主体" required>
          <el-select v-model="addAccountForm.subject" placeholder="请选择账户主体" style="width: 100%">
            <el-option v-for="o in SUBJECTS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录邮箱">
          <el-input v-model="addAccountForm.email" placeholder="请输入登录邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="addAccountVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitAddAccount">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑧ 自定义指标（弹窗） -->
    <el-dialog v-model="metricVisible" title="自定义指标" width="520px" :close-on-click-modal="false" append-to-body>
      <div class="ia-metric__tip">选择需要在列表中展示的指标：</div>
      <el-checkbox-group v-model="metricChecked" class="ia-metric__group">
        <el-checkbox v-for="m in METRIC_OPTIONS" :key="m.label" :label="m.label" :disabled="m.locked" />
      </el-checkbox-group>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="metricVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitMetric">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑨ 立即查询（弹窗） -->
    <el-dialog v-model="instantVisible" title="立即查询" width="640px" :close-on-click-modal="false" append-to-body>
      <el-form :model="instantForm" label-width="110px" size="small">
        <el-form-item label="查询账户">
          <el-select v-model="instantForm.accounts" multiple collapse-tags placeholder="请选择查询账户" style="width: 100%">
            <el-option v-for="a in accountOptions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="查询日期">
          <el-date-picker
            v-model="instantForm.date"
            type="daterange"
            unlink-panels
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="instantVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="submitInstant">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑩ 素材修复详情（线上 .cl-drawer，宽度 1016px） -->
    <el-drawer v-model="repairVisible" size="1016px" :with-header="false" append-to-body class="ia-drawer">
      <div class="cl-drawer">
        <div class="drawer-header">
          <span class="header-title">素材修复详情</span>
        </div>
        <div class="drawer-content">
          <div class="module-container">
            <div class="cl-form-block-title">素材信息</div>
            <div class="cl-drawer-form">
              <el-form label-width="144px" size="small">
                <el-form-item label="账户名称">{{ repairRow.name || '--' }}</el-form-item>
                <el-form-item label="账户ID">{{ repairRow.advertiserId || '--' }}</el-form-item>
                <el-form-item label="自动修复拒审素材">{{ repairRow.autoFix || '--' }}</el-form-item>
                <el-form-item label="拒审原因">素材包含违规文案/画面，已被平台拒审</el-form-item>
              </el-form>
            </div>
          </div>

          <div class="module-container">
            <div class="cl-form-block-title">修复方案</div>
            <div class="cl-drawer-form">
              <el-table :data="repairPlans" border size="small" class="asset-table">
                <el-table-column prop="id" label="方案ID" width="160" />
                <el-table-column prop="name" label="方案名称" width="200" />
                <el-table-column prop="type" label="修复方式" width="140" />
                <el-table-column prop="state" label="状态" width="120" />
                <el-table-column prop="time" label="生成时间" min-width="160" />
              </el-table>
            </div>
          </div>
        </div>
        <div class="drawer-footer">
          <div class="dialog-footer">
            <div class="operate-button">
              <el-button size="small" plain @click="repairVisible = false">取 消</el-button>
              <el-button size="small" type="primary" @click="submitRepair">确 定</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ⑪ 详情弹窗（账户 / 项目 / 广告 / 方案 / 剧目） -->
    <el-dialog v-model="detailVisible" :title="detailTitle" width="760px" :close-on-click-modal="false" append-to-body>
      <el-table :data="detailRows" border size="small" class="asset-table">
        <el-table-column prop="k" label="字段" width="180" />
        <el-table-column prop="v" label="内容" min-width="220" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="detailVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="detailVisible = false">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CaretBottom, MagicStick, MoreFilled, Search } from '@element-plus/icons-vue';

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------ *
 * 线上枚举（来源：创量线上「巨量广告·标准 → 资产 → 试玩/直玩素材」页）
 * ------------------------------------------------------------------ */
const SUBJECTS = [
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

const PROJECTS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

const OPTIMIZERS = [
  '北京央广时代文化传播有限公司',
  '张从浩',
  '王春雷',
  '郭峻宇',
  '孙诗源',
  'gongwenqing',
  'lixue',
  'jiangxin',
  'chenpeihua',
  '1304275504',
  '文清滨',
  '李若涵',
  '杨浩蒙',
  '刘松涵',
  '申旭阳',
];

const PRODUCTS = ['测试商品', '测试安卓应用'];

const AUTO_FIX_OPTIONS = ['关闭', '开启'];

const SEARCH_FIELDS = [
  { label: '账户名称', value: 'name' },
  { label: '账户ID', value: 'advertiser_id' },
  { label: '账户备注(创量)', value: 'remark_cl' },
  { label: '账户备注(巨量)', value: 'remark_gy' },
];

/** 批量操作下拉项（线上 .el-select-dropdown__item） */
const BATCH_OPTIONS = [
  '批量修改账户名称',
  '修改日预算',
  '添加屏蔽词',
  '开启自动修复拒审素材',
  '关闭自动修复拒审素材',
  '设置账户RTA',
];

const STRATEGIES = [
  '试玩素材默认策略-通用版',
  '试玩素材默认策略-教育版',
  '直玩素材默认策略-通用版',
  'UG-端原生IAA-漫剧-免费roi-24020',
];

const METRIC_OPTIONS = [
  { label: '消耗', key: 'cost', locked: true },
  { label: '展示数', key: 'impressions' },
  { label: '点击数', key: 'clicks' },
  { label: '点击率', key: 'ctr' },
  { label: '激活数', key: 'activations' },
  { label: '激活成本', key: 'activationCost' },
  { label: '注册数', key: 'registers' },
  { label: '注册成本', key: 'registerCost' },
];

const METRIC_PROPS = METRIC_OPTIONS.map((m) => m.key);
const HIDE_ON_COLLAPSE = ['impressions', 'clicks', 'ctr', 'activations', 'activationCost', 'registers', 'registerCost'];

const DEPT_TREE = [
  {
    id: 'd1',
    label: '巨量广告一组',
    children: [
      { id: 'd1-1', label: '优化师一组' },
      { id: 'd1-2', label: '优化师二组' },
    ],
  },
  {
    id: 'd2',
    label: '巨量广告二组',
    children: [
      { id: 'd2-1', label: '投放一组' },
      { id: 'd2-2', label: '投放二组' },
    ],
  },
  { id: 'd3', label: 'UG-端原生IAA-漫剧-免费roi-24020' },
];

/* ------------------------------------------------------------------ *
 * 二级页签
 * ------------------------------------------------------------------ */
const SUB_TABS = [
  { key: 'account', label: '账户' },
  { key: 'project', label: '项目' },
  { key: 'ad', label: '广告' },
  { key: 'plan', label: '托管方案' },
  { key: 'drama', label: '铺剧助手' },
];

const activeTab = ref('account');

/* ------------------------------------------------------------------ *
 * 列表 mock 数据（账户页首屏与线上一致：19 个账户）
 * ------------------------------------------------------------------ */
function makeAccountRow(i, name, advertiserId, subject, optimizer, status, balance, dayBudget, project, product) {
  const cost = 1200 + i * 337.55;
  const impressions = 12000 + i * 5431;
  const clicks = Math.round(impressions * (0.021 + (i % 5) * 0.006));
  const activations = Math.round(clicks * (0.16 + (i % 3) * 0.03));
  const registers = Math.round(activations * (0.42 + (i % 4) * 0.05));
  return {
    id: `acc-${advertiserId}`,
    advertiserId,
    name,
    subject,
    optimizer,
    status,
    balance,
    dayBudget,
    project: project || '--',
    product: product || '--',
    email: `${['yangqingbin', 'beijingyangguang', 'liwenbin', 'zhangconghao', 'wangchunlei'][i % 5]}@clzt.com`,
    autoFix: i % 4 === 0 ? '开启' : '关闭',
    remarkCl: `${name}-创量备注`,
    remarkGy: `${name}-巨量备注`,
    createTime: `2026-01-${String((i % 28) + 1).padStart(2, '0')} 10:24:00`,
    cost: Number(cost.toFixed(2)),
    impressions,
    clicks,
    ctr: Number(((clicks / impressions) * 100).toFixed(2)),
    activations,
    activationCost: Number((cost / Math.max(activations, 1)).toFixed(2)),
    registers,
    registerCost: Number((cost / Math.max(registers, 1)).toFixed(2)),
  };
}

const ACCOUNT_ROWS = [
  makeAccountRow(0, '百度极速版调起-央广-4', '1869584152800267', SUBJECTS[0], '文清滨', '账户余额不足', 0, 10000),
  makeAccountRow(1, '百度极速版调起-央广-5', '1869584153348634', SUBJECTS[0], '文清滨', '账户余额不足', 0, 5000),
  makeAccountRow(2, '百度极速版调起-央广-6', '1869584153842699', SUBJECTS[0], '文清滨', '账户余额不足', 0, 5000),
  makeAccountRow(3, '百度极速版调起-央广-7', '1869584154393786', SUBJECTS[0], '文清滨', '账户余额不足', 0, 5000),
  makeAccountRow(4, '百度极速版调起-央广-1', '1869584151302635', SUBJECTS[0], '文清滨', '账户余额不足', 0, 7000),
  makeAccountRow(5, '百度极速版调起-央广-11', '1869584157446151', SUBJECTS[0], '文清滨', '账户余额不足', 0, 3000),
  makeAccountRow(6, '好看视频-短剧主体开户-4', '187567904772426', '北京央广时代文化传播有限公司', '北京央广时代文化传播有限公司', '账户余额不足', 0, 1000),
  makeAccountRow(7, '上海得物信息集团有限公司1-50', '1834419631681163', SUBJECTS[9], '文清滨', '余额低，请充值', 5049.34, 1000),
  makeAccountRow(8, '百度极速版调起-央广-8', '1869584155107531', SUBJECTS[0], '文清滨', '账户余额不足', 0, 5000),
  makeAccountRow(9, '好看视频-短剧主体开户-1', '187567902926859', '北京央广时代文化传播有限公司', '北京央广时代文化传播有限公司', '账户余额不足', 0, 1000),
  makeAccountRow(10, '百度极速版调起-央广-9', '1869584156399127', SUBJECTS[0], '郭峻宇', '账户余额不足', 0, 8000),
  makeAccountRow(11, '百度极速版调起-央广-2', '1869584152314635', SUBJECTS[0], '王春雷', '账户余额不足', 0, 6000),
  makeAccountRow(12, '任意门-央广-代运营-36-安卓-UBA', '1866489873996443', SUBJECTS[1], '孙诗源', '正常', 12860.55, 20000),
  makeAccountRow(13, '任意门-央广-代运营-22-安卓-UBA', '1866489858950211', SUBJECTS[1], '孙诗源', '正常', 8620.18, 15000, '知乎小说', '测试商品'),
  makeAccountRow(14, '上海置潮信息科技有限公司-23', '1872677289688', SUBJECTS[8], 'lixue', '余额低，请充值', 1580.62, 3000, 'soul', '测试安卓应用'),
  makeAccountRow(15, '百度文库-央广时代-拉新-搜索-01', '1866877399870663', SUBJECTS[4], 'chenpeihua', '正常', 23140.9, 30000, '百度文库', '测试安卓应用'),
  makeAccountRow(16, '百度文库-央广时代-拉新-搜索-02', '1866877399203047', SUBJECTS[4], 'chenpeihua', '正常', 18730.44, 30000, '百度文库', '测试安卓应用'),
  makeAccountRow(17, '漫剧端原生-UG-端原生IAA-24020', '1879001263847261', SUBJECTS[11], '张从浩', '正常', 6820.77, 10000, '漫剧端原生', '测试安卓应用'),
  makeAccountRow(18, '北京智者天下科技有限公司-1', '1869051332415827', SUBJECTS[7], 'jiangxin', '账户余额不足', 0, 2000),
];

/** 项目页 mock */
const PROJECT_ROWS = ACCOUNT_ROWS.slice(0, 12).map((a, i) => ({
  ...a,
  id: `prj-${a.advertiserId}-${i}`,
  name: `${a.subject.slice(0, 6)}-${['拉新', '召回', '付费', '品牌', '种草'][i % 5]}项目${i + 1}`,
  accountName: a.name,
  projectCount: 3 + (i % 6),
  autoFix: i % 3 === 0 ? '开启' : '关闭',
}));

/** 广告页 mock */
const AD_ROWS = ACCOUNT_ROWS.slice(0, 12).map((a, i) => ({
  ...a,
  id: `ad-${a.advertiserId}-${i}`,
  name: `${a.name}-广告${i + 1}`,
  accountName: a.name,
  adType: ['试玩素材', '直玩素材'][i % 2],
  autoFix: i % 4 === 0 ? '开启' : '关闭',
}));

/** 托管方案页 mock */
const PLAN_ROWS = ACCOUNT_ROWS.slice(0, 9).map((a, i) => ({
  ...a,
  id: `plan-${a.advertiserId}-${i}`,
  name: `${a.subject.slice(0, 6)}-托管方案${i + 1}`,
  accountName: a.name,
  planState: ['运行中', '已暂停', '已结束'][i % 3],
  accountCount: 2 + (i % 5),
  createTime: `2026-0${(i % 9) + 1}-1${i % 9} 10:2${i % 9}:00`,
}));

/** 铺剧助手页 mock */
const DRAMA_ROWS = ACCOUNT_ROWS.slice(0, 8).map((a, i) => ({
  ...a,
  id: `drama-${a.advertiserId}-${i}`,
  name: `${['重生之我在豪门当保姆', '总裁的隐婚小娇妻', '穿书后我成了大反派', '萌宝助攻：甜妻撩心尖'][i % 4]}-第${i + 1}季`,
  accountName: a.name,
  episodeCount: 12 + i * 3,
  materialCount: 24 + i * 7,
  dramaState: ['铺剧中', '已完成', '待铺剧'][i % 3],
}));

/* ------------------------------------------------------------------ *
 * 各页签的列定义（顺序 / 列名 / 列宽 / 固定左列）
 * ------------------------------------------------------------------ */
const ACCOUNT_COLUMNS = [
  { type: 'selection', label: '[checkbox]', width: 60, fixed: true },
  { label: '账户名称', type: 'account', width: 250, fixed: true },
  { label: '自动修复拒审素材', type: 'switch', width: 176, fixed: true },
  { label: '操作', type: 'action', width: 220, fixed: true },
  { label: '登录邮箱', type: 'text', prop: 'email', width: 120 },
  { label: '项目', type: 'text', prop: 'project', width: 120 },
  { label: '产品', type: 'text', prop: 'product', width: 120 },
  { label: '优化师', type: 'text', prop: 'optimizer', width: 120 },
  { label: '账户状态', type: 'status', width: 120 },
  { label: '账户余额（元）', type: 'money', prop: 'balance', width: 179, sortable: true },
  { label: '账户日预算（元）', type: 'money', prop: 'dayBudget', width: 176 },
  { label: '消耗', type: 'money', prop: 'cost', width: 120 },
  { label: '展示数', type: 'int', prop: 'impressions', width: 120 },
  { label: '点击数', type: 'int', prop: 'clicks', width: 120 },
  { label: '点击率', type: 'rate', prop: 'ctr', width: 120 },
  { label: '激活数', type: 'int', prop: 'activations', width: 120 },
  { label: '激活成本', type: 'money', prop: 'activationCost', width: 120 },
  { label: '注册数', type: 'int', prop: 'registers', width: 120 },
  { label: '注册成本', type: 'money', prop: 'registerCost', width: 120 },
];

const PROJECT_COLUMNS = [
  { type: 'selection', label: '[checkbox]', width: 60, fixed: true },
  { label: '项目名称', type: 'account', width: 250, fixed: true },
  { label: '账户名称', type: 'text', prop: 'accountName', width: 176, fixed: true },
  { label: '操作', type: 'action', width: 220, fixed: true },
  { label: '项目数', type: 'int', prop: 'projectCount', width: 120 },
  { label: '优化师', type: 'text', prop: 'optimizer', width: 120 },
  { label: '账户状态', type: 'status', width: 120 },
  { label: '消耗', type: 'money', prop: 'cost', width: 120 },
  { label: '展示数', type: 'int', prop: 'impressions', width: 120 },
  { label: '点击数', type: 'int', prop: 'clicks', width: 120 },
  { label: '点击率', type: 'rate', prop: 'ctr', width: 120 },
  { label: '激活数', type: 'int', prop: 'activations', width: 120 },
  { label: '激活成本', type: 'money', prop: 'activationCost', width: 120 },
  { label: '注册数', type: 'int', prop: 'registers', width: 120 },
  { label: '注册成本', type: 'money', prop: 'registerCost', width: 120 },
];

const AD_COLUMNS = [
  { type: 'selection', label: '[checkbox]', width: 60, fixed: true },
  { label: '广告名称', type: 'account', width: 250, fixed: true },
  { label: '账户名称', type: 'text', prop: 'accountName', width: 176, fixed: true },
  { label: '操作', type: 'action', width: 220, fixed: true },
  { label: '素材类型', type: 'text', prop: 'adType', width: 120 },
  { label: '自动修复拒审素材', type: 'switch', width: 160 },
  { label: '优化师', type: 'text', prop: 'optimizer', width: 120 },
  { label: '账户状态', type: 'status', width: 120 },
  { label: '消耗', type: 'money', prop: 'cost', width: 120 },
  { label: '展示数', type: 'int', prop: 'impressions', width: 120 },
  { label: '点击数', type: 'int', prop: 'clicks', width: 120 },
  { label: '点击率', type: 'rate', prop: 'ctr', width: 120 },
  { label: '激活数', type: 'int', prop: 'activations', width: 120 },
  { label: '激活成本', type: 'money', prop: 'activationCost', width: 120 },
  { label: '注册数', type: 'int', prop: 'registers', width: 120 },
  { label: '注册成本', type: 'money', prop: 'registerCost', width: 120 },
];

const PLAN_COLUMNS = [
  { type: 'selection', label: '[checkbox]', width: 60, fixed: true },
  { label: '方案名称', type: 'account', width: 250, fixed: true },
  { label: '操作', type: 'action', width: 220, fixed: true },
  { label: '账户名称', type: 'text', prop: 'accountName', width: 176 },
  { label: '账户主体', type: 'text', prop: 'subject', width: 176 },
  { label: '优化师', type: 'text', prop: 'optimizer', width: 120 },
  { label: '托管状态', type: 'text', prop: 'planState', width: 120 },
  { label: '账户数', type: 'int', prop: 'accountCount', width: 120 },
  { label: '消耗', type: 'money', prop: 'cost', width: 120 },
  { label: '创建时间', type: 'text', prop: 'createTime', width: 176 },
];

const DRAMA_COLUMNS = [
  { type: 'selection', label: '[checkbox]', width: 60, fixed: true },
  { label: '剧目名称', type: 'account', width: 250, fixed: true },
  { label: '操作', type: 'action', width: 220, fixed: true },
  { label: '账户名称', type: 'text', prop: 'accountName', width: 176 },
  { label: '项目', type: 'text', prop: 'project', width: 120 },
  { label: '集数', type: 'int', prop: 'episodeCount', width: 120 },
  { label: '素材数', type: 'int', prop: 'materialCount', width: 120 },
  { label: '铺剧状态', type: 'text', prop: 'dramaState', width: 120 },
  { label: '消耗', type: 'money', prop: 'cost', width: 120 },
  { label: '展示数', type: 'int', prop: 'impressions', width: 120 },
  { label: '点击数', type: 'int', prop: 'clicks', width: 120 },
];

const TAB_CONFIG = {
  account: { columns: ACCOUNT_COLUMNS, rows: ACCOUNT_ROWS, rowActions: ['查看项目', '查看广告', '查看素材修复'] },
  project: { columns: PROJECT_COLUMNS, rows: PROJECT_ROWS, rowActions: ['查看账户', '查看广告', '查看素材修复'] },
  ad: { columns: AD_COLUMNS, rows: AD_ROWS, rowActions: ['查看广告', '查看素材修复'] },
  plan: { columns: PLAN_COLUMNS, rows: PLAN_ROWS, rowActions: ['查看方案', '暂停托管', '删除方案'] },
  drama: { columns: DRAMA_COLUMNS, rows: DRAMA_ROWS, rowActions: ['查看剧目', '查看素材'] },
};

const collapsed = ref(false);
const metricChecked = ref(METRIC_OPTIONS.map((m) => m.label));

/** 列表列（受「自定义指标」「收起」影响） */
const columns = computed(() => {
  const base = TAB_CONFIG[activeTab.value].columns;
  if (activeTab.value !== 'account') return base;
  if (collapsed.value) {
    return base.filter((c) => !HIDE_ON_COLLAPSE.includes(c.prop));
  }
  return base.filter((c) => !METRIC_PROPS.includes(c.prop) || metricChecked.value.includes(c.label));
});

const rowActions = computed(() => TAB_CONFIG[activeTab.value].rowActions);

/* ------------------------------------------------------------------ *
 * 查询条件 / 搜索
 * ------------------------------------------------------------------ */
const query = ref({
  date: [],
  subjects: [],
  projects: [],
  optimizers: [],
  dept: '',
  products: [],
  autoFix: '',
});

/* 线上默认选中「账户名称」（不是空占位） */
const searchField = ref('name');
const searchKeyword = ref('');
const batchText = ref('');
const checkedDepts = ref([]);

const currentSearchLabel = computed(
  () => (SEARCH_FIELDS.find((f) => f.value === searchField.value) || SEARCH_FIELDS[0]).label,
);

function onDeptCheck(data, checkedInfo) {
  const keys = (checkedInfo && checkedInfo.checkedKeys) || [];
  const names = [];
  DEPT_TREE.forEach((n) => {
    if (keys.indexOf(n.id) > -1) names.push(n.label);
    (n.children || []).forEach((c) => {
      if (keys.indexOf(c.id) > -1) names.push(c.label);
    });
  });
  query.value.dept = names.join('、');
  onFilterChange();
}

function onFilterChange() {
  /* 切换筛选条件即刷新列表（本地 mock 过滤） */
}

function onSearch() {
  ElMessage.success('查询成功');
}

function onQuery() {
  ElMessage.success('查询成功');
}

function clearFilters() {
  query.value = {
    date: [],
    subjects: [],
    projects: [],
    optimizers: [],
    dept: '',
    products: [],
    autoFix: '',
  };
  searchField.value = 'name';
  searchKeyword.value = '';
  batchText.value = '';
  checkedDepts.value = [];
  ElMessage.info('已清空筛选条件');
}

function applyBatchSearch() {
  const keys = batchText.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!keys.length) {
    ElMessage.warning('请输入关键词');
    return;
  }
  searchKeyword.value = keys.join(',');
  if (!searchField.value) searchField.value = SEARCH_FIELDS[0].value;
  ElMessage.success(`已按 ${keys.length} 个关键词批量搜索`);
}

/* ------------------------------------------------------------------ *
 * 列表数据（按筛选 / 关键词过滤；首行为「合计」行 —— 与线上一致）
 * ------------------------------------------------------------------ */
const tableRef = ref();
const selectedRows = ref([]);
const batchOp = ref('');

const accountOptions = computed(() =>
  ACCOUNT_ROWS.map((r) => ({ value: r.advertiserId, label: `${r.name}(${r.advertiserId})` })),
);

function matchKeyword(row, kw) {
  const field = searchField.value || 'name';
  if (field === 'advertiser_id') return String(row.advertiserId || '').indexOf(kw) > -1;
  if (field === 'remark_cl') return String(row.remarkCl || '').indexOf(kw) > -1;
  if (field === 'remark_gy') return String(row.remarkGy || '').indexOf(kw) > -1;
  return String(row.name || '').indexOf(kw) > -1;
}

const filteredRows = computed(() => {
  const q = query.value;
  let rows = TAB_CONFIG[activeTab.value].rows.slice();

  if (q.subjects.length) rows = rows.filter((r) => q.subjects.indexOf(r.subject) > -1);
  if (q.projects.length) rows = rows.filter((r) => q.projects.indexOf(r.project) > -1);
  if (q.optimizers.length) rows = rows.filter((r) => q.optimizers.indexOf(r.optimizer) > -1);
  if (q.products.length) rows = rows.filter((r) => q.products.indexOf(r.product) > -1);
  if (q.autoFix) rows = rows.filter((r) => r.autoFix === q.autoFix);
  if (q.dept) {
    const kw = q.dept;
    rows = rows.filter((r) => (r.optimizer || '').indexOf(kw) > -1 || (r.subject || '').indexOf(kw) > -1);
  }
  if (q.date && q.date.length === 2) {
    const [start, end] = q.date;
    rows = rows.filter((r) => {
      const d = String(r.createTime || '2026-01-01').slice(0, 10);
      return d >= start && d <= end;
    });
  }

  const kw = (searchKeyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => keys.some((k) => matchKeyword(r, k)));
  }
  return rows;
});

/** 表格数据：首行是「合计」行（线上 el-table 首行即合计） */
const tableRows = computed(() => {
  const rows = filteredRows.value;
  const sum = (k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const summary = {
    id: '__summary__',
    isSummary: true,
    name: '合计',
    dayBudget: rows.length,
    cost: Number(sum('cost').toFixed(2)),
    impressions: sum('impressions'),
    clicks: sum('clicks'),
    activations: sum('activations'),
    registers: sum('registers'),
  };
  summary.ctr = summary.impressions ? Number(((summary.clicks / summary.impressions) * 100).toFixed(2)) : 0;
  summary.activationCost = summary.activations ? Number((summary.cost / summary.activations).toFixed(2)) : 0;
  summary.registerCost = summary.registers ? Number((summary.cost / summary.registers).toFixed(2)) : 0;
  return [summary, ...rows];
});

function rowSelectable(row) {
  return !row.isSummary;
}

function onSelectionChange(rows) {
  selectedRows.value = rows.filter((r) => !r.isSummary);
}

/* ------------------------------------------------------------------ *
 * 单元格文本 / 数字格式化
 * ------------------------------------------------------------------ */
function fmtMoney(v) {
  const n = Number(v);
  if (!isFinite(n)) return '0.00';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(v) {
  const n = Number(v);
  if (!isFinite(n)) return '0';
  return n.toLocaleString('zh-CN');
}
function fmtRate(v) {
  const n = Number(v);
  if (!isFinite(n)) return '0.00%';
  return `${n.toFixed(2)}%`;
}

function cellText(row, c) {
  const v = row[c.prop];
  if (row.isSummary && v === undefined) return '';
  /* 线上「合计」行的账户日预算列显示的是账户条数（整数） */
  if (row.isSummary && c.prop === 'dayBudget') return String(v);
  if (c.type === 'money') return fmtMoney(v);
  if (c.type === 'int') return fmtInt(v);
  if (c.type === 'rate') return fmtRate(v);
  return v === undefined || v === null || v === '' ? '--' : String(v);
}

/* ------------------------------------------------------------------ *
 * 顶部横幅 / 页签
 * ------------------------------------------------------------------ */
function onBanner(kind) {
  if (kind === 'view') {
    ElMessage.info('已为您定位近15天的75个素材修复方案');
  } else {
    ElMessage.success('已自动采纳近15天生成的75个修复方案');
  }
}

function onTab(key) {
  if (activeTab.value === key) return;
  activeTab.value = key;
  selectedRows.value = [];
  batchOp.value = '';
  ElMessage.info(`已切换到「${(SUB_TABS.find((t) => t.key === key) || {}).label}」`);
}

/* ------------------------------------------------------------------ *
 * 功能按钮
 * ------------------------------------------------------------------ */
const batchCreateVisible = ref(false);
const batchCreateForm = ref({ subject: '', project: '', materialType: '试玩素材', count: '1' });

function openBatchCreate() {
  batchCreateForm.value = { subject: '', project: '', materialType: '试玩素材', count: '1' };
  batchCreateVisible.value = true;
}

function submitBatchCreate() {
  const f = batchCreateForm.value;
  if (!f.subject) { ElMessage.warning('请选择账户主体'); return; }
  if (!f.project) { ElMessage.warning('请选择智投项目'); return; }
  if (!f.count) { ElMessage.warning('请输入新建数量'); return; }
  batchCreateVisible.value = false;
  ElMessage.success(`已提交 ${f.count} 个${f.materialType}的新建任务`);
}

const strategyVisible = ref(false);
const strategyForm = ref({ strategy: '', accounts: [] });

function openStrategyCreate() {
  strategyForm.value = { strategy: '', accounts: [] };
  strategyVisible.value = true;
}

function submitStrategy() {
  const f = strategyForm.value;
  if (!f.strategy) { ElMessage.warning('请选择已有策略'); return; }
  if (!f.accounts.length) { ElMessage.warning('请选择应用账户'); return; }
  strategyVisible.value = false;
  ElMessage.success(`已将策略「${f.strategy}」应用到 ${f.accounts.length} 个账户`);
}

const addAccountVisible = ref(false);
const addAccountForm = ref({ advertiserId: '', name: '', subject: '', email: '' });

function openAddAccount() {
  addAccountForm.value = { advertiserId: '', name: '', subject: '', email: '' };
  addAccountVisible.value = true;
}

function submitAddAccount() {
  const f = addAccountForm.value;
  if (!f.advertiserId) { ElMessage.warning('请输入账户ID'); return; }
  if (!f.name) { ElMessage.warning('请输入账户名称'); return; }
  if (!f.subject) { ElMessage.warning('请选择账户主体'); return; }
  const row = makeAccountRow(
    ACCOUNT_ROWS.length,
    f.name,
    f.advertiserId,
    f.subject,
    '文清滨',
    '正常',
    0,
    1000,
  );
  row.email = f.email || row.email;
  ACCOUNT_ROWS.unshift(row);
  PROJECT_ROWS.unshift({
    ...row,
    id: `prj-${row.advertiserId}-new`,
    name: `${f.subject.slice(0, 6)}-新建项目`,
    accountName: row.name,
    projectCount: 1,
  });
  addAccountVisible.value = false;
  ElMessage.success('添加账户成功');
}

async function onCreativeClean() {
  try {
    await ElMessageBox.confirm(
      '创意清理将清除已下线/已拒审素材，操作不可恢复，确认继续?',
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
  } catch (e) {
    return;
  }
  ElMessage.success('创意清理任务已提交');
}

function onManualSync() {
  ElMessage.success('手动同步任务已提交，稍后可在任务中心查看');
}

const metricVisible = ref(false);

function openMetricDialog() {
  metricChecked.value = METRIC_OPTIONS
    .filter((m) => m.locked || columns.value.some((c) => c.prop === m.key))
    .map((m) => m.label);
  metricVisible.value = true;
}

function submitMetric() {
  metricVisible.value = false;
  ElMessage.success('指标设置已保存');
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

const instantVisible = ref(false);
const instantForm = ref({ accounts: [], date: [] });

function openInstantQuery() {
  instantForm.value = { accounts: [], date: [] };
  instantVisible.value = true;
}

function submitInstant() {
  instantVisible.value = false;
  ElMessage.success('立即查询已提交，结果将通过任务中心通知');
}

/* ------------------------------------------------------------------ *
 * 批量操作
 * ------------------------------------------------------------------ */
async function onBatchOp(op) {
  const rows = selectedRows.value.slice();
  batchOp.value = '';
  if (!op) return;
  if (!rows.length) { ElMessage.warning('请先选择数据'); return; }

  if (op === '批量修改账户名称') {
    try {
      const { value } = await ElMessageBox.prompt('请输入新的账户名称', '批量修改账户名称', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入账户名称',
        inputValidator: (v) => (v && v.trim() ? true : '账户名称不能为空'),
      });
      rows.forEach((r) => { r.name = String(value).trim(); });
      ElMessage.success(`已修改 ${rows.length} 个账户名称`);
    } catch (e) {
      /* 用户取消 */
    }
    return;
  }

  if (op === '修改日预算') {
    try {
      const { value } = await ElMessageBox.prompt('请输入新的账户日预算（元）', '修改日预算', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入日预算',
        inputValidator: (v) => (v && !isNaN(Number(v)) ? true : '日预算必须为数字'),
      });
      rows.forEach((r) => { r.dayBudget = Number(value); });
      ElMessage.success(`已修改 ${rows.length} 个账户的日预算`);
    } catch (e) {
      /* 用户取消 */
    }
    return;
  }

  if (op === '添加屏蔽词') {
    try {
      const { value } = await ElMessageBox.prompt('请输入屏蔽词（多个用英文逗号分隔）', '添加屏蔽词', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入屏蔽词',
        inputValidator: (v) => (v && v.trim() ? true : '屏蔽词不能为空'),
      });
      ElMessage.success(`已为 ${rows.length} 个账户添加屏蔽词：${value}`);
    } catch (e) {
      /* 用户取消 */
    }
    return;
  }

  if (op === '开启自动修复拒审素材') {
    rows.forEach((r) => { r.autoFix = '开启'; });
    ElMessage.success(`已为 ${rows.length} 个账户开启自动修复拒审素材`);
    return;
  }

  if (op === '关闭自动修复拒审素材') {
    rows.forEach((r) => { r.autoFix = '关闭'; });
    ElMessage.success(`已为 ${rows.length} 个账户关闭自动修复拒审素材`);
    return;
  }

  if (op === '设置账户RTA') {
    try {
      const { value } = await ElMessageBox.prompt('请输入RTA策略ID', '设置账户RTA', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入RTA策略ID',
        inputValidator: (v) => (v && v.trim() ? true : 'RTA策略ID不能为空'),
      });
      ElMessage.success(`已为 ${rows.length} 个账户设置RTA：${value}`);
    } catch (e) {
      /* 用户取消 */
    }
  }
}

/* ------------------------------------------------------------------ *
 * 行内操作 / 详情
 * ------------------------------------------------------------------ */
const repairVisible = ref(false);
const repairRow = ref({});
const repairPlans = ref([]);

const detailVisible = ref(false);
const detailTitle = ref('');
const detailRows = ref([]);

function openAccountDetail(row) {
  detailTitle.value = '账户详情';
  detailRows.value = [
    { k: '账户名称', v: row.name },
    { k: '账户ID', v: row.advertiserId },
    { k: '账户主体', v: row.subject },
    { k: '登录邮箱', v: row.email },
    { k: '智投项目', v: row.project },
    { k: '产品', v: row.product },
    { k: '优化师', v: row.optimizer },
    { k: '账户状态', v: row.status },
    { k: '账户余额（元）', v: fmtMoney(row.balance) },
    { k: '账户日预算（元）', v: fmtMoney(row.dayBudget) },
  ];
  detailVisible.value = true;
}

function openRepair(row) {
  repairRow.value = row;
  repairPlans.value = [
    { id: 'FIX-20260118-001', name: '文案替换-通用版', type: '文案替换', state: '待审核', time: '2026-01-18 10:24:00' },
    { id: 'FIX-20260118-002', name: '画面裁切-竖版', type: '画面处理', state: '已通过', time: '2026-01-18 10:31:00' },
  ];
  repairVisible.value = true;
}

function submitRepair() {
  repairVisible.value = false;
  ElMessage.success('已提交素材修复方案');
}

function onRowAction(action, row) {
  if (action === '查看项目') {
    detailTitle.value = '项目列表';
    detailRows.value = PROJECT_ROWS.slice(0, 8).map((p) => ({ k: p.name, v: `账户：${p.accountName}｜项目数：${p.projectCount}` }));
    detailVisible.value = true;
    return;
  }
  if (action === '查看广告') {
    detailTitle.value = '广告列表';
    detailRows.value = AD_ROWS.slice(0, 8).map((a) => ({ k: a.name, v: `账户：${a.accountName}｜类型：${a.adType}` }));
    detailVisible.value = true;
    return;
  }
  if (action === '查看素材修复') {
    openRepair(row);
    return;
  }
  if (action === '查看账户') {
    openAccountDetail(row);
    return;
  }
  if (action === '查看方案') {
    detailTitle.value = '托管方案详情';
    detailRows.value = [
      { k: '方案名称', v: row.name },
      { k: '账户名称', v: row.accountName },
      { k: '账户主体', v: row.subject },
      { k: '托管状态', v: row.planState },
      { k: '账户数', v: String(row.accountCount) },
      { k: '创建时间', v: row.createTime },
    ];
    detailVisible.value = true;
    return;
  }
  if (action === '暂停托管') {
    row.planState = row.planState === '运行中' ? '已暂停' : '运行中';
    ElMessage.success(row.planState === '已暂停' ? '已暂停托管方案' : '已恢复托管方案');
    return;
  }
  if (action === '删除方案') {
    const idx = PLAN_ROWS.findIndex((p) => p.id === row.id);
    if (idx > -1) PLAN_ROWS.splice(idx, 1);
    ElMessage.success('已删除托管方案');
    return;
  }
  if (action === '查看剧目') {
    detailTitle.value = '剧目详情';
    detailRows.value = [
      { k: '剧目名称', v: row.name },
      { k: '所属账户', v: row.accountName },
      { k: '集数', v: String(row.episodeCount) },
      { k: '素材数', v: String(row.materialCount) },
      { k: '铺剧状态', v: row.dramaState },
    ];
    detailVisible.value = true;
    return;
  }
  if (action === '查看素材') {
    openRepair(row);
    return;
  }
  ElMessage.info(`原型：${action}`);
}

watch(activeTab, () => {
  selectedRows.value = [];
  batchOp.value = '';
});
</script>

<style scoped>
.ia-page { width: 100%; }

/* ---------- 顶部：页签 + 横幅 + 新建按钮 ---------- */
.ia-topbar {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e8eaec; margin-bottom: 12px; padding-bottom: 8px;
}
.ia-topbar .asset-sub-tabs { margin-bottom: 0; border-bottom: none; flex: 1; }
.ia-topbar__right { display: flex; align-items: center; gap: 12px; }
.ia-banner {
  font-size: 12px; color: #197afb; background: #eef5ff; border: 1px solid #d6e4ff;
  border-radius: 3px; padding: 6px 10px; line-height: 18px;
}
.ia-banner b { color: #197afb; font-weight: 600; margin: 0 2px; }
.ia-banner__link { color: #197afb; cursor: pointer; margin-left: 8px; }
.ia-btn-intelligence { background: #00b389; border-color: #00b389; color: #fff; }
.ia-btn-intelligence:hover { background: #00a37a; border-color: #00a37a; color: #fff; }

/* ---------- 查询条件 ---------- */
.ia-page .filter-cell :deep(.el-input__wrapper),
.ia-page .filter-cell :deep(.el-select__wrapper) {
  box-shadow: none !important; background: transparent; padding-left: 0;
}
.ia-page .filter-cell :deep(.el-input__inner) { height: 28px; font-size: 12px; color: #606266; }
.ia-page .filter-cell :deep(.el-select__placeholder) { font-size: 12px; }
.ia-page .filter-cell :deep(.el-select__tags-text) { font-size: 12px; }
.ia-page .filter-cell :deep(.el-tag) { font-size: 12px; height: 20px; padding: 0 6px; }
.ia-page .filter-cell :deep(.el-range-input) { font-size: 12px; color: #606266; }
.ia-page .filter-cell :deep(.el-range-separator) { font-size: 12px; color: #c0c4cc; }
.ia-date { width: 220px; }
.ia-page :deep(.ia-date.el-date-editor--daterange) { width: 220px; box-sizing: border-box; }
/* 页头右上角的统计日期区间（线上：两个绿色按钮右侧的白底日期框） */
.ia-date--top { width: 230px; margin-left: 8px; }
.ia-page :deep(.ia-date--top.el-date-editor--daterange) { width: 230px; box-sizing: border-box; }
.ia-page :deep(.ia-date--top .el-range-input) { font-size: 12px; color: #606266; }
.ia-page :deep(.ia-date--top .el-range-separator) { font-size: 12px; color: #c0c4cc; }
/* 查询按钮保持在筛选区第一行最右（线上 .filter-search-input 右侧） */
.ia-page :deep(.filter-left) { flex: 1; min-width: 0; }
.ia-dept { width: 168px; }
.ia-dept__caret { color: #c0c4cc; cursor: pointer; }
.ia-dept__caret:hover { color: #197afb; }
.ia-search-cell { padding: 0; border: 0; }
.ia-page :deep(.cl-search-input) { width: 360px; }
.ia-page :deep(.cl-search-input .el-input__inner) { height: 28px; font-size: 12px; }
.ia-page :deep(.cl-search-input .el-input-group__prepend) { width: 110px; flex: 0 0 110px; padding: 0; background: #fff; }
.ia-page :deep(.cl-search-input .el-input-group__append) { width: 32px; flex: 0 0 32px; padding: 0; background: #fff; }
.ia-page :deep(.cl-search-input .el-input-group__append .el-button) { flex: none; width: 32px; }
.ia-page :deep(.cl-search-input > .el-input__wrapper) { flex: 1; min-width: 0; }
.ia-page :deep(.cl-search-input .search-field) { width: 110px; flex: none; }
.ia-page :deep(.cl-search-input .search-field .el-input__inner) { height: 28px; font-size: 12px; }
.ia-page :deep(.cl-search-input .search-more-btn) { height: 28px; width: 32px; padding: 0; border-radius: 0 3px 3px 0; }
.ia-batch-icon { font-size: 16px; color: #c0c4cc; cursor: pointer; }
.ia-batch-icon:hover { color: #197afb; }
.ia-batch__hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ia-batch__title { font-size: 14px; color: #333; font-weight: 500; }
.ia-batch__tip { font-size: 12px; color: #909399; margin-bottom: 6px; }

/* 清空（线上 .clear-box > a.clear-btn） */
.clear-box { margin: 0 8px 8px 4px; align-self: center; }
.clear-btn { font-size: 12px; color: #197afb; cursor: pointer; }
.clear-btn:hover { color: #4a90ff; }

/* ---------- 工具栏 ---------- */
.table-toolbar { justify-content: space-between; }
.table-filters-left, .table-filters-right { display: flex; align-items: center; gap: 12px; }
.table-filters-left .batch-select { margin-left: 0; }
.ia-collapse { font-size: 12px; color: #197afb; cursor: pointer; margin-left: 4px; }

/* ---------- 列表 ---------- */
.ia-link { color: #197afb; cursor: pointer; text-decoration: none; }
.ia-link:hover { text-decoration: underline; }
.ia-status { display: inline-flex; align-items: center; white-space: nowrap; }
.ia-status__dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #f56c6c; margin-right: 6px;
}
.ia-status__dot.is-warn { background: #e6a23c; }

/* ---------- 部门树 ---------- */
.ia-dept-tree__hd { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 6px; }

/* ---------- 弹窗 / 抽屉 ---------- */
.ia-metric__tip { font-size: 13px; color: #666; margin-bottom: 10px; }
.ia-metric__group { display: flex; flex-wrap: wrap; gap: 4px 16px; }
.ia-drawer :deep(.el-drawer__body) { padding: 0; }
</style>
