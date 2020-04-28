class Cube extends Model {
    constructor(gl, vertexArray, shader, texture) {
        const indexBuffer = new IndexBuffer(gl, [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23,   // left
        ]);

        super(vertexArray, indexBuffer, shader, texture);
    }
}


class TexturedCube extends Cube {
    constructor(gl, shader, texture) {
        const layout = new VertexBufferLayout(gl);
        layout.addAttribute(shader.getAttrib("aVertexPosition"), 3, gl.FLOAT, false);
        layout.addAttribute(shader.getAttrib("aVertexNormal"), 3, gl.FLOAT, false);
        layout.addAttribute(shader.getAttrib("aTextureCoords"), 2, gl.FLOAT, false);

        const vertexBuffer = new VertexBuffer(gl, [
            // Front face
            -1.0, -1.0,  1.0,     0.0,  0.0,  1.0,    0.0, 0.0,
            1.0, -1.0,  1.0,     0.0,  0.0,  1.0,    1.0, 0.0,
            1.0,  1.0,  1.0,     0.0,  0.0,  1.0,    1.0, 1.0,
            -1.0,  1.0,  1.0,     0.0,  0.0,  1.0,    0.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,     0.0,  0.0, -1.0,    0.0, 0.0,
            -1.0,  1.0, -1.0,     0.0,  0.0, -1.0,    1.0, 0.0,
            1.0,  1.0, -1.0,     0.0,  0.0, -1.0,    1.0, 1.0,
            1.0, -1.0, -1.0,     0.0,  0.0, -1.0,    0.0, 1.0,

            // Top face
            -1.0,  1.0, -1.0,     0.0,  1.0,  0.0,    0.0, 0.0,
            -1.0,  1.0,  1.0,     0.0,  1.0,  0.0,    1.0, 0.0,
            1.0,  1.0,  1.0,     0.0,  1.0,  0.0,    1.0, 1.0,
            1.0,  1.0, -1.0,     0.0,  1.0,  0.0,    0.0, 1.0,

            // Bottom face
            -1.0, -1.0, -1.0,     0.0, -1.0,  0.0,    0.0, 0.0,
            1.0, -1.0, -1.0,     0.0, -1.0,  0.0,    1.0, 0.0,
            1.0, -1.0,  1.0,     0.0, -1.0,  0.0,    1.0, 1.0,
            -1.0, -1.0,  1.0,     0.0, -1.0,  0.0,    0.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,     1.0,  0.0,  0.0,    0.0, 0.0,
            1.0,  1.0, -1.0,     1.0,  0.0,  0.0,    1.0, 0.0,
            1.0,  1.0,  1.0,     1.0,  0.0,  0.0,    1.0, 1.0,
            1.0, -1.0,  1.0,     1.0,  0.0,  0.0,    0.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,    -1.0,  0.0,  0.0,    0.0, 0.0,
            -1.0, -1.0,  1.0,    -1.0,  0.0,  0.0,    1.0, 0.0,
            -1.0,  1.0,  1.0,    -1.0,  0.0,  0.0,    1.0, 1.0,
            -1.0,  1.0, -1.0,    -1.0,  0.0,  0.0,    0.0, 1.0,
        ]);

        const vertexArray = new VertexArray(gl).addBuffer(vertexBuffer, layout);

        super(gl, vertexArray, shader, texture);
    }
}


class ColouredCube extends Cube {
    constructor(gl, shader, faceColourData = undefined) {
        const layout = new VertexBufferLayout(gl);
        layout.addAttribute(shader.getAttrib("aVertexPosition"), 3);
        layout.addAttribute(shader.getAttrib("aVertexColour"), 3);

        const vertexPositions = [
            // Front face
            [-1.0, -1.0,  1.0],
            [ 1.0, -1.0,  1.0],
            [ 1.0,  1.0,  1.0],
            [-1.0,  1.0,  1.0],

            // Back face
            [-1.0, -1.0, -1.0],
            [-1.0,  1.0, -1.0],
            [ 1.0,  1.0, -1.0],
            [ 1.0, -1.0, -1.0],

            // Top face
            [-1.0,  1.0, -1.0],
            [-1.0,  1.0,  1.0],
            [ 1.0,  1.0,  1.0],
            [ 1.0,  1.0, -1.0],

            // Bottom face
            [-1.0, -1.0, -1.0],
            [ 1.0, -1.0, -1.0],
            [ 1.0, -1.0,  1.0],
            [-1.0, -1.0,  1.0],

            // Right face
            [ 1.0, -1.0, -1.0],
            [ 1.0,  1.0, -1.0],
            [ 1.0,  1.0,  1.0],
            [ 1.0, -1.0,  1.0],

            // Left face
            [-1.0, -1.0, -1.0],
            [-1.0, -1.0,  1.0],
            [-1.0,  1.0,  1.0],
            [-1.0,  1.0, -1.0],
        ];

        const vertexData = [];
        for (let i = 0; i < vertexPositions.length; i++) {
            vertexData.push(...vertexPositions[i]);
            vertexData.push(
                ...(faceColourData === undefined ? [1.0, 1.0, 1.0, 1.0] :
                    (faceColourData instanceof Vector3 ? faceColourData.elements :
                        faceColourData[Math.floor(i / 6)].elements))
            );
        }

        const vertexBuffer = new VertexBuffer(gl, vertexData);
        const vertexArray = new VertexArray(gl).addBuffer(vertexBuffer, layout);

        super(gl, vertexArray, shader);
    }
}


class Plane extends Model {
    constructor(gl, shader, texture) {
        const layout = new VertexBufferLayout(gl);
        layout.addAttribute(shader.getAttrib("aVertexPosition"), 3, gl.FLOAT, false);
        layout.addAttribute(shader.getAttrib("aVertexNormal"), 3, gl.FLOAT, false);
        layout.addAttribute(shader.getAttrib("aTextureCoords"), 2, gl.FLOAT, false);

        const vertexBuffer = new VertexBuffer(gl, [
            -1.0,  0.0, -1.0,   0.0,  1.0,  0.0,  0.0, 0.0,
             1.0,  0.0, -1.0,   0.0,  1.0,  0.0,  1.0, 0.0,
             1.0,  0.0,  1.0,   0.0,  1.0,  0.0,  1.0, 1.0,
            -1.0,  0.0,  1.0,   0.0,  1.0,  0.0,  0.0, 1.0,
        ]);

        const vertexArray = new VertexArray(gl).addBuffer(vertexBuffer, layout);

        const indexBuffer = new IndexBuffer(gl, [
            0, 1, 2, 0, 2, 3
        ]);
        super(vertexArray, indexBuffer, shader, texture);
    }
}