import { SVGReader } from "./svgreader.js"

let scale = function (val) { // val is a point value
    // let tmp = 0.352778 * val
    let tmp = val / 96 * 25.4;
    if (tmp.toString().indexOf('.') === -1) tmp = tmp.toString() + '.0';
    let split = tmp.toString().split('.')
    let decimals = split[1].substring(0, 3)
    let result = parseFloat(split[0] + "." + decimals)
    
    return result
}

export function svg2gcode(svg, settings) {
    let gcode = [];
    gcode.push('G0 F' + settings.seekRate);
    gcode.push(settings.start);
    gcode.push('G90 G21');

    let paths = SVGReader.parse(svg, { tolerance : settings.tolerance }).allcolors;

    paths = paths.filter((path) => {
        let bounds = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity, area: 0 };
        // find lower and upper bounds
        path.forEach(point => {
            if (point.x < bounds.x) bounds.x = point.x;
            if (point.y < bounds.y) bounds.y = point.y;
            if (point.x > bounds.x2) bounds.x2 = point.x;
            if (point.y > bounds.y2) bounds.y2 = point.y;
        });
        bounds.area = (1 + bounds.x2 - bounds.x) * (1 + bounds.y2 - bounds.y);
        path.bounds = bounds;

        if (bounds.area > settings.minArea) return path          
    })

    // cut the inside parts first
    paths.sort(function (a, b) { return (a.bounds.area < b.bounds.area) ? -1 : 1; }); // sort by area  

    const height = svg.viewBox[3];

    const isWithinBedSize = (x, y) => {
        return settings.bedSize.width >= x && settings.bedSize.height > y && ( settings.ignoreNegative ? !(x < 0 || y < 0) : true )
    }

    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        const nextPath = paths[i + 1] || null;

        const nextPathStartX = nextPath !== null ? scale(nextPath[0].x) : -1;
        const nextPathStartY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
        const finalPathX = scale(path[path.length - 1].x);
        const finalPathY = scale(height - path[path.length - 1].y);
        const isSamePath = nextPathStartX === finalPathX && nextPathStartY === finalPathY;

        let outOfLimit = false;

        const startX = scale(path[0].x);
        const startY = scale(height - path[0].y);

        if (settings.bedSize) {
            if ( isWithinBedSize(startX, startY) ) {
                gcode.push(`G0 X${ startX } Y${ startY }`);
                gcode.push(settings.colorCommandOn4);
            } else {
                outOfLimit = true
            }
        } else {
            gcode.push(`G0 X${ startX } Y${ startY }`);
            gcode.push(settings.colorCommandOn4);
        }

        path.forEach(segment => {
            const x = scale(segment.x);
            const y = scale(height - segment.y);

            if (settings.bedSize) {
                if (isWithinBedSize(x, y)) {
                    if (outOfLimit) {
                        gcode.push(`G0 X${x} Y${y}`)
                        gcode.push(settings.colorCommandOn4);
                        outOfLimit = false;
                    }
                    gcode.push(`G1 X${x} Y${y}`)
                } else {
                    if (gcode[gcode.length - 1] !== settings.colorCommandOff4) {
                        gcode.push(settings.colorCommandOff4);
                        outOfLimit = true;
                    }
                }
            } else {
                gcode.push(`G1 X${scale(segment.x)} Y${scale(height - segment.y)}`)
            }

            // gcode.push(`G1 X${scale(segment.x)} Y${scale(height - segment.y)}`)
        });
        // if (!isSamePath) gcode.push(settings.colorCommandOff4, `G0 F${settings.feedRate}`);
        if (!isSamePath && gcode[gcode.length - 1] !== settings.colorCommandOff4) {
            gcode.push(settings.colorCommandOff4)
        };

    }
    gcode.push(settings.end);
    // gcode.push('G1 X0 Y0');

    return gcode.join('\n');
}
