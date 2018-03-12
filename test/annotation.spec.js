import { expect } from 'chai';

import {
  annotate,
  parse
} from '../lib/annotation';


describe('annotation', function() {

  describe('annotate', function() {

    it('should set $inject property on the last argument', function() {
      var fn;
      fn = function(a, b) {
        return null;
      };
      annotate('aa', 'bb', fn);
      return expect(fn.$inject).to.deep.equal(['aa', 'bb']);
    });


    it('should return the function', function() {
      var fn;
      fn = function(a, b) {
        return null;
      };
      return expect(annotate('aa', 'bb', fn)).to.equal(fn);
    });


    it('should annotate class constructor', function() {
      class Foo {
        constructor(a, b) { }
      }

      annotate('aa', 'bb', Foo);

      expect(Foo.$inject).to.deep.equal(['aa', 'bb']);

      return expect(annotate('aa', 'bb', Foo)).to.equal(Foo);
    });

  });


  describe('parse', function() {

    it('should parse argument names without comments', function() {
      var fn;
      fn = function(one, two) {};
      return expect(parse(fn)).to.deep.equal(['one', 'two']);
    });


    it('should parse constructor argument names without comments', function() {
      class Foo {
        constructor(one, two) {}
      }

      return expect(parse(Foo)).to.deep.equal(['one', 'two']);
    });


    it('should parse non-constructor class', function() {
      class Car {
        start() {
          this.started = true;
        }
      }

      return expect(parse(Car)).to.deep.equal([ ]);
    });


    it('should parse comment annotation', function() {
      var fn;
      // eslint-disable-next-line spaced-comment
      fn = function(/* one */ a, /*two*/ b,/*   three*/c) {};
      return expect(parse(fn)).to.deep.equal(['one', 'two', 'three']);
    });


    it('should parse mixed comments with argument names', function() {
      var fn;
      fn = function(/* one */ a, b,/*   three*/c) {};
      return expect(parse(fn)).to.deep.equal(['one', 'b', 'three']);
    });


    it('should parse empty arguments', function() {
      var fn;
      fn = function() {};
      return expect(parse(fn)).to.deep.equal([]);
    });


    it('should throw error if a non function given', function() {
      expect(function() {
        return parse(123);
      }).to.throw('Cannot annotate "123". Expected a function!');

      expect(function() {
        return parse('abc');
      }).to.throw('Cannot annotate "abc". Expected a function!');

      expect(function() {
        return parse(null);
      }).to.throw('Cannot annotate "null". Expected a function!');

      expect(function() {
        return parse(void 0);
      }).to.throw('Cannot annotate "undefined". Expected a function!');

      expect(function() {
        return parse({});
      }).to.throw('Cannot annotate "[object Object]". Expected a function!');
    });

  });

});
