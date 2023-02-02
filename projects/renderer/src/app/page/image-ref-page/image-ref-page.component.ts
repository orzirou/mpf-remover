import { Component, AfterViewInit } from '@angular/core';
import { finalize, from as RxFrom, Subscription } from 'rxjs';
import {
  chunk as _chunk,
  isEmpty as _isEmpty,
  remove as _remove,
  some as _some,
  map as _map,
  assign as _assign,
  cloneDeep as _cloneDeep,
  forEach as _forEach,
  find as _find,
  defer as _defer,
} from 'lodash';
import { CounterSpinnerDisplayMode } from 'ngx-mat-counterspinner';

import {
  IBidirectional,
  IFileStats,
  IErrorInfo,
  ITagDeleteInfo,
  FileStatsStatus,
} from '../../../../../common';
import { ExifMpfDelete } from '../../feature/image-select';
import { MainPageStatus } from './image-ref-page.enum';
import { ImageRefPageService } from './image-ref-page.service';
import { LoadingService } from '../../feature/loading';

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

  /** @ignore Template用 */
  readonly CounterSpinnerDisplayMode = CounterSpinnerDisplayMode;

  /** @ignore 表示用ファイル情報一覧 */
  _dispStatsList: IFileStats[][] = [];

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

  /** @ignore 画像ファイル読込完了数 */
  _loadCounter = 0;

  /** @ignore タグ削除対象有無 */
  _hasTagDelete = false;

  /** @ignore ステータス */
  _status = MainPageStatus.None;

  /** ディレクトリ選択表示中 */
  private showOpenDirectory = false;

  /** タグ削除対象一覧 */
  private tagDeleteTargetList: IFileStats[] = [];

  /** 画像表示用購読 */
  private subscription?: Subscription;

  constructor(
    private service: ImageRefPageService,
    private loading: LoadingService
  ) {
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

    this._status = MainPageStatus.Selecting;
    this.showOpenDirectory = true;
    RxFrom(window.exif.getFileStats()).subscribe({
      next: (statsList) => {
        this._status = MainPageStatus.Selecting;
        this.showOpenDirectory = false;

        if (!statsList) {
          this._status = MainPageStatus.Initialized;
          return;
        }

        this.reset();

        if (statsList.length === 0) {
          this._status = MainPageStatus.Initialized;
          alert('JPEG画像が存在しないディレクトリが選択されました。');
          return;
        }

        this._visibleHeader = true;
        console.log('onClickOpenDirectory', this._visibleHeader);

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
        this.showOpenDirectory = false;
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
   * @param _id id
   */
  onLoadedImage(_id: string | undefined) {
    this._loadCounter++;
    if (this._loadCounter === this._statsList.length) {
      RxFrom(window.exif.cleanUpLoadExif()).subscribe({
        next: () => (this._status = MainPageStatus.Loaded),
        error: (error) => {
          console.log(error);
          this._status = MainPageStatus.Loaded;
        },
      });
    }
  }

  /**
   * @ignore
   * ファイル選択検知
   * @param stats ファイル情報
   */
  onSelectFile(stats: IFileStats) {
    console.log(stats);
    if (this._selectFile?.id !== stats.id) {
      this._selectFile = stats;
      this.resetSize();
    }
  }

  /**
   * @ignore
   * MPFタグ削除ステータス変更検知
   * @param stats ファイル情報
   * @param status MPFタグ削除ステータス
   */
  onChangeTagDelStatus(stats: IFileStats, status: ExifMpfDelete) {
    if (status === ExifMpfDelete.Need) {
      if (
        !_some(this.tagDeleteTargetList, (target) => target.id === stats.id)
      ) {
        this.tagDeleteTargetList.push(stats);
      }
    } else {
      _remove(this.tagDeleteTargetList, (target) => target.id === stats.id);
    }

    this._hasTagDelete = this.tagDeleteTargetList.length > 0;
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
   * @ignore
   * MPFタグ削除ボタンクリック検知
   */
  onClickTagDelete() {
    if (!_isEmpty(this.tagDeleteTargetList)) {
      this.loading.show();
      RxFrom(window.exif.deleteMpfTag(this.tagDeleteTargetList))
        .pipe(finalize(() => this.loading.hide()))
        .subscribe({
          next: (tagDelete: ITagDeleteInfo) => {
            console.log(tagDelete);

            let message = '';
            let hasDelete = false;
            if (!_isEmpty(tagDelete.deletedList)) {
              hasDelete = true;

              if (_isEmpty(tagDelete.errorList)) {
                message = 'MPFタグを削除しました。';
              } else {
                message = '一部画像のMPFタグ削除に失敗しました。';
              }
            } else {
              if (_isEmpty(tagDelete.errorList)) {
                // NOP(タグ削除蓋している：ボタン押せない起きないはず)
                return;
              } else {
                message = 'MPFタグ削除に失敗しました。';
              }
            }

            alert(message);
            _forEach(tagDelete.deletedList, (deleteStats) => {
              _forEach(this._statsList, (_stats, index) => {
                if (this._statsList[index].id === deleteStats.id) {
                  this._statsList[index] = deleteStats;
                  this.onChangeTagDelStatus(deleteStats, ExifMpfDelete.Deleted);
                  return false;
                }
                return;
              });
            });
          },
          error: (error) => console.log(error),
        });
    }
  }

  /**
   * @ignore
   * 画像の再描画処理
   * @param _index インデックス
   * @param _data 行データ
   * @returns
   */
  trackByFile(_index: number, stats: IFileStats) {
    return stats.id;
  }

  /**
   * 表示をリセットする
   */
  private reset() {
    this._visibleHeader = false;
    console.log('reset', this._visibleHeader);
    this._loadCounter = 0;
    this._selectFile = undefined;
    this._statsList = [];
    this._dispStatsList = [];
    this.tagDeleteTargetList = [];
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
