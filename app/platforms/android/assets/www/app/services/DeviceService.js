angular.module('sport-tracker-mobile').service('DeviceService', 
    function ($cordovaGeolocation, $q, $http, $rootScope) {
        
    this.getCurrentPosition = function () {
        return new Promise((resolve, reject) => {
            var posOptions = {timeout: 10000, enableHighAccuracy: true};
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    const lat = position.coords.latitude.toFixed(5);
                    const lng = position.coords.longitude.toFixed(5);
                    resolve({lat, lng});
                }, function(err) {
                   reject(err);
                });
        });
    }
});