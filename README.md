# `didi`

[![CI](https://github.com/nikku/didi/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/didi/actions/workflows/CI.yml)

A tiny [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) container for JavaScript.


## About

Using [`didi`][didi], you follow the [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) / [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) pattern. This means that you decouple component (service) declaration from instantiation. 

Components in `didi` are declared by name. Each component is a singleton. `didi` takes care of instantiating components and their dependencies as needed, caching them for future re-use. 

## Example

```ts
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

// define a (didi) module - it declares available
// components by name and specifies how these are provided
const carModule = {

  // asked for 'car', the injector will call new Car(...) to produce it
  'car': [ 'type', Car ],

  // asked for 'engine', the injector will call createPetrolEngine(...) to produce it
  'engine': [ 'factory', createPetrolEngine ],

  // asked for 'power', the injector will give it the number 1184
  'power': [ 'value', 1184 ] // probably Bugatti Veyron
};

// instantiate an injector with a set of (didi) modules
const injector = new Injector([
  carModule
]);

// use the injector API to retrieve a component
injector.get('car').start();

// alternatively invoke a function, injecting the arguments
injector.invoke(function(car) {
  console.log('started', car);
});

// if you work with a TypeScript code base, retrieve
// a typed instance of a component
const car: Car = injector.get<Car>('car');

car.start();
```

For real-world examples, check out [Karma](https://github.com/karma-runner/karma), [diagram-js](https://github.com/bpmn-io/diagram-js), or [Wuffle](https://github.com/nikku/wuffle/tree/main/packages/app)—libraries that heavily use dependency injection at their core. You can also check out [the tests](https://github.com/nikku/didi/blob/master/test/injector.spec.js) to learn about all supported use cases.


## Usage

Learn how to [define modules](#defining-modules) that [declare](#declaring-components), [inject](#injecting-components) and [initialize](#initializing-components) your components.

### Defining modules

You [declare your components](#declaring-components) by name as part of a `didi` module:

```js
const engineModule = {
  'engine': [ 'type', DieselEngine ]
};

const carModule = {
  'car': [ 'factory', function createCar(engine) { ... } ]
};
```

You pass a set of modules to instantiate the `didi` container:

```js
import { Injector } from 'didi';

const injector = new Injector([
  engineModule,
  carModule
]);
```

A module can depend on other modules through the `__depends__` tag- As a result, `didi` will load it transitively, too:

```js
const mainModule = {
  __depends__: [ carModule, engineModule ]
};

const injector = new Injector([ mainModule ]);
```

Components declared by later modules [will override](#overriding-components) those declared earlier; this can be useful for customization and testing.

### Declaring components

By declaring a component as part of a [`didi` module](#defining-modules), you make it available to other components.

#### `type(token, Constructor)`

`Constructor` will be called with the `new` operator to produce the instance:

```js
const module = {
  'engine': [ 'type', DieselEngine ]
};
```

#### `factory(token, factoryFn)`

The injector produces the instance by calling `factoryFn` without any context. It uses the factory's return value:

```js
const module = {
  'engine': [ 'factory', createDieselEngine ]
};
```

#### `value(token, value)`

Register a static value:

```js
const module = {
  'power': [ 'value', 1184 ]
};
```


### Injecting components

The injector looks up dependencies based on explicit annotations, comments, or function argument names.

#### Argument names

If no further details are provided, the injector parses dependency names from function arguments:

```js
function Car(engine, license) {
  // will inject components bound to 'engine' and 'license'
}
```

#### Function comments

You can use comments to encode names:

```js
function Car(/* engine */ e, /* x._weird */ x) {
  // will inject components bound to 'engine' and 'x._weird'
}
```

#### `$inject` annotation

You can use a static `$inject` annotation to declare dependencies in a minification-safe manner:

```js
function Car(e, license) {
  // will inject components bound to 'engine' and 'license'
}

Car.$inject = [ 'engine', 'license' ];
```

#### Array notation

You can also use the minification save array notation known from [AngularJS][AngularJS]:

```js
const Car = [ 'engine', 'trunk', function(e, t) {
  // will inject components bound to 'engine' and 'trunk'
}];
```

#### Partial injection

Sometimes it is helpful to inject only a specific property of some object:

```js
function Engine(/* config.engine.power */ power) {
  // will inject 1184 (config.engine.power),
  // assuming there is no direct binding for 'config.engine.power' token
}

const engineModule = {
  'config': [ 'value', { engine: { power: 1184 }, other : {} } ]
};
```

### Component instantiation

In [`didi`][didi] components are singletons, instantiated lazily, as needed, and cached for later re-use:

```js
// instantiates the <car> on first access
const car = injector.get('car');

injector.invoke(function(car) {
  // re-uses <car> as instantiated earlier
});
```

You may define [module init hooks](#initializing-components) to mark components that should be eagerly loaded.

> [!IMPORTANT]  
> `didi` only supports synchronous component instantiation. If you look for async instantiation, give [`async-didi`][async-didi] a try. 


### Initializing components

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


### Overriding components

You can override components by name. That can be beneficial for testing, but also for customizing:

```js
import { Injector } from 'didi';

import coreModule from './core.js';
import { HttpBackend } from './test/mocks.js';

const injector = new Injector([
  coreModule,
  {
    // overrides already declared `httpBackend`
    httpBackend: [ 'type', HttpBackend ]
  }
]);
```


### Type-safety

[`didi`][didi] ships type declarations that allow you to use it in a type-safe manner.

#### Explicit typing

Pass a type attribute to `Injector#get` to retrieve a service as a known type:

```typescript
const hifiComponent = injector.get<HifiComponent>('hifiComponent');

// typed as <HifiComponent>
hifiComponent.toggle();
```

#### Implicit typing

Configure the `Injector` through a service map and automatically cast services
to known types:

```typescript
type ServiceMap = {
  'hifiComponent': HifiComponent
};

const injector = new Injector<ServiceMap>(...);

const hifiComponent = injector.get('hifiComponent');
// typed as <HifiComponent>
```


## Credits

This library builds on top of the (now unmaintained) [`node-di`][node-di] library. `didi` is a maintained fork that adds support for ES6, the minification safe array notation, and [other features](#differences-to-node-di).


## Differences to [`node-di`][node-di]

- supports array notation
- supports [ES2015](http://babeljs.io/learn-es2015/)
- bundles type definitions
- module initialization + module dependencies


## License

MIT


[AngularJS]: http://angularjs.org/
[node-di]: https://github.com/vojtajina/node-di
[didi]: https://github.com/nikku/didi
[async-didi]: https://github.com/nikku/async-didi
