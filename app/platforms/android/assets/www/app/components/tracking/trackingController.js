angular.module('sport-tracker-mobile').controller('trackingController',
    function ($rootScope, $scope, $state, $interval, APIService, DataService, DeviceService) {

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
        
        $scope.$watch('data.eventTime', (newTime, oldTime) => {
            if(newTime.substr(0,1) != '-') {
                $scope.data.eventActive = true;

                if($scope.data.trackingActive && !trackingTimerEnabled){
                    trackingTimer = $interval(sendLocation, 1000); // update every 5 minutes
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

            const time = getTime();
            const msg = `<p class="info"><b>${time}</b> - Tracking enabled.</p>`;
            trackingLog.prepend(msg);
        };

        $scope.onStopTracking = function () {
            $scope.data.trackingActive = false;
            $interval.cancel(trackingTimer);
            trackingTimerEnabled = false;

            const time = getTime();
            const msg = `<p class="info"><b>${time}</b> - Tracking disabled.</p>`;
            trackingLog.prepend(msg);
        };


        function sendLocation() {
            const time = getTime();
            let msg = '';

            function getPosition(){
                return new Promise((resolve, reject) => {
                    DeviceService.getCurrentPosition
                        .then((response) => {
                            resolve(response);
                        })
                        .catch((err) => {
                            reject(err);
                        })
                });
            }

            function sendToServer(position){
                return new Promise((resolve, reject) => {
                    APIService.sendLocation
                        .then((response) => {
                            resolve({response, position});
                        })
                        .catch((err) => {
                            reject(err);
                        })
                });
            }

            getPosition
                .then(sendToServer)
                .then(({response, lat, lng}) => {
                    msg = `<p><b>${time}</b> - Location sent (${lat}, ${lng})</p>`;
                })
                .catch((err) => {
                    console.error(err);
                    msg = `<p class="error"><b>${time}</b> - ${err.message}</p>`;
                })
                .all(() => {
                    trackingLog.prepend(msg);
                })
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