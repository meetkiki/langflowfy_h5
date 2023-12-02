export interface ResponseBody<T = any> {
    message: string;
    code: number;
    data?: T | T[];
}