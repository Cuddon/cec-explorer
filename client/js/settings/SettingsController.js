/*
    MessageController
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('SettingsModule').controller('SettingsController', ['$scope', 'SettingsService', function($scope, SettingsService) {

        // Set initial state of the model (will do this each time we go back to the view)
        $scope.settings = {};

        // Alert messages display
        $scope.alerts = [];     //List of alert objects {type: blah, msg: blah} type = danger, warning, info, success
        $scope.addAlert = function(type, msg){
            // Remove any existing message first so we double up on the same message if it is displayed
            $scope.closeAlertByValue(msg);
            // Now add the alert
            $scope.alerts.push({type: type, msg: msg});
        };
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        $scope.clearAlerts = function(index) {
            $scope.alerts = [];
        };
        $scope.closeAlertByValue = function(alertText) {
            // Search the alerts for the text and remove it
            angular.forEach($scope.alerts, function(alert,index) {
                if (alert.msg === alertText) {
                    $scope.closeAlert(index);
                }
            });
        };
        

        // Save the settings
        $scope.saveSettings = function() {
            $scope.clearAlerts();
            $scope.addAlert('info', 'Saving settings...');
            SettingsService.save($scope.settings);
        };
        
        // Watch the settings model for changes
        $scope.onSettingsChange = function (newValue, oldValue, scope) {
            // Callback to run if the watch has detected a change
            if (newValue !== oldValue && newValue !== "") {
                // The messages model has changed so retrieve the messages
                if (Object.keys(oldValue).length === 0) {
                    // oldValue is an empty object
                    // We are just receiving the settings from the server when initialising the page
                    scope.settings = newValue;
                } else {
                    if (settings != oldValue && seetings.event == 'settings-updated-by-other-client') {
                        // The settings on the form have changes but an update has come throught from the server
                        scope.settings = newValue;
                        scope.addAlert('warning', 'Settings were updated by the server. Your changes may have been lost');
                    } else {
                        scope.settings = newValue;
                        scope.clearAlerts();
                        if (settings.event == 'settings-saved') {
                            scope.addAlert('success', 'Settings were saved.');
                        }
                    }
                }
                //alert(scope.settings);
            }
        };
        $scope.$watchCollection(function() {
            // Watch expression
            return SettingsService.getSettings();
        }, $scope.onSettingsChange);
        
        // Watch the settings object error messages
        $scope.onSettingsError = function (newValue, oldValue, scope) {
            // Callback to run if the watch has detected a change
            if (newValue !== oldValue) {
                // New error message
                $scope.clearAlerts();
                $scope.addAlert('danger', newValue);
                SettingsService.error = "";
            }
        };
        $scope.$watch(function() {
            // Watch expression
            return SettingsService.error;
        }, $scope.onSettingsError);
        
    }]);

}());
