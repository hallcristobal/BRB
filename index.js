///@ts-check
var movementSpeed = 1.0;
const COLORS = [
    "#06031f",
    "#721456",
    "#de248e",
    "#dc8660",
    "#dae833",
    "#d2eef5",
    "#7ad3bd",
    "#22b785",
    "#168455",
    "#0b5126",
    "#11117c",
    "#3643b4",
    "#6093d9",
    "#8dddf3",
    "#d58df3",
    "#b046e5",
    "#7c2bab",
    "#470982",
    "#802645",
    "#bf2742",
    "#e06c72",
    "#eda7b2",
    "#afc1cd",
    "#8d9cab",
    "#636d7f",
    "#393e54",
];

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
    }
    /*
        <div id="tmp" style="position: absolute; top: 100; left: 100; width: 200px; height: auto;">
            <svg viewBox="0 0 56 15">
                <text x="0" y="11.5">Help Me!</text>
            </svg>
        </div>
    */

    updatePosition() {
        this.element.style.left = "" + this.x;
        this.element.style.top = "" + this.y;
    }

    updateColor() {
        this.colorIndex++;
        if (this.colorIndex > COLORS.length - 1)
            this.colorIndex = 0;

        if (this.hasText)
            this.element.style.color = COLORS[this.colorIndex];
        else
            this.element.style.background = COLORS[this.colorIndex];
    }

    animate() {
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
            this.updateColor();
        }
    }
}

/**@type {MovingElement[]} */
var bouncingElements = [];

function init() {
    document.body.style.background = "rgba(0,0,0,0)";

    var background = document.createElement("div");
    background.style.width = "100%";
    background.style.height = "100%";
    background.style.background = "rgba(0,0,0,0.25)";
    document.body.appendChild(background);

    bouncingElements.push(new MovingElement(200, 100));
    bouncingElements.push(new MovingElement(200, 100, "BRB"));
}

function run() {
    for (var element of bouncingElements)
        element.animate();

    requestAnimationFrame(run);
}

window.onload = function () {
    init();
    run();
}