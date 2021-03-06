'use strict';
angular.module('Moodtracker.controllers', [])
    // DASH
    .controller('DashCtrl', function($scope, $rootScope, $firebase, $timeout, $state) {

        // $scope.minute = {
        //     num: 0
        // };
        // $scope.hour = {
        //     num: 0
        // };
        //  $scope.second = {
        //     num: 0
        // };
        // $scope.countdown = {
        //     num:0
        // }
        // $scope.$broadcast('timer-clear');



        if ($rootScope.timerRunning === true) {
            $timeout(function() {
                // console.log('countdown is ', $scope.countdown.num, 'counter started!')
                $scope.$broadcast('timer-start');
            }, 2)
        } else {
            $timeout(function() {
                // console.log('at stoptimer() countdown.num is ', $rootScope.countdown.num)
                $scope.$broadcast('timer-stop');
                $rootScope.timerRunning = false;
                $scope.$apply();
            }, 2);
        }

        // console.log('AT PAGE LOAD rootscope.timerrunning is ', $rootScope.timerRunning);
        // console.log('AT PAGE LOAD countdown.num is ', $rootScope.countdown.num);

        $scope.startTimer = function() {
            $rootScope.countdown.num = ($rootScope.minute.num * 60) + ($rootScope.hour.num * 3600) + $rootScope.second.num;

            $timeout(function() {

                $scope.$broadcast('timer-start');
                $rootScope.timerRunning = true;
            }, 0);

        };


        $scope.stopTimer = function() {
            $rootScope.countdown.num = 0;
            $timeout(function() {
                // console.log('AT STOP TRACKING countdown.num is ', $rootScope.countdown.num)
                $scope.$broadcast('timer-stop');
                $rootScope.timerRunning = false;
                $scope.$apply();
            }, 2);


        };

        $scope.$on('timer-stopped', function(event, data) {
            // console.log('Timer Stopped ');
        });

        $scope.callbackTimer = function() {
            // var element = document.querySelector('#speaker');
            // element.speak();
            // console.log('Timer finished!')
            $timeout(function() {
                $rootScope.countdown.num = ($rootScope.minute.num * 60) + ($rootScope.hour.num * 3600) + $rootScope.second.num;
                $scope.$apply();
                // console.log('AT TIMER CALLBACK countdown.num is ', $rootScope.countdown.num);
                $state.go('tab.moodentry');
            }, 0);


        }

        // TODO: FINISH LOGIN
        $scope.login = function(form) {
            $rootScope.submitted = true;

            var ref = new Firebase("https://mood-track.firebaseio.com");
            ref.authWithOAuthPopup("twitter", function(error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    $rootScope.authData = authData;
                }
            });

            // if (form.$valid) {
            //     Auth.login({
            //             email: $scope.user.email,
            //             password: $scope.user.password
            //         })
            //         .then(function() {
            //             $location.path('/');
            //         })
            //         .catch(function(err) {
            //             $scope.errors.other = err.message;
            //         });
            // }
        };
        // $scope.loginOauth = function(provider) {
        //     $window.location.href = '/auth/' + provider;
        // };



    })
    // MOOD ENTRY
    .controller('MoodEntryCtrl', function($scope, $timeout, $firebase, $state, $ionicLoading, LocationService, speak, $rootScope) {

        var sync = $firebase(new Firebase("https://mood-track.firebaseio.com/Moods"));
        $scope.data = sync.$asArray();

        // speak('How are you feeling right now?');
        $timeout(function() {
            $scope.date = {
                today: new Date().toUTCString()
            };
        }, 10);


        $scope.date = {
            today: new Date()
        };

        $scope.name = {
            text: null
        };
        $scope.scale = {
            num: 5
        };
        $scope.comment = {
            text: null
        };
        $scope.date = {
            today: null
        };
        $scope.location = {
            latLong: null
        }



        $scope.saveMood = function() {

            if ($scope.name.text === '') {
                return;
            }

            if ($rootScope.auto.checked === true) {
                // console.log('autotweet on...')
            }

            var array = $scope.date.today.split(' ');
            var date = array[1] + ' ' + array[2] + ' ' + array[3];
            var time = array[4];

            LocationService.getLatLong().then(
                function(latLong) {
                    $scope.location.latLong = latLong;

                    //Save to firebase
                    sync.$push({
                        name: $scope.name.text,
                        scale: $scope.scale.num,
                        comment: $scope.comment.text,
                        date: $scope.date.today,
                        time: time,
                        latLong: $scope.location.latLong
                    });
                    $state.go('tab.dash');
                },
                function(error) {
                    alert(error);
                })


        }
    })


// DATA CHARTS



.controller('DataCtrl', function($scope, $firebase, $ionicModal, uiGmapGoogleMapApi, $ionicLoading, $compile) {

    var sync = $firebase(new Firebase("https://mood-track.firebaseio.com/Moods"));
    $scope.rawdata = sync.$asArray();
    $scope.data = [];

    $scope.bar = false;
    $scope.line = false;

    $scope.loadBarChart = function() {

        $scope.bar = true;
        $scope.line = false;
        $scope.$evalAsync(function($scope) {

            $scope.data = $scope.rawdata.map(function(e) {

                if (e["name"] === "Happy") {
                    var color = '#F4FA58';
                } else if (e["name"] === "Sad") {
                    var color = '#81DAF5';
                } else if (e["name"] === "Stressed") {
                    var color = '#FA5858';
                } else if (e["name"] === "Neutral") {
                    var color = '#81F781';
                }

                return {
                    name: e["time"],
                    color: color,
                    date: e["date"],
                    scale: e["scale"],
                    mood: e["name"],
                    comment: e["comment"],
                    latLong: e["latLong"]
                };
            })
        });

        // var today = new Date().toUTCString();
        // // today = today.substring(0, today.indexOf('T'));
        // $scope.data = $scope.rawdata.map(function(e) {
        //     var date = new Date().toUTCString();
        //     var array = date.split(' ');
        //     var today = array[1] + ' ' + array[2] + ' ' + array[3];


        //     if (e["date"] === today) {
        //         if (e["name"] === "Happy") {
        //             var color = '#F4FA58';
        //         } else if (e["name"] === "Sad") {
        //             var color = '#81DAF5';
        //         } else if (e["name"] === "Stressed") {
        //             var color = '#FA5858';
        //         } else if (e["name"] === "Neutral") {
        //             var color = '#81F781';
        //         }

        //         return {
        //             name: e["time"],
        //             date: e["date"],
        //             scale: parseInt(e["scale"]),
        //             mood: e["name"],
        //             color: color,
        //             comment: e["comment"],
        //             latLong: e["latLong"]
        //         };
        //     }
        // })


    }

    //RETRIEVE OVERALL MOOD DATA 
    $scope.loadLineChart = function() {
        $scope.line = true;
        $scope.bar = false;
        $scope.$evalAsync(function($scope) {
            $scope.data = $scope.rawdata.map(function(e) {

                return {
                    name: e["time"],
                    date: e["date"],
                    scale: e["scale"],
                    mood: e["name"],
                    comment: e["comment"],
                    latLong: e["latLong"]
                };
            })
        });



    }

    //MODAL SETUP
    $ionicModal.fromTemplateUrl('my-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        // console.log('modal loaded')
        $scope.modal = modal;
    });
    $scope.openModal = function() {
        $scope.modal.show();
    };
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    //ONCLICK FUNCTION
    $scope.onClick = function(item) {

        $scope.$apply(function() {
            if (!$scope.showDetailPanel)
                $scope.showDetailPanel = true;
            $scope.detailMood = item.mood;
            $scope.detailDate = item.date;
            $scope.detailTime = item.name;
            $scope.detailComment = item.comment;
            $scope.lat = item.latLong["lat"];
            $scope.lon = item.latLong["long"];
            //INITIALIZE GOOGLE MAPS 
            uiGmapGoogleMapApi.then(function(maps) {
                $scope.marker = {
                    id: 0,
                    coords: {
                        latitude: $scope.lat,
                        longitude: $scope.lon
                    }
                };

                $scope.map = {
                    center: {
                        latitude: $scope.lat,
                        longitude: $scope.lon
                    },
                    zoom: 17
                };
            });
            $scope.modal.show();

        });
    };

})


//ACCOUNT CONTROLLER
.controller('AccountCtrl', function($scope, $rootScope, $timeout) {

    $scope.auto = {
        checked: false
    }

    $scope.toggleAuto = function() {
        $timeout(function() {
            $scope.auto.checked = true;
            $rootScope.auto.checked = $scope.auto.checked;
            console.log('auto is ', $scope.auto.checked, 'rootauto is ', $rootScope.auto.checked)
        }, 3);

    }



});