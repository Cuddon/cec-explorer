/*
    hdmicec.js
*/

var MODE = "NOCECDEVICE";  // In NOCECDEVICE mode the app will run on a machine without libcec/cec-client installed - for testing putposes only

// Import libraries
var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;
var util = require('util');
var byline = require('byline');

// Import App modules
var protocol = require('./protocol/protocol');
var QueueClass = require('./queue');

// Load settings
var settings = require('./settings.json');

// Create the HDMICEC object
function HDMICEC(args) {
    if (false === (this instanceof HDMICEC)) {
        // Not an object so create it
        return new HDMICEC(args);
    }
    this.args = args;
    this.queue = new QueueClass();

    // Set up even emitter
    EventEmitter.call(this);
}

// inherit methods and properties from EventEmitter class
//HDMICEC.prototype.__proto__ = EventEmitter.prototype;
util.inherits(HDMICEC, EventEmitter);

// start cec-client
HDMICEC.prototype.start = function() {
    var self = this;    // Save the current object instance for use by the callbacks
    
    if (MODE === 'NOCECDEVICE') {
        // Run in Dev/Test model without libcec/cec-client installed
        // Run the tests
        var tests = require('./tests.json');
        this.testsTimer = setInterval(function(){
            console.log('\n----------- Running tests -------------');
            for (var testname in tests) {
                if (testname.charAt(0) != '_') {
                    self.handleData(tests[testname].traffic);
                }
            }
            // Tests are repeated every 30 seconds
        },30000);

    } else {
        // run cec-client in a subprocess, displaying only TRAFFIC information (log level = 8)
        this.cec_client = spawn('cec-client', ['-d', '8', settings.adapterport]);

        // trap stdout and stderr from the spawned application
        this.stdout = byline(this.cec_client.stdout);
        this.stderr = byline(this.cec_client.stderr);

        // Redirect stdin to the running cec-client
        this.stdin = this.cec_client.stdin;

        // Save the current object instance for use by the callbacks
        //var self = this;

        this.stdout.on('data', function(data) {
            // Data received from cec-client
            self.handleData(data);
        });

        this.stderr.on('data', function(data) {
            // Error received from cec-client
            self.handleError(data);
        });

        this.cec_client.on('error', function(err) {
            // Other error from cec-client
            self.handleError(err);
        });

        this.cec_client.on('close', function(code) {
            // The spawned cec-client has closed
            self.emit('close', code);
            self.ready = false;
            self.cec_client = null;
        });
    }
};

// stop cec-client
HDMICEC.prototype.stop = function(callback) {
    if (typeof this.testsTimer !== 'undefined') {
        // Stop the timer executing any tests
        clearInterval(this.testsTimer);
    }
    
    // if client is null nothing to do
    if (!this.client) {
        callback(null);
    }

    // if we are ready to send then send quit command
    if (this.ready) {
        this.send('q');
        callback(null);
    } else {
        callback('cec-client not ready. Could not terminate');
    }
};

HDMICEC.prototype.send = function(command) {
    // Send data to the running cec-client
    this.stdin.write(command);
};

HDMICEC.prototype.handleData = function(cecdata) {
    /*
        Handle data from cec-client

        The TRAFFIC items provide the data bytes from the CEC bus via libcec
    */

    if (typeof cecdata != 'string') {
        cecdata = cecdata.toString();     // convert the bytes to a string
    }

    if (cecdata.indexOf('waiting for input') !=-1) {
        // cec-client is ready for input
        this.ready = true;
        this.emit('ready', this);
    } else if (cecdata.indexOf('TRAFFIC') === 0) {
        // Traffic data (bytes) received so decode it
        var message = protocol.decodemessage(cecdata);

        //Save to the message queue
        this.queue.add(message);

        //savestatus(message);

        // Trigger the traffic or poll event;
        this.emit(message.type, message);

        // Trigger an error event if required
        if (message.error.length > 0) {
            for (var i=0; i<message.error.length; i++) {
                this.handleError(new Error(message.error[i]));
            }
        }
    } else if (cecdata.indexOf('NOTICE') === 0) {
        this.emit('notice', cecdata);
    }
};

// handles stderr data
HDMICEC.prototype.handleError = function(err) {
    this.emit('error', err);
};


// Export the class
module.exports = HDMICEC;

if (MODE === 'NOCECDEVICE' && require.main === module) {
    // Run unit tests for this module
    var cec = new HDMICEC();

    cec.on('traffic', function(message) {
        console.log(message.text);
    });

    cec.on('poll', function(message) {
        console.log(message.text);
    });

    cec.on('notice', function(message) {
        console.log(message.text);
    });
    
    cec.on('error', function(err) {
       console.error(err); 
    });

    // start cec connection
    cec.start();

}