import {
  isArray,
  isClass
} from './util';

/**
 * @typedef {import('./index').InjectAnnotated } InjectAnnotated
 */

/**
 * @template T
 *
 * @params {[...string[], T] | ...string[], T} args
 *
 * @return {T & InjectAnnotated}
 */
export function annotate() {
  var args = Array.prototype.slice.call(arguments);

  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  var fn = args.pop();

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

var CONSTRUCTOR_ARGS = /constructor\s*[^(]*\(\s*([^)]*)\)/m;
var FN_ARGS = /^(?:async\s+)?(?:function\s*[^(]*)?(?:\(\s*([^)]*)\)|(\w+))/m;
var FN_ARG = /\/\*([^*]*)\*\//m;
var FN_CURLY = /{(.*?)}/;

/**
 * @param {unknown} fn
 *
 * @return {string[]}
 */
export function parseAnnotations(fn) {

  if (typeof fn !== 'function') {
    throw new Error('Cannot annotate "' + fn + '". Expected a function!');
  }

  var match = fn.toString().match(isClass(fn) ? CONSTRUCTOR_ARGS : FN_ARGS);

  // may parse class without constructor
  if (!match) {
    return [];
  }

  var args = match[1] || match[2];

  if (args && args.startsWith('{')) {
    let m = args.match(FN_CURLY)[1];
    args = m;
  }

  return args && args.split(',').map(function(arg) {
    var argMatch = arg.match(FN_ARG);
    return (argMatch && argMatch[1] || arg).trim();
  }) || [];
}