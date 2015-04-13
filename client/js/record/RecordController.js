/*
    RecordController
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('RecordModule').controller('RecordController', ['$scope', 'SocketService', function($scope, SocketService) {

        /*
            Set initial state of the model (will do this each time we go back to the view!)
        */
        $scope.recordfileName = '';  // Name of the file to save the recording
        $scope.startDelay = 0;
        $scope.stopDelay = 0;
        $scope.recording = false;
        $scope.maxmessages = 10000;
        $scope.recordings = ["Recording on Friday", "Another recording", "Yet another one"];
        $scope.selectedrecording = '';
        $scope.messages = [{type:"test1", message:{text:"Just a message"},id:"327",data:{dataitem1:"value1", dataitem2: "value2"}},{type:"test2", message:{text:"And another message"}}];
        $scope.version = angular.version.full;
        
        
        // Alert messages display
        $scope.alerts = [];     //List of alert objects {type: blah, msg: blah} type = danger, warning, info, success
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.isRecording = function() {
            return $scope.recording;
        };

        $scope.startNow = function() {
            $scope.alerts = [];
            if ($scope.recording) {
                $scope.alerts.push({type: 'warning', msg: 'Already recording.'});
            } else {
                if ($scope.recordfileName) {
                    $scope.recording = true;
                    $scope.alerts.push({type: 'info', msg: 'Recording started.'});
                } else {
                    $scope.alerts.push({type: 'danger', msg: 'Missing or invalid recording name.'});
                }
            }
        };

        $scope.startIn = function() {
            $scope.alerts = [];
            if ($scope.recording) {
                $scope.alerts.push({type: 'warning', msg: 'Already recording.'});
            } else {
                if ($scope.recordfileName) {
                    $scope.recording = true;
                    $scope.alerts.push({type: 'info', msg: 'Starting recording in ' + $scope.startDelay + ' minutes.'});
                } else {
                    $scope.alerts.push({type: 'danger', msg: 'Missing or invalid recording name.'});
                }
            }
        };

        $scope.stopNow = function() {
            $scope.alerts = [];
            if ($scope.recording) {
                if ($scope.recordfileName) {
                    $scope.recording = false;
                    $scope.recordings.push($scope.recordfileName);
                    $scope.selectedrecording = $scope.recordfileName;
                    $scope.alerts.push({type: 'info', msg: 'Recording stopped.'});
                } else {
                    $scope.alerts.push({type: 'danger', msg: 'Missing or invalid recording name.'});
                }
            } else {
                $scope.alerts.push({type: 'warning', msg: 'Not currently recording. Cannot stop.'});
            }
        };

        $scope.stopIn = function() {
            $scope.alerts = [];
            if ($scope.recording) {
                if ($scope.recordfileName) {
                    $scope.recording = false;
                    $scope.recordings.push($scope.recordfileName);
                    $scope.selectedrecording = $scope.recordfileName;
                    $scope.alerts.push({type: 'info', msg: 'Stopping recording in ' + $scope.stopDelay + ' minutes.'});
                } else {
                    $scope.alerts.push({type: 'danger', msg: 'Missing or invalid recording name.'});
                }
            } else {
                $scope.alerts.push({type: 'warning', msg: 'Not currently recording. Cannot stop.'});
            }
        };
        
        $scope.viewRecording = function () {
            if ($scope.selectedrecording !== '') {
                // Retrieve the selected recording from the server
                $scope.messages = [
                    {type : 'Notice', message : {text : 'This is a notice.'}},
                    {type : 'Traffic', message : {text : 'This is a traffic message.'}},
                    {type : 'Error', message : {text : 'This is an error message.'}}
                ];
            };
        };
        
        $scope.deleteRecording = function () {
            
        };
        
        $scope.editRecordingName = function () {
            
        };
        
        $scope.exportRecording = function () {
            console.log('Recording exported');
        };
        
        // Listen for 'traffic' events from the server
        SocketService.on('blah', function (msg) {
            // traffic event from the server received so add it to the messages model (list) and update the ViewModel
            $scope.messages = msg;
        });

        // Send a message to the server
        $scope.send = function send(msgtype, msg) {
            SocketService.emit({
                messagetype : msgtype,
                messagetext: msg
            });
        };


    }]);

}());
