# Svg-To-GCode Converter

[![npm version](https://badge.fury.io/js/svg-to-gcode.svg)](https://badge.fury.io/js/svg-to-gcode)

`svg-to-gcode` is an npm package that helps in SVG file inputs into G-Code text for a plotter. It's a friendly modification of the opensource respository "exportSVGtoGCODE" by o0morgan0o, originally a Node CLI tool. You can easily incorporate this package into your frontend application.

## Installation

Install the package using npm:

```bash
npm install svg-to-gcode
```
<!-- Or, use a script tag :
```javascript
<script src="https://unpkg.com/svg-to-gcode@^1.0.0/dist/svg-to-gcode.js"></script>

<script>
    // Configuration for the plotter gcode ( the values are in mm)
    const settings = {
        zOffset : 3, 
        feedRate : 3000,
        seekRate : 2000,
        zValue: -15,
        tolerance: 0.1,
        minimumArea: 2.5,
        ignoreNegative: true,
        pathPlanning: 'minimumTravel', // Options are 'sortByArea' and 'minmumTravel'
        bedSize: {
            width: 420,
            height: 297
        }
    }
    // For using the default configuration , skip the settings
    const converter = SvgToGcode(settings)
    converter.convert(svgString).then((gcode) => {
        // Manipulate the recieved gcode
        console.log(gcode)
    })
</script>

``` -->
## Usage
```javascript

import { Converter } from 'svg-to-gcode'

// Configuration for the plotter gcode ( the values are in mm)
const settings = {
    zOffset : 3, 
    feedRate : 3000,
    seekRate : 2000,
    zValue: -15,
    tolerance: 0.1,
    minimumArea: 2.5,
    ignoreNegative: true,
    pathPlanning: 'minimumTravel',
    bedSize: {
        width: 420,
        height: 297
    }
}

// For using the default configuration , skip the settings
const converter = new Converter(settings)

// You can download the generated gCode using this code
converter.convert(data).then((gcode) => {
    const file = new Blob([gcode], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'out.gcode';
    link.click();
    URL.revokeObjectURL(link.href);
})
```