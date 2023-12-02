import { defineStore } from "pinia";

export const useUploadStore = defineStore({
  id: "PINIA_STORE_UPLOAD",
  state: () => ({
    supportFile: false,
    supportImage: true,
  }),
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage }],
  },
});
