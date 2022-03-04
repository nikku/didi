# Changelog

All notable changes to [didi](https://github.com/nikku/didi) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 8.0.0

* `FEAT`: separate bootstrapping and initialization

### Breaking Changes

* Injector must be manually initialized via `Injector#init()`

## 7.0.1

* `FIX`: make core `ES5`, again

## 7.0.0

* `FEAT`: add support for module dependencies and intialization ([#13](https://github.com/nikku/didi/pull/13))
* `FEAT`: retain stack traces when throwing errors ([`999b821b`](https://github.com/nikku/didi/commit/999b821b2f630a8d74fade566281875ef628a6d3))
* `FIX`: parse single arg lambda shorthand ([`d53f6310`](https://github.com/nikku/didi/commit/d53f631023daa547ae9eb17dbbd5abae08573051))
* `CHORE`: remove `Module` from public API
* `CHORE`: drop `Node@10` support

### Breaking Changes

* Removed `Module` export. Use documented `ModuleDeclaration` to define a didi module
* Improved `ModuleDeclaration` typings to clearly reflect API used
* `__init__` and `__depends__` are now part of the built-in module exports accounted for ([#13](https://github.com/nikku/didi/pull/13))

## 6.1.0

* `FEAT`: move to pre-built type definitions

## 6.0.0

* `FEAT`: add type definitions

## 5.2.1

* `FIX`: detect arguments in (async) closures, too

## 5.2.0

* `CHORE`: expose `parseAnnotations`

## 5.1.0

* `DOCS`: improve

## 5.0.1

* `FIX`: remove async injector from main bundle, will be released seperately

## 5.0.0

* `FEAT`: add async injector :tada:
* `CHORE`: no-babel build
* `CHORE`: minify using `terser`

## 4.0.0

### Breaking Changes

* `FIX`: remove browser field again; it confuses modern module bundlers. This partially reverts `v3.1.0`

## 3.2.0

* `CHORE`: mark library as side-effect free via `sideEffects: false`

## 3.1.0

* `CHORE`: add `browser` field

## 3.0.0

### Breaking Changes

* `CHORE`: don't expose `lib` folder; library consumers should use API exposed via bundled artifacts

### Other Improvements

* `FEAT`: allow local overrides on `Injector#invoke`
* `CHORE`: babelify all produced bundles

## 2.0.1

* `FIX`: make injection work on constructor less ES2015 `class`

## 2.0.0

* `FEAT`: support ES2015 `class` as injection targets, too
* `FEAT`: always instantiate `type` using `new`
* `CHORE`: bundle `es`, `cjs` and `umd` distributions via rollup

## 1.0.1 - 1.0.3

* `FIX`: properly include resources in bundle

## 1.0.0

* `FEAT`: port to ES2015

## ...

Check `git log` for earlier history.
