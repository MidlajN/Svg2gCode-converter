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

    paths.forEach(path => {
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
    });

    // cut the inside parts first
    paths.sort(function (a, b) { return (a.bounds.area < b.bounds.area) ? -1 : 1; }); // sort by area  

    const height = svg.viewBox[3];

    for (let i = 0; i < paths.length; i++) {

        let path = paths[i];
        const nextPath = paths[i + 1] ? paths[i + 1] : null;
        const finalPathX = nextPath !== null ? scale(nextPath[0].x) : -1;
        const finalPathY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
        const initialPathX = scale(path[path.length - 1].x);
        const initialPathY = scale(height - path[path.length - 1].y);
        const isSamePath = finalPathX === initialPathX && finalPathY === initialPathY;

        gcode.push(`G0 X${scale(path[0].x)} Y${scale(height - path[0].y)}`);
        gcode.push(`G1 F${settings.feedRate}`);
        gcode.push(settings.colorCommandOn4);

        path.forEach(segment => gcode.push(`G1 X${scale(segment.x)} Y${scale(height - segment.y)}`));
        // if (!isSamePath) gcode.push(settings.colorCommandOff4, `G0 F${settings.feedRate}`);
        if (!isSamePath) gcode.push(settings.colorCommandOff4);

    }
    gcode.push(settings.end);
    // gcode.push('G1 X0 Y0');

    return gcode.join('\n');
}
