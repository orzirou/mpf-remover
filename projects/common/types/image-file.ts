import { IFileStats } from './file-stats';

export interface IImageFile extends IFileStats {
  /** オリジナル画像データ */
  originalBuffer?: string;

  /** エラー */
  error?: {
    /** エラーメッセージ */
    message: string;
  };
}
