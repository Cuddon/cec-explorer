/* Main App Module */

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';
    
    // Declare app level module which depends on other modules, filters, and services
    angular.module('app', [
        // Dependencies (other modules etc)
        'ngRoute',
        'ui.bootstrap',
        'MessageModule',
        'CommandModule',
        'RecordModule',
        'FiltersModule',
        'DirectivesModule',
        'ModalServiceModule',
        'SettingsModule'
    ]);
    
    // Configure routes
    angular.module('app').config(['$routeProvider', function($routeProvider) {
        // For each route bind a controller to a view
        
        $routeProvider.when('/messages', {
          templateUrl: 'js/messages/displaymessages.html',
          controller: 'MessageController'
        });
        
        $routeProvider.when('/record', {
            templateUrl: 'js/record/record.html', 
            controller: 'RecordController'
        });
        $routeProvider.when('/recordedmessages', {
            templateUrl: 'js/record/recordedmessages.html', 
            controller: 'RecordController'
        });
    
        $routeProvider.when('/command', {
            templateUrl: 'js/command/sendcommand.html', 
            controller: 'CommandController'
        });
    
        $routeProvider.when('/settings', {
            templateUrl: 'js/settings/settings.html', 
            controller: 'SettingsController'
        });

        $routeProvider.when('/', {
            redirectTo: '/messages'
        });
    
        $routeProvider.otherwise({
            redirectTo: '/messages'
        });
    }]);
}());
