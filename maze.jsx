import "js/web.jsx";

class Config {
    static const BRICK_SZ = 4;
}

class Util {
    static function randInt(min : int, max : int) : int {
        return min + Math.floor((max - min) * Math.random());
    }
}

class MazeElem {
    static const BRICK         = 0;
    static const PATH          = 1;
    static const SHORTEST_PATH = 2;

    static function getColor(elemId : int) : string {
        switch (elemId) {
            case MazeElem.BRICK:
                return "#000000";
            case MazeElem.PATH:
                return "#FFFFFF";
            case MazeElem.SHORTEST_PATH:
                return "#FF0000";
        }
        return "blue"; // unlikely
    }
}

class Direction {
    static const RIGHT = 0;
    static const UP    = 1;
    static const LEFT  = 2;
    static const DOWN  = 3;

    static function rot90(direction : int) : int {
        return (direction + 1) % 4;
    }

    static function getRandDirection() : int {
        return Util.randInt(-1, 3);
    }
}

class Array2D.<T> {
    var width : int;
    var height : int;
    var data : Array.<T>;

    function constructor(width : int, height : int) {
        this.width  = width;
        this.height = height;
        this.data   = new Array.<T>(width * height);
    }

    function get(x : int, y : int) : Nullable.<T> {
        return this.data[this.width * y + x];
    }
    function set(x : int, y : int, val : T) : void {
        this.data[this.width * y + x] = val;
    }

    function draw(canvas : HTMLCanvasElement, fromX : int, fromY : int, toX : int, toY : int) : void {
        canvas.width  = Config.BRICK_SZ * (toX - fromY + 1);
        canvas.height = Config.BRICK_SZ * (toX - fromY + 1);

        var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        for (var xi = fromY; xi <= toY; ++xi) {
            for (var yi = fromX; yi <= toX; ++yi) {
                ctx.fillStyle = MazeElem.getColor(this.get(xi, yi) as int);
                ctx.fillRect(Config.BRICK_SZ * (xi - fromX),
                             Config.BRICK_SZ * (yi - fromY),
                             Config.BRICK_SZ, Config.BRICK_SZ);
            }
        }
    }
}

class Point {
    var x : int;
    var y : int;

    function constructor(x : int, y : int) {
        this.x = x;
        this.y = y;
    }
}

class Maze {
    var width : int;
    var height : int;
    var mazeMap : Array2D.<int>;

    var leftTop     : Point;
    var rightBottom : Point;

    var start : Point;
    var goal  : Point;

    function constructor(width : int, height : int) {
        this.mazeMap = new Array2D.<int>(width + 2, height + 2);
        this.leftTop = new Point(1, 1);

        this.rightBottom = new Point(this.mazeMap.width - 2, this.mazeMap.height - 2);
        this.start = new Point(this.leftTop.x + 1, this.leftTop.y + 1);
        this.goal  = new Point(this.rightBottom.x - 1, this.rightBottom.y - 1);

        this.initialize();
    }

    function initialize() : void {
        for (var j = this.leftTop.y; j <= this.rightBottom.y; ++j) {
            for (var i = this.leftTop.x; i <= this.rightBottom.x; ++i) {
                this.mazeMap.set(i, j, MazeElem.BRICK);
            }
        }
        for (var i = 0; i < this.mazeMap.width; ++i) {
            this.mazeMap.set(i, 0, MazeElem.PATH);
            this.mazeMap.set(i, this.mazeMap.height - 1, MazeElem.PATH);
        }
        for (var j = 0; j < this.mazeMap.height; ++j) {
            this.mazeMap.set(0, j, MazeElem.PATH);
            this.mazeMap.set(this.mazeMap.width - 1, j, MazeElem.PATH);
        }
    }

    function getRandStartPoint() : Point {
        return new Point(
            2 * Util.randInt(this.start.x / 2, this.goal.x / 2),
            2 * Util.randInt(this.start.y / 2, this.goal.y / 2)
        );
    }

    function stepForward(x : int, y : int) : Point {
        var d = Direction.getRandDirection();
        for (var i = 0; i < 4; ++i) {
            if (d == Direction.RIGHT && this.mazeMap.get(x+2, y) == MazeElem.BRICK) {
                this.mazeMap.set(x+1, y, MazeElem.PATH);
                this.mazeMap.set(x+2, y, MazeElem.PATH);
                return new Point(x+2, y);
            }
            else if (d == Direction.UP && this.mazeMap.get(x, y-2) == MazeElem.BRICK) {
                this.mazeMap.set(x, y-1, MazeElem.PATH);
                this.mazeMap.set(x, y-2, MazeElem.PATH);
                return new Point(x, y-2);
            }
            else if (d == Direction.LEFT && this.mazeMap.get(x-2, y) == MazeElem.BRICK) {
                this.mazeMap.set(x-1, y, MazeElem.PATH);
                this.mazeMap.set(x-2, y, MazeElem.PATH);
                return new Point(x-2, y);
            }
            else if (d == Direction.DOWN && this.mazeMap.get(x, y+2) == MazeElem.BRICK) {
                this.mazeMap.set(x, y+1, MazeElem.PATH);
                this.mazeMap.set(x, y+2, MazeElem.PATH);
                return new Point(x, y+2);
            }
            d = Direction.rot90(d);
        }
        return null;
    }

    function dig(x : int, y : int) : void {
        while (true) {
            var p = this.stepForward(x, y);
            if (!p) return;
            this.dig(p.x, p.y);
        }
    }
    function create() : void {
        var p = this.getRandStartPoint();
        this.dig(p.x, p.y);
    }
}

// Tree node for BFS
class SolverNode {
    var p : Point;
    var prevNode : SolverNode;

    function constructor(x : int, y : int, prevNode : SolverNode) {
        this.p = new Point(x, y);
        this.prevNode = prevNode;

    }
}

// Visit info for BFS
class VisitedMap {
    var width : int;
    var height : int;
    var visitedMap : Array2D.<boolean>;

    function constructor(width : int, height : int) {
        this.width  = width;
        this.height = height;

        this.visitedMap = new Array2D.<boolean>(this.width + 2, this.height + 2);
    }

    function visit(x : int, y : int) : void {
        this.visitedMap.set(x, y, true);
    }

    function isVisited(x : int, y : int) : Nullable.<boolean> {
        return this.visitedMap.get(x, y);
    }
}

class _Main {

    static var maze : Maze = null;

    static function mazeCreate() : void {
        var width =  2 * ((dom.id("maze_width")  as HTMLInputElement).value as int) + 1;
        var height = 2 * ((dom.id("maze_height") as HTMLInputElement).value as int) + 1;

        var maze = _Main.maze = new Maze(width, height);
        maze.create();

        var canvas = dom.id('maze_canvas') as HTMLCanvasElement;
        maze.mazeMap.draw(canvas,
                           maze.leftTop.x,     maze.leftTop.y,
                           maze.rightBottom.x, maze.rightBottom.y);
    }

    static function drawStartGoalPath(goalNode : SolverNode) : void {
        var maze = _Main.maze;

        var v = goalNode;
        while (v.prevNode) {
            maze.mazeMap.set(v.p.x, v.p.y, MazeElem.SHORTEST_PATH);
            v = v.prevNode;
        }
        maze.mazeMap.set(v.p.x, v.p.y, MazeElem.SHORTEST_PATH);

        var canvas = dom.id('maze_canvas') as HTMLCanvasElement;
        maze.mazeMap.draw(canvas,
                          maze.leftTop.x,     maze.leftTop.y,
                          maze.rightBottom.x, maze.rightBottom.y);
    }

    static function getAdjandantNodes(node : SolverNode) : Array.<SolverNode> {
        var maze = _Main.maze;

        var ret = new Array.<SolverNode>();
        var adjs = [
            new Point(node.p.x+1, node.p.y),
            new Point(node.p.x,   node.p.y-1),
            new Point(node.p.x-1, node.p.y),
            new Point(node.p.x,   node.p.y+1)
        ];
        adjs.forEach(function(adj) {
            if (maze.mazeMap.get(adj.x, adj.y) != MazeElem.BRICK) {
                ret.push(new SolverNode(adj.x, adj.y, node));
            }
        });
        return ret;
    }

    static function mazeSolve() : void {
        var maze = _Main.maze;

        var visitedMap = new VisitedMap(maze.mazeMap.width, maze.mazeMap.height);

        var q = new Array.<SolverNode>(); // Queue for storing to-be-visited nodes

        q.push(new SolverNode(maze.start.x, maze.start.y, null));
        visitedMap.visit(maze.start.x, maze.start.y);

        // Find the shortest path to goal
        while (true) {
            // Feed all nodes in queue
            var visiting : SolverNode;
            while (visiting = q.shift()) {
                // Found goal
                if (visiting.p.x == maze.goal.x && visiting.p.y == maze.goal.y) {
                    _Main.drawStartGoalPath(visiting);
                    return;
                }

                // Add adjandant unvisited nodes to queue
                var adjNodes = _Main.getAdjandantNodes(visiting);
                adjNodes.forEach(function(adjNode) {
                    if (!visitedMap.isVisited(adjNode.p.x, adjNode.p.y)) {
                        visitedMap.visit(adjNode.p.x, adjNode.p.y);
                        q.push(adjNode);
                    }
                });
            }
        }
    }

    static function main(args : string[]) : void {
        _Main.mazeCreate();

        dom.id("recreate").addEventListener("click", function (e) {
            _Main.mazeCreate();
        });
        dom.id("show").addEventListener("click", function (e) {
            _Main.mazeSolve();
        });
    }
}

// vim: set expandtab:
