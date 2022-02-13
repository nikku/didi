const { expect } = require('chai');


describe('integration', function() {

  describe('node bundle', function() {

    const annotate = require('../..').annotate;
    const Injector = require('../..').Injector;
    const Module = require('../..').Module;


    it('should expose API', function() {
      expect(annotate).to.exist;
      expect(Injector).to.exist;
      expect(Module).to.exist;
    });


    it('should work bundled', function() {

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
          bar: ['value', 'bar-value'],
          baz: ['type', BazType],
          bub: ['type', BubType]
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

  });


});
