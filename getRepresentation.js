
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

    return node;
}


function getGs(treeG, gs) {
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


function getSVGShape(shapes, type) {
    let result = [];

    const processShape = (node, name) => {
        const commonAttr = [
            { name: 'fill', value: node['fill'] },
            { name: 'stroke', value: node['stroke'] },
            { name: 'stroke-miterlimit', value: node['stroke-miterlimit'] },
            { 'name': 'transform', 'value': node['transform'] },
            { name: 'stroke-width', value: node['stroke-width'] },
        ]

        let specificAttr = []
        switch (name) {
            case 'rect':
                specificAttr = [
                    { name: 'x', value: node['x'] },
                    { name: 'y', value: node['y'] },
                    { name: 'width', value: node['width'] },
                    { name: 'height', value: node['height'] },
                ];
                break;
            case 'polygon':
                specificAttr = [
                    {  name: 'points', value: treePolygons['points'] },
                ];
                break;
            case 'ellipse':
                specificAttr = [
                    { name: 'cx', value: node['cx'] },
                    { name: 'cy', value: node['cy'] },
                    { name: 'rx', value: node['rx'] },
                    { name: 'ry', value: node['ry'] },
                ];
                break;
            case 'circle':
                specificAttr = [
                    { name: 'cx', value: node['cx'] },
                    { name: 'cy', value: node['cy'] },
                    { name: 'r', value: node['r'] },
                ];
                break;
            case 'polyline':
                specificAttr = [
                    { name: 'points', value: node['points'] },
                    { name: 'stroke-linecap', value: node['stroke-linecap'] },
                    { name: 'stroke-linejoin', value: node['stroke-linejoin'] },
                ];
                break;
            case 'path':
                specificAttr = [
                    { name: 'd', value: node['d'] },
                ]
                break;
            case 'line':
                specificAttr = [
                    { name: 'x1', value: node['x1'] },
                    { name: 'x2', value: node['x2'] },
                    { name: 'y1', value: node['y1'] },
                    { name: 'y2', value: node['y2'] },
                ]
                break;
            default:
                break;
        }

        return {
            childNodes: [],
            // children: [],
            // localName: name,
            // nodeName: name,
            // nodeValue: null,
            tagName: name,
            // textContent: '',
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