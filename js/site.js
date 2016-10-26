var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Entity = (function () {
            function Entity(visual) {
                this._visual = visual;
            }
            Entity.prototype.getVisual = function () {
                return this._visual;
            };
            Entity.prototype.getPosition = function () {
                return this._pos;
            };
            Entity.prototype.getLevel = function () {
                return this._level;
            };
            Entity.prototype.setPosition = function (xy, level) {
                this._pos = xy;
                this._level = level;
                return this;
            };
            Entity.prototype.a = function () {
                var first = this._visual.description.charAt(0);
                return (first.match(/[aeiouy]/i) ? "an" : "a") + " " + this._visual.description;
            };
            Entity.prototype.the = function () {
                return "the " + this._visual.description;
            };
            Entity.prototype.it = function () {
                return "it";
            };
            Entity.prototype.verb = function (verb) {
                return verb + (verb.charAt(verb.length - 1) == "s" ? "es" : "s");
            };
            Entity.prototype.toString = function () {
                return this._visual.description;
            };
            return Entity;
        }());
        rogue.Entity = Entity;
        String.format.map.a = "a";
        String.format.map.the = "the";
        String.format.map.verb = "verb";
        String.format.map.it = "it";
        String.format.map.h = "formatHelp";
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
/// <reference path="entity.ts" />
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Being = (function (_super) {
            __extends(Being, _super);
            function Being(visual) {
                _super.call(this, visual);
                this._stats = {};
                this._sounds = [];
                this._id = ROT.RNG.getUniformInt(0, Number.MAX_VALUE).toString();
                //this._pos = pos;
                rogue.Stats.all.forEach(function (name) {
                    this._stats[name] = rogue.Stats[name].def;
                }, this);
            }
            Being.prototype.getId = function () {
                return this._id;
            };
            Being.prototype.getStat = function (name) {
                return this._stats[name];
            };
            Being.prototype.setStat = function (name, value) {
                this._stats[name] = value;
                return this;
            };
            Being.prototype.adjustStat = function (name, diff) {
                /* cannot use this.getStat(), might be modified by items */
                this.setStat(name, this._stats[name] + diff);
                return this;
            };
            /**
             * Called by the Scheduler
             */
            Being.prototype.getSpeed = function () {
                return this.getStat("speed");
            };
            Being.prototype.damage = function (attacker, damage) {
                this.adjustStat("hp", -damage);
                if (this.getStat("hp") <= 0) {
                    this.die();
                }
            };
            Being.prototype.act = function () { };
            Being.prototype.die = function () {
                this._level.setBeing(null, this._pos);
                rogue.Game.scheduler.remove(this);
            };
            Being.prototype.setPosition = function (xy, level) {
                /* came to a currently active level; add self to the scheduler */
                if (level != this._level && level == rogue.Game.level) {
                    rogue.Game.scheduler.add(this, true);
                }
                return _super.prototype.setPosition.call(this, xy, level);
            };
            Being.prototype._attack = function (defender) {
                var attack = this.getStat("attack");
                var defense = defender.getStat("defense");
                var abonus = ROT.RNG.getNormal(0, 3);
                var dbonus = ROT.RNG.getNormal(0, 3);
                console.log("Attack:", attack, "+", abonus, "vs.", defense, "+", dbonus);
                attack += abonus;
                defense += dbonus;
                attack = Math.max(1, attack);
                defense = Math.max(1, defense);
                var damage = Math.ceil(attack / defense) - 1;
                this._describeAttack(defender, damage);
                if (damage) {
                    defender.damage(this, damage);
                }
            };
            Being.prototype._describeAttack = function (defender, damage) {
                if (!this._level.isVisible(this._pos) || !this._level.isVisible(defender.getPosition())) {
                    return;
                }
                if (damage) {
                    var amount = Math.max(defender.getStat("hp") - damage, 0) / defender.getStat("maxhp");
                    if (!amount) {
                        var verb = ["kill", "destroy", "slaughter"].random();
                        rogue.Game.text.write(("%The %{verb,kill} %the.").format(this, this, defender));
                    }
                    else {
                        var types = ["slightly", "moderately", "severly", "critically"].reverse();
                        amount = Math.ceil(amount * types.length) - 1;
                        rogue.Game.text.write(("%The %{verb,hit} %the and " + types[amount] + " %{verb,damage} %it.").format(this, this, defender, this, defender));
                    }
                }
                else {
                    rogue.Game.text.write(("%The %{verb,miss} %the.").format(this, this, defender));
                }
            };
            Being.prototype._idle = function () {
                var xy = this._getAvailableNeighbors().random();
                if (xy) {
                    this._level.setBeing(this, xy);
                }
            };
            Being.prototype._getAvailableNeighbors = function () {
                var result = [];
                ROT.DIRS[8].forEach(function (dir) {
                    var xy = new rogue.Vector2(this._xy.x + dir[0], this._xy.y + dir[1]);
                    if (this._level.blocks(xy) || this._level.getBeingAt(xy)) {
                        return;
                    }
                    result.push(xy);
                }, this);
                return result;
            };
            Being.prototype.draw = function () {
            };
            Being.prototype.addSound = function (decibel, pos) {
                //50db 10 hearing
                var threshold = (this.getStat("hearing") - 10) * 5;
                if (decibel > threshold) {
                    //notice sound
                    //take into account distance and volume
                    //take into account being rotation for location approximation?
                    this._sounds.push({ volume: decibel, pos: pos });
                }
            };
            return Being;
        }(rogue.Entity));
        rogue.Being = Being;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var SoundManager = (function () {
            function SoundManager() {
            }
            SoundManager.prototype.makeSound = function (db, x, y, description) {
                var soundData = {};
                var lightpasses = function (x, y) {
                    return !(rogue.Game.level.solid(new rogue.Vector2(x, y)));
                };
                var fov = new SoundManager.cfg.shadowcastingAlgo(lightpasses, { topology: 4 });
                var reflectivity = function (x, y) {
                    return rogue.Game.level.getCellAt(new rogue.Vector2(x, y)).sound_reflectivity;
                };
                var soundengine = new ROT.Lighting(reflectivity, { range: SoundManager.cfg.range_scalar * db, passes: SoundManager.cfg.passes, emissionThreshold: SoundManager.cfg.emissionThreshold * SoundManager.cfg.dbToColor });
                soundengine.setFOV(fov);
                soundengine.setLight(x, y, [db * SoundManager.cfg.dbToColor, db * SoundManager.cfg.dbToColor, db * SoundManager.cfg.dbToColor]);
                var soundcallback = function (x, y, color) {
                    soundData[new rogue.Vector2(x, y).toString()] = color;
                };
                soundengine.compute(soundcallback);
                for (var id in soundData) {
                    var pos = rogue.Vector2.fromString(id);
                    var localDb = soundData[id];
                    var being = rogue.Game.level.getBeingAt(pos);
                    var displayedData = rogue.Game.display._data[new rogue.Vector2(pos.x, pos.y + 3).toString()];
                    var bg = "#000";
                    if (displayedData) {
                        bg = displayedData[4];
                    }
                    rogue.Game.display.draw(pos.x, pos.y + 3, "?", ROT.Color.toHex(localDb), bg);
                }
            };
            SoundManager.prototype.makeSoundCustom = function (db, x, y) {
                var _this = this;
                var soundData = {};
                var start = new rogue.Vector2(x, y);
                var dbm = Math.pow(2, db / 10);
                var soundRecursive = function (dbm, xy) {
                    soundData[xy.toString()] = dbm;
                    _this.draw(dbm, xy);
                    //var adj:Vector2[] = [];
                    for (var _i = 0, _a = ROT.DIRS[8]; _i < _a.length; _i++) {
                        var a_dir = _a[_i];
                        var diag = a_dir[0] != 0 && a_dir[1] != 0;
                        var dir = new rogue.Vector2(a_dir[0], a_dir[1]);
                        var next = xy.plus(dir);
                        var cell = rogue.Game.level.getCellAt(next);
                        var next_dbm = Math.floor(dbm * (diag ? Math.pow(1 - cell.dampening, 1.414) : 1 - cell.dampening));
                        var curr_val = soundData[next.toString()];
                        if ((curr_val == null || next_dbm > curr_val) && next_dbm > 2) {
                            soundRecursive(next_dbm, next);
                        }
                    }
                };
                soundRecursive(dbm, start);
            };
            SoundManager.prototype.draw = function (dbm, pos) {
                var displayedData = rogue.Game.display._data[new rogue.Vector2(pos.x, pos.y + 3).toString()];
                var db = Math.floor(Math.log(dbm) / Math.log(2) * 10);
                var bg = "#000";
                if (displayedData) {
                    bg = displayedData[4];
                }
                rogue.Game.display.draw(pos.x, pos.y + 3, "?", ROT.Color.toHex([255 - db * 3, db * 3, 0]), bg);
            };
            // static config:ISoundOptions = {
            //     empty_reflectivity:0.2,
            //     solid_reflectivity:0.8,
            //     range_scalar:0.2,
            //     passes:2,
            //     emissionThreshold:10,
            //     shadowcastingAlgo:ROT.FOV.RecursiveShadowcasting,
            //     ambient:40,
            //     dbToColor:2
            // }
            SoundManager.cfg = {
                empty_reflectivity: 0,
                solid_reflectivity: 0,
                range_scalar: 0.15,
                passes: 3,
                emissionThreshold: 30,
                shadowcastingAlgo: ROT.FOV.RecursiveShadowcasting,
                ambient: 20,
                dbToColor: 2
            };
            return SoundManager;
        }());
        rogue.SoundManager = SoundManager;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
/// <reference path="entity.ts" />
/// <reference path="sound.ts" />
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Cell = (function (_super) {
            __extends(Cell, _super);
            function Cell(visual, solid, next) {
                _super.call(this, visual);
                if (next) {
                    this.nextstate = next;
                    this._hasStates = true;
                }
                else {
                    this._hasStates = false;
                }
                this._solid = solid;
                this.sound_reflectivity = solid ? rogue.SoundManager.cfg.solid_reflectivity : rogue.SoundManager.cfg.empty_reflectivity;
                this.dampening = solid ? 0.5 : 0.07;
            }
            Cell.prototype.incrementState = function () {
                if (this._hasStates) {
                    //this.currentState+=1;
                    return this.nextstate;
                }
                return null;
            };
            // setState(state:number){
            //     if(this._hasStates){
            //         this.currentState = state;
            //         this._visual = this.states[state]
            //     }
            // }
            Cell.prototype.solid = function () {
                return this._solid;
            };
            // ch_states: ["","-","|","H","#"],
            // currentState: 0
            Cell.wall_4 = new Cell({
                ch: "#",
                fg: [150, 150, 150],
                bg: [90, 90, 90],
                description: "stone wall (crumbling)"
            }, true);
            Cell.wall_3 = new Cell({
                ch: "X",
                fg: [150, 150, 150],
                bg: [80, 80, 80],
                description: "stone wall (damaged)"
            }, true, Cell.wall_4);
            Cell.wall_2 = new Cell({
                ch: "/",
                fg: [150, 150, 150],
                bg: [70, 70, 70],
                description: "stone wall (cracked)"
            }, true, Cell.wall_3);
            Cell.wall_1 = new Cell({
                ch: "-",
                fg: [150, 150, 150],
                bg: [60, 60, 60],
                description: "stone wall (scratched)"
            }, true, Cell.wall_2);
            Cell.wall = new Cell({
                ch: "",
                fg: [150, 150, 150],
                bg: [50, 50, 50],
                description: "stone wall"
            }, true, Cell.wall_1);
            Cell.diamond = new Cell({
                ch: "\u25BC",
                fg: [167, 218, 255],
                bg: [50, 50, 50],
                description: "diamond"
            }, true, Cell.wall);
            Cell.iron = new Cell({
                ch: "\u220E",
                fg: [230, 231, 232],
                bg: [50, 50, 50],
                description: "iron"
            }, true, Cell.wall);
            Cell.copper = new Cell({
                ch: "\u25AC",
                fg: [184, 115, 51],
                bg: [50, 50, 50],
                description: "copper"
            }, true, Cell.wall);
            Cell.tin = new Cell({
                ch: "\u25AC",
                fg: [211, 212, 213],
                bg: [50, 50, 50],
                description: "tin"
            }, true, Cell.wall);
            Cell.quartz = new Cell({
                ch: "\u2666",
                fg: [255, 255, 255],
                bg: [50, 50, 50],
                description: "quartz"
            }, true, Cell.wall);
            Cell.empty = new Cell({
                ch: " ",
                fg: [151, 151, 151]
            }, false);
            return Cell;
        }(rogue.Entity));
        rogue.Cell = Cell;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var DirectionalBeing = (function (_super) {
            __extends(DirectionalBeing, _super);
            function DirectionalBeing(visual) {
                _super.call(this, visual);
                this._ch_dirs = [DirectionalBeing.CH_N,
                    DirectionalBeing.CH_NE,
                    DirectionalBeing.CH_E,
                    DirectionalBeing.CH_SE,
                    DirectionalBeing.CH_S,
                    DirectionalBeing.CH_SW,
                    DirectionalBeing.CH_W,
                    DirectionalBeing.CH_NW];
                this._direction = 0;
                this._instant_rotation = false;
                this._lastDuration = 100;
            }
            DirectionalBeing.prototype._rotateTo = function (direction) {
                var turns = this._turnsBetween(this._direction, direction);
                this._setRot(direction);
                this._level.setBeing(this, this._pos);
                rogue.Game.scheduler.setDuration(DirectionalBeing.BASE_ROTATE_TIME * turns);
            };
            DirectionalBeing.prototype._setRot = function (direction) {
                this._direction = direction;
                this._visual.ch = this._ch_dirs[this._direction];
            };
            DirectionalBeing.prototype._turnsBetween = function (dir1, dir2) {
                var onewayturns = Math.max(dir1, dir2) - Math.min(dir1, dir2);
                var otherwayturns = 8 - onewayturns;
                return Math.min(onewayturns, otherwayturns);
            };
            DirectionalBeing.prototype.computeFOV = function () {
                var result = {};
                var level = this._level;
                var fov = new ROT.FOV.RecursiveShadowcasting(function (x, y) {
                    return !level.solid(new rogue.Vector2(x, y));
                });
                fov.compute90(this._pos.x, this._pos.y, this.getStat("sight"), this._direction, function (x, y, r, amount) {
                    var xy = new rogue.Vector2(x, y);
                    result[xy.toString()] = xy;
                });
                return result;
            };
            DirectionalBeing.CH_N = "\u25B2";
            DirectionalBeing.CH_NE = "\u25E5";
            DirectionalBeing.CH_E = "\u25B6";
            DirectionalBeing.CH_SE = "\u25E2";
            DirectionalBeing.CH_S = "\u25BC";
            DirectionalBeing.CH_SW = "\u25E3";
            DirectionalBeing.CH_W = "\u25C0";
            DirectionalBeing.CH_NW = "\u25E4";
            DirectionalBeing.BASE_ROTATE_TIME = 50;
            DirectionalBeing.BASE_MOVE_TIME = 100;
            DirectionalBeing.BASE_MOVE_DIAGONAL_TIME = DirectionalBeing.BASE_MOVE_TIME * 1.41;
            DirectionalBeing.BASE_HIT_TIME = 300;
            DirectionalBeing.BASE_MISS_TIME = 150;
            return DirectionalBeing;
        }(rogue.Being));
        rogue.DirectionalBeing = DirectionalBeing;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Vector2 = (function () {
            function Vector2(x, y) {
                this.x = x || 0;
                this.y = y || 0;
            }
            Vector2.fromString = function (str) {
                var parts = str.split(",");
                return new Vector2(Number(parts[0]), Number(parts[1]));
            };
            Vector2.prototype.toString = function () {
                return this.x + "," + this.y;
            };
            Vector2.prototype.is = function (xy) {
                return this.x == xy.x && this.y == xy.y;
            };
            Vector2.prototype.dist8 = function (xy) {
                var dx = xy.x - this.x;
                var dy = xy.y - this.y;
                return Math.max(Math.abs(dx), Math.abs(dy));
            };
            Vector2.prototype.dist4 = function (xy) {
                var dx = xy.x - this.x;
                var dy = xy.y - this.y;
                return Math.abs(dx) + Math.abs(dy);
            };
            Vector2.prototype.dist = function (xy) {
                var dx = xy.x - this.x;
                var dy = xy.y - this.y;
                return Math.sqrt(dx * dx + dy * dy);
            };
            Vector2.prototype.plus = function (xy) {
                return new Vector2(this.x + xy.x, this.y + xy.y);
            };
            Vector2.prototype.minus = function (xy) {
                return new Vector2(this.x - xy.x, this.y - xy.y);
            };
            return Vector2;
        }());
        rogue.Vector2 = Vector2;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
/// <reference path="vector2.ts" />
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Game = (function () {
            function Game() {
            }
            Game.init = function () {
                //ROT.RNG.setSeed(12345);
                Game.sound = new rogue.SoundManager();
                Game.player = new rogue.Player();
                Game.display = new ROT.Display({
                    width: Game.MAP_SIZE.x,
                    height: Game.MAP_SIZE.y + Game.TEXT_HEIGHT + Game.STATUS_HEIGHT,
                    fontSize: Game.FONT_SIZE,
                    forceSquareRatio: true });
                document.body.appendChild(Game.display.getContainer());
                Game.data = {};
                Game.map = new ROT.Map.Cellular(Game.MAP_SIZE.x, Game.MAP_SIZE.y);
                Game.map.randomize(0.45);
                for (var i = 0; i < 4; i++) {
                    Game.map.create(function (x, y, value) {
                        Game.data[x + "," + y] = value;
                        //Game.display.DEBUG(x,y,value);
                    });
                }
                Game.text = new rogue.TextBuffer();
                Game.text.configure({
                    display: Game.display,
                    position: new rogue.Vector2(0, 0),
                    size: new rogue.Vector2(Game.MAP_SIZE.x, Game.TEXT_HEIGHT)
                });
                Game.text.clear();
                Game.text.write("[asdf] [arrows] or [numpad] to move.\n[f] or [numpad5] to use active tool.");
                Game.status = new rogue.Status();
                // new Promise((resolve, reject)=>{
                //     resolve(this.findClearSpot());
                // }).then((pos:Vector2) => {
                //     Game.player = new Player(pos);
                //     Game.display.draw(Game.player.pos.x,Game.player.pos.y,"","","#3f3");
                // });
                Game._start();
                Game.status.update();
            };
            // static findClearSpot() {
            //     var pos = new Vector2(0,0);
            //     do{
            //         pos.x = ROT.RNG.getUniformInt(0,Game.MAP_SIZE.x-1);
            //         pos.y = ROT.RNG.getUniformInt(0,Game.MAP_SIZE.y-1);
            //     } while (Game.data[pos.toString()]!=1)
            //     return pos;
            // }
            Game.handleEvent = function (e) {
                switch (e.type) {
                    case "keypress":
                        break;
                }
            };
            Game.over = function () {
            };
            Game._start = function () {
                Game.scheduler = new ROT.Scheduler.Action();
                Game.scheduler._defaultDuration = 100;
                Game.engine = new ROT.Engine(this.scheduler);
                /* build a level and position a player */
                var underground = new rogue.Level.Underground(1);
                this.switchLevel(underground, underground.getSpawn());
                Game.engine.start();
            };
            Game.switchLevel = function (level, xy) {
                if (this.level) {
                    this.level.deactivate();
                }
                this.level = level;
                this.level.activate();
                this.level.setBeing(this.player, xy);
            };
            Game.TEXT_HEIGHT = 3;
            Game.FONT_SIZE = 20;
            Game.STATUS_HEIGHT = 3;
            Game.MAP_SIZE = new rogue.Vector2(80, 40);
            return Game;
        }());
        rogue.Game = Game;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var Game = bergecraft.rogue.Game.prototype;
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Hostile = (function (_super) {
            __extends(Hostile, _super);
            function Hostile(pos) {
                _super.call(this, { ch: rogue.DirectionalBeing.CH_N, fg: [255, 0, 0], description: "hostile" });
                this._idMap = {};
                this._aggroById = {};
                this._pos = pos;
            }
            Hostile.prototype.act = function () {
                var _this = this;
                var fov = this.computeFOV();
                for (var xy in fov) {
                    var being = this._level.getBeingAt(rogue.Vector2.fromString(xy));
                    if (being == rogue.Game.player) {
                        this.addAggro(being, 10);
                    }
                }
                //handle noise in environment
                //decrement aggro (5/100)
                var decrement = -rogue.Game.scheduler._duration * 5 / 100;
                Object.keys(this._aggroById).forEach(function (key) { return _this.addAggro(key, decrement); });
                for (var id in this._aggroById) {
                    this.addAggro(id, decrement);
                }
                //move towards highest aggro
                var target = this._findHighestAggro();
                //attack if next to player
            };
            Hostile.prototype.addAggro = function (being, value) {
                var id;
                if (being instanceof rogue.Being) {
                    this._idMap[being.getId()] = being;
                    id = being.getId();
                }
                else {
                    id = being;
                }
                this._aggroById[id] = Math.max(this._aggroById[id] + value, 0);
            };
            Hostile.prototype._findHighestAggro = function () {
                var sortable = [];
                for (var id in this._aggroById)
                    sortable.push([id, this._aggroById[id]]);
                sortable.sort(function (a, b) {
                    return b[1] - a[1];
                });
                var targetId = sortable[0];
            };
            Hostile.prototype.damage = function (attacker, damage) {
                _super.prototype.damage.call(this, attacker, damage);
                this._aggroById[attacker.getId()] += 10 * damage;
            };
            return Hostile;
        }(rogue.DirectionalBeing));
        rogue.Hostile = Hostile;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Level = (function () {
            function Level() {
                this._size = rogue.Game.MAP_SIZE;
                this._beings = {};
                this._items = {};
                this._cells = {};
                this._free = {};
                this._empty = rogue.Cell.empty;
                this._create();
            }
            Level.prototype._create = function () {
            };
            Level.prototype.drawMemory = function () { };
            Level.prototype.isVisible = function (xy) { return false; };
            Level.prototype.setCell = function (cell, xy) {
                if (cell) {
                    this._cells[xy.toString()] = cell;
                }
                else {
                    delete this._cells[xy.toString()];
                }
                this.draw(xy);
            };
            Level.prototype.activate = function () {
                for (var p in this._beings) {
                    rogue.Game.scheduler.add(this._beings[p], true);
                }
                rogue.Game.display.clear();
                this.drawMemory();
                //Game.status.update();
            };
            Level.prototype.deactivate = function () {
                rogue.Game.scheduler.clear();
            };
            Level.prototype.solid = function (xy) {
                return (this._cells[xy.toString()] || this._empty).solid();
            };
            Level.prototype.draw = function (xy) {
                if (this.isInMap(xy)) {
                    var visual = this._visualAt(xy);
                    var bg = visual.bg || this._getBackgroundColor(xy);
                    rogue.Game.display.draw(xy.x, xy.y + rogue.Game.TEXT_HEIGHT, visual.ch, ROT.Color.toRGB(visual.fg), ROT.Color.toRGB(bg));
                }
            };
            Level.prototype.isInMap = function (xy) {
                return xy.x > 0 && xy.y > 0 && xy.x < rogue.Game.MAP_SIZE.x && xy.y < rogue.Game.MAP_SIZE.y;
            };
            Level.prototype._getBackgroundColor = function (xy) {
                return [255, 255, 255];
            };
            Level.prototype.getSize = function () {
                return this._size;
            };
            Level.prototype._visualAt = function (xy, excludeBeings) {
                var xys = xy.toString(); /* cache to optimize for speed */
                return ((!excludeBeings && this._beings[xys]) || this._items[xys] || this._cells[xys] || this._empty).getVisual();
            };
            Level.prototype.getBeingAt = function (xy) {
                return this._beings[xy.toString()] || null;
            };
            Level.prototype.getItemAt = function (xy) {
                return this._items[xy.toString()] || null;
            };
            Level.prototype.getCellAt = function (xy) {
                return this._cells[xy.toString()] || this._empty;
            };
            Level.prototype.setBeing = function (being, xy) {
                if (!being) {
                    delete this._beings[xy.toString()];
                    if (rogue.Game.level == this) {
                        this.draw(xy);
                    }
                    return;
                }
                /* remove from old position, draw */
                if (being.getLevel() == this) {
                    var oldXY = being.getPosition();
                    delete this._beings[oldXY.toString()];
                    if (rogue.Game.level == this) {
                        this.draw(oldXY);
                    }
                }
                var cell = this._cells[xy.toString()];
                if (cell && cell.enter) {
                    cell.enter(being);
                }
                being.setPosition(xy, this); /* propagate position data to the entity itself */
                /* set new position, draw */
                this._beings[xy.toString()] = being;
                if (rogue.Game.level == this) {
                    this.draw(xy);
                }
            };
            return Level;
        }());
        rogue.Level = Level;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Level;
        (function (Level) {
            var Underground = (function (_super) {
                __extends(Underground, _super);
                function Underground(depth) {
                    _super.call(this);
                    this._colors = [];
                    this._noise = new ROT.Noise.Simplex();
                    this._memory = {};
                    this._depth = 1;
                    this._fov = {};
                    this._depth = depth;
                    this._colors.push([100, 100, 100]);
                    this._colors.push([200, 200, 200]);
                }
                Underground.prototype._create = function () {
                    this._createWalls();
                    this._createMinerals(rogue.Cell.diamond, 10);
                    this._createMinerals(rogue.Cell.iron, 50);
                    this._createMinerals(rogue.Cell.copper, 125);
                    this._createMinerals(rogue.Cell.tin, 125);
                    this._createMinerals(rogue.Cell.quartz, 20);
                    this._createHostiles(15);
                };
                Underground.prototype._createWalls = function () {
                    for (var val in rogue.Game.data) {
                        switch (rogue.Game.data[val]) {
                            case 0:
                                this._cells[val] = rogue.Cell.wall;
                                break;
                            case 1:
                                this._cells[val] = rogue.Cell.empty;
                                break;
                        }
                    }
                };
                Underground.prototype._createMinerals = function (mineral, count) {
                    for (var i = 0; i < count; i++) {
                        var pos = this._getRandomPos();
                        if (pos && this.getCellAt(pos) == rogue.Cell.wall) {
                            this._cells[pos.toString()] = mineral;
                        }
                    }
                };
                Underground.prototype._createHostiles = function (count) {
                    for (var i = 0; i < count; i++) {
                        var pos = this._getRandomPos();
                        if (pos && this.getCellAt(pos) == rogue.Cell.empty) {
                            var mob = new rogue.Hostile(pos);
                            this.setBeing(mob, pos);
                        }
                    }
                };
                Underground.prototype.drawMemory = function () {
                    this._fov = {};
                    for (var xy in this._memory) {
                        this._drawWeak(rogue.Vector2.fromString(xy), this._memory[xy]);
                    }
                };
                Underground.prototype.isVisible = function (xy) {
                    return (xy.toString() in this._fov);
                };
                Underground.prototype.draw = function (xy) {
                    /* draw only when in player's FOV */
                    if (xy.toString() in this._fov) {
                        return _super.prototype.draw.call(this, xy);
                    }
                };
                Underground.prototype.setBeing = function (being, xy) {
                    if (!being) {
                        delete this._beings[xy.toString()];
                        if (rogue.Game.level == this) {
                            this.draw(xy);
                        }
                        return;
                    }
                    /* remove from old position, draw */
                    if (being.getLevel() == this) {
                        var oldXY = being.getPosition();
                        delete this._beings[oldXY.toString()];
                        if (rogue.Game.level == this) {
                            this.draw(oldXY);
                        }
                    }
                    var cell = this._cells[xy.toString()];
                    if (cell && cell.enter) {
                        cell.enter(being);
                    }
                    being.setPosition(xy, this); /* propagate position data to the entity itself */
                    if (being == rogue.Game.player) {
                        this._updateFOV(being);
                    }
                    /* set new position, draw */
                    this._beings[xy.toString()] = being;
                    if (rogue.Game.level == this) {
                        this.draw(xy);
                    }
                };
                Underground.prototype._drawWeak = function (xy, visual) {
                    if (this.isInMap(xy)) {
                        var fg = ROT.Color.interpolate([0, 0, 0], visual.fg, 0.25);
                        //var bg = visual.bg || this._getBackgroundColor(xy);
                        var bg = ROT.Color.interpolate([0, 0, 0], visual.bg || this._getBackgroundColor(xy), 0.6);
                        rogue.Game.display.draw(xy.x, xy.y + rogue.Game.TEXT_HEIGHT, visual.ch, ROT.Color.toRGB(fg), ROT.Color.toRGB(bg));
                    }
                };
                Underground.prototype._updateFOV = function (being) {
                    var oldFOV = this._fov;
                    this._fov = being.computeFOV();
                    for (var id in this._fov) {
                        var xy = this._fov[id];
                        this._memory[xy.toString()] = this._visualAt(xy, true);
                        if (id in oldFOV) {
                            delete oldFOV[id];
                        }
                        else {
                            this.draw(xy);
                        }
                    }
                    for (var id in oldFOV) {
                        var xy = oldFOV[id];
                        var visual = this._visualAt(xy, true);
                        this._drawWeak(xy, visual);
                    }
                };
                Underground.prototype._getBackgroundColor = function (xy) {
                    var val = this._noise.get(xy.x / 20, xy.y / 20) / 2 + 0.5;
                    return ROT.Color.interpolate(this._colors[0], this._colors[1], val);
                };
                Underground.prototype.getSpawn = function () {
                    var pos = new rogue.Vector2(0, 0);
                    do {
                        pos = this._getRandomPos();
                    } while (rogue.Game.data[pos.toString()] != 1);
                    return pos;
                };
                Underground.prototype._getRandomPos = function () {
                    var pos = new rogue.Vector2(0, 0);
                    pos.x = ROT.RNG.getUniformInt(0, rogue.Game.MAP_SIZE.x - 1);
                    pos.y = ROT.RNG.getUniformInt(0, rogue.Game.MAP_SIZE.y - 1);
                    return pos;
                };
                return Underground;
            }(Level));
            Level.Underground = Underground;
        })(Level = rogue.Level || (rogue.Level = {}));
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
/// <reference path="being.ts" />
/// <reference path="directionalbeing.ts" />
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        (function (PlayerMode) {
            PlayerMode[PlayerMode["move"] = 0] = "move";
            PlayerMode[PlayerMode["mine"] = 1] = "mine";
            PlayerMode[PlayerMode["build"] = 2] = "build";
        })(rogue.PlayerMode || (rogue.PlayerMode = {}));
        var PlayerMode = rogue.PlayerMode;
        var Player = (function (_super) {
            __extends(Player, _super);
            //_ch_dirs = {};
            //_direction = 0;
            //_instant_rotation = false;
            //† 2020
            //‡ 2021
            //☀ 2600
            //☻ 263B
            //⚒ 2692
            //⚔ 2694
            //⛏ 26CF
            //⛨ 26E8
            //⛬ 26EC
            //⭠⭡⭢⭣⭤⭥⭦⭧⭨⭩ 2B60
            //ⴾ 2D3E
            //ⵘ 2D58
            //🔨 1F528
            function Player(pos) {
                _super.call(this, { ch: rogue.DirectionalBeing.CH_N, fg: [0, 255, 0], description: "self" });
                this.tool = "Pickaxe";
                this._promise = null;
                //this._ch_dirs = ["\u25B2","\u25E5","\u25B6","\u25E2","\u25BC","\u25E3","\u25C0","\u25E4"];
                //this._char = "\u25B2";
                //this._color = ROT.Color.fromString("green");
                this.mode = PlayerMode.move;
                this.setStat("hp", 4);
                this.setStat("defense", 5);
                this._keys = {};
                this._keys[ROT.VK_K] = 0;
                this._keys[ROT.VK_UP] = 0;
                this._keys[ROT.VK_NUMPAD8] = 0;
                this._keys[ROT.VK_W] = 0;
                this._keys[ROT.VK_U] = 1;
                this._keys[ROT.VK_PAGE_UP] = 1;
                this._keys[ROT.VK_NUMPAD9] = 1;
                this._keys[ROT.VK_L] = 2;
                this._keys[ROT.VK_RIGHT] = 2;
                this._keys[ROT.VK_NUMPAD6] = 2;
                this._keys[ROT.VK_D] = 2;
                this._keys[ROT.VK_N] = 3;
                this._keys[ROT.VK_PAGE_DOWN] = 3;
                this._keys[ROT.VK_NUMPAD3] = 3;
                this._keys[ROT.VK_J] = 4;
                this._keys[ROT.VK_DOWN] = 4;
                this._keys[ROT.VK_NUMPAD2] = 4;
                this._keys[ROT.VK_S] = 4;
                this._keys[ROT.VK_B] = 5;
                this._keys[ROT.VK_END] = 5;
                this._keys[ROT.VK_NUMPAD1] = 5;
                this._keys[ROT.VK_H] = 6;
                this._keys[ROT.VK_LEFT] = 6;
                this._keys[ROT.VK_NUMPAD4] = 6;
                this._keys[ROT.VK_A] = 6;
                this._keys[ROT.VK_Y] = 7;
                this._keys[ROT.VK_HOME] = 7;
                this._keys[ROT.VK_NUMPAD7] = 7;
            }
            Player.prototype.act = function () {
                // Progress.turns++;
                rogue.Game.status.update();
                //Game.status.updatePart("turns");
                this._promise = new rogue.Promise();
                this._listen();
                return this._promise;
            };
            Player.prototype.die = function () {
                _super.prototype.die.call(this);
                rogue.Game.over();
            };
            Player.prototype.handleEvent = function (e) {
                if (e.ctrlKey || e.altKey) {
                    return;
                }
                if (e.keyCode == ROT.VK_SHIFT) {
                    return;
                }
                window.removeEventListener("keydown", this);
                rogue.Game.text.clear();
                var code = e.keyCode;
                // if(code==ROT.VK_TAB){
                //     e.preventDefault();
                //     const objValues = Object.keys(PlayerMode).map(k => PlayerMode[k]);
                //     const values = objValues.filter(v => typeof v === "number") as number[];
                //     this.mode = (this.mode+1)%values.length;
                //     Game.status.update();
                //     return this._listen();
                // } else 
                if (code == ROT.VK_F || code == ROT.VK_NUMPAD5) {
                    //Use Tool
                    var dir = ROT.DIRS[8][this._direction];
                    var xy = this._pos.plus(new rogue.Vector2(dir[0], dir[1]));
                    if (this._level.solid(xy)) {
                        var target = this._level.getCellAt(xy);
                        var targetName = target.toString();
                        var d = target.getVisual().description;
                        if (d) {
                            var damageMessage = ("You hit %a with your " + this.tool + ".").format(this._level.getCellAt(xy));
                            var destroyMessage = ("You destroy %a with your %s.").format(this._level.getCellAt(xy), this.tool);
                            var next = target.incrementState();
                            if (next) {
                                this._level.setCell(next, xy);
                                rogue.Game.text.write(damageMessage);
                            }
                            else {
                                rogue.Game.level.setCell(rogue.Cell.empty, xy);
                                rogue.Game.text.write(destroyMessage);
                                this._level.setBeing(this, this._pos);
                            }
                            rogue.Game.scheduler.setDuration(300);
                            rogue.Game.level.draw(xy);
                            return this._promise.fulfill();
                        }
                        return this._listen();
                    }
                    else {
                        rogue.Game.text.write("You swing at the air.");
                        rogue.Game.scheduler.setDuration(150);
                        return this._promise.fulfill();
                    }
                }
                else if (code in this._keys) {
                    var next_dir = this._keys[code];
                    if (next_dir != this._direction && !this._instant_rotation) {
                        //handle rotation
                        this._rotateTo(next_dir);
                        // var onewayturns = Math.max(this._direction,next_dir)-Math.min(this._direction,next_dir)
                        // var otherwayturns = 8-onewayturns;
                        // var turns = Math.min(onewayturns,otherwayturns);
                        // this._direction = next_dir;
                        // this._visual.ch = this._ch_dirs[this._direction];
                        // this._level.setBeing(this,this._pos);
                        // Game.scheduler.setDuration(50*turns);\
                        return this._promise.fulfill();
                    }
                    this._direction = next_dir;
                    this._visual.ch = this._ch_dirs[this._direction];
                    var dir = ROT.DIRS[8][this._direction];
                    var xy = this._pos.plus(new rogue.Vector2(dir[0], dir[1]));
                    switch (this.mode) {
                        case PlayerMode.move:
                            if (this._level.solid(xy)) {
                                var d = this._level.getCellAt(xy).getVisual().description;
                                if (d) {
                                    rogue.Game.text.write("You bump into %a.".format(this._level.getCellAt(xy)));
                                }
                                return this._listen();
                            }
                            else if (!this._level.isInMap(xy)) {
                                rogue.Game.text.write("You bump into the edge of the world.");
                                return this._listen();
                            }
                            else {
                                this._level.setBeing(this, xy);
                                return this._promise.fulfill();
                            }
                        case PlayerMode.mine:
                            break;
                        case PlayerMode.build:
                            break;
                    }
                }
                return this._listen();
            };
            Player.prototype._listen = function (e) {
                rogue.Game.text.flush();
                window.addEventListener("keydown", this);
            };
            return Player;
        }(rogue.DirectionalBeing));
        rogue.Player = Player;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Promise = (function () {
            function Promise() {
                this._thenPromises = [];
                this._state = 0; /* 0 = pending, 1 = fulfilled, 2 = rejected */
                this._value = null; /* fulfillment / rejection value */
                this._cb = {
                    fulfilled: [],
                    rejected: []
                };
                this._thenPromises = []; /* promises returned by then() */
            }
            /**
             * @param {function} onFulfilled To be called once this promise gets fulfilled
             * @param {function} onRejected To be called once this promise gets rejected
             * @returns {Promise}
             */
            Promise.prototype.then = function (onFulfilled, onRejected) {
                this._cb.fulfilled.push(onFulfilled);
                this._cb.rejected.push(onRejected);
                var thenPromise = new Promise();
                this._thenPromises.push(thenPromise);
                if (this._state > 0) {
                    setTimeout(this._processQueue.bind(this), 0);
                }
                /* 3.2.6. then must return a promise. */
                return thenPromise;
            };
            /**
             * Fulfill this promise with a given value
             * @param {any} value
             */
            Promise.prototype.fulfill = function (value) {
                if (this._state != 0) {
                    return this;
                }
                this._state = 1;
                this._value = value;
                this._processQueue();
                return this;
            };
            /**
             * Reject this promise with a given value
             * @param {any} value
             */
            Promise.prototype.reject = function (value) {
                if (this._state != 0) {
                    return this;
                }
                this._state = 2;
                this._value = value;
                this._processQueue();
                return this;
            };
            /**
             * Pass this promise's resolved value to another promise
             * @param {Promise} promise
             */
            Promise.prototype.chain = function (promise) {
                return this.then(promise.fulfill.bind(promise), promise.reject.bind(promise));
            };
            /**
             * @param {function} onRejected To be called once this promise gets rejected
             * @returns {Promise}
             */
            Promise.prototype.catch = function (onRejected) {
                return this.then(null, onRejected);
            };
            Promise.prototype._processQueue = function () {
                while (this._thenPromises.length) {
                    var onFulfilled = this._cb.fulfilled.shift();
                    var onRejected = this._cb.rejected.shift();
                    this._executeCallback(this._state == 1 ? onFulfilled : onRejected);
                }
            };
            Promise.prototype._executeCallback = function (cb) {
                var thenPromise = this._thenPromises.shift();
                if (typeof (cb) != "function") {
                    if (this._state == 1) {
                        /* 3.2.6.4. If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value. */
                        thenPromise.fulfill(this._value);
                    }
                    else {
                        /* 3.2.6.5. If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason. */
                        thenPromise.reject(this._value);
                    }
                    return;
                }
                try {
                    var returned = cb(this._value);
                    if (returned && typeof (returned.then) == "function") {
                        /* 3.2.6.3. If either onFulfilled or onRejected returns a promise (call it returnedPromise), promise2 must assume the state of returnedPromise */
                        var fulfillThenPromise = function (value) { thenPromise.fulfill(value); };
                        var rejectThenPromise = function (value) { thenPromise.reject(value); };
                        returned.then(fulfillThenPromise, rejectThenPromise);
                    }
                    else {
                        /* 3.2.6.1. If either onFulfilled or onRejected returns a value that is not a promise, promise2 must be fulfilled with that value. */
                        thenPromise.fulfill(returned);
                    }
                }
                catch (e) {
                    /* 3.2.6.2. If either onFulfilled or onRejected throws an exception, promise2 must be rejected with the thrown exception as the reason. */
                    thenPromise.reject(e);
                }
            };
            return Promise;
        }());
        rogue.Promise = Promise;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Stats = (function () {
            function Stats() {
            }
            Stats.all = ["hp", "maxhp", "speed", "sight", "attack", "defense", "noise", "hearing"];
            Stats.avail = ["maxhp", "speed", "sight", "attack", "defense", "noise", "hearing"];
            Stats.maxhp = {
                def: 2,
                short: "HP",
                label: "Vitality",
                random: [1, [2, 3], [3, 4], [4, 5]]
            };
            Stats.hp = {
                def: Stats.maxhp.def,
                label: "HP"
            };
            Stats.noise = {
                def: 10,
                label: "Noise"
            };
            Stats.hearing = {
                def: 10,
                label: "Hearing"
            };
            Stats.speed = {
                def: 10,
                label: "Speed",
                short: "SPD",
                random: [1, [2, 3], [3, 4], [4, 5]]
            };
            Stats.sight = {
                def: 7,
                label: "Sight",
                short: "SEE",
                random: [1, 2, 3, 4]
            };
            Stats.attack = {
                def: 10,
                label: "Attack",
                short: "ATK",
                random: [1, [2, 3], [3, 4], [4, 5]]
            };
            Stats.defense = {
                def: 10,
                label: "Defense",
                short: "DEF",
                random: Stats.attack.random
            };
            return Stats;
        }());
        rogue.Stats = Stats;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Status = (function () {
            function Status() {
            }
            Status.prototype.update = function () {
                var row1 = 1 + rogue.Game.TEXT_HEIGHT + rogue.Game.MAP_SIZE.y;
                var row2 = 2 + rogue.Game.TEXT_HEIGHT + rogue.Game.MAP_SIZE.y;
                // this.drawCharacters(1,row1," ",50,50);
                // this.drawCharacters(1,row2," ",50,50);
                rogue.Game.display.drawText(1, row1, "  Time: ", 6);
                this.clearAndDrawText(10, row1, rogue.Game.scheduler.getTime().toString(), 10);
                // Game.display.drawText(10,row1,PlayerMode[Game.player.mode],10);
                rogue.Game.display.drawText(1, row2, "Tool: ", 6);
                rogue.Game.display.drawText(10, row2, rogue.Game.player.tool, 10);
                rogue.Game.display.drawText(30, row1, "Health: ", 6);
                //Game.display.drawText(40,row1,"%c{#f00}".rpad("o",8+Game.player.getStat("hp"))+"%c{}",10); //❤ 
                this.drawCharacters(40, row1, "\u2764", rogue.Game.player.getStat("hp"), 10, "#f00"); //,null,2
                rogue.Game.display.drawText(30, row2, "Armor  : ", 6);
                //Game.display.drawText(40,row2,"%c{#999}".rpad("o",8+Game.player.getStat("defense"))+"%c{}",10); //⛊
                this.drawCharacters(40, row2, "\u26CA", rogue.Game.player.getStat("defense"), 10, "#99f"); //,null,2
                //Game.display.draw(40,row2,"⛊")
            };
            Status.prototype.clearAndDrawText = function (x, y, text, clearSize) {
                this.drawCharacters(x, y, " ", clearSize, clearSize);
                rogue.Game.display.drawText(x, y, text, clearSize);
            };
            Status.prototype.drawCharacters = function (x, y, text, count, maxWidth, fg, bg, inc) {
                var inc = inc || 1;
                for (var i = 0; i < maxWidth; i++) {
                    if (i < count) {
                        rogue.Game.display.draw(x + i * inc, y, text, fg, bg);
                    }
                    else {
                        rogue.Game.display.draw(x + i * inc, y, " ", fg, bg);
                    }
                }
            };
            return Status;
        }());
        rogue.Status = Status;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var TextBuffer = (function () {
            function TextBuffer() {
                this._data = [];
                this._options = {
                    display: null,
                    position: new rogue.Vector2(),
                    size: new rogue.Vector2()
                };
            }
            // constructor(){
            // }
            TextBuffer.prototype.configure = function (options) {
                for (var p in options) {
                    this._options[p] = options[p];
                }
            };
            TextBuffer.prototype.clear = function () {
                this._data = [];
            };
            TextBuffer.prototype.write = function (text) {
                this._data.push("%c{}" + text);
            };
            TextBuffer.prototype.flush = function () {
                var o = this._options;
                var d = o.display;
                var pos = o.position;
                var size = o.size;
                /* clear */
                for (var i = 0; i < size.x; i++) {
                    for (var j = 0; j < size.y; j++) {
                        d.draw(pos.x + i, pos.y + j);
                    }
                }
                var text = this._data.join(" ");
                d.drawText(pos.x, pos.y, text, size.x);
            };
            return TextBuffer;
        }());
        rogue.TextBuffer = TextBuffer;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
var bergecraft;
(function (bergecraft) {
    var rogue;
    (function (rogue) {
        var Utils = (function () {
            function Utils() {
            }
            return Utils;
        }());
        rogue.Utils = Utils;
    })(rogue = bergecraft.rogue || (bergecraft.rogue = {}));
})(bergecraft || (bergecraft = {}));
//# sourceMappingURL=site.js.map