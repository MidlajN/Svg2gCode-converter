import { XMLparser } from './xmlParser.js';
import { getRepresentation } from './getRepresentation.js';
import { svg2gcode } from './svg2gcode';


// let settingsGCODE = {
//     inputFile: null,
//     outputFile: null,
//     colorCommandOn4: "\nG1 Z0 ;ON",
//     colorCommandOff4: "\nG1 Z{{Zoff}} ;OFF",
//     LineWithVariationIsDesactivated: true,


//     start: "\nG1 Z{{Zoff}}\n;end of initialization\n",
//     end: "\nG0 X0 Y0;end of file",
//     feedRate: 1600,
//     seekRate: 4000,



//     // put your own folder where your svg files ares
//     inputFolder: '/',
//     // put your own folder for the export gcode file
//     exportFolder: '/home/fab-dev/',

//     writeOutput: true,
//     showOutput: false,
//     useSvgo: true

// }

class Converter {
    constructor(settings) {
        this.settings = settings

    }

    async convert(svgData) {

        return new Promise((resolve, reject) => {

            let tree = XMLparser.XMLparse(svgData, { preserveAttributes: false, preserveDocumentNode: false })
            // console.log(tree)
            const treeView = tree.getTree()
            const svgViewBox = tree.getTree().viewBox.split(' ')

            console.log('IMAGSFDFAS :ASLKFJAS:FLKJ :LASKFJ :LASKFJ', tree)

            // tree view can be splitted in several layers
            const treeLayers = []
            if (treeView.g.length) {
                //multi export
                for (let i = 0; i < treeView.g.length; i++) {
                    console.log('new layer detected, export seperately...')
                    let layer = Object.assign({}, treeView)
                    delete layer.g
                    layer.g = []
                    layer.g.push(treeView.g[i])
                    treeLayers.push(layer)
                }

                let gcodeStrings = []
                for (let i = 0; i < treeLayers.length; i++) {
                    console.log(`[+] Getting XML representation on layer ${(i + 1).toString()} / ${treeLayers.length.toString()} ...`)
                    let XMLRepresentation = getRepresentation(treeLayers[i])
                    XMLRepresentation.viewBox = svgViewBox

                    // console.log('converting...', XMLRepresentation)

                    console.log('[+] Converting ...')
                    let gcodeString = svg2gcode(XMLRepresentation, this.settings)
                    process.stdout.write('GCODE \n \n \n ' + gcodeString + '\n \n \n')
                    console.log(`[+] optimization ... ${gcodeString}`)
                    gcodeString = this.removeDuplicatedLines(gcodeString)
                    console.log('[+] Conversion done !\n ---------------------------------------------------')
                    gcodeStrings.push(gcodeString)

                }
                resolve(gcodeStrings)
            } else {
                // single layer
                let XMLRepresentation = getRepresentation(treeView.g)
                XMLRepresentation.viewBox = svgViewBox
                console.log('[+] Converting ...')
                let gcode = svg2gcode(XMLRepresentation, this.settings)
                console.log('[+] optimization ...')
                gcode = this.removeDuplicatedLines(gcode)
                console.log('[+] Conversion done !\n ---------------------------------------------------')
                resolve([gcode])

            }

        })


    }


    removeDuplicatedLines(gcodestring) {
        let tmp = gcodestring.split('\n').filter((item, pos, arr) => {
            return pos === 0 || item != arr[pos - 1]
        }).join('\n')
        return tmp

    }


    writeOutputFile(outputFolder, gcodestring, indexLayer) {
        indexLayer += 1
        let file = outputFolder + this.settings.outputFile
        let count = 1
        while (fs.existsSync(file)) {
            file = outputFolder + count.toString() + '-' + this.settings.outputFile
            count++
        }

        console.log('[+] Writing Layer ' + indexLayer.toString() + ' into file ' + chalk.green(file))
        fs.writeFile(file, gcodestring, function (err) {
            if (err) throw err
        })
        console.log('[+] Layer ' + indexLayer.toString() + ' done ')

    }

    showStringifyGcode(gcodestring) {
        console.log('Stringified GCODE :\n')
        console.log(JSON.stringify(gcodestring))
        console.log('done.')
    }

}

export default Converter
