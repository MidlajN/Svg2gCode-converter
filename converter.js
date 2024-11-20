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
        const defaultSettings = {
            zOffset: 3,
            feedRate: 1400,
            seekRate: 1100,
            zValue: 10,
            tolerance: 0.01,
            minimumArea: 0,
            bedSize: null,
            pathPlanning: 'minimumTravel',
            quadrant: 1,
        };
        this.settings = { ...defaultSettings, ...Settings };

        const { zValue, zOffset } = this.settings;
        this.settings.start = `\nG0 Z${(zValue - zOffset) > 0 ? (zValue - zOffset) : '0'}`;
        this.settings.zUpCommand = `\nG0 Z${ zValue < 0 ? zValue + zOffset : zValue - zOffset }`;
        this.settings.zDownCommand = `\nG0 Z${zValue}`;
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
                "moveGroupAttrsToElems",
                "convertEllipseToCircle",
                "convertShapeToPath",
                // "removeDimensions",
                "removeEditorsNSData",
                "removeRasterImages",
                "removeUselessDefs",
                "removeUnknownsAndDefaults",
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

            let gcode = svg2gcode(XMLRepresentation, this.settings)
            const gcodeLines = gcode.split('\n')
            const filteredGCode = gcodeLines.filter((item, pos) =>  pos === 0 || item !== gcodeLines[pos - 1]).join('\n');
            resolve([filteredGCode])
        })
    }
}

export { Converter }