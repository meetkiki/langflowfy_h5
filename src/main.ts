import { createApp } from "vue";
// import "./style.css";
import App from "./App.vue";
import router from "./router";

import { Button } from "ant-design-vue";
import "ant-design-vue/dist/antd.css";

/* highlight.js code theme */
import "highlight.js/styles/atom-one-dark.css";

/* 状态 */
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persist";
const pinia = createPinia();
pinia.use(piniaPersist);

const app = createApp(App);
app.use(router).use(pinia).use(Button).mount("#app");
