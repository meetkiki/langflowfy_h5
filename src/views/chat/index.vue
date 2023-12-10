<template>
  <Theme/>
  <div class="chat-container">
    <div class="chat-container-left">
      <a-button
          ghost
          size="large"
          @click="handleNewChat"
          style="width: 100%; border-radius: 6px"
      >
        <span>New Chat</span>
        <template #icon>
          <PlusOutlined/>
        </template>
      </a-button>
      <div class="history-container">
        <div :class="['history-container-item',{ 'history-container-item-active': i == historyIndex },]"
            v-for="(record, i) in state.history"
            :Key="record.createdAt"
            @click="isLoadingHistory ? null : handleRestoreHistory(record, i)"
        >
          <MessageOutlined/>
          <div class="history-title">{{ record.chatName }}</div>
        </div>
      </div>
    </div>
    <div class="chat-container-right">
      <Assistant
          style="position: absolute; top: 10px; left: 10px"
          v-model:assistantId="assistant.id"
          :validateLogin="validateLogin"
          @update-chat="handleUpdateChat"
          @update-assistant="handleUpdateAssistant"
      />
      <div
          class="chat-container-right-center"
          :style="{
          '--dynamics-content-color': state.messages.length
            ? 'transparent'
            : '#505161',
        }"
      >
        <div class="messages">
          <ul>
            <li v-for="(msg, i) in state.messages" :key="`message-${i}`">
              <!-- 添加判断，如果是机器人的消息也显示头像 -->
              <div :class="['avatar', `${msg.userType?.toLowerCase()}-avatar`]">
                <span v-if="msg.userType === Roles.USER">Y</span>
                <img v-else-if="msg.userType === Roles.ASSISTANT" src="@/assets/images/chatGpt.svg"/>

              </div>
              <div class="message-content">
                <span class="sender-name" v-if="msg.userType === Roles.ASSISTANT">
                  ChatGPT
                </span>
                <div class="message-text" :id="msg.messageId" v-html="renderMarkdown(msg.message)"></div>
              </div>
            </li>
          </ul>
        </div>
        <div class="chat-container-footer-content">
          <div
              class="chat-container-footer-regenerate"
              v-if="retry.retryFailed"
          >
            <span style="color: red">
              <span style="color: red">network error,</span>
              There was an errorgenerating a response
            </span>
            <Button
                type="primary"
                class="regenerate-button"
                @click="handleRegenerate"
            >
              <template #icon>
                <SyncOutlined
                    :class="[
                    'regenerate',
                    { 'regenerate-rotate': retry.regenerating },
                  ]"
                />
              </template>
              Regenerate
            </Button>
          </div>
          <div class="chat-container-textarea" v-else>
            <div class="file-container" v-if="files.length">
              <div
                  v-for="file in files"
                  :key="file.id"
                  :class="[
                  'file-container-item',
                  file.type === 'image'
                    ? 'file-container-item-image'
                    : 'file-container-item-file',
                ]"
              >
                <CloseCircleOutlined
                    class="file-clear-icon"
                    @click="handleRemoveFile(file.id)"
                />
                <Image
                    v-if="file.type === 'image'"
                    :width="60"
                    :height="60"
                    :src="file.url"
                    :key="file.id"
                />
                <File v-else-if="file.type === 'file'" :file="file"/>
              </div>
            </div>
            <Upload
                v-show="upload.visible"
                multiple
                name="file"
                ref="uploadRef"
                action="/api/upload_file"
                :disabled="!store.isLogin"
                :showUploadList="false"
                :data="{ assistantId : assistant.id }"
                :headers="{ auth: store?.auth }"
                :beforeUpload="handleBeforeUpload"
                @change="handleUploadChange"
            >
              <LoadingOutlined class="left-icon" v-if="upload.loading"/>
              <template v-else>
                <FileImageOutlined
                    v-if="upload.onlyImage"
                    :class="[
                    'left-icon',
                    { 'left-icon-not-allowed': store.isLogin },
                  ]"
                    style="font-size: 18px; bottom: 22px; left: 1%"
                />
                <PaperClipOutlined
                    v-else
                    :class="[
                    'left-icon left-icon-rotate',
                    { 'left-icon-not-allowed': store.isLogin },
                  ]"
                />
              </template>
            </Upload>
            <Textarea
                ref="textarea"
                :auto-size="{ minRows: 1, maxRows: 5 }"
                v-model:value="state.userInput"
                @pressEnter="handePressEnterSendMessage"
                placeholder="Message ChatGPT..."
            />
            <SendOutlined
                v-if="!sending"
                @click="sendMessage"
                :class="[
                'right-icon',
                { 'right-icon-unable-send': !isAbleSendMsg },
              ]"
            />
            <PauseCircleOutlined
                v-else
                @click="handleStopConnect"
                class="right-icon"
            />
          </div>
          <!-- 内容超出视口区域时显示  去底部icon -->
          <DownCircleOutlined
              v-if="showToBottom"
              class="chat-to-bottom-icon"
              @click="move"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Theme} from "@/components";
import {useRouter} from "vue-router";
import {useUserStore} from "@/store/user";
import {DownLoadFile} from "./typing";
import {useUploadStore} from "@/store/upload";
import {File, Assistant} from "./components";
import {convertBase64, sleep, uuid} from "@/utils/utils";
import {EventSourcePolyfill} from "event-source-polyfill";
import type {UploadChangeParam} from "ant-design-vue";
import {createImage, createFile} from "./utils";
import {
  Roles,
  FileTypes,
  INIT_COUNT,
  downloadReg,
  RETRY_MAX_TIMES,
} from "./config";
import {
  Image,
  Button,
  Upload,
  message,
  Textarea,
  notification,
} from "ant-design-vue";
import {
  chat,
  createChat,
  chatHistoryList,
  chatHistoryMessages,
} from "@/api/chat";
import {
  SyncOutlined,
  PlusOutlined,
  SendOutlined,
  MessageOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  FileImageOutlined,
  DownCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons-vue";
import {
  h,
  ref,
  reactive,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";

import 'nprogress/nprogress.css';
import hljs from "highlight.js";
import Clipboard from "clipboard";
import MarkdownIt from "markdown-it";
import NProgress from "nprogress";

const router = useRouter();
const store = useUserStore();
const uploadStore = useUploadStore();

const clipboardInstance = ref<Clipboard | null>(null);
const assistant = ref({
  "id": "asst_XXXXXX",
  "welcomeMessage": "欢迎使用chatGPT，你可以尝试问我你的问题."
});
const textarea = ref<typeof Textarea | null>(null);
const uploadRef = ref<typeof Upload | null>(null);
const files = ref<any>([]);
const sending = ref<boolean>(false);
const isAutoScrolling = ref<boolean>(true);
const showToBottom = ref<boolean>(false);
const sse = ref<EventSourcePolyfill | null>(null);
const chatId = ref<string>("");
const fileKeys = ref<string[]>([]);
const historyIndex = ref<number>(0);
const state = reactive({
  userInput: "",
  messages: [] as any[],
  history: [] as any[],
});
const upload = reactive({
  loading: false,
  count: 0,
  visible: computed(() => uploadStore.supportFile || uploadStore.supportImage),
  onlyImage: computed(
      () => !uploadStore.supportFile && uploadStore.supportImage
  ),
});
/* 断连重试次数 */
const retry = reactive({
  retryMaxTimes: 1,
  retrying: false,
  retrySuccess: false,
  retryFailed: false,
  regenerating: false,
});
const currentEventSource = ref<EventSourcePolyfill | null>(null);

const isAbleSendMsg = computed(() =>
    !sending || (!state.userInput && !files.value.length) ? false : true
);
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typograher: true,
  breaks: true,
  highlight: function (str: string, lang: string) {
    const copyid = `copy-${uuid()}`;
    const copy = `<div class='copy-code-container'><button class='copy-code-btn ${copyid}' type='button' data-clipboard-action='copy' data-clipboard-target='#${copyid}'>Copy code</button></div>`;
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs">${copy}<code id='${copyid}'>${
            hljs.highlight(lang, str, true).value
        }</code></pre>`;
      } catch (__) {
        console.log(__, 'error')
      }
    }
    return (
        '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
    );
  },
});

const markdownRef = ref<string>("");

const renderMarkdown = (rawMarkdown: any) => {
  return md.render(rawMarkdown);
}

const renderInputCursor = () => {
  nextTick(() => {
    let dom = document.getElementsByClassName("message-text")
    let parent = dom[dom.length - 1]
    if (!markdownRef.value){
      markdownRef.value = parent.id;
    }
    // 防止同时出现多个 光标
    // console.log("parent id", parent.id)
    if (markdownRef.value !== parent.id){
      removeRenderInputCursor();
    }
    // 更新id
    markdownRef.value = parent.id;

    let lastNode = parent.lastElementChild || parent
    // 假如是pre标签，就在pre标签中找到class为hljs的元素
    if (lastNode.tagName === 'PRE') {
      lastNode = lastNode.getElementsByClassName('hljs')[0] || lastNode
    }
    // 兼容是ul标签的情况，找到OL标签内部的最终一个元素
    if (lastNode.tagName === 'OL') {
      lastNode = findLastTextNode(lastNode as HTMLElement)
    }

    // 重复插入 跳过
    if (lastNode.querySelector('.blinking-cursor')) {
      return
    }
    // 插入光标到最后一个文本节点之后
    lastNode ?.insertAdjacentHTML('beforeend', '<span class="blinking-cursor"/></span>');
  })
}

const findLastTextNode = (element : Element) : Element => {
// 假如该DOM没有子元素，则回来本身
  if (!element.children.length) {
    return element
  }
  const lastChild = element.children[element.children.length - 1]
  // 假如最终一个子元素是元素节点，则递归查找
  if (lastChild.nodeType === Node.ELEMENT_NODE) {
    return findLastTextNode(lastChild as HTMLElement)
  }
  return element;
};

/* 初始化消息对象 */
const pushMessage = (
    isClear: boolean = true,
    message: string = '',
    messageId: string = 'defaultMessageId',
    userType: string = "ASSISTANT"
) => {
  // 如果 message 未定义或为空，使用 assistant.name 作为默认值
  const defaultMessage = "欢迎使用ChatGPT"; // 或任何其他默认文本
  const finalMessage = message || assistant.value.welcomeMessage || defaultMessage;

  const base = isClear ? [] : state.messages;
  state.messages = [
    ...base,
    {
      userType,
      messageType: "TEXT",
      message: finalMessage,
      messageId: messageId,
      time: "",
      done: false
    },
  ];
};
/* 创建会话 */
const getChatId = async () => {
  const {code, data, message: msg = ""} = await createChat(assistant.value.id);
  if (code !== 200) return message.error(msg);
  chatId.value = data;
  pushMessage();
};

function displayMessage(data : object) {
  let {messageId, type, toolType, streamType, content, files = [], done, role} = data as any;
  if (!messageId || messageId === "null") {
    console.log(" messageId error ", messageId)
  }
  // 更新具有相同 messageId 的消息
  let messageIndex = state.messages.findIndex(msg => msg.messageId === messageId);
  if (messageIndex === -1) {
    messageIndex = state.messages.findIndex(msg => msg.messageId === 'TempMessageId');
  }
  if (type === "TOOL" && toolType === "CODE_INTERPRETER") {
    content = "\n```python\n" + content + "\n```\n";
  }
  content = analysisFilesToContent(content, files, role);
  if (messageIndex !== -1) {
    // 更新消息
    if (streamType == 'BATCH'){
      state.messages[messageIndex].message = content;
    } else {
      state.messages[messageIndex].message += content;
    }
    state.messages[messageIndex].messageId = messageId;
    state.messages[messageIndex].done = done;
  } else {
    pushMessage(false, content, messageId, role || "ASSISTANT");
  }
}

/* 初始化eventsource */
const initEventSource = () => {
  if (!chatId.value) return;
  return new Promise<void>((resolve) => {
    const eventSource = new EventSourcePolyfill(
        `/api/conversion?chatId=${chatId.value}`,
        {
          headers: {
            "Content-Type": "text/event-stream;charset=UTF-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            auth: store?.auth,
          },
          heartbeatTimeout: 10 * 60 * 1000,
        }
    );
    eventSource.onopen = (event) => {
      sse.value = event.target;
      resolve();
    };
    eventSource.onmessage = (event) => {
      retry.regenerating = false;
      retry.retryFailed = false;
      retry.retrySuccess = true;
      if (event.type === "ERROR") {
        removeRenderInputCursor();
        return sse.value?.close();
      }
      const parseData = JSON.parse(event.data);
      // console.log("EventSourcePolyfill:", parseData);
      let {type, content, done} = parseData;
      if (type === 'HEARTBEAT'){
        // console.log("Heartbeat received");
        return;
      }
      if (done) {
        sending.value = false;
        state.messages.at(-1).done = done;
        removeRenderInputCursor();
      }
      if (type == 'ERROR') {
        console.error("data error . ", parseData);
        removeRenderInputCursor();
        return;
      }
      if (!content || content === "null") {
        return;
      }
      displayMessage(parseData);
      if (!done){
        renderInputCursor();
      }
      autoScrollToBottom();
    };
    eventSource.onerror = (event: any) => {
      console.error("EventSourcePolyfill-Error", event);
      removeRenderInputCursor();
      sending.value = false;
      sse.value = null;
      event.target.close();
      retry.regenerating = false;
      retry.retryFailed = false;
      retrySseConnection();
    };
    // 保存EventSource实例的引用
    currentEventSource.value = eventSource;
  });
};

/* 删除光标 */
const removeRenderInputCursor = async () => {
  // 防止后来的删除快于渲染
  await sleep(100);
  let dom = document.getElementsByClassName("blinking-cursor") as HTMLCollectionOf<Element>;
  if (dom){
    for (let i = 0; i < dom.length; i++) {
      let domEle = dom[i];
      if (domEle){
        domEle.remove();
      }
    }
  }
}

/* 会话、发送消息 */
const handePressEnterSendMessage = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};
const sendMessage = () => {
  validateLogin().then(async (isContinue) => {
    if (!isContinue) return;
    let input = state.userInput.trim();
    const isExistFile = files.value.length;
    if (!input && !isExistFile) return;
    if (!sse.value) {
      await initEventSource();
    }
    isAutoScrolling.value = true;
    input = renderFile() + `<p>${input.replace(/(\r\n|\r|\n)/g, "\n")}</p>`;
    sending.value = true;

    NProgress.start(); // 开始显示 NProgress 进度条
    chat(chatId.value, state.userInput, fileKeys.value).then(
        ({code, message: msg = "", data}) => {
          NProgress.done(); // 结束
          if (code !== 200) {
            return message.error(msg);
          } else {
            // console.log(" send message Id = ", data.messageId)
            state.messages.push({
              time: Date.now(),
              message: input,
              messageId: data.messageId,
              messageType: "TEXT",
              userType: Roles.USER,
              done: true,
            });
            state.messages.push({
              userType: Roles.ASSISTANT,
              messageId: 'TempMessageId',
              message: ''
            })
            // 闪烁图标
            renderInputCursor();
            clear();
            autoScrollToBottom();
          }
        }
    );
  });
};
/* 停止会话 */
const handleStopConnect = () => {
  sse.value?.close();
  sse.value = null;
  sending.value = false;
  state.messages.at(-1).done = true;
};
/* 清除输入 */
const clear = () => {
  state.userInput = "";
  files.value = [];
  fileKeys.value = [];
  /* 清除Upload组件缓存文件 */
  uploadRef.value!.fileList = [];
};
/* 渲染附件 */
const renderFile = (): string => {
  let result = "";
  files.value.map((file: any) => {
    const {url, type, name, describe} = file;
    if (type === "image") {
      result += createImage(url);
    } else if (type === "file") {
      result += createFile(name, describe);
    }
  });
  return result;
};
/* 上传附件 */
const handleBeforeUpload = (
    file: UploadChangeParam["file"],
    fileList: UploadChangeParam["fileList"]
) => {
  const {supportFile, supportImage} = uploadStore;
  if (!supportFile && !supportImage) {
    message.warn("当前助理不支持上传附件");
    return false;
  } else {
    if (supportFile && !supportImage) {
      if (!FileTypes.file.includes(file.type!)) {
        message.warn("当前助理仅支持上传非图片类型文件");
        return false;
      }
    } else if (supportImage && !supportFile) {
      if (!FileTypes.imgage.includes(file.type!)) {
        message.warn("当前助理仅支持上传图片");
        return false;
      }
    }
  }
  upload.loading = true;
  upload.count = fileList.length;
};
const handleUploadChange = async ({fileList}: UploadChangeParam) => {
  for (let index = 0; index < fileList.length; index++) {
    const {
      type,
      name,
      status,
      response: {code, data: id = "", message: msg = ""} = {},
    } = fileList[index];
    if (status === "uploading") return;
    if (status === "done") {
      upload.count--;
      if (code !== 200) {
        message.error(msg);
        upload.loading = false;
        return;
      }
      const hasUid = files.value.some((item: any) => item.id === id);
      if (FileTypes.imgage.includes(type!)) {
        const url = await convertBase64(fileList[index].originFileObj);
        if (!hasUid) {
          files.value.push({
            url,
            id,
            type: "image",
          });
          fileKeys.value.push(id);
        }
      } else if (FileTypes.file.includes(type!)) {
        if (!hasUid) {
          files.value.push({
            id,
            name,
            type: "file",
            describe: name.split(".")[1].toLocaleUpperCase(),
          });
          fileKeys.value.push(id);
        }
      }
      if (upload.count === 0) {
        upload.loading = false;
        textarea.value?.focus();
      }
    }
  }
};
/* 删除附件 */
const handleRemoveFile = (id: string) => {
  files.value = files.value.filter((f: any) => f.id !== id);
  fileKeys.value = fileKeys.value.filter((fid: string) => fid !== id);
  /* 清除Upload组件缓存文件 */
  uploadRef.value!.fileList = uploadRef.value!.fileList.filter(
      (f: any) => f.response.data !== id
  );
};
/* 将内容自动滚动至视口区域 */
const move = () => {
  isAutoScrolling.value = true;
  showToBottom.value = false;
  const ele = document.querySelector<HTMLElement>(".messages")!;
  if (ele) {
    ele.scrollTop = ele.scrollHeight; // 如果只需滚动到底部，无需额外距离
  } else {
    console.warn("未找到 '.messages' 元素，无法滚动");
  }
};
const autoScrollToBottom = () => {
  nextTick(() => {
    isAutoScrolling.value && move();
  });
};
/* 监听鼠标滚动 */
const watchWheel = () => {
  const ele = document.querySelector<HTMLElement>(".messages")!;
  const {height} = ele.getBoundingClientRect();
  ele.addEventListener("wheel", function (e: WheelEvent) {
    const {height: ulHeight} = document
        .querySelector<HTMLElement>(".messages ul")!
        .getBoundingClientRect();
    if (e.deltaY < 0) {
      isAutoScrolling.value = false;
      showToBottom.value = true;
    } else {
      if (ele.scrollTop + height >= ulHeight) {
        showToBottom.value = false;
      }
    }
  });
};
/* 历史会话列表 */
const getHistoryList = async () => {
  const {
    code,
    data,
    message: msg = "",
  } = await chatHistoryList(assistant.value.id);
  if (code !== 200) return message.error(msg);
  if (data.length) {
    state.history = data;
    chatId.value = state.history[0].chatId;
    assistant.value.id = state.history[0].assistantId;
    getHistoryMessages();
  } else {
    getChatId();
  }
};

const isLoadingHistory = ref(false);
/* 切换历史记录 */
const handleRestoreHistory = async (record: any, index: number) => {
  if (historyIndex.value === index || isLoadingHistory.value) return;

  if (isLoadingHistory.value) {
    notification.warning({
      message: '请稍等',
      description: '请等待当前历史消息加载完成后再尝试切换。',
      duration: 3
    });
    return;
  }
  isLoadingHistory.value = true; // 开始加载历史消息，设置标志为 true
  NProgress.start(); // 开始显示 NProgress 进度条

  // 关闭现有的 SSE 连接
  sse.value?.close();
  sse.value = null;

  // 使用历史记录更新 assistantId 和 chatId
  chatId.value = record.chatId;
  assistant.value.id = record.assistantId;
  historyIndex.value = index;

  isAutoScrolling.value = true;
  // 调用函数以重新建立连接并加载历史消息
  reconnectAndLoadHistoryMessages().then(() => {
    isLoadingHistory.value = false; // 加载完成，设置标志为 false
    NProgress.done(); // 结束 NProgress 进度条
  });
};

// 新建立一个函数来处理重新连接和加载历史消息的逻辑
const reconnectAndLoadHistoryMessages = async () => {
  // 重新建立与历史会话相关的 SSE 连接
  // 您可能需要根据实际情况调整此处的逻辑
  await initEventSource();
  // 加载历史消息
  await getHistoryMessages();
};

/* 获取历史会话消息 */
const getHistoryMessages = async () => {
  NProgress.start(); // 开始显示 NProgress 进度条
  state.messages = [];
  // 初始化消息
  pushMessage();
  const {
    code,
    data,
    message: msg = "",
  } = await chatHistoryMessages(chatId.value);
  if (code !== 200) return message.error(msg);
  if (data?.length) {
    data.map(({type, toolType, messageId, content, files, role}: any) => {
      /* 处理python代码高亮 */
      if (type === "TOOL" && toolType === "CODE_INTERPRETER") {
        content = "\n```python\n" + content + "\n```\n";
      }
      content = analysisFilesToContent(content, files, role);
      pushMessage(false, content, messageId, role || "ASSISTANT");
    });
  } else {
    pushMessage();
  }
  autoScrollToBottom();
  NProgress.done();
};
/* 新建会话 */
const handleNewChat = () => {
  validateLogin().then(async (isContinue) => {
    if (!isContinue) return;
    if (state.messages.length === INIT_COUNT) {
      return message.info("当前已经是最新会话");
    }
    if (sending.value) return message.info("请等待当前会话结束");
    state.userInput = "";
    getChatId();
  });
};
/* 切换助理callback更新chat */
const handleUpdateChat = () => {
  clear();
  getChatId();
};
/* 切换助理callback 更新助理*/
const handleUpdateAssistant = (assistantId: string, welcomeMessage: string) => {
  assistant.value.id = assistantId;
  assistant.value.welcomeMessage = welcomeMessage;
};
/* 解析file、image */
const analysisFilesToContent = (
    content: string,
    files: DownLoadFile[],
    role: string
): string => {
  const markdownFiles = files?.filter(
      (f: DownLoadFile) => f && f.fileType === "DOC"
  );
  const markdownImages = files?.filter(
      (f: DownLoadFile) => f && f.fileType === "IMAGE"
  );
  markdownImages?.map(({url}: DownLoadFile) => {
    content = createImage(url) + content;
  });
  if (role === Roles.USER) {
    markdownFiles?.map(({filename}: DownLoadFile) => {
      content = createFile(filename, filename.split(".")[1]) + content;
    });
  } else if (role === Roles.ASSISTANT) {
    content = content.replace(
        downloadReg,
        `${handleDownloadFile(markdownFiles)}`
    );
  }
  return content;
};
/* 处理下载链接 */
const handleDownloadFile = (files: DownLoadFile[]): string => {
  let result = "";
  if (files?.length) {
    for (let i = 0; i < files.length; i++) {
      const {url, filename} = files[i];
      result += `\n点击<a href="${url}" download="${filename}">${filename}</a>`;
    }
  }
  return result.startsWith("、") ? result.substring(1) : result;
};
/* 检查登录状态 */
const validateLogin = () => {
  return new Promise<boolean>((resolve, reject) => {
    if (!store?.isLogin) {
      const key = `open${Date.now()}`;
      notification.open({
        message: "提示",
        description: "用户需要登录后，才能体验完整功能",
        btn: () =>
            h(
                Button,
                {
                  type: "primary",
                  onClick: () => {
                    router.push("/login");
                    notification.close(key);
                  },
                },
                {default: () => "跳转登录"}
            ),
        key,
        onClose: () => notification.close(key),
      });
      resolve(false);
    }
    resolve(true);
  });
};
// 将timer定义在外部，以便可以清除它
let timer: number;
/* sse 断连重试 */
const retrySseConnection = () => {
  if (retry.retrying) return;
  retry.retrying = true;

  if (timer) {
    clearInterval(timer); // 清除现有的定时器
  }

  if (retry.retryMaxTimes >= RETRY_MAX_TIMES) {
    retry.retrying = false;
    retry.retryFailed = true;
    return;
  }
  // 取消现有的 EventSource 连接
  cancelEventSource();

  timer = window.setInterval(async () => {
    if (retry.retryMaxTimes >= RETRY_MAX_TIMES) {
      clearInterval(timer);
      retry.retryFailed = true;
      retry.retrying = false;
      return;
    }
    console.info(`重试第${retry.retryMaxTimes}次`);
    ++retry.retryMaxTimes;
    // 延迟1s后重试
    sleep(1000).then(() => initEventSource());
  }, 3000);
};
// 创建一个取消EventSource连接的方法
const cancelEventSource = () => {
  if (currentEventSource) {
    if (currentEventSource.value) {
      currentEventSource.value.close();
    }
    currentEventSource.value = null;
  }
};

/* Regenerate */
const handleRegenerate = async () => {
  retry.regenerating = true;
  await initEventSource();
  const input = state.messages.at(-1).message;
  chat(chatId.value, input, fileKeys.value).then(
      ({code, message: msg = ""}) => {
        if (code !== 200) return message.error(msg);
      }
  );
  clear();
  autoScrollToBottom();
};
onMounted(() => {
  if (store?.isLogin) {
    state.messages = [];
    getHistoryList();
    watchWheel();
    clipboardInstance.value = new Clipboard(".copy-code-btn");
    clipboardInstance.value.on("success", function () {
      message.success("copied!");
      document.getSelection()?.removeAllRanges();
    });
  } else {
    pushMessage();
  }
});
onUnmounted(() => {
  clipboardInstance.value?.destroy();
});
</script>
<style lang="less" scoped>
@import "./index.less";
</style>