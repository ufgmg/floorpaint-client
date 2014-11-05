function Room($status, level)
    this.status = $status;
    this.level = (level.replace('$','')).split(":");
    var width_height = this.level[0].split("x");
    this.width = parseInt(width_height[0], 10);
    this.height = parseInt(width_height[1], 10);
    this.start_location = this.level[1];

    this.tiles = {};
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            this.tiles[[x,y].join(',')] = new Tile();
        }
    }

    this.obstacle_keys = [];
    var blocks = this.level[2].split(",");
    for ( var i = 0; i < blocks.length; ++i )
    {
        var obstacle = "";
        for ( var j = 0; j < blocks[i].length; ++j )
        {
            var nextChar = blocks[i].charAt(j);
            if ( nextChar != 'b' )
            {
                obstacle.concat(nextChar);
            }
        }
        var y = parseInt(obstacle, 10) % this.width;
        var x = (parseInt(obstacle, 10) - y)/this.width;
        this.obstacle_keys.push([x,y].join(',')); 
    }
