import { IFileStats } from './file-stats';
import { IErrorInfo } from './error-info';

/**
 * MPFタグ削除情報
 */
export interface ITagDeleteInfo {
  /** タグ削除完了ファイル情報一覧 */
  deletedList: IFileStats[];

  /** エラー情報一覧 */
  errorList: IErrorInfo<IFileStats>[];
}
