"use strict";

function fetchText(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = () => {
            if (199 < request.status && request.status < 300) resolve(request.responseText);
            else reject(request.status);
        }
        request.onerror = () => reject(0);
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

async function fetchTexture(gl, filename) {
    return new Texture(gl, await fetchImage(`assets/images/${filename}`));
}

async function fetchShaderSource(name) {
    return [await fetchText(`assets/shaders/${name}.vertex.glsl`), await fetchText(`assets/shaders/${name}.fragment.glsl`)];
}

async function fetchMesh(gl, name, hasTexture, textureName) {
    let texture = null;
    if (hasTexture)
        texture = await fetchTexture(gl, textureName ?? (name + ".png"));
    return parseObj(gl, await fetchText(`assets/meshes/${name}.obj`), texture);
}

class CGCoursework extends Application {
    constructor(gl) {
        super(gl);

        this.renderer = new Renderer(this.gl, Colour.white);

        this.mouseSensitivity = 20;

        this.camera = new Camera(90.0, gl.canvas.clientWidth / gl.canvas.clientHeight);
        this.camera.position = new Vector3(2.923570394515991, 0.5615888833999634, 4.216072082519531);
        this.camera.orientation = new Vector3(-44.851505279541016, 0.6907241344451904, 0.0);
    }

    async loadShaders() {
        let vertSource, fragSource, shader;

        [vertSource, fragSource] = await fetchShaderSource("col");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("col", shader);
        const layout1 = new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3);
        shader.addLayout("default", layout1);

        [vertSource, fragSource] = await fetchShaderSource("colLit");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("colLit", shader);
        const layout2 = new VertexBufferLayout(this.gl)
            .addAttribute("aVertexPosition", 3)
            .addAttribute("aVertexNormal", 3)
            .addAttribute("aVertexColour", 3);
        shader.addLayout("default", layout2);

        [vertSource, fragSource] = await fetchShaderSource("texLit");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("texLit", shader);
        const layout3 = new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2);
        shader.addLayout("default", layout3);
    }

    async initialise() {
        await this.loadShaders();

        const texture = await fetchTexture(this.gl, "wood.jpg");

        const texCubeMesh = new TexCubeMesh(this.gl, texture);
        const texPlaneMesh = new TexPlaneMesh(this.gl, "texLit", texture);
        const colCubeMesh = new ColCubeMesh(this.gl, new Vector3(1.0));
        const suzanneMesh = await fetchMesh(this.gl, "suzanne", true);
        const catMesh = await fetchMesh(this.gl, "cat", true);

        const cube = new StdObject(texCubeMesh, new Vector3(-5, 1.0, 0.0));
        const cube2 = new StdObject(texCubeMesh, new Vector3(-5, 1.0, -1.0));
        this.lightCube = new SimpleObject(colCubeMesh, new Vector3(0.0, 4.0, 4.0), Vector3.zeros, new Vector3(0.05));
        this.suzanne = new StdObject(suzanneMesh, new Vector3(2.0, 1.0, 0.0));
        const cat = new StdObject(catMesh, new Vector3(-4.0, 0.0, 4.0), new Vector3(90.0, 0.0, 0.0), new Vector3(0.1));

        this.sceneGraph = new StdObject(texPlaneMesh, Vector3.zeros, Vector3.zeros, new Vector3(10.0), [cube, cube2, this.suzanne, cat]);

        this.lightColour = Colour.white;

        await super.initialise();
    }

    resize() {
        this.camera.aspectRatio = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    }

    keyDown(key) {
        if (key === "r") {
            this.camera.targetPosition = new Vector3(2.9, 0.5, 4.2);
            this.camera.targetOrientation = new Vector3(-44.85, 0.79, 0.00);
        } else if (key === "c")
            console.log(`[${this.camera.position.elements.join(", ")}], [${this.camera.orientation.elements.join(", ")}]`);

        super.keyDown(key);
    }

    update(deltaTime) {
        this.lightCube.position = new Vector3(
            Number(document.getElementById("xPosSlider").value) / 10.0,
            Number(document.getElementById("yPosSlider").value) / 10.0,
            Number(document.getElementById("zPosSlider").value) / 10.0
        );
        this.lightCube.orientation = new Vector3(
            Number(document.getElementById("yawRotSlider").value),
            Number(document.getElementById("pitchRotSlider").value),
            Number(document.getElementById("rollRotSlider").value)
        );
        this.suzanne.scale = new Vector3(Number(document.getElementById("scaleSlider").value / 10));

        this.suzanne.orientation = this.suzanne.orientation.add(new Vector3(100 * deltaTime, 0, 0));

        this.camera.turn(new Vector3(this.mouseChange.x * deltaTime * this.mouseSensitivity, this.mouseChange.y * deltaTime * this.mouseSensitivity, 0.0));

        this.camera.move(new Vector2(
            Number(this.pressedKeys.has("w")) - Number(this.pressedKeys.has("s")),
            Number(this.pressedKeys.has("d")) - Number(this.pressedKeys.has("a"))
        ).mul(2 + (2 * Number(this.pressedKeys.has("Shift")))).mul(deltaTime));

        this.camera.update(deltaTime);

        const commonUniforms = {
            uViewMatrix: this.camera.matrix,
            uProjectionMatrix: this.camera.projectionMatrix
        }

        const lit = {
            uLightPosition: this.lightCube.position,
            uLightColour: this.lightColour.rgb,
            uEyePosition: this.camera.position
        }

        const unlit = {
            uColour: this.lightColour
        }

        this.lightCube.update(deltaTime, {...commonUniforms, ...unlit});
        this.sceneGraph.update(deltaTime, {...commonUniforms, ...lit});

        super.update(deltaTime);
    }

    draw() {
        this.renderer.clear();
        this.lightCube.draw(this.renderer);
        this.sceneGraph.draw(this.renderer);
        super.draw();
    }
}

class Program {
    static main() {
        const canvas = document.querySelector("#glCanvas");

        const gl = canvas.getContext("webgl2");
        if (gl) {
            const app = new CGCoursework(gl);

            const resize = () => {
                canvas.width  = window.innerWidth;
                canvas.height = window.innerHeight;

                app.resize();

                gl.viewport(0, 0, canvas.width, canvas.height);
            };
            resize();

            window.addEventListener("resize", resize, false);

            const body = document.querySelector("body");
            body.addEventListener("keydown", e => app.keyDown(e.key), false);
            body.addEventListener("keyup", e => app.keyUp(e.key), false);

            canvas.addEventListener("mousemove", e => {
                // noinspection JSUnresolvedVariable
                if (document.pointerLockElement === canvas ||
                    document.mozPointerLockElement === canvas)
                    app.mouseMove(e.movementX, e.movementY, e.clientX, e.clientY);
            }, false);
            canvas.addEventListener("mousedown", e => app.mouseDown( e.button), false);
            canvas.addEventListener("mouseup", e => app.mouseUp( e.button), false);
            canvas.addEventListener('contextmenu', e => {
                if (e.button === 2) e.preventDefault();
            });

            // noinspection JSUnresolvedVariable
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
            document.addEventListener("dblclick", () => canvas.requestPointerLock(), false);

            app.initialise()
                .then(() => app.run());
        }
        else console.warn("WebGL could not be initialised.");
    }
}

window.onload = Program.main;
