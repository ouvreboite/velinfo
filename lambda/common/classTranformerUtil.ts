import { Transform } from 'class-transformer';

export function TransformDate() {
    const toPlain = Transform(value => value ? (value as Date).toISOString() : undefined, {
        toPlainOnly: true
    });

    const toClass = Transform(value => value ? new Date(value) : undefined, {
        toClassOnly: true
    });

    return function (target: any, key: string) {
        toPlain(target, key);
        toClass(target, key);
    };
}
