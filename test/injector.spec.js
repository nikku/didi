import { expect } from 'chai';

import Module from '../lib/module';
import Injector from '../lib/injector';

/**
 * @typedef {import('../lib/types').ModuleDeclaration} ModuleDeclaration
 */


describe('injector', function() {

  it('should consume an object as a module', function() {

    class BubType {
      constructor() {
        this.name = 'bub';
      }
    }

    function BazType() {
      this.name = 'baz';
    }

    var injector = new Injector([
      {
        foo: [
          'factory',
          function() {
            return 'foo-value';
          }
        ],
        bar: ['value', 'bar-value'],
        baz: ['type', BazType],
        bub: ['type', BubType]
      }
    ]);

    expect(injector.get('foo')).to.equal('foo-value');
    expect(injector.get('bar')).to.equal('bar-value');

    var bub = injector.get('bub');
    expect(bub).to.be.an.instanceof(BubType);
    expect(bub.name).to.eql('bub');

    var baz = injector.get('baz');
    expect(baz).to.be.an.instanceof(BazType);
    expect(baz.name).to.eql('baz');
  });


  describe('get', function() {

    it('should return an instance', function() {
      class BazType {
        constructor() {
          this.name = 'baz';
        }
      }

      var module = new Module();

      module.factory('foo', function() {
        return {
          name: 'foo'
        };
      });
      module.value('bar', 'bar value');
      module.type('baz', BazType);

      var injector = new Injector([module]);

      expect(injector.get('foo')).to.deep.equal({
        name: 'foo'
      });
      expect(injector.get('bar')).to.equal('bar value');
      expect(injector.get('baz')).to.deep.equal({
        name: 'baz'
      });
      expect(injector.get('baz')).to.be.an.instanceof(BazType);

      // default to strict=true
      expect(injector.get('bar', true)).to.equal('bar value');
    });


    it('should always return the same instance', function() {
      class BazType {
        constructor() {
          this.name = 'baz';
        }
      }

      var module = new Module();
      module.factory('foo', function() {
        return {
          name: 'foo'
        };
      });
      module.value('bar', 'bar value');
      module.type('baz', BazType);

      var injector = new Injector([module]);

      expect(injector.get('foo')).to.equal(injector.get('foo'));
      expect(injector.get('bar')).to.equal(injector.get('bar'));
      expect(injector.get('baz')).to.equal(injector.get('baz'));
    });


    it('should reuse module', function() {
      class FooType {
        constructor() {
          this.name = 'foo';
        }
      }

      function barFactory(foo) {
        return foo;
      }

      var module = new Module();
      module.type('foo', [FooType]);
      module.factory('bar', ['foo', barFactory]);

      var injector1 = new Injector([module]);
      expect(injector1.get('foo')).to.equal(injector1.get('bar'));

      var injector2 = new Injector([module]);
      expect(injector2.get('foo')).to.equal(injector2.get('bar'));
    });


    it('should reuse inject fn', function() {
      class FooType {
        constructor() {
          this.name = 'foo';
        }

      }

      function barFactory(foo) {
        return foo;
      }

      var module = new Module();
      module.type('foo', [FooType]);
      module.factory('bar', ['foo', barFactory]);

      var injector = new Injector([module]);
      function fn(foo, bar) {
        expect(foo).to.equal(injector.get('foo'));
        return expect(bar).to.equal(injector.get('bar'));
      }
      var annotatedFn = ['foo', 'bar', fn];

      injector.invoke(annotatedFn);
      injector.invoke(annotatedFn);
    });


    it('should resolve dependencies', function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }
      Foo.$inject = ['bar', 'baz'];

      function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }
      bar.$inject = ['baz', 'abc'];

      var module = new Module();
      module.type('foo', Foo);
      module.factory('bar', bar);
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new Injector([module]);
      var fooInstance = injector.get('foo');

      expect(fooInstance.bar).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });

      expect(fooInstance.baz).to.equal('baz-value');
    });


    it('should resolve dependencies (array notation)', function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }

      var bar = function(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      };

      var module = new Module();
      module.type('foo', ['bar', 'baz', Foo]);
      module.factory('bar', ['baz', 'abc', bar]);
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new Injector([module]);
      var fooInstance = injector.get('foo');

      expect(fooInstance.bar).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
      expect(fooInstance.baz).to.equal('baz-value');
    });


    it('should inject properties', function() {
      var module = new Module();
      module.value('config', {
        a: 1,
        b: {
          c: 2
        }
      });

      var injector = new Injector([module]);

      expect(injector.get('config.a')).to.equal(1);
      expect(injector.get('config.b.c')).to.equal(2);
    });


    it('should inject dotted service if present', function() {
      var module = new Module();
      module.value('a.b', 'a.b value');

      var injector = new Injector([module]);
      expect(injector.get('a.b')).to.equal('a.b value');
    });


    it('should provide "injector"', function() {
      var module = new Module();
      var injector = new Injector([module]);

      expect(injector.get('injector')).to.equal(injector);
    });


    it('should throw error with full path if no provider', function() {

      // a requires b requires c (not provided)
      function aFn(b) {
        return 'a-value';
      }
      aFn.$inject = ['b'];

      function bFn(c) {
        return 'b-value';
      }
      bFn.$inject = ['c'];

      var module = new Module();
      module.factory('a', aFn);
      module.factory('b', bFn);

      var injector = new Injector([module]);

      expect(function() {
        return injector.get('a');
      }).to.throw('No provider for "c"! (Resolving: a -> b -> c)');
    });


    it('should return null if non-strict and no provider', function() {
      var module = new Module();
      var injector = new Injector([module]);
      var notDefined = injector.get('not-defined', false);

      return expect(notDefined).to.be.null;
    });


    it('should throw error if circular dependency', function() {
      function aFn(b) {
        return 'a-value';
      }
      aFn.$inject = ['b'];

      function bFn(a) {
        return 'b-value';
      }
      bFn.$inject = ['a'];

      var module = new Module();
      module.factory('a', aFn);
      module.factory('b', bFn);

      var injector = new Injector([module]);
      expect(function() {
        return injector.get('a');
      }).to.throw('Cannot resolve circular dependency! ' + '(Resolving: a -> b -> a)');
    });

  });


  describe('invoke', function() {

    it('should resolve dependencies', function() {
      function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }
      bar.$inject = ['baz', 'abc'];

      var module = new Module();
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new Injector([module]);

      expect(injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should resolve dependencies (array notation)', function() {
      function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }

      var module = new Module();
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new Injector([module]);

      expect(injector.invoke(['baz', 'abc', bar])).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should invoke function on given context', function() {
      var context = {};
      var module = new Module();
      var injector = new Injector([module]);

      injector.invoke((function() {
        expect(this).to.equal(context);
      }), context);
    });


    it('should throw error if a non function given', function() {
      var injector = new Injector([]);

      expect(function() {
        return injector.invoke(123);
      }).to.throw('Cannot invoke "123". Expected a function!');

      expect(function() {
        return injector.invoke('abc');
      }).to.throw('Cannot invoke "abc". Expected a function!');

      expect(function() {
        return injector.invoke(null);
      }).to.throw('Cannot invoke "null". Expected a function!');

      expect(function() {
        return injector.invoke(void 0);
      }).to.throw('Cannot invoke "undefined". ' + 'Expected a function!');

      expect(function() {
        return injector.invoke({});
      }).to.throw('Cannot invoke "[object Object]". ' + 'Expected a function!');
    });


    it('should auto parse arguments/comments if no $inject defined', function() {
      function bar(/* baz */ a, abc) {
        return { baz: a, abc: abc };
      }

      var module = new Module();
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new Injector([module]);

      expect(injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should resolve with local overrides', function() {
      class FooType {
        constructor() {
          throw new Error('foo broken');
        }
      }

      var injector = new Injector([
        {
          foo: [ 'type', FooType ]
        }
      ]);

      var annotatedFn = ['foo', 'bar', function(foo, bar) {
        expect(foo).to.eql('FOO');
        expect(bar).to.equal(undefined);
      }];

      injector.invoke(annotatedFn, null, { foo: 'FOO', bar: undefined });
    });

  });


  describe('instantiate', function() {

    it('should resolve dependencies', function() {
      class Foo {
        constructor(abc1, baz1) {
          this.abc = abc1;
          this.baz = baz1;
        }
      }
      Foo.$inject = ['abc', 'baz'];

      var module = new Module();
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new Injector([module]);

      expect(injector.instantiate(Foo)).to.deep.equal({
        abc: 'abc-value',
        baz: 'baz-value'
      });
    });

    it('should return returned value from constructor if an object returned', function() {

      var module = new Module();
      var injector = new Injector([module]);
      var returnedObj = {};
      function ObjCls() {
        return returnedObj;
      }
      function StringCls() {
        return 'some string';
      }
      function NumberCls() {
        return 123;
      }

      expect(injector.instantiate(ObjCls)).to.equal(returnedObj);
      expect(injector.instantiate(StringCls)).to.be.an.instanceof(StringCls);
      expect(injector.instantiate(NumberCls)).to.be.an.instanceof(NumberCls);
    });

  });


  describe('child', function() {

    it('should inject from child', function() {
      var moduleParent = new Module();
      moduleParent.value('a', 'a-parent');

      var moduleChild = new Module();
      moduleChild.value('a', 'a-child');
      moduleChild.value('d', 'd-child');

      var injector = new Injector([moduleParent]);
      var child = injector.createChild([moduleChild]);

      expect(child.get('d')).to.equal('d-child');
      expect(child.get('a')).to.equal('a-child');
    });


    it('should provide the child injector as "injector"', function() {
      var injector = new Injector([]);
      var childInjector = injector.createChild([]);

      expect(childInjector.get('injector')).to.equal(childInjector);
    });


    it('should inject from parent if not provided in child', function() {
      var moduleParent = new Module();
      moduleParent.value('a', 'a-parent');

      var moduleChild = new Module();
      moduleChild.factory('b', function(a) {
        return {
          a: a
        };
      });

      var injector = new Injector([moduleParent]);
      var child = injector.createChild([moduleChild]);

      expect(child.get('b')).to.deep.equal({
        a: 'a-parent'
      });
    });


    it('should inject from parent but never use dependency from child', function() {
      var moduleParent = new Module();
      moduleParent.factory('b', function(c) {
        return 'b-parent';
      });

      var moduleChild = new Module();
      moduleChild.value('c', 'c-child');

      var injector = new Injector([moduleParent]);
      var child = injector.createChild([moduleChild]);
      expect(function() {
        return child.get('b');
      }).to.throw('No provider for "c"! (Resolving: b -> c)');
    });


    it('should force new instance in child', function() {
      var moduleParent = new Module();
      moduleParent.factory('b', function(c) {
        return {
          c: c
        };
      });
      moduleParent.value('c', 'c-parent');

      var injector = new Injector([moduleParent]);

      expect(injector.get('b')).to.deep.equal({
        c: 'c-parent'
      });

      var moduleChild = new Module();
      moduleChild.value('c', 'c-child');

      var child = injector.createChild([moduleChild], ['b']);
      expect(child.get('b')).to.deep.equal({
        c: 'c-child'
      });
    });


    it('should force new instance using provider from grand parent', function() {

      // regression
      var moduleGrandParent = new Module();
      moduleGrandParent.value('x', 'x-grand-parent');

      var injector = new Injector([ moduleGrandParent ]);

      var grandChildInjector = injector.createChild([]).createChild([], ['x']);

      expect(grandChildInjector).to.exist;
    });


    it('should throw error if forced provider does not exist', function() {
      var moduleParent = new Module();
      var injector = new Injector([moduleParent]);

      expect(function() {
        return injector.createChild([], ['b']);
      }).to.throw('No provider for "b". Cannot use provider from the parent!');
    });

  });


  describe('private modules', function() {

    it('should only expose public bindings', function() {
      var injector = new Injector([
        {
          __exports__: ['publicFoo'],
          'publicFoo': [
            'factory',
            function(privateBar) {
              return {
                dependency: privateBar
              };
            }
          ],
          'privateBar': ['value', 'private-value']
        },
        {
          'bar': [
            'factory',
            function(privateBar) {
              return null;
            }
          ],
          'baz': [
            'factory',
            function(publicFoo) {
              return {
                dependency: publicFoo
              };
            }
          ]
        }
      ]);

      var publicFoo = injector.get('publicFoo');

      expect(publicFoo).to.exist;
      expect(publicFoo.dependency).to.equal('private-value');

      expect(function() {
        return injector.get('privateBar');
      }).to.throw('No provider for "privateBar"! (Resolving: privateBar)');

      expect(function() {
        return injector.get('bar');
      }).to.throw('No provider for "privateBar"! (Resolving: bar -> privateBar)');

      expect(injector.get('baz').dependency).to.equal(publicFoo);
    });


    it('should allow name collisions in private bindings', function() {

      var injector = new Injector([
        {
          __exports__: ['foo'],
          'foo': [
            'factory',
            function(conflict) {
              return conflict;
            }
          ],
          'conflict': ['value', 'private-from-a']
        },
        {
          __exports__: ['bar'],
          'bar': [
            'factory',
            function(conflict) {
              return conflict;
            }
          ],
          'conflict': ['value', 'private-from-b']
        }
      ]);

      expect(injector.get('foo')).to.equal('private-from-a');
      expect(injector.get('bar')).to.equal('private-from-b');
    });


    it('should allow forcing new instance', function() {

      var injector = new Injector([
        {
          __exports__: ['foo'],
          'foo': [
            'factory',
            function(bar) {
              return {
                bar: bar
              };
            }
          ],
          'bar': ['value', 'private-bar']
        }
      ]);

      var firstChild = injector.createChild([], ['foo']);
      var secondChild = injector.createChild([], ['foo']);
      var fooFromFirstChild = firstChild.get('foo');
      var fooFromSecondChild = secondChild.get('foo');

      expect(fooFromFirstChild).not.to.equal(fooFromSecondChild);
      expect(fooFromFirstChild.bar).to.equal(fooFromSecondChild.bar);
    });


    it('should load additional __modules__', function() {

      var otherModule = /** @type ModuleDeclaration */ ({
        'bar': ['value', 'bar-from-other-module']
      });

      var injector = new Injector([
        {
          __exports__: ['foo'],
          __modules__: [otherModule],
          'foo': [
            'factory',
            function(bar) {
              return {
                bar: bar
              };
            }
          ]
        }
      ]);
      var foo = injector.get('foo');

      expect(foo).to.exist;
      expect(foo.bar).to.equal('bar-from-other-module');
    });


    it('should only create one private child injector', function() {

      var injector = new Injector([
        {
          __exports__: ['foo', 'bar'],
          'foo': [
            'factory',
            function(bar) {
              return {
                bar: bar
              };
            }
          ],
          'bar': [
            'factory',
            function(internal) {
              return {
                internal: internal
              };
            }
          ],
          'internal': [
            'factory',
            function() {
              return {};
            }
          ]
        }
      ]);
      var foo = injector.get('foo');
      var bar = injector.get('bar');
      var childInjector = injector.createChild([], ['foo', 'bar']);
      var fooFromChild = childInjector.get('foo');
      var barFromChild = childInjector.get('bar');

      expect(fooFromChild).to.not.equal(foo);
      expect(barFromChild).to.not.equal(bar);
      expect(fooFromChild.bar).to.equal(barFromChild);
    });

  });


  describe('scopes', function() {

    return it('should force new instances per scope', function() {
      function Foo() {}
      Foo.$scope = ['request'];

      function createBar() {
        return {};
      }
      createBar.$scope = ['session'];

      var injector = new Injector([
        {
          'foo': ['type', Foo],
          'bar': ['factory', createBar]
        }
      ]);
      var foo = injector.get('foo');
      var bar = injector.get('bar');

      var sessionInjector = injector.createChild([], ['session']);
      expect(sessionInjector.get('foo')).to.equal(foo);
      expect(sessionInjector.get('bar')).to.not.equal(bar);

      var requestInjector = injector.createChild([], ['request']);

      expect(requestInjector.get('foo')).to.not.equal(foo);
      expect(requestInjector.get('bar')).to.equal(bar);
    });
  });


  return describe('override', function() {

    it('should replace definition via override module', function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }

      function createBlub(foo1) {
        return foo1;
      }

      var base = new Module();
      base.type('foo', ['bar', 'baz', Foo]);
      base.factory('blub', ['foo', createBlub]);
      base.value('baz', 'baz-value');
      base.value('abc', 'abc-value');

      var extension = new Module();
      extension.type('foo', ['baz', 'abc', Foo]);

      var injector = new Injector([base, extension]);
      var expectedFoo = {
        bar: 'baz-value',
        baz: 'abc-value'
      };

      expect(injector.get('foo')).to.deep.equal(expectedFoo);
      expect(injector.get('blub')).to.deep.equal(expectedFoo);
    });


    it('should mock element via value', function() {
      function createBar() {
        return {
          a: 'realA'
        };
      }

      var base = new Module();
      base.factory('bar', createBar);
      var mocked = {
        a: 'A'
      };

      var mock = new Module();
      mock.value('bar', mocked);

      var injector = new Injector([base, mock]);

      expect(injector.get('bar')).to.equal(mocked);
    });

  });

});
