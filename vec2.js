
/**
 * Represents a 2D column vector.
 * @constructor
 * @param {number} x - The x-coordinate of the vector.
 * @param {number} y - The y-coordinate of the vector.
 */
export function Vec2(x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

Vec2.prototype = {
    // set x and y
    set: function (x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    // reset x and y to zero
    zero: function () {
        this.x = 0;
        this.y = 0;
        return this;
    },

    // negate the values of this vector and return a new Vec2
    negate: function (returnNew = false) {
        if (returnNew) {
            return new Vec2(-this.x, -this.y);
        } else {
            this.x = -this.x;
            this.y = -this.y;
            return this;
        }
    },

    // Add the incoming `vec2` vector to this vector
    // TODO: mark dirty for other calcs
    add: function (vec2, returnNew = false) {
        returnNew ? 
            new Vec2(this.x + vec2.x, this.y + vec2.y) :
            (this.x += vec2.x, this.y += vec2.y, this);
        // if (!returnNew) {
        //     this.x += vec2.x;
        //     this.y += vec2.y;
        //     return this;
        // } else {
        //     // Return a new vector if `returnNew` is truthy
        //     return new Vec2(
        //         this.x + vec2.x,
        //         this.y + vec2.y
        //     );
        // }
    },

    // Subtract the incoming `vec2` from this vector
    subtract: function (vec2, returnNew = false) {
        return returnNew ? 
            new Vec2(this.x - vec2.x, this.y - vec2.y) : 
            (this.x -= vec2.x, this.y -= vec2.y, this);
    },

    // Multiply this vector by the incoming `vec2`
    multiply: function (vec2, returnNew = false) {
        let x, y;
        if (vec2.x !== undefined) (x = vec2.x, y = vec2.y); 
        else ( x = y = vec2);;
        
        return returnNew ? new Vec2(this.x * x, this.y * y) : (this.x *= x, this.y *= y, this);
        // if (vec2.x !== undefined) {
        //     x = vec2.x;
        //     y = vec2.y;

        //     // Handle incoming scalars
        // } else {
        //     x = y = vec2;
        // }

        // if (!returnNew) {
        //     this.x *= x;
        //     this.y *= y;
        //     return this;
        // } else {
        //     return new Vec2(
        //         this.x * x,
        //         this.y * y
        //     );
        // }
    },

    // Rotate this vector. Accepts a `Rotation` or angle in radians.
    //
    // Passing a truthy `inverse` will cause the rotation to
    // be reversed.
    //
    // If `returnNew` is truthy, a new
    // `Vec2` will be created with the values resulting from
    // the rotation. Otherwise the rotation will be applied
    // to this vector directly, and this vector will be returned.
    rotate: function (r, inverse = false, returnNew = false) {
        let x = this.x;
        let y = this.y;
        const isInverse = (inverse) ? -1 : 1;
        let cos;
        let sin;

        if (r.s !== undefined) {
            sin = r.s;
            cos = r.c;
        } else {
            sin = Math.sin(r);
            cos = Math.cos(r);
        }

        let rx = cos * x - (isInverse * sin) * y;
        let ry = (isInverse * sin) * x + cos * y;

        return returnNew ? new Vec2(rx, ry) : (this.set(rx, ry), this);

        // var
        //     x = this.x,
        //     y = this.y,
        //     rx, cos, sin, ry;

        // inverse = (inverse) ? -1 : 1;

        // if (r.s !== undefined) {
        //     sin = r.s;
        //     cos = r.c;
        // } else {
        //     sin = Math.sin(r);
        //     cos = Math.cos(r);
        // }

        // var
        //     x = this.x,
        //     y = this.y,
        //     rx = cos * x - (inverse * sin) * y,
        //     ry = (inverse * sin) * x + cos * y;

        // if (returnNew) {
        //     return new Vec2(rx, ry);
        // } else {
        //     this.set(rx, ry);
        //     return this;
        // }
    },

    // Calculate the length of this vector (the norm)
    length: function () {
        var x = this.x, y = this.y;
        return Math.sqrt(x * x + y * y);
    },

    // Get the length squared. For performance, use this instead of `Vec2#length` (if possible).
    lengthSquared: function () {
        var x = this.x, y = this.y;
        return x * x + y * y;
    },

    // Return the distance betwen this `Vec2` and the incoming vec2 vector and return a scalar
    distance: function (vec2) {
        // TODO: prime candidate for optimizations
        return this.subtract(vec2, true).length();
    },

    distanceSquared: function (vec2) {
        var c = this.subtract(vec2, true);
        return c * c;
    },

    // Convert this vector into a unit vector. Returns the length.
    normalize: function () {
        let length = this.length();

        // Don't bother normalizing a vector with a length ~0
        if (length < Number.MIN_VALUE) return 0;

        // Collect a ratio to shrink the x and y coords
        let invertedLength = 1 / length;

        // Convert the coords to be greater than zero but smaller than or equal to 1.0
        this.x *= invertedLength;
        this.y *= invertedLength;
        return length;
    },

    // Determine if another `Vec2`'s components match this ones
    equal: function (v, w = undefined) {
        return (w === undefined) ?
            (this.x === v.x && this.y === v.y) :
            (this.x === v && this.y === w);
    },
    
    // equal: function (v, w = undefined) {
    //     if (w === undefined) {
    //         return (
    //             this.x === v.x &&
    //             this.y === v.y
    //         );
    //     } else {
    //         return (
    //             this.x === v &&
    //             this.y === w
    //         )
    //     }
    // },

    // Return a new `Vec2` that contains the absolute value of
    // each of this vector's parts
    abs: function () {
        return new Vec2(Math.abs(this.x), Math.abs(this.y));
    },

    // Return a new `Vec2` consisting of the smallest values
    // from this vector and the incoming
    //
    // When returnNew is truthy, a new `Vec2` will be returned
    // otherwise the minimum values in either this or `v` will
    // be applied to this vector.
    min: function (v, returnNew = false) {
        let tx = this.x;
        let ty = this.y;
        let vx = v.x;
        let vy = v.y;
        let x = tx < vx ? tx : vx;
        let y = ty < vy ? ty : vy;
        // var
        //     tx = this.x,
        //     ty = this.y,
        //     vx = v.x,
        //     vy = v.y,
        //     x = tx < vx ? tx : vx,
        //     y = ty < vy ? ty : vy;

        return returnNew ? new Vec2(x, y) : (this.set(x, y), this);
        // if (returnNew) {
        //     return new Vec2(x, y);
        // } else {
        //     this.x = x;
        //     this.y = y;
        //     return this;
        // }
    },

    /**
     * Return a new `Vec2` consisting of the largest values from this vector and the incoming.
     * When `returnNew` is truthy, a new `Vec2` will be returned otherwise the minimum values 
     * in either this or `v` will be applied to this vector.
     */
    max: function (v, returnNew = false) {
        let tx = this.x;
        let ty = this.y;
        let vx = v.x;
        let vy = v.y;
        let x = tx > vx ? tx : vx;
        let y = ty > vy ? ty : vy;
        // var
        //     tx = this.x,
        //     ty = this.y,
        //     vx = v.x,
        //     vy = v.y,
        //     x = tx > vx ? tx : vx,
        //     y = ty > vy ? ty : vy;

        return returnNew ? new Vec2(x, y) : (this.set(x, y), this);
        // if (returnNew) {
        //     return new Vec2(x, y);
        // } else {
        //     this.x = x;
        //     this.y = y;
        //     return this;
        // }
    },

    // Clamp values into a range.
    // If this vector's values are lower than the `low`'s
    // values, then raise them.  If they are higher than
    // `high`'s then lower them.
    //
    // Passing returnNew as true will cause a new Vec2 to be
    // returned.  Otherwise, this vector's values will be clamped
    // clamp: function (low, high, returnNew) {
    //     var ret = this.min(high, true).max(low)
    //     if (returnNew) {
    //         return ret;
    //     } else {
    //         this.x = ret.x;
    //         this.y = ret.y;
    //         return this;
    //     }
    // },

    // Ensure this vector contains finite values
    isValid: function () {
        return isFinite(this.x) && isFinite(this.y);
    },

    // Get the skew vector such that dot(skew_vec, other) == cross(vec, other)
    skew: function () {
        // Returns a new vector.
        return new Vec2(-this.y, this.x)
    }
};

