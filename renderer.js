window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    window.electronAPI.contextMenu();
});

window.electronAPI.loadMWObjects((data) => {
    //console.log('Received MWObject:', data);
    MWObject = data;
    initPage();
})

function listMWObject(obj, editKey) {
    var txtOut = "";
    let MWtype = "";
    let MWObject

    //check to see if MWObject is an array
    if (Array.isArray(obj)) {
        MWtype = obj[0];
        MWObject = obj[1];
    } else {
        MWObject = obj;
    }

    var objectItems = Object.keys(MWObject);

    txtOut = "<table class='mod-table'>";
    if (editKey == true) {
        //console.log('Edit key is true')
        txtOut += "<thead><tr><th>Modification Name</th><th>Abbreviation</th><th>Formula</th><th>Edit</th> </tr></thead>";
        txtOut += "<tbody>"
        for (var i = 0; i < objectItems.length; i++) {

            if (MWObject[objectItems[i]].hidden == false) {
                txtOut += `<tr><td>${MWObject[objectItems[i]].text}</td>`;
                txtOut += `<td>${MWObject[objectItems[i]].value}</td>`;
                txtOut += `<td>${printFormula(MWObject[objectItems[i]].formula)}</td>`;
            }

        }
    } else {
        //console.log('Edit key is false')
        txtOut += "<thead><tr><th>Modification Name</th><th>Abbreviation</th><th>Formula</th> </tr></thead>";
        txtOut += "<tbody>"
        for (var i = 0; i < objectItems.length; i++) {
            //console.log(MWObject[objectItems[i]].hidden)
            if (MWObject[objectItems[i]].hidden == false) {
                txtOut += `<tr><td>${MWObject[objectItems[i]].text}</td>`;
                txtOut += `<td>${MWObject[objectItems[i]].value}</td>`;
                txtOut += `<td>${printFormula(MWObject[objectItems[i]].formula)}</td>`;
                //txtOut += `<td>${MWObject[1][objectItems[i]].hidden}</td></tr>`;
            }

        }
    }
    txtOut += "</tbody></table>";

    return txtOut;
}

function printFormula(formulaObj) {
    let formulaTxt = "";

    //check to see if an object
    if (typeof formulaObj == "object") {
        let elem = Object.keys(formulaObj);
        if (elem[0] == "dna") {
            let dnaElem = Object.keys(formulaObj.dna);
            let rnaElem = Object.keys(formulaObj.rna);

            formulaTxt += "DNA: ";
            for (var i = 0; i < dnaElem.length; i++) {
                formulaTxt += `${dnaElem[i]}<sub>${formulaObj.dna[dnaElem[i]]}</sub>`;
            }
            if (rnaElem.length > 0) {
                formulaTxt += "<br>RNA: ";
                for (var i = 0; i < rnaElem.length; i++) {
                    formulaTxt += `${rnaElem[i]}<sub>${formulaObj.rna[rnaElem[i]]}</sub>`;
                }
            }
        } else {
            for (var i = 0; i < elem.length; i++) {
                formulaTxt += `${elem[i]}<sub>${formulaObj[elem[i]]}</sub>`
            }
        }

    } else {
        console.log("printFormula error: Not an object");
        return -1;
    }

    return formulaTxt;
}

function initPage() {
    //console.log("Starting Init")
    const ElemDiv = document.getElementById('Elements');
    const AADiv = document.getElementById('AA-Mods');
    const PepTermDiv = document.getElementById('PepTermMods');
    const NADiv = document.getElementById('NA-Mods');
    const NATermDiv = document.getElementById('NATermMods');
    let txtOut = "";

    //Hide the divs
    ShowDiv(ElemDiv);
    ShowDiv(AADiv);
    ShowDiv(PepTermDiv);
    ShowDiv(NADiv);
    ShowDiv(NATermDiv);

    //Elements
    txtOut = "<h4>Elements</h4>";
    txtOut += listElements(MWObject.Elements, false);
    ElemDiv.innerHTML = txtOut;

    //Amino Acids Mods
    txtOut = "<h4>Amino Acid Modifications</h4>";
    txtOut += listMWObject(MWObject.modifiedAA, false);
    AADiv.innerHTML = txtOut;

    //Nucleic Acids Mods
    txtOut = "<h4>Oligonucleotide Modifications</h4>";
    txtOut += listMWObject(MWObject.nucMods, false);
    NADiv.innerHTML = txtOut;

    //Peptde Term Mods
    txtOut = "<h4>Peptide N-terminal Modifications</h4>";
    txtOut += listMWObject(MWObject.NtermMod, false);
    txtOut += "<h4>Peptide C-terminal Modifications</h4>";
    txtOut += listMWObject(MWObject.CtermMod, false);
    PepTermDiv.innerHTML = txtOut;

    //Nuc Term Mods
    txtOut = "<h4>Oligonucleotide 5' Modifications</h4>";
    txtOut += listMWObject(MWObject.FprimeMods, false);
    txtOut += "<h4>Oligonucleotide 3' Modifications</h4>";
    txtOut += listMWObject(MWObject.TprimeMods, false);
    NATermDiv.innerHTML = txtOut;
}

function ShowDiv(arg) {
    if (typeof arg == "string") {
        elem = document.getElementById(arg);
    } else {
        elem = arg;
    }

    elem.style.display = (getComputedStyle(elem).display == 'block' ? 'none' : 'block')
}

function listElements(elemObj, editKey) {
    var txtOut = "";
    txtOut = "<table class='mod-table'><thead><tr><th>Element Name<br />(symbol)</th><th>Monoisotopic<br />Mass</th><th>Average</br />Mass</th>";
    if (editKey == true) {
        txtOut += `<th>Edit</th></tr></thead><tbody>`
    } else {
        txtOut += "</tr></thead><tbody>";
    };
    for (var elem in elemObj) {
        txtOut += `<tr><td>${elemObj[elem].name} (${elem})</td><td>${elemObj[elem].mono.toFixed(6)}</td><td>${elemObj[elem].avg.toFixed(6)}</td>`
        if (editKey == true) {
            txtOut += `<td>X</td></tr>`;
        } else {
            txtOut += "</tr>";
        };
    }
    txtOut += "</tbody></table>";

    return txtOut;
}
