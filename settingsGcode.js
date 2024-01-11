let settingsGCODE = {
    inputFile: null,
    outputFile: null,
    colorCommandOn4: "\nG1 Z0 ;ON",
    colorCommandOff4: "\nG1 Z2 ;OFF",
    LineWithVariationIsDesactivated: true,


    start: "\nG1 Z2\n;end of initialization\n",
    end: "\nG0 X0 Y0;end of file",
    feedRate: 1600,
    seekRate: 4000,



    // put your own folder where your svg files ares
    inputFolder: '/',
    // put your own folder for the export gcode file
    exportFolder: '/home/fab-dev/',

    writeOutput: true,
    showOutput: false,
    useSvgo: true

}

export function getSettings() {
    return settingsGCODE
}