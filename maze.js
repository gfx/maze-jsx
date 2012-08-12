var Direction = {
    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3,
    rot90: function(direction) {
        return (direction + 1) % 4;
    },
    getRandDirection: function() {
        return Math.floor(Math.random() * 4);
    },
};

function Maze(width, height) {
    // Member functions
    this.setPoint = function(x, y, val) {
        this.maze_data[(this.width + 2) * y + x] = val;
    };
    this.getPoint = function(x, y) {
        return this.maze_data[(this.width + 2) * y + x];
    };

    this.startPoint = function() {
        return {
            x: 2 * Math.floor(Math.random() * (this.width - 1) / 2) + 2,
            y: 2 * Math.floor(Math.random() * (this.height - 1) / 2) + 2,
        };
    };

    this.stepForward = function(x, y) {
        d =Direction.getRandDirection();
        for (var i = 0; i < 4; ++i) {
            if (d === Direction.RIGHT && this.getPoint(x+2, y) === 0) {
                this.setPoint(x+1, y, 1);
                this.setPoint(x+2, y, 1);
                return {new_x: x+2, new_y: y};
            }
            else if (d === Direction.UP && this.getPoint(x, y-2) === 0) {
                this.setPoint(x, y-1, 1);
                this.setPoint(x, y-2, 1);
                return {new_x: x, new_y: y-2};
            }
            if (d === Direction.LEFT && this.getPoint(x-2, y) === 0) {
                this.setPoint(x-1, y, 1);
                this.setPoint(x-2, y, 1);
                return {new_x: x-2, new_y: y};
            }
            if (d === Direction.DOWN && this.getPoint(x, y+2) === 0) {
                this.setPoint(x, y+1, 1);
                this.setPoint(x, y+2, 1);
                return {new_x: x, new_y: y+2};
            }
            d = Direction.rot90(d);
        }
        return undefined;
    };

    this.dig = function(x, y) {
        while (true) {
            var p = this.stepForward(x, y);
            if (!p) return;
            this.dig(p.new_x, p.new_y);
        }
    };

    this.create = function() {
        var p = this.startPoint();
        console.log(p);
        this.dig(p.x, p.y);
    };

    this.drawPoint = function(ctx, x, y, color_hex_str) {
        ctx.fillStyle = color_hex_str;
        ctx.fillRect(BRICK_SZ * (x - 1), BRICK_SZ * (y - 1),
                     BRICK_SZ, BRICK_SZ);
    };

    this.draw = function(canvas) {
        canvas.width = BRICK_SZ * this.width;
        canvas.height = BRICK_SZ * this.height;

        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');
        }
        else {
            // ???
        }

        for (var j = 1; j <= this.height; ++j) {
            for (var i = 1; i <= this.width; ++i) {
                this.drawPoint(ctx, i, j,
                               this.getPoint(i, j) === 0 ? "#000000" : "#ffffff");
            }
        }
        // Draw start and goal
        this.drawPoint(ctx, 2, 2, "#ff0000");
        this.drawPoint(ctx, this.width - 1, this.height - 1, "#ff0000");
    };

    // Member variables
    const BRICK_SZ = 4;
    this.width = width;
    this.height = height;
    this.maze_data = new Array((this.width + 2) * (this.height + 2));

    // Initialize maze_data putting `banpei' around
    for (var j = 1; j <= this.height; ++j) {
        for (var i = 1; i <= this.width; ++i) {
            this.setPoint(i, j, 0);
        }
    }
    for (var i = 0; i < this.width + 2; ++i) {
        this.setPoint(i, 0, 1);
        this.setPoint(i, this.height + 1, 1);
    }
    for (var i = 0; i < this.height + 2; ++i) {
        this.setPoint(0, i, 1);
        this.setPoint(this.width + 1, i, 1);
    }
};

function getMazeSize() {

    return {
        width: 2 * parseInt(document.getElementById("maze_width").value) + 1,
        height: 2 * parseInt(document.getElementById("maze_height").value) + 1,
    };
}

function mazeMain() {
    var size = getMazeSize();
    var maze = new Maze(size.width, size.height);
    maze.create();

    var canvas = document.getElementById('maze_canvas');
    maze.draw(canvas);
}
