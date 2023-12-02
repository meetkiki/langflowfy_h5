/// <reference types="vite/client" />
declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module "markdown-it" {
  export { default } from "markdown-it";
}
declare module "clipboard" {
  export { default } from "clipboard";
}
