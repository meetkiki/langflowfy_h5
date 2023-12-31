

export const uuid = () => {
  var s: any[] = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
};

export const convertBase64 = (file: any) => {
  return new Promise((resolve) => {
    const redear = new FileReader();
    redear.readAsDataURL(file);
    redear.onload = function () {
      resolve(redear.result);
    };
  });
};

// 定义一个延迟执行的函数
export const sleep = (milliseconds : number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
