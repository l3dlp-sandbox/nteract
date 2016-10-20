import path from 'path';

import { shell, BrowserWindow } from 'electron';

let launchIpynb;

export function getPath(url) {
  const nUrl = url.substring(url.indexOf('static'), path.length);
  return path.join(__dirname, '..', '..', nUrl.replace('static/', ''));
}

export function deferURL(event, url) {
  event.preventDefault();
  if (!url.startsWith('file:')) {
    shell.openExternal(url);
  } else if (url.endsWith('.ipynb')) {
    launchIpynb(getPath(url));
  }
}

const iconPath = path.join(__dirname, '..', '..', 'static', 'icon.png');

const initContextMenu = require('electron-context-menu');

export function launch(filename) {
  let win = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: iconPath,
    title: 'nteract',
  });

  const index = path.join(__dirname, '..', '..', 'static', 'index.html');
  win.loadURL(`file://${index}`);

  initContextMenu();

  win.webContents.on('did-finish-load', () => {
    if (filename) {
      win.webContents.send('main:load', filename);
    }
    win.webContents.send('main:load-config');
    // TODO: else, we assume it's an empty notebook
    //       assumption right now is that launchNewNotebook will handle the follow on
  });

  win.webContents.on('will-navigate', deferURL);

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });
  return win;
}
launchIpynb = launch;

export function launchNewNotebook(kernelSpecName) {
  const win = launch();
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('main:new', kernelSpecName);
  });
  return win;
}
