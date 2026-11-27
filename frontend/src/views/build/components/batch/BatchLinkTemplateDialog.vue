<template>
  <!-- 新增链接模板（图4）
       * 760×，标题「新增链接模板」+「使用指引」
       * 基础信息：*媒体 / *链接类型 / 产品 ⓘ / 关联媒体账户 / 模板名称
       * 链接信息：DeepLink + Ulink 两条，各自 ⓘ（图5/图6 文案）与 5 个通配符按钮 -->
  <el-dialog
    :model-value="modelValue"
    width="760px"
    class="dlx-tpl-dialog"
    align-center
    append-to-body
    :z-index="2700"
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <div class="dlx-tpl-head">
        <span class="dlx-tpl-head__title">新增链接模板</span>
        <a class="dlx-link">使用指引</a>
      </div>
    </template>

    <div class="dlx-tpl-body">
      <div class="dlx-tpl-group">基础信息</div>

      <div class="dlx-form-row">
        <label class="dlx-form-label is-required">媒体</label>
        <el-select v-model="form.media" class="dlx-form-ctl">
          <el-option label="巨量广告" value="OCEAN" />
        </el-select>
      </div>

      <div class="dlx-form-row">
        <label class="dlx-form-label is-required">链接类型</label>
        <el-select v-model="form.linkType" class="dlx-form-ctl">
          <el-option label="直达链接" value="DEEPLINK" />
        </el-select>
      </div>

      <div class="dlx-form-row">
        <label class="dlx-form-label">产品</label>
        <el-select v-model="form.product" class="dlx-form-ctl" placeholder="请选择" />
        <el-popover placement="top" trigger="hover" :width="280" popper-class="dlx-pop">
          <template #reference>
            <el-icon class="dlx-q dlx-q--form"><QuestionFilled /></el-icon>
          </template>
          <span class="dlx-pop__text">同一链接模板仅关联一个产品，模板将按产品维度保存</span>
        </el-popover>
      </div>

      <div class="dlx-form-row">
        <label class="dlx-form-label">关联媒体账户</label>
        <el-select v-model="form.account" class="dlx-form-ctl">
          <el-option label="不限" value="ALL" />
          <el-option label="仅当前账户" value="CURRENT" />
        </el-select>
      </div>

      <div class="dlx-form-row">
        <label class="dlx-form-label">模板名称</label>
        <el-input v-model="form.name" class="dlx-form-ctl" placeholder="请输入模板名称" />
      </div>

      <div class="dlx-tpl-group">链接信息</div>

      <div class="dlx-form-row dlx-form-row--link">
        <label class="dlx-form-label">DeepLink</label>
        <div class="dlx-link-box">
          <div class="dlx-link-line">
            <el-input
              v-model="form.deeplink"
              class="dlx-form-ctl"
              placeholder="示例：https://mobgi/<日期><自定义变量><自增序号>"
            />
            <el-popover placement="top" trigger="hover" :width="290" popper-class="dlx-pop">
              <template #reference>
                <el-icon class="dlx-q dlx-q--form dlx-q--dl"><QuestionFilled /></el-icon>
              </template>
              <div class="dlx-pop__text">
                <p v-for="(p, i) in LINK_TIP" :key="i">{{ p }}</p>
              </div>
            </el-popover>
          </div>
          <div class="dlx-chips">
            <a v-for="c in CHIPS" :key="c" class="dlx-chip" @click="insertToken('deeplink', c)">+ {{ c }}</a>
          </div>
        </div>
      </div>

      <div class="dlx-form-row dlx-form-row--link">
        <label class="dlx-form-label">Ulink</label>
        <div class="dlx-link-box">
          <div class="dlx-link-line">
            <el-input
              v-model="form.ulink"
              class="dlx-form-ctl"
              placeholder="示例：https://mobgi/<日期><自定义变量><自增序号>"
            />
            <el-popover placement="top" trigger="hover" :width="290" popper-class="dlx-pop">
              <template #reference>
                <el-icon class="dlx-q dlx-q--form dlx-q--ul"><QuestionFilled /></el-icon>
              </template>
              <div class="dlx-pop__text">
                <p v-for="(p, i) in LINK_TIP" :key="i">{{ p }}</p>
              </div>
            </el-popover>
          </div>
          <div class="dlx-chips">
            <a v-for="c in CHIPS" :key="c" class="dlx-chip" @click="insertToken('ulink', c)">+ {{ c }}</a>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button class="dlx-tpl-btn" @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button class="dlx-tpl-btn dlx-tpl-btn--primary" @click="onConfirm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(['update:modelValue', 'confirm']);

/* 图5 / 图6：DeepLink 与 Ulink 的问号是同一段文案 */
const LINK_TIP = [
  '你可以在链接内插入下方的自增序号> <自定义变量> > <日期> 等通配符设置模板规则，新建广告时，系统将根据您设置的内容进行替换。',
  '<自增序号>：示例：1、2、3..., 001、002、003等。',
  '<自定义变量>：全部由您定义的替换变量，输入多少个变量，即生成多少个链接。',
  '<日期>：生成广告当天的日期，为月日格式，示例：0912。',
  '<素材CID>：获取项目/单元首个素材名称中最后一个"-"或"_"后的字符串。',
];

const CHIPS = ['自增序号', '自定义变量', '日期', '素材备注', '素材CID'];

const TOKEN = {
  自增序号: '<自增序号>',
  自定义变量: '<自定义变量>',
  日期: '<日期>',
  素材备注: '<素材备注>',
  素材CID: '<素材CID>',
};

const form = reactive({
  media: 'OCEAN',
  linkType: 'DEEPLINK',
  product: '',
  account: 'ALL',
  name: '',
  deeplink: '',
  ulink: '',
});

function insertToken(field, label) {
  form[field] = (form[field] || '') + TOKEN[label];
}
function onConfirm() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入模板名称');
    return;
  }
  emit('confirm', { name: form.name });
  emit('update:modelValue', false);
}
</script>

