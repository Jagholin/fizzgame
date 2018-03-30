import { GameObject } from "./gameobject"
import * as Collisions from "./collisionmanager"
import { PlayerObject } from "./player"
import * as _ from "lodash"

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

    public objectsUnderCursor(x: number, y: number) : GameObject[]
    {
        const formsUnderCursor: Collisions.CollisionForm[] = this.collisionManager.formsIntersectingPoint({x: x, y: y});
        const result: GameObject[] = _.map(formsUnderCursor, (aForm: Collisions.CollisionForm): GameObject => {
            return aForm.owner as GameObject;
        });
        return result;
    }

    public removeObject(anObject: GameObject)
    {
        _.remove(this.objects, (o:GameObject): boolean=>{return o === anObject});
        anObject.cutLevelAssociation();
    }

    public init() 
    {
        // do something?
    }

    public loadJsonData(jsonObject: any)
    {
        if (!jsonObject.objects || !jsonObject.player)
            return;
        for (let anObject of jsonObject.objects)
        {
            if (! _.isString(anObject.type))
                throw new Error("level object doesnt have a type field")
            if (anObject.type === "rect" || anObject.type === "polygon")
            {
                let gameObject = new GameObject;
                this.addObject(gameObject);
                gameObject.initFromJson(anObject);
            }
            console.log(`Object ${anObject.type} loaded successfully`);
        }

        this.playerObj.initFromJson(jsonObject.player);
    }
}
