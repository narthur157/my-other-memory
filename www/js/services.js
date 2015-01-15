var app = angular.module('todo.services', []);
app.value('FIREBASE_REF', 'burning-fire-602');
app.value('FIRE_URL', 'https://burning-fire-602.firebaseio.com');
/**
     * The Projects factory handles saving and loading projects
     * from local storage/Firebase?, and also lets us save and load the
     * last active project index. (not really doing that anymore)
     */
app.factory('Projects', function($firebase, Auth, FIRE_URL) {
    return {
        all: function() {
//             var projectString = window.localStorage.getItem('projects');
//             if(projectString) {
//                 return angular.fromJson(projectString);
//             }
//             return [];
            var uid = Auth.$getAuth().uid;
            return $firebase(new Firebase(FIRE_URL + "/Users/" + uid + "/Projects")).$asObject();
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
});
app.factory("Auth", function($firebaseAuth, FIREBASE_REF) {
  var ref = new Firebase("https://" + FIREBASE_REF + ".firebaseio.com/");
  return $firebaseAuth(ref);
});