import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

export const createImage = (url: string) => {
  return `<img src="${url}" style="width:500px; border-radius: 6px;margin-right: 10px; margin-bottom: 10px;"/><br/>`;
};

export const createFile = (name: string, describe: string) => {
  return `
  <div
    style="
      margin-right: 10px;
      margin-bottom: 10px;
      position: relative;
      min-width: 150px;
      height: 60px;
      border: 1px solid #e2e2e2;
      border-radius: 8px;
      padding: 4px 20px 4px 5px;
      background-color: #fff;
      display: flex;
      align-items: center;
      background-color:#fff;
      width:fit-content;
      box-sizing:border-box;
    "
  >
    <div style="
      width: 40px;
      height: 40px;
      color: #fff;
      background-color: #ff5588;
      border-radius: inherit;
      font-size: 22px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 10px;
    ">
      <svg focusable="false" data-icon="file-text" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z"></path></svg>
    </div>
    <div style="
      display: flex;
      flex-flow: column;
      font-weight: 500;
    ">
      <span style="font-size: 16px;color:#616161">
        ${name}
      </span>
      <span style="
          font-size: 12px;
          color: rgba(0, 0, 0, 0.3);
      ">
        ${describe}
      </span>
    </div>
  </div>`;
};
