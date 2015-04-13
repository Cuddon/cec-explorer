/*
    CEC Explorer - HDMI CEC message explorer
    
    Andrew Cuddon
    April 2014
*/

// Standard library modules
var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var express = require('express');
var fs = require('fs');

// App modules
var hdmicec = require("./hdmicec");

// Configure the HTTP server using express and socket.io
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

// Set the static path of the client files
router.use(express.static(path.resolve(__dirname, 'client')));

// Globals
var messages = [];  // List of messages
var clients = [];   // List of current socket connections

io.on('connection', function (clientSocket) {
    // New client connected
    
    // Emit all existing messages to the new client
    messages.forEach(function (data) {
        clientSocket.emit('message', data);
    });

    // Add the new client to the list of currently connected clients
    clients.push(clientSocket);

    // Bind to socket disconnect event
    clientSocket.on('disconnect', function () {
        // Client has disconnected
        // Remove the client from the list of connected clients
        clients.splice(clients.indexOf(clientSocket), 1);
    });

    // Bind to the client 'settings-save' event
    clientSocket.on('settings-save', function (settingsJson) {
        // A client wants to save the settings

        // Convert JSON string to an object
        var settings = JSON.parse(settingsJson);


        // Save to a file 
        fs.writeFile('./clientsettings.json', JSON.stringify(settings, null, 4), function (err) {
            if (err) {
                // emit error to the client (settings must be in JSON text)
                settings.error = "settings-save-error";
                clientSocket.emit('settings-error', JSON.stringify(settings));
            } else {
                // Broadcast the settings to all connected clients (settings must be in JSON text)
                settings.event = "settings-saved";
                clientSocket.emit('settings', JSON.stringify(settings));
                settings.event = "settings-updated-by-other-client";
                broadcastToOthers('settings', JSON.stringify(settings), clientSocket);
            }
        });
    });

    // Listen for client 'settings-get' event
    clientSocket.on('settings-get', function () {
        // A client wants to retrieve/refresh the saved settings

        // Retrieve the settings file 
        fs.readFile('./clientsettings.json', function (err, buffer) {
            var settingsJson = buffer.toString(); 
            // Convert JSON string to an object
            var settings = JSON.parse(settingsJson);
            if (err) {
                // emit error to the client (settings must be in JSON text)
                settings.error = "settings-get-error";
                clientSocket.emit('settings-error', JSON.stringify(settings));
            } else {
                // Emit the updated settings back to the client (settings must be in JSON text)
                settings.event = "settings-retrieved";
                clientSocket.emit('settings', JSON.stringify(settings));
            }
        });
    });

});


function broadcast(event, data) {
    // Broadcast to all connected clients
    clients.forEach(function (clientSocket) {
        clientSocket.emit(event, data);
    });
}

function broadcastToOthers(event, data, currentSocket) {
    // Broadcase to all clients except the specified client
    clients.forEach(function (clientSocket) {
        if (clientSocket !== currentSocket) {
            clientSocket.emit(event, data);
        }
    });
}

// Listen for CEC messagee events
var cec = new hdmicec();

cec.on('traffic', function(message) {
    // change this to the message object
    broadcast('traffic', message);
});

cec.on('poll', function(message) {
    broadcast('poll', message);
});

cec.on('notice', function(message) {
    broadcast('notice', message);
});

cec.on('error', function(err) {
    broadcast('error', {name: 'error', data: err});
});

// start cec connection
setTimeout(function() {
    cec.start();
}, 20000);


// Start the server
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
