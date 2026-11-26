<template>
  <el-drawer
    v-model="visible"
    :title="cardTitle.proj"
    size="1016px"
    direction="rtl"
    class="batch-proj-drawer"
    body-class="batch-proj-drawer__body"
    footer-class="batch-proj-drawer__footer"
    :show-close="false"
  >
    <template #header>
      <div class="batch-proj-drawer__title">{{ cardTitle.proj }}</div>
      <button class="batch-proj-drawer__close" type="button" aria-label="关闭" @click="visible = false">
        <el-icon><Close /></el-icon>
      </button>
    </template>

    <!-- 线上：抽屉右上角「预估广告数」浮层（账户数 / 项目数） -->
    <div class="proj-estimate" :class="{ 'is-folded': estFolded }">
      <div class="proj-estimate__content">
        <div class="proj-estimate__title">预估广告数</div>
        <div class="proj-estimate__row">
          <span class="proj-estimate__label">账户数：</span>
          <span class="proj-estimate__num">{{ adEstimate.accounts }}</span>
        </div>
        <div class="proj-estimate__row">
          <span class="proj-estimate__label">项目数：</span>
          <span class="proj-estimate__num">{{ adEstimate.projects }}</span>
        </div>
      </div>
      <span class="proj-estimate__expend" @click="estFolded = !estFolded">
        <el-icon><component :is="estFolded ? Expand : Fold" /></el-icon>
      </span>
    </div>

    <el-form :model="form.project" class="drawer-form" label-position="left" label-width="144px">
      <!-- 资产组（线上首个分区，独立成段） -->
      <div class="form-section">
        <div class="form-section__title">资产组</div>
        <el-form-item label="资产组" label-width="120px">
          <el-radio-group v-model="form.project.asset_group" @change="onAssetGroupChange" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">启用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <!-- 线上：启用后露出 分配方式 / 选择资产组 / 已选 n/1000 -->
        <template v-if="form.project.asset_group === 'ON'">
          <el-form-item label="分配方式" label-width="120px">
            <el-radio-group v-model="form.project.asset_group_assign" size="small">
              <el-radio-button value="ALL">所有账户相同</el-radio-button>
              <el-radio-button value="PER_ACCOUNT">分账户选择</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="选择资产组" label-width="120px">
            <el-button type="primary" size="small" @click="pickAssetGroup">选择资产组</el-button>
            <span class="sel-picked">选择资产组已选 {{ (form.project.asset_group_ids || []).length }}/1000</span>
          </el-form-item>
        </template>
      </div>

      <!-- 推广目的 -->
      <div class="form-section">
        <div class="form-section__title">推广目的</div>
      <el-form-item label-width="0" class="obj-form-item">
        <el-radio-group v-model="form.project.objective" @change="onObjectiveChange" class="obj-grid" size="small">
          <el-radio v-for="o in OBJECTIVES" :key="o.value" :value="o.value" class="obj-card">
            <img v-if="o.img" class="obj-img" :src="o.img" :alt="o.label" />
            <span class="obj-label">{{ o.label }}</span>
            <span class="obj-desc">{{ o.desc }}</span>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-row v-if="form.project.objective === 'APP'" :gutter="12" style="margin-top: 12px">
        <el-col :span="12">
          <!-- 线上：应用推广 卡片下方是一排「应用下载 / 应用调起 / 预约下载」按钮 + 说明 -->
          <div class="sub-obj">
            <el-radio-group v-model="form.project.app_promotion_type" @change="onAppPromoChange" size="small">
              <el-radio-button v-for="o in APP_PROMOTION_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
            <div class="sub-obj__hint">吸引用户在应用程序内采取行动</div>
          </div>
        </el-col>
      </el-row>

      <!-- 广告类型 / 投放类型 / 投放模式 / 营销场景 / 内广项目（线上同属「推广目的」段，且都是按钮式单选） -->
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="广告类型" required>
            <el-radio-group v-model="form.project.ad_type" size="small" @change="onAdTypeChange">
              <el-radio-button v-for="o in AD_TYPES" :key="o.value" :value="o.value">
                <el-popover
                  v-if="o.value === 'SEARCH'"
                  content="头条接口正在逐步开放中"
                  placement="top"
                  trigger="hover"
                  :width="220"
                >
                  <template #reference><span>{{ o.label }}</span></template>
                </el-popover>
                <template v-else>{{ o.label }}</template>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="投放类型">
            <el-radio-group v-model="form.project.delivery_type" size="small">
              <el-radio-button
                v-for="o in deliveryTypeOptions"
                :key="o.value"
                :value="o.value"
                :disabled="o.value === 'CYCLE_STABLE' && !isSearchAd"
              >
                <el-popover
                  v-if="o.value === 'CYCLE_STABLE' && !isSearchAd"
                  content="媒体API暂不支持通投广告搭建周期稳投"
                  placement="top"
                  trigger="hover"
                  :width="250"
                >
                  <template #reference><span>{{ o.label }}</span></template>
                </el-popover>
                <template v-else>{{ o.label }}</template>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="!isSearchAd">
          <el-form-item label="投放模式">
            <el-radio-group v-model="form.project.delivery_mode" size="small">
              <el-radio-button v-for="o in DELIVERY_MODE_EXTRA" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="isSearchAd" :gutter="12">
        <el-col :span="8">
          <el-form-item label="蓝海关键词">
            <el-switch v-model="form.project.blue_ocean" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="选择关键词包">
            <el-select v-model="form.project.keyword_pack" multiple filterable placeholder="请选择关键词包" style="width: 100%">
              <el-option v-for="k in keywordPackOptions" :key="k.id" :label="k.name" :value="k.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="智能拓流">
            <el-switch v-model="form.project.smart_expand" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="isSearchAd && form.project.budget_mode !== 'DAY'" :gutter="12">
        <el-col :span="8">
          <el-form-item label="出价方式">
            <el-radio-group v-model="form.project.bid_mode" size="small">
              <el-radio-button value="LADDER">阶梯出价</el-radio-button>
              <el-radio-button value="RANDOM">随机出价</el-radio-button>
            </el-radio-group>
            <div class="ad-warn-hint">阶梯出价是指根据您的出价范围，在生成的项目中做等差分配出价；随机出价是指会在出价范围内随机分配出价</div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="营销场景" required>
            <el-radio-group v-model="form.project.marketing_goal" size="small" @change="onMarketingGoalChange">
              <el-radio-button v-for="o in MARKETING_GOALS" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="内广项目">
            <el-radio-group v-model="form.project.inner_promotion" size="small">
              <el-radio-button value="OFF">不开启</el-radio-button>
              <el-radio-button value="ON">开启</el-radio-button>
            </el-radio-group>
            <a
              class="el-link el-link--primary proj-guide-link"
              href="https://chuangliang.feishu.cn/wiki/EbPIwMdVhimCZnk16B9cOUmjn4c"
              target="_blank"
              rel="noopener noreferrer"
            >
              <el-icon class="proj-guide-link__icon"><Link /></el-icon>
              <span class="el-link--inner">加白指引</span>
            </a>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 关联产品投放（线上按推广目的切换：不启用/启用、无产品/单产品投放/多产品投放、无产品/抖音号/商品；「商品」目的无此模块） -->
      </div>
      <div class="form-section" v-if="objCfg.related !== 'NONE' && form.project.asset_group !== 'ON'">
        <div class="form-section__title">关联产品投放</div>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item :label="objCfg.related === 'CONTENT' ? '推广产品' : '关联产品'">
            <el-radio-group v-model="form.project.related_product" size="small">
              <el-radio-button v-for="o in relatedProductOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <template v-if="relatedProductOn">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="每个项目配置产品数">
              <el-input-number v-model="form.project.product_count" :min="1" :max="20" style="width: 160px" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品版本">
              <el-radio-group v-model="form.project.product_version" size="small">
              <el-radio-button value="UPGRADE">升级版</el-radio-button>
              <el-radio-button value="GENERAL">通用版</el-radio-button>
            </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品来源">
              <el-radio-group v-model="form.project.product_source" size="small">
              <el-radio-button value="EXISTING">选择已有</el-radio-button>
              <el-radio-button value="MANUAL">手动填写</el-radio-button>
            </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="工作台版本">
              <el-radio-group v-model="form.project.workbench_version" size="small">
              <el-radio-button value="OLD">旧版工作台</el-radio-button>
              <el-radio-button value="NEW">新版工作台</el-radio-button>
            </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="匹配方式">
              <el-radio-group v-model="form.project.product_match_mode" size="small">
              <el-radio-button value="ALL_SAME">所有项目选择同一组产品</el-radio-button>
              <el-radio-button value="PER_ACCOUNT">每个账户选择一组产品</el-radio-button>
              <el-radio-button value="PER_SUBJECT">每个主体选择一组产品</el-radio-button>
              <el-radio-button value="PER_PROJECT">每个项目选择一组产品</el-radio-button>
            </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="24">
            <el-form-item label="选择产品">
              <el-button type="primary" size="small" @click="relatedVisible = true">选择产品</el-button>
              <span v-if="form.project.product_ids.length" class="sel-picked">
                已选 {{ form.project.product_ids.length }} 个产品
              </span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-table :data="projProductRows" size="small" border class="proj-inline-table">
          <el-table-column label="账户" min-width="220">
            <template #default="{ row }">
              <div class="ad-link-cell"><span>{{ row.account }}</span><span class="ad-link-cell__id">{{ row.accountId }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="产品" min-width="220">
            <template #default="{ row }">
              <el-tag v-for="p in row.products" :key="p" closable class="ad-link-tag" @close="row.products = row.products.filter(x => x !== p)">{{ p }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- AIGC 动态创意（线上：内容营销目的下无此模块） -->
      </div>
      <div class="form-section" v-if="objCfg.aigc">
        <div class="form-section__title">AIGC动态创意</div>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="AIGC动态创意">
            <el-radio-group v-model="form.project.aigc_creative" size="small">
              <el-radio-button value="OFF">不启用</el-radio-button>
              <el-radio-button value="ON">启用</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <div class="dlg-tip">白名单功能。开启 AIGC 动态创意，请确保产品所有者在行业产品中心已申请获取短副原片的使用授权，如未完成，可能影响素材生成效果。</div>

      <!-- 商品目录 / 商品定向（线上：仅「商品」推广目的出现，取代关联产品投放） -->
      </div>
      <div class="form-section" v-if="form.project.objective === 'DPA'">
        <div class="form-section__title">商品目录</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="商品目录">
              <el-button type="primary" size="small" @click="pickGoodsCatalog">选择已有</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="form-section" v-if="form.project.objective === 'DPA'">
        <div class="form-section__title">商品定向</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="RTA重定向">
              <el-radio-group v-model="form.project.rta_redirect" size="small">
                <el-radio-button value="OFF">不启用</el-radio-button>
                <el-radio-button value="ON">启用</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <template v-if="form.project.rta_redirect === 'ON'">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="RTA策略">
                <el-button type="primary" size="small" @click="pickRtaStrategy">选择已有</el-button>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="RTA推荐逻辑">
                <el-radio-group v-model="form.project.rta_recommend" size="small">
                  <el-radio-button value="ONLY">仅RTA推荐商品</el-radio-button>
                  <el-radio-button value="MORE">基于RTA推荐更多商品</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </div>

      <!-- 投放内容与目标 -->
      <div class="form-section">
        <div class="form-section__title">投放内容与目标</div>
      <!-- 应用推广专属：星广联投 / 平台类型 / 应用来源 / 事件资产 / 数据跟踪 / 监测链接 / 下载方式 / 事件回传 -->
      <template v-if="objCfg.content === 'APP'">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="关联星广联投任务" v-if="!isSearchAd && !isLiveGoal">
            <el-radio-group v-model="form.project.star_task" size="small">
              <el-radio-button value="OFF">不启用</el-radio-button>
              <el-radio-button value="ON">启用</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <div class="dlg-tip">账户需开通星广联投白名单，否则新建会报错。 <el-button link type="primary" class="sel-row__link" @click="openGuide('media')">加白指引</el-button></div>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="平台类型">
            <el-radio-group v-model="form.project.platform_type" size="small">
              <el-radio-button v-for="o in PLATFORM_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="form.project.platform_type !== 'APP_IOS' && form.project.platform_type !== 'APP_HARMONY'">
          <el-form-item label="应用来源">
            <el-radio-group v-model="form.project.app_source" size="small">
              <el-radio-button value="SINGLE">已有应用</el-radio-button>
              <el-radio-button value="INTERNAL">内广应用</el-radio-button>
            </el-radio-group>
            <el-button link type="primary" class="sel-row__link" @click="openGuide('innerApp')">内广应用搭建指引</el-button>
          </el-form-item>
        </el-col>
        <!-- 线上：平台类型=IOS 出现 iTunes ID + 应用名称 -->
        <el-col :span="12" v-if="form.project.platform_type === 'APP_IOS'">
          <el-form-item label="iTunes ID">
            <div class="sel-row">
              <el-input v-model="form.project.itunes_id" class="sel-row__ctrl" clearable placeholder="请输入iTunes ID" />
              <el-button size="small" @click="ElMessage.success('已验证（原型模拟）')">验证</el-button>
              <el-button link type="primary" class="sel-row__link" @click="ElMessage.info('原型：iTunes ID 获取方式')">iTunes ID获取方式</el-button>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="form.project.platform_type === 'APP_IOS'">
          <el-form-item label="应用名称">
            <el-input v-model="form.project.app_name" placeholder="请输入应用名称" />
          </el-form-item>
        </el-col>
        <!-- 线上：平台类型=鸿蒙 出现 鸿蒙应用 -->
        <el-col :span="12" v-if="form.project.platform_type === 'APP_HARMONY'">
          <el-form-item label="鸿蒙应用">
            <div class="sel-row">
              <el-select v-model="form.project.harmony_app" class="sel-row__ctrl" clearable placeholder="请选择鸿蒙应用">
                <el-option v-for="a in harmonyApps" :key="a.id" :value="a.id" :label="a.name" />
              </el-select>
              <el-button size="small" @click="ElMessage.success('已刷新鸿蒙应用（原型模拟）')">刷新</el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12" v-if="form.project.platform_type === 'APP_ANDROID'">
          <el-form-item label="匹配方式">
            <el-radio-group v-model="form.project.event_asset_match" size="small">
              <el-radio-button value="ALL">所有账户选择一个资产</el-radio-button>
              <el-radio-button value="PER_ACCOUNT">每个账户选择一个资产</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="form.project.platform_type === 'APP_ANDROID'">
          <el-form-item label="选择事件资产">
            <el-button type="primary" size="small" @click="pickEventAsset">选择事件资产</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      <el-table :data="projEventRows" size="small" border class="proj-inline-table">
        <el-table-column label="账户" min-width="200">
          <template #default="{ row }">
            <div class="ad-link-cell"><span>{{ row.account }}</span><span class="ad-link-cell__id">{{ row.accountId }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="事件资产" min-width="240">
          <template #default="{ row }">
            <div class="ad-link-cell"><span>{{ row.asset }}</span><span class="ad-link-cell__id">{{ row.pkg }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default><el-button link type="primary" @click="pickEventAsset">选择</el-button></template>
        </el-table-column>
      </el-table>
      <el-row v-if="form.project.platform_type === 'APP_ANDROID'" :gutter="12">
        <el-col :span="24">
          <el-form-item label="数据跟踪方式">
            <el-radio-group v-model="form.project.track_way" size="small">
              <el-radio-button value="SUB_AND_MONITOR">应用分包+监测活动</el-radio-button>
              <el-radio-button value="SUB_ONLY">仅应用分包</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 监测链接来源：各平台类型都有（线上图2：IOS 也保留该字段） -->
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item label="监测链接来源">
            <el-radio-group v-model="form.project.track_link_source" size="small">
              <el-radio-button v-for="o in TRACK_LINK_SOURCES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12" v-if="form.project.platform_type === 'APP_ANDROID'">
          <el-form-item label="匹配方式">
            <el-radio-group v-model="form.project.link_group_match" size="small">
              <el-radio-button value="PER_ACCOUNT">每个账户选择一个分包和链接组</el-radio-button>
              <el-radio-button value="PER_PROJECT">每个项目选择一个分包和链接组</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="form.project.platform_type === 'APP_ANDROID' && form.project.track_link_source !== 'DYNAMIC'">
          <el-form-item label="选择分包和链接组">
            <el-button type="primary" size="small" @click="openMonitorGroup('选择监测链接组')">选择分包和链接组</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 线上：平台类型=IOS/鸿蒙 时出现「匹配方式（链接组）+ 选择链接组」 -->
      <el-row v-if="form.project.platform_type === 'APP_IOS' || form.project.platform_type === 'APP_HARMONY'" :gutter="12">
        <el-col :span="12">
          <el-form-item label="匹配方式">
            <el-radio-group v-model="form.project.link_group_match" size="small">
              <el-radio-button value="PER_ACCOUNT">每个账户选择一个链接组</el-radio-button>
              <el-radio-button value="PER_PROJECT">每个项目选择一个链接组</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="选择链接组">
            <el-button type="primary" size="small" @click="pickLinkGroup">选择链接组</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      <el-table :data="projLinkRows" size="small" border class="proj-inline-table">
        <el-table-column label="账户" min-width="220">
          <template #default="{ row }">
            <div class="ad-link-cell"><span>{{ row.account }}</span><span class="ad-link-cell__id">{{ row.accountId }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="分包和链接组" min-width="220">
          <template #default="{ row }">
            <el-tag v-if="row.group" closable class="ad-link-tag" @close="row.group = ''">{{ row.group }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-row :gutter="12">
        <el-col :span="12" v-if="form.project.app_promotion_type !== 'RESERVE'">
          <el-form-item label="下载方式">
            <el-radio-group v-model="form.project.download_type" size="small">
              <el-radio-button value="DOWNLOAD_URL">直接下载</el-radio-button>
              <el-radio-button value="EXTERNAL_URL">落地页下载</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="调起方式">
            <el-radio-group v-model="form.project.launch_type" size="small">
              <el-radio-button value="DIRECT">直接调起</el-radio-button>
              <el-radio-button value="LANDING">落地页调起</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12" v-if="form.project.platform_type === 'APP_ANDROID'">
          <el-form-item label="优先应用商店下载">
            <template #label>
              <span class="q-label">优先应用商店下载</span>
              <el-tooltip :content="TIPS.app_store" placement="top">
                <el-icon class="q-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <el-radio-group v-model="form.project.app_store_first" size="small">
              <el-radio-button value="OFF">不启用</el-radio-button>
              <el-radio-button value="ON">启用</el-radio-button>
            </el-radio-group>
            <div class="ad-warn-hint">巨量广告媒体加白功能，确认账户拥有权限再启用</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="事件回传方式">
            <el-radio-group v-model="form.project.event_callback_type" size="small">
              <el-radio v-for="o in EVENT_CALLBACK_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
            </el-radio-group>
            <div class="ad-warn-hint">系统根据您所选回传方式新建事件，若事件已存在，事件的回传方式需与搭建时所选保持一致</div>
          </el-form-item>
        </el-col>
      </el-row>
      </template>
      <!-- 其他推广目的：投放载体 / 应用包名 / 推广类型 / 投放内容 -->
      <template v-else>
        <el-row v-if="objCfg.content === 'LEAD'" :gutter="12">
          <el-col :span="12">
            <el-form-item label="投放载体">
              <el-radio-group v-model="form.project.promote_carrier" size="small">
                <el-radio-button value="MULTI">多投放载体</el-radio-button>
                <el-radio-button value="SINGLE">单投放载体</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="objCfg.content === 'QUICK'" :gutter="12">
          <el-col :span="12">
            <el-form-item label="应用包名">
              <el-button type="primary" size="small" @click="pickQuickApp">选择已有</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="快应用资产名">
              <el-input v-model="form.project.quick_asset_name" placeholder="请输入快应用资产名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="objCfg.content === 'QUICK'" :gutter="12">
          <el-col :span="12">
            <el-form-item label="调起方式">
              <el-radio-group v-model="form.project.quick_launch_type" size="small">
                <el-radio-button value="DIRECT">直接调起</el-radio-button>
                <el-radio-button value="LANDING">落地页调起</el-radio-button>
              </el-radio-group>
              <div class="ad-warn-hint">请在媒体后台确认所选账户可用调起方式</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="objCfg.content === 'GOODS'" :gutter="12">
          <el-col :span="12">
            <el-form-item label="推广类型">
              <el-radio-group v-model="form.project.goods_promote_type" size="small">
                <el-radio-button value="LANDING">落地页</el-radio-button>
                <el-radio-button value="APP">应用推广</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="contentOptions.length" :gutter="12">
          <el-col :span="12">
            <el-form-item label="投放内容">
              <el-radio-group v-model="form.project.promote_content" size="small">
                <el-radio-button v-for="o in contentOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </template>
      <!-- 通用：优化目标 / 深度优化目标 -->
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="优化目标" required>
            <el-select v-model="form.project.external_action" @change="onActionChange" placeholder="请选择优化目标" style="width: 100%">
              <el-option v-for="o in externalActionOptions" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="深度优化目标">
            <el-select v-model="form.project.deep_external_action" style="width: 100%">
              <el-option v-for="o in DEEP_ACTIONS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      </div>

      <!-- 投放版位 -->
      <div class="form-section">
        <div class="form-section__title">投放版位</div>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="广告位置" required>
            <el-radio-group v-model="form.project.inventory_catalog" size="small">
              <el-radio-button value="UNIVERSAL_SMART">通投智选</el-radio-button>
              <el-radio-button value="MANUAL">首选媒体</el-radio-button>
            </el-radio-group>
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
      <!-- 首选媒体（线上：商品 / 内容营销 推广目的下出现） -->
      <el-row v-if="objCfg.preferredMedia" :gutter="12">
        <el-col :span="12">
          <el-form-item label="首选媒体">
            <el-checkbox-group v-model="form.project.preferred_media">
              <el-checkbox value="ALL">全选</el-checkbox>
              <el-checkbox value="DOUYIN">抖音</el-checkbox>
            </el-checkbox-group>
            <div class="ad-warn-hint">首选媒体：广告将主要投放在首选媒体上，同时为了帮助广告计划更好的跑量和优化成本，系统有可能将广告智能拓展投放到其他流量场景。</div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 用户定向 -->
      </div>
      <div class="form-section">
        <div class="form-section__title">
          用户定向
          <el-button link type="primary" class="sec-collapse" @click="customTargetingOpen = !customTargetingOpen">{{ customTargetingOpen ? '收起' : '自定义定向' }}</el-button>
        </div>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="定向包来源">
            <el-radio-group v-model="form.project.target_package_source" size="small">
              <el-radio-button value="ACCOUNT">账户已有定向包</el-radio-button>
              <el-radio-button value="CL">创量定向包</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="匹配方式">
            <el-radio-group v-model="form.project.target_match_mode" size="small">
              <el-radio-button value="ALL_SAME">所有账户选择一个定向包</el-radio-button>
              <el-radio-button value="PER_ACCOUNT">每个账户选择一个定向包</el-radio-button>
              <el-radio-button value="PER_PROJECT">每个项目选择一个定向包</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item v-if="customTargetingOpen" label="使用运营商定向">
            <el-radio-group v-model="form.project.carrier_targeting" size="small">
              <el-radio-button value="OFF">不使用</el-radio-button>
              <el-radio-button value="ON">使用</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="选择定向包">
            <el-button type="primary" size="small" @click="targetingVisible = true">选择定向包</el-button>
            <span v-if="form.project.audience_package_id" class="sel-picked">
              {{ (orientationPackages.find(p => p.id === form.project.audience_package_id) || {}).name }}
            </span>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item v-if="customTargetingOpen" label="地域类型">
            <el-select v-model="form.project.district" style="width: 100%">
              <el-option value="NONE" label="不限" /><el-option value="REGION" label="行政区域" /><el-option value="BUSINESS_DISTRICT" label="商圈" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="form.project.district !== 'NONE'">
          <el-form-item v-if="customTargetingOpen" label="位置类型">
            <el-select v-model="form.project.location_type" style="width: 100%">
              <el-option v-for="o in LOCATION_TYPES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item v-if="customTargetingOpen" label="性别">
            <el-select v-model="form.project.gender" style="width: 100%">
              <el-option v-for="o in GENDERS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item v-if="customTargetingOpen" label="年龄">
            <el-select v-model="form.project.age" multiple>
              <el-option v-for="o in AGES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item v-if="customTargetingOpen" label="过滤已转化用户">
            <el-select v-model="form.project.hide_if_converted" style="width: 100%">
              <el-option v-for="o in HIDE_CONVERTED" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item v-if="customTargetingOpen" label="定向人群包">
            <el-select v-model="form.project.include_packages" multiple placeholder="包含的自定义人群">
              <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="customTargetingOpen" label="排除人群包">
            <el-select v-model="form.project.exclude_packages" multiple placeholder="排除的自定义人群">
              <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item v-if="customTargetingOpen" label="行为兴趣定向">
            <el-select v-model="form.project.interest_action_mode" @change="onInterestModeChange" style="width: 100%">
              <el-option v-for="o in INTEREST_ACTION_MODES" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="needActionTargeting">
          <el-form-item v-if="customTargetingOpen" label="行为天数">
            <el-select v-model="form.project.action_days" style="width: 100%">
              <el-option v-for="o in ACTION_DAYS" :key="o.value" :value="o.value" :label="o.label">{{ o.label }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="needActionTargeting">
          <el-form-item v-if="customTargetingOpen" label="行为关键词">
            <el-input v-model="form.project.action_words" placeholder="多个关键词用逗号分隔" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="needActionTargeting && customTargetingOpen" :gutter="12">
        <el-col :span="12">
          <el-form-item label="行为类目">
            <el-select v-model="form.project.action_categories" multiple filterable allow-create default-first-option placeholder="输入并选择行为类目" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item v-if="customTargetingOpen" label="重定向人群包（包含）">
            <el-select v-model="form.project.retargeting_tags_include" multiple placeholder="包含的重定向人群">
              <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="customTargetingOpen" label="重定向人群包（排除）">
            <el-select v-model="form.project.retargeting_tags_exclude" multiple placeholder="排除的重定向人群">
              <el-option v-for="p in audiencePackages" :key="p.id" :value="p.id" :label="p.name">{{ p.name }}</el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

        <el-table :data="projAudienceRows" size="small" border class="proj-inline-table">
          <el-table-column label="账户名称" min-width="220">
            <template #default="{ row }">
              <div class="ad-link-cell"><span>{{ row.account }}</span><span class="ad-link-cell__id">{{ row.accountId }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="定向包" min-width="220">
            <template #default="{ row }">
              <el-tag v-if="row.pack" closable class="ad-link-tag" @close="row.pack = ''">{{ row.pack }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template #default="{ row }"><el-button link type="primary" @click="targetingVisible = true">添加</el-button></template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 项目排期与预算 -->
      <div class="form-section">
<div class="form-section__title">
          项目排期与预算
          <el-button link type="primary" class="sec-collapse" @click="projectRuleFolded = !projectRuleFolded">{{ projectRuleFolded ? '展开' : '全部收起' }}</el-button>
        </div>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="配置模式">
            <el-radio-group v-model="form.project.schedule_config_mode" size="small">
              <el-radio-button value="UNIFIED">统一配置</el-radio-button>
              <el-radio-button value="PER_ACCOUNT">分账户配置</el-radio-button>
              <el-radio-button value="PER_SUBJECT">分主体配置</el-radio-button>
              <el-radio-button value="PER_PROJECT">分项目配置</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="投放时间">
            <el-radio-group v-model="form.project.schedule_time" size="small">
              <el-radio-button value="LONG_TERM">从今天到长期投放</el-radio-button>
              <el-radio-button value="CUSTOM">设置开始和结束日期</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="投放时段">
            <el-radio-group v-model="form.project.schedule_period" size="small">
              <el-radio-button value="ALL">不限</el-radio-button>
              <el-radio-button value="CUSTOM">指定时间段</el-radio-button>
            </el-radio-group>
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
      <el-row v-if="objCfg.nightFilter" :gutter="12">
        <el-col :span="8">
          <el-form-item label="过滤夜间">
            <el-radio-group v-model="form.project.night_filter" size="small">
              <el-radio-button value="OFF">不关闭</el-radio-button>
              <el-radio-button value="ON">关闭</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="项目预算" v-if="!isSearchAd">
            <el-radio-group v-model="form.project.budget_mode" size="small" @change="onBudgetModeChange">
              <el-radio-button v-for="o in budgetModeOptions" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="竞价策略">
            <template #label><span class="q-label">竞价策略</span><el-tooltip :content="TIPS.bid_strategy" placement="top"><el-icon class="q-icon"><QuestionFilled /></el-icon></el-tooltip></template>
            <div class="bid-cards">
              <div
                v-for="o in bidStrategyOptions"
                :key="o.value"
                class="bid-card"
                :class="{ active: form.project.bid_strategy === o.value }"
                @click="form.project.bid_strategy = o.value"
              >
                <div class="bid-card__title">{{ o.label }}</div>
                <div class="bid-card__desc">{{ o.desc }}</div>
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="objCfg.payMode">
          <el-form-item label="付费方式">
            <el-radio-group v-model="form.project.pay_method" size="small">
              <el-radio-button value="PRICING_OCPM">目标转化出价-按展示付费(OCPM)</el-radio-button>
            </el-radio-group>
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
      <!-- 线上：预算出价规则1（收起/展开），内含 日预算(快捷值) / 出价方式 / 出价 -->
      <div class="ad-summary">
        <span>竞价策略：<b>{{ projectBidSummary.bid_strategy }}</b></span>
        <span>优化目标：<b>{{ projectBidSummary.optimize_goal }}</b></span>
        <span>付费方式：<b>{{ projectBidSummary.pay_mode }}</b></span>
      </div>
      <el-form-item label="预算出价规则1">
        <span class="ad-rule-label">预算出价规则1</span>
        <el-button link type="primary" class="ad-rule-fold" @click="projectRuleFolded = !projectRuleFolded">
          {{ projectRuleFolded ? '展开' : '收起' }}
        </el-button>
      </el-form-item>
      <div v-show="!projectRuleFolded" class="ad-rule-box">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="日预算" required v-if="form.project.budget_mode === 'DAY'">
              <div class="ad-rule-budget">
                <el-input-number v-model="form.project.budget" :min="budgetMin" :step="50" controls-position="right" />
                <span class="ad-rule-quick">
                  <a v-for="q in [300, 500, 1000, 2000]" :key="q" @click="form.project.budget = q">{{ q }}</a>
                </span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出价方式">
              <el-radio-group v-model="form.project.bid_method" size="small">
                <el-radio-button v-for="o in BID_METHODS" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出价">
              <el-input-number v-model="form.project.bid" :min="bidMin" :step="0.1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      </div>


                <!-- 搜索快投（线上：出价系数 / 定向拓展 / 搜索快投服务；仅内容营销目的或搜索广告时出现） -->
      <div class="form-section" v-if="showSearchFast">
        <div class="form-section__title">搜索快投</div>
        <el-form-item label="关键词">
          <div class="sell-ops">
            <el-input v-model="searchForm.keyword" class="sell-input" placeholder="未添加关键词" readonly />
            <el-button link type="primary">编辑</el-button>
            <el-button link type="primary" @click="searchForm.keyword = ''">清空</el-button>
          </div>
        </el-form-item>
        <el-form-item label="出价系数" v-if="!isSearchAd">
          <el-radio-group v-model="searchForm.bid_coef" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">启用</el-radio-button>
          </el-radio-group>
          <div class="ad-hint">不再用出价系数时默认出价系数为1（仅针对可设置出价系数的账户生效）</div>
        </el-form-item>
        <el-form-item label="定向拓展" v-if="!isSearchAd">
          <template #label>
            <span class="q-label">定向拓展</span>
            <el-tooltip content="定向拓展仅对搜索广告生效，开启后可拓展更多相关人群。" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-radio-group v-model="searchForm.extend" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">启用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label=" ">
          <el-checkbox v-model="searchForm.service">搜索快投服务（仅支持媒体平台申请了搜索快投豁免账户，否则"出价系数"和"定向拓展"媒体API策略默认开启）</el-checkbox>
        </el-form-item>
      </div>
      <!-- 第三方监测链接（线上：除应用推广外，切换推广目的后出现） -->
      <div class="form-section" v-if="objCfg.thirdParty">
        <div class="form-section__title">第三方监测链接</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="第三方监测链接">
              <el-radio-group v-model="form.project.third_party_monitor" size="small">
                <el-radio-button value="OFF">不启用</el-radio-button>
                <el-radio-button value="ON">启用</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <template v-if="form.project.third_party_monitor === 'ON'">
          <div class="dlg-tip">仅在优化目标=APP下单且深度优化目标=ROI直投时支持多个监测链接,其他链路仅支持单个。</div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="第三方监测链接来源">
                <el-radio-group v-model="form.project.third_party_source" size="small">
                  <el-radio-button v-for="o in THIRD_PARTY_LINK_SOURCES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="匹配方式">
                <el-radio-group v-model="form.project.third_party_match" size="small">
                  <el-radio-button value="ALL">所有项目选择同一个监测链接</el-radio-button>
                  <el-radio-button value="PER_ACCOUNT">每个账户选择一个监测链接</el-radio-button>
                  <el-radio-button value="PER_PROJECT">每个项目选择一个监测链接</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="选择监测链接">
                <el-button type="primary" size="small" @click="pickMonitorLink">选择监测链接</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </div>
      <!-- 项目名称（线上独立分区） -->
      <div class="form-section">
        <div class="form-section__title">项目名称</div>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="项目默认状态">
            <el-radio-group v-model="form.project.operation" size="small">
              <el-radio-button value="DISABLE">暂停</el-radio-button>
              <el-radio-button value="ENABLE">开启</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="名称配置模式">
            <el-radio-group v-model="form.project.project_name_mode" size="small">
              <el-radio-button value="UNIFIED">统一配置</el-radio-button>
              <el-radio-button value="PER_ACCOUNT">分账户配置</el-radio-button>
            </el-radio-group>
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
          <el-form-item label="自动截断">
            <template #label><span class="q-label">自动截断</span><el-tooltip :content="TIPS.auto_truncate" placement="top"><el-icon class="q-icon"><QuestionFilled /></el-icon></el-tooltip></template><el-switch v-model="form.project.auto_truncate" /></el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="随机数后缀">
            <template #label><span class="q-label">随机数后缀</span><el-tooltip :content="TIPS.auto_truncate" placement="top"><el-icon class="q-icon"><QuestionFilled /></el-icon></el-tooltip></template><el-switch v-model="form.project.random_suffix" /></el-form-item>
        </el-col>
      </el-row>
        <div class="name-wildcards">
          <span class="name-wildcards__label">通配符:</span>
          <el-button link type="primary" @click="appendWildcard('下载链接标识')">下载链接标识</el-button>
          <el-button link type="primary" @click="appendWildcard('渠道包名')">渠道包名</el-button>
          <el-button link type="primary" @click="appendWildcard('监测活动名')">监测活动名</el-button>
          <el-button link type="primary" @click="wildcardMoreVisible = true">插入更多</el-button>
        </div>
        <div class="name-warn-hint">名称长度最多100字符（1汉字=2字符），使用通配符时，请注意控制自定义内容长度</div>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="onProjectCancel">取 消</el-button>
      <el-button type="primary" @click="onProjectConfirm">确 定</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
/* 「批量新建」页 · 新建项目抽屉（对齐线上 cl.mobgi.com/promotion/ad/toutiao/smart-assistant/batch）
 * 本组件从 Create.vue 的「项目配置弹窗」块原样搬移而来，业务状态全部来自
 * Create.vue 通过 provide('batch') 暴露的 setup 作用域。
 */
import { computed, inject, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, Expand, Fold, Link, QuestionFilled } from '@element-plus/icons-vue';
import {
  OBJECTIVES, APP_PROMOTION_TYPES, AD_TYPES, DELIVERY_MODE_EXTRA, MARKETING_GOALS,
  PLATFORM_TYPES, TRACK_LINK_SOURCES, EVENT_CALLBACK_TYPES, INVENTORY_TYPES,
  UNION_VIDEO_TYPES, LOCATION_TYPES, GENDERS, AGES, HIDE_CONVERTED,
  INTEREST_ACTION_MODES, ACTION_DAYS, DEEP_ACTIONS, BID_METHODS, CONFIG_MODES,
  WEEK_DAYS, SCHEDULE_HOURS,
} from '@/mock/data';
import { THIRD_PARTY_LINK_SOURCES } from '../../objectiveConfig';

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
  form, cardTitle, objCfg, relatedProductOptions, relatedProductOn, contentOptions,
  deliveryTypeOptions, bidStrategyOptions, showSearchFast, budgetModeOptions,
  isSearchAd, isLiveGoal, keywordPackOptions, harmonyApps, audiencePackages,
  orientationPackages, TIPS, budgetMin, bidMin, projectBidSummary, searchForm,
  customTargetingOpen, projectRuleFolded, adEstimate, relatedVisible, targetingVisible,
  projProductRows, projLinkRows, projAudienceRows, projEventRows, wildcardMoreVisible,
  externalActionOptions, needActionTargeting,
  onObjectiveChange, onAppPromoChange, onAdTypeChange, onMarketingGoalChange,
  onAssetGroupChange, onBudgetModeChange, onActionChange, onInterestModeChange,
  pickAssetGroup, pickEventAsset, pickLinkGroup, pickMonitorLink, pickGoodsCatalog,
  pickRtaStrategy, pickQuickApp, openMonitorGroup, openGuide, appendWildcard,
  onProjectConfirm, onProjectCancel,
  isSlotOn, onSlotMouseDown, onSlotEnter, endDrag, fillAllSlots,
} = batch;

/* 线上：右上角「预估广告数」浮层可折叠 */
const estFolded = ref(false);

/* 线上默认态（实测）：应用推广下子页签默认「应用调起」、关联产品投放默认「启用」。
   本地默认是「应用下载 / 不启用」，这里在抽屉首次打开时对齐线上（之后不再覆盖用户选择）。 */
const onlineDefaultApplied = ref(false);
watch(visible, (v) => {
  if (!v || onlineDefaultApplied.value) return;
  onlineDefaultApplied.value = true;
  if (objCfg.value.subTypes && form.project.app_promotion_type === 'DOWNLOAD') {
    form.project.app_promotion_type = 'LAUNCH';
  }
  if (objCfg.value.related === 'TOGGLE' && form.project.related_product === 'OFF') {
    form.project.related_product = 'ON';
  }
});
</script>

<style scoped>
/* ===== 抽屉外壳（el-drawer 自身结构在组件外，需非 scoped 样式，见下方 <style>） ===== */
/* 线上：抽屉内容区浅灰蓝底 + 每个分区白色圆角块 */
.drawer-form :deep(.el-row) { display: block; margin-left: 0; margin-right: 0; }
.drawer-form :deep(.el-col) { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
/* 线上：表单项行距 57px（控件 32px + 下间距 25px） */
.drawer-form :deep(.el-form-item) { margin-bottom: 25px; }
.drawer-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
.drawer-form :deep(.el-form-item__label) { font-size: 13px; color: #1d2129; line-height: 1.5; padding-bottom: 0; }
.drawer-form :deep(.el-form-item.is-required .el-form-item__label::before) { color: #f53f3f; margin-right: 4px; }
.drawer-form :deep(.el-input__wrapper),
.drawer-form :deep(.el-select__wrapper) { border-radius: 6px; }
/* 线上：单选按钮组是「连体按钮」（无间隙） */
.drawer-form :deep(.el-radio-group),
.drawer-form :deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 0; align-items: center; }
.drawer-form :deep(.el-radio-button__inner) { font-size: 14px; color: #333; padding: 8px 15px; }
.drawer-form :deep(.el-radio-button.is-active .el-radio-button__inner) { font-weight: 400; }

/* 分区块：线上 .module-container（白底 / 1px #e8eaec / 圆角 6px） */
.form-section { background: #fff; border: 1px solid #e8eaec; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
/* 线上 .cl-form-block-title：#fbfcfd 底 / 16px 700 #333 / 高 48 */
.form-section__title {
  margin: -16px -16px 16px;
  height: 48px;
  line-height: 48px;
  padding-left: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  background: #fbfcfd;
  border-bottom: 1px solid #e8eaec;
  border-radius: 5px 5px 0 0;
}
.form-section__title .sec-collapse { float: right; font-size: 12px; font-weight: 400; line-height: 48px; }

/* ===== 推广目的：7 张卡片（线上 .box-card-new 208×94） ===== */
.obj-form-item { margin-bottom: 18px; }
.obj-form-item :deep(.el-form-item__content) { margin-left: 0 !important; }
.obj-grid.el-radio-group { display: flex !important; flex-wrap: wrap; gap: 0; align-items: flex-start; margin-top: 0; flex-direction: initial; }
.obj-card {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 208px;
  min-height: 94px;
  margin: 0 16px 16px 0 !important;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 3px;
  cursor: pointer;
  transition: border-color .2s;
}
.obj-card :deep(.el-radio__input) { display: none; }
/* element-plus 的 .el-radio__label 默认 white-space: nowrap，线上卡片说明文案是 110px 宽自动换行 */
.obj-card :deep(.el-radio__label) { display: block; width: 100%; padding-left: 0; white-space: normal; }
.obj-card.is-checked { border-color: #197afb; }
.obj-label { display: block; font-size: 14px; line-height: 32px; color: #333; white-space: normal; }
.obj-desc { display: block; width: 110px; margin-top: 0; font-size: 12px; line-height: 18px; color: #999; white-space: normal; }
/* 线上 .card-img：48×48，绝对定位在卡片右侧垂直居中 */
.obj-img { position: absolute; top: 48px; right: 40px; width: 48px; height: 48px; object-fit: contain; transform: translate(50%, -50%); }

/* 子页签（应用下载 / 应用调起 / 预约下载）+ 提示文案 */
.sub-obj { margin: 0 0 18px; }
.sub-obj__hint { font-size: 12px; line-height: 24px; color: #999; margin-top: 0; }

/* 内广项目「加白指引」外链（线上 el-link + 图标） */
.proj-guide-link { margin-left: 12px; font-size: 12px; text-decoration: none; }
.proj-guide-link__icon { margin-right: 2px; vertical-align: -2px; }

/* 预估广告数浮层（线上：抽屉右上角 fixed 面板） */
.proj-estimate { position: fixed; top: 64px; right: 49px; z-index: 15; width: 240px; font-size: 12px; }
.proj-estimate__content {
  padding: 8px 16px;
  background: rgba(247, 247, 250, .49);
  border-bottom: 1px solid #dcdde2;
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, .2) 0 2px 4px;
}
.proj-estimate__title { margin: 16px 0; font-size: 12px; color: #333; }
.proj-estimate__row { margin-bottom: 8px; line-height: 17px; color: #808695; }
.proj-estimate__row:last-child { margin-bottom: 0; }
.proj-estimate__label { margin-right: 4px; font-weight: 700; color: #515a6e; }
.proj-estimate__num { color: #2e71ea; }
.proj-estimate__expend { position: absolute; top: 0; right: -24px; font-size: 24px; color: #197afb; cursor: pointer; }
.proj-estimate.is-folded .proj-estimate__content { display: none; }
.proj-estimate.is-folded .proj-estimate__expend { top: 0; }

/* 通用小部件（自 Create.vue 搬移） */
.sel-row { display: flex; align-items: center; gap: 10px; width: 100%; }
.sel-row__ctrl { flex: 1; }
.sel-row__link { font-size: 12px; margin-left: 8px; }
.sel-picked { margin-left: 10px; font-size: 12px; color: #86909c; }
.dlg-tip { font-size: 12px; color: #86909c; margin-bottom: 12px; }
.ad-warn-hint { width: 100%; font-size: 12px; color: #e6a23c; margin-top: 4px; }
.ad-hint { width: 100%; font-size: 12px; color: #86909c; margin-top: 4px; }
.ad-summary { display: flex; gap: 28px; padding: 10px 12px; margin-bottom: 12px; background: #f5f6f7; border-radius: 4px; font-size: 12px; color: #86909c; }
.ad-summary b { color: #1d2129; font-weight: 600; }
.ad-rule-label { margin-right: 12px; }
.ad-rule-fold { font-size: 12px; }
.ad-rule-box { display: flex; gap: 16px; }
.ad-rule-budget { display: flex; align-items: center; gap: 10px; width: 100%; }
.ad-rule-quick { display: flex; gap: 8px; font-size: 12px; }
.ad-rule-quick a { color: #197afb; cursor: pointer; }
.bid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; width: 100%; }
.bid-card { padding: 10px 12px; border: 1px solid #e5e6eb; border-radius: 4px; cursor: pointer; background: #fff; transition: border-color .2s; }
.bid-card.active { border-color: #197afb; background: #f5f9ff; }
.bid-card__title { font-size: 13px; font-weight: 600; color: #1d2129; }
.bid-card__desc { font-size: 12px; color: #86909c; margin-top: 6px; line-height: 1.5; }
.q-label { margin-right: 4px; }
.q-icon { color: #86909c; cursor: help; vertical-align: -2px; }
.proj-inline-table { margin-top: 10px; }
.ad-link-cell { display: flex; flex-direction: column; font-size: 12px; color: #1d2129; }
.ad-link-cell__id { color: #86909c; }
.ad-link-tag { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.name-wildcards { display: flex; align-items: center; gap: 10px; margin-top: 6px; font-size: 13px; color: #4e5969; }
.name-wildcards__label { color: #86909c; }
.name-warn-hint { font-size: 12px; color: #e6a23c; margin-top: 8px; }
.sell-ops { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.sell-input { flex: 1; }
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
</style>

<!-- el-drawer 的外壳（header / body / footer）由 element-plus 渲染，不带本组件的 scope id，
     故此处用非 scoped 样式并以 .batch-proj-drawer 前缀限定作用域 -->
<style>
.batch-proj-drawer.el-drawer { background: #f0f2f5; box-shadow: rgba(0, 0, 0, .2) -8px 0 8px; }
.batch-proj-drawer .el-drawer__header {
  position: relative;
  box-sizing: border-box;
  height: 49px;
  margin-bottom: 0;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
}
.batch-proj-drawer .el-drawer__title { font-size: 16px; font-weight: 700; line-height: 48px; color: #333; }
.batch-proj-drawer__title { font-size: 16px; font-weight: 700; line-height: 48px; color: #333; }
/* 线上：关闭按钮是抽屉左侧外的一个蓝色方块 X */
.batch-proj-drawer__close {
  position: absolute;
  top: 10px;
  left: -32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: #197afb;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}
.batch-proj-drawer__close:hover { background: #165dff; }
.batch-proj-drawer .el-drawer__body {
  padding: 0 16px 16px;
  margin: 16px 0 0 16px;
  background: #f0f2f5;
  overflow: auto;
}
.batch-proj-drawer .el-drawer__footer {
  box-sizing: border-box;
  height: 70px;
  padding: 12px 16px 24px;
  background: #fff;
  border-top: 1px solid #e8eaec;
  text-align: right;
}
.batch-proj-drawer .el-drawer__footer .el-button { min-width: 88px; height: 32px; }
.batch-proj-drawer .el-drawer__footer .el-button + .el-button { margin-left: 16px; }
</style>
