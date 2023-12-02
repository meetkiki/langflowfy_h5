<template>
  <div ref="themeRef">
    <Affix
      class="theme-container"
      :style="{
        position: 'absolute',
        top: '10px',
        right: '20px',
        'z-index': 100000,
      }"
    >
      <div class="theme-btn">
        <Tooltip v-if="userStore.isLogin">
          <template #title> 退出登录 </template>
          <LoginOutlined class="login-out" @click="logout" />
        </Tooltip>
        <Tooltip placement="bottomRight">
          <template #title>
            关闭{{ theme === "light" ? "亮色" : "暗色" }}主题
          </template>
          <img
            v-if="theme === 'light'"
            src="@/assets/images/sun.svg"
            @click="handleChangeTheme('dark')"
          />
          <img
            v-else
            src="@/assets/images/moon.svg"
            @click="handleChangeTheme('light')"
          />
        </Tooltip>
      </div>
    </Affix>
  </div>
</template>
<script setup lang="ts">
import { loginOut } from "@/api/chat";
import { useUserStore } from "@/store/user";
import { ref, onMounted } from "vue";
import { LoginOutlined } from "@ant-design/icons-vue";
import { message, Affix, Tooltip } from "ant-design-vue";

const userStore = useUserStore();
const themeRef = ref<HTMLElement>();
const theme = ref<string>("light");

/* 默认设置为亮色主题 */
const setTheme = () => {
  const html = document.querySelector<HTMLElement>("html");
  html?.setAttribute("data-theme", theme.value);
};
const handleChangeTheme = (t: string) => {
  if (theme.value === t) return;
  theme.value = t;
  setTheme();
};
const logout = async () => {
  const { code, message: msg = "" } = await loginOut();
  if (code !== 200) return message.error(msg);
  userStore.logout();
  window.location.reload()
};
onMounted(() => {
  setTheme();
});
</script>
<style lang="less" scoped>
.theme-container {
  .theme-btn {
    display: flex;
    align-items: center;
  }
  .login-out {
    cursor: pointer;
    color: #707070;
    font-size: 28px;
    margin-right: 10px;
  }
  img {
    vertical-align: middle;
    cursor: pointer;
  }
  :deep(.ant-btn) {
    background-color: #000 !important;
    border-radius: 8px;
    border: none;
  }
}
</style>
