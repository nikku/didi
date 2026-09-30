import { expect } from 'chai';

import { Injector, annotate } from 'didi';

/**
 * @typedef {import('didi').ModuleDeclaration} ModuleDeclaration
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

    const injector = new Injector([
      {
        foo: [
          'factory',
          function() {
            return 'foo-value';
          }
        ],
        bar: [ 'value', 'bar-value' ],
        baz: [ 'type', BazType ],
        bub: [ 'type', BubType ]
      }
    ]);

    expect(injector.get('foo')).to.equal('foo-value');
    expect(injector.get('bar')).to.equal('bar-value');

    const bub = injector.get('bub');
    expect(bub).to.be.an.instanceof(BubType);
    expect(bub.name).to.eql('bub');

    const baz = injector.get('baz');
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

      const injector = new Injector([ {
        foo: [ 'factory', function() {
          return {
            name: 'foo'
          };
        } ],
        bar: [ 'value', 'bar value' ],
        baz: [ 'type', BazType ],
      } ]);

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

      const injector = new Injector([ {
        foo: [ 'factory', function() {
          return {
            name: 'foo'
          };
        } ],
        bar: [ 'value', 'bar value' ],
        baz: [ 'type', BazType ],
      } ]);

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

      const module = /** @type ModuleDeclaration */ ({
        foo: [ 'type', [ FooType ] ],
        bar: [ 'factory', [ 'foo', barFactory ] ],
      });

      const injector1 = new Injector([ module ]);
      expect(injector1.get('foo')).to.equal(injector1.get('bar'));

      const injector2 = new Injector([ module ]);
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

      const module = /** @type ModuleDeclaration */ ({
        'foo': [ 'type', [ FooType ] ],
        'bar': [ 'factory', [ 'foo', barFactory ] ]
      });

      const injector = new Injector([ module ]);
      function fn(foo, bar) {
        expect(foo).to.equal(injector.get('foo'));
        expect(bar).to.equal(injector.get('bar'));
      }

      injector.invoke([ 'foo', 'bar', fn ]);

      injector.invoke([ 'foo', 'bar', fn ]);
    });


    it('should resolve dependencies', function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }
      Foo.$inject = [ 'bar', 'baz' ];

      function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }
      bar.$inject = [ 'baz', 'abc' ];

      const module = /** @type ModuleDeclaration */ ({
        foo: [ 'type', Foo ],
        bar: [ 'factory', bar ],
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const injector = new Injector([ module ]);
      const fooInstance = injector.get('foo');

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

      const bar = function(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      };

      const module = /** @type ModuleDeclaration */ ({
        foo: [ 'type', [ 'bar', 'baz', Foo ] ],
        bar: [ 'factory', [ 'baz', 'abc', bar ] ],
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const injector = new Injector([ module ]);
      const fooInstance = injector.get('foo');

      expect(fooInstance.bar).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
      expect(fooInstance.baz).to.equal('baz-value');
    });


    it('should inject properties', function() {
      const module = /** @type ModuleDeclaration */ ({
        config: [ 'value', {
          a: 1,
          b: {
            c: 2
          }
        } ]
      });

      const injector = new Injector([ module ]);

      expect(injector.get('config.a')).to.equal(1);
      expect(injector.get('config.b.c')).to.equal(2);
    });


    it('should inject dotted service if present', function() {
      const module = /** @type ModuleDeclaration */ ({
        'a.b': [ 'value', 'a.b value' ]
      });

      const injector = new Injector([ module ]);
      expect(injector.get('a.b')).to.equal('a.b value');
    });


    it('should provide "injector"', function() {
      const injector = new Injector([]);

      expect(injector.get('injector')).to.equal(injector);
    });


    it('should throw error with full path if no provider', function() {

      // a requires b requires c (not provided)
      function aFn(b) {
        return 'a-value';
      }
      aFn.$inject = [ 'b' ];

      function bFn(c) {
        return 'b-value';
      }
      bFn.$inject = [ 'c' ];

      const module = /** @type ModuleDeclaration */ ({
        a: [ 'factory', aFn ],
        b: [ 'factory', bFn ]
      });

      const injector = new Injector([ module ]);

      expect(function() {
        return injector.get('a');
      }).to.throw('No provider for "c"! (Resolving: a -> b -> c)');
    });


    it('should return undefined if non-strict and no provider', function() {
      const injector = new Injector([]);
      const notDefined = injector.get('not-defined', false);

      expect(notDefined).to.be.undefined;
    });


    it('should return undefined if non-strict and path does not exist', function() {

      // given
      const injector = new Injector([
        { b: [ 'value', { c: 'C' } ] }
      ]);

      // then
      expect(injector.get('x.c', false)).to.be.undefined;
      expect(injector.get('b.x.c', false)).to.be.undefined;
      expect(injector.get('b.c.x', false)).to.be.undefined;

      expect(() => injector.get('x.c')).to.throw('No provider for "x"!');
      expect(() => injector.get('b.x.c')).to.throw(TypeError);
    });


    it('should not leak non-strict lookup into resolving chain', function() {

      // given
      function aFn(b) {
        return 'a-value';
      }

      const injector = new Injector([ {
        a: [ 'factory', aFn ]
      } ]);

      // when
      injector.get('not-defined', false);

      // then
      expect(function() {
        return injector.get('a');
      }).to.throw('No provider for "b"! (Resolving: a -> b)');
    });


    it('should not leak nested non-strict lookup into resolving chain', function() {

      // given
      const injector = new Injector([ {
        a: [ 'factory', [ 'injector', function(injector) {
          injector.get('not-defined', false);

          return injector.get('b');
        } ] ],
        b: [ 'factory', [ 'c', function(c) {
          return 'b-value';
        } ] ]
      } ]);

      // then
      expect(function() {
        return injector.get('a');
      }).to.throw('No provider for "c"! (Resolving: a -> b -> c)');
    });


    it('should not leak non-strict lookup via child into resolving chain', function() {

      // given
      function aFn(b) {
        return 'a-value';
      }

      const injector = new Injector([ {
        a: [ 'factory', aFn ]
      } ]);

      const child = injector.createChild([]);

      // when
      expect(child.get('not-defined', false)).to.be.undefined;

      // then
      expect(function() {
        return injector.get('a');
      }).to.throw('No provider for "b"! (Resolving: a -> b)');

      expect(function() {
        return child.get('a');
      }).to.throw('No provider for "b"! (Resolving: a -> b)');
    });


    it('should throw error if circular dependency', function() {
      function aFn(b) {
        return 'a-value';
      }

      function bFn(a) {
        return 'b-value';
      }

      const module = /** @type ModuleDeclaration */ ({
        a: [ 'factory', [ 'b', aFn ] ],
        b: [ 'factory', [ 'a', bFn ] ],
      });

      const injector = new Injector([ module ]);

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
      bar.$inject = [ 'baz', 'abc' ];

      const module = /** @type ModuleDeclaration */ ({
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const injector = new Injector([ module ]);

      expect(injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should resolve dependencies (array notation)', function() {
      function bar(a, b) {
        return {
          baz: a,
          abc: b
        };
      }

      const module = /** @type ModuleDeclaration */ ({
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const injector = new Injector([ module ]);

      const result = injector.invoke([ 'baz', 'abc', bar ]);

      expect(result).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should invoke function on given context', function() {
      const context = {};
      const injector = new Injector([]);

      injector.invoke((function() {

        // @ts-expect-error
        expect(this).to.equal(context);
      }), context);
    });


    it('should throw error if a non function given', function() {
      const injector = new Injector([]);

      expect(function() {

        // @ts-expect-error
        return injector.invoke(123);
      }).to.throw('Cannot invoke "123". Expected a function!');

      expect(function() {

        // @ts-expect-error
        return injector.invoke('abc');
      }).to.throw('Cannot invoke "abc". Expected a function!');

      expect(function() {

        // @ts-expect-error
        return injector.invoke(null);
      }).to.throw('Cannot invoke "null". Expected a function!');

      expect(function() {

        // @ts-expect-error
        return injector.invoke(void 0);
      }).to.throw('Cannot invoke "undefined". ' + 'Expected a function!');

      expect(function() {

        // @ts-expect-error
        return injector.invoke({});
      }).to.throw('Cannot invoke "[object Object]". ' + 'Expected a function!');
    });


    it('should auto parse arguments/comments if no $inject defined', function() {
      function bar(/* baz */ a, abc) {
        return { baz: a, abc: abc };
      }

      const module = /** @type ModuleDeclaration */ ({
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const injector = new Injector([ module ]);

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

      const injector = new Injector([
        {
          foo: [ 'type', FooType ]
        }
      ]);

      injector.invoke([ 'foo', 'bar', function(foo, bar) {
        expect(foo).to.eql('FOO');
        expect(bar).to.equal(undefined);
      } ], null, { foo: 'FOO', bar: undefined });
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
      Foo.$inject = [ 'abc', 'baz' ];

      const module = /** @type ModuleDeclaration */ ({
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const injector = new Injector([ module ]);

      expect(injector.instantiate(Foo)).to.deep.equal({
        abc: 'abc-value',
        baz: 'baz-value'
      });
    });


    it('should return returned value from constructor if an object returned', function() {

      const injector = new Injector([]);
      const returnedObj = {};

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

      expect(injector.instantiate([ 'injector', NumberCls ])).to.be.an.instanceof(NumberCls);
    });

  });


  describe('child', function() {

    it('should inject from child', function() {
      const moduleParent = /** @type ModuleDeclaration */ ({
        a: [ 'value', 'a-parent' ]
      });

      const moduleChild = /** @type ModuleDeclaration */ ({
        a: [ 'value', 'a-child' ],
        d: [ 'value', 'd-child' ]
      });

      const injector = new Injector([ moduleParent ]);
      const child = injector.createChild([ moduleChild ]);

      expect(child.get('d')).to.equal('d-child');
      expect(child.get('a')).to.equal('a-child');
    });


    it('should provide the child injector as "injector"', function() {
      const injector = new Injector([]);
      const childInjector = injector.createChild([]);

      expect(childInjector.get('injector')).to.equal(childInjector);
    });


    it('should inject from parent if not provided in child', function() {
      const moduleParent = /** @type ModuleDeclaration */ ({
        a: [ 'value', 'a-parent' ]
      });

      const moduleChild = /** @type ModuleDeclaration */ ({
        b: [ 'factory', function(a) {
          return {
            a: a
          };
        } ]
      });

      const injector = new Injector([ moduleParent ]);
      const child = injector.createChild([ moduleChild ]);

      expect(child.get('b')).to.deep.equal({
        a: 'a-parent'
      });
    });


    it('should inject from parent but never use dependency from child', function() {
      const moduleParent = /** @type ModuleDeclaration */ ({
        b: [ 'factory', function(c) {
          return 'b-parent';
        } ]
      });

      const moduleChild = /** @type ModuleDeclaration */ ({
        c: [ 'value', 'c-child' ]
      });

      const injector = new Injector([ moduleParent ]);
      const child = injector.createChild([ moduleChild ]);

      expect(function() {
        return child.get('b');
      }).to.throw('No provider for "c"! (Resolving: b -> c)');
    });


    it('should force new instance in child', function() {
      const moduleParent = /** @type ModuleDeclaration */ ({
        b: [ 'factory', function(c) {
          return {
            c: c
          };
        } ],
        c: [ 'value', 'c-parent' ]
      });
      const injector = new Injector([ moduleParent ]);

      expect(injector.get('b')).to.deep.equal({
        c: 'c-parent'
      });

      const moduleChild = /** @type ModuleDeclaration */ ({
        c: [ 'value', 'c-child' ]
      });

      const child = injector.createChild([ moduleChild ], [ 'b' ]);
      expect(child.get('b')).to.deep.equal({
        c: 'c-child'
      });
    });


    it('should force new instance using provider from grand parent', function() {

      const x = {};

      // regression
      const moduleGrandParent = /** @type ModuleDeclaration */ ({
        x: [ 'value', x ]
      });

      const injector = new Injector([ moduleGrandParent ]);

      const grandChildInjector = injector.createChild([]).createChild([], [ 'x' ]);

      expect(grandChildInjector).to.exist;
      expect(grandChildInjector.get('x')).to.equal(x);
    });


    it('should throw error if forced provider does not exist', function() {
      const injector = new Injector([]);

      expect(function() {
        return injector.createChild([], [ 'b' ]);
      }).to.throw('No provider for "b". Cannot use provider from the parent!');
    });

  });


  describe('private modules', function() {

    it('should only expose public bindings', function() {
      const injector = new Injector([
        {
          __exports__: [ 'publicFoo' ],
          'publicFoo': [
            'factory',
            function(privateBar) {
              return {
                dependency: privateBar
              };
            }
          ],
          'privateBar': [ 'value', 'private-value' ]
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

      const publicFoo = injector.get('publicFoo');

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

      const injector = new Injector([
        {
          __exports__: [ 'foo' ],
          'foo': [
            'factory',
            function(conflict) {
              return conflict;
            }
          ],
          'conflict': [ 'value', 'private-from-a' ]
        },
        {
          __exports__: [ 'bar' ],
          'bar': [
            'factory',
            function(conflict) {
              return conflict;
            }
          ],
          'conflict': [ 'value', 'private-from-b' ]
        }
      ]);

      expect(injector.get('foo')).to.equal('private-from-a');
      expect(injector.get('bar')).to.equal('private-from-b');
    });


    it('should not override global names', function() {

      const injector = new Injector([
        {
          'foo': [ 'value', 'GLOBAL_FOO' ]
        },
        {
          __exports__: [ 'bar' ],
          'foo': [ 'value', 'LOCAL_FOO' ],
          'bar': [ 'factory', (foo) => foo ]
        }
      ]);

      expect(injector.get('foo')).to.equal('GLOBAL_FOO');
      expect(injector.get('bar')).to.equal('LOCAL_FOO');
    });


    it('should allow forcing new instance', function() {

      const injector = new Injector([
        {
          __exports__: [ 'foo' ],
          'foo': [
            'factory',
            function(bar) {
              return {
                bar: bar
              };
            }
          ],
          'bar': [ 'value', 'private-bar' ]
        }
      ]);

      const firstChild = injector.createChild([], [ 'foo' ]);
      const secondChild = injector.createChild([], [ 'foo' ]);
      const fooFromFirstChild = firstChild.get('foo');
      const fooFromSecondChild = secondChild.get('foo');

      expect(fooFromFirstChild).not.to.equal(fooFromSecondChild);
      expect(fooFromFirstChild.bar).to.equal(fooFromSecondChild.bar);
    });


    describe('additional __modules__', function() {

      it('should load', function() {

        const otherModule = /** @type ModuleDeclaration */ ({
          'bar': [ 'value', 'bar-from-other-module' ]
        });

        const injector = new Injector([
          {
            __exports__: [ 'foo' ],
            __modules__: [ otherModule ],
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
        const foo = injector.get('foo');

        expect(foo).to.exist;
        expect(foo.bar).to.equal('bar-from-other-module');

        expect(function() {
          injector.get('bar');
        }).to.throw('No provider for "bar"! (Resolving: bar)');
      });


      it('should re-use', function() {

        const otherModule = /** @type ModuleDeclaration */ ({
          'bar': [ 'value', {} ]
        });

        const injector = new Injector([
          otherModule,
          {
            __exports__: [ 'foo' ],
            __modules__: [ otherModule ],
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
        const foo = injector.get('foo');

        expect(foo).to.exist;
        expect(foo.bar).to.equal(injector.get('bar'));
      });

    });


    it('should initialize', function() {

      // given
      const loaded = [];

      const injector = new Injector([
        {
          __exports__: [ 'foo' ],
          __modules__: [
            {
              __init__: [ () => loaded.push('nested') ],
              bar: [ 'value', 10 ]
            }
          ],
          __init__: [ (bar) => loaded.push('module' + bar) ],
          foo: [
            'factory',
            function(bar) {
              return bar;
            }
          ]
        }
      ]);

      // when
      injector.init();

      // then
      expect(loaded).to.eql([
        'nested',
        'module10'
      ]);

      expect(function() {
        injector.get('bar');
      }).to.throw(/No provider for "bar"/);
    });


    it('should only create one private child injector', function() {

      const injector = new Injector([
        {
          __exports__: [ 'foo', 'bar' ],
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
      const foo = injector.get('foo');
      const bar = injector.get('bar');
      const childInjector = injector.createChild([], [ 'foo', 'bar' ]);
      const fooFromChild = childInjector.get('foo');
      const barFromChild = childInjector.get('bar');

      expect(fooFromChild).to.not.equal(foo);
      expect(barFromChild).to.not.equal(bar);
      expect(fooFromChild.bar).to.equal(barFromChild);
    });

  });


  describe('scopes', function() {

    return it('should force new instances per scope', function() {
      function Foo() {}
      Foo.$scope = [ 'request' ];

      function createBar() {
        return {};
      }
      createBar.$scope = [ 'session' ];

      const injector = new Injector([
        {
          'foo': [ 'type', Foo ],
          'bar': [ 'factory', createBar ]
        }
      ]);
      const foo = injector.get('foo');
      const bar = injector.get('bar');

      const sessionInjector = injector.createChild([], [ 'session' ]);
      expect(sessionInjector.get('foo')).to.equal(foo);
      expect(sessionInjector.get('bar')).to.not.equal(bar);

      const requestInjector = injector.createChild([], [ 'request' ]);

      expect(requestInjector.get('foo')).to.not.equal(foo);
      expect(requestInjector.get('bar')).to.equal(bar);
    });
  });


  describe('override', function() {

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

      const base = /** @type ModuleDeclaration */ ({
        foo: [ 'type', [ 'bar', 'baz', Foo ] ],
        blub: [ 'factory', [ 'foo', createBlub ] ],
        baz: [ 'value', 'baz-value' ],
        abc: [ 'value', 'abc-value' ]
      });

      const extension = /** @type ModuleDeclaration */ ({
        foo: [ 'type', [ 'baz', 'abc', Foo ] ]
      });

      const injector = new Injector([ base, extension ]);
      const expectedFoo = {
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

      const base = /** @type ModuleDeclaration */ ({
        bar: [ 'factory', createBar ]
      });

      const mocked = {
        a: 'A'
      };

      const mock = /** @type ModuleDeclaration */ ({
        bar: [ 'value', mocked ]
      });

      const injector = new Injector([ base, mock ]);

      expect(injector.get('bar')).to.equal(mocked);
    });

  });


  describe('initialize (__init__)', function() {

    it('should init component', function() {

      // given
      const injector = new Injector([
        {
          __init__: [ 'foo' ],
          'foo': [ 'factory', function(bar) {
            bar.initialized = true;

            return bar;
          } ],
          'bar': [ 'value', {} ]
        }
      ]);

      // when
      injector.init();

      const bar = injector.get('bar');

      // then
      expect(bar.initialized).to.be.true;
    });


    it('should call initializer', function() {

      // given
      const injector = new Injector([
        {
          __init__: [ function(bar) {
            bar.initialized = true;
          } ],
          'bar': [ 'value', {} ]
        }
      ]);

      const bar = injector.get('bar');

      // assume
      expect(bar.initialized).not.to.exist;

      // when
      injector.init();

      // then
      expect(bar.initialized).to.be.true;
    });


    it('should execute only once', function() {

      // given
      const injector = new Injector([
        {
          __init__: [ function(bar) {
            bar.initCalled++;

            return bar;
          } ],
          'bar': [ 'value', { initCalled: 0 } ]
        }
      ]);

      injector.init();

      // when
      injector.init();

      const bar = injector.get('bar');

      // then
      expect(bar.initCalled).to.eql(1);
    });


    describe('private modules', function() {

      it('should init with child injector', function() {

        // given
        const privateBar = {};

        const injector = new Injector([
          {
            __exports__: [ 'publicFoo' ],
            __init__: [ function(privateBar) {
              privateBar.initialized = true;
            } ],
            'publicFoo': [
              'factory',
              function(privateBar) {
                return {
                  privateBar
                };
              }
            ],
            'privateBar': [ 'value', {} ]
          }
        ]);

        // when
        injector.init();

        const publicFoo = injector.get('publicFoo');

        expect(publicFoo.privateBar.initialized).to.be.true;
      });

    });


    describe('error handling', function() {

      it('should indicate missing dependency', function() {

        // given
        const injector = new Injector([
          {
            __init__: [ 'foo' ]
          }
        ]);

        // then
        expect(function() {
          injector.init();
        }).to.throw(/No provider for "foo"!/);
      });


      it('should indicate initialization error', function() {

        // given
        const injector = new Injector([
          {
            __init__: [ function() {
              throw new Error('INIT ERROR');
            } ]
          }
        ]);

        // then
        expect(function() {
          injector.init();
        }).to.throw(/INIT ERROR/);
      });

    });

  });


  describe('module dependencies (__depends__)', function() {

    it('should load in reverse order', function() {

      const loaded = [];

      // given
      const injector = new Injector([
        {
          __depends__: [
            {
              __depends__: [
                {
                  __init__: [ function() { loaded.push('L2_A'); } ]
                },
                {
                  __init__: [ function() { loaded.push('L2_B'); } ]
                }
              ],
              __init__: [ function() { loaded.push('L1'); } ]
            }
          ],
          __init__: [ function() { loaded.push('ROOT'); } ]
        }
      ]);

      // when
      injector.init();

      // then
      expect(loaded).to.eql([
        'L2_A',
        'L2_B',
        'L1',
        'ROOT'
      ]);
    });


    it('should de-duplicate', function() {

      const loaded = [];

      const duplicateModule = /** @type ModuleDeclaration */ ({
        __init__: [ function() { loaded.push('DUP'); } ]
      });

      // given
      const injector = new Injector([
        {
          __depends__: [
            {
              __depends__: [
                duplicateModule,
                duplicateModule
              ],
              __init__: [ function() { loaded.push('L1'); } ]
            },
            duplicateModule
          ],
          __init__: [ function() { loaded.push('ROOT'); } ]
        }
      ]);

      // when
      injector.init();

      // then
      expect(loaded).to.eql([
        'DUP',
        'L1',
        'ROOT'
      ]);
    });

  });



  describe('optional dependencies', function() {

    describe('should annotate', function() {

      const module = /** @type ModuleDeclaration */ ({
        a: [ 'value', 'A' ]
      });


      it('via $inject', function() {

        // given
        function fn(a, b) {
          return [ a, b ];
        }

        fn.$inject = [ 'a', 'b?' ];

        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke(fn)).to.eql([ 'A', undefined ]);
      });


      it('via array notation', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke([ 'a', 'b?', (a, b) => [ a, b ] ])).to.eql([ 'A', undefined ]);
      });


      it('via annotate', function() {

        // given
        const injector = new Injector([ module ]);

        const fn = annotate('a', 'b?', (a, b) => [ a, b ]);

        // then
        expect(injector.invoke(fn)).to.eql([ 'A', undefined ]);
      });


      it('via comment', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke(function(a, /* b? */ x) {
          return [ a, x ];
        })).to.eql([ 'A', undefined ]);
      });


      it('via default value', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke(function(a, b = 1000) {
          return [ a, b ];
        })).to.eql([ 'A', 1000 ]);
      });


      it('via default value (class constructor)', function() {

        // given
        class Foo {
          constructor(a, b = 1000) {
            this.a = a;
            this.b = b;
          }
        }

        const injector = new Injector([ module ]);

        // when
        const foo = injector.instantiate(Foo);

        // then
        expect(foo).to.include({ a: 'A', b: 1000 });
      });


      it('via default value (comment)', function() {

        // given
        const injector = new Injector([
          { config: [ 'value', { foo: 'FOO' } ] }
        ]);

        // then
        expect(injector.invoke(function(/* config.foo */ x = 1000, /* config.bar */ y = 1000) {
          return [ x, y ];
        })).to.eql([ 'FOO', 1000 ]);
      });

    });


    describe('should resolve', function() {

      it('existing service', function() {

        // given
        const injector = new Injector([
          { b: [ 'value', 'B' ] }
        ]);

        // then
        expect(injector.invoke([ 'b?', b => b ])).to.eql('B');
        expect(injector.invoke(function(b = 1000) {
          return b;
        })).to.eql('B');
      });


      it('<injector>', function() {

        // given
        const injector = new Injector([]);

        // then
        expect(injector.invoke([ 'injector?', i => i ])).to.equal(injector);
      });


      it('provided <null>', function() {

        // given
        const injector = new Injector([
          { b: [ 'value', null ] }
        ]);

        // then
        expect(injector.invoke([ 'b?', b => b ])).to.be.null;
      });


      it('missing service as <undefined>', function() {

        // given
        const injector = new Injector([]);

        // then
        expect(injector.invoke([ 'b?', b => b ])).to.be.undefined;
      });


      it('missing service as default value', function() {

        // given
        const injector = new Injector([]);

        // then
        expect(injector.invoke([ 'b?', (b = 1000) => b ])).to.eql(1000);
      });


      it('local over service', function() {

        // given
        const injector = new Injector([
          { b: [ 'value', 'B' ] }
        ]);

        // then
        expect(injector.invoke([ 'b?', b => b ], null, { b: 5 })).to.eql(5);
        expect(injector.invoke([ 'c?', c => c ], null, { c: 5 })).to.eql(5);
        expect(injector.invoke([ 'c?', (c = 1000) => c ], null, { c: undefined })).to.eql(1000);
        expect(injector.invoke(function(c = 1000) {
          return c;
        }, null, { c: 5 })).to.eql(5);
      });

    });


    describe('should create component', function() {

      it('via invoke on context', function() {

        // given
        function Renderer(eventBus, renderPriority = 1000) {
          this.eventBus = eventBus;
          this.renderPriority = renderPriority;
        }

        Renderer.$inject = [ 'eventBus', 'renderPriority?' ];

        const injector = new Injector([
          { eventBus: [ 'value', 'EVENT_BUS' ] }
        ]);

        const renderer = {};
        const customRenderer = {};

        // when
        injector.invoke(Renderer, renderer);
        injector.invoke(Renderer, customRenderer, { renderPriority: 9001 });

        // then
        expect(renderer).to.eql({ eventBus: 'EVENT_BUS', renderPriority: 1000 });
        expect(customRenderer).to.eql({ eventBus: 'EVENT_BUS', renderPriority: 9001 });
      });


      it('via instantiate', function() {

        // given
        class Foo {
          constructor(a, b = 1000) {
            this.b = b;
          }
        }

        const injector = new Injector([
          { a: [ 'value', 'A' ] }
        ]);

        // then
        expect(injector.instantiate(Foo).b).to.eql(1000);
        expect(injector.instantiate([ 'a', 'b?', Foo ]).b).to.eql(1000);
      });


      it('via <type>', function() {

        // given
        class Foo {
          constructor(b = 1000) {
            this.b = b;
          }
        }

        const injector = new Injector([
          {
            foo: [ 'type', Foo ],
            bar: [ 'type', [ 'b?', Foo ] ]
          }
        ]);

        // then
        expect(injector.get('foo').b).to.eql(1000);
        expect(injector.get('bar').b).to.eql(1000);
      });


      it('via <factory>', function() {

        // given
        const injector = new Injector([
          {
            foo: [ 'factory', function(b = 1000) {
              return b;
            } ],
            bar: [ 'factory', [ 'b?', b => b ] ]
          }
        ]);

        // then
        expect(injector.get('foo')).to.eql(1000);
        expect(injector.get('bar')).to.be.undefined;
      });

    });


    describe('should resolve partially', function() {

      const module = /** @type ModuleDeclaration */ ({
        config: [ 'value', { foo: { bar: 'BAR' }, nil: null } ],
        'a.b': [ 'value', { c: 'A.B.C' } ],
        'a.b.c': [ 'value', 'NOT_MATCHED' ]
      });


      it('existing path', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke([ 'config.foo.bar?', v => v ])).to.eql('BAR');
        expect(injector.invoke([ 'config.nil?', v => v ])).to.be.null;
      });


      it('direct binding', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke([ 'a.b?', v => v ])).to.eql({ c: 'A.B.C' });
      });


      it('missing path as <undefined>', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke([ 'other.foo?', v => v ])).to.be.undefined;
        expect(injector.invoke([ 'config.other.foo?', v => v ])).to.be.undefined;
        expect(injector.invoke([ 'config.nil.foo?', v => v ])).to.be.undefined;
        expect(injector.invoke([ 'config.foo.other?', v => v ])).to.be.undefined;
      });


      it('name before <?>', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke([ 'a.b?.c', v => v ])).to.eql('A.B.C');
        expect(injector.invoke([ 'a?.b', v => v ])).to.be.undefined;
      });


      it('chain akin to optional chaining', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.invoke([ 'config?.foo.bar', v => v ])).to.eql('BAR');
        expect(injector.invoke([ 'config.foo?.bar', v => v ])).to.eql('BAR');
        expect(injector.invoke([ 'other?.foo.bar', v => v ])).to.be.undefined;
        expect(injector.invoke([ 'config.nil?.foo', v => v ])).to.be.undefined;
        expect(injector.invoke([ 'config.other?.foo', v => v ])).to.be.undefined;

        expect(() => injector.invoke([ 'config?.other.foo', v => v ])).to.throw(TypeError);
      });

    });


    describe('should resolve across scopes', function() {

      it('from parent injector', function() {

        // given
        const parent = new Injector([
          { b: [ 'value', 'B' ] }
        ]);

        const child = parent.createChild([
          { a: [ 'value', 'A' ] }
        ]);

        // then
        expect(child.invoke([ 'a?', 'b?', 'c?', (a, b, c) => [ a, b, c ] ])).to.eql([ 'A', 'B', undefined ]);
      });


      it('from grand parent injector', function() {

        // given
        const grandParent = new Injector([
          { b: [ 'value', 'B' ] }
        ]);

        const child = grandParent.createChild([]).createChild([]);

        // then
        expect(child.invoke([ 'b?', 'c?', (b, c) => [ b, c ] ])).to.eql([ 'B', undefined ]);
      });


      it('with forced new instance', function() {

        // given
        const parent = new Injector([
          {
            b: [ 'factory', () => ({}) ],
            foo: [ 'factory', [ 'b?', 'c?', (b, c) => ({ b, c }) ] ]
          }
        ]);

        const child = parent.createChild([], [ 'foo' ]);

        // when
        const foo = child.get('foo');

        // then
        expect(foo).not.to.equal(parent.get('foo'));
        expect(foo.b).to.equal(parent.get('b'));
        expect(foo.c).to.be.undefined;
      });


      it('within private module', function() {

        // given
        const injector = new Injector([
          {
            __exports__: [ 'foo' ],
            foo: [ 'factory', [ 'bar?', 'baz?', 'public?', (bar, baz, p) => ({ bar, baz, p }) ] ],
            bar: [ 'value', 'BAR' ]
          },
          {
            public: [ 'value', 'PUBLIC' ],
            other: [ 'factory', [ 'bar?', 'foo?', (bar, foo) => ({ bar, foo }) ] ]
          }
        ]);

        // when
        const foo = injector.get('foo');
        const other = injector.get('other');

        // then
        expect(foo).to.eql({ bar: 'BAR', baz: undefined, p: 'PUBLIC' });
        expect(other.bar).to.be.undefined;
        expect(other.foo).to.equal(foo);
      });

    });


    describe('should get', function() {

      const module = /** @type ModuleDeclaration */ ({
        b: [ 'value', { c: 'C' } ]
      });


      it('existing service', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.get('b?')).to.eql({ c: 'C' });
        expect(injector.get('b?.c')).to.eql('C');
        expect(injector.get('injector?')).to.equal(injector);
      });


      it('missing service as <undefined>', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        expect(injector.get('x?')).to.be.undefined;
        expect(injector.get('x.c?')).to.be.undefined;
        expect(injector.get('b.x?.c')).to.be.undefined;
      });


      it('equal to non-strict lookup', function() {

        // given
        const injector = new Injector([ module ]);

        // then
        for (const name of [ 'b', 'b.c', 'x', 'x.c', 'b.x.c', 'b.c.x' ]) {
          expect(injector.get(name, false), name).to.equal(injector.get(`${ name }?`));
        }
      });

    });


    describe('should throw', function() {

      it('on circular dependency', function() {

        // given
        const injector = new Injector([
          {
            a: [ 'factory', [ 'b?', (b) => 'A' ] ],
            b: [ 'factory', [ 'a?', (a) => 'B' ] ]
          }
        ]);

        // then
        expect(() => injector.get('a')).to.throw(
          'Cannot resolve circular dependency! (Resolving: a -> b -> a)'
        );
      });


      it('on provider error', function() {

        // given
        const injector = new Injector([
          {
            a: [ 'factory', () => {
              throw new Error('failed');
            } ]
          }
        ]);

        // then
        expect(() => injector.invoke([ 'a?', a => a ])).to.throw('failed');
      });


      it('on missing transitive dependency', function() {

        // given
        const injector = new Injector([
          {
            a: [ 'factory', [ 'c', (c) => 'A' ] ]
          }
        ]);

        // then
        expect(() => injector.invoke([ 'a?', a => a ])).to.throw(
          'No provider for "c"! (Resolving: a -> c)'
        );
      });

    });


    it('should not leak into resolving chain', function() {

      // given
      const injector = new Injector([
        {
          a: [ 'factory', [ 'b?', 'c', (b, c) => 'A' ] ]
        }
      ]);

      const child = injector.createChild([]);

      // when
      injector.invoke([ 'x?', x => x ]);
      child.invoke([ 'y?', y => y ]);

      // then
      expect(() => injector.get('a')).to.throw(
        'No provider for "c"! (Resolving: a -> c)'
      );

      expect(() => child.get('d')).to.throw(
        'No provider for "d"! (Resolving: d)'
      );
    });

  });

});
