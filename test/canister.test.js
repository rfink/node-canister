
var should = require('should')
    , Canister = require('../index');

describe('canister', function() {

  var functions = []
      , maxCanisterSize = 10
      , minRefillNumber = 9
      , timeout = 10
      , config = {
          max: maxCanisterSize,
          min: minRefillNumber
        }
      , canister = null
      , counter = 0;

  /**
   * Our item getter
   */

  function getItem(callback) {

    function createFunc() {
      return callback(null, counter++);
    }

    functions.push(setTimeout(createFunc, timeout));

  }

  beforeEach(function(done) {
    canister = new Canister(getItem, config);
    canister.once('refill done', function() {
      done();
    });
  });

  afterEach(function(done) {
    functions.forEach(clearTimeout);
    delete canister;
    counter = 0;
    done();
  });

  describe('length', function() {
    it('should have correct length', function(done) {
      canister.queue.length.should.equal(maxCanisterSize);
      done();
    });
  });

  describe('drain one', function() {
    it('should refill after draining one', function(done) {
      canister.on('refill start', function() {
        done();
      });
      canister.drain(function(err, item) {
        canister.queue.length.should.equal(9);
        should.exist(item);
      });
    });
  });

  describe('empty', function() {
    it('should emit empty when empty', function(done) {
      canister.queue = [];
      canister.on('empty', function() {
        canister.refill();
      });
      canister.drain(function() {
        done();
      });
    });
  });

});