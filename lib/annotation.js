import {
  isArray,
  isClass
} from './util.js';

/**
 * @typedef {import('./index.js').InjectAnnotated } InjectAnnotated
 */

/**
 * @template T
 *
 * @params {[...string[], T] | ...string[], T} args
 *
 * @return {T & InjectAnnotated}
 */
export function annotate(...args) {

  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  args = [ ...args ];

  const fn = args.pop();

  fn.$inject = args;

  return fn;
}


// Current limitations:
// - can't put into "function arg" comments
// function /* (no parenthesis like this) */ (){}
// function abc( /* xx (no parenthesis like this) */ a, b) {}
//
// Just put the comment before function or inside:
// /* (((this is fine))) */ function(a, b) {}
// function abc(a) { /* (((this is fine))) */}
//
// - can't reliably auto-annotate constructor; we'll match the
// first constructor(...) pattern found which may be the one
// of a nested class, too.

const CONSTRUCTOR_ARGS = /constructor\s*[^(]*\(\s*([^)]*)\)/m;
const FN_ARGS = /^(?:async\s+)?(?:function\s*[^(]*)?(?:\(\s*([^)]*)\)|(\w+))/m;
const FN_ARG = /\/\*([^*]*)\*\//m;

/**
 * @param {unknown} fn
 *
 * @return {string[]}
 */
export function parseAnnotations(fn) {

  if (typeof fn !== 'function') {
    throw new Error(`Cannot annotate "${fn}". Expected a function!`);
  }

  const match = fn.toString().match(isClass(fn) ? CONSTRUCTOR_ARGS : FN_ARGS);

  // may parse class without constructor
  if (!match) {
    return [];
  }

  const args = match[1] || match[2];

  return args && args.split(',').map(arg => {
    const argMatch = arg.match(FN_ARG);
    return (argMatch && argMatch[1] || arg).trim();
  }) || [];
}