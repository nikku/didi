
/**
 * @typedef {import('./types').FactoryDeclaration} FactoryDeclaration
 * @typedef {import('./types').TypeDeclaration} TypeDeclaration
 * @typedef {import('./types').ValueDeclaration} ValueDeclaration
 *
 * @typedef {[ string, string, any ]} Provider;
 */

export default function Module() {
  var providers = /** @type {Provider[]} */ [];

  /**
   * Create a named service via a factory function.
   *
   * @param {string} name
   * @param {FactoryDeclaration} factory
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
   * @param {ValueDeclaration} value
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
   * @param {TypeDeclaration} type
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
   * @param { { (provider: Provider): void } } iterator
   */
  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };

}