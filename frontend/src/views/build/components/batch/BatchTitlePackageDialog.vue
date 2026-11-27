<template>
  <!--
    线上「添加标题包 / 编辑标题包 / 复制标题包」弹窗（1:1 复刻）
    线上来源：cl.mobgi.com 批量搭建 → 标题包抽屉 → 工具条「新建标题包」
    实测：el-dialog 800×703，x=560 y=189，margin-top 0（cl-dialog--middle）
    结构（线上 DOM）：
      .el-dialog__header  span「添加标题包」+ 右上角关闭 X
      .el-dialog__body
        .edit-title（仅编辑态显示，⚠「编辑后标题包数据将清零，按照新标题包重新统计」）
        form.title-package-form
          .el-form-item → span.selector-label「标题包名称」+ el-input(w165, 占位「请输入标题包名称」)
                        + 右侧 AI 助写按钮
          .el-form-item.title-package-area
            .area-container
              .textarea-header  「请输入标题（n/max）」+ [+插入动态词包][清空]
              .filter-tips      「标题长度范围为5~55个字，添加多个标题请换行」
              .textarea-editor  每行：序号 + input(占位「请粘贴或输入标题，回车可换行」) + 删除 X
      .el-dialog__footer  [取 消][确 定]
  -->
  <teleport to="body">
    <div v-if="visible" class="tpd-mask" @click="close"></div>
    <div v-if="visible" class="tpd-dialog" role="dialog" aria-modal="true" :aria-label="dialogTitle">
      <div class="tpd-dialog__header">
        <span class="tpd-dialog__title">{{ dialogTitle }}</span>
        <button class="tpd-dialog__close" type="button" aria-label="Close" @click="close">✕</button>
      </div>

      <div class="tpd-dialog__body">
        <!-- 编辑态提示（线上 .edit-title 默认 display:none） -->
        <div v-if="mode === 'edit'" class="tpd-edit-tip">
          <span class="tpd-edit-tip__ico">⚠</span> 编辑后标题包数据将清零，按照新标题包重新统计
        </div>

        <form class="tpd-form" @submit.prevent>
          <!-- 标题包名称 -->
          <div class="tpd-form-item">
            <span class="tpd-selector-label">标题包名称</span>
            <input
              v-model="name"
              class="tpd-input tpd-input--name"
              type="text"
              autocomplete="off"
              placeholder="请输入标题包名称"
            />
            <span class="tpd-assist" title="AI 助写">
              <img :src="aiAssistIcon" alt="AI 助写" />
            </span>
            <div v-if="errName" class="tpd-err">{{ errName }}</div>
          </div>

          <!-- 标题列表区 -->
          <div class="tpd-form-item tpd-form-item--area">
            <div class="tpd-area">
              <div class="tpd-area__head">
                <div class="tpd-area__count">请输入标题（{{ rows.length }}/{{ maxTitles }}）</div>
                <div class="tpd-area__ops">
                  <button type="button" class="tpd-linkbtn" @click="insertDynamicWord">+插入动态词包</button>
                  <button type="button" class="tpd-linkbtn" @click="clearRows">清空</button>
                </div>
              </div>
              <div class="tpd-area__tips">标题长度范围为{{ minLength }}~{{ maxLength }}个字，添加多个标题请换行</div>
              <div class="tpd-area__editor">
                <div v-for="(row, i) in rows" :key="row.key" class="tpd-line">
                  <div class="tpd-line__serial"><div class="tpd-line__idx">{{ i + 1 }}</div></div>
                  <div class="tpd-line__content">
                    <div class="tpd-line__group">
                      <input
                        v-model="row.text"
                        class="tpd-input tpd-input--line"
                        type="text"
                        autocomplete="off"
                        placeholder="请粘贴或输入标题，回车可换行"
                        @keyup.enter="onEnter(i)"
                      />
                      <span class="tpd-line__del" @click="removeRow(i)">✕</span>
                    </div>
                  </div>
                </div>
                <div v-if="!rows.length" class="tpd-line tpd-line--empty">请输入标题</div>
              </div>
              <div v-if="errArea" class="tpd-err">{{ errArea }}</div>
            </div>
          </div>
        </form>
      </div>

      <div class="tpd-dialog__footer">
        <button class="tpd-btn tpd-btn--plain" type="button" @click="close">取 消</button>
        <button class="tpd-btn tpd-btn--primary" type="button" @click="confirm">确 定</button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import aiAssistIcon from '@/assets/title-ai-assist.png';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** add 新建 / edit 编辑 / copy 复制 */
  mode: { type: String, default: 'add' },
  /** 每个标题包最多几个标题（线上 maxTitleCount 默认 10） */
  maxTitles: { type: Number, default: 10 },
  minLength: { type: Number, default: 5 },
  maxLength: { type: Number, default: 55 },
  /** 初始值（编辑/复制回显） */
  init: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'close']);

const visible = computed(() => props.modelValue);

const name = ref('');
const rows = ref([]);
const errName = ref('');
const errArea = ref('');
let seq = 0;

function newRow(text = '') {
  seq += 1;
  return { key: `tpd_${seq}`, text };
}

const dialogTitle = computed(() => {
  if (props.mode === 'edit') return '编辑标题包';
  if (props.mode === 'copy') return '复制标题包';
  return '添加标题包';
});

watch(() => props.modelValue, (v) => {
  if (!v) return;
  const init = props.init || {};
  name.value = init.name || '';
  rows.value = (init.titles || []).map((t) => newRow(t));
  if (!rows.value.length) rows.value = [newRow()];
  errName.value = '';
  errArea.value = '';
}, { immediate: true });

function close() {
  emit('close');
  emit('update:modelValue', false);
}

/** 回车换行：新增一行并聚焦 */
function onEnter(index) {
  if (index !== rows.value.length - 1) return;
  if (rows.value.length >= props.maxTitles) {
    errArea.value = `标题包最多只能有${props.maxTitles}个标题`;
    return;
  }
  errArea.value = '';
  rows.value.push(newRow());
}

/** 「+插入动态词包」：线上是占位能力，这里插入一条带占位符的标题 */
function insertDynamicWord() {
  if (rows.value.length >= props.maxTitles) {
    errArea.value = `标题包最多只能有${props.maxTitles}个标题`;
    return;
  }
  errArea.value = '';
  rows.value.push(newRow('【动态词包】'));
}

function removeRow(i) {
  rows.value.splice(i, 1);
}

function clearRows() {
  rows.value = [newRow()];
}

function confirm() {
  const titles = rows.value.map((r) => (r.text || '').trim()).filter(Boolean);
  errName.value = '';
  errArea.value = '';
  if (!name.value.trim()) {
    errName.value = '请输入标题包名称';
    return;
  }
  if (titles.length > props.maxTitles) {
    errArea.value = `标题包最多只能有${props.maxTitles}个标题`;
    return;
  }
  const bad = titles.find((t) => t.length < props.minLength || t.length > props.maxLength);
  if (bad) {
    errArea.value = `标题长度范围为${props.minLength}~${props.maxLength}个字`;
    return;
  }
  emit('confirm', { name: name.value.trim(), titles });
  emit('update:modelValue', false);
}
</script>

<style>
/* ===== 线上「添加标题包」弹窗（el-dialog 800px，margin-top 0） ===== */
.tpd-mask {
  position: fixed; inset: 0; z-index: 2100;
  background: rgba(0, 0, 0, .5);
}
.tpd-dialog {
  position: fixed; top: 189px; left: 50%; z-index: 2101;
  width: 800px; margin-left: -400px;
  box-sizing: border-box;
  background: #fff; border-radius: 4px;
  box-shadow: 0 12px 32px 4px rgba(0, 0, 0, .36);
  font-size: 14px; color: #606266;
}
.tpd-dialog__header {
  position: relative; height: 54px; padding: 0 20px;
  display: flex; align-items: center;
  border-bottom: 1px solid #e8eaec;
}
.tpd-dialog__title { font-size: 16px; color: #303133; }
.tpd-dialog__close {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; padding: 0; line-height: 1;
  font-size: 16px; color: #909399; background: none; border: none; cursor: pointer;
}
.tpd-dialog__close:hover { color: #197afb; }
.tpd-dialog__body { padding: 20px; }
.tpd-dialog__footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 12px 20px; border-top: 1px solid #e8eaec;
}

/* 编辑态提示（线上 .edit-title） */
.tpd-edit-tip {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 16px; padding: 8px 12px;
  font-size: 12px; color: #e6a23c;
  background: #fdf6ec; border: 1px solid #faecd8; border-radius: 3px;
}
.tpd-edit-tip__ico { font-style: normal; }

/* 表单 */
.tpd-form-item { display: flex; align-items: center; margin-bottom: 16px; }
.tpd-form-item--area { display: block; }
.tpd-selector-label {
  display: inline-block; width: 75px; flex: none;
  font-size: 12px; line-height: 30px; color: #333; text-align: center;
  background: #fff; border: 1px solid #dcdee2; border-right: 0;
  border-radius: 3px 0 0 3px;
}
.tpd-input {
  box-sizing: border-box; height: 32px; padding: 0 10px;
  font-size: 13px; color: #606266; background: #fff;
  border: 1px solid #dcdee2; border-radius: 4px; outline: none;
}
.tpd-input:focus { border-color: #197afb; }
.tpd-input--name { width: 165px; border-radius: 0 3px 3px 0; }
.tpd-assist { margin-left: auto; cursor: pointer; }
.tpd-assist img { display: block; width: 22px; height: 22px; }
/* 校验提示（线上 el-form-item__error：12px #f56c6c） */
.tpd-err { position: absolute; left: 75px; top: 100%; margin-top: 2px; font-size: 12px; color: #f56c6c; }
.tpd-form-item { position: relative; }
.tpd-form-item--area .tpd-err { position: static; margin-top: 6px; }

/* 标题列表区（线上 .area-container） */
.tpd-area { border: 1px solid #e8eaec; border-radius: 3px; overflow: hidden; }
.tpd-area__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 16px; background: #fafafa; border-bottom: 1px solid #e8eaec;
}
.tpd-area__count { font-size: 12px; color: #333; }
.tpd-area__ops { display: flex; gap: 12px; }
.tpd-linkbtn {
  padding: 0; font-size: 12px; color: #197afb;
  background: none; border: none; cursor: pointer;
}
.tpd-area__tips {
  padding: 0 16px; font-size: 12px; line-height: 24px; color: #999;
  background: #d8e8ff; border-right: 1px solid #e8eaec; border-left: 1px solid #e8eaec;
}
.tpd-area__editor { padding: 8px 16px 12px; }
.tpd-line { display: flex; align-items: flex-start; gap: 8px; padding: 4px 0; }
.tpd-line--empty { color: #c0c4cc; font-size: 13px; }
.tpd-line__serial { flex: none; width: 24px; text-align: center; }
.tpd-line__idx {
  display: inline-block; min-width: 20px; height: 20px; line-height: 20px;
  font-size: 12px; color: #999; background: #f5f7fa; border-radius: 3px;
}
.tpd-line__content { flex: 1; min-width: 0; }
.tpd-line__group { display: flex; align-items: center; }
.tpd-input--line { flex: 1; min-width: 0; }
.tpd-line__del {
  flex: none; width: 28px; height: 32px; margin-left: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #c0c4cc; cursor: pointer;
}
.tpd-line__del:hover { color: #f56c6c; }

/* 底部按钮（线上 .dialog-footer：small + plain / primary） */
.tpd-btn {
  height: 32px; padding: 0 15px; font-size: 12px;
  border-radius: 3px; border: 1px solid #dcdfe6; cursor: pointer;
}
.tpd-btn--plain { color: #606266; background: #fff; border-color: #dcdfe6; }
.tpd-btn--plain:hover { color: #197afb; border-color: #197afb; }
.tpd-btn--primary { color: #fff; background: #197afb; border-color: #197afb; }
.tpd-btn--primary:hover { background: #4a9bff; border-color: #4a9bff; }
</style>
