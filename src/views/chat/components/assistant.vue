<template>
  <div
    ref="assistantContainer"
    :class="['assistant-container', { active: visible }]"
    @click="handleVisible"
  >
    <span class="assistant-active-name" v-if="state.record">{{ state.record.name }}</span>
    <svg v-if="state.record && state.record.name"
      style="margin-left: 5px"
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      class="text-token-text-tertiary"
    >
      <path
        d="M11.3346 7.83203L8.00131 11.1654L4.66797 7.83203"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
    <div v-if="visible" class="assistant-container-visible">
      <div
        v-for="record in state.assistants"
        :key="record.assistantId"
        @click="handleChooseAssistant(record)"
        class="assistant-item-box"
      >
        <div class="assistant-item">
          <div>
            <span>{{ record.name }}</span>
            <span class="assistant-item-model"
              >模型：{{ record.modelName }}</span
            >
            <span>{{ record.description }}</span>
          </div>
          <svg
            v-if="state.record.assistantId === record.assistantId"
            style="margin-left: 5px"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="icon-md"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM16.0755 7.93219C16.5272 8.25003 16.6356 8.87383 16.3178 9.32549L11.5678 16.0755C11.3931 16.3237 11.1152 16.4792 10.8123 16.4981C10.5093 16.517 10.2142 16.3973 10.0101 16.1727L7.51006 13.4227C7.13855 13.014 7.16867 12.3816 7.57733 12.0101C7.98598 11.6386 8.61843 11.6687 8.98994 12.0773L10.6504 13.9039L14.6822 8.17451C15 7.72284 15.6238 7.61436 16.0755 7.93219Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { useUploadStore } from "@/store/upload";
import { watchWindowClick } from "@/utils/watch-window-click";
import { getUserAssistantList } from "@/api/chat";
import { ref, reactive, watch, onMounted } from "vue";

const store = useUploadStore();
const props = defineProps<{
  assistantId: string;
  validateLogin: () => Promise<boolean>;
}>();
const emits = defineEmits<{
  (e: "update-chat"): void;
  (e: "update-assistant", assistantId: string, welcomeMessage: string): void;
}>();

const assistantContainer = ref<HTMLElement>();
const visible = ref<boolean>(false);
const state = reactive({
  assistants: [] as any[],
  record: {} as any,
});

const handleVisible = () => {
  visible.value = !visible.value;
};
/* 切换助理 */
const handleChooseAssistant = (record: any) => {
  props.validateLogin().then((isContinue) => {
    if (!isContinue) return;
    state.record = record;
    emits("update-assistant", record.assistantId, record.welcomeMessage);
    emits("update-chat");
  });
};
/* 更新助理附件权限 */
const updateUploadAuth = () => {
  state.record = state.assistants.find(
    (d: any) => d.assistantId === props.assistantId
  );
  if (!state.record){
    return
  }
  const { supportFile, supportImage } = state.record;
  store.$patch((state) => {
    state.supportFile = supportFile;
    state.supportImage = supportImage;
  });
};
watch(() => props.assistantId, updateUploadAuth);
onMounted(async () => {
  const { code, data, message: msg = "" } = await getUserAssistantList();
  if (code !== 200) return message.error(msg);
  state.assistants = data;
  updateUploadAuth();
  watchWindowClick(assistantContainer.value!, () => {
    visible.value = false;
  });
});
</script>

<style lang="less" scoped>
.assistant-container {
  user-select: none;
  min-width: 150px;
  width: fit-content;
  height: 45px;
  border-radius: 12px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  padding: 0 10px;
  box-sizing: border-box;
  z-index: 100;
  .theme-text-mixin();
  .assistant-active-name {
    font-size: 18px;
    font-weight: 500;
    max-width: 130px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .assistant-container-visible {
    width: 340px;
    position: absolute;
    left: 0;
    top: calc(100% + 10px);
    background-color: #fff;
    border: 0 solid #d9d9e3;
    border-radius: 6px;
    z-index: 100;
    .theme-shadow-mixin();
    .assistant-item-box {
      padding: 8px;
      box-sizing: border-box;
      border-bottom: 1px solid #d9d9e3;
      .assistant-item {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-radius: 6px;
        box-sizing: border-box;
        div {
          width: 90%;
          display: flex;
          flex-flow: column;
          font-size: 12px;
          span:first-of-type {
            font-weight: 500;
            margin-bottom: 5px;
            color: #000;
            font-size: 14px;
          }
          span {
            color: #999;
          }
          .assistant-item-model {
            font-weight: 500;
            color: #444;
            font-size: 14px;
          }
        }
      }
      .assistant-item:hover {
        background-color: #f2f2f2;
      }
    }
    .assistant-item-box:last-of-type {
      border: none !important;
    }
  }
}
.assistant-container:hover,
.active {
  background-color: #f2f2f2;
  color: #000 !important;
}
</style>
