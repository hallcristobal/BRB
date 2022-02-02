///@ts-check
///<reference path="index.d.ts" />

class MovingElement {
    constructor(width, height, bodyText = null) {
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
        this.speedX = movementSpeed;
        this.speedY = movementSpeed;
        this.hasText = bodyText != null;
        this.text = bodyText;
        this.color = ""; //{};
        this.init();
    }

    init() {
        var w = document.body.clientWidth;
        var h = document.body.clientHeight;

        this.colorIndex = Math.floor(Math.random() * COLORS.length);
        this.x = Math.floor((w - this.width) * Math.random());
        this.y = Math.floor((h - this.height) * Math.random());

        this.updateColor();

        var direction = Math.floor(Math.random() * 4);
        if (direction == 0) { // NE
            this.speedY *= -1;
        } else if (direction == 1) { // NW
            this.speedY *= -1;
            this.speedX *= -1;
        } else if (direction == 2) { // SW
            this.speedX *= -1;
        } else { //SE
            // Nothing to do Here
        }

        if (this.hasText) {
            var tmpCanvas = document.createElement("canvas");
            var tmpctx = tmpCanvas.getContext("2d");
            tmpctx.font = `${fontSize}px ${fontFamily}`;
            tmpctx.fillStyle = this.color;
            tmpctx.fillText(this.text, this.x, this.y);
            this.textMetrics = tmpctx.measureText(this.text);
        } else {
            this.textMetrics = {
                actualBoundingBoxLeft: 0,
                actualBoundingBoxAscent: 0,
                actualBoundingBoxRight: this.width,
                actualBoundingBoxDescent: this.height,
            };
        }
    }

    updateColor() {
        this.color = COLORS[this.colorIndex];
    }

    update() {
        var clientW = window.innerWidth;
        var clientH = window.innerHeight;
        var left = this.x - this.textMetrics.actualBoundingBoxLeft;
        var top = this.y - this.textMetrics.actualBoundingBoxAscent;
        var right = this.x + this.textMetrics.actualBoundingBoxRight;
        var bottom = this.y + this.textMetrics.actualBoundingBoxDescent;

        var hit = false;

        if ((this.speedX + left) < 0) {
            this.x = 0 + this.textMetrics.actualBoundingBoxLeft;
            this.speedX *= -1;
            hit = true;
        } else if ((this.speedX + right > clientW)) {
            this.x = (clientW - this.textMetrics.actualBoundingBoxRight);
            this.speedX *= -1;
            hit = true;
        } else {
            this.x += this.speedX;
        }

        if ((this.speedY + top) < 0) {
            this.y = 0 + this.textMetrics.actualBoundingBoxAscent;
            this.speedY *= -1;
            if (hit == true)
                cornerHits++;

            hit = true;
        } else if ((this.speedY + bottom) > clientH) {
            this.y = clientH - this.textMetrics.actualBoundingBoxDescent;
            this.speedY *= -1;
            if (hit == true)
                cornerHits++;

            hit = true;
        } else {
            this.y += this.speedY;
        }

        if (hit) {
            this.colorIndex++;
            if (this.colorIndex > COLORS.length - 1)
                this.colorIndex = 0;
            this.updateColor();
        }
    }

    draw() {
    }
}

var vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`;

var fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`;

/**@type {WebGLRenderingContext} */
var context = null;
/**@type {MovingElement[]} */
var bouncingElements = [];
/**@type {string[]} */
var COLORS = [];
var movementSpeed = 1.0;
var fontSize = 80;
var fontFamily = "Calibri";
var cornerHits = 0;

/**
 * @param {WebGLRenderingContext} gl 
 * @param {number} type 
 * @param {string} source 
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Failed to create shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/**
 * @param {WebGLRenderingContext} gl 
 * @param {string} vsSource 
 * @param {string} fsSource 
 */
function createProgram(gl, vsSource, fsSource) {
    const vs = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Failed to link Program: " + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

/**
 * @param {WebGLRenderingContext} gl 
 */
function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoordinates = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
    };
}

/**
 * @param {WebGLRenderingContext} gl 
 * @param {any} programInfo 
 * @param {any} buffers 
 */
function drawScene(gl, programInfo, buffers, texture) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 70 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = glMatrix.mat4.create();

    glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    {
        const num = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}

/**
 * @param {string} text 
 * @param {WebGLRenderingContext} gl 
 */
function createTextTexture(text, gl) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, 50, 50);
    const textMetrics = ctx.measureText(text);

    var left = 50 - textMetrics.actualBoundingBoxLeft;
    var top = 50 - textMetrics.actualBoundingBoxAscent;
    var width = Math.abs(textMetrics.actualBoundingBoxRight) + Math.abs(textMetrics.actualBoundingBoxLeft);
    var height = Math.abs(textMetrics.actualBoundingBoxRight) + Math.abs(textMetrics.actualBoundingBoxLeft);
    var imageData = ctx.getImageData(left, top,
        textMetrics.actualBoundingBoxRight,
        textMetrics.actualBoundingBoxDescent + textMetrics.actualBoundingBoxAscent);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return {
        texture,
        width,
        height
    };
}

function initGl() {
    const shaderProgram = createProgram(context, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: context.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: context.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: context.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: context.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: context.getUniformLocation(shaderProgram, 'uSampler'),
        },
    };

    var texture = createTextTexture("BRB", context);
    const buffers = initBuffers(context);

    drawScene(context, programInfo, buffers, texture.texture);
}

async function init() {
    /**@type {IConfig} */
    var config = await (await window.fetch("./index.json")).json();
    COLORS = config.Colors;
    movementSpeed = config.Speed || 1.0;
    fontSize = config.FontSize || 80;
    fontFamily = config.FontFamily || "Calibri";

    var canvas = document.createElement("canvas");
    context = canvas.getContext("webgl");
    document.body.append(canvas);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, false);
    initGl();
}

async function run() {
    for (const object of bouncingElements) {
        object.update();
        object.draw();
    }

    requestAnimationFrame(run);
}

window.onload = function () {
    init();
}