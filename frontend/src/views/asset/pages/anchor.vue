<template>
  <div class="anchor-page">
    <!-- 页面标题（线上 mg-title-header / h1「原生锚点模板」） -->
    <div class="asset-title-bar">
      <span class="asset-title">原生锚点模板</span>
    </div>

    <!-- ① 查询条件：锚点类型（多选、可清空、可搜索） + 关键词搜索框 + 清空 -->
    <div class="filter-row">
      <div class="filter-left">
        <div class="filter-cell">
          <label class="filter-label">锚点类型：</label>
          <el-select
            v-model="query.anchor_type"
            class="filter-select"
            size="small"
            filterable
            clearable
            placeholder="请选择锚点类型"
            @change="onSearch"
          >
            <el-option v-for="o in ANCHOR_TYPE" :key="o.id" :label="o.label" :value="o.id" />
          </el-select>
        </div>

        <!-- 线上该页无「字段类型」下拉，只有 关键词输入 + 🔍 + 批量搜索气泡 -->
        <div class="an-search-cell">
          <div class="cl-search">
            <el-input
              v-model="keyword"
              class="search-input"
              size="small"
              placeholder="请输入关键词"
              @keyup.enter="onSearch"
            >
              <template #suffix>
                <el-popover
                  placement="bottom-end"
                  :width="640"
                  trigger="click"
                  popper-class="an-batch-popper"
                >
                  <template #reference>
                    <span class="an-batch-icon" title="批量搜索">
                      <svg
                        viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        width="1em" height="1em"
                      >
                        <path
                          d="M881.4 250.9H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h739.9c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM272.1 454H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5S296 454 272.1 454zM272.1 657.1H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h130.6c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5zM853.8 847.5L715.3 709c-16.9-16.9-16.9-44.6 0-61.5s44.6-16.9 61.5 0L915.3 786c16.9 16.9 16.9 44.6 0 61.5s-44.6 16.9-61.5 0zM467.9 860.2H141.5c-23.9 0-43.5-19.6-43.5-43.5s19.6-43.5 43.5-43.5h326.4c23.9 0 43.5 19.6 43.5 43.5s-19.6 43.5-43.5 43.5z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </template>
                  <div class="an-batch">
                    <div class="an-batch__head">
                      <span>请输入锚点名称（{{ batchLineCount }}/1000）</span>
                      <a class="an-batch__clear" @click="batchText = ''">清空</a>
                    </div>
                    <div class="an-batch__desc">
                      每一行为一个关键词，批量搜索将执行
                      <el-popover placement="right" :width="400" trigger="hover" popper-class="an-batch__tip-popper">
                        <template #reference>
                          <a class="an-batch__mode" @click="exactMatch = !exactMatch">{{ exactMatch ? '精确匹配' : '模糊匹配' }}</a>
                        </template>
                        <p class="an-batch__tip-title">{{ exactMatch ? '精准匹配' : '模糊匹配' }}</p>
                        <p class="an-batch__tip-text">
                          {{
                            exactMatch
                              ? '指被搜索的内容需要与搜索关键词完全一致。如：输入关键字为“爆款素材”时，精准匹配只能搜索到锚点名称为“爆款素材”的内容'
                              : '指被搜索的内容只需要包含搜索关键词即可被搜索出来。如：输入关键字为“爆款素材”时，模糊匹配可以搜到锚点名称为“xxx爆款素材xxx”、“aaa爆款素材”等内容'
                          }}
                        </p>
                      </el-popover>
                      。
                    </div>
                    <div class="an-batch__editor">
                      <div class="an-batch__gutter">
                        <div v-for="n in batchLineCount" :key="n" class="an-batch__gutter-line">{{ n }}</div>
                      </div>
                      <el-input
                        v-model="batchText"
                        type="textarea"
                        resize="none"
                        :rows="12"
                        placeholder="请粘贴或输入锚点名称，回车可换行"
                      />
                    </div>
                    <div class="batch-search-ops">
                      <el-button size="small" @click="batchText = ''">清空</el-button>
                      <el-button size="small" type="primary" @click="applyBatchSearch">搜索</el-button>
                    </div>
                  </div>
                </el-popover>
              </template>
              <template #append>
                <el-button :icon="Search" title="搜索" @click="onSearch" />
              </template>
            </el-input>
          </div>
        </div>

        <a class="filter-clear" @click="onClearFilters">清空</a>
      </div>
    </div>

    <!-- ② 工具栏：线上仅「新建原生锚点」一个按钮 -->
    <div class="table-toolbar">
      <el-button type="primary" size="small" class="tool-btn" @click="openDialog('create')">
        新建原生锚点
      </el-button>
    </div>

    <!-- ③ 列表（线上 el-table border / size mini / show-overflow-tooltip） -->
    <el-table
      :data="pagedList"
      row-key="id"
      border
      size="small"
      show-overflow-tooltip
      class="asset-table"
    >
      <el-table-column prop="anchor_point_name" label="模板名称" width="430" show-overflow-tooltip />
      <el-table-column prop="anchor_type" label="锚点类型" width="321" show-overflow-tooltip>
        <template #default="{ row }">{{ typeLabel(row.anchor_type) }}</template>
      </el-table-column>
      <el-table-column prop="user_name" label="创建人" width="428" />
      <el-table-column prop="create_time" label="创建时间" width="428" />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="onCopy(row)">复制</el-button>
          <el-button link type="primary" size="small" @click="openDialog('edit', row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ④ 分页：线上 total_count > 10 才显示 -->
    <div v-if="total > 10" class="pager-card">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- ⑤ 新建 / 编辑原生锚点模板 弹窗（线上 el-dialog，width 800，label-width 120） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      class="an-dialog"
      append-to-body
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="left"
        size="small"
        class="an-form"
      >
        <!-- 锚点模板名称 -->
        <el-form-item label="锚点模板名称" prop="anchor_point_name">
          <el-input
            v-model="form.anchor_point_name"
            class="an-input"
            placeholder="请输入"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <!-- 锚点模板类型（编辑态禁用） -->
        <el-form-item label="锚点模板类型" prop="anchor_type">
          <el-select
            v-model="form.anchor_type"
            class="an-input"
            placeholder="请选择锚点模板类型"
            :disabled="operateType === 'edit'"
            @change="onAnchorTypeChange"
          >
            <el-option v-for="o in ANCHOR_TYPE" :key="o.id" :label="o.label" :value="o.id" />
          </el-select>
        </el-form-item>

        <!-- 工具名称（快应用为「锚点名称」）+ 通配符 -->
        <el-form-item :label="isQuickApp ? '锚点名称' : '工具名称'" prop="tool_title">
          <el-input
            v-model="form.tool_title"
            class="an-input"
            placeholder="名称用于您自己管理组件，不会对外显示"
            maxlength="15"
            show-word-limit
          />
          <div class="an-wildcard">
            <span class="an-wildcard__desc">通配符:</span>
            <el-button
              v-for="w in wildcards"
              :key="w.name"
              class="an-wildcard__btn"
              link
              size="small"
              :icon="Plus"
              :disabled="form.tool_title.includes(w.value)"
              @click="addWildcard(w.value)"
            >{{ w.name }}</el-button>
          </div>
        </el-form-item>

        <!-- iOS端锚点标题 -->
        <el-form-item v-if="showIosTitle" label="iOS端锚点标题" prop="ios_anchor_title">
          <el-input
            v-model="form.ios_anchor_title"
            class="an-input"
            placeholder="请输入与iOS端应用名称相关的引导文案"
            maxlength="12"
            show-word-limit
          />
        </el-form-item>

        <!-- 安卓端锚点标题 -->
        <el-form-item v-if="!isShoppingCart" label="安卓端锚点标题" prop="android_anchor_title">
          <el-input
            v-model="form.android_anchor_title"
            class="an-input"
            placeholder="请输入与安卓端应用名称相关的引导文案"
            maxlength="12"
            show-word-limit
          />
        </el-form-item>

        <!-- 鸿蒙端锚点标题 -->
        <el-form-item v-if="isInternetServiceGeneral" label="鸿蒙端锚点标题" prop="harmony_anchor_title">
          <el-input
            v-model="form.harmony_anchor_title"
            class="an-input"
            placeholder="请输入与鸿蒙端应用名称相关的引导文案"
            maxlength="12"
            show-word-limit
          />
        </el-form-item>

        <!-- 顶部头图（电商-购物 无此字段） -->
        <el-form-item v-if="!isShoppingCart" label="顶部头图" prop="head_image_list">
          <div class="an-upload-row">
            <div
              v-for="(img, i) in form.head_image_list"
              :key="img.uid"
              class="an-upload__item an-upload__item--horizontal"
            >
              <img class="an-upload__img" :src="img.url" :alt="img.name" />
              <i class="an-upload__del" @click="removeImage('head_image_list', i)">✕</i>
            </div>
            <div
              v-if="form.head_image_list.length < maxHeadImageNum"
              class="an-upload an-upload--horizontal"
              @click="openPicker('head_image_list', maxHeadImageNum)"
            >
              <i class="an-upload__plus">＋</i>
              <span>图片({{ form.head_image_list.length }}/{{ maxHeadImageNum }})</span>
            </div>
          </div>
          <div class="an-upload__tips">请上传大小不超过{{ isQuickApp ? '5M' : '1.5M' }}的图片，推荐尺寸2:1</div>
        </el-form-item>

        <!-- 小游戏icon / 应用icon -->
        <el-form-item v-if="showIcon" :label="iconLabel" prop="icon_images">
          <div class="an-upload-row">
            <div
              v-for="(img, i) in form.icon_images"
              :key="img.uid"
              class="an-upload__item an-upload__item--square"
            >
              <img class="an-upload__img" :src="img.url" :alt="img.name" />
              <i class="an-upload__del" @click="removeImage('icon_images', i)">✕</i>
            </div>
            <div
              v-if="form.icon_images.length < 1"
              class="an-upload an-upload--square"
              @click="openPicker('icon_images', 1)"
            >
              <i class="an-upload__plus">＋</i>
              <span>图片</span>
            </div>
          </div>
          <div class="an-upload__tips">请上传{{ iconLabel }}图，比例1:1，大小不超过1M</div>
        </el-form-item>

        <!-- 游戏标签 / APP标签（电商-购物 无此字段） -->
        <el-form-item v-if="!isShoppingCart" :label="tagLabel" prop="app_tags">
          <div v-for="(tag, i) in form.app_tags" :key="i" class="an-tag">
            <el-input
              v-model="form.app_tags[i]"
              class="an-input"
              :placeholder="isGameType ? '请输入游戏标签' : '请输入APP标签'"
              :maxlength="isGameType ? 6 : 4"
              show-word-limit
            />
            <el-popover
              v-if="i === 0"
              placement="right"
              :width="300"
              trigger="hover"
              popper-class="mg-popover"
            >
              <template #reference>
                <i class="an-icon-question" title="小屏手机情况下，有可能会隐藏部分超长的内容">?</i>
              </template>
              小屏手机情况下，有可能会隐藏部分超长的内容
            </el-popover>
            <i v-else class="an-icon-close" @click="form.app_tags.splice(i, 1)">✕</i>
          </div>
          <el-button
            v-show="form.app_tags.length < maxAppTagsNum"
            class="an-add-btn"
            link
            size="small"
            :icon="Plus"
            @click="form.app_tags.push('')"
          >添加</el-button>
        </el-form-item>

        <!-- 引导文案（电商-购物 无此字段） -->
        <el-form-item v-if="!isShoppingCart" label="引导文案" prop="guide_text">
          <el-input
            v-model="form.guide_text"
            class="an-input"
            placeholder="请输入引导文案"
            maxlength="15"
            show-word-limit
          />
        </el-form-item>

        <!-- 图片展示比例（电商-购物 无此字段） -->
        <el-form-item v-if="!isShoppingCart" label="图片展示比例" prop="anchor_image_mode">
          <el-radio-group v-model="form.anchor_image_mode" @change="onImageModeChange">
            <el-radio-button :value="100">横图（2:1）</el-radio-button>
            <el-radio-button :value="200">竖图（3:5）</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 游戏图片 / APP图片（电商-购物 无此字段） -->
        <el-form-item v-if="!isShoppingCart" :label="appImageLabel" prop="app_images">
          <div class="an-upload-row">
            <div
              v-for="(img, i) in form.app_images"
              :key="img.uid"
              class="an-upload__item"
              :class="form.anchor_image_mode === 100 ? 'an-upload__item--horizontal' : 'an-upload__item--vertical'"
            >
              <img class="an-upload__img" :src="img.url" :alt="img.name" />
              <i class="an-upload__del" @click="removeImage('app_images', i)">✕</i>
            </div>
            <div
              v-if="form.app_images.length < maxGameImageNum"
              class="an-upload"
              :class="form.anchor_image_mode === 100 ? 'an-upload--horizontal' : 'an-upload--vertical'"
              @click="openPicker('app_images', maxGameImageNum)"
            >
              <i class="an-upload__plus">＋</i>
              <span>图片({{ form.app_images.length }}/{{ maxGameImageNum }})</span>
            </div>
          </div>
          <div class="an-upload__tips">
            请上传最少3张，最多8张大小不超过{{ isQuickApp ? '5M' : '1.5M' }}的图片
          </div>
        </el-form-item>

        <!-- 游戏简介 / 游戏特色 / 其他说明（选填） -->
        <template v-if="isGameType">
          <el-form-item label="游戏简介" prop="game_description">
            <el-input
              v-model="form.game_description"
              class="an-input"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              resize="none"
              placeholder="请简要的介绍游戏，让用户快速了解游戏"
              maxlength="45"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="游戏特色" prop="game_charatoristic">
            <el-input
              v-model="form.game_charatoristic"
              class="an-input"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              resize="none"
              placeholder="请简要介绍游戏特色或亮点"
              maxlength="45"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="其他说明（选填）" prop="other_description">
            <el-input
              v-model="form.other_description"
              class="an-input"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              resize="none"
              placeholder="请输入对游戏的其他介绍"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </template>

        <!-- APP详情（网服类） -->
        <el-form-item v-if="showAppDescription" label="APP详情" prop="app_description">
          <el-input
            v-model="form.app_description"
            class="an-input"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 8 }"
            resize="none"
            placeholder="请简要的介绍APP，让用户快速了解APP"
            :maxlength="isQuickApp ? 200 : 100"
            show-word-limit
          />
        </el-form-item>

        <!-- 小说章节（选填）（网服-常规下载 / 网服-快应用） -->
        <el-form-item
          v-if="isInternetServiceGeneral || isQuickApp"
          label="小说章节（选填）"
          prop="novel_chapter"
        >
          <el-input
            v-model="form.novel_chapter"
            class="an-input"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 8 }"
            resize="none"
            placeholder="请输入小说章节"
            maxlength="9999"
            show-word-limit
          />
        </el-form-item>

        <!-- 游戏福利（仅 游戏-常规下载） -->
        <template v-if="isAppGameGeneral">
          <el-form-item label="游戏福利" prop="game_bonus">
            <el-radio-group v-model="form.game_bonus" @change="onGameBonusChange">
              <el-radio-button class="an-radio-wide" :value="true">启用</el-radio-button>
              <el-radio-button class="an-radio-wide" :value="false">不启用</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <template v-if="form.game_bonus">
            <el-form-item label="礼包来源" prop="gift_source">
              <el-radio-group v-model="form.gift_source">
                <el-radio-button value="">手动创建</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="添加游戏礼包" prop="game_package_list">
              <el-popover
                :disabled="form.game_package_list.length < maxGamePackageNum"
                placement="top"
                trigger="hover"
                content="游戏礼包数量已达上限"
              >
                <template #reference>
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="form.game_package_list.length >= maxGamePackageNum"
                    @click="openPackageDialog()"
                  >添加游戏礼包（{{ form.game_package_list.length }}/{{ maxGamePackageNum }}）</el-button>
                </template>
              </el-popover>

              <div v-if="form.game_package_list.length" class="an-pkg-list">
                <div v-for="(p, i) in form.game_package_list" :key="i" class="an-pkg-list__item">
                  <div class="an-pkg-list__name">{{ p.game_package_name }}</div>
                  <div class="an-pkg-list__code">
                    <span class="ml8">安卓：{{ p.android_package_code }}</span>
                    <span>iOS：{{ p.ios_package_code }}</span>
                  </div>
                  <div class="an-pkg-list__pics">
                    <div v-for="(g, gi) in p.gift" :key="gi" class="an-pkg-list__pic" />
                  </div>
                  <i class="an-pkg-list__edit" @click="openPackageDialog(i)">✎</i>
                  <i class="an-pkg-list__del" @click="form.game_package_list.splice(i, 1)">✕</i>
                </div>
              </div>
            </el-form-item>
          </template>
        </template>

        <!-- 电商-购物 专属字段 -->
        <template v-if="isShoppingCart">
          <el-form-item label="购物车标题" prop="title">
            <el-input
              v-model="form.title"
              class="an-input"
              placeholder="请输入与购物车标题相关的引导文案"
              maxlength="10"
              show-word-limit
            />
            <p class="an-upload__tips">展示位置在对应视频的左下角与评论区上方</p>
          </el-form-item>

          <el-form-item label="商品图片" prop="product_images">
            <div class="an-upload-row">
              <div
                v-for="(img, i) in form.product_images"
                :key="img.uid"
                class="an-upload__item an-upload__item--square"
              >
                <img class="an-upload__img" :src="img.url" :alt="img.name" />
                <i class="an-upload__del" @click="removeImage('product_images', i)">✕</i>
              </div>
              <div
                v-if="form.product_images.length < maxProductImageNum"
                class="an-upload an-upload--square"
                @click="openPicker('product_images', maxProductImageNum)"
              >
                <i class="an-upload__plus">＋</i>
                <span>图片({{ form.product_images.length }}/{{ maxProductImageNum }})</span>
              </div>
            </div>
            <div class="an-upload__tips">
              至少上传1张，最多上传5张。图片比例1:1，大小不超过5M，支持裁剪，推荐尺寸750*750px
            </div>
          </el-form-item>

          <el-form-item label="价格" prop="product_price">
            <el-input v-model="form.product_price" class="an-input" placeholder="请输入价格" />
            <p class="an-upload__tips">建议设置为商品详情里的最低价格</p>
          </el-form-item>

          <el-form-item label="商品标题" prop="product_title">
            <el-input
              v-model="form.product_title"
              class="an-input"
              placeholder="请输入商品标题"
              maxlength="35"
              show-word-limit
            />
            <p class="an-upload__tips">建议设置与商品详情页一致的商品标题</p>
          </el-form-item>

          <el-form-item label="商品来源" prop="product_source">
            <el-select v-model="form.product_source" class="an-input" placeholder="请选择商品来源">
              <el-option v-for="s in PRODUCT_SOURCE_LIST" :key="s" :label="s" :value="s" />
            </el-select>
            <p class="an-upload__tips">页面按钮会根据商品来源自动显示文案</p>
          </el-form-item>

          <el-form-item label="链接类型" prop="link_type">
            <el-radio v-model="form.link_type" value="ONE_JUMP">一跳</el-radio>
          </el-form-item>

          <el-form-item label="落地页链接">
            <p class="an-fix-show">系统自动匹配广告中首个落地页链接</p>
          </el-form-item>

          <el-form-item label="直达链接">
            <p class="an-fix-show">系统自动匹配广告中首个 Deeplink，若不开启则置为空</p>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <div class="an-dialog-footer">
          <el-button class="an-dialog-footer__btn" plain @click="dialogVisible = false">取 消</el-button>
          <el-button class="an-dialog-footer__btn" type="primary" @click="onSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ⑥ 游戏福利（礼包）弹窗 -->
    <el-dialog
      v-model="packageVisible"
      title="游戏福利"
      width="800px"
      class="an-dialog"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="pkgRef"
        :model="pkgForm"
        :rules="pkgRules"
        label-width="140px"
        label-position="left"
        size="small"
        class="an-form"
      >
        <el-form-item label="礼包名称" prop="game_package_name">
          <el-input
            v-model="pkgForm.game_package_name"
            class="an-input"
            placeholder="请输入"
            maxlength="14"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="Android礼包码" prop="android_package_code">
          <el-input
            v-model="pkgForm.android_package_code"
            class="an-input"
            placeholder="请输入"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="iOS礼包码" prop="ios_package_code">
          <el-input
            v-model="pkgForm.ios_package_code"
            class="an-input"
            placeholder="请输入"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="礼包内的礼品配置" prop="gift">
          <el-popover
            :disabled="pkgForm.gift.length < maxGiftNum"
            placement="top"
            trigger="hover"
            content="礼品数量已达上限"
          >
            <template #reference>
              <el-button
                type="primary"
                size="small"
                :disabled="pkgForm.gift.length >= maxGiftNum"
                @click="pkgForm.gift.push(newGift())"
              >添加礼品（{{ pkgForm.gift.length }}/{{ maxGiftNum }}）</el-button>
            </template>
          </el-popover>

          <div v-if="pkgForm.gift.length" class="an-gift-list">
            <div v-for="(g, i) in pkgForm.gift" :key="i" class="an-gift-list__item">
              <div class="an-gift-list__pic" @click="openPicker('gift', 1, i)">
                <img v-if="g.gift_image_url" class="an-upload__img" :src="g.gift_image_url" alt="礼品" />
                <span v-else>添加图片</span>
              </div>
              <div class="an-gift-list__info">
                <el-input
                  v-model="g.gift_name"
                  class="an-input"
                  placeholder="请输入"
                  maxlength="8"
                  show-word-limit
                />
                <el-input
                  v-model="g.gift_amount"
                  class="an-input mt16"
                  placeholder="请输入礼包数量"
                  maxlength="6"
                  show-word-limit
                >
                  <template #append>
                    <el-select v-model="g.gift_unit" class="an-append-select" placeholder="请选择">
                      <el-option label="个" value="INDIVIDUAL" />
                      <el-option label="万" value="MYRIAD" />
                    </el-select>
                  </template>
                </el-input>
              </div>
              <i class="an-pkg-list__del" @click="pkgForm.gift.splice(i, 1)">✕</i>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="游戏礼包使用期限" prop="daterange">
          <el-date-picker
            v-model="pkgForm.daterange"
            type="daterange"
            range-separator="至"
            start-placeholder="请选择礼包有效期"
            end-placeholder="请选择礼包有效期"
            value-format="yyyy-MM-dd"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="游戏礼包使用规则" prop="gift_regulation">
          <el-input
            v-model="pkgForm.gift_regulation"
            class="an-input"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            resize="none"
            placeholder="请输入礼包码的具体兑换路径，如人物等级10级-左侧菜单-福利-输入礼包码兑换"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="an-dialog-footer">
          <el-button class="an-dialog-footer__btn" plain @click="packageVisible = false">取 消</el-button>
          <el-button class="an-dialog-footer__btn" type="primary" @click="onPackageSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ⑦ 素材（图片）选择弹窗 -->
    <el-dialog
      v-model="pickerVisible"
      title="选择图片"
      width="720px"
      class="an-dialog"
      append-to-body
    >
      <div class="an-material-grid">
        <div
          v-for="m in MOCK_MATERIALS"
          :key="m.id"
          class="an-material"
          @click="onPickMaterial(m)"
        >
          <img class="an-material__img" :src="m.url" :alt="m.name" />
          <div class="an-material__name">{{ m.name }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';

const props = defineProps({
  kind: { type: String, default: '' },
});

/* ---------------- 常量（与线上保持一致） ---------------- */

// 锚点模板类型（线上 ANCHOR_TYPE）
const ANCHOR_TYPE = [
  { id: 'APP_GAME_GENERAL', label: '游戏-常规下载' },
  { id: 'APP_GAME_MICRO_GAME', label: '游戏-微信小游戏' },
  { id: 'APP_INTERNET_SERVICE_GENERAL', label: '网服-常规下载' },
  { id: 'APP_INTERNET_SERVICE_MICRO_APP', label: '网服-微信小程序' },
  { id: 'APP_INTERNET_SERVICE_QUICK_APP', label: '网服-快应用' },
  { id: 'SHOPPING_CART_GENERAL', label: '电商-购物' },
];

// 电商-购物 的商品来源（线上 PRODUCT_SOURCE_LIST）
const PRODUCT_SOURCE_LIST = ['淘宝', '天猫', '京东', '拼多多', '唯品会', '得物', '1688'];

const maxHeadImageNum = 5;
const maxGameImageNum = 8;
const maxProductImageNum = 5;
const maxGamePackageNum = 3;
const maxGiftNum = 8;

function typeLabel(id) {
  return (ANCHOR_TYPE.find((t) => t.id === id) || {}).label || id || '-';
}

/* ---------------- mock 数据 ---------------- */

const MOCK_NAMES = [
  '手游通用锚点模板-竖版', '游戏-常规下载-标准模板', '小游戏轻量引导锚点',
  '网服下载通用锚点', '小程序跳转锚点模板', '快应用应用宝锚点',
  '电商购物车左下角锚点', '游戏礼包活动锚点', '预约有礼锚点模板',
  '新游首发通用锚点', '游戏攻略引导锚点', '二次元角色锚点',
  '放置挂机小游戏锚点', '工具类应用下载锚点', '网服开服活动锚点',
  '618大促购物车锚点', '双十一预热锚点', '游戏视频评论锚点',
  '休闲小游戏去广告锚点', 'SLG策略游戏锚点', '模拟经营游戏锚点',
  '小说阅读网服锚点', '小说改编短剧锚点', '网服小说章节锚点',
  '抖音小游戏广告锚点', '快应用跳转锚点',
];

const MOCK_USERS = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨帆', '赵磊', '周敏'];

function mockTime(i) {
  const d = new Date(2025, 10, 18, 9, 30, 0);
  d.setDate(d.getDate() - i);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const list = ref(
  MOCK_NAMES.map((name, i) => ({
    id: 1000 + i,
    anchor_point_name: name,
    anchor_type: ANCHOR_TYPE[i % ANCHOR_TYPE.length].id,
    user_name: MOCK_USERS[i % MOCK_USERS.length],
    create_time: mockTime(i),
  })),
);

/* ---------------- 素材（图片）mock ---------------- */

function svgThumb(label, w, h, bg, fg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/><text x="${w / 2}" y="${h / 2 + 5}" font-size="13" fill="${fg}" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MOCK_MATERIALS = Array.from({ length: 12 }, (_, i) => ({
  id: `mat_${i + 1}`,
  name: `素材${i + 1}`,
  url: svgThumb(`素材${i + 1}`, 160, 160, i % 2 ? '#eef4ff' : '#f5f7fa', '#197afb'),
}));

/* ---------------- 查询条件 / 列表 ---------------- */

const query = reactive({ anchor_type: '' });
const keyword = ref('');
const batchText = ref('');
// 线上批量搜索气泡计数为「行数」（空内容也算 1 行，上限 1000 行）
const batchLineCount = computed(() => Math.min(1000, batchText.value.split('\n').length));
const exactMatch = ref(true);
const pageNo = ref(1);
const pageSize = ref(10);

function onSearch() {
  pageNo.value = 1;
}

function onClearFilters() {
  query.anchor_type = '';
  keyword.value = '';
  batchText.value = '';
  pageNo.value = 1;
}

function applyBatchSearch() {
  const words = batchText.value
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean);
  if (!words.length) {
    keyword.value = '';
  } else {
    keyword.value = words.join(',');
  }
  onSearch();
}

const filteredList = computed(() => {
  let rows = list.value;
  const type = query.anchor_type || '';
  if (type) {
    rows = rows.filter((r) => r.anchor_type === type);
  }
  const kw = keyword.value.trim();
  if (kw) {
    const words = kw.split(',').map((w) => w.trim()).filter(Boolean);
    rows = rows.filter((r) => {
      const name = String(r.anchor_point_name || '');
      return words.some((w) => (exactMatch.value ? name === w : name.includes(w)));
    });
  }
  return rows;
});

const total = computed(() => filteredList.value.length);
const pagedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

watch([pageSize, total], () => {
  const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value));
  if (pageNo.value > maxPage) pageNo.value = maxPage;
});

/* ---------------- 行内操作 ---------------- */

function onCopy(row) {
  const copy = {
    ...row,
    id: Date.now(),
    anchor_point_name: `${row.anchor_point_name}-复制`,
    create_time: mockTime(0),
  };
  list.value.unshift(copy);
  ElMessage.success('模板复制成功！');
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该模板吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch (e) {
    return;
  }
  list.value = list.value.filter((x) => x.id !== row.id);
  ElMessage.success('模板删除成功！');
}

/* ---------------- 新建 / 编辑弹窗 ---------------- */

const dialogVisible = ref(false);
const dialogTitle = ref('新建原生锚点模板');
const operateType = ref('create');
const formRef = ref();

function emptyForm() {
  return {
    anchor_point_name: '',
    tool_title: '',
    anchor_type: 'APP_GAME_GENERAL',
    android_anchor_title: '',
    ios_anchor_title: '',
    harmony_anchor_title: '',
    head_image_list: [],
    icon_images: [],
    app_tags: [''],
    guide_text: '',
    anchor_image_mode: 100,
    app_images: [],
    game_description: '',
    app_description: '',
    novel_chapter: '',
    game_charatoristic: '',
    other_description: '',
    game_bonus: false,
    gift_source: '',
    game_package_list: [],
    title: '',
    product_images: [],
    product_price: '',
    product_title: '',
    product_source: '',
    link_type: 'ONE_JUMP',
  };
}

const form = reactive(emptyForm());
const editingId = ref(null);

const isGameType = computed(() => ['APP_GAME_GENERAL', 'APP_GAME_MICRO_GAME'].includes(form.anchor_type));
const isAppGameGeneral = computed(() => form.anchor_type === 'APP_GAME_GENERAL');
const isShoppingCart = computed(() => form.anchor_type === 'SHOPPING_CART_GENERAL');
const isQuickApp = computed(() => form.anchor_type === 'APP_INTERNET_SERVICE_QUICK_APP');
const isInternetServiceGeneral = computed(() => form.anchor_type === 'APP_INTERNET_SERVICE_GENERAL');
const showIosTitle = computed(() =>
  ['APP_GAME_GENERAL', 'APP_GAME_MICRO_GAME', 'APP_INTERNET_SERVICE_GENERAL', 'APP_INTERNET_SERVICE_MICRO_APP']
    .includes(form.anchor_type),
);
const showIcon = computed(() =>
  ['APP_GAME_MICRO_GAME', 'APP_INTERNET_SERVICE_MICRO_APP', 'APP_INTERNET_SERVICE_QUICK_APP']
    .includes(form.anchor_type),
);
const showAppDescription = computed(() =>
  ['APP_INTERNET_SERVICE_GENERAL', 'APP_INTERNET_SERVICE_MICRO_APP', 'APP_INTERNET_SERVICE_QUICK_APP']
    .includes(form.anchor_type),
);
const iconLabel = computed(() => (form.anchor_type === 'APP_GAME_MICRO_GAME' ? '小游戏icon' : '应用icon'));
const tagLabel = computed(() => (isGameType.value ? '游戏标签' : 'APP标签'));
const appImageLabel = computed(() => (isGameType.value ? '游戏图片' : 'APP图片'));
const maxAppTagsNum = computed(() => (isGameType.value ? 2 : 3));

// 通配符（随锚点模板类型联动，线上 getWildcard）
const wildcards = computed(() => {
  const t = form.anchor_type;
  const list2 = [
    { name: '监测活动名', value: '<监测活动名>' },
    { name: '落地页名', value: '<落地页名>' },
    { name: '日期', value: '<日期>' },
  ];
  if (['APP_GAME_GENERAL', 'APP_INTERNET_SERVICE_GENERAL'].includes(t)) {
    list2.unshift({ name: '应用名称', value: '<应用名称>' });
  }
  if (t === 'APP_GAME_MICRO_GAME') list2.unshift({ name: '小游戏名称', value: '<小游戏名称>' });
  if (t === 'APP_INTERNET_SERVICE_MICRO_APP') list2.unshift({ name: '小程序名称', value: '<小程序名称>' });
  if (t === 'APP_INTERNET_SERVICE_QUICK_APP') list2.unshift({ name: '快应用名称', value: '<快应用名称>' });
  if (['APP_GAME_GENERAL', 'APP_INTERNET_SERVICE_GENERAL', 'SHOPPING_CART_GENERAL'].includes(t)) {
    list2.unshift({ name: '直达链接名', value: '<直达链接名>' });
  }
  return list2;
});

const rules = {
  anchor_point_name: [
    { required: true, message: '请填写锚点模板名称', trigger: 'blur' },
    { min: 1, max: 100, message: '请输入1-100个字', trigger: 'blur' },
  ],
  tool_title: [
    { required: true, message: '请填写名称', trigger: 'blur' },
    { min: 1, max: 15, message: '请输入1-15个字', trigger: 'blur' },
  ],
  anchor_type: [{ required: true, message: '请选择锚点模板类型', trigger: 'change' }],
  ios_anchor_title: [{ required: true, message: '请填写iOS端锚点名称', trigger: 'blur' }],
  android_anchor_title: [{ required: true, message: '请填写安卓端锚点名称', trigger: 'blur' }],
  harmony_anchor_title: [{ required: true, message: '请填写鸿蒙端锚点名称', trigger: 'blur' }],
  app_tags: [
    {
      required: true,
      validator: (rule, value, cb) => {
        const name = isGameType.value ? '游戏标签' : 'APP标签';
        for (let i = 0; i < value.length; i++) {
          const v = value[i];
          if (!v) return cb(new Error(`请填写${name}`));
          if (v.length < 2) return cb(new Error(`${name}不能少于2个字`));
        }
        cb();
      },
      trigger: 'blur',
    },
  ],
  icon_images: [{ required: true, message: '请上传icon', trigger: 'blur' }],
  app_images: [
    {
      required: true,
      validator: (rule, value, cb) => {
        if (value.length < 3) return cb(new Error(`至少上传3张${appImageLabel.value}`));
        cb();
      },
      trigger: 'blur',
    },
  ],
  guide_text: [{ required: true, message: '请填写引导文案', trigger: 'blur' }],
  game_description: [{ required: true, message: '请输入游戏简介', trigger: 'blur' }],
  app_description: [{ required: true, message: '请输入APP详情', trigger: 'blur' }],
  game_charatoristic: [{ required: true, message: '请输入游戏特色', trigger: 'blur' }],
  title: [
    { required: true, message: '请填写购物车标题', trigger: 'blur' },
    { min: 1, max: 10, message: '请输入1-10个字', trigger: 'blur' },
  ],
  product_images: [{ required: true, message: '请上传商品图片', trigger: 'blur' }],
  product_price: [
    { required: true, message: '请填写价格', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        if (value === 0 || /^\d+(\.[0-9]{1,2})?$/.test(String(value))) cb();
        else cb(new Error('请输入正确的价格，价格必须大于零，最多支持2位小数'));
      },
      trigger: 'blur',
    },
  ],
  product_title: [
    { required: true, message: '请填写商品标题', trigger: 'blur' },
    { min: 1, max: 35, message: '请输入1-35个字', trigger: 'blur' },
  ],
  product_source: [{ required: true, message: '请选择商品来源', trigger: 'change' }],
  link_type: [{ required: true, message: '请选择连接类型', trigger: 'change' }],
};

function openDialog(type, row) {
  operateType.value = type;
  Object.assign(form, emptyForm());
  if (type === 'edit' && row) {
    editingId.value = row.id;
    dialogTitle.value = '编辑原生锚点模板';
    Object.assign(form, {
      anchor_point_name: row.anchor_point_name,
      anchor_type: row.anchor_type,
      tool_title: row.anchor_point_name,
      android_anchor_title: '立即下载',
      ios_anchor_title: '立即下载',
      app_tags: ['主推'],
      guide_text: '点击下载',
      game_description: '这是一款好玩的游戏，快来下载体验吧。',
      game_charatoristic: '玩法丰富，画面精美。',
    });
  } else {
    editingId.value = null;
    dialogTitle.value = '新建原生锚点模板';
  }
  dialogVisible.value = true;
}

function onAnchorTypeChange() {
  form.tool_title = '';
  form.app_tags = [''];
}

function onImageModeChange() {
  form.app_images = [];
}

function onGameBonusChange() {
  // 线上切换「游戏福利」不弹提示，仅展开 礼包来源 / 添加游戏礼包
}

function addWildcard(value) {
  if (!form.tool_title.includes(value)) form.tool_title += value;
}

function removeImage(field, index) {
  form[field].splice(index, 1);
}

async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  if (isAppGameGeneral.value && form.game_bonus && !form.game_package_list.length) {
    ElMessage.warning('请至少添加一个游戏礼包');
    return;
  }
  if (editingId.value == null) {
    list.value.unshift({
      id: Date.now(),
      anchor_point_name: form.anchor_point_name,
      anchor_type: form.anchor_type,
      user_name: '当前用户',
      create_time: mockTime(0),
    });
    ElMessage.success('新建模板成功！');
  } else {
    const idx = list.value.findIndex((x) => x.id === editingId.value);
    if (idx > -1) {
      list.value[idx] = {
        ...list.value[idx],
        anchor_point_name: form.anchor_point_name,
        anchor_type: form.anchor_type,
      };
    }
    ElMessage.success('修改模板成功！');
  }
  dialogVisible.value = false;
}

/* ---------------- 游戏礼包（游戏福利）弹窗 ---------------- */

const packageVisible = ref(false);
const pkgRef = ref();
const pkgEditIndex = ref(-1);

function newGift() {
  return { gift_name: '', gift_image_url: '', gift_amount: '', gift_unit: 'INDIVIDUAL' };
}

function emptyPkgForm() {
  return {
    game_package_name: '',
    android_package_code: '',
    ios_package_code: '',
    gift_start_date: '',
    gift_end_date: '',
    gift_regulation: '',
    daterange: [],
    gift: [newGift()],
  };
}

const pkgForm = reactive(emptyPkgForm());

const pkgRules = {
  game_package_name: [
    { required: true, message: '请输入礼包名称', trigger: 'blur' },
    { min: 1, max: 14, message: '请输入1-14个字', trigger: 'blur' },
  ],
  android_package_code: [
    { required: true, message: '请输入Android礼包码', trigger: 'blur' },
    { min: 1, max: 20, message: '请输入1-20个字', trigger: 'blur' },
  ],
  ios_package_code: [
    { required: true, message: '请输入iOS礼包码', trigger: 'blur' },
    { min: 1, max: 20, message: '请输入1-20个字', trigger: 'blur' },
  ],
  daterange: [{ required: true, message: '请选择礼包使用期限', trigger: 'blur' }],
  gift_regulation: [
    { required: true, message: '请输入礼包使用规则', trigger: 'blur' },
    { min: 1, max: 30, message: '请输入1-30个字', trigger: 'blur' },
  ],
};

function openPackageDialog(index = -1) {
  pkgEditIndex.value = index;
  Object.assign(pkgForm, emptyPkgForm());
  if (index > -1 && form.game_package_list[index]) {
    const p = form.game_package_list[index];
    Object.assign(pkgForm, JSON.parse(JSON.stringify(p)), {
      daterange: p.gift_start_date ? [p.gift_start_date, p.gift_end_date] : [],
    });
  }
  packageVisible.value = true;
}

async function onPackageSubmit() {
  const valid = await pkgRef.value.validate().catch(() => false);
  if (!valid) return;
  const payload = {
    game_package_name: pkgForm.game_package_name,
    android_package_code: pkgForm.android_package_code,
    ios_package_code: pkgForm.ios_package_code,
    gift: pkgForm.gift,
    gift_regulation: pkgForm.gift_regulation,
    gift_start_date: (pkgForm.daterange || [])[0] || '',
    gift_end_date: (pkgForm.daterange || [])[1] || '',
  };
  if (pkgEditIndex.value === -1) form.game_package_list.push(payload);
  else form.game_package_list.splice(pkgEditIndex.value, 1, payload);
  packageVisible.value = false;
}

/* ---------------- 素材（图片）选择 ---------------- */

const pickerVisible = ref(false);
const pickerTarget = ref('');
const pickerLimit = ref(1);
const pickerGiftIndex = ref(-1);

function openPicker(target, limit = 1, giftIndex = -1) {
  pickerTarget.value = target;
  pickerLimit.value = limit;
  pickerGiftIndex.value = giftIndex;
  pickerVisible.value = true;
}

function onPickMaterial(m) {
  if (pickerTarget.value === 'gift') {
    if (pkgForm.gift[pickerGiftIndex.value]) {
      pkgForm.gift[pickerGiftIndex.value].gift_image_url = m.url;
    }
  } else {
    const arr = form[pickerTarget.value] || [];
    arr.push({ uid: `${m.id}_${Date.now()}`, name: m.name, url: m.url });
    form[pickerTarget.value] = arr;
  }
  pickerVisible.value = false;
}
</script>

<style scoped>
/* ---------- 查询条件 ---------- */
.an-search-cell {
  display: flex;
  align-items: center;
  height: 28px;
  margin: 0 8px 8px 0;
}
.an-search-cell .cl-search { width: 280px; }
.an-search-cell .search-input { width: 280px; }
.an-search-cell .search-input :deep(.el-input__inner) { height: 28px; font-size: 12px; }
.an-search-cell .search-input :deep(.el-input-group__append) { flex: none; padding: 0; background: #fff; }
.an-search-cell .search-input :deep(.el-input-group__append .el-button) { width: 32px; padding: 0; margin: 0; }
.an-search-cell .search-more-btn { height: 28px; padding: 0 6px; border-radius: 0 3px 3px 0; }
.an-batch-icon {
  display: inline-flex; align-items: center; font-size: 16px; color: #606266; cursor: pointer;
}
.an-batch-icon:hover { color: #197afb; }

/* 筛选格内的下拉去掉自身边框（线上为「标签+下拉」一个整体边框） */
.filter-cell :deep(.el-select__wrapper) { box-shadow: none; }
.filter-cell :deep(.el-select__selection) { padding-left: 0; }
.filter-cell :deep(.el-input__wrapper) { box-shadow: none; }

/* ---------- 批量搜索气泡 ---------- */
.an-batch { font-size: 12px; color: #606266; }
.an-batch__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 0 10px; font-size: 14px; color: #333;
}
.an-batch__clear { color: #197afb; cursor: pointer; font-size: 12px; }
.an-batch__desc { padding-bottom: 8px; color: #909399; }
.an-batch__desc a { color: #197afb; cursor: pointer; }
.an-batch__editor {
  display: flex; border: 1px solid #e8eaec; border-radius: 3px; overflow: hidden;
}
.an-batch__gutter {
  width: 40px; flex: none; padding: 8px 0; text-align: center;
  background: #f5f7fa; color: #c0c4cc; border-right: 1px solid #e8eaec;
}
.an-batch__gutter-line { line-height: 20px; }
.an-batch__mode { color: #197afb; cursor: pointer; }
.an-batch__tip-title { margin: 0 0 4px; font-weight: 700; color: #333; }
.an-batch__tip-text { margin: 0; font-size: 12px; line-height: 18px; color: #606266; }
.an-batch__editor :deep(.el-textarea__inner) { border: none; box-shadow: none; font-size: 12px; }

/* ---------- 弹窗表单 ---------- */
.an-form :deep(.el-form-item) { margin-bottom: 24px; }
/* 线上该表单不显示必填星号（EP 默认 ::before 内容被置空） */
.an-form :deep(.el-form-item.is-required > .el-form-item__label::before) { content: ''; }
.an-input { width: 500px; }
.an-input :deep(.el-input__inner) { height: 32px; font-size: 12px; }
.an-input :deep(.el-textarea__inner) { font-size: 13px; line-height: 20px; padding: 5px 11px; }
.an-dialog-footer { display: flex; justify-content: flex-end; gap: 16px; }
.an-dialog-footer__btn { width: 120px; height: 32px; font-size: 14px; padding: 9px 15px; border-radius: 3px; }

/* 通配符 */
.an-wildcard { display: flex; align-items: center; flex-wrap: wrap; margin-top: 4px; }
.an-wildcard__desc { font-size: 12px; color: #999; margin-right: 8px; }
.an-wildcard__btn { font-size: 12px; color: #197afb; margin-right: 10px; padding: 0; }
.an-wildcard__btn.is-disabled { color: #c0c4cc; }

/* 标签 */
.an-tag { display: flex; align-items: center; margin-bottom: 8px; width: 100%; }
.an-tag .an-input { width: 500px; }
.an-icon-question,
.an-icon-close {
  width: 16px; height: 16px; line-height: 16px; margin-left: 8px; border-radius: 50%;
  text-align: center; font-size: 12px; cursor: pointer; font-style: normal;
}
.an-icon-question { color: #fff; background: #c0c4cc; }
.an-icon-close { color: #c0c4cc; font-size: 14px; }
.an-add-btn { font-size: 12px; color: #197afb; padding: 0; margin-top: 2px; }

/* 上传 */
.an-upload-row { display: flex; flex-wrap: wrap; gap: 10px; }
.an-upload {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-sizing: border-box;
  border: 1px dashed #d6d6d6; border-radius: 3px; color: #c0c4cc; font-size: 12px;
  cursor: pointer; background: #fff;
}
.an-upload--horizontal { width: 180px; height: 90px; }
.an-upload--vertical { width: 108px; height: 180px; }
.an-upload--square { width: 90px; height: 90px; }
.an-upload__plus { font-size: 24px; line-height: 1; margin-bottom: 6px; }
.an-upload__item { position: relative; }
.an-upload__item--horizontal { width: 180px; height: 90px; }
.an-upload__item--vertical { width: 108px; height: 180px; }
.an-upload__item--square { width: 90px; height: 90px; }
.an-upload__img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 3px; }
.an-upload__del {
  position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; line-height: 16px;
  border-radius: 50%; background: #909399; color: #fff; font-size: 10px; text-align: center;
  font-style: normal; cursor: pointer;
}
.an-upload__tips { margin-top: 6px; font-size: 12px; color: #c6c6c6; width: 100%; }
.an-fix-show { font-size: 12px; color: #606266; margin: 0; }

/* 礼包列表 */
.an-pkg-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; width: 100%; }
.an-pkg-list__item {
  position: relative; display: flex; flex-direction: column; gap: 4px;
  padding: 8px 32px 8px 12px; border: 1px solid #e8eaec; border-radius: 2px; background: #fff;
}
.an-pkg-list__name { font-weight: 700; font-size: 12px; color: #333; }
.an-pkg-list__code { font-size: 12px; color: #909399; }
.an-pkg-list__pics { display: flex; gap: 6px; margin-top: 4px; }
.an-pkg-list__pic { width: 40px; height: 40px; background: #f2f2f2; border-radius: 2px; }
.an-pkg-list__edit,
.an-pkg-list__del {
  position: absolute; right: 10px; top: 10px; cursor: pointer; color: #909399; font-style: normal;
}
.an-pkg-list__del { right: 26px; color: #f56c6c; }

/* 礼品配置 */
.an-gift-list { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; width: 100%; }
.an-gift-list__item {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px;
  background: #f5f7fa; border-radius: 3px;
}
.an-gift-list__pic {
  width: 88px; height: 88px; flex: none; background: #fff; border: 1px dashed #dcdfe6;
  display: flex; align-items: center; justify-content: center; color: #c0c4cc; font-size: 12px;
  cursor: pointer; overflow: hidden;
}
.an-gift-list__info { flex: 1; }
.an-gift-list__info .an-input { width: 100%; }
.an-append-select { width: 90px; }

/* 素材选择 */
.an-material-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.an-material { cursor: pointer; border: 1px solid #e8eaec; border-radius: 3px; overflow: hidden; }
.an-material:hover { border-color: #197afb; }
.an-material__img { width: 100%; height: 80px; object-fit: cover; display: block; }
.an-material__name {
  font-size: 12px; color: #606266; text-align: center; padding: 4px 0; background: #fafafa;
}
</style>

<style>
/* 弹窗根节点被 teleport 到 body，需用非 scoped 样式
   线上为 .el-dialog.cl-dialog--middle：800px 宽、垂直居中、头部 16px 32px、
   内容区 24px 32px / 最高 600px 滚动、底部 11px 32px 30px */
.an-dialog { padding: 0; }
.an-dialog .el-dialog__header { padding: 16px 32px; margin: 0; }
.an-dialog .el-dialog__title { font-size: 16px; font-weight: 700; color: #333; line-height: 18px; }
.an-dialog .el-dialog__body { box-sizing: border-box; padding: 24px 32px; max-height: 600px; overflow-y: auto; }
.an-dialog .el-dialog__footer { padding: 11px 32px 30px; }
.an-dialog .el-form-item__label {
  width: 120px; padding: 0; text-align: left; justify-content: flex-start;
  font-size: 14px; color: #666; line-height: 32px; height: 32px;
}
.an-dialog .el-form-item__content { margin-left: 120px; }
.an-dialog .el-input__wrapper { min-height: 32px; }
.an-dialog .el-input__inner { height: 32px; font-size: 12px; }
.an-dialog .el-select__wrapper { min-height: 32px; }
.an-dialog .el-textarea__inner { box-sizing: border-box; width: 100%; min-height: 52px; font-size: 13px; line-height: 20px; padding: 5px 11px; }
.an-dialog .el-radio-button__inner { height: 32px; line-height: 30px; padding: 0 15px; font-size: 12px; color: #606266; }
.an-dialog .an-radio-wide .el-radio-button__inner { min-width: 80px; text-align: center; }
/* 线上单选按钮选中态：浅蓝底 + 蓝字 */
.an-dialog .el-radio-button {
  --el-radio-button-checked-bg-color: #d6eaff;
  --el-radio-button-checked-text-color: #197afb;
  --el-radio-button-checked-border-color: #197afb;
}
.an-dialog .el-button--primary { background: #197afb; border-color: #197afb; }
</style>
