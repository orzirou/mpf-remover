/**
 * MPFタグ削除ステータス
 */
export enum ExifMpfDelete {
  /** 必要(変更する) */
  Need,
  /** 不要(変更しない) */
  Ignore,
  /** 削除済み */
  Deleted,
}

/**
 * 画像回転
 */
export enum ExifOrientation {
  /** 通常 */
  Normal = 1,
  /** 左右反転 */
  FlipHorizontal,
  /** 180度回転 */
  Rotate180,
  /** 上下反転 */
  FlipVirtical,
  /** 上下反転 + 90度回転 */
  FlipVirticalRotate90,
  /** 270度回転 */
  Rotate270,
  /** 左右反転 + 90度回転 */
  FlipHorizontalRotate90,
  /** 90度回転 */
  Rotate90,
}
