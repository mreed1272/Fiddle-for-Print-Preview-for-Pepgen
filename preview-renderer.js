let previewDiv = {};
let printObj = {};

window.electronAPI.receivePdfData((data) => {
    //console.log(`previewWin Data in:\n`, data)
    previewDiv = document.getElementById('print-window');
    preIframe = document.getElementById('pdf-viewer');
    printObj = data;

    preIframe.src = data.pdfDataUrl + '#view=FitH&toolbar=0&navpanes=0';

    //previewDiv.innerHTML = data.previewData
    loadSelect("printers", data.printers, "Microsoft Print to PDF")
    //console.log(`Full printer information:\n`, data.appPrinters)
})


function loadSelect(selectID, obj, selectItem) {
    let selElem = document.getElementById(selectID);

    //empty the select first
    selElem.options.length = 0;

    let entries = Object.keys(obj);
    //console.log(`Load Select object keys array: \n`, entries);

    for (var i = 0; i < entries.length; i++) {
        var option = document.createElement("option");
        option.text = obj[entries[i]].description;
        option.value = obj[entries[i]].name;
        selElem.add(option, i);
        //console.log(`Comparison for LoadSelect: \n`, (obj[entries[i]].name == selectItem))
        if (obj[entries[i]].name == selectItem) {
            option.setAttribute('selected', 'selected')
        }

    }
}

function sendPrint() {
    const printIframe = document.getElementById('pdf-viewer');
    const printForm = document.getElementById('print-selection');

    //create options object
    let printOptions = {
        silent: true,
        deviceName: printForm.printers.value,
        pageSize: printForm['paper-size'].value,
        copies: printForm['copies'].value,
        margins: {
            marginType: 'custom',
            top: 19,
            bottom: 19,
            left: 19,
            right: 19,
        }
    }
    //console.log(`Print options object:\n`, printOptions)

    if (printIframe && printIframe.contentWindow) {
        printIframe.contentWindow.focus()
    }
    window.electronAPI.sendToPrint({ printData: printObj, printOptions: printOptions });
}

function cancelPrint() {
    window.electronAPI.cancelPrint();
}

async function rePrint(e) {
    //console.log(`reprint event value: `, e.value)
    //console.log(`reprint-> iFrame object:\n`,preIframe);
    const printForm = e.form;
    if (e.value == 'custom' && printForm['printRange'].value == '') {
        return false;
    };

    let printOptions = {
        printBackground: printForm['backgrounds-checkbox'].checked,
        pageSize: printForm['paper-size'].value,
        landscape: false,
        pageRanges: "",
        displayHeaderFooter: false,//printForm['head-foot-checkbox'].checked
        margins: {
            top: 0.75,
            bottom: 0.75,
            left: 0.75,
            right: 0.75
        }
    }
    if (printForm['layout-group'].value == "Landscape") {
        printOptions.landscape = true;
    }

    if (printForm['range-group'].value == 'custom' && printForm['printRange'].value !== '') {
        printOptions.pageRanges = printForm['printRange'].value
    }

    //console.log(`reprint print options:\n`, printOptions);

    try {
        const result = await window.electronAPI.genPDF({ printOptions: printOptions, originalWin: printObj.origWin })
        if (result.success) {
            //console.log(`response from invoke:\n`, result.pdfObj)
            preIframe.src = result.pdfObj.pdfDataUrl + '#view=FitH&toolbar=0&navpanes=0';
            printObj.pdfData = result.pdfObj.pdfData;
            printObj.pdfDataUrl = result.pdfObj.pdfDataUrl;

        } else {
            console.error(`genPDF failed to generate PDF: ${result.error}`)
        }
    } catch (error) {
        console.error(`genPDF error: ${error.message}`);
    }

}