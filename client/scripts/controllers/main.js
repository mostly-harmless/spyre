spyre.controller('MainController', function($scope, $sce, WSService, WSConnect, $timeout, $location) {

    $scope.selected_env = ".GlobalEnv";
    $scope.options = {};
    $scope.options.uv_plot_type = 'density';
    $scope.spyre_server = "ws://" + $location.host() + ":7681";
    $scope.objects_tree = [];
    $scope.object_display_level = 1;
    $scope.message_list = [];
    $scope.selected_data = false; 
    $scope.data_is_selected = false; 

    $scope.toggle_connect = function() {
        if($scope.isConnected) {
            WSService.r({fun : "CLOSE", args : {}});
            $scope.isConnected = false;
            $scope.selected_env = ".GlobalEnv";
        } else {
            $scope.connect();
        }
    };

    $scope.connect = function() {

        WSConnect.connect($scope.spyre_server);

        WSService.register_ws_callback('open', function() {


            WSService.register_ws_callback('objects', function(msg) {
                console.log("Object of Objects:");
                console.log(msg);
                
                $scope.objects = msg;

                if(!$scope.data_is_selected) {
                    $scope.objects_tree = msg;
                }

                // what functions should we call here? 
                $scope.send_object($scope.selected_object, $scope.options);

                $scope.$apply();
            });
            

            WSService.register_ws_callback('actions', function(msg) {
                console.log("Actions received:");
                console.log(msg);
                
                $scope.actions = msg;
                $scope.$apply();
            });

            WSService.register_ws_callback('environments', function(msg) {
                console.log("Environments received:");
                console.log(msg);
                
                $scope.envs = msg;
                $scope.$apply();
            });


            WSService.register_ws_callback('message', function(msg) {
                console.log("Message received:");
                console.log(msg);
                $scope.add_message(msg);
                $scope.$apply();
            });


        });

        // NB: change this to run only if successful
        $scope.isConnected = true;
        $scope.$broadcast('connected');
    };

    $scope.add_message = function(msg) {
        var new_msg = { 
            time : new Date(), 
            title : msg.title,
            type : "alert " + "alert-" + msg.type,
            message : msg.message };
        
        $scope.message_list.unshift(new_msg);
    };

    $scope.selected = function(env) {
        WSService.r({fun : "set_selected_env", args : {env : env}});
        $scope.selected_env = env;
        $scope.data_is_selected = false;
    };


    $scope.object_level_down = function(object) {
        $scope.objects_tree = object.children;
        $scope.selected_data = object.label;
        $scope.add_message({title : "Spyre", type : "info", message : object.label + " is now active dataset."});
        $scope.data_is_selected = true;
    };

    $scope.object_level_up = function() {
        $scope.data_is_selected = false;
        $scope.selected(".GlobalEnv");
    };

    $scope.send_object = function(object_name, options) {
        if(object_name === undefined) {
            return(0);
        }
        var send_call = {fun :  'object_explorer_connect',
                         args : { object: object_name.data.object_index,
                                  options : options}};
        WSService.r(send_call);
        $scope.selected_object = object_name;
        return(0);
    };

    $scope.gridOptions = { data: 'objects_tree',
                           rowTemplate: '<div ng-style="{\'cursor\': row.cursor, \'z-index\': col.zIndex() }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}" ng-cell ng-click="send_object(row.entity, options)" ng-dblclick="object_level_down(row.entity)"></div>',
                           enableColumnResize : true,
                           showGroupPanel : false,
                           multiSelect : false,
                           showFilter : true,
                           enablePaging: false, 
                           selectedItems : $scope.objects_tree, 
                           showFooter: true,
                           columnDefs: [{ field: 'label', displayName: 'Object'},
                                        { field: 'class[0]', displayName: 'Class'}],
                           showColumnMenu: false};

    $scope.tt = { refresh : "Refresh object list",
                  uplevel : "Display full list of objects",
                  envlist : "Available environments",
                  actions : "Perform action on selected object"};


    //connect on start, should be an option
    $timeout(function() { 
        $scope.toggle_connect(); }, 1000);
    $timeout(function() {
        // for now, this should go with init code elsewhere though.
        // need to register callback first.
        WSService.r({fun: "fortune_cookie", args : {}});
    }, 2000);

});
