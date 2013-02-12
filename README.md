canister
========

A method of keeping a pool of expensive-to-obtain-objects.  Basically, instead of being an on-demand
generator for pool objects, it eagerly loads objects into the pool.  When you pull an item from the queue,
it should already be in memory, and then you have the option of either throwing the object away, or adding
it back to the queue.  When the queue reaches a minimum refill size, it will automatically refill the queue
back to the maximum queue size specified.  If the queue does become empty, the logic then falls back to
load the object on demand.  This allows you to tune your pool for maximum performance.  Great uses cases include:
redis connections, mysql connections, http requests, etc.

This is how you can use it:

In your package.json:

```js
  {
    "dependencies": {
      "rebound": "git://github.com/rfink/node-canister.git"
    }
  }
```

## Usage

```js

  var Canister = require("canister")
      , options = {
          max: 10,
          min: 2
        };

  function itemGetter(callback) {
    setTimeout(function() {
      return callback(null, 1);
    }, 1000);
  }

  // This will automatically start the refill process
  queue = new Canister(itemGetter, options);

  // You can subscribe to certain events
  queue.on('refill done', function() {
    queue.drain(function(err, item) {
      console.log('Item #' + item);
    });
  });

  queue.on('empty', function() {
    console.error('Oh noes, I got empty');
  });

  // Or you can start accessing queue items at any time
  queue.drain(function(err, item) {
    console.log('Item #' + item);
  });


```
