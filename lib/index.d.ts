export type ValueType = 'value';
export type FactoryType = 'factory';
export type TypeType = 'type';

export type ProviderType = ValueType | FactoryType | TypeType;

export type InjectAnnotated = {
  $inject?: string[];
};

export type ScopeAnnotated = {
  $scope?: string[];
};

export type Annotated = InjectAnnotated & ScopeAnnotated;

export type Constructor<T> = (
  { new (...args: any[]): T } |
  { (...args: any[]): T }
);

export type InitializerFunction = {
  (...args: any[]): unknown
} & Annotated;

export type FactoryFunction<T> = {
  (...args: any[]): T;
} & Annotated;

export type ArrayArgs<T> = [ ...string[], T ];

export type ArrayFunc<T> = [ ...string[], FactoryFunction<T> ];

export type ArrayConstructor<T> = [ ...string[], Constructor<T> ];

export type ServiceProvider<T> = {
  (name: string): T;
};

export type Initializer = InitializerFunction | ArrayArgs<InitializerFunction>;

export type FactoryDefinition<T> = FactoryFunction<T> | ArrayArgs<FactoryFunction<T>>;

export type TypeDefinition<T> = Constructor<T> | ArrayArgs<Constructor<T>>;

export type ValueDefinition<T> = T;

export type ServiceDefinition<T> = FactoryDefinition<T> | TypeDefinition<T> | ValueDefinition<T>;

export type TypedDeclaration<T, D> = [ T, D ] | [ T, D, 'private' ];

export type ServiceDeclaration<T> =
  TypedDeclaration<ValueType, ValueDefinition<T>> |
  TypedDeclaration<TypeType, TypeDefinition<T>> |
  TypedDeclaration<FactoryType, FactoryDefinition<T>>;

export type ModuleDeclaration = {
  [name: string]: ServiceDeclaration<unknown> | unknown;
  __init__?: Array<string|InitializerFunction>;
  __depends__?: Array<ModuleDeclaration>;
  __exports__?: Array<string>;
  __modules__?: Array<ModuleDeclaration>;
};

// injector.js

export type InjectionContext = unknown;
export type LocalsMap = {
  [name: string]: unknown
};

export type ModuleDefinition = ModuleDeclaration;


export class Injector<
  ServiceMap = null
> {

  /**
   * Create an injector from a set of modules.
   */
  constructor(modules: ModuleDefinition[], parent?: InjectorContext);

  /**
   * Return a named service, looked up from the existing service map.
   */
  get<Name extends keyof ServiceMap>(name: Name): ServiceMap[Name];

  /**
   * Return a named service, and throws if it is not found.
   */
  get<T>(name: string): T;

  /**
   * Return a named service.
   */
  get<T>(name: string, strict: true): T;

  /**
   * Return a named service or `null`.
   */
  get<T>(name: string, strict: boolean): T | null;

  /**
   * Invoke the given function, injecting dependencies. Return the result.
   *
   * @example
   *
   * ```javascript
   * injector.invoke(function(car) {
   *   console.log(car.started);
   * });
   * ```
   */
  invoke<T>(func: FactoryFunction<T>, context?: InjectionContext, locals?: LocalsMap): T;

  /**
   * Invoke the given function, injecting dependencies provided in
   * array notation. Return the result.
   *
   * @example
   *
   * ```javascript
   * injector.invoke([ 'car', function(car) {
   *   console.log(car.started);
   * } ]);
   * ```
   */
  invoke<T>(func: ArrayFunc<T>, context?: InjectionContext, locals?: LocalsMap): T;

  /**
   * Instantiate the given type, injecting dependencies.
   *
   * @example
   *
   * ```javascript
   * injector.instantiate(Car);
   * ```
   */
  instantiate<T>(constructor: Constructor<T>): T;

  /**
   * Instantiate the given type, injecting dependencies provided in array notation.
   *
   * @example
   *
   * ```javascript
   * injector.instantiate([ 'hifi', Car ]);
   * ```
   */
  instantiate<T>(constructor: ArrayConstructor<T>): T;

  /**
   * Create a child injector.
   */
  createChild(modules: ModuleDefinition[], forceNewInstances?: string[]): Injector;

  /**
   * Initializes the injector once, calling `__init__`
   * hooks on registered injector modules.
   */
  init(): void;

  /**
   * @internal
   */
  _providers: object;
}

export type InjectorContext = {
  get<T>(name: string, strict?: boolean): T;

  /**
   * @internal
   */
  _providers?: object
};

// annotation.js

export function annotate<T>(...args: unknown[]): T & InjectAnnotated;

export function parseAnnotations(fn: unknown) : string[];