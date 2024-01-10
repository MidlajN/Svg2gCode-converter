import { convertSVGtoGCodeLogic } from "./gcode";
window.convertSVGtoGCodeLogic = convertSVGtoGCodeLogic;
import Converter from "./converter.js";


// setupCounter(document.querySelector('#counter'))
document.getElementById('convertBtn').addEventListener('click', ()=>{
    const svgInput = document.getElementById('svgInput');
    const svgFile = svgInput.files[0]
    
    const reader = new FileReader()

    reader.onload = (e) => {
        
        const data = e.target.result;
        let converter = new Converter();
        let gcodeArray = async () => {
            await converter.convert(data);
        }
        console.log('GCODE GOT CONVERTED ::>>>>> \n\n\n', gcodeArray())
    }
    reader.onerror = (err) => {
        console.error(err)
    }

    reader.readAsText(svgFile, 'utf-8')

})
