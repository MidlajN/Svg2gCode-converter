export class PathParser {
    constructor(config) {
        this.tolerance = config.tolerance
        this.tolerance_squared = Math.pow(this.tolerance, 2);
        // this.totalMaxScale = 1;
    }

    parse (d, node) {
        let x = 0;
        let y = 0;
        let cmdPrev = '';
        let xPrevCp;
        let yPrevCp;
        let subpath = [];
        let commands = this.parseCommands(d);

        const totalMaxScale = this.matrixGetScale(node.xformToWorld);
        let tolerance_squared = this.tolerance_squared;

        if (totalMaxScale !== 0) {
            tolerance_squared /= Math.pow(totalMaxScale, 2);
        }

        // console.log('totalMaxScale -> ', totalMaxScale)
        // console.log('Tolerance Squared ->', tolerance_squared);

        const nextIsNum = () => {
            return (commands.length > 0) && (typeof (commands[0]) === 'number');
        }

        const getNext = () => {
            if (commands.length > 0) return commands.shift();  // pop first item
            else throw new Error("in addPath: not enough parameters");
        }

        const moveTo = (isRelative) => {
            if (subpath.length > 0) (node.path.push(subpath), subpath = []);
            if (cmdPrev == '' && isRelative) {
                // first treated absolute
                x = getNext();
                y = getNext();
                subpath.push([x, y]);
            }
            while(nextIsNum()) {
                x = isRelative ? x + getNext() : getNext();
                y = isRelative ? y + getNext() : getNext();
                subpath.push([x, y]);
            }
        }

        const lineTo = (isRelative) => {
            while(nextIsNum()) {
                x = isRelative ? x + getNext() : getNext();
                y = isRelative ? y + getNext() : getNext();
                subpath.push([x, y]);
            }
        }

        const horizontalLineTo = (isRelative) => {
            while(nextIsNum()) {
                x = isRelative ? x + getNext() : getNext();
                subpath.push([x, y]);
            }
        }

        const verticalLineTo = (isRelative) => {
            while(nextIsNum()) {
                y = isRelative ? y + getNext() : getNext();
                subpath.push([x, y]);
            }
        }

        const curveToCubic = (isRelative) => {
            while(nextIsNum()) {
                let x2 = isRelative ? x + getNext() : getNext();
                let y2 = isRelative ? y + getNext() : getNext();
                let x3 = isRelative ? x + getNext() : getNext();
                let y3 = isRelative ? y + getNext() : getNext();
                let x4 = isRelative ? x + getNext() : getNext();
                let y4 = isRelative ? y + getNext() : getNext();

                subpath.push([x, y]);
                this.addCubicBezier(subpath, x, y, x2, y2, x3, y3, x4, y4, 0, tolerance_squared);
                subpath.push([x4, y4]);
                x = x4;
                y = y4;
                xPrevCp = x3;
                yPrevCp = y3;
            }
        }

        const curveToCubicSmooth = (isRelative) => {
            while(nextIsNum()) {
                let x2 = (cmdPrev.match(/[CcSs]/)) ? x - (xPrevCp - x) : x;
                let y2 = (cmdPrev.match(/[CcSs]/)) ? y - (yPrevCp - y) : y;
                let x3 = isRelative ? x + getNext() : getNext();
                let y3 = isRelative ? y + getNext() : getNext();
                let x4 = isRelative ? x + getNext() : getNext();
                let y4 = isRelative ? y + getNext() : getNext();

                subpath.push([x, y]);
                this.addCubicBezier(subpath, x, y, x2, y2, x3, y3, x4, y4, 0, tolerance_squared);
                subpath.push([x4, y4]);
                x = x4;
                y = y4;
                xPrevCp = x3;
                yPrevCp = y3;
            }
        }

        const curveToQuadratic = (isRelative) => {
            while(nextIsNum()) {
                let x2 = isRelative ? x + getNext() : getNext();
                let y2 = isRelative ? y + getNext() : getNext();
                let x3 = isRelative ? x + getNext() : getNext();
                let y3 = isRelative ? y + getNext() : getNext();

                subpath.push([x, y]);
                this.addQuadraticBezier(subpath, x, y, x2, y2, x3, y3, 0, tolerance_squared);
                subpath.push([x3, y3]);
                x = x3;
                y = y3;
            }
        }

        const curveToQuadraticSmooth = (isRelative) => {
            while(nextIsNum()) {
                let x2 = (cmdPrev.match(/[CcSs]/)) ? x - (xPrevCp - x) : x;
                let y2 = (cmdPrev.match(/[CcSs]/)) ? y - (yPrevCp - y) : y;
                let x3 = isRelative ? x + getNext() : getNext();
                let y3 = isRelative ? y + getNext() : getNext();

                subpath.push([x, y]);
                this.addQuadraticBezier(subpath, x, y, x2, y2, x3, y3, 0, tolerance_squared);
                subpath.push([x3, y3]);
                x = x3;
                y = y3;
                xPrevCp = x3;
                yPrevCp = y3;
            }
        }

        const arcTo = (isRelative) => {
            while(nextIsNum()) {
                let rx = getNext();
                let ry = getNext();
                let x_axis_rotation = getNext();
                let large_arc_flag = getNext();
                let sweep_flag = getNext();
                let x2 = isRelative ? x + getNext() : getNext();
                let y2 = isRelative ? y + getNext() : getNext();

                this.addArc(subpath, x, y, rx, ry, x_axis_rotation, large_arc_flag, sweep_flag, x2, y2, tolerance_squared);
                x = x2;
                y = y2;
            }
        }

        const finalizeSupPath = () => {
            if (subpath.length > 0) {
                subpath.push(subpath[0]);  // close the path to M
                node.path.push(subpath);
                x = subpath[subpath.length - 1][0];
                y = subpath[subpath.length - 1][1];
                subpath = [];
            }
        }

        while (commands.length > 0) {
            let cmd = getNext(); // Pop first item
            const isRelative = cmd.toLowerCase() === cmd;

            switch (cmd.toUpperCase()) {
                case 'M':
                    moveTo(isRelative);
                    break;
                case 'L':
                    lineTo(isRelative);
                    break;
                case 'H':
                    horizontalLineTo(isRelative);
                    break;
                case 'V':
                    verticalLineTo(isRelative);
                    break;
                case 'C':
                    curveToCubic(isRelative);
                    break;
                case 'S':
                    curveToCubicSmooth(isRelative);
                    break;
                case 'Q':
                    curveToQuadratic(isRelative);
                    break;
                case 'T':
                    curveToQuadraticSmooth(isRelative);
                    break;
                case 'A':
                    arcTo(isRelative);
                    break;
                case 'Z':
                    finalizeSupPath();
                    break;
            }
            cmdPrev = cmd;
        }
        // Finalize last subpath
        finalizeSupPath();
    }

    parseCommands (d) {
        if (typeof d === 'string') {
            let commands = d.match(/([A-Za-z]|-?[0-9]+\.?[0-9]*(?:e-?[0-9]*)?)/g);
            commands.forEach((command, index) => {
                const num = parseFloat(command);
                if (!isNaN(num)) {
                    commands[index] = num;
                }
            })
            return commands;
        }
        return d;
    }

    /**
     * Based on DeCasteljau Algorithm
     * 
     * The reason we use a subdivision algo over an incremental one is that
     * we want to have control over the deviation to the curve. This means we subdivide 
     * more and have more curve points in curvy areas and less in flatter areas of the curve.
     * 
     * @param {Array} subpath - The subpath to add the curve to.
     * @param {number} x1 - The x-coordinate of the first control point.
     * @param {number} y1 - The y-coordinate of the first control point.
     * @param {number} x2 - The x-coordinate of the second control point.
     * @param {number} y2 - The y-coordinate of the second control point.
     * @param {number} x3 - The x-coordinate of the third control point.
     * @param {number} y3 - The y-coordinate of the third control point.
     * @param {number} x4 - The x-coordinate of the fourth control point.
     * @param {number} y4 - The y-coordinate of the fourth control point.
     * @param {number} xPrevCp - The x-coordinate of the previous control point.
     * @param {number} yPrevCp - The y-coordinate of the previous control point.
     */
    addCubicBezier(subpath, x1, y1, x2, y2, x3, y3, x4, y4, level, tolerance) {
        if (level > 18) return; // Protect from deep recursion

        // Calculate all the midpoints of the line segments
        let x12 = (x1 + x2) / 2.0;
        let y12 = (y1 + y2) / 2.0;
        let x23 = (x2 + x3) / 2.0;
        let y23 = (y2 + y3) / 2.0;
        let x34 = (x3 + x4) / 2.0;
        let y34 = (y3 + y4) / 2.0;
        let x123 = (x12 + x23) / 2.0;
        let y123 = (y12 + y23) / 2.0;
        let x234 = (x23 + x34) / 2.0;
        let y234 = (y23 + y34) / 2.0;
        let x1234 = (x123 + x234) / 2.0;
        let y1234 = (y123 + y234) / 2.0;

        // Try to approximate the full cubic curve by a s single straight line
        let dx = x4 - x1;
        let dy = y4 - y1;
        
        let d2 = Math.abs(((x2 - x4) * dy - (y2 - y4) * dx));
        let d3 = Math.abs(((x3 - x4) * dy - (y3 - y4) * dx));

        if (Math.pow(d2 + d3, 2) < 5.0 * tolerance * (dx * dx + dy * dy)) {
            subpath.push([x4, y4]);
            return;
        }

        // Continue subdivision
        this.addCubicBezier(subpath, x1, y1, x12, y12, x123, y123, x1234, y1234, level++, tolerance);
        this.addCubicBezier(subpath, x1234, y1234, x234, y234, x34, y34, x4, y4, level++, tolerance);
    }

    addQuadraticBezier(subpath, x1, y1, x2, y2, x3, y3, level, tolerance) {
        if (level > 18) return; // Protect from deep recursion

        // Calculate all the midpoints of the line segments
        let x12 = (x1 + x2) / 2.0;
        let y12 = (y1 + y2) / 2.0;
        let x23 = (x2 + x3) / 2.0;
        let y23 = (y2 + y3) / 2.0;
        let x123 = (x12 + x23) / 2.0;
        let y123 = (y12 + y23) / 2.0;

        let dx = x3 - x1;
        let dy = y3 - y1;
        let d = Math.abs(((x2 - x3) * dy - (y2 - y3) * dx));

        if (d * d <= 5.0 * tolerance * (dx * dx + dy * dy)) {
            subpath.push([x123, y123]);
            return;
        }

        // Continue Subdivision
        this.addQuadraticBezier(subpath, x1, y1, x12, y12, x123, y123, level++, tolerance);
        this.addQuadraticBezier(subpath, x123, y123, x23, y23, x3, y3, level++, tolerance);
    }

    /**
     *  Implemented Based On the SVG Implementation Notes
     *  plus some recursive sugar for incrementally refining
     *  the arc resolution until the requested tolerance is met
     *  https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
     *
     * @param {Array} subpath - The subpath to add the arc to.
     * @param {number} x - The x-coordinate of the starting point of the arc.
     * @param {number} y - The y-coordinate of the starting point of the arc.
     * @param {number} rx - The x-radius of the arc.
     * @param {number} ry - The y-radius of the arc.
     * @param {number} x_axis_rotation - The rotation of the x-axis in degrees.
     * @param {number} large_arc_flag - A flag indicating whether the arc should be drawn in a large or small arc.
     * @param {number} sweep_flag - A flag indicating whether the arc should be drawn in a clockwise or counter-clockwise direction.
     * @param {number} x2 - The x-coordinate of the ending point of the arc.
     * @param {number} y2 - The y-coordinate of the ending point of the arc.
     * @param {number} tolerance - The tolerance for the arc approximation.
     */
    addArc(subpath, x1, y1, rx, ry, x_axis_rotation, large_arc_flag, sweep, x2, y2, tolerance) {
        let cp = Math.cos(x_axis_rotation);
        let sp = Math.sin(x_axis_rotation);

        let dx = 0.5 * (x1 - x2);
        let dy = 0.5 * (y1 - y2);

        let x_ = cp * dx + sp * dy;
        let y_ = -sp * dx + cp * dy;

        let r2 = (Math.pow(rx * ry, 2) - Math.pow(rx * y_, 2) - Math.pow(ry * x_, 2)) / (Math.pow(rx * y_, 2) + Math.pow(ry * x_, 2));
        if (r2 < 0.0) r2 = 0.0;
        r2 = Math.sqrt(r2);

        if (large_arc_flag == sweep) r2 = -r2;
        let cx_ = r2 * rx * y_ / ry;
        let cy_ = -r2 * ry * x_ / rx;
        let cx = cp * cx_ - sp * cy_ + (x1 + x2) / 2.0;
        let cy = sp * cx_ + cp * cy_ + (y1 + y2) / 2.0;

        const angle = (u, v) => {
            let angle = Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.sqrt((Math.pow(u[0], 2) + Math.pow(u[1], 2)) * (Math.pow(v[0], 2) + Math.pow(v[1], 2))));
            let sign = (u[0] * v[1] > u[1] * v[0]) ? 1.0 : -1.0;
            return sign * angle;
        };

        const getVertex = (pct) => {
            let psi = angle([1, 0], [(x_ - cx_) / rx, (y_ - cy_) / ry]);
            let delta = angle([(x_ - cx_) / rx, (y_ - cy_) / ry], [(-x_ - cx_) / rx, (-y_ - cy_) / ry]);
            if (sweep && delta < 0) delta += Math.PI * 2;
            if (!sweep && delta > 0) delta -= Math.PI * 2;
            let theta = psi + delta * pct;
            let ct = Math.cos(theta);
            let st = Math.sin(theta);
            return [cp * rx * ct - sp * ry * st + cx, sp * rx * ct + cp * ry * st + cy];
        }

        const vertexDistanceSquared = (v1, v2) => {
            return Math.pow(v2[0] - v1[0], 2) + Math.pow(v2[1] - v1[1], 2);
        }

        const vertexMiddle = (v1, v2) => {
            return [(v2[0] + v1[0]) / 2.0, (v2[1] + v1[1]) / 2.0];
        }

        function recursiveArc(t1, t2, c1, c5, level, tolerance2) {
            if (level > 18) return; // prevent infinite recursion

            let tRange = t2 - t1;
            let tHalf = t1 + 0.5 * tRange;
            let c2 = getVertex(t1 + 0.25 * tRange);
            let c3 = getVertex(tHalf);
            let c4 = getVertex(t1 + 0.75 * tRange);

            if (vertexDistanceSquared(c2, vertexMiddle(c1, c3)) > tolerance2) {
                recursiveArc(t1, tHalf, c1, c3, level + 1, tolerance2);
            }
            subpath.push(c3);
            if (vertexDistanceSquared(c4, vertexMiddle(c3, c5)) > tolerance2) {
                recursiveArc(tHalf, t2, c3, c5, level + 1, tolerance2);
            }
        }

        let t1Init = 0.0;
        let t2Init = 1.0;
        let c1Init = getVertex(t1Init);
        let c5Init = getVertex(t2Init);

        subpath.push(c1Init);
        recursiveArc(t1Init, t2Init, c1Init, c5Init, 0, tolerance);
        subpath.push(c5Init);
    }

    matrixGetScale(mat) {
        let sx = Math.sqrt(mat[0] * mat[0] + mat[1] * mat[1]);
        let sy = Math.sqrt(mat[2] * mat[2] + mat[3] * mat[3]);
        if (sx > sy) return sx; 
        else return sy;
    }
}