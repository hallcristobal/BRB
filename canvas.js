///@ts-check
///<reference path="./index.d.ts" />
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
            if(hit == true)
                cornerHits++;

            hit = true;
        } else if ((this.speedY + bottom) > clientH) {
            this.y = clientH - this.textMetrics.actualBoundingBoxDescent;
            this.speedY *= -1;
            if(hit == true)
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
        if (this.hasText) {
            context.font = `${fontSize}px ${fontFamily}`;
            context.fillStyle = this.color;
            context.fillText(this.text, this.x, this.y);
            if (this.textMetrics == null) {
                this.textMetrics = context.measureText(this.text);
            }
        } else {
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

/**@type {CanvasRenderingContext2D} */
var context = null;
/**@type {MovingElement[]} */
var bouncingElements = [];
/**@type {string[]} */
var COLORS = [];
var movementSpeed = 1.0;
var fontSize = 80;
var fontFamily = "Calibri";
var cornerHits = 0;

async function init() {
    /**@type {IConfig} */
    var config = await (await window.fetch("./index.json")).json();
    COLORS = config.Colors;
    movementSpeed = config.Speed || 1.0;
    fontSize = config.FontSize || 80;
    fontFamily = config.FontFamily || "Calibri";

    var canvas = document.createElement("canvas");
    context = canvas.getContext("2d");
    document.body.append(canvas);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, false);

    for (const obj of config.Objects) {
        var count = obj.duplicates || 0;
        for (var i = 0; i < count + 1; i++)
            bouncingElements.push(new MovingElement(200, 100, obj.text || null));
    }
}

async function run() {
    context.globalCompositeOperation = 'destination-over';
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const object of bouncingElements) {
        object.update();
        object.draw();
    }

    requestAnimationFrame(run);
}

window.onload = function () {
    init().then(run);
}