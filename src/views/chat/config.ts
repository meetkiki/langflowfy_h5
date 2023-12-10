export const INIT_COUNT: number = 1;
export const month: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const FileTypes = {
  imgage: ["image/jpeg", "image/png", "image/gif", "image/bmp"],
  file: [
    "text/csv",
    "text/plain",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export enum Roles {
  SYSTEM = "SYSTEM",
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}

export const downloadReg = /(\S*)\[\S*\]\(sandbox:\/mnt\/data\/\S*\)(\S*)/gi;

export const RETRY_MAX_TIMES = 2;
