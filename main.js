// The ipcMain and ipcRenderer modules allow communication between the main
// process and the renderer processes.
//
// For more info, see:
// https://electronjs.org/docs/api/ipc-main
// https://electronjs.org/docs/api/ipc-renderer

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
const os = require('os')

const resourcePath = (process.resourcesPath.indexOf("node_modules") > 0) ? __dirname : process.resourcesPath

//console.log(process.resourcesPath)
//console.log(__dirname)

let appPrinters = ""
let mainWindow = ""
let previewWin = ""

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


app.whenReady().then(() => {
  createWindows();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  previewWin.webContents.getPrintersAsync().then(data => {
    appPrinters = data;
    //console.info(`Printer List:\n`, appPrinters);
  }).catch(error => {
    console.error(`Failed to get printer list: `, error)
  })

  const MWObjects = loadMWObjects('MWObjects.json')
  //console.log(MWObjects);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('MWObjects', MWObjects);
  });

  previewWin.on('close', (e) => {
    e.preventDefault();
    previewWin.hide()
  })

})

ipcMain.on('send-to-printer', (_event, dataObj) => {
  let focusedWindow = BrowserWindow.getFocusedWindow();
  //console.log(`printPreviewMain printOptions:\n`, dataObj.printOptions)
  let dataURL = dataObj.printData.pdfDataUrl;


  let printWin = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    show: false,

    webPreferences: { plugins: true }
  });

  printWin.loadURL(dataURL);

  printWin.webContents.on('-pdf-ready-to-print', () => {
    printWin.webContents.print(dataObj.printOptions, (success, errorType) => {
      //console.log("printPreviewMain Printing. . .\n", dataObj.printOptions);
      printWin.close();
      previewWin.close();
      printWin = null;
      if (!success) console.error(errorType);
    })

  })

})

ipcMain.on('cancel-print', (_event) => {
  previewWin.hide();
})

ipcMain.handle('genPDF', async (_event, dataObj) => {
  //console.log(`genPDF data in:\n`, dataObj);
  const reprintWin = BrowserWindow.fromId(dataObj.originalWin)

  try {
    const pdfData = await reprintWin.webContents.printToPDF(dataObj.printOptions);
    const pdfBase64 = pdfData.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
    
    const pdfObj = {
      pdfData: pdfData,
      pdfDataUrl: pdfDataUrl,
      origWin: dataObj.originalWin
    }
    //console.log(`new pdf:\n`, pdfObj)

    return {success: true, pdfObj: pdfObj};
  } catch (error) {
    return { success: false, error: error.message };
  }

})



const PDFoptions = {
  printBackground: true,
  pageSize: 'Letter',
  displayHeaderFooter: false,
  margins: {
    top: 0.75,
    bottom: 0.75,
    left: 0.75,
    right: 0.75
  }
};

const contextTemplate = [
  { label: 'Quit App', role: 'quit' },
  { label: 'Open/Close Console', role: 'toggleDevTools' },
  {
    label: 'Print to PDF',
    click: () => {
      let focusedWindow = BrowserWindow.getFocusedWindow();
      focusedWindow.webContents.printToPDF(PDFoptions).then(data => {
        loadPDFWindow(data);
      }).catch(error => {
        console.error(`Failed to generate PDF: `, error)
      })
    }
  },
  {
    label: 'Print',
    click: () => {
      let focusedWindow = BrowserWindow.getFocusedWindow();
      printPreview(focusedWindow)
    }
  }
]

contextMenu = Menu.buildFromTemplate(contextTemplate)

ipcMain.on('show-context-menu', (event) => {
  contextMenu.popup(BrowserWindow.fromWebContents(event.sender))
})


function loadPDFWindow(data) {
  let pdfPath = dialog.showSaveDialogSync({
    title: "Save PDF",
  });
  if (pdfPath != "") {
    fs.writeFileSync(pdfPath, data, (err) => {
      if (err) {
        console.error(`Saving PDF file error:\n`, err);
        return false;
      }
    })
    shell.openPath(pdfPath);

  }
}

function loadMWObjects(fileName) {
  let filePath = __dirname
  /*if (resourcePath.indexOf("resources") < 0) {
      filePath = path.join(resourcePath, "/resources/");
  } else {
      filePath = resourcePath;
  }*/
  let tempData = fs.readFileSync(path.join(filePath, fileName), 'utf8');
  return JSON.parse(tempData);
}

function createWindows() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  previewWin = new BrowserWindow({
    width: 1320,
    height: 880,
    center: true,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preview-preload.js')
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile('index.html');
  //mainWindow.webContents.openDevTools({ mode: 'detach' });
  previewWin.loadFile('preview.html');
  //previewWin.webContents.openDevTools({ mode: 'detach' });
}

function printPreview(focusedWindow) {
  let printers = {};
  for (let p of appPrinters) {
    let tmp = p.name
    printers[tmp] = { 'name': p.name, 'description': p.displayName }
  }

  focusedWindow.webContents.printToPDF(PDFoptions).then(data => {
    const pdfBase64 = data.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    const pdfObj = {
      printers: printers,
      //appPrinters: appPrinters,
      pdfData: data,
      pdfDataUrl: pdfDataUrl,
      origWin: focusedWindow.id
    }
    
    previewWin.webContents.reload()
    previewWin.webContents.on('did-finish-load', () => {
      previewWin.webContents.send('send-pdf-data', pdfObj)
      previewWin.show()
    })
  }).catch(error => {
    console.error(`Failed to generate pdf data for print preview: `, error)
  })
}