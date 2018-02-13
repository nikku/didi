import Module from '../lib/module';

describe('module', function() {

  it('should return self to enable chaining', function() {
    var module = new Module;

    module
      .value('a', 'a-value')
      .factory('b', function() {
        return 'b-value';
      })
      .type('c', function() {})
      .value('e', 'e-value');
  });

});
