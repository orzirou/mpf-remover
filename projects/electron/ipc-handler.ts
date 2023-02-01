import { dialog, app, ipcMain, BrowserWindow } from 'electron';
import {
  map as _map,
  forEach as _forEach,
  first as _first,
  isEmpty as _isEmpty,
  tap as _tap,
} from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { from as RxFrom, forkJoin as RxForkJoin, of as RxOf } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';

const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

import { JPEG_BASE64_PREF } from '../common/const';
import {
  IFileStats,
  IExiftoolTag,
  IErrorInfo,
  ITagDeleteInfo,
} from '../common/types';
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
    ipcMain.handle('getFileStats', (event) => this.getFileStats(event.sender));
    ipcMain.handle('prepareLoadExif', (_event) => this.prepareLoadExif());
    ipcMain.handle('loadExif', (_event, stats: IFileStats) =>
      this.loadExif(stats)
    );
    ipcMain.handle('cleanUpLoadExif', (_event) => this.cleanUpLoadExif());
    ipcMain.handle('loadImage', (_event, filePath: string) =>
      this.loadImage(filePath)
    );
    ipcMain.handle('deleteMpfTag', (_event, statsList: IFileStats[]) =>
      this.deleteMpfTag(statsList)
    );
  }

  /**
   * ディレクトリを選択し画像ファイル情報を取得する
   * @returns ファイル情報一覧
   */
  private getFileStats(webContents: Electron.WebContents) {
    return new Promise((resolve, reject) => {
      dialog
        .showOpenDialog(BrowserWindow.fromWebContents(webContents)!, {
          properties: ['openDirectory'],
          title: 'フォルダ選択',
          defaultPath: app.getPath('downloads'),
          filters: [{ name: '画像ファイル', extensions: ['jpeg', 'jpg'] }],
        })
        .then(
          (dialogResult) => {
            if (!dialogResult || dialogResult.canceled) {
              resolve(null);
              return;
            }

            const dirPath = dialogResult.filePaths[0];
            try {
              const fileNameList = fs.readdirSync(dirPath);
              if (_isEmpty(fileNameList)) {
                resolve([]);
                return;
              }

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
                    if (
                      stat.isFile() &&
                      IpcHandler.isJpeg(filePathList[index])
                    ) {
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
                error: (statError) =>
                  reject({
                    messages: ['ファイル情報の取得に失敗しました。'],
                    error: statError,
                  } as IErrorInfo<any>),
              });
            } catch (error) {
              reject({
                messages: [`${dirPath}の読み込みに失敗しました。`],
                error,
              } as IErrorInfo<any>);
            }
          },
          (openDialogError) => {
            reject({
              messages: ['ディレクトリ選択ダイアログが開けませんでした。'],
              error: openDialogError,
            } as IErrorInfo<any>);
          }
        );
    });
  }

  /**
   * Exifの読み込み準備をする
   * @returns 準備結果
   */
  private prepareLoadExif() {
    return new Promise((resolve) => {
      ep.open().then(
        () => resolve(true),
        () => resolve(false)
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
   * Exifの読み込みリソースを開放する
   * @returns 後処理結果
   */
  private cleanUpLoadExif() {
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
   * @param statsList ファイル情報一覧
   * @returns 処理結果
   */
  private deleteMpfTag(statsList: IFileStats[]) {
    const deleteInfo = {
      deletedList: [] as IFileStats[],
      errorList: [],
    } as ITagDeleteInfo;
    return new Promise<ITagDeleteInfo>((resolve, reject) => {
      ep.open().then(
        () => {
          RxForkJoin(
            _map(statsList, (stats) => {
              return RxFrom(
                ep.writeMetadata(stats.filePath, {}, [
                  'MPF:all=',
                  'overwrite_original',
                ])
              ).pipe(
                mergeMap(() => RxFrom(this.loadExif(stats))),
                tap((tagDeleteStats) => {
                  deleteInfo.deletedList.push({
                    ...tagDeleteStats,
                    statsStatus: FileStatsStatus.ExifEdit,
                  });
                }),
                catchError((writeError) => {
                  deleteInfo.errorList.push({
                    error: writeError,
                    supplement: stats,
                  });
                  return RxOf(stats);
                })
              );
            })
          ).subscribe({
            complete: () => {
              ep.close();
              resolve(deleteInfo);
            },
          });
        },
        (error: any) => {
          reject({
            messages: ['MPFタグの削除に失敗しました。'],
            error,
          } as IErrorInfo<any>);
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
