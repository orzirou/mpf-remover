/**
 * FileStatsステータス
 */
export enum FileStatsStatus {
  /** 初期状態 */
  Init,
  /** Exif読込中 */
  ExifLoading,
  /** Exif読込完了 */
  ExifLoaded,
  /** エラー */
  Error,
}
