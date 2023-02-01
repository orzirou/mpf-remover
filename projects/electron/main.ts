import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { IpcHandler } from './ipc-handler';

function createWindow() {
  const mainWindow = new BrowserWindow({
    // ピクセル単位でのウインドウの幅
    width: 1600,
    // ピクセル単位でのウインドウの高さ
    height: 1280,
    // ウインドウの背景色
    backgroundColor: '#fff',
    // ウェブページの機能の設定
    webPreferences: {
      // 事前スクリプト
      preload: path.resolve(__dirname, './preload.js'),
      // Mac OS向けのスクロールバウンス有効状態
      scrollBounce: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.on('closed', function () {
    app.quit();
  });

  Menu.setApplicationMenu(makeMainMenu(process.platform === 'darwin'));

  return mainWindow;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  createWindow();
  new IpcHandler().initialize();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      new IpcHandler().initialize();
    }
  });
});

const makeMainMenu = (isMac: boolean) => {
  return Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'hide', label: `${app.name}を隠す` },
        { type: 'separator' },
        { role: 'quit', label: `${app.name}を終了` },
      ],
    },
    {
      label: 'ファイル',
      submenu: [
        isMac
          ? { role: 'close', label: 'ウィンドウを閉じる' }
          : { role: 'quit', label: '終了' },
      ],
    },
    {
      label: '表示',
      submenu: [
        { role: 'toggleDevTools', label: '開発者ツールを表示' },
        { type: 'separator' },
        { role: 'resetZoom', label: '実際のサイズ' },
        { role: 'togglefullscreen', label: 'フルスクリーン' },
      ],
    },
  ]);
};
