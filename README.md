# `didi`

[![Build Status](https://travis-ci.org/nikku/didi.svg?branch=master)](https://travis-ci.org/nikku/didi)

A tiny [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) / [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) container for JavaScript. 

## About

[Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) decouples component and component dependency instantiation from component behavior. That benefits your applications in the following ways: 

- **explicit dependencies** - all dependencies are passed in as constructor arguments, which makes it easy to understand how particular object depends on the rest of the environment
- **code reuse** - such a component is much easier to reuse in other environments because it is not coupled to a specific implementation of its dependencies
- **much easier to test** - component dependencies can be mocked trivially / overridden for testing

Following this pattern without a framework, you typically end up with some nasty `main()` method, where you instantiate all the objects and wire them together. 

`didi` is a dependency injection container that saves you from this boilerplate. **It makes wiring the application declarative rather than imperative.** Each component declares its dependencies, and the framework does transitively resolve these dependencies.


## Example

```js
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

// a module is just a plain JavaScript object
// it is a recipe for the injector, how to instantiate stuff
const carModule = {
  // if an object asks for 'car', the injector will call new Car(...) to produce it
  'car': ['type', Car],
  // if an object asks for 'engine', the injector will call createPetrolEngine(...) to produce it
  'engine': ['factory', createPetrolEngine],
  // if an object asks for 'power', the injector will give it number 1184
  'power': ['value', 1184] // probably Bugatti Veyron
};

const { Injector } = require('didi');
const injector = new Injector([
  carModule
]);

injector.invoke(function(car) {
  car.start();
});
```

For more examples, check out [the tests](https://github.com/nikku/didi/blob/master/test/injector.spec.js). 

You can also check out [Karma](https://github.com/karma-runner/karma) or [diagram-js](https://github.com/bpmn-io/diagram-js), two libraries that heavily use dependency injection at its core.


## Usage

### On the Web

Use the minification save array notation to declare types or factories and their respective dependencies:

```javascript
const carModule = {
  'car': ['type', [ 'engine', Car ]],
  ...
};

const {
  Injector
} = require('didi');

const injector = new Injector([
  carModule
])

injector.invoke(['car', function(car) {
  car.start();
}]);
```


### Registering Stuff

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

Register the final value.

```js
const module = {
  'power': ['value', 1184]
};
```


### Annotation

The injector looks up tokens based on argument names:

```js
function Car(engine, license) {
  // will inject objects bound to 'engine' and 'license' tokens
}
```

You can also use comments:
```js
function Car(/* engine */ e, /* x._weird */ x) {
  // will inject objects bound to 'engine' and 'x._weird' tokens
}
```

You can also the minification save array notation known from [AngularJS][AngularJS]:
```js
const Car = [ 'engine', 'trunk', function(e, t) {
  // will inject objects bound to 'engine' and 'trunk'
}];
```

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

## Credits

This library is built on top of the (now unmaintained) [node-di][node-di] library. `didi` is a maintained fork that adds support for ES6, the minification save array notation and other features.


## Differences to...

#### [node-di][node-di]

- support for array notation
- supports [ES2015](http://babeljs.io/learn-es2015/)

#### Angular DI

- no config/runtime phases (configuration happens by injecting a config object)
- no global module register
- comment annotation
- no decorators
- service -> type
- child injectors
- private modules


## License

MIT


[AngularJS]: http://angularjs.org/
[node-di]: https://github.com/vojtajina/node-di
