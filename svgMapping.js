import { getAttribute } from "./xmlFunctions";
import { PathParser } from './pathParser.js';

const pathParser = new PathParser();
export const svgMapping = {
    SVGAttributeMapping: {
        DEG_TO_RAD: Math.PI / 180,
        RAD_TO_DEG: 180 / Math.PI,

        id: (node, val) =>  node.id = val,

        // http://www.w3.org/TR/SVG11/coords.html#EstablishingANewUserSpace
        transform: function (node, val) {
            var xforms = [];

            var transforms = val.match(/[a-z]+\s*\([^)]*\)/ig)
            for (var i = 0; i < transforms.length; i++) {
                const [xformKind, paramsTemp] = transforms[i].split(/\(|\)/);
                let params = paramsTemp.split(/[\s,]+/).map(parseFloat)

                // double check params
                for (var j = 0; j < params.length; j++) {
                    if (isNaN(params[j])) {
                        ('warning', 'transform skipped; contains non-numbers');
                        continue  // skip this transform
                    }
                }

                // translate
                if (xformKind == 'translate') {
                    if (params.length > 2) {
                        throw new Error('translate skipped; invalid num of params');
                    }
                    const [x, y] = params.length === 1 ? [params[0], params[0]] : params;
                    xforms.push([1, 0, 0, 1, x, y])

                // rotate
                } else if (xformKind == 'rotate') {
                    if (params.length == 3) {
                        var angle = params[0] * this.DEG_TO_RAD
                        xforms.push([1, 0, 0, 1, params[1], params[2]])
                        xforms.push([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0])
                        xforms.push([1, 0, 0, 1, -params[1], -params[2]])
                    } else if (params.length == 1) {
                        var angle = params[0] * this.DEG_TO_RAD
                        xforms.push([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0])
                    } else {
                        throw new Error('rotate skipped; invalid num of params');
                    }
                    //scale
                } else if (xformKind == 'scale') {
                    if (params.length == 1) {
                        xforms.push([params[0], 0, 0, params[0], 0, 0])
                    } else if (params.length == 2) {
                        xforms.push([params[0], 0, 0, params[1], 0, 0])
                    } else {
                        throw new Error('scale skipped; invalid num of params');
                    }
                    // matrix
                } else if (xformKind == 'matrix') {
                    if (params.length == 6) {
                        xforms.push(params)
                    }
                    // skewX
                } else if (xformKind == 'skewX') {
                    if (params.length == 1) {
                        var angle = params[0] * this.DEG_TO_RAD
                        xforms.push([1, 0, Math.tan(angle), 1, 0, 0])
                    } else {
                        throw new Error('skewX skipped; invalid num of params');
                    }
                    // skewY
                } else if (xformKind == 'skewY') {
                    if (params.length == 1) {
                        var angle = params[0] * this.DEG_TO_RAD
                        xforms.push([1, Math.tan(angle), 0, 1, 0, 0])
                    } else {
                        throw new Error('skewY skipped; invalid num of params');
                    }
                }
            }

            //calculate combined transformation matrix
            let xform_combined = [1, 0, 0, 1, 0, 0]
            for (var i = 0; i < xforms.length; i++) {
                xform_combined = this.matrixMult(xform_combined, xforms[i])
            }

            // assign
            node.xform = xform_combined
        },

        /**
         * Parses style attribute
         * eg: <rect x="200" y="100" width="600" height="300" style="fill: red; stroke: blue; stroke-width: 3"/>
         *     
         * @param {object} node
         * @param {string} val style attribute value
         */
        style: (node, val) => {
            const styles = val.split(';');
            styles.forEach(style => {
                const [key, value] = style.split(':').map(str => str.trim());
                if (this[key]) this[key](node, value);
            })
        },

        // Presentations Attributes     http://www.w3.org/TR/SVG11/styling.html#UsingPresentationAttributes
        opacity: (node, val) => node.opacity = parseFloat(val),

        display: (node, val) => node.display = val,

        visibility: (node, val) => node.visibility = val,

        fill: function (node, val) { node.fill = this.__parseColor(val, node.color); },

        stroke: function (node, val) { node.stroke = this.__parseColor(val, node.color) },

        color: function (node, val) {
            if (val == 'inherit') return
            node.color = this.__parseColor(val, node.color)
        },

        'fill-opacity': (node, val) => node.fillOpacity = Math.min(1, Math.max(0, parseFloat(val))),

        'stroke-opacity': (node, val) => node.strokeOpacity = Math.min(1, Math.max(0, parseFloat(val))),

        __parseColor: function (val, currentColor) {
            if (val.charAt(0) === '#' && val.length === 4) {
                const hexCode = val.slice(1).split('').map(char => char + char).join('');
                return hexCode.match(/../g).map(hex => parseInt(hex, 16));
                
            } else if (val.startsWith('rgb(') || val.startsWith('rgba(')){
                const isRGB = val.startsWith('rgb(');
                const rgbValues = val.slice(isRGB ? 4 : 5, -1).split(',');
                const parsedRGB = rgbValues.map((value, index) => {
                    const trimmedValue = value.trim();
                    return trimmedValue.endsWith('%') ?
                        Math.round(parseFloat(trimmedValue.slice(0, -1)) * (isRGB ? 2.55 : 0.01)) :
                        index === 3 ? Math.max(0, Math.min(1, parseFloat(trimmedValue))) : parseInt(trimmedValue);
                })
                return parsedRGB;

            } else if (val.startsWith('url(')) {
                return [0, 0, 0]
                
            } else if (val === 'currentColor' || val === 'none' || val === 'freeze' || val === 'remove') {
                return val === 'currentColor' ? currentColor : val === 'none' ? 'none' : null;

            } else {
                return val;
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
    },

    // recognized svg elements
    SVGTagMapping: {
        svg: function (tag, node) {
            node.fill = 'black'
            node.stroke = 'none'
        },

        // http://www.w3.org/TR/SVG11/shapes.html#PolygonElement
        polygon: function (tag, node) {
            const d = this.__getPolyPath(tag).concat('z')
            pathParser.parse(d, node);
        },

        // http://www.w3.org/TR/SVG11/shapes.html#PolylineElement
        polyline: function (tag, node) {
            const d = this.__getPolyPath(tag)
            pathParser.parse(d, node);
        },

        __getPolyPath: function (tag) {
            let points = getAttribute(tag, "points").toString().split(/[\s,]+/).map(parseFloat);
            if (points.length % 2 !== 0) {
                throw new Error("in __getPolyPath: odd number of verteces");
            }
            const d = ['M', ...points]
            return d;
        },

        // http://www.w3.org/TR/SVG11/shapes.html#RectElement
        rect: function (tag, node) {
            let width = getAttribute(tag, 'width').includes('%') ? node.viewBox[2] : width;
            let height = getAttribute(tag, 'height').includes('%') ? node.viewBox[3] : height;
            let w = this.parseUnit(width) || 0;
            let h = this.parseUnit(height) || 0;
            let x = this.parseUnit(getAttribute(tag, 'x')) || 0;
            let y = this.parseUnit(getAttribute(tag, 'y')) || 0;
            let rx = this.parseUnit(getAttribute(tag, 'rx')) || 0;
            let ry = this.parseUnit(getAttribute(tag, 'ry')) || null;

            if (rx == null || ry == null) { // no rounded corners
                const d = ['M', x, y, 'h', w, 'v', h, 'h', -w, 'z'];
                pathParser.parse(d, node);

            } else { // rounded corners                       
                if ('ry' == null) ry = rx;
                if (rx < 0.0) rx *= -1; 
                if (ry < 0.0) ry *= -1; 

                d = [
                    'M', x + rx, y,
                    'h', w - 2 * rx,
                    'c', rx, 0.0, rx, ry, rx, ry,
                    'v', h - ry,
                    'c', '0.0', ry, -rx, ry, -rx, ry,
                    'h', -w + 2 * rx,
                    'c', -rx, '0.0', -rx, -ry, -rx, -ry,
                    'v', -h + ry,
                    'c', '0.0', '0.0', '0.0', -ry, rx, -ry,
                    'z'
                ];
                pathParser.parse(d, node);
            }
        },

        line: function (tag, node) {
            let x1 = this.parseUnit(getAttribute(tag, 'x1')) || 0
            let y1 = this.parseUnit(getAttribute(tag, 'y1')) || 0
            let x2 = this.parseUnit(getAttribute(tag, 'x2')) || 0
            let y2 = this.parseUnit(getAttribute(tag, 'y2')) || 0
            const d = ['M', x1, y1, 'L', x2, y2]
            pathParser.parse(d, node);
        },


        circle: function (tag, node) {
            let r = this.parseUnit(getAttribute(tag, 'r'))
            let cx = this.parseUnit(getAttribute(tag, 'cx')) || 0
            let cy = this.parseUnit(getAttribute(tag, 'cy')) || 0

            if (r > 0.0) {
                const d = [ 
                    'M', cx - r, cy,
                    'A', r, r, 0, 0, 0, cx, cy + r,
                    'A', r, r, 0, 0, 0, cx + r, cy,
                    'A', r, r, 0, 0, 0, cx, cy - r,
                    'A', r, r, 0, 0, 0, cx - r, cy,
                    'Z'
                ];
                pathParser.parse(d, node);
            }
        },


        ellipse: function (tag, node) {
            let rx = this.parseUnit(getAttribute(tag, 'rx'))
            let ry = this.parseUnit(getAttribute(tag, 'ry'))
            let cx = this.parseUnit(getAttribute(tag, 'cx')) || 0
            let cy = this.parseUnit(getAttribute(tag, 'cy')) || 0

            if (rx > 0.0 && ry > 0.0) {
                const d = [
                    'M', cx - rx, cy,
                    'A', rx, ry, 0, 0, 0, cx, cy + ry,
                    'A', rx, ry, 0, 0, 0, cx + rx, cy,
                    'A', rx, ry, 0, 0, 0, cx, cy - ry,
                    'A', rx, ry, 0, 0, 0, cx - rx, cy,
                    'Z'
                ];
                pathParser.parse(d, node);
            }
        },

        // http://www.w3.org/TR/SVG11/paths.html
        path: function (tag, node) {
            let d = getAttribute(tag, "d")
            pathParser.parse(d, node);
        },

        parseUnit  : function (val) {
            if (!val) return null;

            let value = val.toLowerCase();
            const unitMultipliers = {
                'cm': 37.79527559,
                'mm': 3.779527559,
                'in': 96,
                'pt': 1.25,
                'pc': 15
            };
            const match = value.match(/[a-z]+$/i);
            const unit = match ? unitMultipliers[match[0]] || 1 : 1;
            return parseFloat(value) * unit;
        },
    },
}