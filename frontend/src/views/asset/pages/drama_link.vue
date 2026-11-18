<template>
  <div class="dl-page">
    <!-- ① 二级页签（线上 ul.cl-minor-nav.el-menu--horizontal：常读分销 / 点众分销） -->
    <div class="asset-sub-tabs dl-tabs">
      <div
        v-for="t in SUB_TABS"
        :key="t.key"
        class="asset-sub-tab"
        :class="{ active: activeTab === t.key }"
        @click="switchTab(t.key)"
      >{{ t.label }}</div>
    </div>

    <!-- ② 查询条件（线上 form.el-form.filter-search-input.el-form--inline） -->
    <div class="filter-row dl-filter-row">
      <div class="filter-left">
        <div v-for="f in filters" :key="f.key" class="filter-cell">
          <label class="filter-label">{{ f.label }}：</label>
          <el-select
            v-model="query[f.key]"
            class="filter-select"
            size="small"
            :placeholder="f.placeholder"
            clearable
            @change="onFilterChange"
          >
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 关键词搜索（线上只有一个输入框，无字段类型下拉；放大镜为输入框内的 suffix 图标） -->
        <div class="dl-search">
          <el-input
            v-model="keyword"
            class="dl-search-input"
            size="small"
            placeholder="请输入短剧ID"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix>
              <el-icon class="dl-search-icon" @click="onSearch"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- ③ 功能按钮（线上 div.table-toolbar：新建 #66b1ff / 短剧资产准备 #197afb） -->
    <div class="table-toolbar dl-toolbar">
      <el-button type="primary" size="small" class="tool-btn dl-btn-new" @click="openDrawer()">新建推广链接</el-button>
      <el-button type="primary" size="small" class="tool-btn dl-btn-prepare" @click="prepareVisible = true">短剧资产准备</el-button>
      <a class="dl-guide-link" :href="GUIDE_URL" target="_blank" rel="noopener">操作指引</a>
    </div>

    <!-- ④ 列表（线上 el-table--border，5 列） -->
    <el-table
      :data="pagedRows"
      row-key="id"
      border
      class="asset-table dl-table"
      empty-text="暂无数据"
    >
      <el-table-column label="推广链接" prop="link" width="404" show-overflow-tooltip>
        <template #default="{ row }">
          <el-link type="primary" :underline="false" class="dl-link-text" @click="copyLink(row)">{{ row.link }}</el-link>
        </template>
      </el-table-column>

      <el-table-column label="短剧" prop="drama_title" width="401" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="desc-cell">
            <div class="desc-cell__title" :title="row.drama_title">{{ row.drama_title }}</div>
            <div class="desc-cell__desc">{{ row.drama_id }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="小程序路由" prop="route" width="401" show-overflow-tooltip />

      <el-table-column label="创建时间" prop="created_at" width="401" />

      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDrawer(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ⑤ 分页（线上无数据故未出现分页，本地按通用规范补齐） -->
    <div class="pager-card dl-pager">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="filteredRows.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ⑥ 新建 / 编辑抽屉（线上「生成常读推广链接」，1016px，6 个分区） -->
    <el-drawer
      v-model="drawerVisible"
      :size="1016"
      direction="rtl"
      :with-header="false"
      :close-on-click-modal="false"
      class="dl-drawer"
    >
      <div class="dl-drawer-inner">
        <div class="cl-drawer">
          <!-- 抽屉左缘悬浮关闭按钮（线上：蓝色方块 X，压在抽屉左边界） -->
          <button class="dl-drawer-close" title="关闭" @click="drawerVisible = false">
            <el-icon><Close /></el-icon>
          </button>

          <div class="drawer-header">
            <div class="dl-drawer-hd">
              <span class="header-title">{{ drawerTitle }}</span>
              <div class="dl-drawer-hd__right">
                <el-button class="dl-opt-link" text size="small" @click="reuseLastTask">引用上次任务</el-button>
              </div>
            </div>
          </div>

          <div class="drawer-content mr0">
            <div v-for="sec in drawerSections" :key="sec.title" class="module-container">
              <div class="cl-form-block-title">{{ sec.title }}</div>
              <el-form class="cl-drawer-form" label-width="144px" label-position="left" size="small">
                <el-form-item
                  v-for="f in sec.fields"
                  :key="f.key"
                  :label="f.label"
                  :required="!!f.required"
                >
                  <!-- 引用历史任务（下拉 + 复用按钮） -->
                  <div v-if="f.type === 'history-task'" class="dl-field">
                    <div class="dl-inline">
                      <el-select
                        v-model="form[f.key]"
                        class="ag-select"
                        size="small"
                        filterable
                        :placeholder="f.placeholder"
                        @change="onHistoryChange"
                      >
                        <el-option v-for="t in historyTasks" :key="t.id" :label="t.name" :value="t.id" />
                      </el-select>
                      <el-button class="ml8" type="primary" size="small" @click="reuseHistoryTask">复用</el-button>
                    </div>
                    <p v-if="f.tip" class="dl-tips">{{ f.tip }}</p>
                  </div>

                  <!-- 文本输入（可带字数统计 / 通配符） -->
                  <div v-else-if="f.type === 'text'" class="dl-field">
                    <div class="dl-inline">
                      <div class="dl-input-wrap" :class="{ 'has-counter': !!f.counter }">
                        <el-input
                          v-model="form[f.key]"
                          class="ag-input"
                          size="small"
                          :placeholder="f.placeholder"
                          :maxlength="f.maxlength"
                        />
                        <span v-if="f.counter" class="input-suffix">{{ fieldLength(f) }}/{{ f.counter }}</span>
                      </div>
                      <span v-if="f.unit" class="ml8">{{ f.unit }}</span>
                    </div>
                    <div v-if="f.wildcards" class="dl-wildcards">
                      <span class="dl-wildcards__label">通配符:</span>
                      <el-tooltip
                        v-for="w in f.wildcards"
                        :key="w.text"
                        :content="w.tip"
                        placement="top"
                      >
                        <el-button
                          class="dl-wildcard-btn"
                          text
                          size="small"
                          :disabled="!!w.disabled"
                          @click="insertWildcard(f, w)"
                        >
                          <el-icon><Plus /></el-icon><span>{{ w.text }}</span>
                        </el-button>
                      </el-tooltip>
                      <span class="dl-wildcards__more">插入更多</span>
                    </div>
                    <p v-if="f.tip" class="dl-tips">{{ f.tip }}</p>
                  </div>

                  <!-- 单选按钮组 -->
                  <el-radio-group v-else-if="f.type === 'radio'" v-model="form[f.key]" class="ag-radio">
                    <el-radio-button v-for="o in f.options" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </el-radio-button>
                  </el-radio-group>

                  <!-- 下拉选择 -->
                  <el-select
                    v-else-if="f.type === 'select'"
                    v-model="form[f.key]"
                    class="ag-select"
                    size="small"
                    filterable
                    :placeholder="f.placeholder"
                    @change="onDrawerChange(f)"
                  >
                    <el-option
                      v-for="o in f.options"
                      :key="o.value"
                      :label="o.label"
                      :value="o.value"
                    />
                  </el-select>

                  <!-- 级联选择（短剧类目） -->
                  <el-cascader
                    v-else-if="f.type === 'cascader'"
                    v-model="form[f.key]"
                    class="ag-select dl-cascader"
                    size="small"
                    clearable
                    filterable
                    :options="f.options"
                    :placeholder="f.placeholder"
                  />

                  <!-- 数字输入（集数 / 起始付费集数） -->
                  <div v-else-if="f.type === 'number'" class="dl-inline">
                    <el-input-number
                      v-model="form[f.key]"
                      class="dl-input-number"
                      size="small"
                      :min="f.min"
                      :max="f.max"
                      :step="f.step || 1"
                    />
                    <span v-if="f.unit" class="ml8">{{ f.unit }}</span>
                  </div>

                  <!-- 短剧ID（下拉 + 验证按钮） -->
                  <div v-else-if="f.type === 'drama-id'" class="dl-inline">
                    <el-select
                      v-model="form[f.key]"
                      class="ag-select"
                      size="small"
                      filterable
                      :placeholder="f.placeholder"
                      @change="onDramaChange"
                    >
                      <el-option v-for="o in dramaOptions" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                    <el-button class="ml8" size="small" plain :disabled="!form[f.key]" @click="verifyDrama">
                      验证
                    </el-button>
                  </div>

                  <!-- 推送账户（搜索 + 全选 + 账户勾选列表） -->
                  <div v-else-if="f.type === 'checkbox-panel'" class="dl-acct">
                    <div class="dl-acct__head">
                      <span class="left">媒体账户</span>
                      <el-button class="dl-refresh" text size="small" @click="refreshAccounts">
                        <el-icon><Refresh /></el-icon><span>刷新</span>
                      </el-button>
                    </div>
                    <div class="dl-acct__body">
                      <div class="dl-acct__search">
                        <el-input
                          v-model="accountKeyword"
                          size="small"
                          placeholder="请输入关键词"
                          @keyup.enter="applyAccountSearch"
                        >
                          <template #suffix><el-icon><Search /></el-icon></template>
                        </el-input>
                      </div>
                      <el-checkbox v-model="allAccountChecked" class="dl-acct__all" @change="toggleAllAccounts">
                        全选
                      </el-checkbox>
                      <el-checkbox-group v-model="form.advertiser_ids" class="dl-acct__list">
                        <el-checkbox
                          v-for="a in filteredAccounts"
                          :key="a.value"
                          :value="a.value"
                          class="dl-acct__item"
                        >{{ a.label }}</el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div class="drawer-footer">
            <div class="dialog-footer flex">
              <div class="operate-button">
                <el-button size="small" plain @click="drawerVisible = false">取 消</el-button>
                <el-button size="small" type="primary" @click="submitDrawer">确 定</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ⑦ 短剧资产准备说明弹窗 -->
    <el-dialog v-model="prepareVisible" title="短剧资产准备" width="640px" class="dl-modal">
      <div class="dl-prepare">
        <p>生成短剧推广链接前，需先完成短剧资产准备：</p>
        <ol>
          <li>确认短剧已在巨量广告·标准「短剧资产」中完成授权与绑定；</li>
          <li>确认所选剧场 / 渠道下的短剧已同步到巨量账户；</li>
          <li>短剧 ID 可在短剧资产列表中复制，用于「常读短剧ID」的下拉选择。</li>
        </ol>
        <p>详细操作可参考 <a class="dl-guide-link" :href="GUIDE_URL" target="_blank" rel="noopener">操作指引</a>。</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="prepareVisible = false">取 消</el-button>
            <el-button size="small" type="primary" @click="prepareVisible = false">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Plus, Refresh, Search } from '@element-plus/icons-vue';

/* ------------------------------------------------------------------
 * 创量标准版「巨量广告·标准 → 资产 → 短剧推广链接」（常读档）
 * 线上：https://cl.mobgi.com/property/toutiao/playlet-promotion-link/chang-du
 *
 * 线上结构（采集自 DOM）：
 *   - 二级页签：常读分销（默认选中）/ 点众分销
 *   - 筛选 4 项：分销商 / 短剧类型 / 剧场 / 渠道（均为单选下拉，线上无「清空」链接）
 *   - 关键词搜索：仅一个输入框，占位「请输入短剧ID」（无字段类型下拉）
 *   - 工具栏：新建推广链接（primary）/ 短剧资产准备（primary）/ 操作指引（外链）
 *   - 列表 5 列：推广链接 / 短剧 / 小程序路由 / 创建时间 / 操作
 *   - 抽屉「生成常读推广链接」：1016px、6 个分区
 * ------------------------------------------------------------------ */

const props = defineProps({ kind: { type: String, default: '' } });

const GUIDE_URL = 'https://chuangliang.feishu.cn/wiki/KpLvwbsC3idjOKkmzZEcSt0JnXp';

/* ------------------------------ 二级页签 ------------------------------ */
const SUB_TABS = [
  { key: 'changdu', label: '常读分销' },
  { key: 'dianzhong', label: '点众分销' },
];

const TAB_CONFIG = {
  changdu: {
    distributors: ['央广-免费漫剧'],
    dramaTypes: ['微信小程序短剧', '抖音小程序短剧', '抖音小程序免费短剧'],
    theaters: [
      '常读剧场-男频都市',
      '常读剧场-女频甜宠',
      '常读剧场-玄幻逆袭',
      '常读剧场-悬疑探案',
      '常读剧场-古装穿越',
    ],
    drawerTitle: '生成常读推广链接',
    dramaIdLabel: '常读短剧ID',
    shortCode: 'cd',
  },
  dianzhong: {
    distributors: ['点众-免费漫剧', '点众-付费短剧'],
    dramaTypes: ['微信小程序短剧', '抖音小程序短剧'],
    theaters: [
      '点众剧场-男频都市',
      '点众剧场-女频甜宠',
      '点众剧场-玄幻逆袭',
      '点众剧场-悬疑探案',
      '点众剧场-古装穿越',
    ],
    drawerTitle: '生成点众推广链接',
    dramaIdLabel: '点众短剧ID',
    shortCode: 'dz',
  },
};

const activeTab = ref('changdu');

/* ------------------------------ 下拉选项 ------------------------------ */
/** 线上为远程加载（无数据），本地 mock 一组 */
const CHANNELS = ['微信小程序', '抖音小程序', '快手小程序', '百度小程序'];

/** 短剧类目（cascader，线上远程加载） */
const DRAMA_CATEGORIES = [
  {
    value: '都市',
    label: '都市',
    children: [
      { value: '都市逆袭', label: '都市逆袭' },
      { value: '神豪日常', label: '神豪日常' },
      { value: '职场风云', label: '职场风云' },
    ],
  },
  {
    value: '爱情',
    label: '爱情',
    children: [
      { value: '甜宠日常', label: '甜宠日常' },
      { value: '豪门恩怨', label: '豪门恩怨' },
      { value: '闪婚总裁', label: '闪婚总裁' },
    ],
  },
  {
    value: '悬疑',
    label: '悬疑',
    children: [
      { value: '推理探案', label: '推理探案' },
      { value: '复仇爽文', label: '复仇爽文' },
    ],
  },
  {
    value: '幻想',
    label: '幻想',
    children: [
      { value: '穿越古代', label: '穿越古代' },
      { value: '玄幻修仙', label: '玄幻修仙' },
    ],
  },
];

/** 充值模板（线上远程加载，本地 mock） */
const RECHARGE_TEMPLATES = [
  { label: '标准充值模板', value: 'TPL_STD' },
  { label: '首充特惠模板', value: 'TPL_FIRST' },
  { label: '大额充值模板', value: 'TPL_BIG' },
];

/** 广告回传规则（占位即默认值「平台默认回传」） */
const AD_CALLBACK_RULES = [
  { label: '平台默认回传', value: 'DEFAULT' },
  { label: '仅回传付费事件', value: 'PAY_ONLY' },
  { label: '回传全部付费事件', value: 'ALL_PAY' },
];

/** 账户主体（线上「不限」为占位，选项为公司主体） */
const COMPANIES = [
  '北京高途云集教育科技有限公司',
  '北京百度网讯科技有限公司',
  '上海任意门科技有限公司',
  '上海得物信息集团有限公司',
  '北京智者天下科技有限公司',
  '上海置潮信息科技有限公司',
  '百度在线网络技术（北京）有限公司',
  '北京雷盟盛通文化发展有限公司',
  'UG-端原生IAA-漫剧-免费roi-24020',
  '北京智者天下科技有限公司北京第一分公司',
  '北京智者天下科技有限公司北京第二分公司',
  '北京笔墨留香科技有限公司海淀第一分公司',
];

/** 可推送的巨量账户（线上采集到的账户列表，去掉「全选」复选项） */
const ACCOUNT_OPTIONS = [
  '北京高途云集教育科技有限公司--1(1861811345880074)',
  '百度文库-央广时代-拉新-搜索-01(1866877399870663)',
  '百度文库-央广时代-拉新-搜索-02(1866877399203047)',
  '百度文库-央广时代-拉新-搜索-03(1866849651765706)',
  '任意门-央广-代运营-36-安卓-UBA(1866489873996443)',
  '任意门-央广-代运营-22-安卓-UBA(1866489858950211)',
  '任意门-央广-代运营-23-安卓-UBA(1866489859578696)',
  '任意门-央广-代运营-10-ios-UBA(1866489860302024)',
  '任意门-央广-代运营-25-ios-UBA(1866489860976135)',
  '任意门-央广-代运营-30-ios-UBA(1866489864776836)',
  '上海得物信息集团有限公司1-50(1834419631681163)',
  '任意门-央广-代运营-27-安卓-UBA(1866489862625304)',
  '任意门-央广-代运营-31-安卓-UBA(1866489865523527)',
  '任意门-央广-代运营-38-安卓-UBA(1866489874950667)',
  '任意门-央广-代运营-33-安卓-UBA(1866489872328266)',
  '任意门-央广-代运营-32-ios-UBA(1866489871677514)',
  '百度文库-央广时代-拉新-搜索-04(1866877401293188)',
  '任意门-央广-代运营-28-安卓-UBA(1866489863429463)',
  '任意门-央广-代运营-35-iOS-UBA(1866489873385099)',
  '央广-621059846-百度文库-1(1866877405575303)',
  '央广-621059846-百度文库-6(1866877402006227)',
  '百度文库-央广时代-拉新-uba-01(1866877400567892)',
  '央广-智者天下-知乎-APP内付费-03-6183-在投-转(1868960752026635)',
  '央广-智者天下-知乎-APP内付费-08-6183-在投-转(1868960753322139)',
  '央广-智者天下-知乎-APP内付费-16-6183-在投-转(1868960753916265)',
  '央广-智者天下-知乎-APP内付费-06-6183-在投-转(1868960756064715)',
  '央广-智者天下-知乎-APP内付费-05-6183-在投-转(1868960757562376)',
  '央广-智者天下-知乎-APP内付费-07-6183-在投-转(1868960761547972)',
  '央广-智者天下-知乎-APP内付费-02-6183-在投-转(1868960762380359)',
  '央广-智者天下-知乎-APP内付费-01-6183-在投-转(1868960763913927)',
  '央广-智者天下-知乎-APP内付费-15-6183-在投-转(1868960765999176)',
  '央广-智者天下-知乎-APP内付费-14-6183-在投-转(1868960766734343)',
  '央广-智者天下-知乎-APP内付费-13-6183-在投-转(1868960767518355)',
  '央广-智者天下-知乎-APP内付费-12-6183-在投-转(1868960769073763)',
  '央广-智者天下-知乎-APP内付费-04-6183-在投-转(1868960771191815)',
  '央广-智者天下-知乎-APP内付费-10-6183-在投-转(1870113308868874)',
  '央广-智者天下-知乎-APP内付费-11-6183-在投-转(1870113308236234)',
  '央广-智者天下-知乎-APP内付费-09-6183-在投-转(1870113307611547)',
  '央广-智者天下-知乎-APP内付费-33-753526183-在投-转(1870113297514763)',
  '央广-智者天下-知乎-APP内付费-38-753526183-在投-转(1870113296018891)',
  '央广-智者天下-知乎-APP内付费-44-753526183-在投-转(1870113303080970)',
  '央广-智者天下-知乎-APP内付费-15-753526183-在投(1874754018273287)',
  '央广-智者天下-知乎-APP内付费-15-729298364-在投(1874754447938632)',
  '央广-智者天下-知乎-APP内付费-17-729298364-在投(1874754449442116)',
  '央广-智者天下-知乎-APP内付费-18-729298364-在投(1874754450205768)',
  '央广-智者天下-知乎-APP内付费-19-729298364-在投(1874754450951507)',
  '央广-智者天下-知乎-APP内付费-20-729298364-在投(1874754451656216)',
  '央广-智者天下-知乎-APP内付费-753526183-在投-12(1874754014980488)',
  '央广-智者天下-知乎-APP内付费-7-753526183-在投(1874754007381674)',
  '央广-智者天下-知乎-APP内付费-6-753526183-在投(1874754007935194)',
  '央广-智者天下-知乎-APP内付费-5-753526183-在投(1874754008654922)',
  '央广-智者天下-知乎-APP内付费-4-753526183-在投(1874754009221130)',
  '央广-智者天下-知乎-APP内付费-3-753526183-在投(1874754010000394)',
  '央广-智者天下-知乎-APP内付费-2-753526183-在投(1874754010568137)',
  '央广-智者天下-知乎-APP内付费-1-753526183-在投(1874754011410761)',
  '央广-智者天下-知乎-APP内付费-7-729298364-在投(1874754437168132)',
  '央广-智者天下-知乎-APP内付费-6-729298364-在投(1874754437971971)',
  '央广-智者天下-知乎-APP内付费-4-729298364-在投(1874754439485512)',
  '央广-智者天下-知乎-APP内付费-3-729298364-在投(1874754440173128)',
  '央广-智者天下-知乎-APP内付费-2-729298364-在投(1874754440847048)',
  '央广-智者天下-知乎-APP内付费-1-729298364-在投(1874754441539460)',
  '央广-智者天下-知乎-APP内付费-9-753526183-在投(1874754024167047)',
  '央广-智者天下-知乎-APP内付费-10-753526183-在投(1874754024926596)',
  '央广-智者天下-知乎-APP内付费-11-753526183-在投(1874754025637127)',
  '央广-智者天下-知乎-APP内付费-12-753526183-在投(1874754026388487)',
  '央广-智者天下-知乎-APP内付费-13-753526183-在投(1874754027104259)',
  '央广-智者天下-知乎-APP内付费-14-753526183-在投(1874754027780100)',
  '央广-智者天下-知乎-APP内付费-753526183-在投-29(1874754028495044)',
  '央广-智者天下-知乎-APP内付费-729298364-在投-22(1874754453059098)',
  '央广-智者天下-知乎-APP内付费-14-729298364-在投(1874754453709546)',
  '央广-智者天下-知乎-APP内付费-13-729298364-在投(1874754454247691)',
  '央广-智者天下-知乎-APP内付费-12-729298364-在投(1874754454950921)',
  '央广-智者天下-知乎-APP内付费-11-729298364-在投(1874754455499290)',
  '央广-智者天下-知乎-APP内付费-10-729298364-在投(1874754456126249)',
  '央广-智者天下-知乎-APP内付费-9-729298364-在投(1874754456855898)',
  '央广-智者天下-知乎-APP内付费-38-753526183-在投(1874754035911945)',
  '央广-智者天下-知乎-APP内付费-39-753526183-在投(1874754036459529)',
  '央广-智者天下-知乎-APP内付费-41-753526183-在投(1874754037682665)',
  '央广-智者天下-知乎-APP内付费-42-753526183-在投(1874754038835209)',
  '央广-智者天下-知乎-APP内付费-36-729298364-在投(1874754462854218)',
  '央广-智者天下-知乎-APP内付费-37-729298364-在投(1874754463449099)',
  '央广-智者天下-知乎-APP内付费-39-729298364-在投(1874754464574793)',
  '央广-智者天下-知乎-APP内付费-40-729298364-在投(1874754465178699)',
  '央广-智者天下-知乎-APP内付费-41-729298364-在投(1874754465724425)',
  '央广-智者天下-知乎-APP内付费-42-729298364-在投(1874754466958474)',
  '央广-智者天下-知乎-APP内付费-46-753526183-在投(1874754041315337)',
  '央广-智者天下-知乎-APP内付费-59-753526183-在投(1874754051755015)',
  '央广-智者天下-知乎-APP内付费-60-753526183-在投(1874754052676040)',
  '央广-智者天下-知乎-APP内付费-61-753526183-在投(1874754053433864)',
  '央广-智者天下-知乎-APP内付费-62-753526183-在投(1874754059307463)',
  '央广-智者天下-知乎-APP内付费-63-753526183-在投(1874754060019923)',
  '央广-智者天下-知乎-APP内付费-64-753526183-在投(1874754060731591)',
  '央广-智者天下-知乎-APP内付费-66-753526183-在投(1874754062328839)',
  '央广-智者天下-知乎-APP内付费-68-753526183-在投(1874754064148483)',
  '央广-智者天下-知乎-APP内付费-69-753526183-在投(1874754064849160)',
  '央广-智者天下-知乎-APP内付费-70-753526183-在投(1874754065562888)',
  '央广-智者天下-知乎-APP内付费-71-753526183-在投(1874754066408263)',
  '央广-智者天下-知乎-APP内付费-037-729298364-在投(1874754467521242)',
  '央广-智者天下-知乎-APP内付费-030-729298364-在投(1874754468060171)',
  '央广-智者天下-知乎-APP内付费-038-729298364-在投(1874754468623754)',
];

/* ------------------------------ 列表 mock ------------------------------ */
const ROWS = {
  changdu: [
    { id: 1, link: 'https://changdu.mobgi.com/cdn/8f3a5c9e2b7d4610', drama_title: '重生之都市战神', drama_id: '7001234567890123', route: '/pages/drama/detail?drama_id=7001234567890123', created_at: '2026-11-18 10:24:36', distributor: '央广-免费漫剧', app_type: '微信小程序短剧', theater: '常读剧场-男频都市', channel: '微信小程序', episodes: 80, start_chapter: 8, price: '1.00' },
    { id: 2, link: 'https://changdu.mobgi.com/cdn/2c7e91b4d5a034f6', drama_title: '穿越王妃飒爆全场', drama_id: '7001234567890124', route: '/pages/drama/detail?drama_id=7001234567890124', created_at: '2026-11-18 09:12:05', distributor: '央广-免费漫剧', app_type: '抖音小程序短剧', theater: '常读剧场-古装穿越', channel: '抖音小程序', episodes: 60, start_chapter: 5, price: '0.99' },
    { id: 3, link: 'https://changdu.mobgi.com/cdn/6b1d0f37c9e28a53', drama_title: '闪婚老公竟是隐藏首富', drama_id: '7001234567890125', route: '/pages/drama/detail?drama_id=7001234567890125', created_at: '2026-11-17 18:41:57', distributor: '央广-免费漫剧', app_type: '微信小程序短剧', theater: '常读剧场-女频甜宠', channel: '微信小程序', episodes: 96, start_chapter: 10, price: '1.50' },
    { id: 4, link: 'https://changdu.mobgi.com/cdn/f4a8c206b1d739e5', drama_title: '龙王归来之最强佣兵', drama_id: '7001234567890126', route: '/pages/drama/detail?drama_id=7001234567890126', created_at: '2026-11-17 15:03:22', distributor: '央广-免费漫剧', app_type: '抖音小程序免费短剧', theater: '常读剧场-玄幻逆袭', channel: '抖音小程序', episodes: 72, start_chapter: 6, price: '0.00' },
    { id: 5, link: 'https://changdu.mobgi.com/cdn/91c7be35d0f84a26', drama_title: '穿书后我成了大反派', drama_id: '7001234567890127', route: '/pages/drama/detail?drama_id=7001234567890127', created_at: '2026-11-17 11:26:48', distributor: '央广-免费漫剧', app_type: '微信小程序短剧', theater: '常读剧场-悬疑探案', channel: '快手小程序', episodes: 55, start_chapter: 4, price: '1.00' },
    { id: 6, link: 'https://changdu.mobgi.com/cdn/3e5b09d7c2a146f8', drama_title: '萌宝助攻：顾总别跑', drama_id: '7001234567890128', route: '/pages/drama/detail?drama_id=7001234567890128', created_at: '2026-11-16 20:55:11', distributor: '央广-免费漫剧', app_type: '抖音小程序短剧', theater: '常读剧场-女频甜宠', channel: '抖音小程序', episodes: 88, start_chapter: 12, price: '1.20' },
    { id: 7, link: 'https://changdu.mobgi.com/cdn/7d2f613ab8c40e59', drama_title: '离婚当天我跪求复婚', drama_id: '7001234567890129', route: '/pages/drama/detail?drama_id=7001234567890129', created_at: '2026-11-16 16:38:29', distributor: '央广-免费漫剧', app_type: '微信小程序短剧', theater: '常读剧场-男频都市', channel: '微信小程序', episodes: 64, start_chapter: 7, price: '0.99' },
    { id: 8, link: 'https://changdu.mobgi.com/cdn/0a5c8e317b6d92f4', drama_title: '冰山总裁的替身新娘', drama_id: '7001234567890130', route: '/pages/drama/detail?drama_id=7001234567890130', created_at: '2026-11-16 09:47:03', distributor: '央广-免费漫剧', app_type: '抖音小程序免费短剧', theater: '常读剧场-女频甜宠', channel: '百度小程序', episodes: 70, start_chapter: 5, price: '0.00' },
    { id: 9, link: 'https://changdu.mobgi.com/cdn/e3f1b47d0c9a65e2', drama_title: '全网黑后我靠种田爆红', drama_id: '7001234567890131', route: '/pages/drama/detail?drama_id=7001234567890131', created_at: '2026-11-15 19:02:40', distributor: '央广-免费漫剧', app_type: '微信小程序短剧', theater: '常读剧场-男频都市', channel: '微信小程序', episodes: 52, start_chapter: 3, price: '1.00' },
    { id: 10, link: 'https://changdu.mobgi.com/cdn/b7c3d902e5a1486f', drama_title: '神医下山：开局退婚十分钟', drama_id: '7001234567890132', route: '/pages/drama/detail?drama_id=7001234567890132', created_at: '2026-11-15 14:31:57', distributor: '央广-免费漫剧', app_type: '抖音小程序短剧', theater: '常读剧场-玄幻逆袭', channel: '抖音小程序', episodes: 100, start_chapter: 15, price: '1.80' },
    { id: 11, link: 'https://changdu.mobgi.com/cdn/4e6a80c1f3b97d25', drama_title: '我在异界当农场主', drama_id: '7001234567890133', route: '/pages/drama/detail?drama_id=7001234567890133', created_at: '2026-11-14 17:22:14', distributor: '央广-免费漫剧', app_type: '抖音小程序免费短剧', theater: '常读剧场-玄幻逆袭', channel: '快手小程序', episodes: 46, start_chapter: 2, price: '0.00' },
    { id: 12, link: 'https://changdu.mobgi.com/cdn/1d9f50b7c8e246a3', drama_title: '总裁的隐婚娇妻', drama_id: '7001234567890134', route: '/pages/drama/detail?drama_id=7001234567890134', created_at: '2026-11-14 10:05:36', distributor: '央广-免费漫剧', app_type: '微信小程序短剧', theater: '常读剧场-女频甜宠', channel: '微信小程序', episodes: 58, start_chapter: 6, price: '1.00' },
  ],
  dianzhong: [
    { id: 101, link: 'https://dianzhong.mobgi.com/dzn/6a2c91f4e0b35d78', drama_title: '重回1998：我要当首富', drama_id: '7009876543210987', route: '/pages/drama/detail?drama_id=7009876543210987', created_at: '2026-11-18 11:02:18', distributor: '点众-免费漫剧', app_type: '微信小程序短剧', theater: '点众剧场-男频都市', channel: '微信小程序', episodes: 90, start_chapter: 9, price: '1.00' },
    { id: 102, link: 'https://dianzhong.mobgi.com/dzn/c81f37b05d2e469a', drama_title: '千亿继承人的马甲掉了', drama_id: '7009876543210988', route: '/pages/drama/detail?drama_id=7009876543210988', created_at: '2026-11-18 08:47:53', distributor: '点众-免费漫剧', app_type: '抖音小程序短剧', theater: '点众剧场-女频甜宠', channel: '抖音小程序', episodes: 76, start_chapter: 6, price: '0.99' },
    { id: 103, link: 'https://dianzhong.mobgi.com/dzn/3b7e0c94a5f18d26', drama_title: '被抛弃的她惊艳全球', drama_id: '7009876543210989', route: '/pages/drama/detail?drama_id=7009876543210989', created_at: '2026-11-17 19:16:05', distributor: '点众-付费短剧', app_type: '微信小程序短剧', theater: '点众剧场-男频都市', channel: '微信小程序', episodes: 68, start_chapter: 8, price: '1.50' },
    { id: 104, link: 'https://dianzhong.mobgi.com/dzn/f5a2d61b9c703e84', drama_title: '夫人她杀疯了', drama_id: '7009876543210990', route: '/pages/drama/detail?drama_id=7009876543210990', created_at: '2026-11-17 13:29:41', distributor: '点众-付费短剧', app_type: '抖音小程序短剧', theater: '点众剧场-女频甜宠', channel: '抖音小程序', episodes: 84, start_chapter: 10, price: '2.00' },
    { id: 105, link: 'https://dianzhong.mobgi.com/dzn/9c0b4e72d5a16f38', drama_title: '农门长嫂：带崽崽开荒', drama_id: '7009876543210991', route: '/pages/drama/detail?drama_id=7009876543210991', created_at: '2026-11-16 21:08:57', distributor: '点众-免费漫剧', app_type: '微信小程序短剧', theater: '点众剧场-古装穿越', channel: '快手小程序', episodes: 62, start_chapter: 5, price: '1.00' },
    { id: 106, link: 'https://dianzhong.mobgi.com/dzn/2e8f5a30c6b94d71', drama_title: '假千金归来碾压全场', drama_id: '7009876543210992', route: '/pages/drama/detail?drama_id=7009876543210992', created_at: '2026-11-16 10:51:09', distributor: '点众-免费漫剧', app_type: '抖音小程序短剧', theater: '点众剧场-女频甜宠', channel: '百度小程序', episodes: 66, start_chapter: 7, price: '0.99' },
    { id: 107, link: 'https://dianzhong.mobgi.com/dzn/7b4c1e08f3a65d92', drama_title: '冷面总裁的心尖宠', drama_id: '7009876543210993', route: '/pages/drama/detail?drama_id=7009876543210993', created_at: '2026-11-15 16:37:26', distributor: '点众-付费短剧', app_type: '微信小程序短剧', theater: '点众剧场-男频都市', channel: '微信小程序', episodes: 94, start_chapter: 12, price: '1.80' },
    { id: 108, link: 'https://dianzhong.mobgi.com/dzn/6d0f92b8c14a73e5', drama_title: '医妃惊华：太傅 he 不好惹', drama_id: '7009876543210994', route: '/pages/drama/detail?drama_id=7009876543210994', created_at: '2026-11-15 09:18:47', distributor: '点众-付费短剧', app_type: '抖音小程序短剧', theater: '点众剧场-古装穿越', channel: '抖音小程序', episodes: 78, start_chapter: 9, price: '1.60' },
  ],
};

/** 常读短剧ID 下拉（线上仅支持短剧ID搜索） */
const DRAMA_IDS = [
  { label: '7001234567890123', value: '7001234567890123' },
  { label: '7001234567890124', value: '7001234567890124' },
  { label: '7001234567890125', value: '7001234567890125' },
  { label: '7001234567890126', value: '7001234567890126' },
  { label: '7001234567890127', value: '7001234567890127' },
  { label: '7001234567890128', value: '7001234567890128' },
  { label: '7001234567890129', value: '7001234567890129' },
  { label: '7001234567890130', value: '7001234567890130' },
  { label: '7001234567890131', value: '7001234567890131' },
  { label: '7001234567890132', value: '7001234567890132' },
  { label: '7009876543210987', value: '7009876543210987' },
  { label: '7009876543210988', value: '7009876543210988' },
  { label: '7009876543210989', value: '7009876543210989' },
  { label: '7009876543210990', value: '7009876543210990' },
];

/** 历史任务（线上「引用历史任务」远程搜索，仅近 30 天） */
const HISTORY_TASKS = [
  { id: 'T20261118001', name: '常读剧场-男频都市-批量推广-20261118', promotionName: '常读男频都市批量推广-20261118' },
  { id: 'T20261117002', name: '常读剧场-女频甜宠-新剧上架-20261117', promotionName: '常读女频甜宠新剧-20261117' },
  { id: 'T20261116003', name: '常读免费漫剧-渠道补量-20261116', promotionName: '常读免费漫剧渠道补量-20261116' },
  { id: 'T20261115004', name: '抖音小程序短剧-抖音剧集-20261115', promotionName: '抖音小程序短剧-20261115' },
];

/* ------------------------------ 页面状态 ------------------------------ */
const rows = ref([...ROWS.changdu]);
const query = ref({ distributor: '央广-免费漫剧', app_type: '', theater: '', channel: '' });
const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(10);
const prepareVisible = ref(false);

/* ------------------------------ 筛选区 ------------------------------ */
const filters = computed(() => {
  const cfg = TAB_CONFIG[activeTab.value];
  return [
    { key: 'distributor', label: '分销商', placeholder: '请选择分销商', options: cfg.distributors },
    { key: 'app_type', label: '短剧类型', placeholder: '请选择短剧类型', options: cfg.dramaTypes },
    { key: 'theater', label: '剧场', placeholder: '请选择剧场', options: cfg.theaters },
    { key: 'channel', label: '渠道', placeholder: '请选择渠道', options: CHANNELS },
  ];
});

const filteredRows = computed(() => {
  const q = query.value;
  let out = rows.value;
  if (q.distributor) out = out.filter((r) => r.distributor === q.distributor);
  if (q.app_type) out = out.filter((r) => r.app_type === q.app_type);
  if (q.theater) out = out.filter((r) => r.theater === q.theater);
  if (q.channel) out = out.filter((r) => r.channel === q.channel);
  const kw = keyword.value.trim();
  if (kw) out = out.filter((r) => String(r.drama_id).indexOf(kw) > -1 || String(r.drama_title).indexOf(kw) > -1);
  return out;
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

watch(pageSize, () => { pageNo.value = 1; });

function onFilterChange() { pageNo.value = 1; }
function onSearch() { pageNo.value = 1; }

function switchTab(key) {
  if (activeTab.value === key) return;
  activeTab.value = key;
  query.value = { distributor: TAB_CONFIG[key].distributors[0], app_type: '', theater: '', channel: '' };
  keyword.value = '';
  rows.value = [...ROWS[key]];
  pageNo.value = 1;
}

/* ------------------------------ 列表操作 ------------------------------ */
function copyLink(row) {
  ElMessage.success(`已复制推广链接：${row.link}`);
}

async function removeRow(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.drama_title}」的推广链接吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
  } catch (e) {
    return;
  }
  rows.value = rows.value.filter((r) => r.id !== row.id);
  ElMessage.success('删除成功');
}

/* ------------------------------ 抽屉 ------------------------------ */
const drawerVisible = ref(false);
const editingRow = ref(null);
const accountKeyword = ref('');

const drawerTitle = computed(() => TAB_CONFIG[activeTab.value].drawerTitle);
const dramaOptions = computed(() => DRAMA_IDS);
const historyTasks = HISTORY_TASKS;

const TASK_NAME_PLACEHOLDER = '<短剧名称>-<日期>-<时间>';

function emptyForm() {
  return {
    history_task: '',
    task_name: '',
    allocation_method: 'ACCOUNT',
    promotion_name: '',
    app_type: '4',
    distributor_id: TAB_CONFIG[activeTab.value].distributors[0],
    theater_id: '',
    channel_id: '',
    drama_way: 'EXIST',
    book_id: '',
    tag_info: [],
    episode_count: 1,
    start_chapter: 2,
    price: '',
    recharge_template_id: '',
    ad_callback_config_id: '',
    volume_assist: '0',
    company: '',
    advertiser_ids: [],
  };
}

const form = ref(emptyForm());

const drawerSections = computed(() => {
  const cfg = TAB_CONFIG[activeTab.value];
  return [
    {
      title: '任务策略',
      fields: [
        {
          key: 'history_task',
          label: '引用历史任务',
          type: 'history-task',
          placeholder: '请输入任务名称搜索',
          tip: '选择近30天历史任务快速回显。',
        },
        {
          key: 'task_name',
          label: '自定义任务名称',
          type: 'text',
          required: true,
          placeholder: TASK_NAME_PLACEHOLDER,
          counter: 100,
          maxlength: 100,
          wildcards: [
            { text: '剧场名称', tip: '在任务名称中展示对应的剧场名称' },
            { text: '短剧名称', tip: '在任务名称中展示对应的短剧名称', disabled: true },
            { text: '渠道名称', tip: '在任务名称中展示对应的渠道名称' },
          ],
        },
      ],
    },
    {
      title: '推广链接基础设置',
      fields: [
        {
          key: 'allocation_method',
          label: '推广链接分配方式',
          type: 'radio',
          required: true,
          options: [
            { label: '所有账户使用同个链接', value: 'SAME' },
            { label: '每个账户使用一个链接', value: 'ACCOUNT' },
          ],
        },
        {
          key: 'promotion_name',
          label: '推广链接名称',
          type: 'text',
          placeholder: '',
          counter: 100,
          maxlength: 100,
          wildcards: [
            { text: '账户名称', tip: '在推广链接/小程序备注中展示对应的账户名称' },
            { text: '账户备注', tip: '在推广链接/小程序备注中展示对应的账户备注' },
            { text: '动态标号', tip: '在推广链接/小程序备注中展示对应的动态标号' },
          ],
          tip: '账户名称/账户备注仅支持中英文数字及“-”符号，下划线“_"会自动替换为“-”，其他特殊符号将自动过滤',
        },
      ],
    },
    {
      title: '小程序配置',
      fields: [
        {
          key: 'app_type',
          label: '短剧类型',
          type: 'radio',
          required: true,
          options: [
            { label: '微信小程序短剧', value: '4' },
            { label: '抖音小程序短剧', value: '7' },
            { label: '抖音小程序免费短剧', value: '10' },
          ],
        },
        {
          key: 'distributor_id',
          label: '分销商',
          type: 'select',
          placeholder: '请选择分销商',
          options: cfg.distributors.map((d) => ({ label: d, value: d })),
        },
        {
          key: 'theater_id',
          label: '剧场',
          type: 'select',
          required: true,
          placeholder: '请选择剧场',
          options: cfg.theaters.map((t) => ({ label: t, value: t })),
        },
        {
          key: 'channel_id',
          label: '渠道',
          type: 'select',
          required: true,
          placeholder: '请选择渠道',
          options: CHANNELS.map((c) => ({ label: c, value: c })),
        },
      ],
    },
    {
      title: '短剧配置',
      fields: [
        {
          key: 'drama_way',
          label: '短剧填写方式',
          type: 'radio',
          required: true,
          options: [
            { label: '选择已有', value: 'EXIST' },
            { label: '手动填写', value: 'MANUAL' },
          ],
        },
        {
          key: 'book_id',
          label: cfg.dramaIdLabel,
          type: 'drama-id',
          required: true,
          placeholder: '请选择短剧，仅支持短剧ID搜索',
        },
        {
          key: 'tag_info',
          label: '短剧类目',
          type: 'cascader',
          required: true,
          placeholder: '请选择',
          options: DRAMA_CATEGORIES,
        },
        {
          key: 'episode_count',
          label: '集数',
          type: 'number',
          required: true,
          min: 1,
          max: Infinity,
        },
      ],
    },
    {
      title: '推广链接设置',
      fields: [
        {
          key: 'start_chapter',
          label: '起始付费集数',
          type: 'number',
          required: true,
          min: 2,
          max: 100,
        },
        {
          key: 'price',
          label: '单集价格',
          type: 'text',
          required: true,
          placeholder: '',
          unit: '元',
        },
        {
          key: 'recharge_template_id',
          label: '充值模板（非必填）',
          type: 'select',
          placeholder: '请选择充值模板',
          options: RECHARGE_TEMPLATES,
        },
        {
          key: 'ad_callback_config_id',
          label: '广告回传规则（非必填）',
          type: 'select',
          placeholder: '平台默认回传',
          options: AD_CALLBACK_RULES,
        },
        {
          key: 'volume_assist',
          label: '起量助手',
          type: 'radio',
          required: true,
          options: [
            { label: '关闭', value: '0' },
            { label: '开启', value: '1' },
          ],
        },
      ],
    },
    {
      title: '推送到巨量账户',
      fields: [
        {
          key: 'company',
          label: '账户主体',
          type: 'select',
          placeholder: '不限',
          options: COMPANIES.map((c) => ({ label: c, value: c })),
        },
        {
          key: 'advertiser_ids',
          label: '选择推送账户',
          type: 'checkbox-panel',
          required: true,
          placeholder: '请输入关键词',
        },
      ],
    },
  ];
});

/* --------------------- 抽屉：账户勾选 --------------------- */
const accounts = ref(
  ACCOUNT_OPTIONS.map((label) => ({
    label,
    value: (label.match(/\((\d+)\)/) || [])[1] || label,
  })),
);

const filteredAccounts = computed(() => {
  const kw = accountKeyword.value.trim();
  if (!kw) return accounts.value;
  return accounts.value.filter((a) => a.label.indexOf(kw) > -1 || a.value.indexOf(kw) > -1);
});

const allAccountChecked = computed({
  get: () => filteredAccounts.value.length > 0
    && filteredAccounts.value.every((a) => form.value.advertiser_ids.indexOf(a.value) > -1),
  set: (v) => {
    if (v) {
      const add = filteredAccounts.value.map((a) => a.value);
      form.value.advertiser_ids = Array.from(new Set([...form.value.advertiser_ids, ...add]));
    } else {
      const remove = filteredAccounts.value.map((a) => a.value);
      form.value.advertiser_ids = form.value.advertiser_ids.filter((id) => remove.indexOf(id) === -1);
    }
  },
});

function toggleAllAccounts(v) {
  allAccountChecked.value = v;
}

function applyAccountSearch() {
  ElMessage.info(`已按「${accountKeyword.value}」筛选媒体账户`);
}

function refreshAccounts() {
  ElMessage.success('媒体账户列表已刷新');
}

/* --------------------- 抽屉：打开 / 回填 --------------------- */
function openDrawer(row) {
  editingRow.value = row || null;
  form.value = emptyForm();
  if (row) {
    form.value.task_name = row.drama_title;
    form.value.promotion_name = `${row.drama_title}-推广链接`;
    form.value.book_id = row.drama_id;
    form.value.distributor_id = row.distributor;
    form.value.theater_id = row.theater;
    form.value.channel_id = row.channel;
    form.value.episode_count = row.episodes;
    form.value.start_chapter = row.start_chapter;
    form.value.price = row.price;
    form.value.app_type = row.app_type === '微信小程序短剧' ? '4' : row.app_type === '抖音小程序短剧' ? '7' : '10';
  }
  drawerVisible.value = true;
}

function onHistoryChange(id) {
  const t = HISTORY_TASKS.find((x) => x.id === id);
  if (t) ElMessage.info(`已选择历史任务「${t.name}」，点击「复用」回填`);
}

function reuseHistoryTask() {
  const t = HISTORY_TASKS.find((x) => x.id === form.value.history_task);
  if (!t) {
    ElMessage.warning('请先选择历史任务');
    return;
  }
  form.value.task_name = t.name;
  form.value.promotion_name = t.promotionName;
  ElMessage.success('已复用历史任务');
}

function reuseLastTask() {
  const t = HISTORY_TASKS[0];
  form.value.history_task = t.id;
  form.value.task_name = t.name;
  form.value.promotion_name = t.promotionName;
  ElMessage.success('已引用上次任务');
}

function onDrawerChange(f) {
  if (f.key === 'distributor_id') form.value.theater_id = '';
}

function onDramaChange() {
  /* 选择短剧后自动带出类目 / 集数（原型联动） */
  if (form.value.book_id && !form.value.tag_info.length) {
    form.value.tag_info = ['都市', '都市逆袭'];
  }
}

function verifyDrama() {
  ElMessage.success('短剧ID校验通过');
}

function insertWildcard(f, w) {
  const token = `+${w.text}`;
  const cur = form.value[f.key] || '';
  form.value[f.key] = cur ? `${cur} ${token}` : token;
}

/** 字数统计：为空时按占位符长度统计（与线上一致：空值显示 16/100） */
function fieldLength(f) {
  const v = String(form.value[f.key] || '');
  if (v.length) return v.length;
  if (f.key === 'task_name') return TASK_NAME_PLACEHOLDER.length;
  return 0;
}

function submitDrawer() {
  const required = [
    { key: 'task_name', label: '自定义任务名称' },
    { key: 'allocation_method', label: '推广链接分配方式' },
    { key: 'app_type', label: '短剧类型' },
    { key: 'theater_id', label: '剧场' },
    { key: 'channel_id', label: '渠道' },
    { key: 'book_id', label: TAB_CONFIG[activeTab.value].dramaIdLabel },
    { key: 'tag_info', label: '短剧类目' },
    { key: 'episode_count', label: '集数' },
    { key: 'start_chapter', label: '起始付费集数' },
    { key: 'price', label: '单集价格' },
    { key: 'volume_assist', label: '起量助手' },
    { key: 'advertiser_ids', label: '选择推送账户' },
  ];
  for (const f of required) {
    const v = form.value[f.key];
    const empty = v === '' || v === null || v === undefined
      || (Array.isArray(v) && !v.length);
    if (empty) {
      ElMessage.warning(`请填写${f.label}`);
      return;
    }
  }
  const row = editingRow.value;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const payload = {
    task_name: form.value.task_name,
    promotion_name: form.value.promotion_name || form.value.task_name,
    distributor: form.value.distributor_id || TAB_CONFIG[activeTab.value].distributors[0],
    app_type: form.value.app_type === '4' ? '微信小程序短剧'
      : form.value.app_type === '7' ? '抖音小程序短剧' : '抖音小程序免费短剧',
    theater: form.value.theater_id,
    channel: form.value.channel_id,
    drama_id: form.value.book_id,
    episodes: form.value.episode_count,
    start_chapter: form.value.start_chapter,
    price: form.value.price,
  };
  if (row) {
    const idx = rows.value.findIndex((r) => r.id === row.id);
    if (idx > -1) rows.value[idx] = { ...rows.value[idx], ...payload };
    ElMessage.success('保存成功');
  } else {
    const cfg = TAB_CONFIG[activeTab.value];
    rows.value.unshift({
      id: Date.now(),
      link: `https://${cfg.shortCode}.mobgi.com/${cfg.shortCode}np/${Math.random().toString(16).slice(2, 18)}`,
      drama_title: form.value.task_name,
      created_at: stamp,
      ...payload,
    });
    ElMessage.success('生成成功');
  }
  drawerVisible.value = false;
}
</script>

<style scoped>
.dl-page { min-height: 100%; }

/* ---------- 二级页签（线上 ul.cl-minor-nav） ---------- */
.dl-tabs { margin-bottom: 12px; }
.dl-tabs .asset-sub-tab { height: 40px; line-height: 40px; }

/* ---------- 查询条件 ---------- */
.dl-filter-row { align-items: center; }
/* 线上筛选格为「标签 + 下拉」一个整体边框（下拉自身不描边） */
.dl-filter-row :deep(.el-select__wrapper) { box-shadow: none; }
.dl-filter-row :deep(.el-select__selection) { padding-left: 0; }
.dl-filter-row :deep(.el-input__wrapper) { box-shadow: none; }
.dl-search { display: flex; align-items: center; height: 28px; margin: 0 8px 8px 0; }
.dl-search-input { width: 188px; }
.dl-search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.dl-search-icon { cursor: pointer; color: #c0c4cc; }
.dl-search-icon:hover { color: #909399; }

/* ---------- 工具栏 ---------- */
.dl-toolbar { margin-bottom: 8px; }
/* 线上：新建推广链接 #66b1ff、短剧资产准备 #197afb */
.dl-btn-new { background: #66b1ff; border-color: #66b1ff; }
.dl-btn-new:hover, .dl-btn-new:focus { background: #8cc1ff; border-color: #8cc1ff; }
.dl-btn-prepare { background: #197afb; border-color: #197afb; }
.dl-btn-prepare:hover, .dl-btn-prepare:focus { background: #4b95ff; border-color: #4b95ff; }
.dl-guide-link { font-size: 12px; color: #197afb; text-decoration: none; }
.dl-guide-link:hover { text-decoration: underline; }

/* ---------- 列表 ---------- */
.dl-table { width: 100%; }
.dl-link-text { font-size: 12px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dl-pager { margin-top: 16px; }

/* ---------- 抽屉 ---------- */
.dl-drawer-inner { height: 100%; }
.dl-drawer-hd { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.dl-opt-link { color: #197afb; font-size: 12px; padding: 0; }
.dl-drawer-hd__right { display: flex; align-items: center; gap: 12px; }
/* 抽屉左缘悬浮关闭按钮（线上：蓝色方块 X） */
.dl-drawer-close {
  position: absolute; left: -36px; top: 0; z-index: 2;
  width: 36px; height: 36px; padding: 0;
  background: #197afb; color: #fff; border: 0; border-radius: 4px 0 0 4px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.dl-drawer-close:hover { background: #4b95ff; }
.dl-drawer-close :deep(.el-icon) { font-size: 18px; }
.dl-field { width: 100%; }
.dl-inline { display: flex; align-items: center; }
/* Element Plus 的 label-left 表单是 flex 布局，内容区不再叠加 144px 左边距（与线上一致） */
.dl-drawer-inner .cl-drawer-form :deep(.el-form-item__content) { margin-left: 0; }
.dl-input-wrap { position: relative; width: 360px; }
.dl-input-wrap.has-counter :deep(.el-input__inner) { padding-right: 30px; }
.dl-input-number { width: 360px; }
.dl-input-number :deep(.el-input__inner) { height: 32px; font-size: 13px; }
.dl-cascader { width: 360px; }
.dl-cascader :deep(.el-input__inner) { height: 32px; font-size: 13px; }
.dl-tips { margin: 6px 0 0; font-size: 12px; color: #909399; line-height: 18px; }

/* 通配符 */
.dl-wildcards { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.dl-wildcards__label { font-size: 12px; color: #909399; }
.dl-wildcard-btn { color: #197afb; font-size: 12px; padding: 0 4px; height: 20px; }
.dl-wildcard-btn :deep(span) { margin-left: 2px; }
.dl-wildcards__more { font-size: 12px; color: #197afb; cursor: pointer; margin-left: 8px; }

/* 推送账户面板 */
.dl-acct { width: 100%; }
.dl-acct__head { display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 8px; background: #fafafa; border: 1px solid #e8eaec; border-bottom: 0; }
.dl-acct__head .left { font-size: 12px; color: #333; }
.dl-refresh { color: #197afb; font-size: 12px; padding: 0; }
.dl-acct__body { width: 400px; height: 380px; border: 1px solid #e8eaec; display: flex; flex-direction: column; }
.dl-acct__search { padding: 8px; border-bottom: 1px solid #e8eaec; }
.dl-acct__search :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.dl-acct__all { padding: 6px 12px 0; font-size: 12px; }
.dl-acct__list { flex: 1; overflow-y: auto; padding: 0 12px 8px; }
.dl-acct__item { display: flex; height: 28px; font-size: 12px; color: #606266; }
.dl-acct__item :deep(.el-checkbox__label) { font-size: 12px; color: #606266; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 330px; }

/* ---------- 短剧资产准备弹窗 ---------- */
.dl-prepare { font-size: 13px; color: #606266; line-height: 22px; }
.dl-prepare ol { margin: 8px 0; padding-left: 20px; }
</style>

<!--
  抽屉通过 teleport 渲染到 body，Element Plus 内部节点不携带本组件的 scoped 属性，
  scoped 选择器无法命中；此处用本页独有的 .dl-drawer 前缀做全局覆盖。
-->
<style>
/* 线上抽屉：内容区无内边距，浅灰底，抽屉体不整体滚动（内部 .drawer-content 滚动） */
.dl-drawer .el-drawer__body { padding: 0; background: #f0f2f5; overflow: hidden; }

/* 线上选中态：浅蓝底 #d6eaff + 蓝字蓝边 #197afb（EP 2.14 主题变量优先级高于 assetPage.css） */
.dl-drawer .el-radio-button {
  --el-radio-button-checked-bg-color: #d6eaff;
  --el-radio-button-checked-text-color: #197afb;
  --el-radio-button-checked-border-color: #197afb;
}
.dl-drawer .el-radio-button.is-active .el-radio-button__original-radio:not(:disabled) + .el-radio-button__inner {
  background: #d6eaff; border-color: #197afb; color: #197afb; box-shadow: -1px 0 0 0 #197afb;
}
.dl-drawer .el-radio-button__inner { padding: 9px 12px; font-size: 12px; }
.dl-drawer .el-radio-button__orig-radio { display: none; }
</style>
