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
            controller: 'trackingController'
        });

        $urlRouterProvider.otherwise('/login');
    }
})();
'use strict';

angular.module('sport-tracker-mobile').service('APIService', function ($q, $http, $rootScope) {

    function sendRequest(method, endpoint) {
        var data = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        return new Promise(function (resolve, reject) {
            $http({
                method: method,
                url: $rootScope.endpoint + endpoint,
                data: data,
                withCredentials: true
            }).then(function (response) {
                resolve(response);
            }, function (err) {
                reject(err);
            });
        });
    }

    this.login = function (data) {
        return sendRequest('POST', '/login', data);
    };

    this.getAllEvents = function () {
        return sendRequest('GET', '/getAllEvents');
    };

    this.sendLocation = function (data) {
        return sendRequest('POST', '/sendLocation', data);
    };
});
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

angular.module('sport-tracker-mobile').service('DeviceService', function ($cordovaGeolocation, $q, $http, $rootScope) {

    this.getCurrentPosition = function () {
        return new Promise(function (resolve, reject) {
            var posOptions = { timeout: 10000, enableHighAccuracy: true };
            $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
                var lat = position.coords.latitude.toFixed(5);
                var lng = position.coords.longitude.toFixed(5);
                resolve({ lat: lat, lng: lng });
            }, function (err) {
                reject(err);
            });
        });
    };
});
'use strict';

angular.module('sport-tracker-mobile').controller('loginController', function ($rootScope, $scope, $state, APIService, DataService) {

    $scope.events = [];

    $scope.init = function () {
        APIService.getAllEvents().then(function success(response) {
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

        APIService.login(data).then(function success(response) {
            DataService.setActiveEvent(activeEvent[0]);
            DataService.setActiveParticipant(response.data.participant);
            DataService.setSessionKey(response.data.session_key);
            $state.go('tracking');
        });
    };
});
'use strict';

angular.module('sport-tracker-mobile').controller('trackingController', function ($rootScope, $scope, $state, $interval, APIService, DataService, DeviceService) {

    $scope.event = {};
    $scope.participant = {};

    $scope.data = {
        eventActive: false,
        trackingActive: false,
        eventTime: '-'
    };

    var trackingTimer = void 0;
    var trackingTimerEnabled = false;

    var trackingLog = angular.element(document.getElementById('tracking_bottom'));

    $scope.$watch('data.eventTime', function (newTime, oldTime) {
        if (newTime.substr(0, 1) != '-') {
            $scope.data.eventActive = true;

            if ($scope.data.trackingActive && !trackingTimerEnabled) {
                trackingTimer = $interval(sendLocation, 1000); // update every 5 minutes
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

        var time = getTime();
        var msg = '<p class="info"><b>' + time + '</b> - Tracking enabled.</p>';
        trackingLog.prepend(msg);
    };

    $scope.onStopTracking = function () {
        $scope.data.trackingActive = false;
        $interval.cancel(trackingTimer);
        trackingTimerEnabled = false;

        var time = getTime();
        var msg = '<p class="info"><b>' + time + '</b> - Tracking disabled.</p>';
        trackingLog.prepend(msg);
    };

    function sendLocation() {
        var time = getTime();
        var msg = '';

        function getPosition() {
            return new Promise(function (resolve, reject) {
                DeviceService.getCurrentPosition.then(function (response) {
                    resolve(response);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        function sendToServer(position) {
            return new Promise(function (resolve, reject) {
                APIService.sendLocation.then(function (response) {
                    resolve({ response: response, position: position });
                }).catch(function (err) {
                    reject(err);
                });
            });
        }

        getPosition.then(sendToServer).then(function (_ref) {
            var response = _ref.response;
            var lat = _ref.lat;
            var lng = _ref.lng;

            msg = '<p><b>' + time + '</b> - Location sent (' + lat + ', ' + lng + ')</p>';
        }).catch(function (err) {
            console.error(err);
            msg = '<p class="error"><b>' + time + '</b> - ' + err.message + '</p>';
        }).all(function () {
            trackingLog.prepend(msg);
        });
    }

    function getTime() {
        return moment().format('DD.MM.YYYY, HH:mm:ss');
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