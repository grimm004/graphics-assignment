"use strict";

const mat4 = glMatrix.mat4;

function fetchText(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = () => {
            if (199 < request.status && request.status < 300) resolve(request.responseText);
            else reject(request.status);
        }
        request.send();
    });
}

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject();
        image.src = url;
    });
}

class Texture {
    constructor(gl, image) {
        this.id = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.id);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    bind(gl, slot = 0) {
        gl.activeTexture(gl.TEXTURE0 + slot);
        gl.bindTexture(gl.TEXTURE_2D, this.id);
    }
}

class ShaderProgram {
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        this.id = this.createProgram(gl, vertexShaderSource, fragmentShaderSource);

        this.cache = {
            attributes: {},
            uniforms: {}
        };
    }

    createProgram(gl, vertexShaderSource, fragmentShaderSource) {
        const glVertexShader = ShaderProgram.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        if (!glVertexShader) return -1;

        const glFragmentShader = ShaderProgram.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!glFragmentShader) return -1;

        const id = gl.createProgram();
        gl.attachShader(id, glVertexShader);
        gl.attachShader(id, glFragmentShader);
        gl.linkProgram(id);

        gl.deleteShader(glVertexShader);
        gl.deleteShader(glFragmentShader);

        if (gl.getProgramParameter(id, gl.LINK_STATUS)) return id;

        console.warn("Could not link shader program: " + gl.getProgramInfoLog(id));
        gl.deleteProgram(id);
        return -1;
    }

    getAttrib(gl, name) {
        if (!this.cache.attributes.hasOwnProperty(name))
            this.cache.attributes[name] = gl.getAttribLocation(this.id, name);
        return this.cache.attributes[name];
    }

    cacheUniform(gl, name) {
        if (!this.cache.uniforms.hasOwnProperty(name))
            this.cache.uniforms[name] = gl.getUniformLocation(this.id, name);
    }

    setUniformMat4fv(gl, name, matrixData, transpose) {
        this.cacheUniform(gl, name);
        gl.uniformMatrix4fv(this.cache.uniforms[name], transpose || false, matrixData);
    }

    setUniform1i(gl, name, value) {
        this.cacheUniform(gl, name);
        gl.uniform1i(this.cache.uniforms[name], value);
    }

    bind(gl) {
        gl.useProgram(this.id);
    }

    static loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            return shader;

        console.warn("Could not compile shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
}

class Buffer {
    constructor(gl, type, typedData) {
        this.type = type;
        this.length = typedData.length;
        this.id = gl.createBuffer();
        gl.bindBuffer(type, this.id);
        gl.bufferData(type, typedData, gl.STATIC_DRAW);
    }

    bind(gl) {
        gl.bindBuffer(this.type, this.id);
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
    constructor() {
        this.attributes = [];
        this.stride = 0;
    }

    addAttribute(gl, location, count, glType, normalise) {
        const size = VertexBufferLayout.getSizeOfType(gl, glType);
        this.attributes.push({location, count, type: glType, normalise, size});
        this.stride += count * size;
    }

    static getSizeOfType(gl, type) {
        switch (type) {
            case gl.UNSIGNED_BYTE:
            case gl.BYTE:
                return 1;
            case gl.SHORT:
            case gl.UNSIGNED_SHORT:
                return 2;
            case gl.FLOAT:
            case gl.INT:
            case gl.UNSIGNED_INT:
                return 4;
            default:
                throw Error(`Unsupported type: ${type}`);
        }
    }
}

class VertexArray {
    constructor(gl) {
        this.id = gl.createVertexArray();
    }

    addBuffer(gl, buffer, layout) {
        this.bind(gl);
        buffer.bind(gl);
        let offset = 0;
        for (let i = 0; i < layout.attributes.length; i++) {
            const attribute = layout.attributes[i];
            gl.vertexAttribPointer(attribute.location,
                attribute.count, attribute.type, attribute.normalise, layout.stride, offset);
            gl.enableVertexAttribArray(attribute.location);
            offset += attribute.count * attribute.size;
        }
    }

    bind(gl) {
        gl.bindVertexArray(this.id);
    }
}

class CubeBuffers {
    constructor(gl) {
        this.vertices = new VertexBuffer(gl, [
            // Front face
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0,

            // Top face
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,

            // Bottom face
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 0.0,
            1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 0.0,
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 1.0,

            // Right face
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 0.0,
            1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 0.0,
            -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 1.0,
            -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
        ]);
        this.indecies = new IndexBuffer(gl, [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23,   // left
        ]);
    }
}

class Renderer {
    constructor(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }

    clear(gl) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    draw(gl, vertexArray, indexBuffer, shaderProgram) {
        shaderProgram.bind(gl);
        vertexArray.bind(gl);
        indexBuffer.bind(gl);

        gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    }
}

class Application {
    constructor(gl, shaderProgram, buffers, texture) {
        this.shader = shaderProgram;
        this.buffers = buffers;

        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.modelMatrixA = mat4.create();
        this.modelMatrixB = mat4.create();
        this.vp = mat4.create();
        this.normalMatrix = mat4.create();

        const fieldOfView = 90 * Math.PI / 180;
        const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;

        mat4.perspective(this.projectionMatrix, fieldOfView, aspectRatio, zNear, zFar);
        mat4.translate(this.viewMatrix, this.viewMatrix, [0.0, 0.0, -6.0]);
        mat4.translate(this.modelMatrixA, this.modelMatrixA, [2, 0, 0]);
        mat4.identity(this.modelMatrixB);

        this.vertexArray = new VertexArray(gl);

        const vertexBufferLayout = new VertexBufferLayout();
        vertexBufferLayout.addAttribute(gl, this.shader.getAttrib(gl, "aVertexPosition"), 3, gl.FLOAT, false);
        vertexBufferLayout.addAttribute(gl, this.shader.getAttrib(gl, "aVertexNormal"), 3, gl.FLOAT, false);
        vertexBufferLayout.addAttribute(gl, this.shader.getAttrib(gl, "aTextureCoords"), 2, gl.FLOAT, false);
        this.vertexArray.addBuffer(gl, this.buffers.vertices, vertexBufferLayout);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        texture.bind(gl, 0);
        this.shader.bind(gl);
        this.shader.setUniform1i(gl, "uSampler", 0);

        this.renderer = new Renderer(gl);
    }

    update(deltaTime) {
        // mat4.rotateZ(this.viewMatrix, this.viewMatrix, deltaTime * 0.001);
        // mat4.rotateY(this.viewMatrix, this.viewMatrix, deltaTime * 0.0005);

        mat4.multiply(this.vp, this.projectionMatrix, this.viewMatrix);

        mat4.invert(this.normalMatrix, this.vp);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
    }

    draw(gl) {
        this.shader.bind(gl);

        const mvp = mat4.create();
        mat4.mul(mvp, this.vp, this.modelMatrixA);

        this.shader.setUniformMat4fv(gl, "uMVP", mvp);
        this.shader.setUniformMat4fv(gl, "uNormalMatrix", this.normalMatrix);

        this.renderer.clear(gl);
        this.renderer.draw(gl, this.vertexArray, this.buffers.indecies, this.shader);

        mat4.mul(mvp, this.vp, this.modelMatrixB);

        this.shader.setUniformMat4fv(gl, "uMVP", mvp);
        this.shader.setUniformMat4fv(gl, "uNormalMatrix", this.normalMatrix);
        this.renderer.draw(gl, this.vertexArray, this.buffers.indecies, this.shader);
    }
}

async function init(gl) {
    let vertexShaderSource = "", fragmentShaderSource = "", image;
    try {
        vertexShaderSource = await fetchText("/shaders/vertex.glsl");
        fragmentShaderSource = await fetchText("/shaders/fragment.glsl");
        image = await fetchImage("/textures/test.png");
    } catch (e) {
        return;
    }

    const shaderProgram = new ShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (shaderProgram.id < 0) return;

    const cubeBuffers = new CubeBuffers(gl);

    const texture = new Texture(gl, image);

    const app = new Application(gl, shaderProgram, cubeBuffers, texture);

    let previousTime = 0;

    function mainloop(currentTime) {
        app.update(currentTime - previousTime);
        app.draw(gl);

        previousTime = currentTime;
        requestAnimationFrame(mainloop);
    }

    requestAnimationFrame(mainloop);
}
