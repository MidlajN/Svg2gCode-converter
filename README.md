# Svg-To-gCode Converter

[![npm version](https://badge.fury.io/js/svg-to-gcode.svg)](https://badge.fury.io/js/svg-to-gcode)

`svg-to-gcode` is an npm package that helps in SVG file inputs into G-Code text for a plotter. It's a friendly modification of the opensource respository "exportSVGtoGCODE" by o0morgan0o, originally a Node CLI tool. You can easily incorporate this package into your frontend application.

## Installation

Install the package using npm:

```bash
npm install svg-to-gcode
```
## Usage
```javascript

import { Converter } from 'svg-to-gcode'

// Set the configuration for the Plotter
const settings = {
    zOffset : 3,
    feedRate : 1600,
    seekRate : 1300,
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