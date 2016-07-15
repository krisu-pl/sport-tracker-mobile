angular.module('sport-tracker-mobile').factory('DataService', function ($localStorage) {

    return {
        setActiveEvent(activeEvent) {
            $localStorage.activeEvent = activeEvent;
        },
        getActiveEvent() {
            return $localStorage.activeEvent;
        },
        setActiveParticipant(activeParticipant) {
            $localStorage.activeParticipant = activeParticipant;
        },
        getActiveParticipant() {
            return $localStorage.activeParticipant;
        },
        setSessionKey(sessionKey) {
            $localStorage.sessionKey = sessionKey;
        },
        getSessionKey() {
            return $localStorage.sessionKey;
        },
        clearData() {
            $localStorage.activeEvent = {};
            $localStorage.activeParticipant = {};
            $localStorage.sessionKey = '';
        }
    };
    
});
