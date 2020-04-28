class StdObject extends DrawableObject {
    constructor(model, position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones) {
        super(model, position, orientation, scale);

        this.uniforms = {
            uModelMatrix: Matrix4.identity,
            uViewMatrix: Matrix4.identity,
            uProjectionMatrix: Matrix4.identity,
            uEyePosition: Vector3.zeros,

            uAmbientColour: new Vector3(0.1),
            uLightColour: Vector3.ones,
            uLightPosition: Vector3.zeros
        };
    }

    update(deltaTime, uniforms) {
        this.uniforms.uModelMatrix = this.matrix;
        super.update(deltaTime, uniforms);
    }
}


class SimpleObject extends DrawableObject {
    constructor(model, position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones) {
        super(model, position, orientation, scale);

        this.uniforms = {
            uModelMatrix: Matrix4.identity,
            uViewMatrix: Matrix4.identity,
            uProjectionMatrix: Matrix4.identity,

            uColour: new Colour(1.0)
        };
    }

    update(deltaTime, uniforms) {
        this.uniforms.uModelMatrix = this.matrix;
        super.update(deltaTime, uniforms);
    }
}