angular.module('sport-tracker-mobile').service('ParticipantService', function ($q, $http, $rootScope) {

    this.login = function (data) {
        var d = $q.defer();

        $http({
            method: 'POST',
            url: $rootScope.endpoint + '/login',
            data: data,
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
