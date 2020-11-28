var { expect } = require('chai');


describe('integration', function() {

  describe('umd bundle', function() {

    var didi = require('../../dist/didi.umd.prod.js');

    it('should expose API', function() {
      expect(didi.annotate).to.exist;
      expect(didi.Injector).to.exist;
      expect(didi.Module).to.exist;
    });

  });

});
