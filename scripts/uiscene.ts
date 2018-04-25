import * as PIXI from "pixi.js"
import * as _ from "lodash"
import { GameLevel } from "./gamelevel";
import { Vector2D } from "./polygontools";

export abstract class UIScene
{
    protected stage: PIXI.Container = new PIXI.Container;
    protected keymappings: Map<string, (a: KeyboardEvent, b: string)=>void> = new Map;
    protected appScreen: PIXI.Rectangle;
    protected keystates: Map<string, boolean> = new Map;
    protected level: GameLevel = new GameLevel;

    protected abstract _onMouseClick (eve: PIXI.interaction.InteractionEvent);
    protected abstract _onMouseDown(eve: PIXI.interaction.InteractionEvent);
    protected abstract _onMouseMove(eve: PIXI.interaction.InteractionEvent);
    protected abstract _setLevel(aLevel: GameLevel);
    protected abstract _animationTick(deltaTime: number);
    protected abstract _mouseGrab(deltaX: number, deltaY: number);
    protected abstract _onContextMenu(eve: PointerEvent);

    private _lastMousePos : Vector2D;
    private _mouseDownPoint : Vector2D;
    private _mouseDownTiming : number;
    
    public setLevel(aLevel: GameLevel)
    {
        this.level = aLevel;

        let levelBorder = new PIXI.Graphics;
        levelBorder.beginFill(0xaeaeae).drawRect(0, 0, 5000, 5000).endFill();
        this.stage.addChild(levelBorder);

        this._setLevel(aLevel);
    }

    private _tickerFunction(deltaTime: number)
    {
        this._animationTick(deltaTime);
    }

    public setScene(app: PIXI.Application)
    {
        this.appScreen = app.screen;
        this.stage.interactive = true;
        //this.stage.on("click", this.onMouseClick, this);
        this.stage.on("mousedown", this.onMouseDown, this);
        this.stage.on("mousemove", this.onMouseMove, this);
        this.stage.on("mouseup", this.onMouseUp, this);
        for (let aGameObject of this.level.objects)
        {
            aGameObject.setGraphicsParent(this.stage);
        }
        this.level.playerObj.setGraphicsParent(this.stage);
        app.stage = this.stage;

        PIXI.ticker.shared.add(this._tickerFunction, this);
    }

    public unsetScene()
    {
        PIXI.ticker.shared.remove(this._tickerFunction, this);
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

        this._onMouseClick(event);
    }

    public onMouseDown(event: PIXI.interaction.InteractionEvent)
    {
        this._lastMousePos = { x: event.data.global.x, y: event.data.global.y };
        this._mouseDownPoint = { x: event.data.global.x, y: event.data.global.y };
        this._mouseDownTiming = Date.now();
        // dont need to do much else here
        this._onMouseDown(event);
    }

    public onMouseUp(event: PIXI.interaction.InteractionEvent)
    {
        this._lastMousePos = undefined;
        let dx = Math.abs(this._mouseDownPoint.x - event.data.global.x);
        let dy = Math.abs(this._mouseDownPoint.y - event.data.global.y);
        let dt = Date.now() - this._mouseDownTiming;
        if (dx + dy < 6 && dt < 600)
            this.onMouseClick(event);
    }

    public onMouseMove(event: PIXI.interaction.InteractionEvent)
    {
        if (this._lastMousePos)
        {
            let newMousePos = event.data.global;
            this._mouseGrab(newMousePos.x - this._lastMousePos.x, newMousePos.y - this._lastMousePos.y);
            this._lastMousePos.x = newMousePos.x;
            this._lastMousePos.y = newMousePos.y;
        }
        this._onMouseMove(event);
    }

    public onContextMenu(event: PointerEvent)
    {
        return this._onContextMenu(event);
    }
}
