import { defineStore } from "pinia";
export const useUserStore = defineStore({
  id: "PINIA_STORE_USER",
  state: () => ({
    auth: "",
    isLogin: false,
  }),
  actions: {
    logout() {
      this.auth = "";
      this.isLogin = false;
    },
  },
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage }],
  },
});
