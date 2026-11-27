<template>
  <el-drawer
    :model-value="modelValue"
    :size="1016"
    direction="rtl"
    :with-header="false"
    class="ag-drawer"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <div class="cl-drawer">
      <div class="drawer-header">
        <span class="header-title">{{ title }}</span>
      </div>

      <div class="drawer-content mr0">
        <div v-for="sec in sections" :key="sec.title" class="module-container">
          <div class="cl-form-block-title">{{ sec.title }}</div>
          <el-form class="cl-drawer-form" label-width="144px" label-position="left" size="small">
            <el-form-item
              v-for="f in sec.fields"
              :key="f.key"
              :label="f.label"
              :required="!!f.required"
              :class="{ 'is-required': !!f.required }"
            >
              <!-- 单选组 -->
              <el-radio-group
                v-if="f.type === 'radio'"
                v-model="form[f.key]"
                size="small"
                class="ag-radio"
                :disabled="readonly"
                @change="onRadioChange(f, $event)"
              >
                <el-radio-button v-for="o in f.options" :key="o.value" :label="o.value">
                  {{ o.label }}
                </el-radio-button>
              </el-radio-group>

              <!-- 下拉选择（媒体账户 / 智投落地页模板） -->
              <el-select
                v-else-if="f.type === 'select'"
                v-model="form[f.key]"
                class="ag-select"
                size="small"
                filterable
                :placeholder="f.placeholder"
                :disabled="readonly || f.disabled"
                @change="onChange(f, $event)"
              >
                <el-option
                  v-for="o in selectOptions(f)"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>

              <!-- 下拉 + 刷新（智投落地页模板） -->
              <template v-else-if="f.type === 'select-refresh'">
                <el-select
                  v-model="form[f.key]"
                  class="ag-select"
                  size="small"
                  filterable
                  :disabled="readonly"
                  :placeholder="f.placeholder"
                >
                  <el-option
                    v-for="o in (f.options || templateOptions)"
                    :key="o.value"
                    :label="o.label"
                    :value="o.value"
                  />
                </el-select>
                <el-button class="btn-refresh ml8" size="small" text @click="onRefreshTemplate">
                  刷新
                </el-button>
              </template>

              <!-- 输入框（带字数统计） -->
              <div v-else-if="f.type === 'text'" class="ag-input-wrap" :class="{ 'has-counter': !!f.counter }">
                <el-input
                  v-model="form[f.key]"
                  class="ag-input"
                  size="small"
                  :placeholder="f.placeholder"
                  :maxlength="f.maxLength"
                  :readonly="readonly || !!f.readonly"
                />
                <span v-if="f.counter" class="input-suffix">{{ String(form[f.key] || '').length }}</span>
              </div>

              <!-- 输入框 + 右侧按钮（选择已有商品ID / 选择已有链接） -->
              <template v-else-if="f.type === 'input-button'">
                <el-input
                  v-model="form[f.key]"
                  class="ag-input"
                  size="small"
                  :placeholder="f.placeholder"
                  :readonly="readonly || !!f.readonly"
                />
                <el-button
                  v-if="f.buttonText"
                  class="ml16"
                  size="small"
                  type="primary"
                  :disabled="readonly || (f.requiresAccount && !form.advertiser_id)"
                  @click="onSideButton(f)"
                >{{ f.buttonText }}</el-button>
              </template>

              <!-- 选择组件（选择微信小游戏 …） -->
              <template v-else-if="f.type === 'picker'">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="readonly || (f.requiresAccount && !form.advertiser_id)"
                  @click="openPicker(f)"
                >{{ f.buttonText }}</el-button>
                <div v-if="form.micro_app_name" class="micro-component-info">
                  <div>小游戏资产ID：{{ form.micro_app_id || '-' }}</div>
                  <div>小游戏链接：{{ form.micro_app_link || '-' }}</div>
                </div>
              </template>

              <!-- 直达链接输入组（可添加多条） -->
              <template v-else-if="f.type === 'link-list'">
                <div v-for="(row, ri) in form[f.key]" :key="ri" class="link-row">
                  <el-input
                    v-model="form[f.key][ri]"
                    class="ag-input"
                    size="small"
                    :placeholder="f.placeholder"
                    :disabled="readonly"
                  />
                  <el-button v-if="!readonly" class="ml8" size="small" text @click="form[f.key].splice(ri, 1)">
                    删除
                  </el-button>
                </div>
                <el-button v-if="!readonly" class="ag-add-link" size="small" text @click="form[f.key].push('')">
                  {{ f.addText }}
                </el-button>
              </template>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="drawer-footer">
        <div class="dialog-footer flex">
          <div class="operate-button">
            <el-button size="small" plain @click="close">{{ readonly ? '关 闭' : '取 消' }}</el-button>
            <el-button v-if="!readonly" size="small" type="primary" @click="submit">确 定</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择组件弹窗（线上：选择微信小游戏 / 选择字节小游戏 …） -->
    <ComponentPickerModal
      v-if="pickerKey"
      v-model="pickerVisible"
      :title="pickerKey"
      :name-label="`${pickerKey}名称`"
      :items="pickerItems"
      :accounts="accounts"
      @confirm="onPickerConfirm"
    />

    <!-- 选择已有商品ID -->
    <el-dialog v-model="productPickerVisible" title="选择已有商品ID" width="720px" append-to-body>
      <el-input v-model="productKeyword" size="small" placeholder="请输入关键词" style="width: 240px; margin-bottom: 12px" />
      <el-table ref="productTableRef" :data="filteredProducts" border size="small" max-height="360">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="platform_id" label="商品库ID" width="180" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="type" label="类型" width="120" />
      </el-table>
      <template #footer>
        <el-button size="small" plain @click="productPickerVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="confirmProduct">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 选择已有链接 -->
    <el-dialog v-model="linkPickerVisible" title="选择已有链接" width="720px" append-to-body>
      <el-input v-model="linkKeyword" size="small" placeholder="请输入关键词" style="width: 240px; margin-bottom: 12px" />
      <el-table ref="linkTableRef" :data="filteredLinks" border size="small" max-height="360">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="url" label="链接" min-width="320" />
        <el-table-column prop="name" label="备注" width="180" />
      </el-table>
      <template #footer>
        <el-button size="small" plain @click="linkPickerVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="confirmLink">确 定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import ComponentPickerModal from './ComponentPickerModal.vue';
import {
  assetGroupSections, validateAssetGroup, MICRO_LABEL,
} from '../assetGroupForm';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  form: { type: Object, required: true },
  title: { type: String, default: '新建资产组' },
  accounts: { type: Array, default: () => [] },
  templates: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  links: { type: Array, default: () => [] },
  pickerSource: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const sections = computed(() => assetGroupSections(props.form));

const pickerVisible = ref(false);
const pickerKey = ref('');
const pickerItems = ref([]);
const productPickerVisible = ref(false);
const linkPickerVisible = ref(false);
const productKeyword = ref('');
const linkKeyword = ref('');
const selectedProduct = ref(null);
const selectedLink = ref(null);
const productTableRef = ref();
const linkTableRef = ref();

const templateOptions = computed(() => props.templates.map((t) => ({ label: t.name, value: t.id })));

const filteredProducts = computed(() => {
  const kw = productKeyword.value.trim();
  if (!kw) return props.products;
  return props.products.filter((p) => p.name.includes(kw) || String(p.platform_id).includes(kw));
});
const filteredLinks = computed(() => {
  const kw = linkKeyword.value.trim();
  if (!kw) return props.links;
  return props.links.filter((l) => l.url.includes(kw) || l.name.includes(kw));
});

function selectOptions(f) {
  if (f.source === 'accounts') {
    return props.accounts.map((a) => ({ label: `${a.name}  (${a.advertiser_id})`, value: a.advertiser_id }));
  }
  return f.options || [];
}

function onRadioChange(f, val) {
  // 资产组类型 / 类型切换 → 清理不再生效的字段值
  if (f.key === 'asset_group_type') {
    props.form.delivery_content_type = '';
    props.form.micro_app_id = '';
    props.form.micro_app_name = '';
    props.form.micro_app_link = '';
    props.form.site_url = '';
    props.form.cl_site_template_id = '';
  }
  if (f.key === 'micro_promotion_type') {
    props.form.micro_app_id = '';
    props.form.micro_app_name = '';
    props.form.micro_app_link = '';
    props.form.site_url = '';
    props.form.cl_site_template_id = '';
    props.form.playlet_series_url = '';
  }
  if (f.key === 'delivery_content_type') {
    props.form.site_url = '';
  }
  if (f.key === 'landing_source') {
    props.form.site_url = '';
    props.form.cl_site_template_id = '';
  }
}

function onChange(f, val) {
  if (f.key === 'advertiser_id') {
    // 切换媒体账户 → 清空已选组件
    props.form.micro_app_id = '';
    props.form.micro_app_name = '';
    props.form.micro_app_link = '';
  }
}

function onRefreshTemplate() {
  ElMessage.success('已刷新智投落地页模板');
}

function onSideButton(f) {
  if (f.key === 'product_platform_id') {
    selectedProduct.value = null;
    productPickerVisible.value = true;
    return;
  }
  if (f.key === 'micro_app_link') {
    selectedLink.value = null;
    linkPickerVisible.value = true;
  }
}

function openPicker(f) {
  pickerKey.value = MICRO_LABEL[props.form.micro_promotion_type] || f.label;
  // 只展示当前「类型」对应的小程序/小游戏资产
  pickerItems.value = (props.pickerSource || []).filter(
    (it) => !it.type || it.type === pickerKey.value,
  );
  pickerVisible.value = true;
}

function onPickerConfirm(row) {
  props.form.micro_app_id = row.id;
  props.form.micro_app_name = row.name;
  props.form.micro_app_link = row.url || '';
}

function confirmProduct() {
  const row = productTableRef.value?.selection?.[0];
  if (!row) { ElMessage.warning('请选择商品'); return; }
  props.form.product_platform_id = row.platform_id;
  productPickerVisible.value = false;
}

function confirmLink() {
  const row = linkTableRef.value?.selection?.[0];
  if (!row) { ElMessage.warning('请选择链接'); return; }
  props.form.micro_app_link = row.url;
  linkPickerVisible.value = false;
}

function close() { emit('update:modelValue', false); }

function submit() {
  const msg = validateAssetGroup(props.form, sections.value);
  if (msg) { ElMessage.warning(msg); return; }
  emit('submit', { ...props.form });
}

watch(() => props.modelValue, (v) => {
  if (!v) { pickerVisible.value = false; productPickerVisible.value = false; linkPickerVisible.value = false; }
});
</script>

<style scoped>
.cl-drawer { display: flex; flex-direction: column; height: 100%; background: #f0f2f5; }
.drawer-header {
  flex: none; height: 49px; padding: 0 16px; display: flex; align-items: center;
  background: #fff; border-bottom: 1px solid #e8eaec;
}
.header-title { font-size: 16px; font-weight: 500; color: #333; }
.drawer-content { flex: 1; overflow-y: auto; padding: 0 16px; background: #f0f2f5; }
.module-container { background: #fff; margin-bottom: 16px; }
.cl-form-block-title {
  height: 48px; line-height: 48px; padding: 0 0 0 16px;
  background: #fbfcfd; font-size: 16px; color: #333;
}
.cl-drawer-form { padding: 16px 16px 0; }
.cl-drawer-form :deep(.el-form-item) { margin-bottom: 20px; }
.cl-drawer-form :deep(.el-form-item__label) { width: 144px; font-size: 14px; color: #666; }
.cl-drawer-form :deep(.el-form-item__content) { margin-left: 144px; }

.ag-input { width: 360px; }
.ag-input :deep(.el-input__inner) { height: 32px; font-size: 13px; }
.ag-input-wrap { position: relative; width: 360px; }
.ag-input-wrap.has-counter .ag-input :deep(.el-input__inner) { padding-right: 30px; }
.input-suffix {
  position: absolute; right: 10px; top: 0; height: 32px; line-height: 32px;
  font-size: 14px; color: #dcdee6; pointer-events: none;
}
.ag-select { width: 360px; }
.ag-select :deep(.el-input__inner) { height: 32px; font-size: 13px; }

.ag-radio :deep(.el-radio-button__inner) { padding: 9px 12px; font-size: 12px; }
.ag-radio :deep(.el-radio-button__orig-radio) { display: none; }
.ag-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #d6eaff; border-color: #197afb; color: #197afb; box-shadow: -1px 0 0 0 #197afb;
}
.ml8 { margin-left: 8px; }
.ml16 { margin-left: 16px; }
.btn-refresh { color: #197afb; }
.micro-component-info { margin-top: 6px; font-size: 12px; color: #666; line-height: 18px; }
.link-row { display: flex; align-items: center; margin-bottom: 8px; }
.ag-add-link { color: #197afb; }

.drawer-footer {
  flex: none; padding: 12px 16px 24px; background: #fff; border-top: 1px solid #e8eaec;
}
.dialog-footer { display: flex; justify-content: flex-end; }
.operate-button { display: flex; gap: 16px; }
.operate-button :deep(.el-button) { font-size: 12px; height: 32px; padding: 9px 15px; border-radius: 3px; }
</style>
