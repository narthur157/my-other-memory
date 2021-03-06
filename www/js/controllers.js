var app = angular.module('todo.controllers', []);
app.controller('TodoController', function($scope, $firebase, $firebaseAuth, $timeout, $ionicModal, $ionicSideMenuDelegate, Projects, FIREBASE_REF, FIRE_URL, Auth, Notifications) {
    $scope.notifications = Notifications.all();
    $scope.projectsList = Projects.all();
    $scope.lastproject = null;
    $scope.taskModalInput = {};
    $scope.getLastIncTask = function(project) {
        // sanity check
        if (project.length < 1) return null;

        // return the last incomplete task
        for (var i = project.length - 1; i >= 0; i--) {
            if (!project[i].done) return project[i];
        } 
        // all projects are completed
        return null;
    }

    // A utility function for creating a new project
    // with the given projectTitle
    var createProject = function(projectTitle) {
        $scope.projectsList[projectTitle] = [];
        //$scope.projectsList[projectTitle].name = projectTitle;
        $scope.projectsList.$save(projectTitle);
        $scope.selectProject(projectTitle);
    }

    // Called to create a new project
    $scope.newProject = function() {
        var projectTitle = prompt('Project name');
        if(projectTitle) {
            createProject(projectTitle);
        }
    };

    // Called to select the given project
    $scope.selectProject = function(project) {
        $scope.lastproject = project;
        $scope.toggleProjects();
    };
    $scope.logout = function() {
        Auth.$unauth();
    }

    $scope.createTask = function(task) {
        if(!$scope.lastproject) {
            return;
        }
        
        task.done = false;
        var name = $scope.lastproject;
        $scope.projectsList[name].push(task);
        $scope.projectsList.$save();
        $scope.closeNewTask();
    };

    $scope.newTask = function() {
        // Create our modals
        $ionicModal.fromTemplateUrl('new-task.html', function(modal) {
            $scope.taskModal = modal;
            $scope.taskModal.show();
        }, {
            scope: $scope
        });
    };

    $scope.closeNewTask = function() {
        $scope.taskModalInput = {};
        $scope.taskModal.hide();
        $scope.taskModal.remove();
    };
    $scope.deleteProject = function(name, project) {
        console.log(name);
        console.log(project);
        console.log($scope.projectsList[name]);
        delete $scope.projectsList[name];
        $scope.projectsList.$save();
    };
    $scope.toggleProjects = function() {
        $ionicSideMenuDelegate.toggleLeft();
    };    

    $scope.taskToggle = function(task) {
        console.log(task);
        console.log($scope.projectsList[$scope.lastproject]);
        $scope.projectsList.$save($scope.lastproject);
    };

    $scope.openNotifications = function() {
        $ionicModal.fromTemplateUrl('notifications.html', function(modal) {
            $scope.notificationModal = modal;
                    $scope.notificationModal.show();
        }, {
            scope: $scope
        });
    };

    $scope.closeNotifications = function() {
        $scope.notificationModal.hide();
        $scope.notificationModal.remove();
    };

    $scope.getProject = function(projectName, userId) {
        delete $scope.notifications[projectName];
        $scope.notifications.$save();
        var ref = new Firebase(FIRE_URL);
        console.log(projectName);
        console.log(userId);
        ref.child('Users').child(userId).child('Projects').child(projectName).once('value', function(snap) {
            var proj = snap.val();  
           
            createProject(projectName);
            snap.forEach(function(childSnapshot) {
                // key will be "fred" the first time and "wilma" the second time
                var key = childSnapshot.key();
                // childData will be the actual contents of the child
                var value = childSnapshot.val();
                $scope.createTask(value); 
            });
        });
    };

    $scope.sendNotification = function(proj, projName, email) {
        // have to iterate through users to find which one has this e-mail. not very scalable, but scale would be a great problem to have
        if (email === null) email = prompt('E-mail to share this project with?');
        console.log(proj);
        console.log(email);
        console.log(projName);
        var ref = new Firebase(FIRE_URL);
        ref.child('Users').once('value', function(snap) {
            snap.forEach(function(childSnapshot) {
                var key = childSnapshot.key();
                var value = childSnapshot.val();
                if (value.email == email) {
                    ref.child('Users').child(key).child('Notifications').child(projName).set({
                        text: projName,
                        id: projName,
                        uid: Auth.$getAuth().uid
                    });
                } 
            });
        });  
    };
});
app.controller('LoginController', function($scope, $firebase, $timeout, $state, Projects, FIREBASE_REF, Auth) {
    $scope.auth = Auth;
    $scope.user = $scope.auth.$getAuth();
    $scope.login = function() {
        $scope.auth.$authWithOAuthPopup("google", {
            scope: 'email'
        }).then(function(authData) {
            console.log("Logged in as:", authData.uid);
            console.log("$scope.user:", $scope.user);
            //$scope.$apply();
        }).catch(function(error) {
            console.error("Authentication failed:", error);
        });
    };
    $scope.logout = function() {
        Auth.$unauth();
        $scope.user=null;
    }
    $scope.auth.$onAuth(function(authData) {
        $scope.user=authData;
        if (authData) {
            $state.go('todo');
            console.log("Logged in as:", authData.uid);
        } else {
            console.log("Logged out");
            $state.go("login");
        }
    });
    //     $scope.projectsList = {};
    //     $scope.user = {};
    //     // Load or initialize projects
    //     var refUrl = "https://burning-fire-602.firebaseio.com"
    //     var myRef = new Firebase(refUrl);
    //     $scope.projectsList = null;
    //     $scope.user = null;
    //     $scope.notifications = null;

    //     $scope.login = function() {
    //         myRef.authWithOAuthRedirect("google", function(error, user) {
    //             if (error) {
    //                 console.log("Login Failed!", error);
    //             } else {
    //                 console.log("Authenticated successfully with payload:", user);
    //                 $scope.user = user;  
    //                 $scope.user.email=user.google.email;
    //                 $scope.$apply();
    //                 var userRef = new Firebase(refUrl + "/Users/" + user.uid);
    //                 userRef.once('value', function(userSnapshot) {
    //                     if (userSnapshot.val() === null) {
    //                         userRef.child('email').set($scope.user.email);
    //                     }
    //                 });
    //                 $scope.projectsList = $firebase(new Firebase(refUrl + "/Users/" + user.uid + "/Projects")).$asObject();
    //                 $scope.notifications = $firebase(new Firebase(refUrl + "/Users/" + user.uid + "/Notifications")).$asObject();
    //                 // load projects list stuff
    //                 $scope.projectsList.$loaded().then(function() {
    //                     console.log($scope.projectsList);
    //                     window.projectsList = $scope.projectsList;
    //                 });
    //                 $scope.projectsList.$loaded().then(function () {
    //                     console.log($scope.user);
    //                     window.user = $scope.user;
    //                 });
    //             }
    //         }, {
    //             scope: 'email'
    //         });
    //     };

    //     $scope.logout = function() {
    //         myRef.unauth();
    //         $scope.user = null;
    //         window.cookies.clear(function() {
    //             console.log("Cookies cleared!");
    //         });
    //     };      
});