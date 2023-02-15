import { Component, AfterViewInit } from '@angular/core';
import { finalize, from as RxFrom, Subscription } from 'rxjs';
import { defer as _defer } from 'lodash';

import { IBidirectional, IFileStats, IErrorInfo } from '../../../../../common';
import { MainPageStatus } from './image-ref-page.enum';
import { ImageRefPageService } from './image-ref-page.service';

declare global {
  interface Window {
    exif: IBidirectional;
  }
}

@Component({
  selector: 'app-image-ref-page',
  templateUrl: './image-ref-page.component.html',
  styleUrls: ['./image-ref-page.component.scss'],
  providers: [ImageRefPageService],
})
export class ImageRefPageComponent implements AfterViewInit {
  /** @ignore Template用 */
  readonly MainPageStatus = MainPageStatus;

  /** @ignore タグ削除ボタン有効化 */
  _enableDeleteTag = false;

  /** @ignore 対象ファイルなし */
  _noneFile?: boolean;

  /** @ignore ファイル情報一覧 */
  _statsList: IFileStats[] = [];

  /** @ignore 選択ファイル */
  _selectFile?: IFileStats;

  /** @ignore 画像サイズ */
  _size = {
    width: '100%',
    height: '100%',
  };

  /** @ignore ヘッダ表示 */
  _visibleHeader = false;

  /** @ignore ステータス */
  _status = MainPageStatus.None;

  /** 画像表示用購読 */
  private subscription?: Subscription;

  constructor(private service: ImageRefPageService) {
    console.log(this.service);
  }

  ngAfterViewInit() {
    _defer(() => (this._status = MainPageStatus.Initialized));
  }

  /**
   * @ignore
   * フォルダ選択クリック検知
   */
  onClickOpenDirectory(): void {
    if (this._status === MainPageStatus.Selecting) {
      return;
    }

    RxFrom(window.exif.getFileStats()).subscribe({
      next: (statsList) => {
        if (!statsList) {
          this._status = MainPageStatus.Initialized;
          return;
        }

        if (statsList.length === 0) {
          this._status = MainPageStatus.Initialized;
          alert('JPEG画像が存在しないディレクトリが選択されました。');
          return;
        }
        this.reset();
        this._status = MainPageStatus.Selecting;
        this._visibleHeader = true;

        this.subscription = new Subscription();
        this.subscription.add(
          RxFrom(window.exif.prepareLoadExif()).subscribe({
            next: (isDone) => {
              if (isDone) {
                this._status = MainPageStatus.Selected;
                this._statsList = statsList;
              } else {
                alert(
                  'ライブラリのロードに失敗しました。\nお手数ですが、もう一度フォルダを選択してください。'
                );
                RxFrom(window.exif.cleanUpLoadExif())
                  .pipe(finalize(() => this.onClickClear()))
                  .subscribe();
              }
            },
          })
        );
      },
      error: (error: IErrorInfo<any>) => {
        this._status = MainPageStatus.Initialized;
        alert(error.messages!.join('\n'));
      },
    });
  }

  /**
   * @ignore
   * クリアの選択検知
   */
  onClickClear() {
    this.reset();
    this._status = MainPageStatus.Initialized;
  }

  /**
   * @ignore
   * 画像ファイルロード完了検知
   * @param isSuccess ロード完了成否
   */
  onLoadedImage(_isSuccess: boolean) {
    this._status = MainPageStatus.Loaded;
  }

  /**
   * @ignore
   * ファイル選択検知
   * @param stats ファイル情報
   */
  onSelectFile(stats: IFileStats) {
    if (this._selectFile?.id !== stats.id) {
      this._selectFile = stats;
      this.resetSize();
    }
  }

  /**
   * @ignore
   * ファイル情報変更検討
   * @param stats ファイル情報
   * @param index Index
   */
  onChangeStats(stats: IFileStats, index: number) {
    this._statsList[index] = stats;
  }

  /**
   * @ignore
   * 画面フィット表示ボタンクリック検知
   */
  onClickFit() {
    this.resetSize();
  }

  /**
   * @ignore
   * 等倍表示ボタンクリック検知
   */
  onClickCropFree() {
    this._size = {
      width: this._selectFile?.tags?.ExifImageWidth + 'px',
      height: this._selectFile?.tags?.ExifImageHeight + 'px',
    };
  }

  /**
   * 表示をリセットする
   */
  private reset() {
    this._visibleHeader = false;
    this._selectFile = undefined;
    this._statsList = [];
    this._status = MainPageStatus.Initialized;
    this.disposeSubscription();
  }

  /**
   * 画像サイズをリセットする
   */
  private resetSize() {
    this._size = {
      width: '100%',
      height: '100%',
    };
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
