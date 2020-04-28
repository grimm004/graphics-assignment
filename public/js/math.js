const mat4 = glMatrix.mat4;
const vec2 = glMatrix.vec2;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

Math.clamp = (x, min, max) => Math.min(Math.max(x, min), max);
Math.radians = (degrees) => Math.PI * degrees / 180.0;
Math.degrees = (radians) => 180.0 * radians / Math.PI;
Math.lerp = (a, b, v) => (a * (1 - v)) + (b * v);


class Matrix4 {
    constructor(value = undefined) {
        this.elements = new Float32Array(16);

        if (value instanceof Matrix4)
            this.elements = new Float32Array(value.elements);
        else if (value instanceof Float32Array || value instanceof Array) {
            for (let i = 0; i < Math.max(16, value.length); i++)
                this.elements[i] = value[i];
        } else this.elements = mat4.create();
    }

    get copy() {
        return new Matrix4(this);
    }

    transpose() {
        mat4.transpose(this.elements, this.elements);
        return this;
    }

    invert() {
        mat4.invert(this.elements, this.elements);
        return this;
    }

    multiply(rhs) {
        mat4.mul(this.elements, this.elements, rhs.elements);
        return this;
    }

    mul(rhs) {
        this.multiply(rhs);
        return this;
    }

    multiplyLeft(lhs) {
        mat4.mul(this.elements, lhs.elements, this.elements);
        return this;
    }

    mull(lhs) {
        this.multiplyLeft(lhs);
        return this;
    }

    scale(scaleVector, concat = true) {
        if (!concat) this.identity();
        mat4.scale(this.elements, this.elements, scaleVector.elements);
        return this;
    }

    static scale(scaleVector) {
        return new Matrix4().scale(scaleVector);
    }

    rotate(angleRad, axisVector, concat = true) {
        if (!concat) this.identity();
        mat4.rotate(this.elements, this.elements, angleRad, axisVector.elements);
        return this;
    }

    static rotate(angleRad, axisVector) {
        return new Matrix4().scale(angleRad, axisVector);
    }

    translate(translationVector, concat = true) {
        if (!concat) this.identity();
        mat4.translate(this.elements, this.elements, translationVector.elements);
        return this;
    }

    static translate(translationVector) {
        return new Matrix4().scale(translationVector);
    }


    identity() {
        mat4.identity(this.elements);
        return this;
    }

    static get identity() {
        return new Matrix4();
    }

    perspective(fov, aspectRatio, near, far, concat = true) {
        if (!concat) this.identity();
        mat4.perspective(this.elements, fov, aspectRatio, near, far);
        return this;
    }

    static perspective(fov, aspectRatio, near, far) {
        return new Matrix4().perspective(fov, aspectRatio, near, far);
    }

    lookAt(eyeVector, centerVector, upVector) {
        mat4.lookAt(this.elements, eyeVector.elements, centerVector.elements, upVector.elements);
        return this;
    }

    static createLookAt(eyeVector, centerVector, upVector) {
        return new Matrix4().lookAt(eyeVector, centerVector, upVector);
    }

    targetTo(eyeVector, centerVector, upVector, concat = true) {
        if (!concat) this.identity();
        mat4.lookAt(this.elements, eyeVector.elements, centerVector.elements, upVector.elements);
        return this;
    }

    static createTargetTo(eyeVector, centerVector, upVector) {
        return new Matrix4().targetTo(eyeVector, centerVector, upVector);
    }
}


class Vector2 {
    constructor(x = undefined, y = undefined) {
        this.x = this.y = 0.0;

        if (typeof x === "number") {
            this.x = x;
            this.y = typeof y === "number" ? y : this.x;
        } else if (x instanceof Vector2) {
            this.x = x.x;
            this.y = x.y;
        } else if (x instanceof Float32Array || x instanceof Array)
            this.elements = x;
    }

    get copy() {
        return new Vector2(this);
    }

    get sum() {
        return this.x + this.y;
    }

    get elements() {
        return new Float32Array([this.x, this.y]);
    }

    set elements(value) {
        [this.x, this.y] = value.slice(0, 2);
    }

    normalise() {
        const elements = this.elements;
        vec2.normalize(elements, elements);
        this.elements = elements;
    }

    map(f) {
        this.x = f(this.x);
        this.y = f(this.y);
        return this;
    }

    negate() {
        this.x *= -1;
        this.y *= -1;
        return this;
    }

    invert() {
        this.x = 1 / this.x;
        this.y = 1 / this.y;
        return this;
    }

    add(val) {
        if (val instanceof Vector2) {
            this.x += val.x;
            this.y += val.y;
        } else if (typeof val === "number")
            this.add(new Vector2(val));
        return this;
    }

    mul(val) {
        if (val instanceof Vector2) {
            this.x *= val.x;
            this.y *= val.y;
        } else if (typeof val === "number")
            this.mul(new Vector2(val));
        return this;
    }

    sub(val) {
        this.add(val instanceof Vector2 ? val.copy.negate() : new Vector2(-val));
        return this;
    }

    div(val) {
        this.mul(val instanceof Vector2 ? val.copy.invert() : new Vector2(1.0 / val));
        return this;
    }

    dot(vec) {
        return (this.x * vec.x) + (this.y * vec.y);
    }

    magnitudeSquared() {
        return (this.x * this.x) + (this.y * this.y);
    }

    magnitude() {
        return Math.hypot(this.x, this.y);
    }

    static get zeros() {
        return new Vector2();
    }

    static get ones() {
        return new Vector2(1.0);
    }
}


class Vector3 {
    constructor(x = undefined, y = undefined, z = undefined) {
        this.x = this.y = this.z = 0.0;
        if (typeof x === "number") {
            this.x = x;
            this.y = typeof y === "number" ? y : this.x;
            this.z = typeof z === "number" ? z : this.y;
        } else if (x instanceof Vector3) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        } else if (x instanceof Vector2) {
            this.x = x.x;
            this.y = x.y;
            this.z = typeof y == "number" ? y : 0.0;
        } else if (x instanceof Float32Array || x instanceof Array)
            this.elements = x;
    }

    get copy() {
        return new Vector3(this);
    }

    get sum() {
        return this.x + this.y + this.z;
    }

    get elements() {
        return new Float32Array([this.x, this.y, this.z]);
    }

    set elements(value) {
        [this.x, this.y, this.z] = value.slice(0, 3);
    }

    normalise() {
        const elements = this.elements;
        vec3.normalize(elements, elements);
        this.elements = elements;
        return this;
    }

    map(f) {
        this.x = f(this.x);
        this.y = f(this.y);
        this.z = f(this.z);
        return this;
    }

    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }

    invert() {
        this.x = 1 / this.x;
        this.y = 1 / this.y;
        this.z = 1 / this.z;
        return this;
    }

    add(val) {
        if (val instanceof Vector3) {
            this.x += val.x;
            this.y += val.y;
            this.z += val.z;
        } else if (typeof val === "number")
            this.add(new Vector3(val));
        return this;
    }

    mul(val) {
        if (val instanceof Vector3) {
            this.x *= val.x;
            this.y *= val.y;
            this.z *= val.z;
        } else if (typeof val === "number")
            this.mul(new Vector3(val));
        return this;
    }

    sub(val) {
        this.add(val instanceof Vector3 ? val.copy.negate() : new Vector3(-val));
        return this;
    }

    div(val) {
        this.mul(val instanceof Vector3 ? val.copy.invert() : new Vector3(1.0 / val));
        return this;
    }

    dot(vec) {
        return (this.x * vec.x) + (this.y * vec.y) + (this.z * vec.z);
    }

    magnitudeSquared() {
        return (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
    }

    magnitude() {
        return Math.hypot(this.x, this.y, this.z);
    }

    static get zeros() {
        return new Vector3();
    }

    static get ones() {
        return new Vector3(1.0);
    }
}


class Vector4 {
    constructor(x = undefined, y = undefined, z = undefined, w = undefined) {
        this.x = this.y = this.z = 0.0;
        this.w = 1.0;
        if (typeof x === "number") {
            this.x = x;
            this.y = typeof y === "number" ? y : this.x;
            this.z = typeof z === "number" ? z : this.y;
            this.w = typeof w === "number" ? w : 1.0;
        } else if (x instanceof Vector4) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            this.w = x.w;
        } else if (x instanceof Vector3) {
            this.x = x.x;
            this.y = x.y;
            this.z = typeof y == "number" ? y : 0.0;
        } else if (x instanceof Vector2) {
            this.x = x.x;
            this.y = x.y;
            if (y instanceof Vector2) {
                this.z = y.x;
                this.w = y.y;
            } else if (typeof y === "number") {
                this.z = y;
                this.w = typeof z === "number" ? z : 1.0;
            }
        } else if (x instanceof Float32Array || x instanceof Array)
            this.elements = x;
    }

    get copy() {
        return new Vector4(this);
    }

    get sum() {
        return this.x + this.y + this.z;
    }

    get elements() {
        return new Float32Array([this.x, this.y, this.z, this.w]);
    }

    set elements(value) {
        [this.x, this.y, this.z, this.w] = value.slice(0, 4);
    }

    normalise() {
        const elements = this.elements;
        vec4.normalize(elements, elements);
        this.elements = elements;
    }

    map(f, includeW = false) {
        this.x = f(this.x);
        this.y = f(this.y);
        this.z = f(this.z);
        if (includeW)
            this.w = f(this.w);
        return this;
    }

    negate(includeW = false) {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        if (includeW)
            this.w *= -1;
        return this;
    }

    invert(includeW = false) {
        this.x = 1 / this.x;
        this.y = 1 / this.y;
        this.z = 1 / this.z;
        if (includeW)
            this.w = 1 / this.w;
        return this;
    }

    add(val, includeW = false) {
        if (val instanceof Vector4) {
            this.x += val.x;
            this.y += val.y;
            this.z += val.z;
            if (includeW)
                this.w += val.w;
        } else if (typeof val === "number")
            this.add(new Vector4(val), includeW);
        return this;
    }

    mul(val, includeW = false) {
        if (val instanceof Vector4) {
            this.x *= val.x;
            this.y *= val.y;
            this.z *= val.z;
            if (includeW)
                this.w *= val.w;
        } else if (typeof val === "number")
            this.mul(new Vector4(val), includeW);
        return this;
    }

    sub(val, includeW = false) {
        this.add(val instanceof Vector4 ? val.copy.negate() : new Vector4(-val), includeW);
        return this;
    }

    div(val, includeW = false) {
        this.mul(val instanceof Vector4 ? val.copy.invert() : new Vector4(1.0 / val), includeW);
        return this;
    }

    dot(vec, includeW = false) {
        return (this.x * vec.x) + (this.y * vec.y) + (this.z * vec.z) + (includeW ? this.w * vec.w : 0);
    }

    magnitudeSquared(includeW) {
        return (this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (includeW ? this.w * this.w : 0);
    }

    magnitude(includeW) {
        return Math.hypot(this.x, this.y, this.z, includeW ? this.w : 0);
    }

    static get zeros() {
        return new Vector4();
    }

    static get ones() {
        return new Vector4(1.0);
    }
}


class Colour {
    constructor(r, g, b, a) {
        const vec = new Vector4(r, g, b, a);
        this.r = vec.x;
        this.g = vec.y;
        this.b = vec.z;
        this.a = vec.w;
    }

    toVector3() {
        return new Vector3(this.r, this.g, this.b);
    }

    toVector4() {
        return new Vector4(this.r, this.g, this.b, this.a);
    }

    get elements() {
        return new Float32Array([this.r, this.g, this.b, this.a]);
    }

    set elements(value) {
        [this.r, this.g, this.b, this.a] = value.slice(0, 4);
    }
}