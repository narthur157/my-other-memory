var app = angular.module('todo', ['ionic','firebase','todo.services','todo.controllers']);

app.run(function($rootScope, $state, $ionicPlatform) {
    $ionicPlatform.ready(function() {
        
        $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the login page
            if (error === "AUTH_REQUIRED") {
                $state.go("login");
            }
        });
        
        $state.go("login");
    });
});
app.config(["$stateProvider", function ($stateProvider) {
    $stateProvider
    .state("login", {
        url: "/login",
        controller: "LoginController",
        templateUrl: "views/login.html",
    })
    .state("todo", {
        url: "/todo",
        controller: "TodoController",
        templateUrl: "views/todo.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            "currentAuth": ["Auth", function(Auth) {
                // $requireAuth returns a promise so the resolve waits for it to complete
                // If the promise is rejected, it will throw a $stateChangeError (see above)
                return Auth.$requireAuth();
            }]
        }
    });
}]);

