/* global Promise */

import Module from './module';

import {
  parse as autoAnnotate,
  annotate
} from './annotation';

import {
  isArray,
  hasOwnProp
} from './util';


export default function AsyncInjector(modules) {

  var parent = {
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
  var loadingInstances = this._loadingInstances = Object.create(null);

  instances.injector = this;

  function error(msg) {
    var stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
  }

  /**
   * Return a named service.
   *
   * @param {String} name
   * @param {Boolean} [strict=true] if false, resolve missing services to null
   *
   * @return {Promise<Object>}
   */
  async function get(name, strict) {
    if (!providers[name] && name.indexOf('.') !== -1) {
      var parts = name.split('.');
      var pivot = await get(parts.shift());

      while (parts.length) {
        pivot = pivot[parts.shift()];
      }

      return pivot;
    }

    if (hasOwnProp(instances, name)) {
      return instances[name];
    }

    if (hasOwnProp(loadingInstances, name)) {
      return loadingInstances[name];
    }

    if (hasOwnProp(providers, name)) {
      if (currentlyResolving.indexOf(name) !== -1) {
        currentlyResolving.push(name);
        throw error('Cannot resolve circular dependency!');
      }

      currentlyResolving.push(name);
      loadingInstances[name] = providers[name][0](providers[name][1]);
      instances[name] = await loadingInstances[name];

      currentlyResolving.pop();

      return instances[name];
    }

    return parent.get(name, strict);
  }

  async function fnDef(fn, locals) {

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

    var inject = fn.$inject || autoAnnotate(fn);
    var dependencies = await Promise.all(
      inject.map(function(dep) {
        if (hasOwnProp(locals, dep)) {
          return locals[dep];
        } else {
          return get(dep);
        }
      })
    );

    return {
      fn: fn,
      dependencies: dependencies
    };
  }

  async function instantiate(Type) {
    var def = await fnDef(Type);

    var fn = def.fn,
        dependencies = def.dependencies;

    // instantiate var args constructor
    var Constructor = Function.prototype.bind.apply(fn, [ null ].concat(dependencies));

    return new Constructor();
  }

  async function invoke(func, context, locals) {
    var def = await fnDef(func, locals);

    var fn = def.fn,
        dependencies = def.dependencies;

    return fn.apply(context, dependencies);
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
    if (module instanceof Module) {
      module.forEach(function(provider) {
        var name = provider[0];
        var type = provider[1];
        var value = provider[2];

        providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
      });
    } else if (typeof module === 'object') {
      if (module.__exports__) {
        throw new Error('private modules are not supported');
      } else {
        Object.keys(module).forEach(function(name) {
          var type = module[name][0];
          var value = module[name][1];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      }
    }
  });

  function createChild() {
    throw error('child injectors are not supported');
  }

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;
}