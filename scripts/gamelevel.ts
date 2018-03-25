import { GameObject } from "./gameobject"

export class GameLevel
{
    private objects: GameObject[] = [];

    public addObject(anObject: GameObject)
    {
        this.objects.push(anObject);
        anObject.setLevel(this);
    }
}
