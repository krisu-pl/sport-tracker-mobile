'use strict';

(function () {
    'use-strict';

    var app = angular.module('sport-tracker-mobile', ['ngCordova', 'ngStorage', 'ui.router']);

    app.run(function ($rootScope) {
        $rootScope.endpoint = 'http://192.168.43.4:3000/api/mobile';
    });

    app.config(routeConfig);

    function routeConfig($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider.state('login', {
            url: '/login',
            class: 'login',
            templateUrl: 'views/login.html',
            controller: 'loginController'
        }).state('tracking', {
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
        });

        $urlRouterProvider.otherwise('/login');
    }
})();
'use strict';

angular.module('sport-tracker-mobile').factory('DataService', function ($localStorage) {

    return {
        setActiveEvent: function setActiveEvent(activeEvent) {
            $localStorage.activeEvent = activeEvent;
        },
        getActiveEvent: function getActiveEvent() {
            return $localStorage.activeEvent;
        },
        setActiveParticipant: function setActiveParticipant(activeParticipant) {
            $localStorage.activeParticipant = activeParticipant;
        },
        getActiveParticipant: function getActiveParticipant() {
            return $localStorage.activeParticipant;
        },
        setSessionKey: function setSessionKey(sessionKey) {
            $localStorage.sessionKey = sessionKey;
        },
        getSessionKey: function getSessionKey() {
            return $localStorage.sessionKey;
        },
        clearData: function clearData() {
            $localStorage.activeEvent = {};
            $localStorage.activeParticipant = {};
            $localStorage.sessionKey = '';
        }
    };
});
'use strict';

angular.module('sport-tracker-mobile').service('EventService', function ($q, $http, $rootScope) {

    this.getAll = function () {
        var d = $q.defer();

        $http({
            method: 'GET',
            url: $rootScope.endpoint + '/getAllEvents',
            withCredentials: true
        }).then(function successCallback(response) {
            if (response.data.error) {
                d.reject(response);
            }
            d.resolve(response);
        }, function errorCallback(response) {
            d.reject(response);
        });

        return d.promise;
    };
});
'use strict';

angular.module('sport-tracker-mobile').service('ParticipantService', function ($q, $http, $rootScope) {

    this.login = function (data) {
        var d = $q.defer();

        $http({
            method: 'POST',
            url: $rootScope.endpoint + '/login',
            data: data,
            withCredentials: true
        }).then(function successCallback(response) {
            if (response.data.error) {
                d.reject(response);
            }
            d.resolve(response);
        }, function errorCallback(response) {
            d.reject(response);
        });

        return d.promise;
    };
});
'use strict';

angular.module('sport-tracker-mobile').controller('loginController', function ($rootScope, $scope, $state, EventService, ParticipantService, DataService) {

    $scope.events = [];

    $scope.init = function () {
        EventService.getAll().then(function success(response) {
            $scope.events = response.data;
        });
    };

    $scope.onLogin = function () {

        var data = {
            event_id: parseInt($scope.event_id),
            starting_number: parseInt($scope.starting_number),
            pin: parseInt($scope.pin)
        };

        var activeEvent = $scope.events.filter(function (element) {
            return element.id == $scope.event_id;
        });

        ParticipantService.login(data).then(function success(response) {
            DataService.setActiveEvent(activeEvent[0]);
            DataService.setActiveParticipant(response.data.participant);
            DataService.setSessionKey(response.data.session_key);
            $state.go('tracking');
        });
    };
});
'use strict';

angular.module('sport-tracker-mobile').controller('trackingController', function ($rootScope, $scope, $state, $interval, EventService, ParticipantService, DataService) {

    $scope.event = {};
    $scope.participant = {};

    $scope.data = {
        eventActive: false,
        trackingActive: false,
        eventTime: '-'
    };

    var trackingTimer = void 0;
    var trackingTimerEnabled = false;

    $scope.$watch('data.eventTime', function (newTime, oldTime) {
        if (newTime.substr(0, 1) != '-') {
            $scope.data.eventActive = true;

            if ($scope.data.trackingActive && !trackingTimerEnabled) {
                trackingTimer = $interval(sendLocation, 1000);
                trackingTimerEnabled = true;
            }
        }
    });

    $scope.init = function () {
        $scope.event = DataService.getActiveEvent();
        $scope.participant = DataService.getActiveParticipant();

        if (_.isEmpty($scope.event) || _.isEmpty($scope.participant)) {
            $state.go('login');
        }

        showEventTimer();
    };

    $scope.onStartTracking = function () {
        $scope.data.trackingActive = true;
    };

    $scope.onStopTracking = function () {
        $scope.data.trackingActive = false;
        $interval.cancel(trackingTimer);
        trackingTimerEnabled = false;
    };

    function sendLocation() {
        var time = moment().format('MMMM Do YYYY, hh:mm:ss');
        var el = document.getElementById('tracking_bottom');
        angular.element(el).prepend('<p><b>' + time + '</b> - Location sent.</p>');
    }

    /**
     * Show timer
     */
    function showEventTimer() {
        var _second = 1000;
        var _minute = _second * 60;
        var _hour = _minute * 60;

        // Get event start date from a data attribute
        var startDate = $scope.event.start_date;

        // Convert data from MySQL format to JS
        var start = new Date(startDate);

        function refreshTimer() {
            var now = new Date();

            // Calculate how much time passed since start
            var elapsedTime = now - start;

            var sign = "",
                hours = void 0,
                minutes = void 0,
                seconds = void 0;

            if (elapsedTime < 0) {
                sign = "-";
                hours = Math.ceil(elapsedTime / _hour) * -1;
                minutes = Math.ceil(elapsedTime % _hour / _minute) * -1;
                seconds = Math.ceil(elapsedTime % _minute / _second) * -1;
            } else {
                hours = Math.floor(elapsedTime / _hour);
                minutes = Math.floor(elapsedTime % _hour / _minute);
                seconds = Math.floor(elapsedTime % _minute / _second);
            }
            // Format time
            $scope.data.eventTime = sign + formatNumber(hours) + ':' + formatNumber(minutes) + ':' + formatNumber(seconds);
        }

        $interval(refreshTimer, 1000);
    }

    /**
     * Adds additional zero at the beginning if number is 1-digit.
     * @param number
     * @returns {string}
     */
    function formatNumber(number) {
        return ("0" + number).slice(-2);
    }
});