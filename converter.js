/**
 * "This project is based on the exportSVGtoGCODE (https://github.com/o0morgan0o/exportSVGtoGCODE) repository, a Node.js CLI tool.
 *  I have adapted and modified the code to work as a frontend website. 
 *  Credit goes to the original authors for their work on exportSVGtoGCODE."
 */
import {  XMLParser } from './xmlParser.js';
import { getRepresentation } from './getRepresentation.js';
import { svg2gcode } from './svg2gcode.js';
import SVGO from 'svgo';

class Converter {
    constructor(Settings) {
        this.settings = {}
        this.settings.colorCommandOn4 = "\nG0 Z0 ;ON"
        this.settings.end = "\nG0 X0 Y0;end of file"

        let zOffset = (Settings && Settings.zOffset) ? Settings.zOffset : 2
        let feedRate = (Settings && Settings.feedRate) ? Settings.feedRate : 1400
        let seekRate = (Settings && Settings.seekRate) ? Settings.seekRate : 1100

        this.settings.start = `\nG0 Z${zOffset}`
        this.settings.colorCommandOff4 = `\nG0 Z${zOffset}`

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

        return new Promise((resolve, reject) => {
            let tree = new XMLParser(optimizedSvg, {})
            const treeView = tree.getTree()

            let XMLRepresentation = getRepresentation(treeView)
            XMLRepresentation.viewBox = treeView.viewBox ? treeView.viewBox.split(' ') : '';
            console.log('[+] Converting ...')

            let gcode = svg2gcode(XMLRepresentation, this.settings)
            const gcodeLines = gcode.split('\n')
            const filteredGCode = gcodeLines.filter((item, pos) =>  pos === 0 || item !== gcodeLines[pos - 1]).join('\n');
            resolve([filteredGCode])
        })
    }
}

export { Converter }