<template>
  <div class="file-container-item-file-box">
    <FileTextOutlined />
  </div>
  <div class="file-container-item-file-info">
    <span class="file-container-item-file-info-name">
      {{ file.name }}
    </span>
    <span class="file-container-item-file-info-describe">
      {{ file.describe }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { FileTextOutlined } from "@ant-design/icons-vue";

defineProps<{
  file: {
    name: string;
    describe: string;
  };
}>();
</script>

<style lang="less" scoped>
.file-container-item-file-box {
  width: 40px;
  height: 40px;
  color: #fff;
  background-color: #ff5588;
  border-radius: inherit;
  font-size: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
}
.file-container-item-file-info {
  display: flex;
  flex-flow: column;
  font-weight: 500;
  .file-container-item-file-info-name {
    font-size: 16px;
    color: #616161;
  }
  .file-container-item-file-info-describe {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.3);
  }
}
</style>
