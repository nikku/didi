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

export type FactoryFunction<T> = {
  (...args: any[]): T;
} & Annotated;

export type ArrayArgs<T> =
  [ T ] |
  [ string, T ] |
  [ string, string, T ] |
  [ string, string, string, T ] |
  [ string, string, string, string, T ] |
  [ string, string, string, string, string, T ] |
  [ string, string, string, string, string, string, T ] |
  [ string, string, string, string, string, string, string, T ] |
  [ string, string, string, string, string, string, string, string, T ] |
  [ string, string, string, string, string, string, string, string, string, T ];

export type ServiceProvider<T> = {
  (name: string): T;
};

export type FactoryDefinition<T> = FactoryFunction<T> | ArrayArgs<FactoryFunction<T>>;

export type TypeDefinition<T> = Constructor<T> | ArrayArgs<Constructor<T>>;

export type ValueDefinition<T> = T;

export type ServiceDefinition<T> = FactoryDefinition<T> | TypeDefinition<T> | ValueDefinition<T>;

type TypedDeclaration<T, D> = [ T, D ] | [ T, D, 'private' ];

export type ServiceDeclaration<T> =
  TypedDeclaration<ValueType, ValueDefinition<T>> |
  TypedDeclaration<TypeType, TypeDefinition<T>> |
  TypedDeclaration<FactoryType, FactoryDefinition<T>>;

export type ModuleDeclaration = {
  [name: string]: ServiceDeclaration<unknown> | ModuleDeclaration[] | string[];
};

// injector.js

export type InjectionContext = unknown;
export type LocalsMap = {
  [name: string]: unknown
};

export type ModuleDefinition = ModuleDeclaration;

export class Injector {
  constructor(modules: ModuleDefinition[], parent?: InjectorContext);
  get<T>(name: string, strict?: boolean): T;
  invoke<T>(func: (...args: unknown[]) => T, context: InjectionContext, locals: LocalsMap): T;
  instantiate<T>(Type: T): T;
  createChild(modules: ModuleDefinition[], forceNewInstances?: string[]): Injector;

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