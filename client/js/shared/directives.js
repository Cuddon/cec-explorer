/*
    Directives
    
*/

// Wrap module in a immediately-invoked function expression (IIFE) so we don't have issues with globals (http://en.wikipedia.org/wiki/Immediately-invoked_function_expression)
(function () {
    'use strict';

    angular.module('DirectivesModule', []);
    
    
    /*
        CEC Message Display directive: <cec-messages></cec-messages>
        Displays all messages from the parent scope
    */
    angular.module('DirectivesModule').directive('cecMessages', ['modalService', function(modalService) {
        // Return a Directive definition object
        return {
            
            // restrict use to an element or attribute
            restrict: "EA",
            
            // Isolate the scope for this directive so it can be a reusable component. Tt does not inherit from the parent and can be used anywhere without interfering with the parent scope.
            scope: {
                // pass in required parent scope models into the isolated scope (these end up in $scope in the controller")
                messages: '=',  // two way binding
                searchtext: '='
            },

            // Relace the parent element with our template (our template must have a wrapping element such as a div)
            replace: true,

            // Link function to attach listeners etc
            link: function(scope, elem, attrs) {
                /*
                    The Link function is used for attaching event listeners to elements, watching properties for chnages, andupdating the DOM
                    scope: the scope passed to the directive. In this case it's just the local scope.
                    elem: the parent element (jQuery/jQLite wrapped)
                    attrs: object holding the attributes in the parent element (e.g. data-mydataitem="42" --> attrs.mydataitem -->42)
                */
                scope.popupMessadeDetails = function(message) {
                    var modalOptions = {
                        closeButtonText: 'Cancel',
                        actionButtonText: 'OK',
                        headerText: 'Message Details' ,
                        bodyText: 'Message:',
                        message: message    // save the message so it can be sent by the service to the element being displayed
                    };
                    var modalDefaults = {
                        templateUrl: '/js/messages/messagedetails.html'
                    };
                    modalService.showModal(modalDefaults, modalOptions).then(function (result) {
                        //alert('Result: ' + result);
                    });
                };
            },
            
            template:
                "<table class='table table-striped table-hover table-condensed table-responsive'>" +
                    "<!-- CEC Messages Table -->" +
                    "<thead>" +
                        "<tr>" +
                            "<th>ID</th><th>Message Type</th><th>Message Text (Click for details)</th>" +
                        "</tr>" +
                    "</thead>" +
                    "<tbody>" +
                        "<tr data-ng-repeat='m in messages | filter:searchtext' ng-click='popupMessadeDetails(m)'>" + 
                            "<td><strong>{{m.id}}</strong></td><td>{{m.type}}</td><td>{{m.text}}</td>" +
                        "</tr>" +
                    "</tbody>" +
                "</table>"
        };
    }]);
    
}());