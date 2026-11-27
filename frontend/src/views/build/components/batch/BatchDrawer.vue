<template>
  <!-- 线上抽屉外壳复刻（cl-drawer）：
   *   抽屉 position:fixed; right:0; top:0; width:1016px；底色 #f0f2f5；阴影 rgba(0,0,0,.2) -8px 0 8px
   *   标题条 .drawer-header  h 49px，#fff，padding 0 16px，下边框 1px #e8eaec；标题 16px/700/#333/lh48
   *   关闭键 .drawer-close   absolute; top:10px; left:-32px；32×32 蓝色方块 X（在抽屉左侧外）
   *   内容区 .drawer-content margin 16px 0 16px 16px; padding 0 16px；宽 1000（内容 968）；radius 3px；可滚动
   *   底部   .drawer-footer  absolute; bottom:0; h 70px；padding 12px 16px 24px；白底 + 上边框；按钮右对齐 88×32
   *   分区块 .module-container 白底、1px #e8eaec、radius 6px、margin-bottom 16px
   *   分区标题 .cl-form-block-title h 48px、底 #fbfcfd、16px/700/#333、左内边距 16px
   -->
  <teleport to="body">
    <div v-if="visible" class="cl-drawer-mask" :style="{ zIndex: zIndex - 1 }" @click="onMaskClick"></div>
    <div v-if="visible" class="cl-drawer" :style="{ width: width + 'px', zIndex }">
      <div class="cl-drawer__header">
        <h3 class="cl-drawer__title">{{ title }}</h3>
        <button class="cl-drawer__close" type="button" aria-label="关闭" @click="close"></button>
      </div>
      <div class="cl-drawer__content" ref="contentRef">
        <slot name="content"></slot>
      </div>
      <div class="cl-drawer__footer">
        <slot name="footer">
          <el-button class="cl-drawer__btn" @click="close">{{ cancelText }}</el-button>
          <el-button class="cl-drawer__btn cl-drawer__btn--primary" @click="onOk">{{ okText }}</el-button>
        </slot>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: Number, default: 1016 },
  cancelText: { type: String, default: '取 消' },
  okText: { type: String, default: '确 定' },
  closeOnMask: { type: Boolean, default: true },
  /** R115：打开后定位到某个分区（线上「能力按钮」点开主抽屉并滚动到对应分区） */
  focus: { type: String, default: '' },
  /** 层级：一级抽屉压在 Element Plus 弹层（默认 2000+）之下，保证二级弹窗浮在抽屉上面 */
  zIndex: { type: Number, default: 2001 },
});
const emit = defineEmits(['update:modelValue', 'ok', 'close']);

const visible = computed(() => props.modelValue);
const contentRef = ref(null);

/* 打开后滚动定位到 focus 指定的分区 */
watch(() => props.modelValue, (v) => {
  if (!v || !props.focus) return;
  nextTick(() => {
    const box = contentRef.value;
    if (!box) return;
    const el = box.querySelector(`[data-section="${props.focus}"]`);
    if (!el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTop = Math.max(0, top - 8);
  });
});

function close() {
  emit('close');
  emit('update:modelValue', false);
}
function onOk() {
  emit('ok');
}
function onMaskClick() {
  if (props.closeOnMask) close();
}
</script>

<style>
/* ===== 线上 cl-drawer 外壳（teleport 到 body，需全局样式） ===== */
.cl-drawer-mask {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: #000; opacity: .5; z-index: 2000;
}
.cl-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 2001;
  display: flex; flex-direction: column;
  background-color: #f0f2f5;
  box-shadow: -8px 0 8px #0003;
}
.cl-drawer__header {
  position: relative; flex: none;
  padding: 0 16px;
  background-color: #fff; border-bottom: 1px solid #e8eaec;
  display: flex; align-items: center;
}
.cl-drawer__title {
  margin: 0; font-size: 16px; font-weight: 700; color: #333; line-height: 48px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* 关闭键在抽屉左侧外（线上：left:-32px，32×32 蓝色方块） */
.cl-drawer__close {
  position: absolute; top: 10px; left: -32px;
  width: 32px; height: 32px; padding: 0; border: none;
  cursor: pointer;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACLUlEQVR4Xu1bPU5DMQx2+CtLGdiQuAIFJlYEA1wBIbhDGcrAzECPAYIzwABX4O8ODFQsdIBCaVAqIj3Ko02e7bxKdsc2sf19+WynLy8GAGCt8bL41u01jYV1C3bBfSflY37A34O181JAZ3Ga2kHrAqzdkQjeYTbL9daTNNn/VkD92Upd/b4CakqAKkBTQGuAYAa0CGoX0DaobVDboOAmQLcV3liaga2VChydt6Hb46F0agLgeLcKV3cduHn8IHFC0gYd+Ob+HExPGrh+6EDj9JWcBAfe+disVeDzy/Z9UJCAJiAL3i8JNQlZ8N4HFQloAk72qrC9OvtHjlQk5IH3zi5v3+HwrI1KBTQBwwLEksBp27OGJsAZ4giUw2aeVEgIoCYhFXjyJ0IUgVPYiCkKZArwTjEAMHNjQLM/FC0CpMicoqDZCYitCWWBJ68BgysSAszN8Tu8wfnYNhqiEPIaEEuCG++2t2WAZ1dASGHMW6UUK0+6EQqR2rB0yM5PCT6ZAkKVkBq8EpDybFB0CoSC96mSMhW0DXIejIjeCIWA9w9PY8aGtNyYMSwpUARQkTkxQP8bS04ABghmblEySAmgAEBhI4YMMgIoA6e0NYoMEgI4AuawmUcGmgDOQDltk/0bFH8wIv5ozElJ9OGozyXRx+OjWs04/47uAuMMLiQ2JYDz73DICpQ9RhWgCtA3RfVNUX1TtOxKXKZ/7QLiu4BenJR+dVb85WlXgSVfn/8GvRl4X5J+KlAAAAAASUVORK5CYII=);
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
/* 线上 .drawer-content.mr0 实测：w=1000 / margin 16px 0 16px 16px / padding 0 16px /
   背景 #f0f2f5。本地原来用 padding:16px + border，导致分区内容宽度少 18px、
   竞价策略第 5 张卡片换行。 */
.cl-drawer__content {
  box-sizing: border-box;
  height: calc(100vh - 148px);
  padding: 0 16px; margin: 16px 0 16px 16px;
  overflow-y: auto; overscroll-behavior: none;
  background-color: #f0f2f5;
}
.cl-drawer__footer {
  box-sizing: border-box;
  position: absolute; bottom: 0; left: 0; width: 100%;
  height: 70px; padding: 12px 16px 24px;
  background-color: #fff; border-top: 1px solid #e8eaec;
  display: flex; align-items: center; justify-content: flex-end; gap: 16px;
}
.cl-drawer__btn { min-width: 88px; height: 32px; font-size: 14px; }
.cl-drawer__btn--primary { background: #197afb; border-color: #197afb; }
.cl-drawer__btn--primary:hover { background: #4a9bff; border-color: #4a9bff; }

/* ===== 分区块（线上 module-container / cl-form-block-title） ===== */
.cl-module {
  /* 线上 .module-container 实测：w=968 / border 1px solid #e8eaec / margin-bottom 16px / 无圆角 */
  background: #fff; border: 1px solid #e8eaec; border-radius: 0;
  margin: 0 0 16px; overflow: hidden;
}
.cl-module__title {
  /* 线上 .cl-form-block-title 实测高 48px（含 1px 下边框）→ 必须 border-box，
     否则 height:48 + border-bottom:1 = 49px，与线上差 1px */
  box-sizing: border-box;
  height: 48px; margin: 0; padding: 0 16px;
  background: #fbfcfd; font-size: 16px; font-weight: 700; color: #333; line-height: 47px;
  border-bottom: 1px solid #e8eaec;
}
.cl-module__body { padding: 16px; }
</style>
