import request from "@/utils/request";
import { stringify } from "qs";

/* 创建会话 */
export function createChat(uid: string) {
  const params = {
    assistantId: uid,
    chatName: "新会话",
  };
  return request.post<any, any>("/create_chat", params);
}

/* 会话 */
export function chat(chatId: string, message: string, fileKeys: string[] = []) {
  const params = {
    chatId,
    message: message || null,
    fileKeys,
  };
  return request.post<any, any>("/chat", params);
}

/* 历史会话列表 */
export function chatHistoryList(assistantId: string) {
  const params = {
    // assistantId,
  };
  return request.get<any, any>("/chat_history", { params });
}

/* 历史会话消息 */
export function chatHistoryMessages(chatId: string) {
  return request.get<any, any>("/chat_message", {
    params: {
      chatId,
    },
  });
}

/* 用户助理列表 */
export function getUserAssistantList() {
  return request.get<any, any>("/assistants");
}

/* 登录 */
export function login(params: { username: string; password: string }) {
  return request.post<any, any>("/user/login", params);
}

/* 退出登录 */
export function loginOut() {
  return request.post<any, any>("/user/loginOut");
}
