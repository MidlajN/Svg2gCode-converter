

// export function exportArtboard(artboard) {

//     var item,
//         name,
//         prettyName,
//         doc,
//         rect,
//         bbox;

//     app.activeDocument = sourceDoc;
//     rect = artboard.artboardRect;

//     bbox = sourceDoc.pathItems.rectangle(rect[1], rect[0], rect[2] - rect[0], rect[1] - rect[3]);
//     bbox.stroked = false;
//     bbox.name = '__ILSVGEX__BOUNDING_BOX';

//     name = artboard.name;

//     win.pnl.text = 'Exporting ' + name;
//     win.pnl.progBar.value = 0;
//     win.pnl.progBarLabel.text = Math.floor(win.pnl.progBar.value) + "%";
//     dialog.update();

//     prettyName = name.slice(0, -4).replace(/[^\w\s]|_/g, " ").replace(/\s+/g, "-").toLowerCase();

//     app.activeDocument = exportDoc;

//     for (var i = 0, len = sourceDoc.pageItems.length; i < len; i++) {
//         item = sourceDoc.pageItems[i];

//         win.pnl.progBar.value = (i * (win.pnl.progBar.maxvalue * 0.4)) / sourceDoc.pageItems.length;
//         win.pnl.progBarLabel.text = Math.floor(win.pnl.progBar.value) + "%";
//         win.pnl.progBar.onDraw();
//         dialog.update();

//         if (hitTest(item, bbox) && !item.locked && !anyParentLocked(item)) {
//             item.duplicate(exportDoc, ElementPlacement.PLACEATEND);
//         }
//     }

//     app.activeDocument = exportDoc;
//     exportDoc.pageItems.getByName('__ILSVGEX__BOUNDING_BOX').remove();

//     // Check if artboard is blank, clean up and exit
//     if (!exportDoc.pageItems.length) {
//         sourceDoc.pageItems.getByName('__ILSVGEX__BOUNDING_BOX').remove();
//         return;
//     }

//     for (i = 0, len = exportDoc.pageItems.length; i < len; i++) {
//         item = exportDoc.pageItems[i];

//         /*
//          * For the moment, all pageItems are made visible and exported
//          * unless they are locked. This may not make sense, but it'll
//          * work for now.
//          */
//         item.hidden = false;
//     }

//     exportDoc.layers[0].name = prettyName;
//     exportSVG(exportDoc, name, bbox.visibleBounds, svgOptions);

//     sourceDoc.pageItems.getByName('__ILSVGEX__BOUNDING_BOX').remove();
// }

// export function exportLayer(layer) {

//     var item,
//         startX,
//         startY,
//         endX,
//         endY,
//         name,
//         prettyName,
//         itemName,
//         layerItems;

//     layerItems = [];

//     for (var i = 0, len = layer.pageItems.length; i < len; i++) {
//         layerItems.push(layer.pageItems[i]);
//     }
//     recurseItems(layer.layers, layerItems);

//     if (!layerItems.length) {
//         return;
//     }

//     name = layer.name;

//     prettyName = name.slice(0, -4).replace(/[^\w\s]|_/g, " ").replace(/\s+/g, "-").toLowerCase();

//     for (i = 0, len = layerItems.length; i < len; i++) {
//         app.activeDocument = sourceDoc;
//         item = layerItems[i];
//         item.duplicate(exportDoc, ElementPlacement.PLACEATEND);
//     }

//     app.activeDocument = exportDoc;

//     for (i = 0, len = exportDoc.pageItems.length; i < len; i++) {

//         item = exportDoc.pageItems[i];

//         /*
//          * For the moment, all pageItems are made visible and exported
//          * unless they are locked. This may not make sense, but it'll
//          * work for now.
//          */
//         item.hidden = false;

//         if (item.name) {
//             itemName = item.name;
//             itemName = itemName.slice(0, -4);
//             itemName = itemName.replace(/[^\w\s]|_/g, " ").replace(/\s+/g, "-").toLowerCase()

//             item.name = prettyName + '-' + itemName;
//         }
//         /*
//          * We want the smallest startX, startY for obvious reasons.
//          * We also want the smallest endX and endY because Illustrator
//          * Extendscript treats this coordinate reversed to how the UI
//          * treats it (e.g., -142 in the UI is 142).
//          *
//          */
//         startX = (!startX || startX > item.visibleBounds[0]) ? item.visibleBounds[0] : startX;
//         startY = (!startY || startY < item.visibleBounds[1]) ? item.visibleBounds[1] : startY;
//         endX = (!endX || endX < item.visibleBounds[2]) ? item.visibleBounds[2] : endX;
//         endY = (!endY || endY > item.visibleBounds[3]) ? item.visibleBounds[3] : endY;
//     }

//     exportDoc.layers[0].name = name.slice(0, -4);
//     exportSVG(exportDoc, name, [startX, startY, endX, endY], svgOptions);
// }

// export function exportItem(item) {

//     var name,
//         newItem;

//     name = item.name;
//     newItem = item.duplicate(exportDoc, ElementPlacement.PLACEATEND);
//     newItem.hidden = false;
//     newItem.name = item.name.slice(0, -4);
//     app.activeDocument = exportDoc;

//     exportDoc.layers[0].name = ' ';
//     exportSVG(exportDoc, name, item.visibleBounds, svgOptions);
// }


// export function getSymbol(treeG, gs) {
//     var currentNodes = [];
//     if (treeG.length) {
//         for (var i = 0; i < treeG.length; i++) {
//             currentNodes.push(treeG[i]);
//         }
//         var len = currentNodes.length;
//         for (var i = 0; i < currentNodes.length; i++) {

//             if (currentNodes[i].length) {
//                 for (var j = 0; j < currentNodes[i].length; j++) {
//                     currentNodes.push(currentNodes[i][j]);
//                 }
//             }
//             else {
//                 if (currentNodes[i].g) {
//                     for (var k = 0; k < currentNodes[i].g.length; k++) {
//                         currentNodes.push(currentNodes[i].g[k]);
//                     }
//                 }
//                 if (currentNodes[i].rect) {
//                     gs.rect.push(currentNodes[i].rect);
//                 }
//                 if (currentNodes[i].polygon) {
//                     gs.polygon.push(currentNodes[i].polygon);
//                 }
//                 if (currentNodes[i].polylines) {
//                     gs.polylines.push(currentNodes[i].polyline);
//                 }
//                 if (currentNodes[i].ellipse) {
//                     gs.ellipse.push(currentNodes[i].ellipse);
//                 }
//                 if (currentNodes[i].circle) {
//                     gs.circle.push(currentNodes[i].circle);
//                 }
//                 if (currentNodes[i].path) {
//                     gs.path.push(currentNodes[i].path);
//                 }
//                 if (currentNodes[i].line) {currentNodes
//                     gs.line.push(currentNodes[i].line);
//                 }
//             }
//         }
//     }
//     else {
//         if (treeG.rect) {
//             gs.rect.push(treeG.rect);
//         }
//         if (treeG.polygon) {
//             gs.polygon.push(treeG.polygon);
//         }
//         if (treeG.ellipse) {
//             gs.ellipse.push(treeG.ellipse);
//         }
//         if (treeG.circle) {
//             gs.circle.push(treeG.circle);
//         }
//         if (treeG.path) {currentNodes
//             gs.path.push(treeG.path);
//         }
//         if (treeG.polylines) {
//             gs.polylines.push(treeG.polyline);
//         }
//         if (treeG.line) {
//             gs.line.push(treeG.line);
//         }
//     }
// }


// export function getGs(treeG, gs) {
    // getG(treeG, gs);
    // console.log("TreeG ", treeG, '\n');
    // const newTree = treeG
    // var currentNodes = [];

    // getG(treeG, gs);

    // if (newTree.length) {
    //     console.log(newTree)
    //     for (var i = 0; i < newTree.length; i++) {
    //         currentNodes.push(newTree[i]);
    //     }
    //     // console.log(currentNodes)

    //     // var len = currentNodes.length;
    //     for (var i = 0; i < currentNodes.length; i++) {
    //         // console.log('currentNode In Loop ', currentNodes[i], ' + ', i, '\n')
    //         if (currentNodes[i].length) {
    //             for (var j = 0; j < currentNodes[i].length; j++) {
    //                 currentNodes.push(currentNodes[i][j]);
    //             }
    //         }
    //         else {
    //             // console.log('currentNode In ELSE ', currentNodes[i], ' + ', i, '\n')
    //             if (currentNodes[i].g) {
    //                 if (currentNodes[i].g.length) {
    //                     for (var k = 0; k < currentNodes[i].g.length; k++) {
    //                         currentNodes.push(currentNodes[i].g[k]);
    //                     }
    //                 }
    //                 else {
    //                     currentNodes.push(currentNodes[i].g);
    //                 }
    //             }
    //             if (currentNodes[i].rect) {
    //                 gs.rect.push(currentNodes[i].rect);
    //             }
    //             if (currentNodes[i].polygon) {
    //                 gs.polygon.push(currentNodes[i].polygon);
    //             }
    //             if (currentNodes[i].ellipse) {
    //                 gs.ellipse.push(currentNodes[i].ellipse);
    //             }
    //             if (currentNodes[i].polyline) {
    //                 gs.polylines.push(currentNodes[i].polyline);
    //             }
    //             if (currentNodes[i].circle) {
    //                 gs.circle.push(currentNodes[i].circle);
    //             }
    //             if (currentNodes[i].path) {
    //                 gs.path.push(currentNodes[i].path);
    //             }
    //             if (currentNodes[i].line) {
    //                 gs.line.push(currentNodes[i].line);
    //             }
    //         }
    //     }
    // }
    // else {
    //     if (treeG.rect) {
    //         gs.rect.push(treeG.rect);
    //     }
    //     if (treeG.polygon) {
    //         gs.polygon.push(treeG.polygon);
    //     }
    //     if (treeG.ellipse) {
    //         gs.ellipse.push(treeG.ellipse);
    //     }
    //     if (treeG.polyline) {
    //         gs.polylines.push(treeG.polyline);
    //     }
    //     if (treeG.circle) {
    //         gs.circle.push(treeG.circle);
    //     }
    //     if (treeG.path) {
    //         gs.path.push(treeG.path);
    //     }
    //     if (treeG.line) {
    //         gs.line.push(treeG.line);
    //     }
    //     if (treeG.g) {
    //         getGs(treeG.g, gs);
    //     }
    // }
// }


export function getGs(treeG, gs) {
    if (!treeG) return;

    const processNode = (node, gs) => {
        if (node.rect) gs.rect.push(node.rect);
        if (node.polygon) gs.polygon.push(node.polygon);
        if (node.ellipse) gs.ellipse.push(node.ellipse);
        if (node.polyline) gs.polyline.push(node.polyline);
        if (node.circle) gs.circle.push(node.circle);
        if (node.path) gs.path.push(node.path);
        if (node.line) gs.line.push(node.line);
        if (node.g) getG(node.g, gs);
    }

    if (Array.isArray(treeG)) {
        treeG.forEach(element => {
            processNode(element, gs);
        });
    } else {
        processNode(treeG, gs);
    }
}


export function getSVGShape(shapes, type) {
    let currentNodes = [];
    let result = [];

    const processShape = (node, name) => {
        const commonAttr = [
            { childNodes: [], localName: 'fill', name: 'fill', nodeName: 'fill', nodeValue: node['fill'], textContent: node['fill'], value: node['fill'] },
            { childNodes: [], localName: 'stroke', name: 'stroke', nodeName: 'stroke', nodeValue: node['stroke'], textContent: node['stroke'], value: node['stroke'] },
            { childNodes: [], localName: 'stroke-miterlimit', name: 'stroke-miterlimit', nodeName: 'stroke-miterlimit', nodeValue: node['stroke-miterlimit'], textContent: node['stroke-miterlimit'], value: node['stroke-miterlimit'] },
            { childNodes: [], localName: 'stroke-width', name: 'stroke-width', nodeName: 'stroke-width', nodeValue: node['stroke-width'], textContent: node['stroke-width'], value: node['stroke-width'] },
            // { childNodes: [], localName: 'transform', 'name': 'transform', 'nodeName': 'transform', 'nodeValue': node['transform'], 'textContent': node['transform'], 'value': node['transform'] }
        ]

        let specificAttr = []
        switch (name) {
            case 'rect':
                specificAttr = [
                    { childNodes: [], localName: 'x', name: 'x', nodeName: 'x', nodeValue: node['x'], textContent: node['x'], value: node['x'] },
                    { childNodes: [], localName: 'y', name: 'y', nodeName: 'y', nodeValue: node['y'], textContent: node['y'], value: node['y'] },
                    { childNodes: [], localName: 'width', name: 'width', nodeName: 'width', nodeValue: node['width'], textContent: node['width'], value: node['width'] },
                    { childNodes: [], localName: 'height', name: 'height', nodeName: 'height', nodeValue: node['height'], textContent: node['height'], value: node['height'] },
                ];
                break;
            case 'polygon':
                specificAttr = [
                    { childNodes: [], localName: 'points', name: 'points', nodeName: 'points', nodeValue: treePolygons['points'], textContent: treePolygons['points'], value: treePolygons['points'] },
                ];
                break;
            case 'ellipse':
                specificAttr = [
                    { childNodes: [], localName: 'cx', name: 'cx', nodeName: 'cx', nodeValue: node['cx'], textContent: node['cx'], value: node['cx'] },
                    { childNodes: [], localName: 'cy', name: 'cy', nodeName: 'cy', nodeValue: node['cy'], textContent: node['cy'], value: node['cy'] },
                    { childNodes: [], localName: 'rx', name: 'rx', nodeName: 'rx', nodeValue: node['rx'], textContent: node['rx'], value: node['rx'] },
                    { childNodes: [], localName: 'ry', name: 'ry', nodeName: 'ry', nodeValue: node['ry'], textContent: node['ry'], value: node['ry'] },
                ];
                break;
            case 'circle':
                specificAttr = [
                    { childNodes: [], localName: 'cx', name: 'cx', nodeName: 'cx', nodeValue: node['cx'], textContent: node['cx'], value: node['cx'] },
                    { childNodes: [], localName: 'cy', name: 'cy', nodeName: 'cy', nodeValue: node['cy'], textContent: node['cy'], value: node['cy'] },
                    { childNodes: [], localName: 'r', name: 'r', nodeName: 'r', nodeValue: node['r'], textContent: node['r'], value: node['r'] },
                ];
                break;
            case 'polyline':
                specificAttr = [
                    { childNodes: [], localName: 'points', name: 'points', nodeName: 'points', nodeValue: node['points'], textContent: node['points'], value: node['points'] },
                    { childNodes: [], localName: 'stroke-linecap', name: 'stroke-linecap', nodeName: 'stroke-linecap', nodeValue: node['stroke-linecap'], textContent: node['stroke-linecap'], value: node['stroke-linecap'] },
                    { childNodes: [], localName: 'stroke-linejoin', name: 'stroke-linejoin', nodeName: 'stroke-linejoin', nodeValue: node['stroke-linejoin'], textContent: node['stroke-linejoin'], value: node['stroke-linejoin'] },
                ];
                break;
            case 'path':
                specificAttr = [
                    { childNodes: [], localName: 'd', name: 'd', nodeName: 'd', nodeValue: node['d'], textContent: node['d'], value: node['d'] },
                ]
                break;
            case 'line':
                specificAttr = [
                    { childNodes: [], localName: 'x1', name: 'x1', nodeName: 'x1', nodeValue: node['x1'], textContent: node['x1'], value: node['x1'] },
                    { childNodes: [], localName: 'x2', name: 'x2', nodeName: 'x2', nodeValue: node['x2'], textContent: node['x2'], value: node['x2'] },
                    { childNodes: [], localName: 'y1', name: 'y1', nodeName: 'y1', nodeValue: node['y1'], textContent: node['y1'], value: node['y1'] },
                    { childNodes: [], localName: 'y2', name: 'y2', nodeName: 'y2', nodeValue: node['y2'], textContent: node['y2'], value: node['y2'] },
                ]
                break;
            default:
                break;
        }

        return {
            childNodes: [],
            children: [],
            localName: name,
            nodeName: name,
            nodeValue: null,
            tagName: name,
            textContent: '',
            indexNodeXML: node['indexNodeXML'],
            attributes: [...specificAttr, ...commonAttr]
        }

        
    }

    if (shapes.length) {
        shapes.forEach(element => {
            currentNodes.push(element);
        });

        // console.log('CurrentNode', currentNodes)
        currentNodes.forEach(node => {
            if (Array.isArray(node)) {
                node.forEach(nestedNode => {
                    currentNodes.push(nestedNode);
                })
            } else {
                result.push(processShape(node, type))
            }
        })
    } else {
        result.push(processShape(shapes, type))
    }

    return result;
}