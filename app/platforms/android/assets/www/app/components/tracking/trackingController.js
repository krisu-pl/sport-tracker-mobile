angular.module('sport-tracker-mobile').controller('trackingController',
    function ($rootScope, $scope, $q, $state, $interval, APIService, DataService, DeviceService) {

        $scope.event = {};
        $scope.participant = {};

        $scope.data = {
            eventActive: false,
            trackingActive: false,
            eventTime: '-'
        };

        let trackingTimer;
        let trackingTimerEnabled = false;

        const trackingLog = angular.element(document.getElementById('tracking_bottom'));

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
                startOnBoot: true,
            }, function(state) {
                // This callback is executed when the plugin is ready to use.
                console.log('BackgroundGeolocation ready: ', state);
            });

            const sendToServer = (position) => {
                return $q((resolve, reject) => {
                    const data = {
                        lat: position.latitude,
                        lng: position.longitude,
                        participant_event_id: $scope.participant.id,
                        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                    };
                    APIService.sendLocation(data).then(
                        (response) => {
                            resolve({response, position});
                        },
                        (err) => {
                            reject(err);
                        });
                });
            };

            //This callback will be executed every time a geolocation is recorded in the background.
            var callbackFn = function(location, taskId) {

                const time = getTime();
                let msg = '';
                const position = location.coords;

                sendToServer(position)
                    .then(({response, position}) => {
                        msg = `<p><b>${time}</b> - Location sent (${position.latitude}, ${position.longitude})</p>`;
                        trackingLog.prepend(msg);
                    })
                    .catch((err) => {
                        console.error(err);
                        msg = `<p class="error"><b>${time}</b> - ${err.data}</p>`;
                        trackingLog.prepend(msg);
                    });

                // Must signal completion of your callbackFn.
                bgGeo.finish(taskId);
            };

            // This callback will be executed if a location-error occurs.  Eg: this will be called if user disables location-services.
            var failureFn = function(errorCode) {
                console.warn('- BackgroundGeoLocation error: ', errorCode);

                const time = getTime();
                let msg = `<p class="error"><b>${time}</b> - ${errorCode}</p>`;
                trackingLog.prepend(msg);
            };

            // Listen to location events & errors.
            bgGeo.on('location', callbackFn, failureFn);

            // Fired whenever state changes from moving->stationary or vice-versa.
            bgGeo.on('motionchange', function(isMoving) {
                console.log('- onMotionChange: ', isMoving);
            });
        });

        $scope.$watch('data.eventTime', (newTime, oldTime) => {
            if(newTime.substr(0,1) != '-') {
                $scope.data.eventActive = true;

                if($scope.data.trackingActive && !trackingTimerEnabled){
                    // sendLocation();
                    // trackingTimer = $interval(sendLocation, 10000); // update every 5 minutes
                    trackingTimerEnabled = true;
                }
            }
        });

        $scope.init = function () {
            $scope.event = DataService.getActiveEvent();
            $scope.participant = DataService.getActiveParticipant();

            if(_.isEmpty($scope.event) || _.isEmpty($scope.participant)) {
                $state.go('login');
            }

            showEventTimer();
        };



        $scope.onStartTracking = function () {
            $scope.data.trackingActive = true;

            bgGeo.start();

            const time = getTime();
            const msg = `<p class="info"><b>${time}</b> - Tracking enabled.</p>`;
            trackingLog.prepend(msg);
        };

        $scope.onStopTracking = function () {
            $scope.data.trackingActive = false;

            bgGeo.stop();

            $interval.cancel(trackingTimer);
            trackingTimerEnabled = false;

            const time = getTime();
            const msg = `<p class="info"><b>${time}</b> - Tracking disabled.</p>`;
            trackingLog.prepend(msg);
        };



        function sendLocation() {
            const time = getTime();
            let msg = '';

            const getPosition = () => {
                return $q((resolve, reject) => {
                    DeviceService.getCurrentPosition().then(
                        (response) => {
                            resolve(response);
                        },
                        (err) => {
                            reject(err);
                        });
                });
            };


            getPosition()
                .then(sendToServer)
                .then(({response, position}) => {
                    msg = `<p><b>${time}</b> - Location sent (${position.lat}, ${position.lng})</p>`;
                    trackingLog.prepend(msg);
                })
                .catch((err) => {
                    console.error(err);
                    msg = `<p class="error"><b>${time}</b> - ${err.data}</p>`;
                    trackingLog.prepend(msg);
                });
        }

        function getTime(){
            return moment().format('DD.MM.YYYY, HH:mm:ss');
        }

        /**
         * Show timer
         */
        function showEventTimer(){
            const _second = 1000;
            const _minute = _second * 60;
            const _hour = _minute * 60;

            // Get event start date from a data attribute
            const startDate = $scope.event.start_date;

            // Convert data from MySQL format to JS
            const start = new Date(startDate);

            function refreshTimer() {
                const now = new Date();

                // Calculate how much time passed since start
                const elapsedTime = now - start;

                let sign = "", hours, minutes, seconds;

                if(elapsedTime < 0) {
                    sign = "-";
                    hours = Math.ceil(elapsedTime / _hour) * -1;
                    minutes = Math.ceil((elapsedTime % _hour) / _minute) * -1;
                    seconds = Math.ceil((elapsedTime % _minute) / _second) * -1;
                }
                else {
                    hours = Math.floor(elapsedTime / _hour);
                    minutes = Math.floor((elapsedTime % _hour) / _minute);
                    seconds = Math.floor((elapsedTime % _minute) / _second);
                }
                // Format time
                $scope.data.eventTime = `${sign + formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
            }

            $interval(refreshTimer, 1000);
        }

        /**
         * Adds additional zero at the beginning if number is 1-digit.
         * @param number
         * @returns {string}
         */
        function formatNumber(number){
            return ("0" + number).slice(-2)
        }


    }
);