import { IFileStats } from './file-stats';

/**
 * 画像ファイル情報
 */
export interface IImageFile extends IFileStats {
  /** オリジナル画像データ */
  originalBuffer?: string;
}
