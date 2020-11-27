
/**
 * @typedef {[ string, string, any ]} Provider;
 */

export default function Module() {
  var providers = /** @type {Provider[]} */ [];

  /**
   * Create a named service via a factory function.
   *
   * @template T
   * @param {string} name
   * @param {function(...any): any} factory
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
   * @param {any} value
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
   * @param {{new(...args: any[]): object}} type
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
   * @param {function(Provider): void} iterator
   */
  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };

}