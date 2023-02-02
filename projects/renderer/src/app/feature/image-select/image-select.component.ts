import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { from as RxFrom, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { isNil as _isNil, defer as _defer, isEmpty as _isEmpty } from 'lodash';

import {
  IBidirectional,
  IFileStats,
  IExiftoolTag,
  FileStatsStatus,
} from '../../../../../common';

import { ExifMpfDelete, ExifOrientation } from './image-select.enum';

declare global {
  interface Window {
    exif: IBidirectional;
  }
}

@Component({
  selector: 'app-image-select',
  templateUrl: './image-select.component.html',
  styleUrls: ['./image-select.component.scss'],
})
export class ImageSelectComponent implements OnInit, OnChanges, OnDestroy {
  /** Template用 */
  readonly ExifOrientation = ExifOrientation;

  /** ファイル情報 */
  @Input() stats?: IFileStats;

  /** ファイル情報変更イベント */
  @Output() statsChange: EventEmitter<IFileStats> = new EventEmitter();

  /** ロード完了イベント */
  @Output() loadedEvent: EventEmitter<string> = new EventEmitter();

  /** MPFタグ削除ステータス変更イベント */
  @Output() changeTagDelStatusEvent: EventEmitter<ExifMpfDelete> =
    new EventEmitter();

  /** 選択イベント */
  @Output() selectEvent: EventEmitter<IFileStats> = new EventEmitter();

  /** @ignore サムネイル画像 */
  _thumbnail?: string;

  /** @ignore hover中 */
  _hover = false;

  /** @ignore チェック有無 */
  _checked = false;

  /** @ignore チェックの無効化(MPFタグが存在しない) */
  _disableChecked = false;

  /** 回転 */
  _orientation = ExifOrientation.Normal;

  /** 購読 */
  private subscription = new Subscription();

  /** 画像クリック遅延Emitter */
  private delayClickEmitter = new EventEmitter();

  /** チェックボックスクリック中 */
  private isClickCheckBox = false;

  constructor() {}

  ngOnInit() {
    this.subscription.add(
      this.delayClickEmitter
        .asObservable()
        .pipe(debounceTime(200))
        .subscribe({
          next: () => {
            if (this.isClickCheckBox) {
              this.isClickCheckBox = false;
              return;
            }

            this.selectEvent.emit(this.stats);
          },
        })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stats']) {
      if (!_isNil(changes['stats'].currentValue as IFileStats)) {
        _defer(() => this.load());
      }
    }
  }

  ngOnDestroy() {
    if (this.subscription && !this.subscription.closed) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * @ignore
   * 画像クリック検知
   */
  onClickImage() {
    this.delayClickEmitter.emit();
  }

  /**
   * @ignore
   * チェック変更検知
   */
  onChangeChecked() {
    this.isClickCheckBox = true;
    this.changeTagDelStatusEvent.emit(
      this._checked ? ExifMpfDelete.Need : ExifMpfDelete.Ignore
    );
  }

  /**
   * Exifを読み込む
   */
  private load() {
    console.log(this.stats!.fileName, this.stats!.statsStatus);
    if (
      this.stats!.statsStatus === FileStatsStatus.ExifLoading ||
      this.stats!.statsStatus === FileStatsStatus.ExifLoaded
    ) {
      return;
    }

    if (this.stats!.statsStatus === FileStatsStatus.ExifEdit) {
      console.log(this.stats);
      this.stats!.statsStatus = FileStatsStatus.ExifLoaded;
      this.statsChange.emit(this.stats);

      this._thumbnail = this.stats!.tags!.ThumbnailImage || undefined;
      this._orientation =
        this.stats!.tags!.Orientation || ExifOrientation.Normal;
      this.changeOrientationSize(this.stats!.tags!, this._orientation);

      this._disableChecked = _isEmpty(this.stats!.tags!.MPFVersion);
    } else {
      this.stats!.statsStatus = FileStatsStatus.ExifLoading;
      this.statsChange.emit(this.stats);

      this.subscription.add(
        RxFrom(window.exif.loadExif(this.stats!)).subscribe({
          next: (complementExif) => {
            this.stats = complementExif;
            this.stats!.statsStatus = FileStatsStatus.ExifLoaded;

            this._thumbnail = this.stats.tags!.ThumbnailImage || undefined;
            this._orientation =
              this.stats.tags!.Orientation || ExifOrientation.Normal;

            this.changeOrientationSize(this.stats.tags!, this._orientation);
            this.statsChange.emit(this.stats);

            this._checked = true;
            this._disableChecked = _isEmpty(this.stats.tags!.MPFVersion);

            this.loadedEvent.emit(this.stats.id);

            // 一発チェックを通知する
            this.changeTagDelStatusEvent.emit(
              this._disableChecked ? ExifMpfDelete.Deleted : ExifMpfDelete.Need
            );
          },
          error: (error) => {
            console.warn(this.stats!.fileName, error);

            this.stats!.statsStatus = FileStatsStatus.Error;
            this.statsChange.emit(this.stats);

            this.loadedEvent.emit();
          },
        })
      );
    }
  }

  /**
   * 画像回転を考慮したサイズに返還する
   * @param tags Exifタグ
   * @param orientation 回転
   * @returns 回転を考慮したサイズ
   */
  private changeOrientationSize(
    tags: IExiftoolTag,
    orientation: ExifOrientation
  ) {
    switch (orientation) {
      case ExifOrientation.FlipVirticalRotate90:
      case ExifOrientation.Rotate270:
      case ExifOrientation.FlipHorizontalRotate90:
      case ExifOrientation.Rotate90:
        const width = tags.ExifImageHeight;
        const height = tags.ExifImageWidth;
        tags.ExifImageWidth = width;
        tags.ExifImageHeight = height;
        tags.ImageSize = `${width}x${height}`;
    }
  }
}
