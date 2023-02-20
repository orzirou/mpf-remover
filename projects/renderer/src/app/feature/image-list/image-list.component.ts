import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { from as RxFrom, of as RxOf } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  some as _some,
  remove as _remove,
  isEmpty as _isEmpty,
  forEach as _forEach,
  filter as _filter,
} from 'lodash';
import { CounterSpinnerDisplayMode } from 'ngx-mat-counterspinner';

import {
  IFileStats,
  IBidirectional,
  ITagDeleteInfo,
} from '../../../../../common';
import { ExifMpfDelete, ITagDeleteMng } from '../image-select';
import { LoadingService } from '../loading';
import { TagDelete } from './image-list.enum';

declare global {
  interface Window {
    exif: IBidirectional;
  }
}

@Component({
  selector: 'app-image-list',
  templateUrl: './image-list.component.html',
  styleUrls: ['./image-list.component.scss'],
})
export class ImageListComponent implements OnChanges {
  /** @ignore Template用 */
  CounterSpinnerDisplayMode = CounterSpinnerDisplayMode;

  /** @ignore Template用 */
  TagDelete = TagDelete;

  /** @ignore ファイル情報一覧 */
  @Input() statsList: IFileStats[] = [];

  /** @ignore 画像選択イベント */
  @Output() selectImageEvent: EventEmitter<IFileStats> = new EventEmitter();

  /** @ignore 画像一覧ロード完了イベント */
  @Output() loadedEvent: EventEmitter<boolean> = new EventEmitter();

  /** @ignore 画像ファイル読込完了数 */
  _loadCounter = 0;

  /** @ignore 画像一覧ロード済み */
  _isLoaded = false;

  /** @ignore 全変更用チェックボックスのラベル */
  _checkLabel = '';

  /** @ignore タグ削除有無状態 */
  _tagDelateStatus = TagDelete.None;

  /** タグ削除対象一覧 */
  _statsTagDeleteMng: { [key: string]: ITagDeleteMng } = {};

  constructor(private loading: LoadingService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['statsList']) {
      this._loadCounter = 0;
      this._tagDelateStatus = TagDelete.None;
      this._checkLabel = '';
      this._isLoaded = false;
      this.update();
    }
  }

  update() {
    this._statsTagDeleteMng = {};
    _forEach(this.statsList, (stats) => {
      this._statsTagDeleteMng[stats.id!] = { checked: true, deleted: false };
    });
  }

  /**
   * @ignore
   * 画像ファイルロード完了検知
   * @param _id id
   */
  onLoadedImage(_id: string | undefined) {
    this._loadCounter++;
    if (this._loadCounter === this.statsList.length) {
      RxFrom(window.exif.cleanUpLoadExif())
        .pipe(
          catchError((error: any) => {
            console.warn('Error cleanUpLoadExif >>', error);
            return RxOf(false);
          })
        )
        .subscribe({
          next: (isSuccess) => {
            this._isLoaded = true;
            this.loadedEvent.emit(isSuccess);
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
    this.selectImageEvent.emit(stats);
  }

  /**
   * @ignore
   * MPFタグ削除ステータス変更検知
   * @param stats ファイル情報
   * @param tagDeleteMng タグ削除管理
   */
  onChangeTagDelStatus(stats: IFileStats, tagDeleteMng: ITagDeleteMng) {
    this._statsTagDeleteMng[stats.id!] = { ...tagDeleteMng };

    let targetCounter = 0;
    let checkedCounter = 0;
    let hasChecked = false;
    _forEach(this._statsTagDeleteMng, (mng, _id) => {
      targetCounter = !mng.deleted ? ++targetCounter : targetCounter;
      checkedCounter = mng.checked ? ++checkedCounter : checkedCounter;
      if (!hasChecked && mng.checked && !mng.deleted) {
        hasChecked = true;
      }
    });

    if (hasChecked) {
      if (targetCounter === checkedCounter) {
        this._tagDelateStatus = TagDelete.All;
        this._checkLabel = '全画像のMPFを削除';
      } else {
        this._tagDelateStatus = TagDelete.Part;
        this._checkLabel = '一部画像のMPFを削除';
      }
    } else {
      this._tagDelateStatus = TagDelete.None;
      this._checkLabel = 'MPF削除対象無し';
    }
  }

  /**
   * @ignore
   * MPFタグ削除ボタンクリック検知
   */
  onClickTagDelete() {
    const deleteList = _filter(this.statsList, (stats) => {
      const mng = this._statsTagDeleteMng[stats.id!];
      return mng.checked && !mng.deleted;
    });
    if (!_isEmpty(deleteList)) {
      this.loading.show();
      RxFrom(window.exif.deleteMpfTag(deleteList))
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
            if (hasDelete) {
              _forEach(tagDelete.deletedList, (deleteStats) => {
                _forEach(this.statsList, (_stats, index) => {
                  if (this.statsList[index].id === deleteStats.id) {
                    this.statsList[index] = deleteStats;
                    this.onChangeTagDelStatus(deleteStats, {
                      checked: false,
                      deleted: true,
                    });
                    return false;
                  }
                  return;
                });
              });
            }
          },
          error: (error) => console.log(error),
        });
    }
  }

  /**
   * @ignore
   * チェック変更検知
   * @param checked チェック有無
   */
  onChangeChecked(checked: boolean) {
    _forEach(this._statsTagDeleteMng, (mng, _id) => {
      if (!mng.deleted) {
        mng.checked = checked;
      }
    });
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
}
