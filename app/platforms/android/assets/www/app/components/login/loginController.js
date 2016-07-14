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