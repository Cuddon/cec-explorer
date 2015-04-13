/*
    Filters 
    
    THIS IS AN EXAMPLE ONLY
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don;t have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('FiltersModule', []);
    
    angular.module('FiltersModule').filter('interpolate', ['version', function(version) {
        return function(text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }]);
}());