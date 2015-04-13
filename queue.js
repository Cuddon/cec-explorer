/*
    Queue.js
    Exports QueueClass()
    
    Queue of message history
    
    Usage:
        var queue = new QueueClass();
        queue.add(myobj);
        queue.get();
        queue.clear();
        
*/

var MAX_QUEUE_SIZE = 100;

function QueueClass(args) {
    // Class
    // First check that this is an instance of this class
    if (!(this instanceof QueueClass)) {
      return new QueueClass(args);
    }
    this.args = args;

    // The queue is a list(array) of items. Items can be single values, object, or anything really, but it's best to keep them
    this.q = [];
}


// Add class method
QueueClass.prototype.add = function(item) {
      // Adds an item to the bottom of the queue
      // Deletes the first/oldest element if the queue size is > the max allowed

      // Add the new item to the bottom of the list
      this.q.push(item);
      if (this.q.length > MAX_QUEUE_SIZE) {
            // Remove the first/oldest item for the top of the list
            this.q.shift();
      }
}

// Add class method
QueueClass.prototype.get = function() {
      // Returns the queue

      return this.q;
}

// Add class method
QueueClass.prototype.clear = function() {
      // Clears the queue

      this.q = [];
}

module.exports = QueueClass;

