import { dialog, app, ipcMain } from 'electron';
import { map as _map, forEach as _forEach, first as _first } from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { from as RxFrom, forkJoin as RxForkJoin, of as RxOf } from 'rxjs';
import { catchError } from 'rxjs/operators';

const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

import { JPEG_BASE64_PREF } from '../common/const';
import { IFileStats, IExiftoolTag } from '../common/types';
import { FileStatsStatus } from '../common/enum';

export class IpcHandler {
  static counter = 0;

  constructor() {
    IpcHandler.counter++;
  }

  /**
   * 初期処理
   */
  initialize() {
    ipcMain.handle('getFileStats', this.getFileStats);
    ipcMain.handle('prepareLoadExif', (_event) => this.prepareLoadExif());
    ipcMain.handle('loadExif', (_event, stats: IFileStats) =>
      this.loadExif(stats)
    );
    ipcMain.handle('postLoadExif', (_event) => this.postLoadExif());
    ipcMain.handle('loadImage', (_event, filePath: string) =>
      this.loadImage(filePath)
    );
    ipcMain.handle('deleteMpfTag', (_event, filePathList: string[]) =>
      this.deleteMpfTag(filePathList)
    );
  }

  /**
   * ディレクトリを選択し画像ファイル情報を取得する
   * @returns
   */
  private getFileStats() {
    return dialog
      .showOpenDialog({
        properties: ['openDirectory'],
        title: 'フォルダ選択',
        defaultPath: app.getPath('downloads'),
        filters: [{ name: '画像ファイル', extensions: ['jpeg', 'jpg'] }],
      })
      .then((dialogResult) => {
        if (!dialogResult || dialogResult.canceled) {
          return null;
        }

        const dirPath = dialogResult.filePaths[0];
        return new Promise<IFileStats[]>((resolve, reject) => {
          try {
            const fileNameList = fs.readdirSync(dirPath);
            const filePathList = _map(fileNameList, (fileName) =>
              path.join(dirPath, fileName)
            );
            RxForkJoin(
              _map(filePathList, (filePath) =>
                RxFrom(fs.promises.stat(filePath))
              )
            ).subscribe({
              next: (statList) => {
                const fileStatList: IFileStats[] = [];
                _forEach(statList, (stat, index) => {
                  if (stat.isFile() && IpcHandler.isJpeg(filePathList[index])) {
                    fileStatList.push({
                      ...stat,
                      id: `${fileNameList[index]}_${stat.ctimeMs}`,
                      dirPath,
                      filePath: filePathList[index],
                      fileName: fileNameList[index],
                      statsStatus: FileStatsStatus.Init,
                    });
                  }
                });

                resolve(fileStatList);
              },
              error: (statError) => reject(statError),
            });
          } catch (error) {
            reject(error);
          }
        });
      });
  }

  /**
   * Exif読み込み準備
   * @returns 準備結果
   */
  private prepareLoadExif() {
    return new Promise((resolve, reject) => {
      ep.open().then(
        () => resolve(true),
        () => reject(false)
      );
    });
  }

  /**
   * Exifを読み込む
   * @param stats ファイル情報
   * @returns ファイル情報
   */
  private loadExif(stats: IFileStats) {
    stats.statsStatus = FileStatsStatus.ExifLoading;

    return new Promise<IFileStats>((resolve, reject) => {
      RxFrom(
        new Promise<{ [key: string]: any }>((tagResolve, tagReject) => {
          ep.readMetadata(stats.filePath!, ['b', 'n', '-File:all']).then(
            (tagRead: any) => {
              tagResolve(tagRead ? _first(tagRead.data)! : {});
            },
            (tagError: string) => {
              tagReject(tagError);
            }
          );
        })
      ).subscribe({
        next: (tags: IExiftoolTag) => {
          if (tags.ThumbnailImage) {
            tags.ThumbnailImage = `${JPEG_BASE64_PREF}${tags.ThumbnailImage.replace(
              /^base64\:/,
              ''
            )}`;
          }

          resolve({
            ...stats,
            tags,
            statsStatus: FileStatsStatus.ExifLoaded,
          } as IFileStats);
        },
        error: (readError) => reject(readError),
      });
    });
  }

  /**
   * Exif読み込み後始末
   * @returns 後処理結果
   */
  private postLoadExif() {
    return new Promise((resolve) => {
      ep.close();
      resolve(true);
    });
  }

  /**
   * 画像を読み込む
   * @param filePath ファイルパス
   * @returns 画像ファイル（バッファ）
   */
  private loadImage(filePath: string) {
    return new Promise<string>((resolve, reject) => {
      return RxFrom(fs.promises.readFile(filePath)).subscribe({
        next: (buffer) => {
          resolve(
            `${JPEG_BASE64_PREF}${Buffer.from(buffer).toString('base64')}`
          );
        },
        error: (readError) => reject(readError),
      });
    });
  }

  /**
   * MPFタグを削除する
   * @param filePathList ファイルパス一覧
   * @returns 処理結果
   */
  private deleteMpfTag(filePathList: string[]) {
    const errorFileList: string[] = [];
    return new Promise<string[]>((resolve, reject) => {
      ep.open().then(
        () => {
          RxForkJoin(
            _map(filePathList, (filePath) => {
              return RxFrom(ep.writeMetadata(filePath, {}, ['MPF:all='])).pipe(
                catchError(() => {
                  errorFileList.push(path.basename(filePath));
                  return RxOf(filePath);
                })
              );
            })
          ).subscribe({
            complete: () => {
              ep.close();
              resolve(errorFileList);
            },
          });
        },
        (error: any) => {
          reject({ errorMessage: 'MPFタグの削除に失敗しました', error });
        }
      );
    });
  }

  /**
   * jpegファイルか確認する(拡張子判断)
   * @param filePath ファイルパス
   * @returns jpgeg画像か否か
   */
  private static isJpeg(filePath: string) {
    const extName = path.extname(filePath).toLowerCase();
    return extName === '.jpeg' || extName === '.jpg';
  }
}
