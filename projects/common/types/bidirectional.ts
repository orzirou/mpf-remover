import { IFileStats } from './file-stats';
import { ITagDeleteInfo } from './tag-delete-info';

/**
 * System・Render連携メソッド
 */
export interface IBidirectional {
  /**
   * ディレクトリを選択し画像ファイル情報を取得する
   * @returns ファイル情報一覧
   */
  getFileStats: () => Promise<IFileStats[]>;
  /**
   * Exifの読み込み準備をする
   * @returns 準備結果
   */
  prepareLoadExif: () => Promise<boolean>;
  /** Exif読み込む */
  loadExif: (stats: IFileStats) => Promise<IFileStats>;
  /**
   * Exifの読み込みリソースを開放する
   * @returns 後処理結果
   */
  cleanUpLoadExif: () => Promise<boolean>;
  /**
   * 画像を読み込む
   * @param filePath ファイルパス
   * @returns 画像ファイル（バッファ）
   */
  loadImage: (filePath: string) => Promise<string>;
  /**
   * MPFタグを削除する
   * @param statsList ファイル情報一覧
   * @returns 処理結果
   */
  deleteMpfTag: (statsList: IFileStats[]) => Promise<ITagDeleteInfo>;
}
