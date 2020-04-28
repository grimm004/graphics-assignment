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

async function fetchShaders(gl, name) {
    const vertexShaderSource = await fetchText(`assets/shaders/${name}/vertex.glsl`);
    const fragmentShaderSource = await fetchText(`assets/shaders/${name}/fragment.glsl`);
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function fetchModel(gl, name, shader) {
    return Model.fromJson(gl, shader, await fetchText(`assets/models/${name}/model.json`),
        new Texture(gl, await fetchImage(`assets/models/${name}/texture.png`)));
}

class CGCoursework extends Application {
    constructor(gl) {
        super(gl);

        this.renderer = new Renderer(this.gl);

        this.camera = new Camera(90.0, gl.canvas.clientWidth / gl.canvas.clientHeight);
        this.camera.position = new Vector3(2.923570394515991, 0.5615888833999634, 4.216072082519531);
        this.camera.orientation = new Vector3(-44.851505279541016, 0.6907241344451904, 0.0);
    }

    async initialise() {
        this.shader = await fetchShaders(this.gl, "lighting");
        this.simpleShader = await fetchShaders(this.gl, "simple");
        const boxImage = await fetchImage("/textures/crate.png");

        const texture = new Texture(this.gl, boxImage);
        const texCubeModel = new TexturedCube(this.gl, this.shader, texture);
        const colCubeModel = new ColouredCube(this.gl, this.simpleShader, new Vector3(1.0));
        const planeModel = new Plane(this.gl, this.shader, texture);
        const suzanneModel = await fetchModel(this.gl, "suzanne", this.shader);

        this.cube = new StdObject(texCubeModel, new Vector3(-5, 0, 0));
        this.cube2 = new StdObject(texCubeModel);
        this.lightCube = new SimpleObject(colCubeModel, new Vector3(0.0, 4.0, 4.0), Vector3.zeros, new Vector3(0.05));
        this.plane = new StdObject(planeModel, Vector3.zeros, Vector3.zeros, new Vector3(10.0));
        this.suzanne = new StdObject(suzanneModel, new Vector3(2.0, 0.0, 0.0));

        const catModel = await fetchModel(this.gl, "cat", this.shader);
        this.cat = new StdObject(catModel, new Vector3(0.0, 0.0, 0.0), new Vector3(0.0, -90.0, 0.0), new Vector3(0.1));

        this.worldObjects = [this.suzanne, this.cube2, this.cube, this.lightCube, this.plane, this.cat];

        this.lightColour = new Colour(1.0);

        await super.initialise();
    }

    keyDown(key) {
        if (key === "r") {
            this.camera.targetPosition = new Vector3(2.923570394515991, 0.5615888833999634, 4.216072082519531);
            this.camera.targetOrientation = new Vector3(-44.851505279541016, 0.6907241344451904, 0.0);
        } else if (key === "c")
            console.log(`[${this.camera.position.elements.join(", ")}], [${this.camera.orientation.elements.join(", ")}]`);

        super.keyDown(key);
    }

    update(deltaTime) {
        this.cube2.position = new Vector3(
            Number(document.getElementById("xPosSlider").value) / 10.0,
            Number(document.getElementById("yPosSlider").value) / 10.0,
            Number(document.getElementById("zPosSlider").value) / 10.0
        );
        this.cube2.orientation = new Vector3(
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

        const stdUniforms = {
            uLightPosition: this.lightCube.position,
            uLightColour: this.lightColour.toVector3(),
            uEyePosition: this.camera.position
        }

        const simpleUniforms = {
            uColour: this.lightColour
        }

        for (const object of this.worldObjects)
            object.update(deltaTime, {...commonUniforms, ...(object instanceof StdObject ? stdUniforms : simpleUniforms)});

        super.update(deltaTime);
    }

    draw() {
        this.renderer.clear();
        for (const object of this.worldObjects)
            this.renderer.draw(object);
        super.draw();
    }
}

class Program {
    static main() {
        const canvas = document.querySelector("#glCanvas");
        const gl = canvas.getContext("webgl2");
        if (gl) {
            const app = new CGCoursework(gl);

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
            canvas.addEventListener("dblclick", () => canvas.requestPointerLock(), false);

            app.initialise()
                .then(() => app.run());
        }
        else console.warn("WebGL could not be initialised.");
    }
}

window.onload = Program.main;
