import { expect } from 'chai';

import Module from '../lib/module';
import AsyncInjector from '../lib/async-injector';


describe('async-injector', function() {

  it('should consume an object as a module', async function() {

    class BubType {
      constructor() {
        this.name = 'bub';
      }
    }

    function BazType() {
      this.name = 'baz';
    }

    var module = {
      foo: [
        'factory',
        async function() {
          return 'foo-value';
        }
      ],
      bar: ['value', 'bar-value'],
      baz: ['type', BazType],
      bub: ['type', BubType]
    };
    var injector = new AsyncInjector([module]);

    expect(await injector.get('foo')).to.equal('foo-value');
    expect(await injector.get('bar')).to.equal('bar-value');

    var bub = await injector.get('bub');
    expect(bub).to.be.an.instanceof(BubType);
    expect(bub.name).to.eql('bub');

    var baz = await injector.get('baz');
    expect(baz).to.be.an.instanceof(BazType);
    expect(baz.name).to.eql('baz');
  });


  describe('get', function() {

    it('should return an instance', async function() {
      class BazType {
        constructor() {
          this.name = 'baz';
        }
      }

      var module = new Module;
      module.factory('foo', async function() {
        return {
          name: 'foo'
        };
      });
      module.value('bar', 'bar value');
      module.type('baz', BazType);

      var injector = new AsyncInjector([module]);

      expect(await injector.get('foo')).to.deep.equal({
        name: 'foo'
      });
      expect(await injector.get('bar')).to.equal('bar value');
      expect(await injector.get('baz')).to.deep.equal({
        name: 'baz'
      });
      expect(await injector.get('baz')).to.be.an.instanceof(BazType);

      // default to strict=true
      expect(await injector.get('bar', true)).to.equal('bar value');
    });


    it('should always return the same instance', async function() {
      class BazType {
        constructor() {
          this.name = 'baz';
        }
      }

      var module = new Module;
      module.factory('foo', async function() {
        return {
          name: 'foo'
        };
      });
      module.value('bar', 'bar value');
      module.type('baz', BazType);

      var injector = new AsyncInjector([module]);

      expect(await injector.get('foo')).to.equal(await injector.get('foo'));
      expect(await injector.get('bar')).to.equal(await injector.get('bar'));
      expect(await injector.get('baz')).to.equal(await injector.get('baz'));
    });


    it('should reuse module', async function() {
      class FooType {
        constructor() {
          this.name = 'foo';
        }
      }

      function barFactory(foo) {
        return foo;
      }

      var module = new Module;
      module.type('foo', [FooType]);
      module.factory('bar', ['foo', barFactory]);

      var injector1 = new AsyncInjector([module]);
      expect(await injector1.get('foo')).to.equal(await injector1.get('bar'));

      var injector2 = new AsyncInjector([module]);
      expect(await injector2.get('foo')).to.equal(await injector2.get('bar'));
    });


    it('should reuse inject fn', async function() {
      class FooType {
        constructor() {
          this.name = 'foo';
        }

      }

      function barFactory(foo) {
        return foo;
      }

      var module = new Module;
      module.type('foo', [FooType]);
      module.factory('bar', ['foo', barFactory]);

      var injector = new AsyncInjector([module]);
      async function fn(foo, bar) {
        expect(foo).to.equal(await injector.get('foo'));
        expect(bar).to.equal(await injector.get('bar'));

        return false;
      }
      var annotatedFn = ['foo', 'bar', fn];

      await injector.invoke(annotatedFn);
      await injector.invoke(annotatedFn);
    });


    it('should resolve dependencies', async function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }
      Foo.$inject = ['bar', 'baz'];

      async function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }
      bar.$inject = ['baz', 'abc'];

      var module = new Module;
      module.type('foo', Foo);
      module.factory('bar', bar);
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new AsyncInjector([module]);
      var fooInstance = await injector.get('foo');

      expect(fooInstance.bar).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });

      expect(fooInstance.baz).to.equal('baz-value');
    });


    it('should resolve dependencies (array notation)', async function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }

      var bar = async function(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      };

      var module = new Module;
      module.type('foo', ['bar', 'baz', Foo]);
      module.factory('bar', ['baz', 'abc', bar]);
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new AsyncInjector([module]);
      var fooInstance = await injector.get('foo');

      expect(fooInstance.bar).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
      expect(fooInstance.baz).to.equal('baz-value');
    });


    it('should inject properties', async function() {
      var module = new Module;
      module.value('config', {
        a: 1,
        b: {
          c: 2
        }
      });

      var injector = new AsyncInjector([module]);

      expect(await injector.get('config.a')).to.equal(1);
      expect(await injector.get('config.b.c')).to.equal(2);
    });


    it('should inject dotted service if present', async function() {
      var module = new Module;
      module.value('a.b', 'a.b value');

      var injector = new AsyncInjector([module]);
      expect(await injector.get('a.b')).to.equal('a.b value');
    });


    it('should provide "injector"', async function() {
      var module = new Module;
      var injector = new AsyncInjector([module]);

      expect(await injector.get('injector')).to.equal(await injector);
    });


    it('should throw error with full path if no provider', async function() {
      // a requires b requires c (not provided)
      function aFn(b) {
        return 'a-value';
      }
      aFn.$inject = ['b'];

      function bFn(c) {
        return 'b-value';
      }
      bFn.$inject = ['c'];

      var module = new Module;
      module.factory('a', aFn);
      module.factory('b', bFn);

      var injector = new AsyncInjector([module]);

      await expectThrows(function() {
        return injector.get('a');
      }, 'No provider for "c"! (Resolving: a -> b -> c)');
    });


    it('should return null if non-strict and no provider', async function() {
      var module = new Module;
      var injector = new AsyncInjector([module]);
      var notDefined = await injector.get('not-defined', false);

      return expect(notDefined).to.be.null;
    });


    it('should throw error if circular dependency', async function() {
      function aFn(b) {
        return 'a-value';
      }
      aFn.$inject = ['b'];

      function bFn(a) {
        return 'b-value';
      }
      bFn.$inject = ['a'];

      var module = new Module;
      module.factory('a', aFn);
      module.factory('b', bFn);

      var injector = new AsyncInjector([module]);

      await expectThrows(function() {
        return injector.get('a');
      }, 'Cannot resolve circular dependency! ' + '(Resolving: a -> b -> a)');
    });

  });


  describe('invoke', function() {

    it('should resolve dependencies', async function() {
      function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }
      bar.$inject = ['baz', 'abc'];

      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new AsyncInjector([module]);

      expect(await injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should resolve dependencies (array notation)', async function() {
      function bar(baz, abc) {
        return {
          baz: baz,
          abc: abc
        };
      }

      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new AsyncInjector([module]);

      expect(await injector.invoke(['baz', 'abc', bar])).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should invoke function on given context', async function() {
      var context = {};
      var module = new Module;
      var injector = new AsyncInjector([module]);

      injector.invoke((function() {
        expect(this).to.equal(context);
      }), context);
    });


    it('should throw error if a non function given', async function() {
      var injector = new AsyncInjector([]);

      await expectThrows(function() {
        return injector.invoke(123);
      }, 'Cannot invoke "123". Expected a function!');

      await expectThrows(function() {
        return injector.invoke('abc');
      }, 'Cannot invoke "abc". Expected a function!');

      await expectThrows(function() {
        return injector.invoke(null);
      }, 'Cannot invoke "null". Expected a function!');

      await expectThrows(function() {
        return injector.invoke(void 0);
      }, 'Cannot invoke "undefined". ' + 'Expected a function!');

      await expectThrows(function() {
        return injector.invoke({});
      }, 'Cannot invoke "[object Object]". ' + 'Expected a function!');
    });


    it('should auto parse arguments/comments if no $inject defined', async function() {
      function bar(/* baz */ a, abc) {
        return { baz: a, abc: abc };
      }

      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new AsyncInjector([module]);

      expect(await injector.invoke(bar)).to.deep.equal({
        baz: 'baz-value',
        abc: 'abc-value'
      });
    });


    it('should resolve with local overrides', async function() {
      class FooType {
        constructor() {
          throw new Error('foo broken');
        }
      }

      var module = {
        foo: [ 'type', FooType ]
      };

      var injector = new AsyncInjector([ module ]);

      var annotatedFn = ['foo', 'bar', function(foo, bar) {
        expect(foo).to.eql('FOO');
        expect(bar).to.equal(undefined);
      }];

      injector.invoke(annotatedFn, null, { foo: 'FOO', bar: undefined });
    });

  });


  describe('instantiate', function() {

    it('should resolve dependencies', async function() {
      class Foo {
        constructor(abc1, baz1) {
          this.abc = abc1;
          this.baz = baz1;
        }
      }
      Foo.$inject = ['abc', 'baz'];

      var module = new Module;
      module.value('baz', 'baz-value');
      module.value('abc', 'abc-value');

      var injector = new AsyncInjector([module]);

      expect(await injector.instantiate(Foo)).to.deep.equal({
        abc: 'abc-value',
        baz: 'baz-value'
      });
    });

    it('should return returned value from constructor if an object returned', async function() {

      var module = new Module;
      var injector = new AsyncInjector([module]);
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

      expect(await injector.instantiate(ObjCls)).to.equal(returnedObj);
      expect(await injector.instantiate(StringCls)).to.be.an.instanceof(StringCls);
      expect(await injector.instantiate(NumberCls)).to.be.an.instanceof(NumberCls);
    });

  });


  describe('override', function() {

    it('should replace definition via override module', async function() {
      class Foo {
        constructor(bar1, baz1) {
          this.bar = bar1;
          this.baz = baz1;
        }
      }

      function createBlub(foo1) {
        return foo1;
      }

      var base = new Module;
      base.type('foo', ['bar', 'baz', Foo]);
      base.factory('blub', ['foo', createBlub]);
      base.value('baz', 'baz-value');
      base.value('abc', 'abc-value');

      var extension = new Module;
      extension.type('foo', ['baz', 'abc', Foo]);

      var injector = new AsyncInjector([base, extension]);
      var expectedFoo = {
        bar: 'baz-value',
        baz: 'abc-value'
      };

      expect(await injector.get('foo')).to.deep.equal(expectedFoo);
      expect(await injector.get('blub')).to.deep.equal(expectedFoo);
    });


    it('should mock element via value', async function() {
      function createBar() {
        return {
          a: 'realA'
        };
      }

      var base = new Module;
      base.factory('bar', createBar);
      var mocked = {
        a: 'A'
      };

      var mock = new Module;
      mock.value('bar', mocked);

      var injector = new AsyncInjector([base, mock]);

      expect(await injector.get('bar')).to.equal(mocked);
    });

  });

});



// helpers /////////////////

async function expectThrows(asyncFn, message) {

  try {
    await asyncFn();

    expect.fail('expected error');
  } catch (err) {
    expect(err.message).to.eql(message);
  }
}