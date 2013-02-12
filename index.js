
/* ~ Application dependencies ~ */

var debug = require('debug')
    , async = require('async')
    , EventEmitter = require('events').EventEmitter;

exports = module.exports = Canister;

/**
 * Canistor constructor
 */

function Canister(itemGetter, config) {

  if (!(this instanceof Canister)) return new Canister(itemGetter, config);

  EventEmitter.call(this);
  this.queue = [];
  this.config = config || {};
  this.itemGetter = itemGetter;

  // Since node is single threaded, create an instance lock on refill, which should be atomic
  this.refillInProgress = false;
  this.refill();

}

Canister.prototype.__proto__ = EventEmitter.prototype;

/**
 * Drain a resource from the queue
 */

Canister.prototype.drain = function(callback) {

  var self = this;

  if (this.queue.length) {

    var item = this.queue.shift();
    callback(null, item);

    // If we hit our refill point, then do that
    if (this.queue.length <= this.config.min) {
      self.refill();
    }

  // Somehow we got empty, attach a listener to the item event
  } else {

    this.emit('empty');
    this.once('item', function(item) {
      return self.drain(callback);
    });

  }

};

/**
 * Fill the queue with the given resource
 */

Canister.prototype.fill = function(item) {

  this.emit('fill');
  this.queue.push(item);

  return this;

};

/**
 * Refill the queue with resources
 * @access private
 */

Canister.prototype.refill = function() {

  if (this.refillInProgress) return;

  this.refillInProgress = true;
  this.emit('refill start');

  var refillFuncs = []
      , self = this;

  /**
   * Fetch an item
   */

  function fetchItem(callback) {

    self.itemGetter(function(err, item) {
      if (err) {
        callback();
        return self.emit('refill error', err);
      }
      self.emit('item', item);
      self.queue.push(item);
      return callback(null, item);
    });

  }

  /**
   * Process results when all items back
   */

  function processResults(err, results) {

    self.refillInProgress = false;
    self.emit('refill done', results);

  }

  for (var i = 0, num = this.config.max - this.queue.length; i < num; ++i) {
    refillFuncs.push(fetchItem);
  }

  async.parallel(refillFuncs, processResults);

};
