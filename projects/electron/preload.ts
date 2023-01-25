import { contextBridge, ipcRenderer } from 'electron';
import { IFileStats, ITagDeleteInfo } from '../common/types';

contextBridge.exposeInMainWorld('exif', {
  /**
   * ディレクトリを選択し画像ファイル情報を取得する
   * @returns ファイル情報一覧
   */
  getFileStats: () =>
    ipcRenderer.invoke('getFileStats') as Promise<IFileStats[]>,
  /**
   * Exifの読み込み準備をする
   * @returns 準備結果
   */
  prepareLoadExif: () =>
    ipcRenderer.invoke('prepareLoadExif') as Promise<boolean>,
  /**
   * Exifを読み込む
   * @param stats ファイル情報
   * @returns ファイル情報
   */
  loadExif: (stats: IFileStats) =>
    ipcRenderer.invoke('loadExif', stats) as Promise<IFileStats>,
  /**
   * Exifの読み込みリソースを開放する
   * @returns 後処理結果
   */
  cleanUpLoadExif: () =>
    ipcRenderer.invoke('cleanUpLoadExif') as Promise<boolean>,
  /**
   * 画像を読み込む
   * @param filePath ファイルパス
   * @returns 画像ファイル（バッファ）
   */
  loadImage: (filePath: string) =>
    ipcRenderer.invoke('loadImage', filePath) as Promise<string>,
  /**
   * MPFタグを削除する
   * @param statsList ファイル情報一覧
   * @returns 処理結果
   */
  deleteMpfTag: (statsList: IFileStats[]) =>
    ipcRenderer.invoke('deleteMpfTag', statsList) as Promise<ITagDeleteInfo>,
});
