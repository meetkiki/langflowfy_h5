import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ResponseBody } from "@/typing";
import { notification } from "ant-design-vue";
import { useUserStore } from "@/store/user";

import router from "@/router";

const store = useUserStore();
const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
});

// 异常拦截处理器
const errorHandler = (error: AxiosError): Promise<any> => {
  console.log("error.response", error);
  if (error.code === "ERR_NETWORK") {
    notification.error({
      message: "Network Error",
      description: "Network request failed",
    });
  }
  const { data = {}, status, statusText } = error.response as any;
  // 403 无权限
  if (status === 403) {
    notification.error({
      message: "Forbidden",
      description: (data && data.message) || statusText,
    });
  }
  // 401 未登录/未授权
  if (status === 401 && data.result && data.result.isLogin) {
    notification.error({
      message: "Unauthorized",
      description: "Authorization verification failed",
    });
  }
  return Promise.reject();
};

// 请求拦截器
const requestHandler = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  store?.auth && (config.headers.auth = store?.auth);
  return config;
};

request.interceptors.request.use(requestHandler, errorHandler);

// 响应拦截器
const responseHandler = (
  response: AxiosResponse
): ResponseBody<any> | AxiosResponse<any> | Promise<any> | any => {
  if (response?.headers?.auth) {
    store.$patch((state) => {
      state.auth = response.headers.auth;
    });
  }
  const { code } = response.data;
  if (code === 401) {
    store.$patch((state) => {
      state.auth = "";
      state.isLogin = false;
    });
    router.replace("/login");
  }
  return response.data;
};

// Add a response interceptor
request.interceptors.response.use(responseHandler, errorHandler);

export default request;
