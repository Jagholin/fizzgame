import * as PIXI from "pixi.js";

window.onload = (ev: Event) => {
    console.log("loaded");

    const app :PIXI.Application = new PIXI.Application();
    document.body.appendChild(app.view);

    PIXI.loader.add('bunny', '../images/bunny.png').load((loader, resources) => {
        const bunny :PIXI.Sprite = new PIXI.Sprite(resources.bunny.texture);

        bunny.x = app.renderer.width / 2;
        bunny.y = app.renderer.height / 2;

        bunny.anchor.set(0.5, 0.5);

        app.stage.addChild(bunny);

        app.ticker.add(() => {
            bunny.rotation += 0.01;
        });
    });
};
