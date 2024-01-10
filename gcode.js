export function convertSVGtoGCodeLogic(svgInput) {
    // Parse SVG input
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svgInput, "image/svg+xml");

    // Initialize G-code string
    let gcodeOutput = '';

    // Define initial position
    let currentX = 0;
    let currentY = 0;

    // Get the path data from the SVG
    const pathElement = xmlDoc.querySelector('path');
    console.log('SSSS >>>>>>', pathElement)
    const pathData = pathElement.getAttribute('d');

    // Split path data into individual commands
    const commands = pathData.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);

   // ...

    // Loop through each command
    commands.forEach(command => {
        // Extract command type and parameters
        const [type, ...params] = command.trim().split(/\s+/);

        // Handle different path commands
        switch (type.toUpperCase()) {
            case 'M':
                // Move to a specified point
                const [moveToX, moveToY] = params.map(parseFloat);
                if (!isNaN(moveToX) && !isNaN(moveToY)) {
                    gcodeOutput += `G0 X${moveToX.toFixed(3)} Y${moveToY.toFixed(3)}\n`;
                    currentX = moveToX;
                    currentY = moveToY;
                }
                break;

            case 'L':
                // Draw a line to a specified point
                const [lineToX, lineToY] = params.map(parseFloat);
                if (!isNaN(lineToX) && !isNaN(lineToY)) {
                    gcodeOutput += `G0 X${lineToX.toFixed(3)} Y${lineToY.toFixed(3)}\n`;
                    currentX = lineToX;
                    currentY = lineToY;
                }
                break;

            // Add more cases for other path commands (e.g., C, S, Q, A) as needed

            case 'Z':
                // Close the path (optional, depends on your requirements)
                gcodeOutput += `G0 X${currentX.toFixed(3)} Y${currentY.toFixed(3)}\n`;
                break;

            default:
                // Ignore unknown commands
                break;
        }
    });

    // ...


    console.log(gcodeOutput);
}
