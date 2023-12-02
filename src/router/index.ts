import { routes } from "./routes";
import { whiteRouter } from "./white-router";
import { useUserStore } from "@/store/user";
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
router.beforeEach((to, from, next) => {
  const store = useUserStore();
  if (whiteRouter.includes(to.path)) {
    next();
  } else if (store?.auth) {
    next();
  } else {
    if (to.path == "/login") {
      next();
    } else {
      next("/login");
    }
  }
});
export default router;
