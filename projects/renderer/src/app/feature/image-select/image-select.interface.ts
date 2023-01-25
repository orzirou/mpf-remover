import { IImageFile } from '../../../../../common/types';

export interface IImageSelect extends IImageFile {
  /** 選択有無 */
  isSelect: boolean;
}
