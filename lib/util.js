var CLASS_PATTERN = /^class[ {]/;


/**
 * @param {function} fn
 *
 * @return {boolean}
 */
export function isClass(fn) {
  return CLASS_PATTERN.test(fn.toString());
}

/**
 * @param {any} obj
 *
 * @return {boolean}
 */
export function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * @param {any} obj
 * @param {string} prop
 *
 * @return {boolean}
 */
export function hasOwnProp(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}