<template>
  <div class="login-container">
    <div class="login-container-content-center">
      <div class="login-banner">
        <img
          src="https://file-1300588375.cos.ap-chengdu.myqcloud.com/resources/login-banner2-47c62b6c.png"
        />
      </div>
      <div class="login-form">
        <div class="login-title">leteasyAi登录</div>
        <Form :model="formState" :rules="formRules" @submit="handleSubmit">
          <FormItem name="username">
            <Input
              class="login-form-input"
              placeholder="手机号/用户名"
              v-model:value="formState.username"
              type="text"
            />
          </FormItem>
          <FormItem name="password">
            <Input
              class="login-form-input"
              placeholder="密码"
              v-model:value="formState.password"
              type="password"
            />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              html-type="submit"
              class="login-form-button"
            >
              登录
            </Button>
          </FormItem>
        </Form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { login } from "@/api/chat";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { toRaw, reactive } from "vue";
import { Form, FormItem, Input, message, Button } from "ant-design-vue";

const router = useRouter();
const store = useUserStore();
const useForm = Form.useForm;
const formRules = reactive({
  username: [
    {
      required: true,
      message: "请输入手机号/用户名",
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
    },
  ],
});
const formState = reactive({
  username: "",
  password: "",
});

const { validate } = useForm(formState, formRules);
const handleSubmit = async () => {
  validate()
      .then(async () => {
        NProgress.start(); // 开始显示 NProgress 进度条
        const { code, message: msg = "" } = await login(toRaw(formState));
        NProgress.done(); // 结束
        if (code !== 200) return message.error(msg);
        router.push("/");
        store.$patch((state) => {
          state.isLogin = true;
        });
    })
    .catch((err: any) => {
      console.log("err", err);
    });
};
</script>

<style lang="less" scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: url("@/assets/images/background.svg");
  display: flex;
  justify-content: center;
  align-items: center;
  .login-container-content-center {
    width: 70vw;
    height: 80vh;
    min-width: 480px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 6rem 100px;
    box-sizing: border-box;
    // background-color: #f2f2f2;
    @media screen and (max-width: 1200px) {
      .login-banner {
        display: none !important;
      }
    }
    .login-banner {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 100px;
      img {
        width: 100%;
        height: 100%;
        max-width: 600px;
      }
    }
    .login-form {
      width: 400px;
      min-width: 400px;
      height: 100%;
      border: 1px solid #e2e8f0;
      padding: 50px;
      box-sizing: border-box;
      border-radius: 8px;

      .login-title {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
      }
      .login-form-input {
        width: 100%;
        height: 42px;
        border-radius: 4px;
      }
      .login-form-button {
        width: 100%;
        height: 42px;
        border-radius: 8px;
        background-image: linear-gradient(
          to right bottom,
          rgb(33, 82, 217) 0%,
          rgb(51, 112, 255) 40%,
          rgb(78, 131, 253) 100%
        );
      }
    }
  }
}
</style>
