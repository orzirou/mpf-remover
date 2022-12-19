/**
 * FileStatsステータス
 */
export enum FileStatsStatus {
  /** 初期状態 */
  Init,
  /** システムステータス */
  SystemStats,
  /** Exif読込中 */
  ExifLoading,
  /** Exif読込完了 */
  ExifLoaded,
  /** エラー */
  Error,
}
