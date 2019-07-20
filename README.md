# `didi`

[![Build Status](https://travis-ci.org/nikku/didi.png?branch=master)](https://travis-ci.org/nikku/didi)

A [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) / [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) micro framework for JavaScript. 

 
## The Case for Dependency Injection

The _Dependency Injection pattern_ is about separating the instantiation of objects from the actual logic and behavior that they encapsulate. This pattern has many benefits such as:

- **explicit dependencies** - all dependencies are passed in as constructor arguments, which makes it easy to understand how particular object depends on the rest of the environment,
- **code reuse** - such an object is much easier to reuse in other environments, because it is not coupled to a specific implementation of its dependencies,
- and **much easier to test**, because testing is essentially about instantiating a single object without the rest of the environment.

If you do follow this pattern without a framework, you typically end up with some kind of nasty `main()` method, where you instantiate all the objects and wire them together. 

`didi` is the _Dependency Injection framework_ that saves you from this boilerplate. **It makes wiring the application declarative rather than imperative.** Each component declares its dependencies and the framework does transitively resolve these dependencies.


## Example

```js
var Car = function(engine) {
  this.start = function() {
    engine.start();
  };
};

var createPetrolEngine = function(power) {
  return {
    start: function() {
      console.log('Starting engine with ' + power + 'hp');
    }
  };
};


// a module is just a plain JavaScript object
// it is a recipe for the injector, how to instantiate stuff
var module = {
  // if an object asks for 'car', the injector will call new Car(...) to produce it
  'car': ['type', Car],
  // if an object asks for 'engine', the injector will call createPetrolEngine(...) to produce it
  'engine': ['factory', createPetrolEngine],
  // if an object asks for 'power', the injector will give it number 1184
  'power': ['value', 1184] // probably Bugatti Veyron
};


var di = require('di');
var injector = new di.Injector([module]);

injector.invoke(function(car) {
  car.start();
});
```

For more examples, check out [the tests](https://github.com/nikku/didi/blob/master/test/injector.spec.js). You can also check out [Karma](https://github.com/karma-runner/karma) or [diagram-js](https://github.com/bpmn-io/diagram-js), to libraries that heavily use dependency injection at its core.

## Usage

### On the web

Use the minification save array notation to declare types or factories and their respective dependencies:

```javascript
var module = {
  'car': ['type', [ 'engine', Car ]],
  ...
};

var di = require('di');
var injector = new di.Injector([module]);

injector.invoke(['car', function(car) {
  car.start();
}]);
```

### Registering stuff

#### type(token, Constructor)
To produce the instance, `Constructor` will be called with `new` operator.
```js
var module = {
  'engine': ['type', DieselEngine]
};
```

#### factory(token, factoryFn)
To produce the instance, `factoryFn` will be called (without any context) and its result will be used.
```js
var module = {
  'engine': ['factory', createDieselEngine]
};
```

#### value(token, value)
Register the final value.
```js
var module = {
  'power': ['value', 1184]
};
```


### Annotation
The injector looks up tokens based on argument names:
```js
var Car = function(engine, license) {
  // will inject objects bound to 'engine' and 'license' tokens
};
```

You can also use comments:
```js
var Car = function(/* engine */ e, /* x._weird */ x) {
  // will inject objects bound to 'engine' and 'x._weird' tokens
};
```

You can also the minification save array notation known from [AngularJS][AngularJS]:
```js
var Car = [ 'engine', 'trunk', function(e, t) {
  // will inject objects bound to 'engine' and 'trunk'
}];
```

Sometimes it is helpful to inject only a specific property of some object:
```js
var Engine = function(/* config.engine.power */ power) {
  // will inject 1184 (config.engine.power),
  // assuming there is no direct binding for 'config.engine.power' token
};

var module = {
  'config': ['value', {engine: {power: 1184}, other : {}}]
};
```

## Credits

Built on top of the (now unmaintained) [node-di][node-di] library. `didi` is a maintained fork of that adds support for ES6 and the minification save array notation. 


## Differences to ...

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


---------

Made for NodeJS _and_ the web. Based on [node-di][node-di].


[AngularJS]: http://angularjs.org/
[node-di]: https://github.com/vojtajina/node-di
