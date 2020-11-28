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

export type Constructor<T extends unknown> = {
  new (...args: any[]): T;
  (...args: any[]): T;
} & Annotated;

export type FactoryFunction<T extends unknown> = {
  (...args: any[]): T;
} & Annotated;

export type ArrayArgs<T> = [ ...string[], T ];

export type ServiceProvider<T extends unknown> = {
  (name: string): T
};

export type FactoryDeclaration = FactoryFunction | ArrayArgs<FactoryFunction>;

export type TypeDeclaration = Constructor | ArrayArgs<Constructor>;

export type ValueDeclaration = any;

type Declaration<T, D> = [ T, D ] | [ T, D, 'private' ];

export type ServiceDeclaration =
  Declaration<ValueType, ValueDeclaration> |
  Declaration<TypeType, TypeDeclaration> |
  Declaration<FactoryType, FactoryDeclaration>;

export type ModuleDeclaration = {
  __exports__?: string[],
  __modules__?: ModuleDeclaration[],
  [name: string]: ServiceDeclaration | ModuleDeclaration[] | string[]
};
