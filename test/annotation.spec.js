import { expect } from 'chai';

import {
  annotate,
  parseAnnotations
} from '../lib/annotation';

/**
 * @typedef {import('..').InjectAnnotated } InjectAnnotated
 */


describe('annotation', function() {

  describe('annotate', function() {

    it('should set $inject property on the last argument', function() {
      var fn = function(a, b) {
        return null;
      };

      annotate('aa', 'bb', fn);

      return expect(/** @type InjectAnnotated */ (fn).$inject).to.deep.equal(['aa', 'bb']);
    });


    it('should return the function', function() {
      var fn = function(a, b) {
        return null;
      };
      expect(annotate('aa', 'bb', fn)).to.equal(fn);
    });


    it('should inject using array args', function() {
      var fn = function(a, b) {
        return null;
      };
      expect(annotate([ 'aa', 'bb', fn ])).to.equal(fn);
    });


    it('should annotate class constructor', function() {
      class Foo {
        constructor(a, b) { }
      }

      expect(annotate('aa', 'bb', Foo).$inject).to.deep.equal(['aa', 'bb']);

      expect(annotate('aa', 'bb', Foo)).to.equal(Foo);
    });

  });


  describe('parseAnnotations', function() {

    it('should parse argument names without comments', function() {
      var fn;
      fn = function(one, two) {};
      expect(parseAnnotations(fn)).to.deep.equal(['one', 'two']);
    });


    it('should parse constructor argument names without comments', function() {
      class Foo {
        constructor(one, two) {}
      }

      return expect(parseAnnotations(Foo)).to.deep.equal(['one', 'two']);
    });


    it('should parse async function', function() {
      async function foo(a, b) {}

      return expect(parseAnnotations(foo)).to.deep.equal([ 'a', 'b' ]);
    });


    it('should parse lambda', function() {
      const foo = (a, b) => {};

      return expect(parseAnnotations(foo)).to.deep.equal([ 'a', 'b' ]);
    });


    it('should parse async lambda', function() {
      const foo = async (a, b) => {};

      return expect(parseAnnotations(foo)).to.deep.equal([ 'a', 'b' ]);
    });


    it('should parse non-constructor class', function() {
      class Car {
        start() {
          this.started = true;
        }
      }

      return expect(parseAnnotations(Car)).to.deep.equal([ ]);
    });


    it('should parse comment annotation', function() {
      var fn;
      // eslint-disable-next-line spaced-comment
      fn = function(/* one */ a, /*two*/ b,/*   three*/c) {};
      return expect(parseAnnotations(fn)).to.deep.equal(['one', 'two', 'three']);
    });


    it('should parse mixed comments with argument names', function() {
      var fn;
      fn = function(/* one */ a, b,/*   three*/c) {};
      return expect(parseAnnotations(fn)).to.deep.equal(['one', 'b', 'three']);
    });


    it('should parse empty arguments', function() {
      var fn;
      fn = function() {};
      return expect(parseAnnotations(fn)).to.deep.equal([]);
    });


    it('should throw error if a non function given', function() {
      expect(function() {

        // @ts-ignore-next-line
        return parseAnnotations(123);
      }).to.throw('Cannot annotate "123". Expected a function!');

      expect(function() {

        // @ts-ignore-next-line
        return parseAnnotations('abc');
      }).to.throw('Cannot annotate "abc". Expected a function!');

      expect(function() {
        return parseAnnotations(null);
      }).to.throw('Cannot annotate "null". Expected a function!');

      expect(function() {
        return parseAnnotations(void 0);
      }).to.throw('Cannot annotate "undefined". Expected a function!');

      expect(function() {

        // @ts-ignore-next-line
        return parseAnnotations({});
      }).to.throw('Cannot annotate "[object Object]". Expected a function!');
    });

  });

});
