import { Injector } from '../..';

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
    const bar = injector.get('bar') as string;
    const foop = injector.get('foop') as string;
    const bub = injector.get<BubType>('bub');
    const baz = injector.get('baz') as BazType;

    // then
    expect(foo).to.eql('foo-value');
    expect(bar).to.eql('bar-value');
    expect(foop).to.eql('bar-value');

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
    const bar = injector.get('bar', false);

    // then
    expect(bar).not.to.exist;
    expect(bub.bar).to.eql('bar-value');
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