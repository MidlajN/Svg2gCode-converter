import { getAttribute } from "./xmlFunctions";

export const svgMapping = {
    SVGAttributeMapping: {
        DEG_TO_RAD: Math.PI / 180,
        RAD_TO_DEG: 180 / Math.PI,

        id: function (parser, node, val) {
            node.id = val
        },

        transform: function (parser, node, val) {
            // http://www.w3.org/TR/SVG11/coords.html#EstablishingANewUserSpace
            var xforms = []
            var segs = val.match(/[a-z]+\s*\([^)]*\)/ig)
            for (var i = 0; i < segs.length; i++) {
                var kv = segs[i].split("(");
                var xformKind = kv[0].strip();
                var paramsTemp = kv[1].strip().slice(0, -1);
                var params = paramsTemp.split(/[\s,]+/).map(parseFloat)
                // double check params
                for (var j = 0; j < params.length; j++) {
                    if (isNaN(params[j])) {
                        ('warning', 'transform skipped; contains non-numbers');
                        continue  // skip this transform
                    }
                }

                // translate
                if (xformKind == 'translate') {
                    if (params.length == 1) {
                        xforms.push([1, 0, 0, 1, params[0], params[0]])
                    } else if (params.length == 2) {
                        xforms.push([1, 0, 0, 1, params[0], params[1]])
                    } else {
                        throw new Error('translate skipped; invalid num of params');
                    }
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
            xform_combined = [1, 0, 0, 1, 0, 0]
            for (var i = 0; i < xforms.length; i++) {
                xform_combined = parser.matrixMult(xform_combined, xforms[i])
            }

            // assign
            node.xform = xform_combined
        },

        style: function (parser, node, val) {
            // style attribute
            // http://www.w3.org/TR/SVG11/styling.html#StyleAttribute
            // example: <rect x="200" y="100" width="600" height="300"
            //          style="fill: red; stroke: blue; stroke-width: 3"/>

            // relay to parse style attributes the same as Presentation Attributes
            var segs = val.split(";")
            for (var i = 0; i < segs.length; i++) {
                var kv = segs[i].split(":")
                var k = kv[0].strip()
                if (this[k]) {
                    var v = kv[1].strip()
                    this[k](parser, node, v)
                }
            }
        },

        ///////////////////////////
        // Presentations Attributes
        // http://www.w3.org/TR/SVG11/styling.html#UsingPresentationAttributes
        // example: <rect x="200" y="100" width="600" height="300"
        //          fill="red" stroke="blue" stroke-width="3"/>

        opacity: function (parser, node, val) {
            node.opacity = parseFloat(val)
        },

        display: function (parser, node, val) {
            node.display = val
        },

        visibility: function (parser, node, val) {
            node.visibility = val
        },

        fill: function (parser, node, val) {
            node.fill = this.__parseColor(val, node.color)
        },

        stroke: function (parser, node, val) {
            //node.stroke = this.__parseColor(val, node.color)
            node.stroke = val;
        },

        color: function (parser, node, val) {
            if (val == 'inherit') return
            node.color = this.__parseColor(val, node.color)
        },

        'fill-opacity': function (parser, node, val) {
            node.fillOpacity = Math.min(1, Math.max(0, parseFloat(val)))
        },

        'stroke-opacity': function (parser, node, val) {
            node.strokeOpacity = Math.min(1, Math.max(0, parseFloat(val)))
        },

        // Presentations Attributes
        ///////////////////////////

        __parseColor: function (val, currentColor) {

            if (val.charAt(0) == '#') {
                if (val.length == 4)
                    val = val.replace(/([^#])/g, '$1$1')
                var a = val.slice(1).match(/../g).map(
                    function (i) { return parseInt(i, 16) })
                return a

            } else if (val.search(/^rgb\(/) != -1) {
                var a = val.slice(4, -1).split(",")
                for (var i = 0; i < a.length; i++) {
                    var c = a[i].strip()
                    if (c.charAt(c.length - 1) == '%')
                        a[i] = Math.round(parseFloat(c.slice(0, -1)) * 2.55)
                    else
                        a[i] = parseInt(c)
                }
                return a

            } else if (val.search(/^rgba\(/) != -1) {
                var a = val.slice(5, -1).split(",")
                for (var i = 0; i < 3; i++) {
                    var c = a[i].strip()
                    if (c.charAt(c.length - 1) == '%')
                        a[i] = Math.round(parseFloat(c.slice(0, -1)) * 2.55)
                    else
                        a[i] = parseInt(c)
                }
                var c = a[3].strip()
                if (c.charAt(c.length - 1) == '%')
                    a[3] = Math.round(parseFloat(c.slice(0, -1)) * 0.01)
                else
                    a[3] = Math.max(0, Math.min(1, parseFloat(c)))
                return a

            } else if (val.search(/^url\(/) != -1) {
                return [0, 0, 0]
            } else if (val == 'currentColor') {
                return currentColor
            } else if (val == 'none') {
                return 'none'
            } else if (val == 'freeze') { // SMIL is evil, but so are we
                return null
            } else if (val == 'remove') {
                return null
            } else { // unknown value, maybe it's an ICC color
                return val
            }
        }
    },

    // recognized svg attributes
    /////////////////////////////

    ///////////////////////////
    // recognized svg elements

    SVGTagMapping: {
        svg: function (parser, tag, node) {
            // has style attributes
            node.fill = 'black'
            node.stroke = 'none'
            // // parse document dimensions
            // node.width = 0
            // node.height = 0
            // var w = tag.getAttribute('width')
            // var h = tag.getAttribute('height')
            // if (!w) w = h
            // else if (!h) h = w
            // if (w) {
            //   var wpx = parser.parseUnit(w, cn, 'x')
            //   var hpx = parser.parseUnit(h, cn, 'y')
            // }
        },


        g: function (parser, tag, node) {
            // http://www.w3.org/TR/SVG11/struct.html#Groups
            // has transform and style attributes
        },


        polygon: function (parser, tag, node) {
            // http://www.w3.org/TR/SVG11/shapes.html#PolygonElement
            // has transform and style attributes
            var d = this.__getPolyPath(tag)
            d.push('z')
            parser.addPath(d, node)
        },


        polyline: function (parser, tag, node) {
            // http://www.w3.org/TR/SVG11/shapes.html#PolylineElement
            // has transform and style attributes
            var d = this.__getPolyPath(tag)
            parser.addPath(d, node)
        },

        __getPolyPath: function (tag) {
            // has transform and style attributes
            var subpath = []
            var verts = getAttribute(tag, "points").toString().split(/[\s,]+/).map(parseFloat);
            var vertnums = [];
            for (var i = 0; i < verts.length; i++) {
                if (verts[i]) {
                    vertnums.push(verts[i]);
                }
            }
            if (vertnums.length % 2 == 0) {
                var d = ['M']
                d.push(vertnums[0])
                d.push(vertnums[1])
                for (var i = 2; i < vertnums.length; i += 2) {
                    d.push(vertnums[i])
                    d.push(vertnums[i + 1])
                }
                return d
            } else if (verts.length % 2 == 0) {
                vertnums = verts;
                var d = ['M']
                d.push(vertnums[0])
                d.push(vertnums[1])
                for (var i = 2; i < vertnums.length; i += 2) {
                    d.push(vertnums[i])
                    d.push(vertnums[i + 1])
                }
                return d
            }
            else {
                throw new Error("in __getPolyPath: odd number of verteces");
            }
        },

        rect: function (parser, tag, node) {
            console.log('tag', tag)
            console.log('RECT >>>', getAttribute(tag, 'width'), getAttribute(tag, 'height'), getAttribute(tag, 'x'), getAttribute(tag, 'y'), getAttribute(tag, 'rx'), getAttribute(tag, 'ry'))
            // http://www.w3.org/TR/SVG11/shapes.html#RectElement
            // has transform and style attributes
            var w = parser.parseUnit(getAttribute(tag, 'width')) || 0;
            var h = parser.parseUnit(getAttribute(tag, 'height')) || 0;
            var x = parser.parseUnit(getAttribute(tag, 'x')) || 0;
            var y = parser.parseUnit(getAttribute(tag, 'y')) || 0;
            var rx = parser.parseUnit(getAttribute(tag, 'rx')) || 0;
            var ry = parser.parseUnit(getAttribute(tag, 'ry')) || null;

            console.log('RECT >>>', '\nw :', w, '\nh : ', h, '\nx : ', x, '\ny : ', y, '\nrx : ', rx, '\nry : ', ry)

            if (rx == null || ry == null) {  // no rounded corners
                var d = ['M', x, y, 'h', w, 'v', h, 'h', -w, 'z'];
                // console.log('d :', d)
                parser.addPath(d, node)
            } else {                       // rounded corners
                if ('ry' == null) { ry = rx; }
                if (rx < 0.0) { rx *= -1; }
                if (ry < 0.0) { ry *= -1; }
                d = ['M', x + rx, y,
                    'h', w - 2 * rx,
                    'c', rx, 0.0, rx, ry, rx, ry,
                    'v', h - ry,
                    'c', '0.0', ry, -rx, ry, -rx, ry,
                    'h', -w + 2 * rx,
                    'c', -rx, '0.0', -rx, -ry, -rx, -ry,
                    'v', -h + ry,
                    'c', '0.0', '0.0', '0.0', -ry, rx, -ry,
                    'z'];
                    console.log('d :', d)
                parser.addPath(d, node)
            }
        },


        line: function (parser, tag, node) {
            // http://www.w3.org/TR/SVG11/shapes.html#LineElement
            // has transform and style attributes
            var x1 = parser.parseUnit(getAttribute(tag, 'x1')) || 0
            var y1 = parser.parseUnit(getAttribute(tag, 'y1')) || 0
            var x2 = parser.parseUnit(getAttribute(tag, 'x2')) || 0
            var y2 = parser.parseUnit(getAttribute(tag, 'y2')) || 0
            var d = ['M', x1, y1, 'L', x2, y2]
            parser.addPath(d, node)
        },


        circle: function (parser, tag, node) {
            // http://www.w3.org/TR/SVG11/shapes.html#CircleElement
            // has transform and style attributes
            var r = parser.parseUnit(getAttribute(tag, 'r'))
            var cx = parser.parseUnit(getAttribute(tag, 'cx')) || 0
            var cy = parser.parseUnit(getAttribute(tag, 'cy')) || 0

            if (r > 0.0) {
                var d = ['M', cx - r, cy,
                    'A', r, r, 0, 0, 0, cx, cy + r,
                    'A', r, r, 0, 0, 0, cx + r, cy,
                    'A', r, r, 0, 0, 0, cx, cy - r,
                    'A', r, r, 0, 0, 0, cx - r, cy,
                    'Z'];
                parser.addPath(d, node);
            }
        },


        ellipse: function (parser, tag, node) {
            // has transform and style attributes
            var rx = parser.parseUnit(getAttribute(tag, 'rx'))
            var ry = parser.parseUnit(getAttribute(tag, 'ry'))
            var cx = parser.parseUnit(getAttribute(tag, 'cx')) || 0
            var cy = parser.parseUnit(getAttribute(tag, 'cy')) || 0

            if (rx > 0.0 && ry > 0.0) {
                var d = ['M', cx - rx, cy,
                    'A', rx, ry, 0, 0, 0, cx, cy + ry,
                    'A', rx, ry, 0, 0, 0, cx + rx, cy,
                    'A', rx, ry, 0, 0, 0, cx, cy - ry,
                    'A', rx, ry, 0, 0, 0, cx - rx, cy,
                    'Z'];
                parser.addPath(d, node);
            }
        },


        path: function (parser, tag, node) {
            // http://www.w3.org/TR/SVG11/paths.html
            // has transform and style attributes
            var d = getAttribute(tag, "d")
            // console.log('d', d)
            parser.addPath(d, node)
        },

        image: function (parser, tag, node) {
            // not supported
            // has transform and style attributes
        },

        defs: function (parser, tag, node) {
            // not supported
            // http://www.w3.org/TR/SVG11/struct.html#Head
            // has transform and style attributes
        },

        style: function (parser, tag, node) {
            // not supported: embedded style sheets
            // http://www.w3.org/TR/SVG11/styling.html#StyleElement
            // instead presentation attributes and the 'style' attribute
            // var style = tag.getAttribute("style")
            // if (style) {
            //   var segs = style.split(";")
            //   for (var i=0; i<segs.length; i++) {
            //     var kv = segs[i].split(":")
            //     var k = kv[0].strip()
            //     if (this.SVGAttributeMapping[k]) {
            //       var v = kv[1].strip()
            //       this.SVGAttributeMapping[k].call(v, defs, st)
            //     }
            //   }
            // }
        }

    },
}