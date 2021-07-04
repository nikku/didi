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
) & Annotated;

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
  (name: string): T
};

export type FactoryDeclaration<T> = FactoryFunction<T> | ArrayArgs<FactoryFunction<T>>;

export type TypeDeclaration<T> = Constructor<T> | ArrayArgs<Constructor<T>>;

export type ValueDeclaration<T> = T;

type Declaration<T, D> = [ T, D ] | [ T, D, 'private' ];

export type ServiceDeclaration<T> =
  Declaration<ValueType, ValueDeclaration<T>> |
  Declaration<TypeType, TypeDeclaration<T>> |
  Declaration<FactoryType, FactoryDeclaration<T>>;

export type ModuleDeclaration = {
  __exports__?: string[],
  __modules__?: ModuleDeclaration[],
  [name: string]: ServiceDeclaration<?> | ModuleDeclaration[] | string[]
};
