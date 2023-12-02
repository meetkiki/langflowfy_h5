import { Component } from "vue";
import { MenuDataItem } from "./typing";
export const routes: MenuDataItem[] = [
  {
    path: "/",
    name: "Chat",
    component: (): Component => import("@/views/chat/index.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: (): Component => import("@/views/login/index.vue"),
  },
];
