/*
    Messages model (implemented as a service that can be injected into other items)
*/


// Wrap the code in a immediately-invoked function expression (IIFE) so we don't have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';
    
    angular.module('MessageModule').factory('MessageModel', function($rootScope) {
        var MessageModel = {};
      
        // set default properties
        var messages = [];

        // Connect to a server socket
        var socket = io.connect();
        
        // Define methods
        MessageModel.getMessages = function() {
            return messages;
        };

        MessageModel.length = function() {
            return messages.length;
        };
        
        MessageModel.clearMessages = function() {
            messages = [];
            return messages;
        };

        MessageModel.addItem = function(msg) {
            messages.push(msg);
            return messages;
        };

        MessageModel.getItem = function(index) {
            return messages[index];
        };

        MessageModel.updateItem = function(index, msg) {
            messages[index] = msg;
            return messages;
        };
        
        MessageModel.deleteItem = function(item) {
            messages.splice(messages.indexOf(item), 1);
            return messages;
        };
        
        // Listen for 'traffic' events from the server
        socket.on('traffic', function (msg) {
            // traffic event from the server received so add it to the messagas model (list of objects)
            if (!angular.isUndefined(msg)) {
                // Since this is an async socket callback we need to tell Angular that things have changed
                $rootScope.$apply(function() {
                    //messages.push({type: msg.type, message: msg});
                    MessageModel.addItem(msg);
                });
            }
        });

        // Send a message to the server
        MessageModel.send = function send(msgtype, msg) {
            socket.emit(msgtype, msg);
        };
    
        return MessageModel;
    });

}());
