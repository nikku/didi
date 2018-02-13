var CLASS_PATTERN = /^class /;

export function isClass(fn) {
  return CLASS_PATTERN.test(fn.toString());
}

export function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}