import { Injector } from 'didi';

import { expect } from 'chai';


describe('typed', function() {

  class BubType {
    bar: string;

    constructor(bar: string) {
      this.bar = bar;
    }
  }

  class BazType {
    name: string;

    constructor() {
      this.name = 'baz';
    }
  }


  describe('Injector', function() {

    it('should instantiate', function() {

      // when
      const injector = new Injector([
        {
          foo: [
            'factory',
            function() {
              return 'foo-value';
            }
          ],
          bar: [ 'value', 'bar' ],
          baz: [ 'type', BazType ],
          bub: [ 'type', BubType ]
        }
      ]);

      // then
      expect(injector).to.exist;
    });


    it('should ignore extension', function() {

      // given
      const injector = new Injector([
        {
          __wooop__: [ 'bub' ]
        }
      ]);

      // then
      expect(injector).to.exist;
    });


    it('should offer typed injections', function() {

      // given
      type ServiceMap = {
        'foo': 1,
        'bar': 'BAR'
      };

      // when
      const injector = new Injector<ServiceMap>([
        {
          foo: [ 'value', 1 ],
          bar: [ 'value', 'BAR' ]
        }
      ]);

      // then
      const foo = injector.get('foo');
      expect(foo).to.eql(1);

      const bar = injector.get('bar');
      expect(bar).to.eql('BAR');

      const baz = injector.get('baz', false);
      expect(baz).not.to.exist;

      // illegal usage, but if you think you know better
      // we still accept it
      const boolBar = injector.get<boolean>('bar');
      expect(boolBar).to.exist;

      // @ts-expect-error illegal type conversion
      const invalidFoo : string = injector.get('foo');
    });

  });


  describe('#get', function() {

    it('should get', function() {

      // given
      const injector = new Injector([
        {
          foo: [
            'factory',
            function() {
              return 'foo-value';
            }
          ],
          bar: [ 'value', 'bar-value' ],
          foop: [
            'factory',
            function(bar: string) {
              return bar;
            }
          ],
          baz: [ 'type', BazType ],
          bub: [ 'type', BubType ]
        }
      ]);

      // when
      const foo = injector.get('foo') as string;
      const _bar = injector.get('bar') as string;
      const foop = injector.get('foop') as string;
      const bub = injector.get<BubType>('bub');
      const baz = injector.get('baz') as BazType;

      const typedFoo : string = injector.get('foo');
      const maybeBar = injector.get<string>('bar', false);

      // then
      expect(foo).to.eql('foo-value');
      expect(_bar).to.eql('bar-value');
      expect(foop).to.eql('bar-value');

      expect(maybeBar!.charAt(0)).to.eql('b');
      expect(typedFoo).to.eql('foo-value');

      expect(bub).to.be.an.instanceof(BubType);
      expect(bub.bar).to.eql('bar-value');

      expect(baz).to.be.an.instanceof(BazType);
      expect(baz.name).to.eql('baz');
    });


    it('should get nested', function() {

      // given
      const injector = new Injector([
        {
          __exports__: [ 'bub' ],
          __modules__: [
            {
              bar: [ 'value', 'bar-value' ]
            }
          ],
          bub: [ 'type', BubType ]
        }
      ]);

      // when
      const bub = injector.get<BubType>('bub');

      expect(() => {
        injector.get('bar', true);
      }).to.throw(/No provider for "bar"!/);

      const bar = injector.get('bar', false);

      // then
      expect(bar).not.to.exist;

      expect(bub.bar).to.eql('bar-value');
    });


    it('should get dynamic', function() {

      // given
      const injector = new Injector([]);

      // when
      const get = (service: string, strict: boolean) => {
        return injector.get(service, strict);
      };

      // then
      expect(get('bar', false)).not.to.exist;
    });

  });


  describe('#init', function() {

    it('should initialize', function() {

      // given
      const loaded : string[] = [];

      const injector = new Injector([
        {
          __init__: [ () => loaded.push('first') ]
        },
        {
          __init__: [ () => loaded.push('second') ]
        }
      ]);

      // when
      injector.init();

      // then
      expect(loaded).to.eql([
        'first',
        'second'
      ]);
    });


    it('should load dependent modules', function() {

      // given
      const loaded : string[] = [];

      const injector = new Injector([
        {
          __depends__: [
            {
              __init__: [ () => loaded.push('dep') ]
            }
          ],
          __init__: [ () => loaded.push('module') ]
        }
      ]);

      // when
      injector.init();

      // then
      expect(loaded).to.eql([
        'dep',
        'module'
      ]);
    });

  });


  describe('#invoke', function() {

    it('should invoke', function() {

      // given
      const injector = new Injector([
        {
          one: [ 'value', 1 ],
          two: [ 'value', 2 ]
        }
      ]);

      type Four = {
        four: number;
      };

      type Five = {
        five: number;
      };

      // when
      // then
      expect(injector.invoke((one, two) => {
        return one + two;
      })).to.eql(3);

      expect(injector.invoke((one, two, three) => {
        return one + two + three;
      }, null, { three: 3 })).to.eql(6);

      expect(injector.invoke(function(this: Four, one, two, three) {
        return one + two + three + this.four;
      }, { four: 4 }, { three: 3 })).to.eql(10);

      const result = injector.invoke(function() : Five {

        const five : Five = {
          five: 5
        };

        return five;
      });

      expect(result.five).to.eql(5);

      expect(injector.invoke(() => {})).not.to.exist;

    });

  });


  describe('#instantiate', function() {

    it('should instantiate Class', function() {

      // given
      const injector = new Injector([
        {
          one: [ 'value', 1 ],
          two: [ 'value', 2 ]
        }
      ]);

      class Foo {
        one: number;

        constructor(one: number) {
          this.one = one;
        }
      }

      // when
      const fooInstance = injector.instantiate(Foo);

      // then
      expect(fooInstance.one).to.eql(1);
    });

  });

});