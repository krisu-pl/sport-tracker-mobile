angular.module('sport-tracker-mobile').controller('loginController',
    function ($rootScope, $scope, $state, APIService, DataService) {

        $scope.events = [];

        $scope.init = function () {
            APIService.getAllEvents().then(
                function success (response) {
                    $scope.events = response.data;
                }
            )
        };

        $scope.onLogin = () => {

            const data = {
                event_id: parseInt($scope.event_id),
                starting_number: parseInt($scope.starting_number),
                pin: parseInt($scope.pin)
            };

            const activeEvent = $scope.events.filter((element) => {
                return element.id == $scope.event_id
            });

            APIService.login(data).then(
                function success (response) {
                    DataService.setActiveEvent(activeEvent[0]);
                    DataService.setActiveParticipant(response.data.participant);
                    DataService.setSessionKey(response.data.session_key);
                    $state.go('tracking');
                }
            )
        }

    }
);