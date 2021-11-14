
/**
 * @typedef {import('./index').ModuleProvider} ModuleProvider
 * @typedef {import('./index').FactoryDefinition<unknown>} FactoryDefinition
 * @typedef {import('./index').ValueDefinition<unknown>} ValueDefinition
 * @typedef {import('./index').TypeDefinition<unknown>} TypeDefinition
 */

export default function Module() {
  var providers = /** @type {ModuleProvider[]} */ ([]);

  /**
   * Create a named service via a factory function.
   *
   * @param {string} name
   * @param {FactoryDefinition} factory
   *
   * @return {Module}
   */
  this.factory = function(name, factory) {
    providers.push([name, 'factory', factory]);
    return this;
  };

  /**
   * Provide a named service by value.
   *
   * @param {string} name
   * @param {ValueDefinition} value
   *
   * @return {Module}
   */
  this.value = function(name, value) {
    providers.push([name, 'value', value]);
    return this;
  };

  /**
   * Provide a named service via a constructor.
   *
   * @param {string} name
   * @param {TypeDefinition} type
   *
   * @return {Module}
   */
  this.type = function(name, type) {
    providers.push([name, 'type', type]);
    return this;
  };

  /**
   * Iterate over all providers.
   *
   * @param { (provider: ModuleProvider) => void } iterator
   */
  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };

}