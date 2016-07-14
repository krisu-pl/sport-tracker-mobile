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
angular.module('sport-tracker-mobile').service('EventService', function ($q, $http, $rootScope) {

    this.getAll = function () {
        var d = $q.defer();

        $http({
            method: 'GET',
            url: $rootScope.endpoint + '/getAllEvents',
            withCredentials: true
        }).then(
            function successCallback(response) {
                if(response.data.error){
                    d.reject(response);
                }
                d.resolve(response);
            },

            function errorCallback(response) {
                d.reject(response);
            }
        );

        return d.promise;
    }
    
});

angular.module('sport-tracker-mobile').service('ParticipantService', function ($q, $http, $rootScope) {

});

angular.module('sport-tracker-mobile').controller('loginController',
    function ($rootScope, $scope, EventService) {

        $scope.events = [];

        $scope.init = function () {
            EventService.getAll().then(
                function success (response) {
                    console.log(response);
                    $scope.events = response.data;
                }
            )
        }

    }
);
