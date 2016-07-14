(function () {
    'use-strict';

    var app = angular.module('sport-tracker-mobile', ['ngCordova', 'ui.router']);

    app.run(function($rootScope) {
        $rootScope.endpoint = 'http://192.168.43.4:3000/api/mobile';
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
                controller: 'trackingController',
                resolve: {
                    //auth: function ($state) {
                    //    SessionService.checkSession().then(function success() {
                    //        TasksService.getMyTasks();
                    //        FollowService.getMyFriends();
                    //    }, function error() {
                    //        $state.go('welcome');
                    //    });
                    //}
                }
            })

        $urlRouterProvider.otherwise('/login');

    }

})();