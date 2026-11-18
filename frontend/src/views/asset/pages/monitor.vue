<template>
  <div class="mon-page">
    <!-- ① 页面标题（线上 cl-minor-nav：监测活动，16px 粗体蓝字 + 3px 蓝色下划线） -->
    <div class="asset-title-bar mon-title-bar">
      <span class="asset-title mon-title">监测活动</span>
    </div>

    <!-- ② 推广目的（线上 .activity-type-filter：dim-label + el-radio-button 组 + 「应用推广」外链）
         注：线上这一行是「推广目的」筛选（简报里列为第 1 个筛选项「销售线索/小程序」），
             但样式上独立成行、没有外框；这里沿用 .filter-cell 的语义 class 并在下方样式里
             去掉边框/背景，保证与线上一致。 -->
    <div class="filter-cell mon-type-filter">
      <span class="mon-dim-label">推广目的：</span>
      <el-radio-group
        v-model="activityType"
        class="mon-type-radio"
        size="small"
        @change="onTypeChange"
      >
        <el-radio-button
          v-for="t in ACTIVITY_TYPES"
          :key="t.value"
          :value="t.value"
        >{{ t.label }}</el-radio-button>
      </el-radio-group>
      <a
        class="mon-opt-link"
        href="https://cl.mobgi.com/property/toutiao/subcontractor/activity"
        target="_blank"
        rel="noopener"
      >应用推广</a>
    </div>

    <!-- ③ 查询条件（线上 .mg-filter-wrapper.cl-filter：4 个下拉 + 关键词搜索 + 清空 + 右侧「设置」） -->
    <div class="mon-filter-row">
      <div class="filter-left">
        <div v-for="f in FILTERS" :key="f.key" class="filter-cell mon-cell">
          <label class="filter-label">{{ f.label }}：</label>
          <el-select
            v-model="query[f.key]"
            class="filter-select mon-select"
            size="small"
            :placeholder="f.placeholder"
            @change="onFilterChange"
          >
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
            <template v-if="f.more" #footer>
              <li
                class="el-select-dropdown__item el-select-dropdown__item--tips mon-more-item"
                @click.stop="onMoreAccounts"
              >搜索更多(303)...</li>
            </template>
          </el-select>
          <el-icon class="mon-icon-close" title="清空" @click="clearFilter(f.key)"><Close /></el-icon>
        </div>

        <!-- 关键词搜索（线上 cl-search-input：宽 280px，无字段类型下拉，批量搜索气泡 + 🔍） -->
        <div class="filter-cell mon-cell mon-search-cell">
          <el-input
            v-model="keyword"
            class="mon-search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix>
              <el-popover placement="bottom-end" :width="640" trigger="click" popper-class="mon-batch-popper">
                <template #reference>
                  <el-icon class="mon-batch-icon" title="批量搜索"><MoreFilled /></el-icon>
                </template>
                <div class="mon-batch">
                  <div class="mon-batch__hd">
                    <span class="mon-batch__title">请输入监测活动名（{{ batchText.length }}/1000）</span>
                  </div>
                  <div class="mon-batch__tip">每一行为一个关键词，批量搜索将执行精确匹配。</div>
                  <el-input
                    v-model="batchText"
                    type="textarea"
                    :rows="10"
                    resize="none"
                    placeholder="请粘贴或输入监测活动名，回车可换行"
                  />
                  <div class="batch-search-ops">
                    <el-button size="small" @click="batchText = ''">清空</el-button>
                    <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </template>
            <template #append>
              <el-button class="mon-search-btn" :icon="Search" title="搜索" @click="onSearch" />
            </template>
          </el-input>
        </div>

        <a class="filter-clear mon-clear" @click="clearFilters">清空</a>
      </div>

      <!-- 右侧「设置」（线上 w80 plain 按钮） -->
      <el-button size="small" plain class="tool-btn mon-setting-btn" @click="openSetting">设置</el-button>
    </div>

    <!-- ④ 功能按钮（线上 .table-toolbar） -->
    <div class="table-toolbar mon-toolbar">
      <el-button type="primary" size="small" class="tool-btn" @click="importVisible = true">导入监测活动</el-button>
      <el-button size="small" plain class="tool-btn" @click="openCreate">新建监测活动</el-button>
      <el-select
        v-model="batchOp"
        class="batch-select mon-batch-select"
        size="small"
        placeholder="批量操作"
        :disabled="!selectedRows.length"
        @change="onBatchOp"
      >
        <el-option v-for="o in BATCH_OPS" :key="o" :label="o" :value="o" />
      </el-select>
    </div>

    <!-- ⑤ 列表（线上 el-table--border：勾选列 + 监测活动名(固定左) + 6 列 + 操作(固定右)） -->
    <el-table
      :data="pagedList"
      row-key="id"
      border
      class="asset-table mon-table"
      :empty-text="'暂无数据'"
    >
      <el-table-column width="60" fixed="left" align="center" class-name="mon-sel-col">
        <template #header>
          <div class="mon-sel-hd">
            <el-checkbox
              :model-value="pageAllChecked"
              :indeterminate="pagePartial"
              @change="togglePageSelect"
            />
            <!-- 线上表头下拉：当前页 / 前50页 -->
            <el-dropdown trigger="click" @command="onRangeSelect">
              <span class="mon-sel-caret" title="选择范围"><el-icon><ArrowDown /></el-icon></span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="current">当前页</el-dropdown-item>
                  <el-dropdown-item command="first50">前50页</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 表头文本（与线上采集一致，仅供读屏/校验，视觉隐藏） -->
            <span class="mon-sr-only">当前页 前50页</span>
          </div>
        </template>
        <template #default="{ row }">
          <el-checkbox :model-value="isRowSelected(row)" @change="toggleRow(row)" />
        </template>
      </el-table-column>

      <el-table-column label="监测活动名" prop="name" width="294" fixed="left">
        <template #default="{ row }">
          <div class="desc-cell">
            <div class="desc-cell__title" :title="row.name">{{ row.name }}</div>
            <div class="desc-cell__desc" :title="row.activity_id">{{ row.activity_id }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="使用状态" prop="status" width="90">
        <template #default="{ row }">
          <span :class="row.status === '使用中' ? 'mon-status mon-status--on' : 'mon-status'">{{ row.status }}</span>
        </template>
      </el-table-column>

      <el-table-column label="产品" prop="product" width="233" show-overflow-tooltip />

      <el-table-column label="媒体账户" prop="account_name" width="292">
        <template #default="{ row }">
          <div class="desc-cell">
            <div class="desc-cell__title" :title="row.account_name">{{ row.account_name }}</div>
            <div class="desc-cell__desc" :title="row.account_id">{{ row.account_id }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="创建人员" prop="creator_name" width="175">
        <template #default="{ row }">
          <div class="desc-cell">
            <div class="desc-cell__title" :title="row.creator_name">{{ row.creator_name }}</div>
            <div class="desc-cell__desc" :title="row.creator_email">{{ row.creator_email }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" prop="create_time" width="233" show-overflow-tooltip />

      <el-table-column label="关联计划" prop="plan_count" width="146" align="right">
        <template #default="{ row }">{{ row.plan_count }}</template>
      </el-table-column>

      <el-table-column label="操作" width="204" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="onRowEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="onRowCopy(row)">复制</el-button>
          <el-button link type="primary" size="small" @click="onRowRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页（线上无数据故未渲染分页；本地 mock 数据按线上资产页口径补齐） -->
    <div class="pager-card mon-pager">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="filteredList.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ⑥ 新建监测活动（线上 el-dialog 800px / label 124px） -->
    <el-dialog
      v-model="createVisible"
      title="新建监测活动"
      width="800px"
      top="15vh"
      class="mon-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="createFormRef" :model="createForm" label-width="124px" label-position="left" size="small">
        <el-form-item label="推广目的">
          <el-radio-group v-model="createForm.activity_type" class="mon-type-radio mon-dialog-radio">
            <el-radio-button
              v-for="t in ACTIVITY_TYPES"
              :key="t.value"
              :value="t.value"
            >{{ t.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="监测活动名称" required>
          <el-input
            v-model="createForm.name"
            class="ag-input mon-dlg-input"
            maxlength="50"
            placeholder="活动名称不超过50个字"
          />
        </el-form-item>

        <el-form-item label="关联媒体账户">
          <el-select
            v-model="createForm.advertiser_id"
            class="ag-select mon-dlg-select"
            size="small"
            placeholder="不限"
          >
            <el-option v-for="a in DIALOG_ACCOUNTS" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="智投项目（选填）">
          <el-select
            v-model="createForm.project_id"
            class="ag-select mon-dlg-select"
            size="small"
            placeholder="不限"
          >
            <el-option v-for="p in PROJECTS" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>

        <el-form-item v-for="f in LINK_FIELDS" :key="f.key" :label="f.label">
          <el-input v-model="createForm[f.key]" class="ag-input mon-dlg-input" :placeholder="f.placeholder" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" @click="createVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="submitCreate">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑦ 导入监测活动（线上 el-dialog 800px） -->
    <el-dialog
      v-model="importVisible"
      title="导入监测活动"
      width="800px"
      top="15vh"
      class="mon-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="124px" label-position="left" size="small">
        <div class="mon-import-tip">
          <el-icon class="mon-warn-icon"><WarningFilled /></el-icon>表格单次导入行数不得超过1w行
        </div>
        <el-form-item label="推广目的">
          <el-radio-group v-model="importType" class="mon-type-radio mon-dialog-radio">
            <el-radio-button
              v-for="t in ACTIVITY_TYPES"
              :key="t.value"
              :value="t.value"
            >{{ t.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="获取模板文件">
          <el-button type="primary" size="small" @click="onDownloadTemplate">点击下载</el-button>
        </el-form-item>
        <el-form-item label="导入文件" required>
          <div class="mon-upload">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="onFileChange"
            >
              <el-button type="primary" size="small">点击上传</el-button>
            </el-upload>
            <span class="mon-upload-tip">目前仅支持xlsx文件格式</span>
            <span v-if="importFile" class="mon-upload-file">{{ importFile.name }}</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" @click="importVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="submitImport">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑧ 设置（线上 el-dialog 800px：监测活动禁用 / 监测组命名 / 通配符） -->
    <el-dialog
      v-model="settingVisible"
      title="设置"
      width="800px"
      top="15vh"
      class="mon-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="96px" label-position="left" size="small">
        <el-form-item label="监测活动禁用">
          <el-radio-group v-model="settingForm.disabled" class="mon-type-radio mon-dialog-radio">
            <el-radio-button value="disable">不开启</el-radio-button>
            <el-radio-button value="enable">开启</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="监测组命名" required>
          <div class="ag-input-wrap mon-name-wrap" :class="{ 'has-counter': true }">
            <el-input v-model="settingForm.convertName" class="ag-input" maxlength="50" />
            <span class="input-suffix">{{ settingForm.convertName.length }}/50</span>
          </div>
          <div class="mon-tags">
            <span class="mon-tag-desc">通配符:</span>
            <span class="mon-name-tag is-selected">监测活动名</span>
            <span class="mon-name-tag" @click="toggleTag('渠道包名')">渠道包名</span>
            <span class="mon-name-tag" @click="toggleTag('转化目标')">转化目标</span>
            <el-dropdown trigger="click" @command="onMoreTag">
              <span class="mon-insert-more">插入更多</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="时间戳" disabled>时间戳</el-dropdown-item>
                  <el-dropdown-item command="随机数" disabled>随机数</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" @click="settingVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="submitSetting">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑨ 批量修改（修改产品 / 修改媒体账户 / 修改智投项目） -->
    <el-dialog
      v-model="batchVisible"
      :title="batchDialogTitle"
      width="520px"
      top="15vh"
      class="mon-dialog"
      :close-on-click-modal="false"
    >
      <el-form label-width="110px" label-position="left" size="small">
        <el-form-item :label="batchDialogLabel">
          <el-select v-model="batchValue" class="mon-dlg-select" size="small" :placeholder="batchDialogPlaceholder">
            <el-option v-for="o in batchDialogOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" @click="batchVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="submitBatch">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, Close, MoreFilled, Search, WarningFilled } from '@element-plus/icons-vue';

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------
 * 创量标准版「巨量广告·标准 → 资产 → 监测活动」
 * 线上：https://cl.mobgi.com/property/toutiao/activity/index
 *
 * 线上 DOM 实测要点（本次已用线上只读探查逐项核对）：
 *   - 页头 cl-minor-nav 只有一项「监测活动」
 *   - .activity-type-filter：dim-label「推广目的：」+ el-radio-button 组
 *     （销售线索/小程序=6 / 电商=5 / 商品=3 / 快应用=4 / 内容营销=9）
 *     + 外链「应用推广」(/property/toutiao/subcontractor/activity)
 *   - .mg-filter-wrapper.cl-filter：创建人员/媒体账户/智投项目/产品 四个下拉
 *     （占位 全部/全部/全部/所有产品，每个下拉右侧带独立清空 ✕）
 *     + 关键词输入（280px，占位「请输入关键词」，带批量搜索气泡 + 🔍）
 *     + 「清空」链接 + 右侧「设置」按钮
 *   - .table-toolbar：导入监测活动(primary) / 新建监测活动(is-plain)
 *     / 批量操作(el-select w120，未勾选置灰；选项：删除、复制、修改产品、
 *     修改媒体账户、修改智投项目)
 *   - 表格：勾选列 60px（表头为勾选框 + 「当前页/前50页」下拉）、
 *     监测活动名 294px(固定左,双行) 、使用状态 90、产品 233、媒体账户 292、
 *     创建人员 175、创建时间 233、关联计划 146(右对齐)、操作 204(固定右)
 *   - 「新建监测活动」为 el-dialog（宽 800px、label 124px、footer 取消/确 定）
 *   - 「导入监测活动」「设置」同为 el-dialog（宽 800px）
 * ------------------------------------------------------------------ */

/* ------------------------------ 线上枚举 ------------------------------ */

/** 推广目的（线上 value：6/5/3/4/9） */
const ACTIVITY_TYPES = [
  { value: '6', label: '销售线索/小程序' },
  { value: '5', label: '电商' },
  { value: '3', label: '商品' },
  { value: '4', label: '快应用' },
  { value: '9', label: '内容营销' },
];

/** 创建人员（线上 15 项） */
const CREATORS = [
  { name: '北京央广时代文化传播有限公司', email: 'liuziyuan01@ygsdmedia.com' },
  { name: '张从浩', email: 'zhangconghao@ygsdmedia.com' },
  { name: '王春雷', email: 'wangchunlei@ygsdmedia.com' },
  { name: '郭峻宇', email: 'guojunyu@ygsdmedia.com' },
  { name: '孙诗源', email: 'sunshiyuan@ygsdmedia.com' },
  { name: 'gongwenqing', email: 'gongwenqing@ygsdmedia.com' },
  { name: 'lixue', email: 'lixue@ygsdmedia.com' },
  { name: 'jiangxin', email: 'jiangxin@ygsdmedia.com' },
  { name: 'chenpeihua', email: 'chenpeihua@ygsdmedia.com' },
  { name: '1304275504', email: '1304275504@qq.com' },
  { name: '文清滨', email: 'wenqingbin@ygsdmedia.com' },
  { name: '李若涵', email: 'liruohan@ygsdmedia.com' },
  { name: '杨浩蒙', email: 'yanghaomeng@ygsdmedia.com' },
  { name: '刘松涵', email: 'liusonghan01@ygsdmedia.com' },
  { name: '申旭阳', email: 'shenxuyang@ygsdmedia.com' },
];

/** 媒体账户（线上 10 项 + 「搜索更多(303)…」） */
const ACCOUNTS = [
  { name: '北京高途云集教育科技有限公司--1', id: '1861811345880074' },
  { name: '百度文库-央广时代-拉新-搜索-01', id: '1866877399870663' },
  { name: '百度文库-央广时代-拉新-搜索-02', id: '1866877399203047' },
  { name: '百度文库-央广时代-拉新-搜索-03', id: '1866849651765706' },
  { name: '任意门-央广-代运营-36-安卓-UBA', id: '1866489873996443' },
  { name: '任意门-央广-代运营-22-安卓-UBA', id: '1866489858950211' },
  { name: '任意门-央广-代运营-23-安卓-UBA', id: '1866489859578696' },
  { name: '任意门-央广-代运营-10-ios-UBA', id: '1866489860302024' },
  { name: '任意门-央广-代运营-25-ios-UBA', id: '1866489860976135' },
  { name: '任意门-央广-代运营-30-ios-UBA', id: '1866489864776836' },
];

/** 智投项目 */
const PROJECTS = ['知乎小说', '漫剧端原生', 'soul', '百度文库'];

/** 产品 */
const PRODUCTS = ['测试安卓应用(android)', '测试商品', '无'];

/** 批量操作（线上 el-select 的 5 个选项） */
const BATCH_OPS = ['删除', '复制', '修改产品', '修改媒体账户', '修改智投项目'];

/** 新建弹窗中的 5 个监测链接字段 */
const LINK_FIELDS = [
  { key: 'show_monitor_link', label: '展示监测链接', placeholder: '请输入展示监测链接，仅支持https传输协议' },
  { key: 'click_monitor_link', label: '有效触点链接', placeholder: '请输入有效触点链接，仅支持https传输协议' },
  { key: 'video_play_link', label: '视频播放链接', placeholder: '请输入视频播放链接，仅支持https传输协议' },
  { key: 'video_finish_link', label: '视频播完链接', placeholder: '请输入视频播完链接，仅支持https传输协议' },
  { key: 'video_valid_play_link', label: '视频有效播放链接', placeholder: '请输入视频有效播放链接，仅支持https传输协议' },
];

const creatorLabels = CREATORS.map((c) => `${c.name} (${c.email})`);
const accountLabels = ACCOUNTS.map((a) => `${a.name} (${a.id})`);

/** 查询条件（线上 4 项） */
const FILTERS = [
  { key: 'creator', label: '创建人员', placeholder: '全部', options: creatorLabels },
  { key: 'account', label: '媒体账户', placeholder: '全部', options: ['不限', ...accountLabels], more: true },
  { key: 'project', label: '智投项目', placeholder: '全部', options: PROJECTS },
  { key: 'product', label: '产品', placeholder: '所有产品', options: PRODUCTS },
];

/** 新建弹窗里的媒体账户下拉（线上 20 项 + 搜索更多） */
const DIALOG_ACCOUNTS = ACCOUNTS.map((a) => ({ value: a.id, label: `${a.name}(${a.id})` }));

/* ------------------------------ mock 数据 ------------------------------ */

/** 各推广目的下的活动名/产品池（切换推广目的后数据与产品列都会变） */
const TYPE_MOCK = {
  6: {
    products: ['测试安卓应用(android)', '无'],
    names: [
      '知乎小说-拉新线索监测', '百度文库-表单线索监测', 'soul-私信线索监测',
      '漫剧端原生-小程序线索监测', '高途课堂-留资线索监测',
    ],
  },
  5: {
    products: ['测试商品', '无'],
    names: [
      '测试商品-电商订单监测', '知乎小说-电商带货监测', '百度文库-商城下单监测',
      'soul-好物电商监测', '漫剧端原生-付费订单监测',
    ],
  },
  3: {
    products: ['测试商品', '无'],
    names: [
      '测试商品-商品详情监测', '测试商品-商品加购监测', '知乎小说-商品曝光监测',
      '百度文库-商品点击监测', 'soul-商品下单监测',
    ],
  },
  4: {
    products: ['测试安卓应用(android)', '无'],
    names: [
      '测试安卓应用-快应用拉起监测', '测试安卓应用-快应用下单监测', 'soul-快应用唤起监测',
      '知乎小说-快应用注册监测', '百度文库-快应用落地监测',
    ],
  },
  9: {
    products: ['无', '测试安卓应用(android)'],
    names: [
      '知乎小说-内容种草监测', '百度文库-内容阅读监测', 'soul-内容互动监测',
      '漫剧端原生-短剧播放监测', '高途课堂-课程观看监测',
    ],
  },
};

function pad(n) { return String(n).padStart(2, '0'); }

function buildRows(type) {
  const cfg = TYPE_MOCK[type];
  const rows = [];
  for (let i = 0; i < 26; i += 1) {
    const creator = CREATORS[(i + Number(type)) % CREATORS.length];
    const account = ACCOUNTS[(i * 3 + Number(type)) % ACCOUNTS.length];
    const project = PROJECTS[(i + Number(type)) % PROJECTS.length];
    const d = new Date(2024, 0, 1 + i * 3 + Number(type), 9 + (i % 9), (i * 7) % 60, (i * 13) % 60);
    rows.push({
      id: `${type}-${i}`,
      name: `${cfg.names[i % cfg.names.length]}-${pad(i + 1)}`,
      activity_id: `18660${Number(type)}${String(1000000 + i * 137).slice(0, 8)}`,
      status: i % 3 === 0 ? '使用中' : '未使用',
      product: cfg.products[i % cfg.products.length],
      account_name: account.name,
      account_id: account.id,
      creator_name: creator.name,
      creator_email: creator.email,
      project,
      create_time: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      plan_count: (i * 3) % 9,
    });
  }
  return rows;
}

/** 所有推广目的的数据（切换推广目的时取对应子集） */
const ALL_ROWS = reactive(ACTIVITY_TYPES.reduce((acc, t) => {
  acc[t.value] = buildRows(t.value);
  return acc;
}, {}));

/* ------------------------------ 状态 ------------------------------ */

const activityType = ref('6');
const query = ref({ creator: '', account: '', project: '', product: '' });
const keyword = ref('');
const batchText = ref('');

const selectedRows = ref([]);
const pageNo = ref(1);
const pageSize = ref(10);
const batchOp = ref('');

/* 新建弹窗 */
const createVisible = ref(false);
const createFormRef = ref();
const createForm = ref(emptyCreateForm());

/* 导入弹窗 */
const importVisible = ref(false);
const importType = ref('6');
const importFile = ref(null);

/* 设置弹窗 */
const settingVisible = ref(false);
const settingForm = ref({ disabled: 'disable', convertName: '', tags: ['监测活动名'] });

/* 批量修改弹窗 */
const batchVisible = ref(false);
const batchOpTitle = ref('');
const batchField = ref('');
const batchValue = ref('');

function emptyCreateForm() {
  return {
    activity_type: '6',
    name: '',
    advertiser_id: '',
    project_id: '',
    show_monitor_link: '',
    click_monitor_link: '',
    video_play_link: '',
    video_finish_link: '',
    video_valid_play_link: '',
  };
}

/* ------------------------------ 计算 ------------------------------ */

/** 当前推广目的下的全部数据 */
const typeRows = computed(() => ALL_ROWS[activityType.value] || []);

/** 筛选 + 关键词过滤后的列表 */
const filteredList = computed(() => {
  const q = query.value;
  let rows = typeRows.value;
  if (q.creator) rows = rows.filter((r) => `${r.creator_name} (${r.creator_email})` === q.creator);
  if (q.account && q.account !== '不限') rows = rows.filter((r) => `${r.account_name} (${r.account_id})` === q.account);
  if (q.project) rows = rows.filter((r) => r.project === q.project);
  if (q.product) rows = rows.filter((r) => r.product === q.product);
  const kw = (keyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => keys.some((k) => r.name.indexOf(k) > -1 || r.account_name.indexOf(k) > -1));
  }
  return rows;
});

const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

/* 勾选状态 */
function isRowSelected(row) {
  return selectedRows.value.some((r) => r.id === row.id);
}
const pageAllChecked = computed(
  () => pagedList.value.length > 0 && pagedList.value.every((r) => isRowSelected(r)),
);
const pagePartial = computed(
  () => pagedList.value.some((r) => isRowSelected(r)) && !pageAllChecked.value,
);

function toggleRow(row) {
  const idx = selectedRows.value.findIndex((r) => r.id === row.id);
  if (idx > -1) selectedRows.value.splice(idx, 1);
  else selectedRows.value.push(row);
}
function togglePageSelect() {
  if (pageAllChecked.value) {
    const ids = pagedList.value.map((r) => r.id);
    selectedRows.value = selectedRows.value.filter((r) => !ids.includes(r.id));
  } else {
    const merged = [...selectedRows.value];
    pagedList.value.forEach((r) => {
      if (!merged.some((x) => x.id === r.id)) merged.push(r);
    });
    selectedRows.value = merged;
  }
}
/** 表头下拉：当前页 / 前50页 */
function onRangeSelect(cmd) {
  if (cmd === 'current') {
    togglePageSelect();
  } else {
    selectedRows.value = [...filteredList.value];
  }
  ElMessage.success(`已选中 ${selectedRows.value.length} 条数据`);
}

/* ------------------------------ 方法 ------------------------------ */

function onTypeChange() {
  pageNo.value = 1;
  selectedRows.value = [];
  batchOp.value = '';
}

function onFilterChange() {
  pageNo.value = 1;
}

function clearFilter(key) {
  query.value[key] = '';
  pageNo.value = 1;
}

function clearFilters() {
  query.value = { creator: '', account: '', project: '', product: '' };
  keyword.value = '';
  batchText.value = '';
  pageNo.value = 1;
  ElMessage.info('已清空筛选条件');
}

function onSearch() {
  pageNo.value = 1;
}

function applyBatchSearch() {
  keyword.value = batchText.value;
  pageNo.value = 1;
}

function onMoreAccounts() {
  ElMessage.info('线上「搜索更多(303)…」：此处为本地 mock，仅提示');
}

/* ------------------------------ 新建监测活动 ------------------------------ */

function openCreate() {
  createForm.value = emptyCreateForm();
  createForm.value.activity_type = activityType.value;
  createVisible.value = true;
}

function submitCreate() {
  const form = createForm.value;
  if (!String(form.name || '').trim()) {
    ElMessage.warning('请填写监测活动名称');
    return;
  }
  if (String(form.name).length > 50) {
    ElMessage.warning('活动名称不超过50个字');
    return;
  }
  const bad = LINK_FIELDS.find((f) => form[f.key] && !/^https:\/\//i.test(String(form[f.key]).trim()));
  if (bad) {
    ElMessage.warning(`${bad.label}仅支持https传输协议`);
    return;
  }
  const account = ACCOUNTS.find((a) => a.id === form.advertiser_id);
  const row = {
    id: `new-${Date.now()}`,
    name: form.name,
    activity_id: `18660${Date.now()}`.slice(0, 15),
    status: '未使用',
    product: '无',
    account_name: account ? account.name : '不限',
    account_id: account ? account.id : '',
    creator_name: '本地管理员',
    creator_email: 'admin@ygsdmedia.com',
    project: form.project_id || '',
    create_time: nowText(),
    plan_count: 0,
  };
  ALL_ROWS[activityType.value].unshift(row);
  createVisible.value = false;
  ElMessage.success('新建成功');
}

function nowText() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ------------------------------ 导入监测活动 ------------------------------ */

function onFileChange(file) {
  importFile.value = file;
}

function onDownloadTemplate() {
  ElMessage.success('模板文件下载中…（线上为 xlsx 模板）');
}

function submitImport() {
  if (!importFile.value) {
    ElMessage.warning('请上传导入文件');
    return;
  }
  importVisible.value = false;
  importFile.value = null;
  ElMessage.success('导入任务已提交，请稍后在任务中心查看');
}

/* ------------------------------ 设置 ------------------------------ */

function openSetting() {
  settingVisible.value = true;
}

function toggleTag(tag) {
  const tags = settingForm.value.tags;
  const i = tags.indexOf(tag);
  if (i > -1) tags.splice(i, 1);
  else tags.push(tag);
}

function onMoreTag() {
  ElMessage.info('线上「插入更多」中的时间戳 / 随机数当前不可用');
}

function submitSetting() {
  if (!String(settingForm.value.convertName || '').trim()) {
    ElMessage.warning('请填写监测组命名');
    return;
  }
  settingVisible.value = false;
  ElMessage.success('设置已保存');
}

/* ------------------------------ 批量 / 行内操作 ------------------------------ */

const BATCH_DIALOGS = {
  修改产品: { label: '产品', placeholder: '所有产品', options: PRODUCTS, field: 'product' },
  修改媒体账户: { label: '媒体账户', placeholder: '不限', options: ['不限', ...accountLabels], field: 'account' },
  修改智投项目: { label: '智投项目', placeholder: '不限', options: PROJECTS, field: 'project' },
};

const batchDialogTitle = computed(() => (batchOpTitle.value ? `批量${batchOpTitle.value}` : '批量操作'));
const batchDialogLabel = computed(() => (BATCH_DIALOGS[batchOpTitle.value] || {}).label || '');
const batchDialogPlaceholder = computed(() => (BATCH_DIALOGS[batchOpTitle.value] || {}).placeholder || '请选择');
const batchDialogOptions = computed(() => (BATCH_DIALOGS[batchOpTitle.value] || {}).options || []);

function onBatchOp(op) {
  const rows = selectedRows.value;
  batchOp.value = '';
  if (!rows.length) {
    ElMessage.warning('请先勾选数据');
    return;
  }
  if (op === '删除') {
    ElMessageBox.confirm(`确认删除选中的 ${rows.length} 条监测活动吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
      .then(() => {
        const ids = rows.map((r) => r.id);
        ALL_ROWS[activityType.value] = ALL_ROWS[activityType.value].filter((r) => !ids.includes(r.id));
        selectedRows.value = [];
        pageNo.value = 1;
        ElMessage.success('已删除');
      })
      .catch(() => {});
    return;
  }
  if (op === '复制') {
    const clones = rows.map((r) => ({
      ...r,
      id: `copy-${r.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${r.name}-复制`,
      status: '未使用',
      create_time: nowText(),
      plan_count: 0,
    }));
    ALL_ROWS[activityType.value] = [...clones, ...ALL_ROWS[activityType.value]];
    selectedRows.value = [];
    pageNo.value = 1;
    ElMessage.success(`已复制 ${clones.length} 条监测活动`);
    return;
  }
  batchOpTitle.value = op;
  batchField.value = (BATCH_DIALOGS[op] || {}).field || '';
  batchValue.value = '';
  batchVisible.value = true;
}

function submitBatch() {
  const cfg = BATCH_DIALOGS[batchOpTitle.value] || {};
  if (!batchValue.value) {
    ElMessage.warning(`请选择${cfg.label || ''}`);
    return;
  }
  const rows = selectedRows.value;
  const ids = rows.map((r) => r.id);
  ALL_ROWS[activityType.value] = ALL_ROWS[activityType.value].map((r) => {
    if (!ids.includes(r.id)) return r;
    const next = { ...r };
    if (cfg.field === 'product') next.product = batchValue.value;
    else if (cfg.field === 'project') next.project = batchValue.value;
    else if (cfg.field === 'account') {
      const acc = ACCOUNTS.find((a) => `${a.name} (${a.id})` === batchValue.value);
      if (acc) {
        next.account_name = acc.name;
        next.account_id = acc.id;
      }
    }
    return next;
  });
  batchVisible.value = false;
  selectedRows.value = [];
  ElMessage.success(`已对 ${rows.length} 条监测活动执行「${batchOpTitle.value}」`);
}

function onRowEdit(row) {
  ElMessage.info(`原型：编辑监测活动「${row.name}」`);
}

function onRowCopy(row) {
  ALL_ROWS[activityType.value].unshift({
    ...row,
    id: `copy-${row.id}-${Date.now()}`,
    name: `${row.name}-复制`,
    status: '未使用',
    create_time: nowText(),
    plan_count: 0,
  });
  ElMessage.success('已复制');
}

function onRowRemove(row) {
  ElMessageBox.confirm(`确认删除监测活动「${row.name}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
    .then(() => {
      ALL_ROWS[activityType.value] = ALL_ROWS[activityType.value].filter((r) => r.id !== row.id);
      selectedRows.value = selectedRows.value.filter((r) => r.id !== row.id);
      ElMessage.success('已删除');
    })
    .catch(() => {});
}
</script>

<style scoped>
/* ---------- 页面骨架（外层 .asset-page 已提供 16px 内边距，这里不再重复） ---------- */
.mon-page { min-height: 100%; box-sizing: border-box; background: #fff; }

/* ---------- 页面标题（线上 cl-minor-nav：48px、16px 粗体蓝字 + 3px 蓝色下划线） ---------- */
.mon-title-bar { height: 48px; padding: 0; display: flex; align-items: flex-end; }
.mon-title {
  display: inline-block; height: 48px; line-height: 45px;
  font-size: 16px; font-weight: 700; color: #197afb;
  border-bottom: 3px solid #197afb;
}

/* ---------- 推广目的（线上 .activity-type-filter：独立成行、无外框） ---------- */
.mon-type-filter {
  display: flex; align-items: center; height: auto; margin: 0;
  padding: 8px 0 12px; background: transparent; border: 0; border-radius: 0;
}
.mon-dim-label { font-size: 14px; color: #333; margin-right: 8px; }
.mon-opt-link { font-size: 12px; color: #197afb; text-decoration: none; margin-left: 16px; }
.mon-opt-link:hover { text-decoration: underline; }

/* 单选按钮组（线上：选中为蓝框蓝字，未选中灰框黑字） */
.mon-type-radio :deep(.el-radio-button__inner) {
  padding: 9px 12px; font-size: 14px; color: #333; background: #fff;
  border-color: #dcdfe6; box-shadow: none;
}
.mon-type-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #fff; border-color: #197afb; color: #197afb; box-shadow: none;
}
.mon-type-radio :deep(.el-radio-button__orig-radio) { display: none; }

/* ---------- 查询条件（线上 .mg-filter-wrapper.cl-filter） ---------- */
.mon-filter-row {
  display: flex; align-items: center; flex-wrap: wrap;
  padding: 12px 8px 12px 16px; background: #fff;
}
.mon-filter-row .filter-left { align-items: center; flex-wrap: wrap; }
.mon-cell {
  display: flex; align-items: center; height: 28px; margin: 0 8px 8px 0;
  padding: 0 4px 0 8px; background: #fff; border: 1px solid #e8eaec; border-radius: 3px;
}
.mon-cell .filter-label { font-size: 12px; color: #666; margin-right: 4px; white-space: nowrap; }
.mon-select { width: 169px; }
.mon-select :deep(.el-input__wrapper) { box-shadow: none !important; padding-left: 4px; background: transparent; }
.mon-select :deep(.el-input__inner) { height: 26px; font-size: 12px; color: #606266; }
.mon-icon-close { font-size: 14px; color: #c0c4cc; cursor: pointer; margin-left: 2px; }
.mon-icon-close:hover { color: #909399; }
.mon-more-item { font-size: 12px; color: #606266; cursor: pointer; }
.mon-more-item:hover { color: #197afb; }

/* 关键词搜索（线上 cl-search-input：宽 280px） */
.mon-search-cell { padding: 0; }
.mon-search-input { width: 280px; }
.mon-search-input :deep(.el-input__inner) { height: 26px; font-size: 12px; }
.mon-search-input :deep(.el-input__wrapper) { padding-left: 8px; }
.mon-search-btn { width: 40px; height: 26px; border-radius: 0 3px 3px 0; border-left: 0; }
.mon-batch-icon { cursor: pointer; color: #c0c4cc; font-size: 16px; }
.mon-batch-icon:hover { color: #333; }
.mon-batch__hd { display: flex; align-items: center; justify-content: space-between; }
.mon-batch__title { font-size: 13px; color: #333; }
.mon-batch__tip { font-size: 12px; color: #909399; margin: 6px 0 8px; }
.mon-clear { font-size: 12px; color: #197afb; cursor: pointer; margin: 0 0 8px 4px; line-height: 28px; }

/* 右侧「设置」 */
.mon-setting-btn { width: 80px; height: 28px; padding: 0; margin-left: auto; margin-bottom: 8px; font-size: 12px; }

/* ---------- 工具栏 ---------- */
.mon-toolbar { margin-bottom: 8px; }
.mon-batch-select { width: 120px; margin-left: 4px; }
.mon-batch-select :deep(.el-input__inner) { height: 32px; font-size: 12px; }

/* ---------- 列表 ---------- */
.mon-table { font-size: 12px; width: 100%; }
.mon-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.mon-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.mon-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.mon-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* 表头勾选列：勾选框 + 「当前页/前50页」下拉 */
.mon-sel-hd { display: flex; align-items: center; justify-content: center; gap: 4px; }
.mon-sel-caret { cursor: pointer; color: #909399; font-size: 13px; display: inline-flex; }
.mon-sel-caret:hover { color: #197afb; }
.mon-sr-only {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.mon-status--on { color: #23c23f; }

/* ---------- 分页 ---------- */
.mon-pager { height: 48px; margin-top: 12px; padding: 2px 5px 2px 24px; }
.mon-pager :deep(.el-pagination) { font-size: 12px; }

/* ---------- 弹窗 ---------- */
.mon-dialog :deep(.el-dialog__title) { font-size: 16px; color: #333; }
.mon-dialog :deep(.el-form-item__label) { color: #666; }
.mon-dlg-input, .mon-dlg-select { width: 360px; }
.mon-dialog-radio :deep(.el-radio-button__inner) { font-size: 14px; }

/* 导入 */
.mon-import-tip { font-size: 13px; color: #606266; margin-bottom: 16px; }
.mon-warn-icon { color: #e6a23c; margin-right: 4px; vertical-align: -2px; }
.mon-upload { display: flex; align-items: center; gap: 8px; }
.mon-upload-tip { font-size: 12px; color: #909399; }
.mon-upload-file { font-size: 12px; color: #197afb; }

/* 设置：通配符 */
.mon-name-wrap { width: 360px; }
.mon-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.mon-tag-desc { font-size: 12px; color: #666; }
.mon-name-tag {
  font-size: 12px; color: #197afb; background: #f2f6ff; border: 1px solid #c6e2ff;
  border-radius: 3px; padding: 3px 8px; cursor: pointer;
}
.mon-name-tag.is-selected { background: #d6eaff; border-color: #197afb; cursor: default; }
.mon-insert-more { font-size: 12px; color: #197afb; cursor: pointer; }
.mon-insert-more:hover { text-decoration: underline; }
</style>
