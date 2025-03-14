import { Vec2 } from './vec2.js'
import { svgMapping } from './svgMapping.js';
import { PathParser } from './pathParser.js';
let first_run;

/** 
 *  Parse SVG Paths into an object representation
 *  Output path flattened (world coords) hash of path by color
 *  each path is a list of subpaths, each subpath is a list of verteces
 */


export const SVGReader = {

    boundarys: {},
    style: {},  // style at current parsing position
    tolerance: 0.01,     // max tollerance when tesselating curvy shapes
    parser: null,
    
    parse: function (svgstring, config) {
        first_run = true
        this.tolerance_squared = Math.pow(this.tolerance, 2);
        this.boundarys.allcolors = []  // TODO: sort by color
        this.parser = new PathParser({ tolerance : config.tolerance })
        this.parseChildren(svgstring, config.bedSize);
        first_run = false
        return this.boundarys
    },

    parseChildren: function (domNode, bedSize) {
        let dNode = first_run ? (first_run = false, domNode) : dNode;
        let parentChilds = [[dNode, {}]];
        let node = { stroke: "#FFFFFF", xformToWorld: [1, 0, 0, 1, 0, 0], viewBox: dNode.viewBox };

        for (let i = 0; i < parentChilds.length; i++) {
            let tag = parentChilds[i][0];
            let parentNode = parentChilds[i][1];
            tag.childNodes.forEach(childNode => parentChilds.push([childNode, node]))

            if (tag.tagName) {
                let node = {
                    path: [],
                    xform: [1, 0, 0, 1, 0, 0],
                    fill: parentNode.fill,
                    stroke: parentNode.stroke,
                    strokeWidth: 1,
                    viewBox: dNode.viewBox
                };
                const strokeWidth = tag.attributes[tag.attributes.length - 1].value;
                node.strokeWidth = strokeWidth ? strokeWidth : 1;

                if (tag.attributes) {
                    tag.attributes.forEach(attr => {
                        if (attr.name && attr.value && svgMapping.SVGAttributeMapping[attr.name]) {
                            svgMapping.SVGAttributeMapping[attr.name](node, attr.value);
                        }
                    })
                } 

                node.xformToWorld = this.matrixMult(parentNode.xformToWorld, node.xform);

                if (svgMapping.SVGTagMapping[tag.tagName]) {
                    svgMapping.SVGTagMapping[tag.tagName](tag, node, this.parser);
                }

                node.path.forEach(subPath => {
                    subPath.forEach((path, index) => {
                        const value = new Vec2(
                            path[0] * node.xformToWorld[0] + path[1] * node.xformToWorld[2] + node.xformToWorld[4],  // x' = path[0]*a + path[1]*c + e
                            path[0] * node.xformToWorld[1] + path[1] * node.xformToWorld[3] + node.xformToWorld[5] // y' = path[0]*b + path[1]*d + f
                        );
                        subPath[index] = value;
                    })
                    this.boundarys.allcolors.push(subPath);
                })
            }
        }
    },

    matrixMult: function (mA, mB) {
        return [mA[0] * mB[0] + mA[2] * mB[1],
        mA[1] * mB[0] + mA[3] * mB[1],
        mA[0] * mB[2] + mA[2] * mB[3],
        mA[1] * mB[2] + mA[3] * mB[3],
        mA[0] * mB[4] + mA[2] * mB[5] + mA[4],
        mA[1] * mB[4] + mA[3] * mB[5] + mA[5]]
    },

    matrixApply: function (mat, vec) {
        return [mat[0] * vec[0] + mat[2] * vec[1] + mat[4],
        mat[1] * vec[0] + mat[3] * vec[1] + mat[5]];
    },

    newPathParser: function (tolerance) {
        const config = {
            tolerance: tolerance
        }
        const parser = new PathParser({ tolerance : 0.01 })
        return parser
    }
}