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

var randInt = function(min, max) {
    return min + Math.floor((max - min) * Math.random());
};

////////////////////
// 2D array
////////////////////
var TwoDArray = function(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Array(width * height);
};
TwoDArray.prototype.get = function(x, y) {
    return this.data[this.width * y + x];
};
TwoDArray.prototype.set = function(x, y, val) {
    this.data[this.width * y + x] = val;
};

////////////////////
// Maze
////////////////////
function Maze(width, height) {
    // Member functions
    this.startPoint = function() {
        return {
            x: 2 * randInt(this.start.x / 2, this.goal.x / 2),
            y: 2 * randInt(this.start.y / 2, this.goal.y / 2),
        };
    };

    this.stepForward = function(x, y) {
        d =Direction.getRandDirection();
        for (var i = 0; i < 4; ++i) {
            if (d === Direction.RIGHT && this.maze_map.get(x+2, y) === 0) {
                this.maze_map.set(x+1, y, this.PATH);
                this.maze_map.set(x+2, y, this.PATH);
                return {new_x: x+2, new_y: y};
            }
            else if (d === Direction.UP && this.maze_map.get(x, y-2) === 0) {
                this.maze_map.set(x, y-1, this.PATH);
                this.maze_map.set(x, y-2, this.PATH);
                return {new_x: x, new_y: y-2};
            }
            if (d === Direction.LEFT && this.maze_map.get(x-2, y) === 0) {
                this.maze_map.set(x-1, y, this.PATH);
                this.maze_map.set(x-2, y, this.PATH);
                return {new_x: x-2, new_y: y};
            }
            if (d === Direction.DOWN && this.maze_map.get(x, y+2) === 0) {
                this.maze_map.set(x, y+1, this.PATH);
                this.maze_map.set(x, y+2, this.PATH);
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
        this.dig(p.x, p.y);
    };

    this.drawPoint = function(x, y, color_hex_str) {
        this.ctx.fillStyle = color_hex_str;
        this.ctx.fillRect(this.BRICK_SZ * x, this.BRICK_SZ * y,
                          this.BRICK_SZ, this.BRICK_SZ);
    };

    this.draw = function(canvas) {
        canvas.width = this.BRICK_SZ * (this.maze_map.width - 2);
        canvas.height = this.BRICK_SZ * (this.maze_map.height - 2);

        if (canvas.getContext) {
            this.ctx = canvas.getContext('2d');
        }
        else {
            // ???
        }

        for (var j = 1; j <= this.maze_map.height - 2; ++j) {
            for (var i = 1; i <= this.maze_map.width - 2; ++i) {
                this.drawPoint(i - 1, j - 1,
                               this.maze_map.get(i, j) === this.BRICK ? "#000000" : "#ffffff");
            }
        }
        // Draw start and goal
        this.drawPoint(this.start.x - 1, this.start.y - 1, "#ff0000");
        this.drawPoint(this.goal.x - 1, this.goal.y - 1, "#ff0000");
    };

    // Member variables
    this.BRICK = 0;
    this.PATH = 1;
    this.BRICK_SZ = 4;
    this.maze_map = new TwoDArray(width + 2, height + 2);
    this.start = {x: 2, y: 2};
    this.goal = {x: this.maze_map.width - 3, y: this.maze_map.height - 3};
    // this.maze_data = new Array((this.width + 2) * (this.height + 2));

    // Initialize maze_data putting `banpei' around
    for (var j = 1; j < this.maze_map.height; ++j) {
        for (var i = 1; i < this.maze_map.width; ++i) {
            this.maze_map.set(i, j, this.BRICK);
        }
    }
    for (var i = 0; i < this.maze_map.width; ++i) {
        this.maze_map.set(i, 0, this.PATH);
        this.maze_map.set(i, this.maze_map.height - 1, this.PATH);
    }
    for (var j = 0; j < this.maze_map.height; ++j) {
        this.maze_map.set(0, j, this.PATH);
        this.maze_map.set(this.maze_map.width - 1, j, this.PATH);
    }
};

function getMazeSize() {
    return {
        width: 2 * parseInt(document.getElementById("maze_width").value) + 1,
        height: 2 * parseInt(document.getElementById("maze_height").value) + 1,
    };
}

function mazeCreate() {
    var size = getMazeSize();
    maze = new Maze(size.width, size.height);  // Globalized for solver
    maze.create();

    var canvas = document.getElementById('maze_canvas');
    maze.draw(canvas);
}

////////////////////////
// Solver
////////////////////////

// Queue (FIFO)
function Queue() {
    this.__a = new Array();
};
Queue.prototype.enq = function(o) {
    this.__a.push(o);
};
Queue.prototype.deq = function() {
    if( this.__a.length > 0) {
        return this.__a.shift();
    }
    return null;
};
Queue.prototype.size = function() {
    return this.__a.length;
};
Queue.prototype.toString = function() {
    return '[' + this.__a.join(',') + ']';
};


function MazeSolverNode(x, y, prevNode) {
    this.p = {x: x, y: y};
    this.prevNode = prevNode;
}

function MazeVisitedMap(width, height) {
    this.visit = function(x, y) {
        this.visited_data[this.width * y + x] = true;
    };
    this.isVisited = function(x, y) {
        return this.visited_data[this.width * y + x];
    }

    this.width = width;
    this.height = height;
    this.visited_data = new Array(this.width * this.height);
}

function drawStartGoalPath(goalNode) {
    var v = goalNode;
    while (v.prevNode) {
        maze.drawPoint(v.p.x - 1, v.p.y - 1, "#ff0000");
        v = v.prevNode;
    }
}

function getAdjandantNodes(node) {
    var ret = new Array();
    var adjs = [
        {nx: node.p.x+1, ny: node.p.y},
        {nx: node.p.x, ny: node.p.y-1},
        {nx: node.p.x-1, ny: node.p.y},
        {nx: node.p.x, ny: node.p.y+1},
    ];
    adjs.forEach(function(adj) {
        if (maze.maze_map.get(adj.nx, adj.ny) === maze.PATH) {
            ret.push(new MazeSolverNode(adj.nx, adj.ny, node));
        }
    });
    return ret;
}

function mazeSolve() {
    var visitedMap = new MazeVisitedMap(maze.maze_map.width, maze.maze_map.height);

    var q = new Queue(); // Queue for storing to-be-visited nodes

    q.enq(new MazeSolverNode(maze.start.x, maze.start.y,
                             undefined));
    visitedMap.visit(maze.start.x, maze.start.y);

    // Find the shortest path to goal
    while (true) {
        // Feed all nodes in queue
        var visiting;
        while (visiting = q.deq()) {
            // Found goal
            if (visiting.p.x === maze.goal.x && visiting.p.y === maze.goal.y) {
                drawStartGoalPath(visiting);
                return;
            }

            // Add adjandant unvisited nodes to queue
            var adjNodes = getAdjandantNodes(visiting);
            adjNodes.forEach(function(adjNode) {
                // console.log(adjNode);
                if (!visitedMap.isVisited(adjNode.p.x, adjNode.p.y)) {
                    visitedMap.visit(adjNode.p.x, adjNode.p.y);
                    q.enq(adjNode);
                }
            });
        }
    }
}
