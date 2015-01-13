angular.module('todo', ['ionic','firebase'])
    /**
     * The Projects factory handles saving and loading projects
     * from local storage, and also lets us save and load the
     * last active project index.
     */
    .factory('Projects', function() {
      return {
        all: function() {
          var projectString = window.localStorage.getItem('projects');
          if(projectString) {
            return angular.fromJson(projectString);
          }
          return [];
        },
        save: function(projects) {
          window.localStorage.setItem('projects', angular.toJson(projects));
          console.log(window.localStorage);
        },
        newProject: function(projectTitle) {
          // Add a new project
          return {
            title: projectTitle,
            tasks: []
          };
        },
        getLastActiveIndex: function() {
          return parseInt(window.localStorage.getItem('lastActiveProject')) || 0;
        },
        setLastActiveIndex: function(index) {
          window.localStorage.setItem('lastActiveProject', index);
        }
      }
    })
      // GOD CONTROLLER
      .controller('TodoCtrl', function($scope, $firebase, $timeout, Modal, Projects) {
    
            $scope.projectsList = {};
            $scope.user = {};
            // Load or initialize projects
            var refUrl = "https://burning-fire-602.firebaseio.com"
            var myRef = new Firebase(refUrl);
            $scope.projectsList = null;
            $scope.user = null;
            $scope.notifications = null;
            // really, authentication should occur in a service. Will research that later
            $scope.authClient = new FirebaseSimpleLogin(myRef, function(error, user) {
                if (error) {
                    // an error occurred while attempting login
                    console.log(error);
                  } else if (user) {
                    $scope.user = user;  
                    $scope.$apply();
                    var userRef = new Firebase(refUrl + "/Users/" + user.uid);
                    userRef.once('value', function(userSnapshot) {
                        if (userSnapshot.val() === null) {
                            userRef.child('email').set(user.email);
                        }
                    });
                    $scope.projectsList = $firebase(new Firebase(refUrl + "/Users/" + user.uid + "/Projects")).$asObject();
                    $scope.notifications = $firebase(new Firebase(refUrl + "/Users/" + user.uid + "/Notifications")).$asObject();
                    // load projects list stuff
                    $scope.projectsList.$loaded().then(function() {
                        console.log($scope.projectsList);
                        window.projectsList = $scope.projectsList;
                    });
                    $scope.projectsList.$loaded().then(function () {
                        console.log($scope.user);
                        window.user = $scope.user;
                    });
                  } else {
                    // user is logged out
                  }
            });
//             var authRef = new Firebase(refUrl + "/.info/authenticated");
//             authRef.on("value", function(snap) {
//                 if (snap.val() === true) {
//                     alert("authenticated");
//                 } else {
//                     alert("not authenticated");
//                 }
//             });
            $scope.login = function() {
                $scope.authClient.login('google');  
            };
          
            $scope.logout = function() {
                $scope.authClient.logout();    
                $scope.user = null;
                window.cookies.clear(function() {
                    console.log("Cookies cleared!");
                });
            };      
          
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
                $scope.projectsList[projectTitle].name = projectTitle;
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
                $scope.user.lastproject = project;
                $scope.sideMenuController.close();
            };
    
            // Create our modals
            Modal.fromTemplateUrl('new-task.html', function(modal) {
                $scope.taskModal = modal;
            }, {
                scope: $scope
            });
            Modal.fromTemplateUrl('notifications.html', function(modal) {
                $scope.notificationModal = modal;
            }, {
                scope: $scope
            });
            $scope.createTask = function(task) {
                if(!$scope.user.lastproject) {
                    return;
                }
                task.done = false;
                var name = $scope.user.lastproject;
                $scope.projectsList[name].push(task);
                $scope.projectsList.$save(name);
                $scope.taskModal.hide();
    
                task.title = "";
            };
            
            $scope.newTask = function() {
                $scope.taskModal.show();
            };
    
            $scope.closeNewTask = function() {
                $scope.taskModal.hide();
            }
    
            $scope.toggleProjects = function() {
                $scope.sideMenuController.toggleLeft();
            };    
            
            $scope.taskDone = function(task) {
                console.log(task);
                console.log(projectsList[$scope.user.lastproject]);
                task.done = true;
                $scope.projectsList.$save($scope.user.lastproject);
            };
              
            $scope.openNotifications = function() {
                $scope.notificationModal.show();
            };
          
            $scope.closeNotifications = function() {
                $scope.notificationModal.hide();
            };
          
            $scope.getProject = function(projectName, userId) {
                myRef.child('Users').child(userId).child('Projects').child(projectName).once('value', function(snap) {
                    var proj = snap.val();  
                    createProject(projectName);
                    angular.forEach(proj, function(value, key) {
                       $scope.createTask(value); 
                    });
                });
            };
          
            $scope.sendNotification = function(proj, projName, email) {
                // have to iterate through users to find which one has this e-mail. not very scalable, but scale would be a great problem to have
                console.log(proj);
                console.log(email);
                console.log(projName);
                myRef.child('Users').once('value', function(snap) {
                    angular.forEach(snap.val(), function(value, key) {
                        console.log(key);
                        if (value.email == email) {
                            myRef.child('Users').child(key).child('Notifications').child(projName).set({
                                text: projName,
                                id: projName,
                                uid: user.uid
                            });
                        } 
                    });
                });  
            };
    });