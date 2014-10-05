(function () {
    var TILE_SIZE = 23;
    var TILE_PAD = 2;
    var BLACK = '#2e3436';
    var BLUE = '#136796';
    var GREEN = '#4e9a06';
    var ORANGE = '#ce5c00';
    var LIGHTER_ORANGE = '#f57900';
    var RED = '#a40000';

    function Tile() {
        this.state = 0;
    }
    Tile.prototype = {
        activate: function() {
            if (this.state == 0) {
                this.state = 1;
                return true;
            }
            return false;
        },
        block: function() {
            if (this.state == 0) {
                this.state = 2;
                return true;
            }
            return false;
        },
        deactivate: function() {
            if (this.state == 1) {
                this.state = 0;
                return true;
            }
            return false;
        },
        getColor: function() {
            return [GREEN, ORANGE, BLACK][this.state];
        },
    }

    function Room($status, size, start_location, obstacles) {
        this.$status = $status;
        this.width = size[0];
        this.height = size[1];
        if (obstacles == -1) {
            max_obstacles = Math.floor(this.width * this.height / 32);
            obstacles = 1 + Math.floor(Math.random() * max_obstacles);
        }
        this.active_tiles = 0;
        this.active_tiles_max = this.width * this.height - obstacles;

        var solvable;
        do {
            // Create tiles
            this.tiles = {};
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    this.tiles[[x,y].join(',')] = new Tile();
                }
            }

            // Create obstacles
            this.obstacle_keys = [];
            var remaining_obstacles = obstacles;
            while (remaining_obstacles > 0) {
                var location = [
                    Math.floor(Math.random() * this.width),
                    Math.floor(Math.random() * this.height),
                ];
                if (location[0] != start_location[0] ||
                        location[1] != start_location[1]) {
                    var blocked = this.tiles[location.join(',')].block();
                    if (blocked) {
                        this.obstacle_keys.push(location.join(','));
                        remaining_obstacles--;
                    }
                }
            }

            solvable = hasQuickSolution(this, start_location);
            if (solvable == true) {
                $status.text("solution known");
            }
        }
        while (!(solvable == true || solvable == -1));
    }
    Room.prototype = {
        activate: function(location) {
            key = location.join(',');
            var activated = this.tiles[key] && this.tiles[key].activate();
            if (activated) {
                this.active_tiles++;
            }
            return activated;
        },
        deactivate: function(location) {
            var deactivated = this.tiles[location.join(',')].deactivate();
            if (deactivated) {
                this.active_tiles--;
            }
            return deactivated;
        },
        isComplete: function() {
            return (this.active_tiles == this.active_tiles_max);
        },
        reset: function() {
            for (var key in this.tiles) {
                this.tiles[key].deactivate();
            }
            this.active_tiles = 0;
        },
        draw: function(context) {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    context.fillStyle = this.tiles[[x,y].join(',')].getColor();
                    context.fillRect(x * (TILE_SIZE + TILE_PAD),
                                     y * (TILE_SIZE + TILE_PAD),
                                     TILE_SIZE, TILE_SIZE);
                }
            }
            if (this.isComplete()) {
                this.$status.text('you win!');
            }
        },
    }

    function Player(room, start_location, context) {
        this.room = room;
        this.start_location = start_location;
        this.context = context;
        this.location = start_location;
        this.move([0,0]);
    }
    Player.prototype = {
        draw: function(context) {
            this.room.draw(context);
            var x = this.location[0], y = this.location[1];
            context.fillStyle = LIGHTER_ORANGE;
            context.fillRect(x * (TILE_SIZE + TILE_PAD),
                             y * (TILE_SIZE + TILE_PAD),
                             TILE_SIZE, TILE_SIZE);
        },
        move: function(direction) {
            var dx = direction[0], dy = direction[1];
            var new_location = [this.location[0] + dx,
                                this.location[1] + dy];
            var activated = this.room.activate(new_location);
            if (activated) {
                this.location = new_location;
            }
            this.draw(this.context);
            return activated;
        },
        reset: function() {
            this.room.reset();
            this.location = this.start_location;
            this.move([0,0]);
            this.draw(this.context);
        },
    }

    function handleKey(ev, player) {
        var direction;
        switch (ev.keyCode) {
            case 37: // left
                direction = [-1,0];
                break;
            case 38: // up
                direction = [0,-1];
                break;
            case 39: // right
                direction = [1,0];
                break;
            case 40: // down
                direction = [0,1];
                break;
        }
        if (direction) {
            player.move(direction);
        }
        return true;
    }

    function hasSolution(room, location) {
        var activated = room.activate(location);
        if (!activated) {
            return false;
        }
        if (room.isComplete()) {
            return true;
        }
        var x = location[0], y = location[1];
        result = (hasSolution(room, [x+1,y]) ||
                  hasSolution(room, [x-1,y]) ||
                  hasSolution(room, [x,y+1]) ||
                  hasSolution(room, [x,y-1]));
        if (!result) {
            room.deactivate(location);
        }
        return result;
    }

    function hasQuickSolution(room, start_location) {
        if (room.obstacle_keys.length == 1) {
            obstacle_key = room.obstacle_keys[0].split(',');
            obstaclex = parseInt(obstacle_key[0]);
            obstacley = parseInt(obstacle_key[1]);
            var odd_placement = (Math.abs((obstaclex - start_location[0]) % 2) !=
                                 Math.abs((obstacley - start_location[1]) % 2));
            //return ((room.width + room.height) % 2 == 1) ? odd_placement : !odd_placement;
            return odd_placement;
        }
        return -1;
    }

    Zepto(function ($) {
        // Get settings from the query string
        var params = {};
        if (window.location.search) {
            var parameters = window.location.search.substring(1).split('&');
            for (var i=0; i < parameters.length; i++) {
                var s = parameters[i].split('=');
                if (s.length != 2)
                    continue;
                params[s[0]] = s[1];
            }
        }

        // Parse settings
        var pwidth = parseInt(params['width']);
        var pheight = parseInt(params['height']);
        var pstartx = parseInt(params['startx']);
        var pstarty = parseInt(params['starty']);
        var pobstacles = parseInt(params['obstacles']);
        var width = !isNaN(pwidth) ? pwidth : 6;
        var height = !isNaN(pheight) ? pheight : 6;
        var startx = !isNaN(pstartx) ? pstartx : 0;
        var starty = !isNaN(pstarty) ? pstarty : 0;
        var start_location = [startx,starty];
        var obstacles = !isNaN(pobstacles) ? pobstacles : -1;

        $('#game')[0].width = width * (TILE_SIZE + TILE_PAD) - TILE_PAD;
        $('#game')[0].height = height * (TILE_SIZE + TILE_PAD) - TILE_PAD;

        // Generate a level and set callbacks
        var $document = $(document)
        var $status = $('#status');
        var context = $('#game')[0].getContext('2d');
        var room = new Room($status, [width,height], start_location, obstacles);
        var player = new Player(room, start_location, context);
        var handleKeyCallback = function(ev) {
            handleKey(ev, player);
        };
        $('#reset').click(function() {
            player.reset();
            $status.text(" "); // That's a non-breaking space there
        });
        $('#check').click(function() {
            $status.text("checking...");
            $document.unbind('keydown');
            room.reset();
            var solution = hasSolution(player.room, [startx,starty]);
            $status.text(solution ? "yup, there's a solution!" : "no solution.");
            player.reset();
            $document.keydown(handleKeyCallback);
        });
        $document.keydown(handleKeyCallback);
    });
})();
