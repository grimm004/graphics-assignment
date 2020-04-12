"use strict";

function fetchText(url, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = () => callback(request.status == 200 ? null : `Error: ${request.status}`,
        request.status == 200 ? request.responseText : "");
    request.send();
}


function main() {
    fetchText("/vertex.shader.glsl", (error, vertexShaderSource) => {
        if (!error)
            fetchText("/fragment.shader.glsl", (error, fragmentShaderSource) => {
                if (!error)
                    init(vertexShaderSource, fragmentShaderSource);
            });
    });
}

function init(vertexShaderSource, fragmentShaderSource) {
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

    const vertexData = new Float32Array([]); // Vertex Data

	const boxIndices = new Uint16Array([]); // Indices

    const boxVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    const boxIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, boxIndices, gl.STATIC_DRAW);

    const
        positionAttribLocation = gl.getAttribLocation(program, "vertexPosition"),
        textureCoordAttribLocation = gl.getAttribLocation(program, "vertexTextureCoord");

    gl.vertexAttribPointer(
        positionAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );

    gl.vertexAttribPointer(
        textureCoordAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(textureCoordAttribLocation);

    const boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById("crate-image")
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
    let angle = 0, angle1 = 0;
    const mainLoop = function() {
        angle = Math.PI / 2;//performance.now() / 6000 * 2 * Math.PI;
        //glMatrix.mat4.rotate(worldMatrix, identityMatrix, angle, [0, 1, 0]);
        glMatrix.mat4.rotate(worldMatrix, identityMatrix, angle, [1, 0, 0]);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.activeTexture(gl.TEXTURE0);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(mainLoop);
    };
    requestAnimationFrame(mainLoop);
}

window.onload = main;