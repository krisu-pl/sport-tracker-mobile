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
