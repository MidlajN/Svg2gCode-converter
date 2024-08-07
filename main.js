// import { SVGPathData } from "svg-pathdata";
import { Converter } from "./converter";


document.getElementById('convertBtn').addEventListener('click', () => {
    const svgInput = document.getElementById('svgFile');
    const svg = svgInput.files[0]

    const reader = new FileReader()

    reader.onload = (e) => {
        const data = e.target.result;

        // const svgDoc = new DOMParser().parseFromString(data, 'image/svg+xml');
        // const svg = svgDoc.documentElement;
        // const path = svg.querySelector('path');
        // const translate = path.getAttribute('transform').split('translate(')[1].split(')')[0].split(',');
        // console.log('PATH :: [+] :: ', path);
        // console.log('TRANSLATE :: [+] :: ', translate);

        // const pathdata  =  new SVGPathData(path.getAttribute('d')).toAbs().translate(58.891, 18.9444).encode();
        // console.log('PATHDATA :: [+] :: ', pathdata);

        // console.log('SVG :: [+] :: ', svg);
        const settings = {
            zOffset : 3, 
            feedRate : 3000,
            seekRate : 2000,
            zValue: 15
        }
        const converter = new Converter(settings);

        converter.convert(data).then((gcodes) => {

            let gcode = gcodes[0];
            const gcodeLines = gcode.split('\n');
            let gCode = '';

            gcodeLines.forEach(gcode => {
                // remove unnecessary whitespace from each line 
                let trimmedLine = gcode.trim(); 
                // if(trimmedLine.includes('G0 Z3')) {
                //     trimmedLine = 'M03 S000';
                // } else if (trimmedLine.includes('G0 Z0')) {
                //     trimmedLine = 'M03 S123';
                // }
                gCode += trimmedLine + '\n';
            });

            document.getElementById('gcode').value = gCode;
        });
    };
    reader.onerror = (err) => {
        console.log(err);
    };
    reader.readAsText(svg, 'utf-8');
});
