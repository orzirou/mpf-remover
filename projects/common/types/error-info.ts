/**
 * エラー情報
 */
export interface IErrorInfo<T> {
  /** エラーメッセージ */
  messages?: string[];

  /** エラー内容 */
  error?: any;

  /** 補足内容 */
  supplement?: T;
}
