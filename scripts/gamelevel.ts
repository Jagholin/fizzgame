import { GameObject } from "./gameobject"
import * as Collisions from "./collisionmanager"
import { PlayerObject } from "./player"

export class GameLevel
{
    readonly objects: GameObject[] = [];
    readonly collisionManager: Collisions.CollisionManager = new Collisions.CollisionManager(0, 0, 5000, 5000);
    readonly playerObj: PlayerObject = new PlayerObject;

    public addObject(anObject: GameObject)
    {
        this.objects.push(anObject);
        anObject.setLevel(this);
    }

    public loadJsonData(jsonObject: any, graphicsParent: PIXI.Container)
    {
        if (!jsonObject.objects || !jsonObject.player)
            return;
        for (let anObject of jsonObject.objects)
        {
            if (typeof anObject.type !== "string")
                throw new Error("level object doesnt have a type field")
            if (anObject.type === "rect")
            {
                let gameObject = new GameObject;
                this.addObject(gameObject);
                gameObject.initFromJson(anObject, graphicsParent);
            }
            console.log(`Object ${anObject.type} loaded successfully`);
        }

        this.playerObj.initFromJson(jsonObject.player, graphicsParent);
    }
}
