import {plainToClass, classToPlain, } from 'class-transformer';
import { ClassTransformOptions } from 'class-transformer/ClassTransformOptions';
import { ClassType } from 'class-transformer/ClassTransformer';
import 'reflect-metadata';
export {dynamoToClass, classToDynamo};

function dynamoToClass<T, V>(cls: ClassType<T>, plain: V, options?: ClassTransformOptions): T {
    return plainToClass(cls, plain, options);
}

function classToDynamo<T>(object: T, options?: ClassTransformOptions): Record<string, any> {
    return classToPlain(object,options);
}