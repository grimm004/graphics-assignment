"use strict";

function main() {
    const gl = document.querySelector("#glCanvas").getContext("webgl2");
    if (gl) init(gl);
    else console.warn("WebGL could not be initialised.");
}

window.onload = main;
