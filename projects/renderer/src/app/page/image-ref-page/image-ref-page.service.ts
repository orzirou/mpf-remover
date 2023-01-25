import { Injectable } from '@angular/core';
import { chunk as _chunk, last as _last } from 'lodash';

import { IFileStats } from '../../../../../common';
import { IMAGE_WIDTH } from './image-ref-page.const';

@Injectable()
export class ImageRefPageService {
  /**
   * Windowサイズにあわせて画像表示を分割する
   * @param statsList ファイル情報一覧
   * @returns 分割結果
   */
  chunkFileList(statsList: IFileStats[]) {
    const chunkCount = this.calcChunk();
    const chunkFile = _chunk(statsList, chunkCount);
    const last = _last(chunkFile);
    if (last && last.length !== chunkCount) {
      for (let i = chunkCount - last.length; i > 0; i--) {
        last.push({ id: undefined } as IFileStats);
      }
    }

    return chunkFile;
  }

  /**
   * 分割数を計算する
   * @returns 分割数
   */
  private calcChunk() {
    // 10は画像間の余白としてのバッファ
    return Math.floor(document.body.clientWidth / (IMAGE_WIDTH + 10));
  }
}
