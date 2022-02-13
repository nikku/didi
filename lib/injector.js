import {
  parseAnnotations,
  annotate
} from './annotation';

import {
  isArray,
  hasOwnProp
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

    var inject = fn.$inject || parseAnnotations(fn);
    var dependencies = inject.map(function(dep) {
      if (hasOwnProp(locals, dep)) {
        return locals[dep];
      } else {
        return get(dep);
      }
    });

    return {
      fn: fn,
      dependencies: dependencies
    };
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

    var fn = def.fn,
        dependencies = def.dependencies;

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
              fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
            } else {
              fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
            }
          } else {
            fromParentModule[name] = [provider[2], provider[1]];
          }
          matchedScopes[name] = true;
        }

        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
          /* jshint -W083 */
          forceNewInstances.forEach(function(scope) {
            if (provider[1].$scope.indexOf(scope) !== -1) {
              fromParentModule[name] = [provider[2], provider[1]];
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

  modules.forEach(function(module) {

    function arrayUnwrap(type, value) {
      if (type !== 'value' && isArray(value)) {
        value = annotate(value.slice());
      }

      return value;
    }

    // TODO(vojta): handle wrong inputs (modules)
    if (typeof module === 'object') {

      var moduleDefinition = /** @type { ModuleDeclaration } */ (module);

      if (moduleDefinition.__exports__) {
        var clonedModule = /** @type { ModuleDeclaration } */ (Object.keys(moduleDefinition).reduce(function(m, key) {
          if (key.substring(0, 2) !== '__') {
            m[key] = moduleDefinition[key];
          }
          return m;
        }, Object.create(null)));

        var childModules = /** @type {ModuleDeclaration[]} */ (moduleDefinition.__modules__ || []).concat(clonedModule);

        var privateInjector = new Injector(childModules, self);
        var getFromPrivateInjector = annotate(function(key) {
          return privateInjector.get(key);
        });
        (/** @type string[] */ (moduleDefinition.__exports__)).forEach(function(key) {
          providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
        });
      } else {
        Object.keys(moduleDefinition).forEach(function(name) {
          if (moduleDefinition[name][2] === 'private') {
            providers[name] = moduleDefinition[name];
            return;
          }

          var type = moduleDefinition[name][0];
          var value = moduleDefinition[name][1];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      }
    }
  });

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;
}