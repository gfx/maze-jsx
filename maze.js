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
                this.setPoint(x+1, y, this.PATH);
                this.setPoint(x+2, y, this.PATH);
                return {new_x: x+2, new_y: y};
            }
            else if (d === Direction.UP && this.getPoint(x, y-2) === 0) {
                this.setPoint(x, y-1, this.PATH);
                this.setPoint(x, y-2, this.PATH);
                return {new_x: x, new_y: y-2};
            }
            if (d === Direction.LEFT && this.getPoint(x-2, y) === 0) {
                this.setPoint(x-1, y, this.PATH);
                this.setPoint(x-2, y, this.PATH);
                return {new_x: x-2, new_y: y};
            }
            if (d === Direction.DOWN && this.getPoint(x, y+2) === 0) {
                this.setPoint(x, y+1, this.PATH);
                this.setPoint(x, y+2, this.PATH);
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
        this.ctx.fillRect(this.BRICK_SZ * (x - 1), this.BRICK_SZ * (y - 1),
                          this.BRICK_SZ, this.BRICK_SZ);
    };

    this.draw = function(canvas) {
        canvas.width = this.BRICK_SZ * this.width;
        canvas.height = this.BRICK_SZ * this.height;

        if (canvas.getContext) {
            this.ctx = canvas.getContext('2d');
        }
        else {
            // ???
        }

        for (var j = 1; j <= this.height; ++j) {
            for (var i = 1; i <= this.width; ++i) {
                this.drawPoint(i, j,
                               this.getPoint(i, j) === this.BRICK ? "#000000" : "#ffffff");
            }
        }
        // Draw start and goal
        this.drawPoint(this.start.x, this.start.y, "#ff0000");
        this.drawPoint(this.goal.x, this.goal.y, "#ff0000");
    };

    // Member variables
    this.BRICK = 0;
    this.PATH = 1;
    this.BRICK_SZ = 4;
    this.width = width;
    this.height = height;
    this.start = {x: 2, y: 2};
    this.goal = {x: this.width - 1, y: this.height - 1};
    this.maze_data = new Array((this.width + 2) * (this.height + 2));

    // Initialize maze_data putting `banpei' around
    for (var j = 1; j <= this.height; ++j) {
        for (var i = 1; i <= this.width; ++i) {
            this.setPoint(i, j, this.BRICK);
        }
    }
    for (var i = 0; i < this.width + 2; ++i) {
        this.setPoint(i, 0, this.PATH);
        this.setPoint(i, this.height + 1, this.PATH);
    }
    for (var i = 0; i < this.height + 2; ++i) {
        this.setPoint(0, i, this.PATH);
        this.setPoint(this.width + 1, i, this.PATH);
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
        maze.drawPoint(v.p.x, v.p.y, "#ff0000");
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
        if (maze.getPoint(adj.nx, adj.ny) === maze.PATH) {
            ret.push(new MazeSolverNode(adj.nx, adj.ny, node));
        }
    });
    return ret;
}

function mazeSolve() {
    var visitedMap = new MazeVisitedMap(maze.width,maze.height);

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
