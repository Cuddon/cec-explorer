/*
    Socket.io service
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('SocketModule').factory('SocketService', ['$rootScope', function ($rootScope) {
        var socket = io.connect();
    
        return {
            // Listen for events
            on: function (eventName, callback) {
                function wrapper() {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                }
                
                socket.on(eventName, wrapper);
                
                return function () {
                    socket.removeListener(eventName, wrapper);
                };
            },
            
            // Emit an event
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if(callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
    }]);
    
}());
