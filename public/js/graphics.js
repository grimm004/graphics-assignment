"use strict";

class Texture {
    constructor(gl, image, slot = 0) {
        this.gl = gl;

        this.id = gl.createTexture();
        this.slot = slot;

        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    bind() {
        this.gl.activeTexture(this.gl.TEXTURE0 + this.slot);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    }
}

class Shader {
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        this.gl = gl;

        this.id = this.createProgram(vertexShaderSource, fragmentShaderSource);

        this.cache = {
            attributes: {},
            uniforms: {}
        };
    }

    createProgram(vertexShaderSource, fragmentShaderSource, samplerName = "uSampler") {
        const glVertexShader = Shader.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        if (!glVertexShader) return -1;

        const glFragmentShader = Shader.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!glFragmentShader) return -1;

        this.samplerName = samplerName;

        const id = this.gl.createProgram();
        this.gl.attachShader(id, glVertexShader);
        this.gl.attachShader(id, glFragmentShader);
        this.gl.linkProgram(id);

        this.gl.deleteShader(glVertexShader);
        this.gl.deleteShader(glFragmentShader);

        if (this.gl.getProgramParameter(id, this.gl.LINK_STATUS)) return id;

        console.error("Could not link shader program: " + this.gl.getProgramInfoLog(id));
        this.gl.deleteProgram(id);
        return -1;
    }

    getAttrib(name) {
        if (!this.cache.attributes.hasOwnProperty(name))
            this.cache.attributes[name] = this.gl.getAttribLocation(this.id, name);
        if (this.cache.attributes[name] === -1)
            throw new Error(`Unknown attribute name: ${name}`);
        return this.cache.attributes[name];
    }

    getUniform(name) {
        if (!this.cache.uniforms.hasOwnProperty(name))
            this.cache.uniforms[name] = this.gl.getUniformLocation(this.id, name);
        if (this.cache.uniforms[name] === null)
            throw new Error(`Unknown uniform name: ${name}`);
        return this.cache.uniforms[name];
    }

    setUniform(name, value) {
        const uniform = this.getUniform(name);
        if (value instanceof Matrix4)
            this.gl.uniformMatrix4fv(uniform, false, value.elements);
        else if (value instanceof Vector2)
            this.gl.uniform2fv(uniform, value.elements);
        else if (value instanceof Vector3)
            this.gl.uniform3fv(uniform, value.elements);
        else if (value instanceof Vector4 || value instanceof Colour)
            this.gl.uniform4fv(uniform, value.elements);
        else
            throw new Error(`Unknown uniform type for '${name}'.`);
    }

    setUniforms(uniforms) {
        Object.entries(uniforms).forEach(([name, value]) => this.setUniform(name, value));
    }

    setUniform1i(name, value) {
        this.gl.uniform1i(this.getUniform(name), value);
    }

    bind(uniforms = undefined) {
        this.gl.useProgram(this.id);
        if (typeof uniforms === "object")
            this.setUniforms(uniforms);
    }

    setTexture(texture) {
        this.setUniform1i(this.samplerName, texture.slot);
    }

    static loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            return shader;

        console.error("Could not compile shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
}

class Buffer {
    constructor(gl, type, typedData, accessType = gl.STATIC_DRAW) {
        this.gl = gl;

        this.type = type;
        this.length = typedData.length;
        this.id = gl.createBuffer();
        gl.bindBuffer(type, this.id);
        gl.bufferData(type, typedData, accessType);
    }

    bind() {
        this.gl.bindBuffer(this.type, this.id);
    }
}

class VertexBuffer extends Buffer {
    constructor(gl, vertexData) {
        super(gl, gl.ARRAY_BUFFER, new Float32Array(vertexData));
    }
}

class IndexBuffer extends Buffer {
    constructor(gl, indexData) {
        super(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData));
    }
}

class VertexBufferLayout {
    constructor(gl) {
        this.gl = gl;
        this.attributes = [];
        this.stride = 0;
    }

    addAttribute(location, count, glType = this.gl.FLOAT, normalise = false, offset = 0) {
        if (location === -1) throw new Error(`Unknown attribute location (layout element ${this.attributes.length}).`);
        const size = this.getSizeOfType(glType);
        this.attributes.push({location, count, type: glType, normalise, size, offset});
        this.stride += offset + (count * size);
    }

    getSizeOfType(type) {
        switch (type) {
            case this.gl.UNSIGNED_BYTE:
            case this.gl.BYTE:
                return 1;
            case this.gl.SHORT:
            case this.gl.UNSIGNED_SHORT:
                return 2;
            case this.gl.FLOAT:
            case this.gl.INT:
            case this.gl.UNSIGNED_INT:
                return 4;
            default:
                throw Error(`Unsupported type: ${type}`);
        }
    }
}

class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.id = gl.createVertexArray();
    }

    addBuffer(buffer, layout) {
        this.bind();
        buffer.bind();
        let offset = 0;
        for (let i = 0; i < layout.attributes.length; i++) {
            const attribute = layout.attributes[i];
            this.gl.vertexAttribPointer(attribute.location,
                attribute.count, attribute.type, attribute.normalise, layout.stride, attribute.offset + offset);
            this.gl.enableVertexAttribArray(attribute.location);
            offset += attribute.offset + (attribute.count * attribute.size);
        }
        return this;
    }

    bind() {
        this.gl.bindVertexArray(this.id);
    }
}

class Model {
    constructor(vertexArray, indexBuffer, shader, texture) {
        this.vertexArray = vertexArray;
        this.indexBuffer = indexBuffer;
        this.shader = shader;
        this.texture = texture;
    }

    bind(uniforms) {
        this.vertexArray.bind();
        this.indexBuffer.bind();
        this.shader.bind(uniforms);

        if (this.texture) {
            this.texture.bind();
            this.shader.setTexture(this.texture);
        }
    }

    static fromJson(gl, shader, json, texture) {
        const jsonObject = JSON.parse(json);
        const mesh = jsonObject["meshes"][0];

        const data = [];
        for (let i = 0; i < mesh["vertices"].length / 3; i++) {
            const vec3Pos = 3 * i, vec2Pos = 2 * i;
            data.push(...mesh["vertices"].slice(vec3Pos, vec3Pos + 3));
            data.push(...mesh["normals"].slice(vec3Pos, vec3Pos + 3));
            data.push(...mesh["tangents"].slice(vec3Pos, vec3Pos + 3));
            data.push(...mesh["bitangents"].slice(vec3Pos, vec3Pos + 3));
            data.push(...mesh["texturecoords"][0].slice(vec2Pos, vec2Pos + 2));
        }

        const vertexBuffer = new VertexBuffer(gl, data);
        const va = new VertexArray(gl).addBuffer(vertexBuffer, Model.defaultLayout(shader));
        const indexBuffer = new IndexBuffer(gl, [].concat.apply([], mesh["faces"]));

        return new Model(va, indexBuffer, shader, texture);
    }

    static fromWavefront(gl, shader, mdl, texture) {
        const mdlParts = mdl.split("\n");
        const vertexBuffer = new VertexBuffer(gl, []);
        const va = new VertexArray(gl).addBuffer(vertexBuffer, Model.defaultLayout(shader));
        const indexBuffer = new IndexBuffer(gl, []);
        return new Model(va, indexBuffer, shader, texture);
    }

    static defaultLayout(shader) {
        const layout = new VertexBufferLayout(shader.gl);
        layout.addAttribute(shader.getAttrib("aVertexPosition"), 3);
        layout.addAttribute(shader.getAttrib("aVertexNormal"), 3);
        layout.addAttribute(shader.getAttrib("aVertexTangent"), 3);
        layout.addAttribute(shader.getAttrib("aVertexBiTangent"), 3);
        layout.addAttribute(shader.getAttrib("aTextureCoords"), 2);
        return layout;
    }
}

class Renderer {
    constructor(gl) {
        this.gl = gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    draw(object) {
        object.bind();
        this.gl.drawElements(this.gl.TRIANGLES, object.model.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
    }
}

class WorldObject {
    constructor(position = Vector3.zeros, orientation = Vector3.zeros) {
        this._position = new Vector3(position);
        this._orientation = new Vector3(orientation).map(x => Math.radians(x));

        this.matrix = Matrix4.identity;
    }

    set position(posVector) {
        this._position = new Vector3(posVector);
        this.updateMatrix();
    }

    get position() {
        return this._position.copy;
    }

    set orientation(orientation) {
        this._orientation = orientation.copy.map(x => Math.radians(x));
        this.updateMatrix();
    }

    get orientation() {
        return this._orientation.copy.map(x => Math.degrees(x));
    }

    translate(vec) {
        this._position.add(vec);
        this.updateMatrix();
    }

    updateMatrix() {
        this.matrix = Matrix4.identity;
    }
}

class DrawableObject extends WorldObject {
    constructor(model, position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones) {
        super(position, orientation);
        if (this.constructor === DrawableObject)
            throw new TypeError("Abstract class 'Widget' cannot be instantiated directly.");
        this.model = model;
        this.uniforms = {};
        this._scale = new Vector3(scale);
        this.updateMatrix();
    }

    set scale(scaleVector) {
        this._scale = new Vector3(scaleVector);
    }

    get scale() {
        return this._scale.copy;
    }

    update(deltaTime, uniforms) {
        if (typeof uniforms === "object")
            this.uniforms = {...this.uniforms, ...uniforms};
    }

    updateMatrix() {
        this.matrix = Matrix4.identity
            .translate(this._position)
            .rotate(this._orientation.x, new Vector3(0, 1, 0))
            .rotate(this._orientation.y, new Vector3(1, 0, 0))
            .rotate(this._orientation.z, new Vector3(0, 0, 1))
            .scale(this._scale);
    }

    bind() {
        this.model.bind({...this.uniforms});
    }
}

class Camera extends WorldObject {
    constructor(fov, aspectRatio, near = 0.1, far = 100) {
        super();

        this._targetPosition = this._position.copy;
        this._targetOrientation = this._orientation.copy;
        this._direction = Vector3.zeros;

        this.projectionMatrix = Matrix4.perspective(Math.radians(fov), aspectRatio, near, far);

        this.updateMatrix();
    }

    update(deltaTime) {
        this._targetOrientation.y = Math.clamp(this._targetOrientation.y, -Math.PI / 2, Math.PI / 2);

        this._orientation.elements = [
            Math.lerp(this._orientation.x, this._targetOrientation.x, 1 - Math.exp(-8 * deltaTime)),
            Math.lerp(this._orientation.y, this._targetOrientation.y, 1 - Math.exp(-8 * deltaTime))
        ]

        const lerpConstant = 1 - Math.exp(-10 * deltaTime);
        this._position.elements = [
            Math.lerp(this._position.x, this._targetPosition.x, lerpConstant),
            Math.lerp(this._position.y, this._targetPosition.y, lerpConstant),
            Math.lerp(this._position.z, this._targetPosition.z, lerpConstant)
        ];

        this._direction.elements = [
            -Math.sin(this._orientation.x) * Math.cos(this._orientation.y),
            Math.sin(this._orientation.y),
            -Math.cos(this._orientation.x) * Math.cos(this._orientation.y)
        ];

        this.updateMatrix();
    }

    set position(posVector) {
        this._targetPosition = new Vector3(posVector);
        super.position = posVector;
    }

    get position() {
        return super.position;
    }

    set orientation(orientationDegrees) {
        this.targetOrientation = orientationDegrees;
        super.orientation = orientationDegrees;
    }

    get orientation() {
        return super.orientation;
    }

    set targetPosition(posVector) {
        this._targetPosition = new Vector3(posVector);
    }

    get targetPosition() {
        return this._targetPosition;
    }

    set targetOrientation(orientationDegrees) {
        this._targetOrientation = orientationDegrees.copy.map(x => Math.radians(x));
        this._targetOrientation.x *= -1;
    }

    get targetOrientation() {
        return this._targetOrientation.copy.map(x => Math.degrees(x));
    }

    translate(vec) {
        this._targetPosition.add(vec);
        super.translate(vec);
    }

    move(vec) {
        this._targetPosition
            .add(new Vector3(this._direction.copy.mul(vec.x))) // forward/backward component
            .add(new Vector3(-this._direction.z * vec.y, 0, this._direction.x * vec.y)); // left/right component
    }

    turn(vec) {
        this._targetOrientation.sub(new Vector3(Math.radians(vec.x), Math.radians(vec.y), 0.0));
    }

    updateMatrix() {
        this.matrix.lookAt(this._position, this._position.copy.add(this._direction), new Vector3(0, 1, 0));
    }
}

class Application {
    constructor(gl) {
        this.gl = gl;

        this.mousePos = Vector2.zeros;
        this.mouseChange = Vector2.zeros;

        this.mouseSensitivity = 20;

        this.pressedKeys = new Set();
        this.pressedButtons = new Set();

        this.initialised = false;
    }

    mouseMove(dx, dy, x, y) {
        const rect = this.gl.canvas.getBoundingClientRect();
        this.mousePos = new Vector2(x - rect.left, y - rect.top);
        this.mouseChange = new Vector2(dx, dy);
    }

    mouseDown(button) {
        this.pressedButtons.add(button);
    }

    mouseUp(button) {
        this.pressedButtons.delete(button);
    }

    keyDown(key) {
        this.pressedKeys.add(key);
    }

    keyUp(key) {
        this.pressedKeys.delete(key);
    }

    isKeyDown(key) {
        return this.pressedKeys.has(key);
    }

    isKeyUp(key) {
        return !this.isKeyDown(key);
    }

    isButtonDown(key) {
        return this.pressedButtons.has(key);
    }

    isButtonUp(key) {
        return !this.isButtonDown(key);
    }

    async initialise() {
        this.initialised = true;
    }

    update(deltaTime) {
        if (!this.initialised) throw Error("Not initialised.");
        this.mouseChange = Vector2.zeros;
    }

    draw() {
        if (!this.initialised) throw Error("Not initialised.");
    }

    run() {
        let previousTime = 0;
        const app = this;

        function mainloop(currentTime) {
            currentTime /= 1000.0;
            app.update(currentTime - previousTime);
            app.draw();

            previousTime = currentTime;
            requestAnimationFrame(mainloop);
        }

        requestAnimationFrame(mainloop);
    }
}