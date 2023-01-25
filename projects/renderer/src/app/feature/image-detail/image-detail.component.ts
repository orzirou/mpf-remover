import {
  Component,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Input,
} from '@angular/core';
import { from as RxFrom, Subscription, defer as RxDefer } from 'rxjs';
import { isNil as _isNil, defer as _defer, isEmpty as _isEmpty } from 'lodash';

import { IBidirectional, IFileStats } from '../../../../../common';

declare global {
  interface Window {
    exif: IBidirectional;
  }
}

@Component({
  selector: 'app-image-detail',
  templateUrl: './image-detail.component.html',
  styleUrls: ['./image-detail.component.scss'],
})
export class ImageDetailComponent implements OnChanges, OnDestroy {
  /** ファイル情報 */
  @Input() stats?: IFileStats;

  /** 画像サイズ */
  @Input() size = {
    width: '100%',
    height: '100%',
  };

  /** @ignore 画像ファイル */
  _imageBuffer?: string;

  /** @ignore 読込エラー */
  _readError?: boolean;

  /** @ignore ロード中 */
  _isLoading = false;

  /** @ignore スクロール */
  _isScroll = false;

  /** 購読 */
  private subscription?: Subscription;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if (changes['stats']) {
      this._readError = false;
      this._imageBuffer = undefined;
      this.disposeSubscription();

      const stats: IFileStats = changes['stats'].currentValue;
      if (stats) {
        this.subscription = new Subscription();

        this._isLoading = true;
        this.subscription.add(
          RxDefer(() =>
            RxFrom(window.exif.loadImage(stats.filePath!))
          ).subscribe({
            next: (imageBuffer) => {
              this._imageBuffer = imageBuffer;
            },
            error: (error) => {
              console.warn(error);
              this._isLoading = false;
              this._readError = true;
            },
          })
        );
      } else {
        this._isLoading = false;
      }
    }

    if (changes['size']) {
      const size = changes['size'].currentValue;
      this._isScroll =
        size && (size.width !== '100%' || size.height !== '100%');
    }
  }

  ngOnDestroy() {
    this.disposeSubscription();
  }

  /**
   * 画像読込完了検知
   */
  onLoaded() {
    _defer(() => (this._isLoading = false));
  }
  /**
   * 購読を破棄する
   */
  private disposeSubscription() {
    if (this.subscription && !this.subscription.closed) {
      this.subscription.unsubscribe();
    }
    this.subscription = undefined;
  }
}
