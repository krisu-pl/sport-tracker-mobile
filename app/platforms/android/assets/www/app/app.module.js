(function () {
    'use-strict';

    var app = angular.module('sport-tracker-mobile', ['ngCordova', 'ngStorage', 'ui.router', 'cordovaHTTP']);

    app.run(function($rootScope) {
        $rootScope.endpoint = 'http://178.62.21.70:3001/api/mobile';
    });

    app.config(routeConfig);

    function routeConfig($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                class: 'login',
                templateUrl: 'views/login.html',
                controller: 'loginController'
            })
            .state('tracking', {
                url: '/tracking',
                class: 'tracking',
                templateUrl: 'views/tracking.html',
                controller: 'trackingController'
            });

        $urlRouterProvider.otherwise('/login');

    }

})();