"use strict";

function fetchText(url, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = () => callback(request.status === 200 ? null : `Error: ${request.status}`,
        request.status === 200 ? request.responseText : "");
    request.send();
}

function fetchImage(url, callback) {
    const image = new Image();
    image.onload = () => callback(null, image);
    image.src = url;
}

function main() {
    fetchText("/vertex.shader.glsl", (error, vertexShaderSource) => {
        if (!error)
            fetchText("/fragment.shader.glsl", (error, fragmentShaderSource) => {
                if (!error)
                    fetchText("/cube.json", (error, cubeModel) => {
                        if (!error)
                            fetchImage("/cube.png", (error, image) => {
                                if (!error)
                                    init(vertexShaderSource, fragmentShaderSource, JSON.parse(cubeModel), image);
                            });
                    });
            });
    });
}

class Model {
    constructor(meshData, textureImage) {
        this.meshData = meshData;
        this.textureImage = textureImage;
        this.indeciesLength = 0;
    }

    load(gl, program) {
        for (const mesh of this.meshData) {
            const vertices = mesh.vertices;
            const faces = [].concat.apply([], mesh.faces);
            const textureCoords = mesh.texturecoords[0];

            const modelVertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            var textureCoordBufferObject = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBufferObject);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

            const modelIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);
            this.indeciesLength = modelVertexBuffer.length;

            gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer);
            const positionAttribLocation = gl.getAttribLocation(program, "vertexPosition");
            gl.vertexAttribPointer(
                positionAttribLocation,
                3,
                gl.FLOAT,
                gl.FALSE,
                5 * Float32Array.BYTES_PER_ELEMENT,
                0
            );
            gl.enableVertexAttribArray(positionAttribLocation);

            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBufferObject);
            const textureCoordAttribLocation = gl.getAttribLocation(program, "vertexTextureCoord");
            gl.vertexAttribPointer(
                textureCoordAttribLocation,
                2,
                gl.FLOAT,
                gl.FALSE,
                2 * Float32Array.BYTES_PER_ELEMENT,
                0
            );
            gl.enableVertexAttribArray(textureCoordAttribLocation);
        }
    }

    draw(gl) {
        gl.drawElements(gl.TRIANGLES, this.indeciesLength, gl.UNSIGNED_SHORT, 0);
    }
}

function init(vertexShaderSource, fragmentShaderSource, cubeModel, image) {
    const canvas = document.querySelector("#glCanvas");
    let gl = canvas.getContext("webgl");

    if (!gl) {
        console.warn("WebGL not supported, attempting to use experimental-webgl");

        gl = canvas.getContext("experimental-webgl");

        if (!gl) {
            console.error("WebGL not supported.");
            return;
        }
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    const
        vertexShader = gl.createShader(gl.VERTEX_SHADER),
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling vertex shader.", gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling fragment shader.", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program.", gl.getShaderInfoLog(program));
        return;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error("Error validating program.", gl.getShaderInfoLog(program));
        return;
    }

    const model = new Model(cubeModel.meshes, image);
    model.load(gl, program);

    const boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, image
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.useProgram(program);

    const
        matWorldUniformLocation = gl.getUniformLocation(program, "worldMatrix"),
        matViewUniformLocation = gl.getUniformLocation(program, "viewMatrix"),
        matProjectionUniformLocation = gl.getUniformLocation(program, "projectionMatrix");

    const
        worldMatrix = new Float32Array(16),
        viewMatrix = new Float32Array(16),
        projectionMatrix = new Float32Array(16);

    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
    glMatrix.mat4.perspective(projectionMatrix, 45 * Math.PI / 180.0, canvas.width / canvas.clientHeight, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjectionUniformLocation, gl.FALSE, projectionMatrix);

    const identityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);
    const xRotationMatrix = new Float32Array(16);
    const yRotationMatrix = new Float32Array(16);
    let angle = 0;
    const mainLoop = function () {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
         glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
         glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
         glMatrix.mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.activeTexture(gl.TEXTURE0);

        model.draw(gl);

        requestAnimationFrame(mainLoop);
    };
    requestAnimationFrame(mainLoop);
}

window.onload = main;