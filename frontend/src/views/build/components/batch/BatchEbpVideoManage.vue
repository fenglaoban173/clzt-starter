<template>
  <!--
    创意素材抽屉「视频上传至 = 升级版工作台组织」→ 橙色提示「…如图所示」→ 点击直接显示示例图

    线上：该提示右侧的「如图所示」是说明链接，点开显示的就是这张
    巨量引擎升级版工作台「素材 → 视频管理」页截图（组织树 / 归属 16 / 共享 10 /
    新建视频 ▾ / 共享管理 / 归属组织的素材 · 共享给组织的素材 页签 / 筛选行）。
    本地直接展示这张图，不做二次仿制页面。
  -->
  <el-dialog
    :model-value="modelValue"
    width="1240px"
    top="4vh"
    :close-on-click-modal="false"
    append-to-body
    class="ebp-dialog"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <span class="ebp-dialog__title">素材 - 视频管理处操作共享</span>
    </template>

    <div class="ebp-imgwrap">
      <el-image
        :src="IMG_SRC"
        :preview-src-list="[IMG_SRC]"
        fit="contain"
        class="ebp-img"
        title="点击可放大查看"
      />
    </div>

    <template #footer>
      <div class="ebp-footer">
        <span class="ebp-footer__tip">请在升级版工作台-素材-视频管理处操作共享，避免组织下账户无法使用。</span>
        <el-button type="primary" @click="close">我知道了</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

/** 示例图（public/ebp-video-manage.png，即用户提供的线上截图） */
const IMG_SRC = '/ebp-video-manage.png';

function close() { emit('update:modelValue', false); }
</script>

<style scoped>
.ebp-imgwrap {
  width: 100%;
  max-height: 74vh;
  overflow: auto;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  background: #f7f8fa;
}
.ebp-img {
  display: block;
  width: 100%;
  cursor: zoom-in;
}
.ebp-footer { display: flex; align-items: center; justify-content: space-between; }
.ebp-footer__tip { color: #86909c; font-size: 12px; }
</style>

<style>
.ebp-dialog .el-dialog__header { padding: 14px 20px 10px; margin-right: 0; border-bottom: 1px solid #eef0f3; }
.ebp-dialog .el-dialog__body { padding: 12px 20px; }
.ebp-dialog .el-dialog__footer { padding: 10px 20px 14px; border-top: 1px solid #eef0f3; }
.ebp-dialog__title { font-size: 15px; font-weight: 600; color: #1d2129; }
</style>
