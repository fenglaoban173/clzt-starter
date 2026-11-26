<template>
  <el-drawer
    v-model="visible"
    size="1016px"
    direction="rtl"
    class="batch-mat-drawer"
  >
    <!-- 线上：抽屉顶部只有两个页签（无标题栏文字） -->
    <template #header>
      <el-tabs v-model="matTab" class="mat-tabs mat-tabs--head">
        <el-tab-pane label="手动选取素材" name="manual" />
        <el-tab-pane label="动态选取素材" name="dynamic" />
      </el-tabs>
    </template>

    <!-- ① 手动选取素材 -->
    <el-form v-if="matTab === 'manual'" :model="form.materials" class="drawer-form" label-position="top">
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
        <el-form-item label="视频上传至">
          <el-radio-group v-model="form.materials.upload_scope" size="small">
            <el-radio-button v-for="o in UPLOAD_SCOPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.materials.upload_scope === 'ORG'" label="组织账户" required>
          <el-select v-model="form.materials.org_account" class="org-select" placeholder="请选择组织账户">
            <el-option v-for="o in ORG_ACCOUNTS" :key="o.value" :value="o.value" :label="o.label" />
          </el-select>
          <el-alert type="warning" :closable="false" class="ad-alert ad-alert--warn">
            <template #title>
              <span class="ad-alert__text">请在升级版工作台-素材-视频管理处操作共享，避免组织下账户无法使用。</span>
              <el-button link type="primary">如图所示</el-button>
            </template>
          </el-alert>
        </el-form-item>
        <el-form-item label="主页可见">
          <template #label>
            <span class="q-label">主页可见</span>
            <el-tooltip content="主页始终可见：信息流与主页作品列表均展示该视频。仅单次展示可见：仅当用户在信息流中刷到该视频时，当次进入主页可看到该视频，其他情况主页不展示该视频。" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-radio-group v-model="form.materials.home_visibility" size="small">
            <el-radio-button v-for="o in HOME_VISIBILITIES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
          <div class="dlg-tip warn">仅视频及图文素材、且来源不为抖音主页素材时生效</div>
        </el-form-item>
        <el-form-item label="区分素材版式">
          <div class="mc-check-group">
            <el-checkbox-button
              value="OFF"
              :model-value="form.materials.separate_layout === 'OFF'"
              @change="setLayout('OFF')"
            >不启用</el-checkbox-button>
            <el-checkbox-button
              value="VIDEO"
              :model-value="form.materials.separate_layout === 'VIDEO'"
              @change="setLayout('VIDEO')"
            >视频</el-checkbox-button>
            <el-checkbox-button
              value="IMAGE"
              :model-value="form.materials.separate_layout === 'IMAGE'"
              @change="setLayout('IMAGE')"
            >图片</el-checkbox-button>
          </div>
        </el-form-item>
        <el-form-item label="每个创意组配置">
          <template #label>
            <span class="q-label">每个创意组配置</span>
            <el-tooltip content="创意组的素材配置，即为广告内的创意形式；创意组数量，影响广告最终生成数量。" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <div class="group-config">
            <div class="group-config__item">
              <span class="group-config__label">视频</span>
              <el-input-number v-model="form.materials.group_video_count" :min="0" :max="10" controls-position="right" size="small" />
              <el-icon class="group-config__lock"><Lock /></el-icon>
            </div>
            <div class="group-config__item">
              <span class="group-config__label">图片</span>
              <el-input-number v-model="form.materials.group_image_count" :min="0" :max="10" controls-position="right" size="small" />
              <el-icon class="group-config__lock"><Lock /></el-icon>
            </div>
            <div class="group-config__item">
              <span class="group-config__label">图文</span>
              <el-input-number v-model="form.materials.group_text_count" :min="0" :max="10" controls-position="right" size="small" />
              <el-icon class="group-config__lock"><Lock /></el-icon>
            </div>
          </div>
          <div class="dlg-tip">即单个广告内的素材数量。注：因媒体限制，视频最多10个，图片最多10个，图文最多10个。</div>
        </el-form-item>
        <el-form-item label="统一配置创意组名">
          <template #label>
            <span class="q-label">统一配置创意组名</span>
            <el-tooltip content="可在广告名称中增加<创意组名称>通配符使用；统一配置后将会替换当前所有创意组名称，请确保使用的通配符不会全部替换为空；" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <div class="ad-kw-row">
            <el-input v-model="form.materials.group_name_template" class="ad-group-name-input" placeholder="请输入创意组名称" />
            <el-button type="primary" plain size="small" @click="applyGroupName">统一配置</el-button>
          </div>
          <div class="name-wildcards">
            <span class="name-wildcards__label">通配符:</span>
            <el-button link type="primary" @click="appendGroupWildcard('素材名')">素材名</el-button>
            <el-button link type="primary" @click="appendGroupWildcard('横版视频名')">横版视频名</el-button>
            <el-button link type="primary" @click="appendGroupWildcard('竖版视频名')">竖版视频名</el-button>
            <el-button link type="primary" @click="wildcardMoreVisible = true">插入更多</el-button>
          </div>
        </el-form-item>
        <el-form-item label="引导视频">
          <template #label>
            <span class="q-label">引导视频</span>
            <el-tooltip content="媒体白名单功能，仅游戏行业广告主投放奖励关卡广告时必填" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-radio-group v-model="form.materials.guide_video" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ON">原链路</el-radio-button>
            <el-radio-button value="NEW">新链路</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="素材类型">
          <el-checkbox-group v-model="form.materials.material_types">
            <el-checkbox v-for="o in MATERIAL_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="creative-header">
          <div class="creative-header__title">
            <span class="group-label">创意制作</span>
            <span class="group-count">（创意组数量：{{ form.materials.creative_groups.length }}）</span>
          </div>
          <div class="creative-toolbar">
            <el-button link @click="shuffleGroups">乱序</el-button>
            <el-button link @click="clearMaterials">清空</el-button>
            <el-dropdown>
              <el-button size="small">更多菜单<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="pickCover(true)">批量添加封面</el-dropdown-item>
                  <el-dropdown-item @click="pickCover(false)">一键指定封面</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" plain size="small" @click="randomPick">随机选择</el-button>
            <el-button type="primary" plain size="small" @click="smartPick">智能优选</el-button>
            <el-button type="primary" plain size="small" @click="refreshGroups">一键测新</el-button>
            <el-dropdown>
              <el-button type="primary" size="small">批量添加素材<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="addLocalMaterial">添加本地素材</el-dropdown-item>
                  <el-dropdown-item @click="addSurgeMaterial">添加冲量素材</el-dropdown-item>
                  <el-dropdown-item @click="pickTextImage">添加已有图文</el-dropdown-item>
                  <el-dropdown-item @click="autoCreateTextImage">自动新建图文</el-dropdown-item>
                  <el-dropdown-item @click="pickGuideVideo">添加引导视频</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div v-for="(g, gi) in form.materials.creative_groups" :key="gi" class="creative-group">
          <div class="group-head">
            <span class="group-head__name">创意组{{ String(gi + 1).padStart(2, '0') }}</span>
            <el-input v-model="g.name" placeholder="创意组名称" class="group-name-input" />
            <el-button v-if="form.materials.creative_groups.length > 1" link type="danger" @click="removeGroup(gi)">删除创意组</el-button>
          </div>
          <el-tabs v-model="g.tab" class="group-tabs">
            <el-tab-pane :label="`视频(${(g.videos || []).length}/${form.materials.group_video_count})`" name="video">
              <div class="mat-grid">
                <div v-for="m in groupItems(g, 'video')" :key="m.id" class="mat-item">
                  <div class="mat-item__thumb"><span class="mat-item__ph">{{ shortName(m) }}</span></div>
                  <div class="mat-item__name">{{ m.title || m.name || m.id }}</div>
                  <div class="mat-item__ops">
                    <span class="mat-item__op">重新上传</span>
                    <span class="mat-item__op">智能封面</span>
                  </div>
                </div>
                <el-empty v-if="!groupItems(g, 'video').length" description="暂无视频素材" :image-size="60" />
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`图片(${(g.images || []).length}/${form.materials.group_image_count})`" name="image">
              <div class="mat-grid">
                <div v-for="m in groupItems(g, 'image')" :key="m.id" class="mat-item">
                  <div class="mat-item__thumb"><span class="mat-item__ph">{{ shortName(m) }}</span></div>
                  <div class="mat-item__name">{{ m.title || m.name || m.id }}</div>
                  <div class="mat-item__ops">
                    <span class="mat-item__op">重新上传</span>
                    <span class="mat-item__op">智能封面</span>
                  </div>
                </div>
                <el-empty v-if="!groupItems(g, 'image').length" description="暂无图片素材" :image-size="60" />
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`图文(${(g.text_images || []).length}/${form.materials.group_text_count})`" name="text">
              <div class="mat-grid">
                <div v-for="m in groupItems(g, 'text')" :key="m.id" class="mat-item">
                  <div class="mat-item__thumb"><span class="mat-item__ph">{{ shortName(m) }}</span></div>
                  <div class="mat-item__name">{{ m.title || m.name || m.id }}</div>
                  <div class="mat-item__ops">
                    <span class="mat-item__op">重新上传</span>
                    <span class="mat-item__op">智能封面</span>
                  </div>
                </div>
                <el-empty v-if="!groupItems(g, 'text').length" description="暂无图文素材" :image-size="60" />
              </div>
            </el-tab-pane>
          </el-tabs>
          <el-button type="primary" plain size="small" class="group-add-btn" @click="pickMaterial(gi)">+ 添加素材</el-button>
        </div>

        <el-button type="primary" plain size="small" class="w120 add-group-btn" @click="addGroup">+ 添加创意组</el-button>
      </div>
    </el-form>

    <!-- ② 动态选取素材 -->
    <el-form v-else :model="form.materials" class="drawer-form" label-position="top">
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
              <div class="choice-card__desc">{{ dynAssignDesc[o.value] || o.desc }}</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="视频上传至">
          <el-radio-group v-model="form.materials.upload_scope" size="small">
            <el-radio-button v-for="o in UPLOAD_SCOPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.materials.upload_scope === 'ORG'" label="组织账户" required>
          <el-select v-model="form.materials.org_account" class="org-select" placeholder="请选择组织账户">
            <el-option v-for="o in ORG_ACCOUNTS" :key="o.value" :value="o.value" :label="o.label" />
          </el-select>
          <el-alert type="warning" :closable="false" class="ad-alert ad-alert--warn">
            <template #title>
              <span class="ad-alert__text">请在升级版工作台-素材-视频管理处操作共享，避免组织下账户无法使用。</span>
              <el-button link type="primary">如图所示</el-button>
            </template>
          </el-alert>
        </el-form-item>
        <el-form-item label="主页可见">
          <template #label>
            <span class="q-label">主页可见</span>
            <el-tooltip content="主页始终可见：信息流与主页作品列表均展示该视频。仅单次展示可见：仅当用户在信息流中刷到该视频时，当次进入主页可看到该视频，其他情况主页不展示该视频。" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-radio-group v-model="form.materials.home_visibility" size="small">
            <el-radio-button v-for="o in HOME_VISIBILITIES" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
          </el-radio-group>
          <div class="dlg-tip warn">仅视频及图文素材、且来源不为抖音主页素材时生效</div>
        </el-form-item>
        <el-form-item label="每个广告素材数量">
          <el-radio-group v-model="form.materials.ad_material_count_mode" size="small">
            <el-radio-button value="UNIFIED">统一设置</el-radio-button>
            <el-radio-button value="RULE">分规则设置</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="区分素材版式">
          <div class="mc-check-group">
            <el-checkbox-button
              value="OFF"
              :model-value="form.materials.separate_layout === 'OFF'"
              @change="setLayout('OFF')"
            >不启用</el-checkbox-button>
            <el-checkbox-button
              value="VIDEO"
              :model-value="form.materials.separate_layout === 'VIDEO'"
              @change="setLayout('VIDEO')"
            >视频</el-checkbox-button>
            <el-checkbox-button
              value="IMAGE"
              :model-value="form.materials.separate_layout === 'IMAGE'"
              @change="setLayout('IMAGE')"
            >图片</el-checkbox-button>
          </div>
        </el-form-item>
        <el-form-item label="每个创意组配置">
          <template #label>
            <span class="q-label">每个创意组配置</span>
            <el-tooltip content="创意组的素材配置，即为广告内的创意形式；创意组数量，影响广告最终生成数量。" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <div class="group-config">
            <div class="group-config__item">
              <span class="group-config__label">视频</span>
              <el-input-number v-model="form.materials.group_video_count" :min="0" :max="10" controls-position="right" size="small" />
              <el-icon class="group-config__lock"><Lock /></el-icon>
            </div>
            <div class="group-config__item">
              <span class="group-config__label">图片</span>
              <el-input-number v-model="form.materials.group_image_count" :min="0" :max="10" controls-position="right" size="small" />
              <el-icon class="group-config__lock"><Lock /></el-icon>
            </div>
          </div>
          <div class="dlg-tip">动态选取时为每个广告使用的素材数量，不需要的素材类型请设置为0。</div>
        </el-form-item>
        <el-form-item label="选取素材不足时">
          <el-radio-group v-model="form.materials.insufficient_rule" size="small">
            <el-radio-button value="SKIP">余量广告不搭建</el-radio-button>
            <el-radio-button value="LOOP">循环使用素材</el-radio-button>
            <el-radio-button value="REMAIN">余量广告按剩余素材搭建</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="引导视频">
          <template #label>
            <span class="q-label">引导视频</span>
            <el-tooltip content="媒体白名单功能，仅游戏行业广告主投放奖励关卡广告时必填" placement="top">
              <el-icon class="q-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-radio-group v-model="form.materials.guide_video" size="small">
            <el-radio-button value="OFF">不启用</el-radio-button>
            <el-radio-button value="ALL">全部相同</el-radio-button>
          </el-radio-group>
          <div class="dlg-tip">根据关键词及所选的游戏动态匹配最新的引导视频（新链路）</div>
        </el-form-item>
        <el-alert type="info" :closable="false" class="ad-alert ad-alert--flat">
          <template #title>
            <span class="ad-alert__text">使用动态选取时将视为1个创意组参与叉乘，若需生成更多项目广告，请修改规则配置为指定数量，</span>
            <el-button link type="primary">如图所示</el-button>
          </template>
        </el-alert>
      </div>

      <div class="form-section">
        <div class="form-section__title">动态选取规则</div>
        <div class="creative-toolbar">
          <el-button type="primary" size="small" @click="addDynRule">+ 添加动态选取规则</el-button>
          <el-button size="small" @click="addFixedRule">添加指定素材规则</el-button>
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

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="onConfirm">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, inject, watch } from 'vue';
import { ArrowDown, Lock, QuestionFilled } from '@element-plus/icons-vue';
import { ASSIGN_RULES, HOME_VISIBILITIES, MATERIAL_TYPES, UPLOAD_SCOPES } from '@/mock/data';

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
  form, matTab, videos, images, wildcardMoreVisible,
  applyGroupName, shuffleGroups, clearMaterials, randomPick, smartPick, refreshGroups,
  pickMaterial, addLocalMaterial, pickTextImage, autoCreateTextImage, addSurgeMaterial,
  pickGuideVideo, pickCover, addGroup, removeGroup, addDynRule, removeDynRule,
  addFixedRule, confirmMaterials,
} = batch;

/* 线上：升级版工作台组织（组织账户下拉） */
const ORG_ACCOUNTS = [
  { value: '1873939327613259', label: '央广时代(1873939327613259)' },
];

/* 线上「动态选取素材」页签下多账户分配规则的说明文案 */
const dynAssignDesc = {
  REUSE: '所有账户都使用一样的规则',
  AVERAGE: '素材平均分到每个账户中',
  PER_ACCOUNT: '每个账户单独选择规则',
};

function setLayout(v) {
  form.materials.separate_layout = v;
}

/* 创意组内已选素材 → 展示对象 */
function groupItems(g, kind) {
  const ids = kind === 'video' ? (g.videos || []) : kind === 'image' ? (g.images || []) : (g.text_images || []);
  const pool = kind === 'video' ? (videos.value || []) : kind === 'image' ? (images.value || []) : [];
  return ids.map((id) => pool.find((x) => x.id === id) || { id, title: String(id) });
}
function shortName(m) {
  const t = String(m.title || m.name || m.id || '');
  return t.slice(0, 2);
}

/* 统一配置创意组名 · 通配符追加 */
function appendGroupWildcard(text) {
  const cur = form.materials.group_name_template || '';
  form.materials.group_name_template = cur ? `${cur}{${text}}` : `{${text}}`;
}

function onConfirm() {
  confirmMaterials();
  visible.value = false;
}

/* 线上默认态：升级版工作台组织 + 组织账户 */
function ensureDefaults() {
  const m = form.materials;
  if (!m.org_account) m.org_account = ORG_ACCOUNTS[0].value;
}

watch(
  () => props.modelValue,
  (v) => { if (v) ensureDefaults(); },
  { immediate: true }
);
</script>

<style scoped>
/* 线上抽屉：浅灰蓝底 + 每个板块白色圆角矩形 */
:deep(.el-drawer__body) { background: #f0f2f5; }
.form-section { border: 1px solid #e5e6eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fff; }
.form-section__title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #f2f3f5; }
.form-section__extra { font-size: 13px; font-weight: 400; color: #86909c; }

/* 抽屉表单字段统一纵向单列排列 */
.drawer-form :deep(.el-row) { display: block; margin-left: 0; margin-right: 0; }
.drawer-form :deep(.el-col) { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
.drawer-form :deep(.el-form-item) { margin-bottom: 18px; }
.drawer-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
.drawer-form :deep(.el-form-item__label) { font-size: 13px; color: #1d2129; line-height: 1.5; padding-bottom: 0; }
.drawer-form :deep(.el-form-item.is-required .el-form-item__label::before) { color: #f53f3f; margin-right: 4px; }
.drawer-form :deep(.el-input__wrapper),
.drawer-form :deep(.el-select__wrapper) { border-radius: 6px; }
.drawer-form :deep(.el-radio-group),
.drawer-form :deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; }

/* 顶部页签（线上：抽屉头部只有「手动选取素材 / 动态选取素材」） */
.mat-tabs--head :deep(.el-tabs__header) { margin: 0; }
.mat-tabs--head :deep(.el-tabs__content) { display: none; }
.mat-tabs--head :deep(.el-tabs__item) { font-size: 14px; }

/* 多账户分配规则等三选一卡片 */
.card-choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; }
.choice-card { border: 1px solid #e5e6eb; border-radius: 6px; padding: 12px; cursor: pointer; transition: border-color .15s, background .15s; }
.choice-card:hover { border-color: #94bfff; }
.choice-card.active { border-color: #2563eb; background: #f2f7ff; }
.choice-card__title { font-size: 14px; color: #1d2129; margin-bottom: 4px; }
.choice-card__desc { font-size: 12px; color: #86909c; }

/* 区分素材版式：线上是按钮式勾选（不启用为互斥项） */
.mc-check-group { display: inline-flex; }
.mc-check-group :deep(.el-checkbox-button__inner) { border-radius: 0; }
.mc-check-group :deep(.el-checkbox-button:first-child .el-checkbox-button__inner) { border-radius: 4px 0 0 4px; }
.mc-check-group :deep(.el-checkbox-button:last-child .el-checkbox-button__inner) { border-radius: 0 4px 4px 0; }

/* 每个创意组配置：数量输入 + 锁 */
.group-config { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 8px; }
.group-config__item { display: flex; align-items: center; gap: 8px; }
.group-config__label { font-size: 13px; color: #4e5969; }
.group-config__lock { color: #86909c; }

/* 统一配置创意组名 */
.ad-kw-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.ad-group-name-input { width: 360px; }
.name-wildcards { display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 2px; font-size: 13px; color: #4e5969; }
.name-wildcards__label { color: #86909c; }

/* 组织账户 / 提示条 */
.org-select { width: 320px; margin-bottom: 8px; }
.ad-alert { margin: 0; width: auto; }
.ad-alert--flat { margin: 0 0 12px; }
.ad-alert__text { margin-right: 8px; }
.dlg-tip { width: 100%; font-size: 12px; color: #86909c; margin: 4px 0 0; }
.dlg-tip.warn { color: #f77234; }
.q-label { margin-right: 4px; }
.q-icon { color: #86909c; cursor: help; vertical-align: -2px; margin-left: 2px; }

/* 创意制作 */
.creative-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
.creative-header__title { display: flex; align-items: baseline; gap: 6px; }
.group-label { font-size: 14px; font-weight: 600; color: #1d2129; }
.group-count { font-size: 13px; color: #86909c; }
.creative-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.creative-group { border: 1px solid #e5e6eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.group-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.group-head__name { font-size: 13px; font-weight: 600; color: #1d2129; }
.group-name-input { width: 180px; }
.group-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
.group-add-btn { margin-top: 10px; }
.add-group-btn { margin-top: 4px; }

/* 素材缩略图网格 */
.mat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.mat-item { border: 1px solid #e5e6eb; border-radius: 6px; padding: 8px; }
.mat-item__thumb { display: flex; align-items: center; justify-content: center; height: 110px; border-radius: 4px; background: linear-gradient(135deg, #f2f3f5, #e5e6eb); color: #86909c; font-size: 18px; }
.mat-item__name { margin-top: 6px; font-size: 12px; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mat-item__ops { display: flex; gap: 10px; margin-top: 4px; }
.mat-item__op { font-size: 12px; color: #197afb; cursor: pointer; }

/* 动态选取规则 */
.dyn-rule { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.dyn-rule__label { font-size: 13px; color: #4e5969; }
.w120 { width: 120px; }
</style>
