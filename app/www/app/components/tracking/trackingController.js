angular.module('sport-tracker-mobile').controller('trackingController',
    function ($rootScope, $scope, $state, $interval, EventService, ParticipantService, DataService) {

        $scope.event = {};
        $scope.participant = {};

        $scope.data = {
            eventActive: false,
            trackingActive: false,
            eventTime: '-'
        };

        let trackingTimer;
        let trackingTimerEnabled = false;
        
        $scope.$watch('data.eventTime', (newTime, oldTime) => {
            if(newTime.substr(0,1) != '-') {
                $scope.data.eventActive = true;

                if($scope.data.trackingActive && !trackingTimerEnabled){
                    trackingTimer = $interval(sendLocation, 1000);
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
        };

        $scope.onStopTracking = function () {
            $scope.data.trackingActive = false;
            $interval.cancel(trackingTimer);
            trackingTimerEnabled = false;
        };


        function sendLocation() {
            const time = moment().format('MMMM Do YYYY, hh:mm:ss');
            const el = document.getElementById('tracking_bottom');
            angular.element(el).prepend(`<p><b>${time}</b> - Location sent.</p>`);
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