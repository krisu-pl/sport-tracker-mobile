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

    function sendRequest(method, endpoint, data = null) {
        if(method == "post") {
            return $q((resolve, reject) => {
                cordovaHTTP.post($rootScope.endpoint + endpoint, {
                        data,
                        withCredentials: true
                    },
                    (response) => {
                        resolve(response);
                    },
                    (err) => {
                        reject(err);
                    })
            });
        }
        else if(method == "get"){
            return $q((resolve, reject) => {
                cordovaHTTP.get($rootScope.endpoint + endpoint, {
                        data,
                        withCredentials: true
                    },
                    (response) => {
                        resolve(response);
                    },
                    (err) => {
                        reject(err);
                    })
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
    }
});
