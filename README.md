# `didi`

[![CI](https://github.com/nikku/didi/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/didi/actions/workflows/CI.yml)

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


### Registering Stuff in the Module 
Services, providers, value objects, config objects, etc... There are many names used in the world of DI and IOC. 
This project calls them components and there are 3 flavors; `type`, `factory`, `value`. 

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

## Function Annotations

The following are all valid ways of annotating function with injection arguments and are equivalent.

### Option 1: Inferred

```js
// inferred (only works if code not minified/obfuscated) unless its specified in line, 
//will inject the power config
function createEngine(power){
  ...use power.horses
}

//then in module config would specify the inline args in most cases because of minification
const carModule = {
  engine: ['factory', [ 'power', createEngine ]],
  power:  ['value', {horses: 400}]
};

```

### Option 2: $inject annotated

```js
// annotated
function createEngine(power) { ... }

createEngine.$inject = ['power'];

//then in module config array notation is not needed
const carModule = {
  engine: ['factory', createEngine ],
  power:  ['value', { horses: 400 }]
};
```

### Option 3: Unpacking/Destructured Parameters

This works with minification(in vite) and does not require babel.  

```javascript
// destructured object parameter
function createEngine({ power }) { ... }

//then in module config can take the simple route as well since function params are parsed and $inject is automatically added
const carModule = {
  engine: ['factory', createEngine ],
  power:  ['value', { horses: 400 }]
};

```

### Option 4: Babel Annotations/Comments

```js
// @inject
function createEngine({powerService}){
  ...use powerService
}

...module

```

### Annotations With Comments

In order for these to work with minification the `#__PURE__` will need to be configured. 
There are various options that may work using these [Babel annotations](https://babeljs.io/docs/en/babel-helper-annotate-as-pure)
or plugins such as [babel-plugin-inject-args](https://github.com/hypothesis/babel-plugin-inject-args), depending on choice of usage. Its left to the user to investigate (but please do submit PR with successful options that can be outlined here)

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

//with object destructureing it can be done like this
function Engine({ 'config.engine.power': power }) { ... }

```

### Destructured Function Parameters

Kitchen Sink example that will work with minification (tested with vite's esbuild minifier)

```javascript
function makeEngine({ power: p, 'kinds.v8': kind, block: b = 'alum', fuel: f = 'diesel' }) {
  return { 
    getPower: () => p,
    powerDesc: `${p}hp`,
    kind,
    blockType: b,
    fuelType: f
  };
}

const module = ({
  engine: [ 'factory', makeEngine ],
  block: [ 'factory', ({ power }) => power > 300 ? 'steel' : 'alum' ]
  power: [ 'value', 400 ],
  kinds: [ 'value', { v8: '8 cylinder', v6: '6 cylinder' } ],
});

const injector = new Injector([ module ]);
const {getPower, powerDesc, kind, blockType, fuelType}  = injector.get('engine');

console.log(`${getPower()} , ${powerDesc} , ${kind} , ${blockType} , ${fuelType})
// output:  400 , 400hp , 8 cylinder , steel , diesel

```
> 📝 **Note:**  
> The [injector tests]( test/injector.spec.js ) are a great place to look for examples. 
> You will find one that uses the 'type' and a Class with destructured object injection

### Injecting the injector

In cases where you need the injector it can also be injected

```javascript

//can use a function or lambda
const getEnginePower = ({injector}) => injector.get('engine').power

const carModule = {
  engine: ['factory', createEngine ],
  enginePower:  ['factory', getEnginePower ]
};

let power = injector.get('enginePower')
```

### Component Initialization

The injector allows modules to declare initializers. These are components
that shall be loaded or functions to be invoked on init, i.e. to trigger
side-effects.

```javascript
import { Injector } from 'didi';

function HifiModule(events) {
  events.on('toggleHifi', this.toggle.bind(this));

  this.toggle = function(mode) {
    console.log(`Toggled Hifi ${mode ? 'ON' : 'OFF'}`);
  };
}

const injector = new Injector([
  {
    __init__: [ 'hifiModule' ],
    hifiModule: [ 'type', HifiModule ]
  },
  ...
]);

// initializes all modules as defined
injector.init();
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
