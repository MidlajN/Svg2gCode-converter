// import { getGs, getSVGShape } from './getElements.js'

export function getRepresentation(tree) {
    const svgElements = { rect: [], polygon: [], ellipse: [], circle: [], path: [], line: [], polylines: [] };
    const node = { childNodes: [] };

    const processShapes = (shapes, name) => {
        shapes.forEach(shape => {
            const shapeGroup = getSVGShape(shape, name);
            shapeGroup.forEach(g => node.childNodes.push(g));
        });
    };

    if (tree.g) {
        getGs(tree.g, svgElements);
        Object.entries(svgElements).forEach(([key, data]) => processShapes(data, key));
    }

    const shapeData = [
        { name: 'rect', data: tree.rect },
        { name: 'polygon', data: tree.polygon },
        { name: 'ellipse', data: tree.ellipse },
        { name: 'circle', data: tree.circle },
        { name: 'path', data: tree.path },
        { name: 'line', data: tree.line },
        { name: 'polyline', data: tree.polyline }
    ];

    shapeData.forEach(({ name, data }) => {
        if (data) {
            const shapeGroup = getSVGShape(data, name);
            shapeGroup.forEach(g => node.childNodes.push(g));
        }
    });

    node.childNodes.sort((node1, node2) => node1.indexNodeXML - node2.indexNodeXML);

    console.log('node ', node)
    return node;
}


export function getGs(treeG, gs) {
    if (!treeG) return;

    const processNode = (node, gs) => {
        for (const shapeType in node) {
            if (shapeType in gs) {
                gs[shapeType].push(node[shapeType]);
            } else if (shapeType === 'g') {
                getGs(node[shapeType], gs);
            }
        }
    }

    if (Array.isArray(treeG)) treeG.forEach(element => processNode(element, gs));
    else processNode(treeG, gs);

    return gs
}


export function getSVGShape(shapes, type) {
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

    let currentNodes = [];
    if (shapes.length) {
        shapes.forEach(element => currentNodes.push(element));

        currentNodes.forEach(node => {
            if (Array.isArray(node)) node.forEach(nestedNode => currentNodes.push(nestedNode));
            else result.push(processShape(node, type))
        })
    } else {
        result.push(processShape(shapes, type))
    }

    return result;
}