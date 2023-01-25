import { Stats } from 'fs';

import { FileStatsStatus } from '../enum/file-stats-status';
import { IExiftoolTag } from './exiftool-tag';

/**
 * ファイル情報
 */
export interface IFileStats extends Stats {
  /** id */
  id?: string;

  /** ファイルパス */
  dirPath?: string;

  /** ファイルパス(ファイル名連結済み) */
  filePath?: string;

  /** ファイル名 */
  fileName?: string;

  /** Exifデータ */
  tags?: IExiftoolTag;

  /** FileStatsステータス */
  statsStatus?: FileStatsStatus;
}
