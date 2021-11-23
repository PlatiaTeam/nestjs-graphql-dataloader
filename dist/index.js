"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderedNestDataLoader = exports.ensureOrder = exports.LoaderContext = exports.Loader = exports.DataLoaderInterceptor = exports.NestDataLoaderContext = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const graphql_1 = require("@nestjs/graphql");
const dataloader_1 = __importDefault(require("dataloader"));
const NEST_LOADER_CONTEXT_KEY = "NEST_LOADER_CONTEXT_KEY";
class NestDataLoaderContext {
    constructor(dataloaderFactory) {
        this.dataloaderFactory = dataloaderFactory;
        this.id = core_1.ContextIdFactory.create();
        this.cache = new Map();
    }
    clearAll() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const loaderPromise of this.cache.values()) {
                const loader = yield loaderPromise;
                loader.clearAll();
            }
        });
    }
    getLoader(type) {
        let loader = this.cache.get(type);
        if (!loader) {
            loader = this.dataloaderFactory(this.id, type);
            this.cache.set(type, loader);
        }
        return loader;
    }
}
exports.NestDataLoaderContext = NestDataLoaderContext;
let DataLoaderInterceptor = class DataLoaderInterceptor {
    constructor(moduleRef) {
        this.moduleRef = moduleRef;
    }
    intercept(context, next) {
        if (context.getType() !== "graphql") {
            return next.handle();
        }
        const ctx = graphql_1.GqlExecutionContext.create(context).getContext();
        if (ctx[NEST_LOADER_CONTEXT_KEY] === undefined) {
            ctx[NEST_LOADER_CONTEXT_KEY] = new NestDataLoaderContext(this.createDataLoader.bind(this));
        }
        return next.handle();
    }
    createDataLoader(contextId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = yield this.moduleRef.resolve(type, contextId, { strict: false });
                return provider.generateDataLoader();
            }
            catch (e) {
                throw new common_1.InternalServerErrorException(`The loader ${type} is not provided` + e);
            }
        });
    }
};
DataLoaderInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.ModuleRef])
], DataLoaderInterceptor);
exports.DataLoaderInterceptor = DataLoaderInterceptor;
function getNestDataLoaderContext(context) {
    if (context.getType() !== "graphql") {
        throw new common_1.InternalServerErrorException("@Loader should only be used within the GraphQL context");
    }
    const graphqlContext = graphql_1.GqlExecutionContext.create(context).getContext();
    const nestDataLoaderContext = graphqlContext[NEST_LOADER_CONTEXT_KEY];
    if (!nestDataLoaderContext) {
        throw new common_1.InternalServerErrorException(`You should provide interceptor ${DataLoaderInterceptor.name} globally with ${core_1.APP_INTERCEPTOR}`);
    }
    return nestDataLoaderContext;
}
exports.Loader = (0, common_1.createParamDecorator)((data, context) => {
    if (!data) {
        throw new common_1.InternalServerErrorException(`No loader provided to @Loader ('${data}')`);
    }
    return getNestDataLoaderContext(context).getLoader(data);
});
exports.LoaderContext = (0, common_1.createParamDecorator)((data, context) => {
    return getNestDataLoaderContext(context);
});
const ensureOrder = (options) => {
    const { docs, keys, prop, error = (key) => `Document does not exist (${key})`, } = options;
    const docsMap = new Map();
    docs.forEach((doc) => docsMap.set(doc[prop], doc));
    return keys.map((key) => {
        return (docsMap.get(key) ||
            new Error(typeof error === "function" ? error(key) : error));
    });
};
exports.ensureOrder = ensureOrder;
class OrderedNestDataLoader {
    generateDataLoader() {
        return this.createLoader(this.getOptions());
    }
    createLoader(options) {
        const defaultTypeName = this.constructor.name.replace("Loader", "");
        return new dataloader_1.default((keys) => __awaiter(this, void 0, void 0, function* () {
            return (0, exports.ensureOrder)({
                docs: yield options.query(keys),
                keys,
                prop: options.propertyKey || "id",
                error: (keyValue) => `${options.typeName || defaultTypeName} does not exist (${keyValue})`,
            });
        }), options.dataloaderConfig);
    }
}
exports.OrderedNestDataLoader = OrderedNestDataLoader;
//# sourceMappingURL=index.js.map