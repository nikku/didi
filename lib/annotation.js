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
//
// Destructured Object limitations
// - comments in a multi-line will fail with a comma and child objects can hae more than one prop
// {
//   a: 1, // this will work as long as it doesnt have a comma
//   b: { c: 2, d: 3 } // this will fail, remove the d and its fine
// }

var CONSTRUCTOR_ARGS = /constructor\s*[^(]*\(\s*([^)]*)\)/m;
var FN_ARGS = /^(?:async\s+)?(?:function\s*[^(]*)?(?:\(\s*([^)]*)\)|(\w+))/m;
var FN_ARG = /\/\*([^*]*)\*\//m;
var OBJ_DEFAULTS = /([^=]*)[=]?/; // matches the prop in x=123 or x: b = 123

// TODO using replace below as it seems to be caputuring the quotes. come back to this.
// var OBJ_COLON = /['"]?(.+?)['"]?\s?:/m; // matches the prop in foo:bar 'foo':bar 'foo.buz':bar
var OBJ_COLON = /(?:\/\/.*\n)?([^:]*)[:]?/m; // matches the prop in foo:bar 'foo':bar 'foo.buz':bar


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

  // if it starts with { then assume its a destructuctured object param in form {a,b,c} and remove the start and end curlys
  // will prefix with '...' so a,b will become ...,a,b which is the indicator to injector to pass object for destructuring.
  if (args && args.startsWith('{')) {
    args = `...,${ args.slice(1, -1).trim() }`;
  }

  return args && args.split(',').map(function(arg) {
    var argMatch = arg.match(FN_ARG);
    var argDefMatch = arg.match(OBJ_DEFAULTS); // looks for defaults like a= or a:b=
    var argColonMatch = argDefMatch && argDefMatch[1].trim().match(OBJ_COLON); // looks for destructured rename a:b
    return (
      (argMatch && argMatch[1])
      || (argColonMatch && argColonMatch[1].replaceAll('"','').replaceAll("'",''))
      || arg
    ).trim();
  }) || [];
}