/**
 * "This project is based on the exportSVGtoGCODE (https://github.com/o0morgan0o/exportSVGtoGCODE) repository, a Node.js CLI tool.
 *  I have adapted and modified the code to work as a frontend website. 
 *  Credit goes to the original authors for their work on exportSVGtoGCODE."
 */

import {  XMLParser } from './xmlParser.js';
import { getRepresentation } from './getRepresentation.js';
import { svg2gcode } from './svg2gcode.js';
import SVGO from 'svgo';
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
        const svgoConfig = {
            js2svg: { indent: 2, pretty: true },
            plugins: [
                "cleanupIds",
                "removeDoctype",
                "removeXMLProcInst",
                "removeComments",
                "removeXMLNS",
                "convertStyleToAttrs",
                "collapseGroups",
                "convertEllipseToCircle",
                "convertShapeToPath",
                // "removeDimensions",
                "removeEditorsNSData",
                "removeRasterImages",
                "removeUselessDefs",
                "removeUnknownsAndDefaults",
                "moveGroupAttrsToElems",
                "removeDesc",
                "convertColors",
                "sortAttrs",
                "removeUselessStrokeAndFill",
                "removeXMLNS",
                "convertTransform",   
                "removeEmptyAttrs",
                "removeEmptyContainers" ,
                "collapseGroups",
                "cleanupNumericValues",                                                              
            ]
          }
        const { data: optimizedSvg } = SVGO.optimize(svgData, svgoConfig);
        // console.log('Op timized SVG: ', optimizedSvg)

        return new Promise((resolve, reject) => {
            let tree = new XMLParser(svgData, {})

            const treeView = tree.getTree()
            svgViewBox = treeView.viewBox ? treeView.viewBox.split(' ') : ''
      
            // console.log('[+] Getting XML representation ...', treeView)
            // tree view can be splitted in several layers
            // const treeLayers = []
            // if (tree.g && tree.g.length) {
            //     //multi export
            //     for (let i = 0; i < treeView.g.length; i++) {
            //         console.log('new layer detected, export seperately...')
            //         let layer = Object.assign({}, treeView)
            //         delete layer.g
            //         layer.g = []
            //         layer.g.push(treeView.g[i])
            //         treeLayers.push(layer)
            //     }

            //     console.log('Layers ', treeLayers)

            //     let gcodeStrings = []
            //     for (let i = 0; i < treeLayers.length; i++) {
            //         console.log(`[+] Getting XML representation on layer ${(i + 1).toString()} / ${treeLayers.length.toString()} ...`)
            //         let XMLRepresentation = getRepresentation(treeLayers[i])
            //         XMLRepresentation.viewBox = svgViewBox;

            //         console.log('[+] Converting ...')
            //         let gcodeString = svg2gcode(XMLRepresentation, this.settings)
            //         console.log(`[+] optimization ...`)
            //         gcodeString = this.removeDuplicatedLines(gcodeString)
            //         console.log('[+] Conversion done !\n ---------------------------------------------------')
            //         gcodeStrings.push(gcodeString)
            //     }
            //     resolve(gcodeStrings)
            // } else {
                // single layer
                let XMLRepresentation = getRepresentation(treeView)
                
                XMLRepresentation.viewBox = svgViewBox
                // console.log('[+] Getting XML representation ...', XMLRepresentation, 'treeView', treeView)
                console.log('[+] Converting ...')
                // console.log('[+] Getting XML representation ...', XMLRepresentation)
                let gcode = svg2gcode(XMLRepresentation, this.settings)
                console.log('[+] optimization ...')
                gcode = this.removeDuplicatedLines(gcode)
                console.log('[+] Conversion done !\n ---------------------------------------------------')
                resolve([gcode])
            // }
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
