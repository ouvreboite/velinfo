import { TransformDate } from "../classTranformerUtil";

export class ContentDelta {
    electrical: number = 0;
    mechanical: number = 0;
    activity: number = 0;
    @TransformDate()
    inactiveSince?: Date;
}