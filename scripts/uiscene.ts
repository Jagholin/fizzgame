import * as PIXI from "pixi.js"
import * as _ from "lodash"
import { GameLevel } from "./gamelevel";

export abstract class UIScene
{
    protected stage: PIXI.Container = new PIXI.Container;
    protected keymappings: Map<string, (a: KeyboardEvent, b: string)=>void> = new Map;
    protected appScreen: PIXI.Rectangle;
    protected keystates: Map<string, boolean> = new Map;
    protected level: GameLevel = new GameLevel;

    protected abstract _onMouseClick (eve: PIXI.interaction.InteractionEvent);
    protected abstract _setLevel(aLevel: GameLevel);
    protected abstract _animationTick(deltaTime: number);
    
    public setLevel(aLevel: GameLevel)
    {
        this.level = aLevel;

        let levelBorder = new PIXI.Graphics;
        levelBorder.beginFill(0xaeaeae).drawRect(0, 0, 5000, 5000).endFill();
        this.stage.addChild(levelBorder);

        this._setLevel(aLevel);
    }

    public setScene(app: PIXI.Application)
    {
        this.appScreen = app.screen;
        this.stage.interactive = true;
        this.stage.on("click", this.onMouseClick, this);
        for (let aGameObject of this.level.objects)
        {
            aGameObject.setGraphicsParent(this.stage);
        }
        this.level.playerObj.setGraphicsParent(this.stage);
        app.stage = this.stage;

        PIXI.ticker.shared.add((deltaNumber: number) => {
            //console.log(`${PIXI.ticker.shared.elapsedMS} ms tick, ${1000 / PIXI.ticker.shared.elapsedMS} FPS`);
            this._animationTick(deltaNumber);
        });
    }

    public onKeyDown(event: KeyboardEvent)
    {
        this.keystates.set(event.key, true);
        if (this.keymappings.has(event.key))
            this.keymappings.get(event.key)(event, "down");
    }
    public onKeyUp(event: KeyboardEvent)
    {
        this.keystates.set(event.key, false);
        if (this.keymappings.has(event.key))
            this.keymappings.get(event.key)(event, "up");
    }

    public onMouseClick(event: PIXI.interaction.InteractionEvent)
    {
        let localPoint = event.data.getLocalPosition(this.stage);
        console.log(`local coordinates: ( ${localPoint.x}, ${localPoint.y} )`);

        this._onMouseClick(event);
    }
}
