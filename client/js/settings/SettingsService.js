/*
    App settings (implemented as a service that can be injected into other items)
*/


// Wrap the code in a immediately-invoked function expression (IIFE) so we don't have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';
    
    angular.module('app').factory('SettingsService', function($rootScope) {

        var SettingsService = {};
        SettingsService.error = "";
        var settings = {};

        // Connect to a server socket
        var serverSocket = io.connect();

        // Initialised the settings by retrieving them from the server
        serverSocket.emit('settings-get');

        // Define methods
        SettingsService.getSettings = function() {
            // return the current settings
            return settings;
        };
        SettingsService.refresh = function() {
            // Get/refresh the saved settings from the server
            serverSocket.emit('settings-get');
        };

        SettingsService.length = function() {
            return settings.length;
        };
        
        SettingsService.resettodefaults = function() {
            settings = [];
            return settings;
        };

        SettingsService.addItem = function(key, val) {
            settings[key] = val;
            return settings;
        };

        SettingsService.getItem = function(key) {
            return settings[key];
        };

        SettingsService.updateItem = function(key, val) {
            settings[key] = val;
            return settings;
        };
        
        SettingsService.deleteItem = function(key) {
            settings.splice(settings.indexOf(key), 1);
            return settings;
        };
        
        // Listen for 'settings' events from the server 
        serverSocket.on('settings', function (data) {
            // New settings have been saved so display them
            // 'data' contains all the settings from the server (JSON string)
            if (!angular.isUndefined(data)) {
                // Since this is an async socket callback we need to tell Angular that things have changed
                $rootScope.$apply(function() {
                    // update the settings model
                    settings = angular.fromJson(data);
                });
            }
        });
        
        // Save settings to the the server
        SettingsService.save = function(newSettings) {
            settings = newSettings;
            serverSocket.emit('settings-save', angular.toJson(settings));
        };

        // Listen for errors returned by the server if settings could not be saved or retrieved
        serverSocket.on('settings-error', function (data) {
            SettingsService.error = angular.fromJson(data).error;
        });
    
        return SettingsService;
    });

}());
