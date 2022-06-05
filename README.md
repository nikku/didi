# `didi`

[![CI](https://github.com/nikku/didi/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/didi/actions/workflows/CI.yml)

A tiny [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) / [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) container for JavaScript.


## About

[`didi`](https://github.com/nikku/didi) allows you to decouple component declaration from instantiation. Once you declared available components `didi` instantiates them as needed, transitively resolves all their dependencies, and caches instances for re-use.


## Example

```js
import { Injector } from 'didi';

function Car(engine) {
  this.start = function() {
    engine.start();
  };
}

function createPetrolEngine(power) {
  return {
    start: function() {
      console.log('Starting engine with ' + power + 'hp');
    }
  };
}

// a (didi) module is an object that declares available components
// by name and specifies how these are provided
const carModule = {
  // asked for 'car', the injector will call new Car(...) to produce it
  'car': ['type', Car],
  // asked for 'engine', the injector will call createPetrolEngine(...) to produce it
  'engine': ['factory', createPetrolEngine],
  // asked for 'power', the injector will give it number 1184
  'power': ['value', 1184] // probably Bugatti Veyron
};

// the injector is created using a set of modules
const injector = new Injector([
  carModule
]);

// using the injector API components can be retrieved
injector.get('car').start();

// ...and otherwise interacted with
injector.invoke(function(car) {
  console.log('started', car);
});
```

For real world examples check out [Karma](https://github.com/karma-runner/karma) or [diagram-js](https://github.com/bpmn-io/diagram-js), two libraries that heavily use dependency injection at its core.

You can also check out [the tests](https://github.com/nikku/didi/blob/master/test/injector.spec.js) to learn about all supported use cases.


## Usage

Learn how to [declare](#declaring-components), [inject](#injecting-components) and [initialize](#initializing-components) your components.


### Declaring Components

By declaring a component as part of a `didi` module you make it available to other components.

#### `type(token, Constructor)`

To produce the instance, `Constructor` will be called with `new` operator.

```js
const module = {
  'engine': ['type', DieselEngine]
};
```

#### `factory(token, factoryFn)`

To produce the instance, `factoryFn` is called without any context. The factories return value will be used.

```js
const module = {
  'engine': ['factory', createDieselEngine]
};
```

#### `value(token, value)`

Register a static value.

```js
const module = {
  'power': ['value', 1184]
};
```


### Injecting Components

The injector looks up dependencies based on explicit annotations, comments or function argument names.

#### Argument Names

If no further details are provided the injector parses dependency names from function arguments:

```js
function Car(engine, license) {
  // will inject objects bound to 'engine' and 'license'
}
```

#### Explicit Comments

You can use comments to encode names:

```js
function Car(/* engine */ e, /* x._weird */ x) {
  // will inject objects bound to 'engine' and 'x._weird'
}
```

#### Explicit `$inject` Annotation

You can use a static `$inject` annotation to declare dependencies in a minification safe manner:

```js
function Car(e, license) {
  // will inject objects bound to 'engine' and 'license'
}
```

#### Array Notation

You can also the minification save array notation known from [AngularJS][AngularJS]:

```js
const Car = [ 'engine', 'trunk', function(e, t) {
  // will inject objects bound to 'engine' and 'trunk'
}];
```

#### Partial Injection

Sometimes it is helpful to inject only a specific property of some object:

```js
function Engine(/* config.engine.power */ power) {
  // will inject 1184 (config.engine.power),
  // assuming there is no direct binding for 'config.engine.power' token
}

const engineModule = {
  'config': ['value', {engine: {power: 1184}, other : {}}]
};
```


### Initializing Components

Modules can use an `__init__` hook to declare components that shall be eagerly loaded or functions to eagerly be invoked, i.e. to trigger side-effects during intialization.

```javascript
import { Injector } from 'didi';

function HifiComponent(events) {
  events.on('toggleHifi', this.toggle.bind(this));

  this.toggle = function(mode) {
    console.log(`Toggled Hifi ${mode ? 'ON' : 'OFF'}`);
  };
}

const injector = new Injector([
  {
    __init__: [ 'hifiComponent' ],
    hifiComponent: [ 'type', HifiComponent ]
  },
  ...
]);

// initializes all modules as defined
injector.init();
```


### Overriding Components

Components can be overriden by name. This can be beneficial for testing, but also customizing:

```js
import { Injector } from 'didi';

import coreModule from './core';
import HttpBackend from './test/mocks';

const injector = new Injector([
  coreModule,
  {
    // overrides already declared `httpBackend`
    httpBackend: [ 'type', HttpBackend ]
  }
]);
```


## Credits

This library is built on top of the (now unmaintained) [node-di][node-di] library. `didi` is a maintained fork that adds support for ES6, the minification save array notation and other features.


## Differences to [node-di][node-di]

- supports array notation
- supports [ES2015](http://babeljs.io/learn-es2015/)
- bundles type definitions
- module initialization + module dependencies


## License

MIT


[AngularJS]: http://angularjs.org/
[node-di]: https://github.com/vojtajina/node-di
