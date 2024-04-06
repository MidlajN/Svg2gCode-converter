import { SVGReader } from "./svgreader.js"
let paths;
let gcode = [];
let path;
let scale = function (val) { // val is a point value
    // let tmp = 0.352778 * val
    let tmp = val / 96 * 25.4;
    if (tmp.toString().indexOf('.') == -1) {
        tmp = tmp.toString() + '.0'
    }
    let split = tmp.toString().split('.')
    let decimals = split[1].substring(0, 3)
    let result = parseFloat(split[0] + "." + decimals)
    
    return result
}

export function svg2gcode(svg, settings) {

    paths = SVGReader.parse(svg, {}).allcolors
    console.log('paths : ', paths)

    var idx = paths.length;
    console.log('number of paths : ', idx)
    while (idx--) {
        var subidx = paths[idx].length;
        var bounds = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity, area: 0 };

        // find lower and upper bounds
        while (subidx--) {
            if (paths[idx][subidx][0] < bounds.x) {
                bounds.x = paths[idx][subidx][0];
            }
            if (paths[idx][subidx][1] < bounds.y) {
                bounds.y = paths[idx][subidx][0];
            }
            if (paths[idx][subidx][0] > bounds.x2) {
                bounds.x2 = paths[idx][subidx][0];
            }
            if (paths[idx][subidx][1] > bounds.y2) {
                bounds.y2 = paths[idx][subidx][0];
            }
        }

        // calculate area
        bounds.area = (1 + bounds.x2 - bounds.x) * (1 + bounds.y2 - bounds.y);
        paths[idx].bounds = bounds;
    }

    // cut the inside parts first
    paths.sort(function (a, b) {
        // sort by area
        return (a.bounds.area < b.bounds.area) ? -1 : 1;
    });
    console.log('sorted paths : ', paths)
    gcode = [];

    gcode.push(settings.start);

    gcode.push('G0 F' + settings.seekRate);
    gcode.push(['G90', 'G21'].join(' '));

    //getting height
    let height = svg.viewBox[3]
    // console.log(height)
    // TODO : change height to something real
    var lastSamePath = false;

    var commandOnActive = true;
    let counter = 0

    for (var pathIdx = 0; pathIdx < paths.length; pathIdx++) {
        // console.log('pathIdx : ', pathIdx)
        counter++
        path = paths[pathIdx];

        var nextPath = paths[pathIdx + 1] ? paths[pathIdx + 1] : null;
        var finalPathX = nextPath !== null ? scale(nextPath[0].x) : -1;
        var finalPathY = nextPath !== null ? scale(height - nextPath[0].y) : -1;
        var initialPathX = scale(path[path.length - 1].x);
        var initialPathY = scale(height - path[path.length - 1].y);
        var isSamePath = finalPathX === initialPathX && finalPathY === initialPathY;

        // seek to index 0
        gcode.push(['G0',
            'X' + scale(path[0].x),
            'Y' + scale(height - path[0].y)
        ].join(' '));

        // console.log('gCode : ', gcode)
        gcode.push('G0 F' + settings.feedRate);

        var colorComandOn = "";
        var colorComandOff = "";

        colorComandOn = settings.colorCommandOn4;
        colorComandOff = settings.colorCommandOff4;
        if (commandOnActive) {
            gcode.push(colorComandOn);
            commandOnActive = false;
        }

        // keep track of the current path being cut, as we may need to reverse it
        var localPath = [];
        for (var segmentIdx = 0, segmentLength = path.length; segmentIdx < segmentLength; segmentIdx++) {
            var segment = path[segmentIdx];

            var localSegment = ['G1',
                'X' + scale(segment.x),
                'Y' + scale(height - segment.y)
            ].join(' ');

            // feed through the material
            gcode.push(localSegment);
            localPath.push(localSegment);
        }

        if (!isSamePath) {
            gcode.push(colorComandOff);
            commandOnActive = true;
            gcode.push('G0 F' + settings.seekRate);
        }
        else {
            commandOnActive = false;
            lastSamePath = true;
        }
    }

    gcode.push(settings.end);
    gcode.push('G1 X0 Y0');
    // console.log(gcode)

    return gcode.join('\n');
}
