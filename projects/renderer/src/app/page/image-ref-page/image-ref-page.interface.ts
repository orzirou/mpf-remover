import { IFileStats } from '../../../../../common';

/**
 * 画像ステータス管理
 */
export interface IImageStatus {
  /** ファイル情報 */
  stats?: IFileStats;

  /** MPFタグ削除除外 */
  ignore?: boolean;

  /** MPFタグ削除チェック有無 */
  checked?: boolean;
}
