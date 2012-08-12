///////////////////////////////////
// Constants
///////////////////////////////////
const BRICK_SZ = 4;


///////////////////////////////////
// Utility objects
///////////////////////////////////
var randInt = function(min, max) {
    return min + Math.floor((max - min) * Math.random());
};

var MazeElem = {
    BRICK: 0,
    PATH: 1,
    SHORTEST_PATH: 2,
};
var MazeColorMap = {};
MazeColorMap[MazeElem.BRICK] = "#000000";
MazeColorMap[MazeElem.PATH] = "#FFFFFF";
MazeColorMap[MazeElem.SHORTEST_PATH] = "#FF0000";

var Direction = {
    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3,
    rot90: function(direction) {
        return (direction + 1) % 4;
    },
    getRandDirection: function() {
        return randInt(0, 3);
    },
};


///////////////////////////////////
// Class objects
///////////////////////////////////

// 2D array
function TwoDArray(width, height) {
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
TwoDArray.prototype.draw = function(canvas, from_x, from_y, to_x, to_y, color_map) {
    canvas.width = BRICK_SZ * (to_x - from_x + 1);
    canvas.height = BRICK_SZ * (to_y - from_y + 1);
    var ctx = canvas.getContext("2d");

    for (var j = from_y; j <= to_y; ++j) {
        for (var i = from_x; i <= to_x; ++i) {
            ctx.fillStyle = color_map[this.get(i, j)];
            ctx.fillRect(BRICK_SZ * (i - from_x), BRICK_SZ * (j - from_y),
                         BRICK_SZ, BRICK_SZ);
        }
    }
};

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

// Maze
function Maze(width, height) {
    // Member variables
    this.maze_map = new TwoDArray(width + 2, height + 2);
    this.lefttop = {x: 1, y: 1};
    this.rightbottom = {x: this.maze_map.width - 2, y: this.maze_map.height - 2};
    this.start = {x: this.lefttop.x + 1, y: this.lefttop.y + 1};
    this.goal = {x: this.rightbottom.x - 1, y: this.rightbottom.y - 1};

    // Initialize maze_map putting `banpei' around
    for (var j = this.lefttop.y; j <= this.rightbottom.y; ++j) {
        for (var i = this.lefttop.x; i <= this.rightbottom.x; ++i) {
            this.maze_map.set(i, j, MazeElem.BRICK);
        }
    }
    for (var i = 0; i < this.maze_map.width; ++i) {
        this.maze_map.set(i, 0, MazeElem.PATH);
        this.maze_map.set(i, this.maze_map.height - 1, MazeElem.PATH);
    }
    for (var j = 0; j < this.maze_map.height; ++j) {
        this.maze_map.set(0, j, MazeElem.PATH);
        this.maze_map.set(this.maze_map.width - 1, j, MazeElem.PATH);
    }
};
Maze.prototype.getRandStartPoint = function() {
    return {
        x: 2 * randInt(this.start.x / 2, this.goal.x / 2),
        y: 2 * randInt(this.start.y / 2, this.goal.y / 2),
    };
};
Maze.prototype.stepForward = function(x, y) {
    d =Direction.getRandDirection();
    for (var i = 0; i < 4; ++i) {
        if (d === Direction.RIGHT && this.maze_map.get(x+2, y) === MazeElem.BRICK) {
            this.maze_map.set(x+1, y, MazeElem.PATH);
            this.maze_map.set(x+2, y, MazeElem.PATH);
            return {new_x: x+2, new_y: y};
        }
        else if (d === Direction.UP && this.maze_map.get(x, y-2) === MazeElem.BRICK) {
            this.maze_map.set(x, y-1, MazeElem.PATH);
            this.maze_map.set(x, y-2, MazeElem.PATH);
            return {new_x: x, new_y: y-2};
        }
        else if (d === Direction.LEFT && this.maze_map.get(x-2, y) === MazeElem.BRICK) {
            this.maze_map.set(x-1, y, MazeElem.PATH);
            this.maze_map.set(x-2, y, MazeElem.PATH);
            return {new_x: x-2, new_y: y};
        }
        else if (d === Direction.DOWN && this.maze_map.get(x, y+2) === MazeElem.BRICK) {
            this.maze_map.set(x, y+1, MazeElem.PATH);
            this.maze_map.set(x, y+2, MazeElem.PATH);
            return {new_x: x, new_y: y+2};
        }
        d = Direction.rot90(d);
    }
    return undefined;
};
Maze.prototype.dig = function(x, y) {
    while (true) {
        var p = this.stepForward(x, y);
        if (!p) return;
        this.dig(p.new_x, p.new_y);
    }
};
Maze.prototype.create = function() {
    var p = this.getRandStartPoint();
    this.dig(p.x, p.y);
};

// Tree node for BFS
function MazeSolverNode(x, y, prevNode) {
    this.p = {x: x, y: y};
    this.prevNode = prevNode;
};

// Visit info for BFS
function MazeVisitedMap(width, height) {
    this.width = width;
    this.height = height;
    this.visited_map = new TwoDArray(this.width + 2, this.height + 2);
};
MazeVisitedMap.prototype.visit = function(x, y) {
    this.visited_map.set(x, y, true);
};
MazeVisitedMap.prototype.isVisited = function(x, y) {
    return this.visited_map.get(x, y);
}


///////////////////////////////////
// Functions to create maze
///////////////////////////////////

// Get size from input form
function getMazeSize() {
    return {
        width: 2 * parseInt(document.getElementById("maze_width").value) + 1,
        height: 2 * parseInt(document.getElementById("maze_height").value) + 1,
    };
}

// Create maze by `Anahori-hou'
function mazeCreate() {
    var size = getMazeSize();
    maze = new Maze(size.width, size.height);  // Globalized for solver
    maze.create();

    var canvas = document.getElementById('maze_canvas');
    maze.maze_map.draw(canvas,
                       maze.lefttop.x, maze.lefttop.y,
                       maze.rightbottom.x, maze.rightbottom.y,
                       MazeColorMap);
}


///////////////////////////////////
// Functions to solve maze
///////////////////////////////////

// Draw shortest answer path
function drawStartGoalPath(goalNode) {
    var v = goalNode;
    while (v.prevNode) {
        maze.maze_map.set(v.p.x, v.p.y, MazeElem.SHORTEST_PATH);
        v = v.prevNode;
    }
    maze.maze_map.set(v.p.x, v.p.y, MazeElem.SHORTEST_PATH);

    var canvas = document.getElementById('maze_canvas');
    maze.maze_map.draw(canvas,
                       maze.lefttop.x, maze.lefttop.y,
                       maze.rightbottom.x, maze.rightbottom.y,
                       MazeColorMap);
}

// Enumerate adjandant nodes
function getAdjandantNodes(node) {
    var ret = new Array();
    var adjs = [
        {nx: node.p.x+1, ny: node.p.y},
        {nx: node.p.x, ny: node.p.y-1},
        {nx: node.p.x-1, ny: node.p.y},
        {nx: node.p.x, ny: node.p.y+1},
    ];
    adjs.forEach(function(adj) {
        if (maze.maze_map.get(adj.nx, adj.ny) !== MazeElem.BRICK) {
            ret.push(new MazeSolverNode(adj.nx, adj.ny, node));
        }
    });
    return ret;
}

// Entry point for solver
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
