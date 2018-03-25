import { GameLevel } from "./gamelevel";

export class GameObject
{
    private levelContainer: GameLevel;

    public setLevel(level: GameLevel) 
    {
        this.levelContainer = level;
    }
}
