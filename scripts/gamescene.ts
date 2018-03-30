import * as PIXI from "pixi.js"
import * as Collisions from "./collisionmanager"
import { AsyncLoader } from "./utils"
import { GameLevel } from "./gamelevel";
import { UIScene } from "./uiscene";

/**
 * Class that represents and shows a game scene
 * 
 * @export
 * @class GameScene
 */
export class GameScene extends UIScene
{
    protected _setLevel(aLevel: GameLevel)
    {
        this.level.playerObj.onPositionChange.push((newPos: Collisions.Vector2D) => {
            this.stage.position.set(0.5*this.appScreen.width-newPos.x, 0.5*this.appScreen.height-newPos.y);
        })
    }

    protected _onMouseClick(eve: PIXI.interaction.InteractionEvent)
    {

    }

    protected _animationTick(deltaTime: number)
    {
        const MAXVELOCITY = 250.0/60.0;
        let playerVelocity: Collisions.Vector2D = {x: 0, y: 0};
        if (this.keystates.get("a"))
            playerVelocity.x -= 1;
        if (this.keystates.get("d"))
            playerVelocity.x += 1;
        if (this.keystates.get("s"))
            playerVelocity.y += 1;
        if (this.keystates.get("w"))
            playerVelocity.y -= 1;
        const size = playerVelocity.x*playerVelocity.x + playerVelocity.y*playerVelocity.y;
        if (size > 0)
        {
            const scaleFactor = MAXVELOCITY / Math.sqrt(size);
            playerVelocity.x *= scaleFactor;
            playerVelocity.y *= scaleFactor;
            const collisionManager = this.level.collisionManager;
            this.level.playerObj.collisionCheckMove(playerVelocity, (f:Collisions.CollisionForm): boolean => {
                let collArray: Collisions.CollisionForm[] = collisionManager.collisionsWith(f);
                return collArray.length === 0;
            })
        }
    }

    protected _mouseGrab(x: number, y: number)
    {
        // noop
    }
}