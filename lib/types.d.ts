export type ProviderType = 'value' | 'factory' | 'type' | 'private';

export type ServiceDeclaration =
  [ ProviderType, any ] |
  [ function(string) : any, string, ProviderType, any ];

export type ModuleDeclaration = {
  __exports__?: string[],
  __modules__?: ModuleDeclaration[],
  [x: string]: ServiceDeclaration
};