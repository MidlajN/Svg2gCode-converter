import { SVGReader } from "./svgreader.js"

let scale = function (val) { // val is a point value
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

        if (bounds.area > settings.minimumArea) return path          
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

    const isWithinBedSize = (x, y) => {
        const fitsBedSize = settings.bedSize.width >= Math.abs(x) && settings.bedSize.height > Math.abs(y)

        switch (settings.quadrant) {
            case 1:
                return fitsBedSize && x >= 0 && y >= 0;
            case 2:
                return fitsBedSize && x <= 0 && y >= 0;
            case 3:
                return fitsBedSize && x <= 0 && y <= 0;
            case 4:
                return fitsBedSize && x >= 0 && y <= 0;
            default:
                return false
        }
    }

    const width = svg.viewBox[2];
    const height = svg.viewBox[3];

    const getBothEndPoints = (path) => {
        if (!path) return;

        const adjustX = (x) => ( settings.quadrant === 2 || settings.quadrant === 3 ) ? x - width : x;
        const adjustY = (y) => ( settings.quadrant === 3 || settings.quadrant === 4 ) ? y - height : y;

        return {
            startX: scale( adjustX(path[0].x) ),
            startY: scale( adjustY(height - path[0].y) ),
            finalX: scale( adjustX(path[0].x) ),
            finalY: scale( adjustY(height - path[path.length - 1].y))
        };
    }

    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        const nextPath = paths[i + 1] || null;

        const { startX, startY, finalX, finalY } = getBothEndPoints(path);
        const nexPathEndpoints = getBothEndPoints(nextPath);
        const isSamePath = nexPathEndpoints ? nexPathEndpoints.startX === finalX && nexPathEndpoints.startY === finalY : false ;

        let outOfLimit = false;

        if (settings.bedSize) {
            if ( isWithinBedSize(startX, startY) ) {
                gcode.push(`G0 X${ startX } Y${ startY }`);
                gcode.push(settings.zDownCommand);
            } else {
                outOfLimit = true
            }
        } else {
            gcode.push(`G0 X${ startX } Y${ startY }`);
            gcode.push(settings.zDownCommand);
        }

        path.forEach(segment => {
            let x = ( settings.quadrant === 2 || settings.quadrant === 3 ) ? segment.x - width : segment.x;
            let y = ( settings.quadrant === 3 || settings.quadrant === 4 ) ? height - segment.y - height : height - segment.y;
            x = scale(x);
            y = scale(y);


            if (settings.bedSize) {
                if (isWithinBedSize(x, y)) {
                    if (outOfLimit) {
                        gcode.push(`G0 X${x} Y${y}`)
                        gcode.push(settings.zDownCommand);
                        outOfLimit = false;
                    }
                    gcode.push(`G1 X${x} Y${y}`)
                } else {
                    if (gcode[gcode.length - 1] !== settings.zUpCommand) {
                        gcode.push(settings.zUpCommand);
                        outOfLimit = true;
                    }
                }
            } else {
                gcode.push(`G1 X${x} Y${y}`)
            }

            // gcode.push(`G1 X${scale(segment.x)} Y${scale(height - segment.y)}`)
        });
        // if (!isSamePath) gcode.push(settings.zUpCommand, `G0 F${settings.feedRate}`);
        if (!isSamePath && gcode[gcode.length - 1] !== settings.zUpCommand) {
            gcode.push(settings.zUpCommand)
        };

    }
    gcode.push(settings.end);

    return gcode.join('\n');
}
