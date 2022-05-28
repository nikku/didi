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
      const fn = function(a, b) {
        return null;
      };

      annotate('aa', 'bb', fn);

      expect(/** @type InjectAnnotated */ (fn).$inject).to.eql([ 'aa', 'bb' ]);
    });


    it('should return the function', function() {
      const fn = function(a, b) {
        return null;
      };
      expect(annotate('aa', 'bb', fn)).to.equal(fn);
    });


    it('should inject using array args', function() {
      const fn = function(a, b) {
        return null;
      };
      expect(annotate([ 'aa', 'bb', fn ])).to.equal(fn);
    });


    it('should annotate class constructor', function() {
      class Foo {
        constructor(a, b) { }
      }

      expect(annotate('aa', 'bb', Foo).$inject).to.eql([ 'aa', 'bb' ]);

      expect(annotate('aa', 'bb', Foo)).to.equal(Foo);
    });


    it('should annotate arrow function', function() {

      const fn = (a, b) => a + b;

      expect(annotate('aa', 'bb', fn).$inject).to.eql([ 'aa', 'bb' ]);

      expect(annotate('aa', 'bb', fn)).to.equal(fn);
    });

  });


  describe('parseAnnotations', function() {

    it('should parse function', function() {
      expect(
        parseAnnotations(function(one, two) {})
      ).to.eql([ 'one', 'two' ]);

      expect(
        parseAnnotations(function(one, two) {})
      ).to.eql([ 'one', 'two' ]);
    });


    describe('should parse lambda', function() {

      it('default', function() {
        expect(
          parseAnnotations((a, b) => {})
        ).to.eql([ 'a', 'b' ]);

        expect(
          parseAnnotations((a, b) => a + b)
        ).to.eql([ 'a', 'b' ]);

        expect(
          parseAnnotations(a => a + 1)
        ).to.eql([ 'a' ]);

        expect(
          parseAnnotations(a => {
            return a + 1;
          })
        ).to.eql([ 'a' ]);

        expect(
          parseAnnotations(() => 1)
        ).to.eql([ ]);
      });


      it('async', function() {
        expect(
          parseAnnotations(async (a, b) => {})
        ).to.eql([ 'a', 'b' ]);

        expect(
          parseAnnotations(async (a, b) => a + b)
        ).to.eql([ 'a', 'b' ]);

        expect(
          parseAnnotations(async a => a + 1)
        ).to.eql([ 'a' ]);

        expect(
          parseAnnotations(async a => {
            return a + 1;
          })
        ).to.eql([ 'a' ]);

        expect(
          parseAnnotations(async () => 1)
        ).to.eql([ ]);

        expect(
          parseAnnotations(async () => {})
        ).to.eql([ ]);
      });

    });


    describe('should parse class', function() {

      it('with constructor', function() {
        class Foo {
          constructor(one, two) {}
        }

        expect(parseAnnotations(Foo)).to.eql([ 'one', 'two' ]);
      });


      it('without constructor', function() {
        class Car {
          start() {
            this.started = true;
          }
        }

        expect(parseAnnotations(Car)).to.eql([ ]);
      });

    });


    describe('should parse comment annotation', function() {

      /* eslint-disable spaced-comment */

      it('function', function() {

        // when
        const fn = function(/* one */ a, /*two*/ b,/*   three*/c) {};

        // then
        expect(parseAnnotations(fn)).to.eql([ 'one', 'two', 'three' ]);
      });


      it('lambda', function() {

        // when
        const arrowFn = (/* one */ a, /*two*/ b,/*   three*/c) => {};

        // then
        expect(parseAnnotations(arrowFn)).to.eql([ 'one', 'two', 'three' ]);
      });


      it('class', function() {
        class Foo {
          constructor(/*one*/ a, /*  two*/ b) {}
        }

        expect(parseAnnotations(Foo)).to.eql([ 'one', 'two' ]);
      });

    });


    it('should parse mixed comments with argument names', function() {
      const fn = function(/* one */ a, b,/*   three*/c) {};

      expect(parseAnnotations(fn)).to.eql([ 'one', 'b', 'three' ]);
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

  describe('object destructure', function() {

    it('should parse simple destructured object args', function() {
      const fn = function({ a, b = 1, c = 2 }) {};

      expect(parseAnnotations(fn)).to.eql([ '...', 'a', 'b', 'c' ]);
    });

    //minification will normally rename the unpacked object param
    it('should parse assignments destructured object args', function() {
      // TODO changing below to bar:{a:1, b:2} will fail during splitting beacuase it doesnt look up the comma
      const fn = function({
        foo:a,
        bar: { a: b }, // comments will work as long as it doesnt have a comma
        'foo.baz': c = 3,
        x
      }) {};

      expect(parseAnnotations(fn)).to.eql([ '...', 'foo', 'bar', 'foo.baz', 'x' ]);
    });

  });

});
