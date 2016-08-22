'use strict';

(function () {
    'use-strict';

    var app = angular.module('sport-tracker-mobile', ['ngCordova', 'ngStorage', 'ui.router', 'cordovaHTTP']);

    app.run(function ($rootScope) {
        $rootScope.endpoint = 'http://178.62.21.70:3001/api/mobile';
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

angular.module('sport-tracker-mobile').service('APIService', function ($q, $http, $rootScope, cordovaHTTP) {

    // function sendRequest(method, endpoint, data = null){
    //     return $q((resolve, reject) => {
    //         $http({
    //             method,
    //             url: $rootScope.endpoint + endpoint,
    //             data,
    //             withCredentials: true
    //         }).then(
    //             (response) => {
    //                 resolve(response);
    //             },
    //             (err) => {
    //                 reject(err);
    //             }
    //         );
    //     });
    // }

    function sendRequest(method, endpoint) {
        var data = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        if (method == "post") {
            return $q(function (resolve, reject) {
                cordovaHTTP.post($rootScope.endpoint + endpoint, {
                    data: data,
                    withCredentials: true
                }, function (response) {
                    resolve(response);
                }, function (err) {
                    reject(err);
                });
            });
        } else if (method == "get") {
            return $q(function (resolve, reject) {
                cordovaHTTP.get($rootScope.endpoint + endpoint, {
                    data: data,
                    withCredentials: true
                }, function (response) {
                    resolve(response);
                }, function (err) {
                    reject(err);
                });
            });
        }
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
        return $q(function (resolve, reject) {
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

angular.module('sport-tracker-mobile').controller('trackingController', function ($rootScope, $scope, $q, $state, $interval, APIService, DataService, DeviceService) {

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

    var bgGeo;

    document.addEventListener("deviceready", function () {
        bgGeo = window.BackgroundGeolocation;

        bgGeo.configure({
            // Geolocation config
            desiredAccuracy: 0,
            distanceFilter: 10,
            stationaryRadius: 50,
            locationUpdateInterval: 1000,
            fastestLocationUpdateInterval: 5000,
            pausesLocationUpdatesAutomatically: false,

            // Activity Recognition config
            activityType: 'AutomotiveNavigation',
            activityRecognitionInterval: 5000,
            stopTimeout: 5,

            // Application config
            debug: true,
            stopOnTerminate: false,
            startOnBoot: true
        }, function (state) {
            // This callback is executed when the plugin is ready to use.
            console.log('BackgroundGeolocation ready: ', state);
        });

        var sendToServer = function sendToServer(position) {
            return $q(function (resolve, reject) {
                var data = {
                    lat: position.latitude,
                    lng: position.longitude,
                    participant_event_id: $scope.participant.id,
                    timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                };
                APIService.sendLocation(data).then(function (response) {
                    resolve({ response: response, position: position });
                }, function (err) {
                    reject(err);
                });
            });
        };

        //This callback will be executed every time a geolocation is recorded in the background.
        var callbackFn = function callbackFn(location, taskId) {

            var time = getTime();
            var msg = '';
            var position = location.coords;

            sendToServer(position).then(function (_ref) {
                var response = _ref.response;
                var position = _ref.position;

                msg = '<p><b>' + time + '</b> - Location sent (' + position.latitude + ', ' + position.longitude + ')</p>';
                trackingLog.prepend(msg);
            }).catch(function (err) {
                console.error(err);
                msg = '<p class="error"><b>' + time + '</b> - ' + err.data + '</p>';
                trackingLog.prepend(msg);
            });

            // Must signal completion of your callbackFn.
            bgGeo.finish(taskId);
        };

        // This callback will be executed if a location-error occurs.  Eg: this will be called if user disables location-services.
        var failureFn = function failureFn(errorCode) {
            console.warn('- BackgroundGeoLocation error: ', errorCode);

            var time = getTime();
            var msg = '<p class="error"><b>' + time + '</b> - ' + errorCode + '</p>';
            trackingLog.prepend(msg);
        };

        // Listen to location events & errors.
        bgGeo.on('location', callbackFn, failureFn);

        // Fired whenever state changes from moving->stationary or vice-versa.
        bgGeo.on('motionchange', function (isMoving) {
            console.log('- onMotionChange: ', isMoving);
        });
    });

    $scope.$watch('data.eventTime', function (newTime, oldTime) {
        if (newTime.substr(0, 1) != '-') {
            $scope.data.eventActive = true;

            if ($scope.data.trackingActive && !trackingTimerEnabled) {
                // sendLocation();
                // trackingTimer = $interval(sendLocation, 10000); // update every 5 minutes
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

        bgGeo.start();

        var time = getTime();
        var msg = '<p class="info"><b>' + time + '</b> - Tracking enabled.</p>';
        trackingLog.prepend(msg);
    };

    $scope.onStopTracking = function () {
        $scope.data.trackingActive = false;

        bgGeo.stop();

        $interval.cancel(trackingTimer);
        trackingTimerEnabled = false;

        var time = getTime();
        var msg = '<p class="info"><b>' + time + '</b> - Tracking disabled.</p>';
        trackingLog.prepend(msg);
    };

    function sendLocation() {
        var time = getTime();
        var msg = '';

        var getPosition = function getPosition() {
            return $q(function (resolve, reject) {
                DeviceService.getCurrentPosition().then(function (response) {
                    resolve(response);
                }, function (err) {
                    reject(err);
                });
            });
        };

        getPosition().then(sendToServer).then(function (_ref2) {
            var response = _ref2.response;
            var position = _ref2.position;

            msg = '<p><b>' + time + '</b> - Location sent (' + position.lat + ', ' + position.lng + ')</p>';
            trackingLog.prepend(msg);
        }).catch(function (err) {
            console.error(err);
            msg = '<p class="error"><b>' + time + '</b> - ' + err.data + '</p>';
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