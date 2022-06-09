# `didi`

[![CI](https://github.com/nikku/didi/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/didi/actions/workflows/CI.yml)

A tiny [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) container for JavaScript.


## About

Using [`didi`](https://github.com/nikku/didi) you follow the [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) / [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) pattern, decoupling component declaration from instantiation. Once declared, `didi` instantiates components as needed, transitively resolves their dependencies, and caches instances for re-use.


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

// define a (didi) module
// it declares available components by name and specifies how these are provided
const carModule = {
  // asked for 'car', the injector will call new Car(...) to produce it
  'car': ['type', Car],
  // asked for 'engine', the injector will call createPetrolEngine(...) to produce it
  'engine': ['factory', createPetrolEngine],
  // asked for 'power', the injector will give it number 1184
  'power': ['value', 1184] // probably Bugatti Veyron
};

// instantiate an injector with a set of (didi) modules
const injector = new Injector([
  carModule
]);

// use the injector API to retrieve components
injector.get('car').start();

// ...or invoke a function, injecting the arguments
injector.invoke(function(car) {
  console.log('started', car);
});
```

For real-world examples, check out [Karma](https://github.com/karma-runner/karma) or [diagram-js](https://github.com/bpmn-io/diagram-js), two libraries that heavily use dependency injection at their core. You can also check out [the tests](https://github.com/nikku/didi/blob/master/test/injector.spec.js) to learn about all supported use cases.


## Usage

Learn how to [declare](#declaring-components), [inject](#injecting-components) and [initialize](#initializing-components) your components.


### Declaring Components

By declaring a component as part of a `didi` module, you make it available to other components.

#### `type(token, Constructor)`

`Constructor` will be called with `new` operator to produce the instance:

```js
const module = {
  'engine': ['type', DieselEngine]
};
```

#### `factory(token, factoryFn)`

The injector produces the instance by calling `factoryFn` without any context. It uses the factory's return value:

```js
const module = {
  'engine': ['factory', createDieselEngine]
};
```

#### `value(token, value)`

Register a static value:

```js
const module = {
  'power': ['value', 1184]
};
```


### Injecting Components

The injector looks up dependencies based on explicit annotations, comments, or function argument names.

#### Argument Names

If no further details are provided the injector parses dependency names from function arguments:

```js
function Car(engine, license) {
  // will inject components bound to 'engine' and 'license'
}
```

#### Function Comments

You can use comments to encode names:

```js
function Car(/* engine */ e, /* x._weird */ x) {
  // will inject components bound to 'engine' and 'x._weird'
}
```

#### `$inject` Annotation

You can use a static `$inject` annotation to declare dependencies in a minification safe manner:

```js
function Car(e, license) {
  // will inject components bound to 'engine' and 'license'
}

Car.$inject = [ 'engine', 'license' ];
```

#### Array Notation

You can also the minification save array notation known from [AngularJS][AngularJS]:

```js
const Car = [ 'engine', 'trunk', function(e, t) {
  // will inject components bound to 'engine' and 'trunk'
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

Modules can use an `__init__` hook to declare components that shall eagerly load or functions to be invoked, i.e., trigger side-effects during initialization:

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

You can override components by name. That can be beneficial for testing but also for customizing:

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

This library builds on top of the (now unmaintained) [node-di][node-di] library. `didi` is a maintained fork that adds support for ES6, the minification safe array notation, and other features.


## Differences to [node-di][node-di]

- supports array notation
- supports [ES2015](http://babeljs.io/learn-es2015/)
- bundles type definitions
- module initialization + module dependencies


## License

MIT


[AngularJS]: http://angularjs.org/
[node-di]: https://github.com/vojtajina/node-di
