import {
  parseAnnotations,
  annotate
} from './annotation';

import {
  isArray,
  hasOwnProp,
  isPlainObject
} from './util';

/**
 * @typedef { import('./index').ModuleDeclaration } ModuleDeclaration
 * @typedef { import('./index').ModuleDefinition } ModuleDefinition
 * @typedef { import('./index').InjectorContext } InjectorContext
 */

/**
 * Create a new injector with the given modules.
 *
 * @param {ModuleDefinition[]} modules
 * @param {InjectorContext} [parent]
 */
export default function Injector(modules, parent) {
  parent = parent || {
    get: function(name, strict) {
      currentlyResolving.push(name);

      if (strict === false) {
        return null;
      } else {
        throw error('No provider for "' + name + '"!');
      }
    }
  };

  var currentlyResolving = [];
  var providers = this._providers = Object.create(parent._providers || null);
  var instances = this._instances = Object.create(null);

  var self = instances.injector = this;

  var error = function(msg) {
    var stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
  };

  /**
   * Return a named service.
   *
   * @param {string} name
   * @param {boolean} [strict=true] if false, resolve missing services to null
   *
   * @return {any}
   */
  function get(name, strict) {
    if (!providers[name] && name.indexOf('.') !== -1) {
      var parts = name.split('.');
      var pivot = get(parts.shift());

      while (parts.length) {
        pivot = pivot[parts.shift()];
      }

      return pivot;
    }

    if (hasOwnProp(instances, name)) {
      return instances[name];
    }

    if (hasOwnProp(providers, name)) {
      if (currentlyResolving.indexOf(name) !== -1) {
        currentlyResolving.push(name);
        throw error('Cannot resolve circular dependency!');
      }

      currentlyResolving.push(name);
      instances[name] = providers[name][0](providers[name][1]);
      currentlyResolving.pop();

      return instances[name];
    }

    return parent.get(name, strict);
  }

  function fnDef(fn, locals) {

    if (typeof locals === 'undefined') {
      locals = {};
    }

    if (typeof fn !== 'function') {
      if (isArray(fn)) {
        fn = annotate(fn.slice());
      } else {
        throw new Error('Cannot invoke "' + fn + '". Expected a function!');
      }
    }

    var injectProps = fn.$inject || parseAnnotations(fn);
    var isObjParam = false;

    // if first item is elipses then its a destructuring object for the argument
    if (injectProps[0] === '...') {
      isObjParam = true;
      injectProps.shift();
    }

    var dependencies = injectProps.map(function(dep) {
      if (hasOwnProp(locals, dep)) {
        return locals[dep];
      } else {

        // if its object destructure then will have defaults and js will already error if not passed in, so do just do safe get
        return isObjParam ? get(dep, false) : get(dep);
      }
    });

    var ret = {
      fn: fn,
      dependencies: dependencies
    };

    // convert dependencies to object form
    if (isObjParam) {
      ret.dependencies = injectProps.reduce((accumulator, key, idx) => {

        // dont pass nulls through
        return dependencies[idx] === null ? accumulator : { ...accumulator, [key]: dependencies[idx] } ;
      }, {});
    }

    return ret;
  }

  function instantiate(Type) {
    var def = fnDef(Type);

    var fn = def.fn,
        dependencies = def.dependencies;

    // instantiate var args constructor
    var Constructor = Function.prototype.bind.apply(fn, [ null ].concat(dependencies));

    return new Constructor();
  }

  function invoke(func, context, locals) {
    var def = fnDef(func, locals);

    var fn = def.fn;

    // if its object then wrap in array and pass in single arg
    var dependencies = isPlainObject(def.dependencies) ? [ def.dependencies ] : def.dependencies;

    return fn.apply(context, dependencies);
  }

  /**
   * @param {Injector} childInjector
   *
   * @return {Function}
   */
  function createPrivateInjectorFactory(childInjector) {
    return annotate(function(key) {
      return childInjector.get(key);
    });
  }

  /**
   * @param {ModuleDefinition[]} modules
   * @param {string[]} [forceNewInstances]
   *
   * @return {Injector}
   */
  function createChild(modules, forceNewInstances) {
    if (forceNewInstances && forceNewInstances.length) {
      var fromParentModule = Object.create(null);
      var matchedScopes = Object.create(null);

      var privateInjectorsCache = [];
      var privateChildInjectors = [];
      var privateChildFactories = [];

      var provider;
      var cacheIdx;
      var privateChildInjector;
      var privateChildInjectorFactory;
      for (var name in providers) {
        provider = providers[name];

        if (forceNewInstances.indexOf(name) !== -1) {
          if (provider[2] === 'private') {
            cacheIdx = privateInjectorsCache.indexOf(provider[3]);
            if (cacheIdx === -1) {
              privateChildInjector = provider[3].createChild([], forceNewInstances);
              privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
              privateInjectorsCache.push(provider[3]);
              privateChildInjectors.push(privateChildInjector);
              privateChildFactories.push(privateChildInjectorFactory);
              fromParentModule[name] = [ privateChildInjectorFactory, name, 'private', privateChildInjector ];
            } else {
              fromParentModule[name] = [ privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx] ];
            }
          } else {
            fromParentModule[name] = [ provider[2], provider[1] ];
          }
          matchedScopes[name] = true;
        }

        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
          /* jshint -W083 */
          forceNewInstances.forEach(function(scope) {
            if (provider[1].$scope.indexOf(scope) !== -1) {
              fromParentModule[name] = [ provider[2], provider[1] ];
              matchedScopes[scope] = true;
            }
          });
        }
      }

      forceNewInstances.forEach(function(scope) {
        if (!matchedScopes[scope]) {
          throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
        }
      });

      modules.unshift(fromParentModule);
    }

    return new Injector(modules, self);
  }

  var factoryMap = {
    factory: invoke,
    type: instantiate,
    value: function(value) {
      return value;
    }
  };

  /**
   * @param {ModuleDefinition} moduleDefinition
   * @param {Injector} injector
   */
  function createInitializer(moduleDefinition, injector) {

    var initializers = moduleDefinition.__init__ || [];

    return function() {
      initializers.forEach(function(initializer) {

        try {

          // eagerly resolve component (fn or string)
          if (typeof initializer === 'string') {
            injector.get(initializer);
          } else {
            injector.invoke(initializer);
          }
        } catch (error) {
          if (typeof AggregateError !== 'undefined') {
            throw new AggregateError([ error ], 'Failed to initialize!');
          }

          throw new Error('Failed to initialize! ' + error.message);
        }
      });
    };
  }

  /**
   * @param {ModuleDefinition} moduleDefinition
   */
  function loadModule(moduleDefinition) {

    var moduleExports = moduleDefinition.__exports__;

    // private module
    if (moduleExports) {
      var nestedModules = moduleDefinition.__modules__;

      var clonedModule = Object.keys(moduleDefinition).reduce(function(clonedModule, key) {

        if (key !== '__exports__' && key !== '__modules__' && key !== '__init__' && key !== '__depends__') {
          clonedModule[key] = moduleDefinition[key];
        }

        return clonedModule;
      }, Object.create(null));

      var childModules = (nestedModules || []).concat(clonedModule);

      var privateInjector = createChild(childModules);
      var getFromPrivateInjector = annotate(function(key) {
        return privateInjector.get(key);
      });

      moduleExports.forEach(function(key) {
        providers[key] = [ getFromPrivateInjector, key, 'private', privateInjector ];
      });

      // ensure child injector initializes
      var initializers = (moduleDefinition.__init__ || []).slice();

      initializers.unshift(function() {
        privateInjector.init();
      });

      moduleDefinition = Object.assign({}, moduleDefinition, {
        __init__: initializers
      });

      return createInitializer(moduleDefinition, privateInjector);
    }

    // normal module
    Object.keys(moduleDefinition).forEach(function(key) {

      if (key === '__init__' || key === '__depends__') {
        return;
      }

      if (moduleDefinition[key][2] === 'private') {
        providers[key] = moduleDefinition[key];
        return;
      }

      var type = moduleDefinition[key][0];
      var value = moduleDefinition[key][1];

      providers[key] = [ factoryMap[type], arrayUnwrap(type, value), type ];
    });

    return createInitializer(moduleDefinition, self);
  }

  /**
   * @param {ModuleDefinition[]} moduleDefinitions
   * @param {ModuleDefinition} moduleDefinition
   *
   * @return {ModuleDefinition[]}
   */
  function resolveDependencies(moduleDefinitions, moduleDefinition) {

    if (moduleDefinitions.indexOf(moduleDefinition) !== -1) {
      return moduleDefinitions;
    }

    moduleDefinitions = (moduleDefinition.__depends__ || []).reduce(resolveDependencies, moduleDefinitions);

    if (moduleDefinitions.indexOf(moduleDefinition) !== -1) {
      return moduleDefinitions;
    }

    return moduleDefinitions.concat(moduleDefinition);
  }

  /**
   * @param {ModuleDefinition[]} moduleDefinitions
   *
   * @return { () => void } initializerFn
   */
  function bootstrap(moduleDefinitions) {

    var initializers = moduleDefinitions
      .reduce(resolveDependencies, [])
      .map(loadModule);

    var initialized = false;

    return function() {

      if (initialized) {
        return;
      }

      initialized = true;

      initializers.forEach(function(initializer) {
        return initializer();
      });
    };
  }

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;

  // setup
  this.init = bootstrap(modules);
}


// helpers ///////////////

function arrayUnwrap(type, value) {
  if (type !== 'value' && isArray(value)) {
    value = annotate(value.slice());
  }

  return value;
}