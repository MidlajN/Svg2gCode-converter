import { Vec2 } from './vec2.js'
import { svgMapping } from './svgMapping.js';

let first_run;
export const SVGReader = {

    boundarys: {},
    // output path flattened (world coords)
    // hash of path by color
    // each path is a list of subpaths
    // each subpath is a list of verteces
    style: {},  // style at current parsing position
    tolerance: 0.01,     // max tollerance when tesselating curvy shapes
    
    parse: function (svgstring, config) {
        first_run = true
        this.tolerance_squared = Math.pow(this.tolerance, 2);
        this.boundarys.allcolors = []  // TODO: sort by color
        this.parseChildren(svgstring)
        first_run = false
        return this.boundarys
    },



    parseChildren: function (domNode) {
        let dNode = first_run ? (first_run = false, domNode) : dNode;
        let parentChilds = [[dNode, {}]];
        let node = { stroke: "#FFFFFF", xformToWorld: [1, 0, 0, 1, 0, 0] };

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
                    strokeWidth: 1
                };
                const strokeWidth = tag.attributes[tag.attributes.length - 1].value;
                node.strokeWidth = strokeWidth ? strokeWidth : 1;

                if (tag.attributes) {
                    tag.attributes.forEach(attr => {
                        if (attr.name && attr.value && svgMapping.SVGAttributeMapping[attr.name]) {
                            console.log(attr.name, attr.value)
                            svgMapping.SVGAttributeMapping[attr.name](this, node, attr.value);
                        }
                    })
                } 

                node.xformToWorld = this.matrixMult(parentNode.xformToWorld, node.xform);

                if (svgMapping.SVGTagMapping[tag.tagName]) {
                    console.log(tag)
                    svgMapping.SVGTagMapping[tag.tagName](this, tag, node);
                }

                node.path.forEach(subPath => {
                    subPath.forEach((path, index) => {
                        let temp = this.matrixApply(node.xformToWorld, path);
                        subPath[index] = new Vec2(temp[0], temp[1]);
                    })
                    this.boundarys.allcolors.push(subPath);
                })
            }
        }

    },

    //////////////////////////////////////////////////////////////////////////
    // handle path data
    // this is where all the geometry gets converted for the boundarys output

    addPath: function (d, node) {
        // http://www.w3.org/TR/SVG11/paths.html#PathData

        var tolerance2 = this.tolerance_squared;
        var totalMaxScale = this.matrixGetScale(node.xformToWorld);

        // console.log("totalMaxScale : " + tolerance2);
        if (totalMaxScale !== 0) {
            // adjust for possible transforms
            tolerance2 /= Math.pow(totalMaxScale, 2);
            // $().uxmessage('notice', "tolerance2: " + tolerance2.toString());
        }

        if (typeof d == 'string') {
            // parse path string
            d = d.match(/([A-Za-z]|-?[0-9]+\.?[0-9]*(?:e-?[0-9]*)?)/g);
            for (var i = 0; i < d.length; i++) {
                var num = parseFloat(d[i]);
                if (!isNaN(num)) {
                    d[i] = num;
                }
            }
        }
        //$().uxmessage('notice', "d: " + d.toString());

        function nextIsNum() {
            return (d.length > 0) && (typeof (d[0]) === 'number');
        }

        function getNext() {
            if (d.length > 0) {
                return d.shift();  // pop first item
            } else {
                throw new Error("in addPath: not enough parameters");
                return null;
            }
        }

        var x = 0;
        var y = 0;
        var cmdPrev = '';
        var xPrevCp;
        var yPrevCp;
        var subpath = [];

        while (d.length > 0) {
            // console.log('d', d)
            var cmd = getNext();
            // process.stdout.clearLine()
            // process.stdout.cursorTo(0)
            // process.stdout.write("in node : " + d.length + " point")
            switch (cmd) {
                case 'M':  // moveto absolute
                    // start new subpath
                    if (subpath.length > 0) {
                        node.path.push(subpath);
                        subpath = [];
                    }
                    var implicitVerts = 0
                    while (nextIsNum()) {
                        x = getNext();
                        y = getNext();
                        subpath.push([x, y]);
                        implicitVerts += 1;
                    }
                    break;
                case 'm':  //moveto relative
                    // start new subpath
                    if (subpath.length > 0) {
                        node.path.push(subpath);
                        subpath = [];
                    }
                    if (cmdPrev == '') {
                        // first treated absolute
                        x = getNext();
                        y = getNext();
                        subpath.push([x, y]);
                    }
                    var implicitVerts = 0
                    while (nextIsNum()) {
                        // subsequent treated realtive
                        x += getNext();
                        y += getNext();
                        subpath.push([x, y]);
                        implicitVerts += 1;
                    }
                    break;
                case 'Z':  // closepath
                case 'z':  // closepath
                    // loop and finalize subpath
                    if (subpath.length > 0) {
                        subpath.push(subpath[0]);  // close
                        node.path.push(subpath);
                        x = subpath[subpath.length - 1][0];
                        y = subpath[subpath.length - 1][1];
                        subpath = [];
                    }
                    break;
                case 'L':  // lineto absolute
                    while (nextIsNum()) {
                        x = getNext();
                        y = getNext();
                        subpath.push([x, y]);
                    }
                    break;
                case 'l':  // lineto relative
                    while (nextIsNum()) {
                        x += getNext();
                        y += getNext();
                        subpath.push([x, y]);
                    }
                    break;
                case 'H':  // lineto horizontal absolute
                    while (nextIsNum()) {
                        x = getNext();
                        subpath.push([x, y]);
                    }
                    break;
                case 'h':  // lineto horizontal relative
                    while (nextIsNum()) {
                        x += getNext();
                        subpath.push([x, y]);
                    }
                    break;
                case 'V':  // lineto vertical absolute
                    while (nextIsNum()) {
                        y = getNext()
                        subpath.push([x, y])
                    }
                    break;
                case 'v':  // lineto vertical realtive
                    while (nextIsNum()) {
                        y += getNext();
                        subpath.push([x, y]);
                    }
                    break;
                case 'C':  // curveto cubic absolute
                    while (nextIsNum()) {
                        var x2 = getNext();
                        var y2 = getNext();
                        var x3 = getNext();
                        var y3 = getNext();
                        var x4 = getNext();
                        var y4 = getNext();
                        subpath.push([x, y]);
                        this.addCubicBezier(subpath, x, y, x2, y2, x3, y3, x4, y4, 0, tolerance2);
                        subpath.push([x4, y4]);
                        x = x4;
                        y = y4;
                        xPrevCp = x3;
                        yPrevCp = y3;
                    }
                    break;
                case 'c':  // curveto cubic relative
                    while (nextIsNum()) {
                        var x2 = x + getNext();
                        var y2 = y + getNext();
                        var x3 = x + getNext();
                        var y3 = y + getNext();
                        var x4 = x + getNext();
                        var y4 = y + getNext();
                        subpath.push([x, y]);
                        this.addCubicBezier(subpath, x, y, x2, y2, x3, y3, x4, y4, 0, tolerance2);
                        subpath.push([x4, y4]);
                        x = x4;
                        y = y4;
                        xPrevCp = x3;
                        yPrevCp = y3;
                    }
                    break;
                case 'S':  // curveto cubic absolute shorthand
                    while (nextIsNum()) {
                        var x2;
                        var y2;
                        if (cmdPrev.match(/[CcSs]/)) {
                            x2 = x - (xPrevCp - x);
                            y2 = y - (yPrevCp - y);
                        } else {
                            x2 = x;
                            y2 = y;
                        }
                        var x3 = getNext();
                        var y3 = getNext();
                        var x4 = getNext();
                        var y4 = getNext();
                        subpath.push([x, y]);
                        this.addCubicBezier(subpath, x, y, x2, y2, x3, y3, x4, y4, 0, tolerance2);
                        subpath.push([x4, y4]);
                        x = x4;
                        y = y4;
                        xPrevCp = x3;
                        yPrevCp = y3;
                    }
                    break;
                case 's':  // curveto cubic relative shorthand
                    while (nextIsNum()) {
                        var x2;
                        var y2;
                        if (cmdPrev.match(/[CcSs]/)) {
                            x2 = x - (xPrevCp - x);
                            y2 = y - (yPrevCp - y);
                        } else {
                            x2 = x;
                            y2 = y;
                        }
                        var x3 = x + getNext();
                        var y3 = y + getNext();
                        var x4 = x + getNext();
                        var y4 = y + getNext();
                        subpath.push([x, y]);
                        this.addCubicBezier(subpath, x, y, x2, y2, x3, y3, x4, y4, 0, tolerance2);
                        subpath.push([x4, y4]);
                        x = x4;
                        y = y4;
                        xPrevCp = x3;
                        yPrevCp = y3;
                    }
                    break;
                case 'Q':  // curveto quadratic absolute
                    while (nextIsNum()) {
                        var x2 = getNext();
                        var y2 = getNext();
                        var x3 = getNext();
                        var y3 = getNext();
                        subpath.push([x, y]);
                        this.addQuadraticBezier(subpath, x, y, x2, y2, x3, y3, 0, tolerance2);
                        subpath.push([x3, y3]);
                        x = x3;
                        y = y3;
                    }
                    break;
                case 'q':  // curveto quadratic relative
                    while (nextIsNum()) {
                        var x2 = x + getNext();
                        var y2 = y + getNext();
                        var x3 = x + getNext();
                        var y3 = y + getNext();
                        subpath.push([x, y]);
                        this.addQuadraticBezier(subpath, x, y, x2, y2, x3, y3, 0, tolerance2);
                        subpath.push([x3, y3]);
                        x = x3;
                        y = y3;
                    }
                    break;
                case 'T':  // curveto quadratic absolute shorthand
                    while (nextIsNum()) {
                        var x2;
                        var y2;
                        if (cmdPrev.match(/[QqTt]/)) {
                            x2 = x - (xPrevCp - x);
                            y2 = y - (yPrevCp - y);
                        } else {
                            x2 = x;
                            y2 = y;
                        }
                        var x3 = getNext();
                        var y3 = getNext();
                        subpath.push([x, y]);
                        this.addQuadraticBezier(subpath, x, y, x2, y2, x3, y3, 0, tolerance2);
                        subpath.push([x3, y3]);
                        x = x3;
                        y = y3;
                        xPrevCp = x2;
                        yPrevCp = y2;
                    }
                    break;
                case 't':  // curveto quadratic relative shorthand
                    while (nextIsNum()) {
                        var x2;
                        var y2;
                        if (cmdPrev.match(/[QqTt]/)) {
                            x2 = x - (xPrevCp - x);
                            y2 = y - (yPrevCp - y);
                        } else {
                            x2 = x;
                            y2 = y;
                        }
                        var x3 = x + getNext();
                        var y3 = y + getNext();
                        subpath.push([x, y]);
                        this.addQuadraticBezier(subpath, x, y, x2, y2, x3, y3, 0, tolerance2);
                        subpath.push([x3, y3]);
                        x = x3;
                        y = y3;
                        xPrevCp = x2;
                        yPrevCp = y2;
                    }
                    break;
                case 'A':  // eliptical arc absolute
                    while (nextIsNum()) {
                        var rx = getNext();
                        var ry = getNext();
                        var xrot = getNext();
                        var large = getNext();
                        var sweep = getNext();
                        var x2 = getNext();
                        var y2 = getNext();
                        this.addArc(subpath, x, y, rx, ry, xrot, large, sweep, x2, y2, tolerance2);
                        x = x2
                        y = y2
                    }
                    break;
                case 'a':  // elliptical arc relative
                    while (nextIsNum()) {
                        var rx = getNext();
                        var ry = getNext();
                        var xrot = getNext();
                        var large = getNext();
                        var sweep = getNext();
                        var x2 = x + getNext();
                        var y2 = y + getNext();
                        this.addArc(subpath, x, y, rx, ry, xrot, large, sweep, x2, y2, tolerance2);
                        x = x2
                        y = y2
                    }
                    break
            }
            cmdPrev = cmd;
            // console.log('subpath : ', subpath, 'cmd : ', cmd, 'x : ', x, 'y : ', y)
        }
        // finalize subpath
        if (subpath.length > 0) {
            node.path.push(subpath);
            // console.log('node.path : ', node.path)
            subpath = [];
        }
    },


    addCubicBezier: function (subpath, x1, y1, x2, y2, x3, y3, x4, y4, level, tolerance2) {
        // for details see:
        // http://www.antigrain.com/research/adaptive_bezier/index.html
        // based on DeCasteljau Algorithm
        // The reason we use a subdivision algo over an incremental one
        // is we want to have control over the deviation to the curve.
        // This mean we subdivide more and have more curve points in
        // curvy areas and less in flatter areas of the curve.

        if (level > 18) {
            // protect from deep recursion cases
            // max 2**18 = 262144 segments
            return
        }

        // Calculate all the mid-points of the line segments
        var x12 = (x1 + x2) / 2.0
        var y12 = (y1 + y2) / 2.0
        var x23 = (x2 + x3) / 2.0
        var y23 = (y2 + y3) / 2.0
        var x34 = (x3 + x4) / 2.0
        var y34 = (y3 + y4) / 2.0
        var x123 = (x12 + x23) / 2.0
        var y123 = (y12 + y23) / 2.0
        var x234 = (x23 + x34) / 2.0
        var y234 = (y23 + y34) / 2.0
        var x1234 = (x123 + x234) / 2.0
        var y1234 = (y123 + y234) / 2.0

        // Try to approximate the full cubic curve by a single straight line
        var dx = x4 - x1
        var dy = y4 - y1

        var d2 = Math.abs(((x2 - x4) * dy - (y2 - y4) * dx))
        var d3 = Math.abs(((x3 - x4) * dy - (y3 - y4) * dx))

        if (Math.pow(d2 + d3, 2) < 5.0 * tolerance2 * (dx * dx + dy * dy)) {
            // added factor of 5.0 to match circle resolution
            subpath.push([x1234, y1234])
            return
        }

        // Continue subdivision
        this.addCubicBezier(subpath, x1, y1, x12, y12, x123, y123, x1234, y1234, level + 1, tolerance2);
        this.addCubicBezier(subpath, x1234, y1234, x234, y234, x34, y34, x4, y4, level + 1, tolerance2);

        
    },


    addQuadraticBezier: function (subpath, x1, y1, x2, y2, x3, y3, level, tolerance2) {
        if (level > 18) {
            // protect from deep recursion cases
            // max 2**18 = 262144 segments
            return
        }

        // Calculate all the mid-points of the line segments
        var x12 = (x1 + x2) / 2.0
        var y12 = (y1 + y2) / 2.0
        var x23 = (x2 + x3) / 2.0
        var y23 = (y2 + y3) / 2.0
        var x123 = (x12 + x23) / 2.0
        var y123 = (y12 + y23) / 2.0

        var dx = x3 - x1
        var dy = y3 - y1
        var d = Math.abs(((x2 - x3) * dy - (y2 - y3) * dx))

        if (d * d <= 5.0 * tolerance2 * (dx * dx + dy * dy)) {
            // added factor of 5.0 to match circle resolution
            subpath.push([x123, y123])
            return
        }

        // Continue subdivision
        this.addQuadraticBezier(subpath, x1, y1, x12, y12, x123, y123, level + 1, tolerance2)
        this.addQuadraticBezier(subpath, x123, y123, x23, y23, x3, y3, level + 1, tolerance2)
    },


    addArc: function (subpath, x1, y1, rx, ry, phi, large_arc, sweep, x2, y2, tolerance2) {
        // Implemented based on the SVG implementation notes
        // plus some recursive sugar for incrementally refining the
        // arc resolution until the requested tolerance is met.
        // http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
        var cp = Math.cos(phi);
        var sp = Math.sin(phi);
        var dx = 0.5 * (x1 - x2);
        var dy = 0.5 * (y1 - y2);
        var x_ = cp * dx + sp * dy;
        var y_ = -sp * dx + cp * dy;
        var r2 = (Math.pow(rx * ry, 2) - Math.pow(rx * y_, 2) - Math.pow(ry * x_, 2)) /
            (Math.pow(rx * y_, 2) + Math.pow(ry * x_, 2));
        if (r2 < 0) { r2 = 0; }
        var r = Math.sqrt(r2);
        if (large_arc == sweep) { r = -r; }
        var cx_ = r * rx * y_ / ry;
        var cy_ = -r * ry * x_ / rx;
        var cx = cp * cx_ - sp * cy_ + 0.5 * (x1 + x2);
        var cy = sp * cx_ + cp * cy_ + 0.5 * (y1 + y2);

        function angle(u, v) {
            var a = Math.acos((u[0] * v[0] + u[1] * v[1]) /
                Math.sqrt((Math.pow(u[0], 2) + Math.pow(u[1], 2)) *
                    (Math.pow(v[0], 2) + Math.pow(v[1], 2))));
            var sgn = -1;
            if (u[0] * v[1] > u[1] * v[0]) { sgn = 1; }
            return sgn * a;
        }

        var psi = angle([1, 0], [(x_ - cx_) / rx, (y_ - cy_) / ry]);
        var delta = angle([(x_ - cx_) / rx, (y_ - cy_) / ry], [(-x_ - cx_) / rx, (-y_ - cy_) / ry]);
        if (sweep && delta < 0) { delta += Math.PI * 2; }
        if (!sweep && delta > 0) { delta -= Math.PI * 2; }

        function getVertex(pct) {
            var theta = psi + delta * pct;
            var ct = Math.cos(theta);
            var st = Math.sin(theta);
            return [cp * rx * ct - sp * ry * st + cx, sp * rx * ct + cp * ry * st + cy];
        }

        // let the recursive fun begin
        //
        function recursiveArc(parser, t1, t2, c1, c5, level, tolerance2) {
            if (level > 18) {
                // protect from deep recursion cases
                // max 2**18 = 262144 segments
                return
            }
            var tRange = t2 - t1
            var tHalf = t1 + 0.5 * tRange;
            var c2 = getVertex(t1 + 0.25 * tRange);
            var c3 = getVertex(tHalf);
            var c4 = getVertex(t1 + 0.75 * tRange);
            if (parser.vertexDistanceSquared(c2, parser.vertexMiddle(c1, c3)) > tolerance2) {
                recursiveArc(parser, t1, tHalf, c1, c3, level + 1, tolerance2);
            }
            subpath.push(c3);
            if (parser.vertexDistanceSquared(c4, parser.vertexMiddle(c3, c5)) > tolerance2) {
                recursiveArc(parser, tHalf, t2, c3, c5, level + 1, tolerance2);
            }
        }

        var t1Init = 0.0;
        var t2Init = 1.0;
        var c1Init = getVertex(t1Init);
        var c5Init = getVertex(t2Init);
        subpath.push(c1Init);
        recursiveArc(this, t1Init, t2Init, c1Init, c5Init, 0, tolerance2);
        subpath.push(c5Init);
    },


    // handle path data
    //////////////////////////////////////////////////////////////////////////

    parseUnit: function (val) {
        if (val == null) {
            return null
        } else {
            val = val.toLowerCase();
            // assume 96dpi
            // const unit = val.replace(/\d|-/g, "")
            // console.log('unit: ' + unit)

            var multiplier = 1.0
            if (val.search(/cm$/i) != -1) {
                multiplier = 37.79527559
            } else if (val.search(/mm$/i) != -1) {
                multiplier = 3.779527559   // Changed from 3.5433070869 to  3.779527559 for 96 dpi instead of 90 dpi
            } else if (val.search(/pt$/i) != -1) {
                multiplier = 1.25
            } else if (val.search(/pc$/i) != -1) {
                multiplier = 15.0
            } else if (val.search(/in$/i) != -1) {
                multiplier = 96.0
            }
            // console.log('multiplier: ' + multiplier * parseFloat(val))
            return multiplier * parseFloat(val)
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

    matrixGetScale: function (mat) {
        // extract absolute scale from matrix
        var sx = Math.sqrt(mat[0] * mat[0] + mat[1] * mat[1]);
        var sy = Math.sqrt(mat[2] * mat[2] + mat[3] * mat[3]);
        // return dominant axis
        if (sx > sy) {
            return sx;
        } else {
            return sy;
        }
    },

    vertexDistanceSquared: function (v1, v2) {
        return Math.pow(v2[0] - v1[0], 2) + Math.pow(v2[1] - v1[1], 2);
    },

    vertexMiddle: function (v1, v2) {
        return [(v2[0] + v1[0]) / 2.0, (v2[1] + v1[1]) / 2.0];
    }

}
