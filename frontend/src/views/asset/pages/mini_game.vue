<template>
  <div class="mg-page">
    <!-- 页面标题 -->
    <div class="asset-title-bar">
      <span class="asset-title">小程序/小游戏</span>
    </div>

    <!-- ① 二级页签（线上 5 个，切换后筛选 / 列 / 数据 / 按钮全部变化） -->
    <div class="asset-sub-tabs">
      <div
        v-for="t in TABS"
        :key="t.key"
        class="asset-sub-tab"
        :class="{ active: t.key === activeTab }"
        @click="switchTab(t.key)"
      >{{ t.text }}</div>
    </div>

    <!-- ② 查询条件（筛选下拉 + 关键词搜索 + 清空） -->
    <div class="filter-row mg-filter-row">
      <div class="filter-left">
        <div v-for="f in cfg.filters" :key="f.key" class="filter-cell">
          <label class="filter-label">{{ f.label }}:</label>
          <el-select
            v-model="query[f.key]"
            class="filter-select"
            size="small"
            :placeholder="f.placeholder"
            :style="{ width: f.width + 'px' }"
            :filterable="f.filterable"
            @change="onFilterChange"
          >
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
          </el-select>
        </div>

        <!-- 关键词搜索：字段类型下拉（请选择）+ 关键词输入（请输入关键词）+ 批量搜索气泡 + 🔍 -->
        <div class="mg-search">
          <el-select v-model="searchField" class="search-field" size="small" placeholder="请选择">
            <el-option v-for="o in cfg.searchFields" :key="o" :label="o" :value="o" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            class="search-input"
            size="small"
            placeholder="请输入关键词"
            @keyup.enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix>
              <el-popover placement="bottom-end" :width="460" trigger="click" popper-class="mg-batch-popper">
                <template #reference>
                  <svg class="mg-batch-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M1 2.5h9M1 6h9M1 9.5h5.5" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" />
                    <circle cx="11" cy="9.5" r="3.2" stroke="currentColor" stroke-width="1" fill="none" />
                    <path d="M13.4 11.9L15.4 13.9" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                  </svg>
                </template>
                <div class="mg-batch">
                  <div class="mg-batch__hd">
                    <span class="mg-batch__title">请输入{{ searchField }}（{{ batchText.length }}/1000）</span>
                    <el-link type="primary" :underline="false" @click="batchText = ''">清空</el-link>
                  </div>
                  <div class="mg-batch__tip">每一行为一个关键词，批量搜索将执行<el-link type="primary" :underline="false">精确匹配</el-link>。</div>
                  <el-input
                    v-model="batchText"
                    type="textarea"
                    :rows="9"
                    resize="none"
                    placeholder="请粘贴或输入关键词，回车可换行"
                  />
                  <div class="batch-search-ops">
                    <el-button size="small" @click="batchText = ''">清空</el-button>
                    <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </template>
            <template #append>
              <el-button class="mg-search-btn" :icon="Search" title="搜索" @click="onSearch" />
            </template>
          </el-input>
        </div>

        <a class="filter-clear" @click="clearFilters">清空</a>
      </div>
    </div>

    <!-- ③ 工具栏 + 列表 + 分页 -->
    <div class="mg-table-card">
      <div class="table-toolbar" :class="{ 'mg-toolbar--sm': cfg.smallButtons }">
        <el-button
          v-for="b in cfg.buttons"
          :key="b.text"
          :type="b.primary ? 'primary' : undefined"
          :plain="!!b.plain"
          :disabled="!!b.disabled"
          size="small"
          class="tool-btn"
          :icon="b.icon"
          @click="onButton(b)"
        >{{ b.text }}</el-button>

        <!-- 小程序链接页的「批量操作」下拉（线上 dropdown-selfdefine，未勾选行时置灰） -->
        <el-dropdown v-if="cfg.batch" @command="onBatchCommand">
          <el-button type="primary" size="small" class="tool-btn" :disabled="!selectedRows.length">
            {{ cfg.batch.label }}<span v-if="selectedRows.length"> ({{ selectedRows.length }})</span>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="o in cfg.batch.options" :key="o" :command="o">{{ o }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-table
        :data="pagedRows"
        row-key="id"
        border
        class="asset-table mg-table"
        empty-text="暂无数据"
        @selection-change="onSelectionChange"
      >
        <el-table-column v-if="cfg.selection" type="selection" width="60" fixed="left" />

        <el-table-column
          v-for="col in cfg.columns"
          :key="col.label"
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :fixed="col.fixed ? 'left' : undefined"
          :show-overflow-tooltip="!col.action"
        >
          <template #default="{ row }">
            <template v-if="col.action">
              <el-button link type="primary" size="small" @click="onRowAction('edit', row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="onRowAction('remove', row)">删除</el-button>
            </template>
            <el-tag v-else-if="col.status" size="small" :type="statusType(row[col.prop])">{{ row[col.prop] }}</el-tag>
            <span v-else>{{ row[col.prop] }}</span>
          </template>
        </el-table-column>
      </el-table>

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
    </div>

    <!-- ④ 新建弹窗（线上「新建微信小程序」560px：工作台 / 获取模板 / 导入文件） -->
    <el-dialog
      v-model="createVisible"
      :title="cfg.dialogTitle"
      width="560px"
      class="mg-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="144px" label-position="left" class="mg-form">
        <el-form-item v-if="cfg.formFields.workbench" label="工作台">
          <el-radio-group v-model="form.workbench" class="ag-radio">
            <el-radio-button value="旧版">旧版</el-radio-button>
            <el-radio-button value="新版">新版</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="cfg.formFields.template" label="获取模板">
          <el-input v-model="form.template" class="ag-input" />
        </el-form-item>

        <el-form-item v-if="cfg.formFields.file" label="导入文件" required>
          <el-input v-model="form.file" class="ag-input">
            <template #append>
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :on-change="onFileChange"
                class="mg-upload"
              >
                <el-button class="mg-upload-btn">选择文件</el-button>
              </el-upload>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="createVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="submitCreate">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ⑤ 批量关联账户弹窗（小程序链接页） -->
    <el-dialog v-model="linkVisible" title="批量关联账户" width="560px" class="mg-dialog" :close-on-click-modal="false">
      <el-form label-width="96px" label-position="left">
        <el-form-item label="媒体账户">
          <el-select v-model="linkAccounts" multiple filterable class="ag-select" placeholder="请选择媒体账户">
            <el-option v-for="o in ACCOUNT_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <div class="operate-button">
            <el-button size="small" plain @click="linkVisible = false">取消</el-button>
            <el-button size="small" type="primary" @click="submitLinkAccounts">确 定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, Plus, Search } from '@element-plus/icons-vue';

const props = defineProps({ kind: { type: String, default: '' } });

/* ------------------------------------------------------------------
 * 智投标准版「巨量广告·标准 → 资产 → 小程序/小游戏」
 * 线上：https://cl.mobgi.com/property/toutiao/micro-asset/wechat-micro-app
 *
 * 5 个二级页签（逐个线上采集，筛选 / 列 / 按钮 / 弹窗各不相同）：
 *   微信小程序 /micro-asset/wechat-micro-app
 *       筛选 工作台/媒体账户/审核状态；搜索字段 名称/备注/ID；11 列；
 *       按钮 新建小程序组件(primary) + 同步微信小程序；弹窗「新建微信小程序」
 *   微信小游戏 /micro-asset/wechat-micro-game
 *       筛选 工作台/媒体账户/资产类型/审核状态；搜索字段 名称/ID；9 列（无操作列）；
 *       按钮 新建小游戏组件(primary，线上为 disabled) + 同步微信小游戏
 *   字节小程序 /micro-asset/byte-micro-app
 *       筛选 工作台/媒体账户/审核状态；搜索字段 名称/备注/ID；9 列；
 *       按钮 新建小程序组件 + 批量导入小程序链接 + 同步字节小程序(plain)；
 *       弹窗「批量创建字节小程序」
 *   字节小游戏 /micro-asset/byte-micro-game
 *       同上，弹窗「批量创建字节小游戏」
 *   小程序链接 /micro-asset/byte-mp-link
 *       筛选 工作台/所属账户/小程序/使用状态/搭建隐藏；搜索字段 链接备注/链接关键词；
 *       12 列（多选框 + 固定左列「小程序链接备注」）；按钮 同步数据 + 批量关联账户 +
 *       「批量操作」下拉（未勾选置灰）；有分页
 *
 * 线上各页签均无数据行，故列表为本地 mock（列名 / 列宽 / 顺序与线上一致）。
 * ------------------------------------------------------------------ */

/** 媒体账户下拉（线上 20 项，原样照抄） */
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
];

/** 工作台下拉（线上 2 项，5 个页签都有） */
const WORKBENCH_OPTIONS = ['旧版', '新版'];
/** 审核状态下拉（线上 3 项） */
const AUDIT_OPTIONS = ['审核通过', '审核失败', '审核中'];

const TABS = [
  { key: 'wechat_mini', text: '微信小程序' },
  { key: 'wechat_game', text: '微信小游戏' },
  { key: 'byte_mini', text: '字节小程序' },
  { key: 'byte_game', text: '字节小游戏' },
  { key: 'mini_link', text: '小程序链接' },
];

/** 各页签配置（筛选 / 搜索字段 / 列 / 按钮 / 弹窗） */
const TAB_CONFIG = {
  wechat_mini: {
    filters: [
      { key: 'workbench', label: '工作台', placeholder: '请选择工作台', width: 124, options: WORKBENCH_OPTIONS },
      { key: 'account', label: '媒体账户', placeholder: '所有账户', width: 192, options: ACCOUNT_OPTIONS, filterable: true },
      { key: 'audit', label: '审核状态', placeholder: '不限', width: 192, options: AUDIT_OPTIONS },
    ],
    searchFields: ['名称', '备注', 'ID'],
    columns: [
      { label: '小程序资产ID', prop: 'asset_id', width: 180 },
      { label: '小程序名称', prop: 'name', width: 240 },
      { label: '小程序路径参数', prop: 'path', width: 140 },
      { label: '审核状态', prop: 'audit', width: 139, status: true },
      { label: '资产备注', prop: 'remark', width: 139 },
      { label: '类目', prop: 'category', width: 139 },
      { label: '媒体账户', prop: 'account', width: 139 },
      { label: '所属账户', prop: 'owner', width: 139 },
      { label: '绑定账号', prop: 'bind_account', width: 139 },
      { label: '创建时间', prop: 'create_time', width: 160 },
      { label: '操作', prop: 'action', width: 173, action: true },
    ],
    buttons: [
      { text: '新建小程序组件', primary: true, icon: Plus, action: 'create' },
      { text: '同步微信小程序', primary: false, plain: false, icon: null, action: 'sync' },
    ],
    dialogTitle: '新建微信小程序',
    formFields: { workbench: true, template: true, file: true },
    rows: 'wechat_mini',
  },
  wechat_game: {
    filters: [
      { key: 'workbench', label: '工作台', placeholder: '请选择工作台', width: 124, options: WORKBENCH_OPTIONS },
      { key: 'account', label: '媒体账户', placeholder: '所有账户', width: 192, options: ACCOUNT_OPTIONS, filterable: true },
      { key: 'asset_type', label: '资产类型', placeholder: '不限', width: 192, options: ['原版', '升级版'] },
      { key: 'audit', label: '审核状态', placeholder: '不限', width: 192, options: AUDIT_OPTIONS },
    ],
    searchFields: ['名称', 'ID'],
    columns: [
      { label: '小游戏资产ID', prop: 'asset_id', width: 180 },
      { label: '小游戏名称', prop: 'name', width: 240 },
      { label: '小游戏路径参数', prop: 'path', width: 192 },
      { label: '资产类型', prop: 'asset_type', width: 191 },
      { label: '审核状态', prop: 'audit', width: 191, status: true },
      { label: '类目', prop: 'category', width: 191 },
      { label: '媒体账户', prop: 'account', width: 191 },
      { label: '所属账户', prop: 'owner', width: 191 },
      { label: '创建时间', prop: 'create_time', width: 160 },
    ],
    buttons: [
      { text: '新建小游戏组件', primary: true, disabled: true, icon: Plus, action: 'create' },
      { text: '同步微信小游戏', primary: false, plain: false, icon: null, action: 'sync' },
    ],
    dialogTitle: '新建微信小游戏',
    formFields: { workbench: true, template: true, file: true },
    rows: 'wechat_game',
  },
  byte_mini: {
    filters: [
      { key: 'workbench', label: '工作台', placeholder: '请选择工作台', width: 124, options: WORKBENCH_OPTIONS },
      { key: 'account', label: '媒体账户', placeholder: '所有账户', width: 192, options: ACCOUNT_OPTIONS, filterable: true },
      { key: 'audit', label: '审核状态', placeholder: '不限', width: 192, options: AUDIT_OPTIONS },
    ],
    searchFields: ['名称', '备注', 'ID'],
    columns: [
      { label: '小程序资产ID', prop: 'asset_id', width: 180 },
      { label: '小程序名称', prop: 'name', width: 240 },
      { label: '备注', prop: 'remark', width: 211 },
      { label: '类目', prop: 'category', width: 209 },
      { label: '审核状态', prop: 'audit', width: 209, status: true },
      { label: '媒体账户', prop: 'account', width: 209 },
      { label: '所属账户', prop: 'owner', width: 209 },
      { label: '创建时间', prop: 'create_time', width: 160 },
      { label: '操作', prop: 'action', width: 100, action: true },
    ],
    buttons: [
      { text: '新建小程序组件', primary: true, icon: Plus, action: 'create' },
      { text: '批量导入小程序链接', primary: true, icon: null, action: 'import' },
      { text: '同步字节小程序', primary: false, plain: true, icon: null, action: 'sync' },
    ],
    dialogTitle: '批量创建字节小程序',
    formFields: { workbench: true, template: true, file: true },
    rows: 'byte_mini',
  },
  byte_game: {
    filters: [
      { key: 'workbench', label: '工作台', placeholder: '请选择工作台', width: 124, options: WORKBENCH_OPTIONS },
      { key: 'account', label: '媒体账户', placeholder: '所有账户', width: 192, options: ACCOUNT_OPTIONS, filterable: true },
      { key: 'audit', label: '审核状态', placeholder: '不限', width: 192, options: AUDIT_OPTIONS },
    ],
    searchFields: ['名称', '备注', 'ID'],
    columns: [
      { label: '小游戏资产ID', prop: 'asset_id', width: 180 },
      { label: '小游戏名称', prop: 'name', width: 240 },
      { label: '备注', prop: 'remark', width: 201 },
      { label: '类目', prop: 'category', width: 199 },
      { label: '审核状态', prop: 'audit', width: 249, status: true },
      { label: '媒体账户', prop: 'account', width: 199 },
      { label: '所属账户', prop: 'owner', width: 199 },
      { label: '创建时间', prop: 'create_time', width: 160 },
      { label: '操作', prop: 'action', width: 100, action: true },
    ],
    buttons: [
      { text: '新建小游戏组件', primary: true, icon: Plus, action: 'create' },
      { text: '批量导入小游戏链接', primary: true, icon: null, action: 'import' },
      { text: '同步字节小游戏', primary: false, plain: true, icon: null, action: 'sync' },
    ],
    dialogTitle: '批量创建字节小游戏',
    formFields: { workbench: true, template: true, file: true },
    rows: 'byte_game',
  },
  mini_link: {
    filters: [
      { key: 'workbench', label: '工作台', placeholder: '请选择工作台', width: 124, options: WORKBENCH_OPTIONS },
      { key: 'owner_account', label: '所属账户', placeholder: '请选择所属账户', width: 192, options: ACCOUNT_OPTIONS, filterable: true },
      { key: 'mini', label: '小程序', placeholder: '请输入小程序名称搜索', width: 204, options: [], filterable: true },
      { key: 'use_status', label: '使用状态', placeholder: '不限', width: 192, options: ['未使用', '已使用'] },
      { key: 'hidden', label: '搭建隐藏', placeholder: '不限', width: 192, options: ['是', '否'] },
    ],
    searchFields: ['链接备注', '链接关键词'],
    columns: [
      { label: '小程序链接备注', prop: 'link_remark', width: 200, fixed: true },
      { label: '链接', prop: 'link', width: 240 },
      { label: '使用状态', prop: 'use_status', width: 90, status: true },
      { label: '搭建隐藏', prop: 'hidden', width: 100 },
      { label: '所属账户', prop: 'owner', width: 200 },
      { label: '关联账户', prop: 'rel_account', width: 200 },
      { label: '链接ID', prop: 'link_id', width: 150 },
      { label: '小程序备注', prop: 'remark', width: 200 },
      { label: '小程序', prop: 'name', width: 200 },
      { label: '创建时间', prop: 'create_time', width: 150 },
      { label: '更新时间', prop: 'update_time', width: 150 },
    ],
    buttons: [
      { text: '同步数据', primary: true, icon: null, action: 'sync' },
      { text: '批量关联账户', primary: true, icon: null, action: 'link' },
    ],
    batch: { label: '批量操作', options: ['批量删除', '批量隐藏', '批量同步'] },
    selection: true,
    smallButtons: true,
    dialogTitle: '新建小程序链接',
    formFields: { workbench: false, template: false, file: false },
    rows: 'mini_link',
  },
};

/* ------------------------------ mock 数据 ------------------------------ */

const NAMES = {
  wechat_mini: [
    '毛豆爱古诗', '高途网校', '百度文库', '得物好物', '任意门', '会计在线', '考研汇', '小猿口算',
    '成语大字典', '古诗词赏析', '数学思维训练', '编程猫', '猿辅导', '学而思培优', '有道词典', '国家反诈中心',
    '高考志愿填报', '教师资格证备考', '作业帮答疑', '英语流利说', '书法大师', '天天练字', '魔方课堂', '古文观止',
  ],
  wechat_game: [
    '成语大作战', '消灭星星', '合成大西瓜', '跳一跳助手', '欢乐斗地主', '象棋争霸', '消除达人', '幻影战车',
    '模拟经营我的城市', '我要当皇上', '成语消消闯关', '数字挑战', '贪吃蛇大作战', '2048合并', '飞行棋大作战', '斗地主残局',
    '猜歌达人', '养鱼大玩家', '奥特曼激战', '武林传奇手游', '魔卡少女樱', '节奏大师', '剧本杀推理', '扫雷英雄',
  ],
  byte_mini: [
    '抖音极速版', '番茄小说', '番茄畅听', '剪映极速版', '西瓜视频', '今日头条', '懂车帝', '飞猪旅行',
    '番茄免费音乐', '抖音小说', '微头条助手', '抖音小助手', '西瓜短剧', '剪映模板', '抖音小店', '抖音团购',
    '头条号助手', '抖音搜索', '番茄畅听音乐', '西瓜视频-小说', '抖音读书', '今日头条极速版', '懂车帝汽车', '剪映剪辑',
  ],
  byte_game: [
    '我功夫特牛', '消灭病毒', '我要当皇上', '成语消消闯关', '模拟经营我的城市', '植物大战僵尸2', '全民漂移3D', '弓箭传说',
    '神庙逃亡', '小小神兵', '动物餐厅', '地铁跑酷', '雷霆战机', '迷你世界', '合成大西瓜2', '开心消消乐',
    '奥特曼卡片', '贪吃蛇大作战', '王者塔防', '飞行棋大作战', '数字华容道', '成语接龙', '大家来找茬', '节奏大师',
  ],
  mini_link: [
    '百度文库-拉新链接', '高途网校-课程页', '得物-搜索页', '任意门-通用链接', '央广智投-落地页', '作业帮-答疑页',
    '国家反诈-提示页', '有道词典-首页', '编程猫-试听课', '会计在线-题库页', '古诗词-活动页', '高考志愿-推荐页',
    '小猿口算-练习页', '毛豆爱古诗-打卡', '番茄小说-书单', '得物-穿搭页', '高途直播-直播间', '央广-通用下载页',
    '番茄畅听-听书页', '懂车帝-车型库', '抖音小说-书城', '今日头条-资讯页', '剪映-模板页', '飞猪-旅行首页',
  ],
};

/* 小程序链接页的「小程序」筛选（线上为远程搜索，占位「请输入小程序名称搜索」） */
TAB_CONFIG.mini_link.filters.find((f) => f.key === 'mini').options = NAMES.mini_link;

const PATH_PARAMS = [
  'pages/index/index?scene=1011',
  'pages/home/home?channel=wechat',
  'pages/detail/detail?id=1024',
  'pages/course/list?type=1',
  'pages/activity/activity?from=ad',
];

const REMARKS = ['教育行业-拉新', '教育行业-转化', '工具类-通用', '测试资产', '品牌-搜索', '效果-应用下载', '品牌种草', '电商-新客'];

const CATEGORIES = [
  '教育-在线教育', '教育-教育工具', '工具-信息查询', '工具-效率办公',
  '电商-综合电商', '生活服务-教育咨询', '文娱-资讯', '生活服务-本地生活',
];

const GAME_TYPES = ['休闲益智', '角色扮演', '策略棋牌', '模拟经营', '消除闯关'];

const USE_STATUS = ['未使用', '已使用'];

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function nickOf(option) {
  return String(option || '').replace(/\(\d+\)$/, '');
}

/** 生成 mock 行（列与线上一致；线上无数据故内容为业务模拟） */
function buildRows(tabKey) {
  const names = NAMES[tabKey] || [];
  return names.map((name, i) => {
    const acct = ACCOUNT_OPTIONS[i % ACCOUNT_OPTIONS.length];
    const d = new Date(2024, 3, 8 + i, 9 + (i % 9), (i * 13) % 60, (i * 7) % 60);
    const u = new Date(d.getTime() + (i % 12) * 86400000);
    return {
      id: `${tabKey}-${i}`,
      asset_id: `1867${String(204987136000 + i * 137).slice(0, 13)}`,
      link_id: `1869${String(304987136000 + i * 211).slice(0, 13)}`,
      name,
      path: PATH_PARAMS[i % PATH_PARAMS.length],
      audit: AUDIT_OPTIONS[i % 3],
      remark: REMARKS[i % REMARKS.length],
      link_remark: `链接备注-${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length],
      asset_type: GAME_TYPES[i % GAME_TYPES.length],
      account: nickOf(acct),
      owner: nickOf(ACCOUNT_OPTIONS[(i + 7) % ACCOUNT_OPTIONS.length]),
      rel_account: nickOf(ACCOUNT_OPTIONS[(i + 13) % ACCOUNT_OPTIONS.length]),
      bind_account: `gh_${(10000000 + i * 137).toString(16)}${(20000000 + i * 211).toString(16)}`,
      link: `https://mp.weixin.qq.com/a/${(700000000 + i * 137).toString(36)}`,
      use_status: USE_STATUS[i % 2],
      hidden: i % 5 === 0 ? '是' : '否',
      workbench: i % 5 === 4 ? '新版' : '旧版',   // 线上默认工作台=旧版
      asset_version: i % 2 === 0 ? '原版' : '升级版',
      create_time: fmtDate(d),
      update_time: fmtDate(u),
    };
  });
}

const ROWS = {};
Object.keys(NAMES).forEach((k) => { ROWS[k] = buildRows(k); });

/* ------------------------------ 状态 ------------------------------ */

const activeTab = ref('wechat_mini');
const cfg = computed(() => TAB_CONFIG[activeTab.value]);
const query = ref({});
const searchField = ref('名称');
const searchKeyword = ref('');
const batchText = ref('');
const pageNo = ref(1);
const pageSize = ref(10);
const selectedRows = ref([]);
const createVisible = ref(false);
const linkVisible = ref(false);
const linkAccounts = ref([]);
const formRef = ref();
const form = ref({ workbench: '旧版', template: '', file: '' });

/** 切页签 / 首次进入时重置筛选（工作台默认「旧版」，与线上一致） */
function resetQuery() {
  const q = {};
  (cfg.value.filters || []).forEach((f) => {
    q[f.key] = f.key === 'workbench' ? '旧版' : '';
  });
  query.value = q;
  searchField.value = (cfg.value.searchFields || ['名称'])[0];
  searchKeyword.value = '';
  batchText.value = '';
  selectedRows.value = [];
  pageNo.value = 1;
}
resetQuery();

watch(activeTab, () => { resetQuery(); });
watch(pageSize, () => { pageNo.value = 1; });

/* ------------------------------ 计算 ------------------------------ */

/** 筛选 + 关键词搜索 */
const filteredRows = computed(() => {
  const q = query.value;
  let rows = ROWS[cfg.value.rows] || [];

  if (q.workbench) rows = rows.filter((r) => r.workbench === q.workbench);
  if (q.account) rows = rows.filter((r) => r.account === nickOf(q.account));
  if (q.owner_account) rows = rows.filter((r) => r.owner === nickOf(q.owner_account));
  if (q.audit) rows = rows.filter((r) => r.audit === q.audit);
  if (q.asset_type) rows = rows.filter((r) => r.asset_version === q.asset_type);
  if (q.use_status) rows = rows.filter((r) => r.use_status === q.use_status);
  if (q.hidden) rows = rows.filter((r) => r.hidden === q.hidden);
  if (q.mini) rows = rows.filter((r) => r.name === q.mini);

  const kw = (searchKeyword.value || '').trim();
  if (kw) {
    const keys = kw.split(/[\n,，]+/).map((s) => s.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      const field = searchField.value;
      let target = '';
      if (field === '备注') target = `${r.remark}`;
      else if (field === 'ID') target = `${r.asset_id}${r.link_id}`;
      else if (field === '链接备注') target = `${r.link_remark}${r.remark}`;
      else if (field === '链接关键词') target = `${r.link}${r.link_remark}`;
      else target = `${r.name}`;
      return keys.some((k) => target.indexOf(k) > -1);
    });
  }
  return rows;
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

/* ------------------------------ 方法 ------------------------------ */

function onFilterChange() { pageNo.value = 1; }
function onSearch() { pageNo.value = 1; }
function clearFilters() {
  resetQuery();
  ElMessage.info('已清空筛选条件');
}
function applyBatchSearch() {
  searchKeyword.value = batchText.value;
  pageNo.value = 1;
}
function onSelectionChange(rows) { selectedRows.value = rows; }

function switchTab(key) {
  if (key === activeTab.value) return;
  activeTab.value = key;
}

function statusType(v) {
  return {
    审核通过: 'success', 审核失败: 'danger', 审核中: 'warning',
    已使用: 'success', 未使用: 'info',
  }[v] || 'info';
}

/** 工具栏按钮 */
function onButton(b) {
  if (b.action === 'create') {
    form.value = { workbench: '旧版', template: '', file: '' };
    createVisible.value = true;
    return;
  }
  if (b.action === 'sync') {
    ElMessage.success(`${b.text}成功`);
    return;
  }
  if (b.action === 'import') {
    ElMessage.info(`原型：${b.text}（下载模板 → 上传文件）`);
    return;
  }
  if (b.action === 'link') {
    linkVisible.value = true;
    return;
  }
  ElMessage.info(`原型：${b.text}`);
}

function onBatchCommand(command) {
  ElMessage.info(`原型：批量操作「${command}」（${selectedRows.value.length} 条）`);
}

function onRowAction(action, row) {
  if (action === 'edit') {
    ElMessage.info(`原型：编辑「${row.name}」`);
    return;
  }
  ElMessageBox.confirm(`确认删除「${row.name}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
    .then(() => ElMessage.success('删除成功'))
    .catch(() => {});
}

function onFileChange(file) {
  form.value.file = file.name;
}

function submitCreate() {
  if (cfg.value.formFields.file && !String(form.value.file || '').trim()) {
    ElMessage.warning('请填写导入文件');
    return;
  }
  createVisible.value = false;
  ElMessage.success('新建成功');
}

function submitLinkAccounts() {
  if (!linkAccounts.value.length) {
    ElMessage.warning('请选择媒体账户');
    return;
  }
  linkVisible.value = false;
  linkAccounts.value = [];
  ElMessage.success('关联成功');
}
</script>

<style scoped>
.mg-page { padding: 16px; min-height: 100%; box-sizing: border-box; background: #fff; }

/* ---------- 查询条件（线上 form.filter-search-input） ---------- */
.mg-filter-row { margin-bottom: 8px; }
.mg-filter-row .filter-cell { height: 28px; padding: 0 5px 0 8px; margin: 0 8px 8px 0; }
.mg-filter-row .filter-label { font-size: 12px; color: #666; margin-right: 4px; white-space: nowrap; }
.mg-filter-row .filter-select :deep(.el-input__wrapper) { padding-left: 0; }
.mg-filter-row .filter-select :deep(.el-input__inner) { height: 28px; font-size: 12px; color: #666; }

/* 关键词搜索：字段类型下拉 + 关键词输入 + 批量搜索气泡 + 🔍 */
.mg-search { display: flex; align-items: center; height: 28px; margin: 0 8px 8px 0; }
.mg-search .search-field { width: 88px; flex: none; }
.mg-search .search-field :deep(.el-input__wrapper) { padding-left: 8px; }
.mg-search .search-field :deep(.el-input__inner) { height: 28px; font-size: 12px; border-radius: 3px 0 0 3px; }
.mg-search .search-input { width: 236px; }
.mg-search .search-input :deep(.el-input__wrapper) { padding-left: 8px; }
.mg-search .search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; border-radius: 0; }
.mg-search .search-input :deep(.el-input-group__append) { padding: 0; background: #fff; }
.mg-search-btn { width: 32px; height: 28px; padding: 0; border-radius: 0 3px 3px 0; border-left: 0; }
.mg-batch-icon { color: #c0c4cc; cursor: pointer; }
.mg-batch-icon:hover { color: #197afb; }
.mg-batch__hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.mg-batch__title { font-size: 13px; color: #333; }
.mg-batch__tip { font-size: 12px; color: #909399; margin-bottom: 8px; }

/* ---------- 工具栏 ---------- */
.mg-toolbar--sm .tool-btn { height: 24px; padding: 5px 11px; font-size: 12px; }

/* ---------- 列表 ---------- */
.mg-table-card { margin-top: 4px; }
.mg-table { font-size: 12px; width: 100%; }
.mg-table :deep(.el-table__header th) { background: #fafafa; color: #909399; font-size: 12px; height: 56px; padding: 0; }
.mg-table :deep(.el-table__cell) { font-size: 12px; color: #606266; padding: 8px 0; }
.mg-table :deep(.el-button.is-link) { margin-left: 10px; padding: 0; }
.mg-table :deep(.el-button.is-link:first-child) { margin-left: 0; }

/* ---------- 新建弹窗（label 144px / 控件 360×32，与线上一致） ---------- */
.mg-form :deep(.el-form-item__label) { width: 144px; font-size: 14px; color: #666; }
.mg-form :deep(.el-form-item__content) { margin-left: 0; }
.mg-form :deep(.el-form-item__content > .el-input) { flex: none; width: 360px; }
.mg-form :deep(.el-form-item__content > .el-radio-group) { flex: none; }
.mg-upload :deep(.el-upload) { display: inline-block; }
.mg-upload-btn { font-size: 12px; height: 32px; padding: 0 12px; }
</style>
