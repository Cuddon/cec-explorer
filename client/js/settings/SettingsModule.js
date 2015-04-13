/*
    Settings Module 
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    // Declare the module which depends on filters, and services
    angular.module('SettingsModule', ['SocketModule']);
    
}());
