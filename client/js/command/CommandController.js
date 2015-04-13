/*
    CommandController
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('CommandModule').controller('CommandController', ['$scope', 'SocketService', function($scope, SocketService) {

        // Send a message to the server
        $scope.send = function send(msgtype, msg) {
            SocketService.emit({
                messagetype : msgtype,
                messagetext: msg
            });
        };


    }]);

}());
