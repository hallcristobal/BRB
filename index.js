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
        this.init();
    }

    init() {
        var w = document.body.clientWidth;
        var h = document.body.clientHeight;

        this.colorIndex = Math.floor(Math.random() * COLORS.length);
        this.x = Math.floor((w - this.width) * Math.random());
        this.y = Math.floor((h - this.height) * Math.random());

        this.element = document.createElement("div");

        this.element.style.position = "absolute";
        this.element.style.width = this.width + "px";
        this.element.style.height = this.height + "px";

        if (this.hasText) {
            this.element.style.height = "auto";
            this.element.style.width = "auto";

            var svg = document.createElement("svg");
            svg.setAttribute("viewBox", "0 0 56 15");

            var text = document.createElement("text");
            text.setAttribute("x", "0");
            text.setAttribute("y", "11.5");
            text.innerText = this.text;

            svg.append(text);

            this.element.append(svg);
            this.element.style.background = "transparent";
        }

        this.updatePosition();
        this.updateColor();

        document.body.append(this.element);
        if (this.hasText) {
            this.height = this.element.clientHeight;
            this.width = this.element.clientWidth;
        }

        var direction = Math.floor(Math.random() * 4);
        if (direction == 0) { // NE
            this.speedY *= -1;
        } else if (direction == 1) { // NW
            this.speedY *= -1;
            this.speedX *= -1;
        } else if (direction == 2) { // SW
            this.speedX *= -1;
        } else { //SE
            // Nothing To do Here
        }
    }

    async update() {
        this.updatePosition();
        this.updateColor();
    }

    updatePosition() {
        this.element.style.left = "" + this.x;
        this.element.style.top = "" + this.y;
    }

    updateColor() {
        if (this.hasText)
            this.element.style.color = COLORS[this.colorIndex];
        else
            this.element.style.background = COLORS[this.colorIndex];
    }

    async animate() {
        var clientW = document.body.clientWidth;
        var clientH = document.body.clientHeight;
        var hit = false;

        if (((this.x + this.width) + this.speedX > clientW) || (this.x + this.speedX < 0)) {
            this.speedX *= -1;
            hit = true;
        }
        this.x += this.speedX;

        if (((this.y + this.height) + this.speedY > clientH) || (this.y + this.speedY < 0)) {
            this.speedY *= -1;
            hit = true;
        }
        this.y += this.speedY;

        this.updatePosition();
        if (hit) {
            this.colorIndex++;
            if (this.colorIndex > COLORS.length - 1)
                this.colorIndex = 0;
        }
    }
}

/**@type {MovingElement[]} */
var bouncingElements = [];
/**@type {string[]} */
var COLORS = [];
var movementSpeed = 1.0;
var animate = true;
var debug = false;

async function init() {
    /**@type {IConfig} */
    var config = await (await window.fetch("./index.json")).json();
    COLORS = config.Colors;
    debug = config.Debug || false;
    movementSpeed = config.Speed || 1.0;

    document.body.style.background = "rgba(0,0,0,0)";

    for (var obj of config.Objects) {
        var num = obj.duplicates || 0;
        for (var i = 0; i < num + 1; i++) {
            var o = new MovingElement(200, 100, obj.text !== null ? obj.text : null)
            //o.animate();
            bouncingElements.push(o);
        }
    }
}

async function run() {
    /**@type {Array<Promise>} */
    var updates = [];
    for (var element of bouncingElements)
        //updates.push(element.animate());
        await element.animate();

    await Promise.all(updates);
    requestAnimationFrame(run);
}

window.onload = function () {
    init().then(() => run());
}