import { CallHandler, ExecutionContext, NestInterceptor, Type } from "@nestjs/common";
import { ContextId, ModuleRef } from "@nestjs/core";
import DataLoader from "dataloader";
import { Observable } from "rxjs";
export interface NestDataLoader<ID, Type> {
    generateDataLoader(): DataLoader<ID, Type>;
}
interface DataLoaderFactory {
    (contextId: ContextId, type: Type<NestDataLoader<any, any>>): Promise<DataLoader<any, any>>;
}
export declare class NestDataLoaderContext {
    private readonly dataloaderFactory;
    private readonly id;
    private readonly cache;
    constructor(dataloaderFactory: DataLoaderFactory);
    clearAll(): Promise<void>;
    getLoader(type: Type<NestDataLoader<any, any>>): Promise<DataLoader<any, any>>;
}
export declare class DataLoaderInterceptor implements NestInterceptor {
    private readonly moduleRef;
    constructor(moduleRef: ModuleRef);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private createDataLoader;
}
export declare const Loader: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | Type<import("@nestjs/common").PipeTransform<any, any>> | Type<NestDataLoader<any, any>>)[]) => ParameterDecorator;
export declare const LoaderContext: (...dataOrPipes: any[]) => ParameterDecorator;
export declare const ensureOrder: (options: any) => any;
interface IOrderedNestDataLoaderOptions<ID, Type> {
    propertyKey?: string;
    query: (keys: readonly ID[]) => Promise<Type[]>;
    typeName?: string;
    dataloaderConfig?: DataLoader.Options<ID, Type>;
}
export declare abstract class OrderedNestDataLoader<ID, Type> implements NestDataLoader<ID, Type> {
    protected abstract getOptions: () => IOrderedNestDataLoaderOptions<ID, Type>;
    generateDataLoader(): DataLoader<ID, Type, ID>;
    protected createLoader(options: IOrderedNestDataLoaderOptions<ID, Type>): DataLoader<ID, Type>;
}
export {};
