// import { convertSVGtoGCodeLogic } from "./gcode";
// window.convertSVGtoGCodeLogic = convertSVGtoGCodeLogic;
import Converter from "./converter.js";
import { getSettings } from "./settingsGcode.js";


// setupCounter(document.querySelector('#counter'))
document.getElementById('convertBtn').addEventListener('click', ()=>{
    const svgInput = document.getElementById('svgInput');
    const svgFile = svgInput.files[0]
    
    const reader = new FileReader()

    reader.onload = (e) => {
        
        const data = e.target.result;
        let settingsGCODE = getSettings()
        let converter = new Converter(settingsGCODE);
        let gcodeArray = async () => {
            await converter.convert(data).then((gCodeArray) =>{
                const file = new Blob([gCodeArray], {type: 'text/plain'})
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file)
                link.download = 'out.gcode';
                link.click()
                URL.revokeObjectURL(link.href)
            })
        }
        gcodeArray()
    }
    reader.onerror = (err) => {
        console.error(err)
    }

    reader.readAsText(svgFile, 'utf-8')

})
