/**
 * "This project is based on the exportSVGtoGCODE (https://github.com/o0morgan0o/exportSVGtoGCODE) repository, a Node.js CLI tool.
 *  I have adapted and modified the code to work as a frontend website. 
 *  Credit goes to the original authors for their work on exportSVGtoGCODE."
 */

import { XMLparser } from './xmlParser.js';
import { getRepresentation } from './getRepresentation.js';
import { svg2gcode } from './svg2gcode.js';
let svgViewBox;
class Converter {
    constructor(Settings) {
        this.settings = {}
        this.settings.colorCommandOn4 = "\nG0 Z0 ;ON"
        this.settings.end = "\nG0 X0 Y0;end of file"

        let zOffset = (Settings && Settings.zOffset) ? Settings.zOffset : 2
        let feedRate = (Settings && Settings.feedRate) ? Settings.feedRate : 1400
        let seekRate = (Settings && Settings.seekRate) ? Settings.seekRate : 1100

        this.settings.start = `\nG0 Z${zOffset}`
        this.settings.colorCommandOff4 = `\nG0 Z${zOffset} ;OFF`

        this.settings.feedRate = feedRate
        this.settings.seekRate = seekRate
    }

    async convert(svgData) {

        return new Promise((resolve, reject) => {
            let tree = XMLparser.XMLparse(svgData, { preserveAttributes: false, preserveDocumentNode: false })
            const treeView = tree.getTree()
            if (tree.getTree().viewBox){
                svgViewBox = tree.getTree().viewBox.split(' ')
            } else {
                svgViewBox = ''
            }           

            // tree view can be splitted in several layers
            const treeLayers = []
            if (tree.g && tree.g.length) {
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
                    console.log(`[+] optimization ... ${gcodeString}`)
                    gcodeString = this.removeDuplicatedLines(gcodeString)
                    console.log('[+] Conversion done !\n ---------------------------------------------------')
                    gcodeStrings.push(gcodeString)
                }
                resolve(gcodeStrings)
            } else {
                // single layer
                let XMLRepresentation = getRepresentation(treeView)
                // console.log('[+] Getting XML representation ...', XMLRepresentation, 'treeView', treeView)
                XMLRepresentation.viewBox = svgViewBox
                console.log('[+] Converting ...')
                // console.log('[+] Getting XML representation ...', XMLRepresentation)
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
}

export { Converter }
