# Computer Graphics Assignment
A 3D WebGL living room model.

## Features
- Modular and object-oriented abstract code structure 
- Ambient, diffuse and specular (dynamic) lighting 
- Virtual movable camera
- Wavefront .obj model parser
- Texture mapping
- Hierarchical structure
- Animation

## Setup
Due to CORS, the static resources (HTML, JavaScript and assets) need to be hosted.
The repository is currently set-up as an _npm_ project with a simple _express_ server.
To use this, open the command-line in the project root directory and type `npm install` then `npm run`.

If using a different server (e.g. a python simple HTTP server), host the files in the _public_ folder.

## Usage
As mentioned in the features, it is possible to move the virtual camera around the world.
Use `w`/`s` to move forwards/backwards and `a`/`d` to move left/right.
To re-orient the camera, double-click the canvas and use the mouse to turn (press escape to return the cursor).

The labeled controls beneath the canvas can be used to change various properties of the scene.

## File Structure
```
/public: Home directory
+--/index.html: HTML file containing the WebGL canvas.
+--/assets
|  +--/models: Models and textures
|  +--/shaders: Vertex and fragment shader pairs
+--/lib: External JavaScript resources
+--/js: Internal JavaScript resources
   +--/index.js: Create, run and manage tha application
   +--/objects.js: Object classes
   +--/models.js: Model classes
   +--/graphics.js: Object-oriented abstract WebGL wrapper
   +--/math.js: Object-oriented gl-matrix wrapper
```
