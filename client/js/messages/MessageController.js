/*
    MessageController
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('MessageModule').controller('MessageController', ['$scope', 'MessageModel', function($scope, MessageModel) {

        /*
            Set initial state of the model (will do this each time we go back to the view)
        */
        // Messages is a list of mesage objects of various types: traffic, notice, error
        $scope.messages = MessageModel.getMessages();

        $scope.clearMessages = function() {
            $scope.messages = [];
            MessageModel.clearMessages();
        };
        
        // Watch the length of the message model array. If the length changes, then an item has been added or removed
        $scope.onMessageModelChange = function (newValue, oldValue, scope) {
            // Callback to run if the watch has detected a change
            if (newValue !== oldValue) {
                // The messages model has changed so retrieve the messages
                scope.messages = MessageModel.getMessages();
                //alert('Messages model changed');
            }
        };
        $scope.$watchCollection(function() {
            // Watch expression
            return MessageModel.getMessages();
        }, $scope.onMessageModelChange);

    }]);

}());
