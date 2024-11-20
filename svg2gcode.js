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
    // gcode.push('G0 F' + settings.seekRate);
    gcode.push('G1 F' + settings.feedRate);
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

    if (settings.pathPlanning === 'sortByArea') {
        paths.sort(function (a, b) { return (a.bounds.area < b.bounds.area) ? -1 : 1; }); // sort by area    
    } else {
        const sortedPaths = [];
        let currentPath = paths[0];
        sortedPaths.push(currentPath);

        while(paths.length > 1) {
            paths = paths.filter(path => path !== currentPath);

            const lastPosition = currentPath[currentPath.length - 1];

            currentPath = paths.reduce((closest, path) => {
                const distancetoCurrent = Math.sqrt((path[0].x - lastPosition.x) ** 2 + (path[0].y - lastPosition.y) ** 2);
                const distancetoClosest = Math.sqrt((closest[0].x - lastPosition.x) ** 2 + (closest[0].y - lastPosition.y) ** 2);

                return distancetoCurrent < distancetoClosest ? path : closest
            });

            sortedPaths.push(currentPath)
        }
        paths = sortedPaths
    }

    const width = svg.viewBox[2];
    const height = svg.viewBox[3];

    const isWithinBedSize = (x, y) => {
        // return settings.bedSize.width >= x && settings.bedSize.height > y && ( settings.ignoreNegative ? !(x < 0 || y < 0) : true )
        switch (settings.quadrant) {
            case 1:
                return settings.bedSize.width >= x && settings.bedSize.height > y && !(x < 0 || y < 0) 
                // break;
            case 2:
                return settings.bedSize.width >= Math.abs(x) && settings.bedSize.height > Math.abs(y) && !(x > 0 || y < 0) 
                // break;
            case 3:
                return settings.bedSize.width >= Math.abs(x) && settings.bedSize.height > Math.abs(y) && !(x > 0 || y > 0) 
                // break;
            case 4:
                return settings.bedSize.width >= Math.abs(x) && settings.bedSize.height > Math.abs(y) && !(x < 0 || y < 0) 
                // break;
            default:
                break;
        }
        // return settings.bedSize.width >= Math.abs(x) && settings.bedSize.height > Math.abs(y)
    }

    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        const nextPath = paths[i + 1] || null;
        let isSamePath;
        let startX;
        let startY;

        if (settings.quadrant === 1) {
            const nextPathStartX = nextPath !== null ? scale(nextPath[0].x) : -1;
            const nextPathStartY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
            const finalPathX = scale(path[path.length - 1].x);
            const finalPathY = scale(height - path[path.length - 1].y);
            isSamePath = nextPathStartX === finalPathX && nextPathStartY === finalPathY;

            startX = scale(path[0].x);
            startY = scale(height - path[0].y);

        } else if (settings.quadrant === 2) {
            const nextPathStartX = nextPath !== null ? scale(nextPath[0].x - width) : -1;
            const nextPathStartY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
            const finalPathX = scale(path[path.length - 1].x - width);
            const finalPathY = scale(height - path[path.length - 1].y);
            isSamePath = nextPathStartX === finalPathX && nextPathStartY === finalPathY;

            startX = scale(path[0].x - width);
            startY = scale(height - path[0].y);

        } else if (settings.quadrant === 3) {
            const nextPathStartX = nextPath !== null ? scale(nextPath[0].x - width) : -1;
            const nextPathStartY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
            const finalPathX = scale(path[path.length - 1].x - width);
            const finalPathY = scale(height - path[path.length - 1].y - height);
            isSamePath = nextPathStartX === finalPathX && nextPathStartY === finalPathY;

            startX = scale(path[0].x - width);
            startY = scale(height - path[0].y - height);

        } else if (settings.quadrant === 4) {
            const nextPathStartX = nextPath !== null ? scale(nextPath[0].x) : -1;
            const nextPathStartY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
            const finalPathX = scale(path[path.length - 1].x);
            const finalPathY = scale(height - path[path.length - 1].y - height);
            isSamePath = nextPathStartX === finalPathX && nextPathStartY === finalPathY;

            startX = scale(path[0].x);
            startY = scale(height - path[0].y - height);
        }

        // const nextPathStartX = nextPath !== null ? scale(nextPath[0].x - width) : -1;
        // const nextPathStartY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
        // const finalPathX = scale(path[path.length - 1].x - width);
        // // const finalPathY = scale(height - path[path.length - 1].y);
        // const finalPathY = scale(height - path[path.length - 1].y - height);
        // const isSamePath = nextPathStartX === finalPathX && nextPathStartY === finalPathY;

        let outOfLimit = false;

        // const startX = scale(path[0].x - width);
        // const startY = scale(height - path[0].y);
        // const startY = scale(height - path[0].y - height);

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
        console.log('Quadrant : ', settings.quadrant, '\nG-Code : ', gcode)

        path.forEach(segment => {
            let x;
            let y;
            if (settings.quadrant === 1) {
                x = scale(segment.x);
                y = scale(height - segment.y);
            } else if (settings.quadrant === 2) {
                x = scale(segment.x - width);
                y = scale(height - segment.y);
            } else if (settings.quadrant === 3) {
                x = scale(segment.x - width);
                y = scale(height - segment.y - height);
            } else if (settings.quadrant === 4) {
                x = scale(segment.x);
                y = scale(height - segment.y - height);
            }
            // const x = scale(settings.quadrant === 1 ? segment.x : segment.x - width);
            // // const y = scale(height - segment.y);
            // const y = scale(height - segment.y);

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
                gcode.push(`G1 X${x} Y${y}`)
            }

            // gcode.push(`G1 X${scale(segment.x)} Y${scale(height - segment.y)}`)
        });
        // if (!isSamePath) gcode.push(settings.colorCommandOff4, `G0 F${settings.feedRate}`);
        if (!isSamePath && gcode[gcode.length - 1] !== settings.colorCommandOff4) {
            console.log('IsSamePath : ', isSamePath);
            gcode.push(settings.colorCommandOff4)
        };

    }
    gcode.push(settings.end);
    // gcode.push('G1 X0 Y0');

    return gcode.join('\n');
}
