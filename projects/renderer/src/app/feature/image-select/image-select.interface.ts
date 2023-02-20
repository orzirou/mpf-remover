import { IImageFile } from '../../../../../common/types';

export interface IImageSelect extends IImageFile {
  /** 選択有無 */
  isSelect: boolean;
}

export interface ITagDeleteMng {
  /** 削除実施チェック有無 */
  checked: boolean;

  /** MPF宅所済みフラグ */
  deleted: boolean;
}
