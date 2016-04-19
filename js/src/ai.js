(function() {


  var heuristicNames = ["random", "rain", "sirup", "random", "up"];
  heuristicNames.index = 0;
  heuristicNames.next = function() {
    var index = this.index;
    this.index += 1;
    if (this.index >= this.length) this.index = 0;
    return this[index];
  }.bind(heuristicNames);
  heuristicNames.reset = function() {
    this.index = 0;
  }.bind(heuristicNames);


  Backbone.Ai = Backbone.Model.extend({
    defaults: {
      name: "ai",
      state: "idle"
    },
    initialize: function(attributes, options) {
      options || (options = {});
      this.message = options.message;
      this.world = options.world;

      this._throwTime = undefined;
      this._throwDelay = undefined;
      this._stateChangeTime = undefined;
      this._stateChangeDelay = undefined;
      
      this.listenTo(this.world, "change:state", this.onWorldChangeState);
    },
    onWorldChangeState: function() {
      var state = this.world.get("state");
      if (state == "pause") this.stop();
      this._sirupX = this._sirupDir = undefined;
    },
    start: function(options) {
      this.set({state: "idle"});
      this.throwFruit(options);
      this.changeState(options);
    },
    stop: function() {
      this.set({state: "idle"});
      this._throwDelay = undefined;
      this._stateChangeDelay = undefined;
      heuristicNames.reset();
    },
    throwFruit: function(options) {
      var state = this.get("state"),
          fn = this.heuristics[state];
      if (typeof fn == "function") return fn.apply(this, arguments);
    },
    changeState: function(options) {
      options || (options = {});

      if (!options.skip) {
        var state = this.get("state"),
            index = state == "idle" ? Math.floor((heuristicNames.length-0.01)*Math.random()) : null,
            newState = index != null ? heuristicNames.next() : "idle";
        this.set({state: newState});
        this.throwFruit();
      }

      this._stateChangeTime = _.now();
      this._stateChangeDelay = this.get("state") == "idle" ? 2000 : 15000;
    },
    update: function(dt) {
      var now = _.now();

      if (this._throwTime && this._throwDelay &&
          now > this._throwTime + this._throwDelay)
        this.throwFruit();

      if (this._stateChangeTime && this._stateChangeDelay &&
          now > this._stateChangeTime + this._stateChangeDelay)
        this.changeState();

      return false;
    },
    draw: function() {},

    heuristics: {
      idle: function(options) {
        options || (options = {});
        this._throwDelay = undefined;
        if (!options.start && this.world.get("fruits") > 0) {
          var fruits = this.world.sprites.where({type: "fruit"});
          if (fruits.length == 0) {
            this.message.show({interlude: true});
          } else {
            this._throwTime = _.now();
            this._throwDelay = 250;
          }
        }
      },
      random: function(options) {
        options || (options = {});

        if (!options.skip) {
          var hero = this.world.getHero(),
              index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              halfWidth = fruitClass.prototype.defaults.width/2,
              dir, x, y, state, yVelocity, d, t, proj,
              yFinalVelocity = Backbone.Fruit.prototype.fallVelocity,
              yAcceleration = Backbone.Fruit.prototype.fallAcceleration;

          // Randomly select values...
          function randomCalc() {
            dir = Math.random() < 0.5 ? "right" : "left";
            x =  dir == "right" ? -halfWidth : Backbone.WIDTH-halfWidth;
            y = Math.round(Backbone.HEIGHT*0.18*Math.random());
            state = fruitClass.prototype.buildState("fall", dir);
            yVelocity = Math.round(-200*Backbone.RATIO - 300*Backbone.RATIO*Math.random());
            d = hero.getTop(true) - y;
            // How much time before at Miam's mouth?
            t = (yFinalVelocity - yVelocity)/yAcceleration,
                d1 = yVelocity*t + 0.5*yAcceleration*t*t;
            if (d1 <= d) {
              t += (d-d1)/yFinalVelocity;
            } else {
              t = (-yVelocity + Math.sqrt(yVelocity*yVelocity + 2*yAcceleration*d))/yAcceleration;
            }
          }
          randomCalc();

          // Project to when it will be eaten...
          function projectBbox(x0, y0, velocity, yVelocity, t) {
            var t1 = Math.min(t, (yFinalVelocity - yVelocity)/yAcceleration),
                y = y0 + yVelocity*t1 + 0.5*yAcceleration*t1*t1;
            if (t1 < t) y += yFinalVelocity*(t-t1);
            return {
              x0: x0,
              y0: y0,
              x: x0 + velocity*t,
              y: y,
              width: fruitClass.prototype.defaults.width*2,
              height: fruitClass.prototype.defaults.height*2,
              t: t,
              velocity: velocity
            };
          }
          function buildProj() {
            proj = projectBbox(x, y, Backbone.Fruit.prototype.getAnimation(state).velocity, yVelocity, t);
          }
          buildProj();

          // And compare to projections of existing fruits or bombs.
          // If too close, randomize again. Up to 10 tries to find a far-enough position.
          var projections = [];
          this.world.sprites.each(function(sprite) {
            if (sprite.get("type") != "fruit") return true;
            if (fruitName == "bomb" && sprite.get("name") != "bomb" ||
                fruitName != "bomb" && sprite.get("name") == "bomb") {
              projections.push(projectBbox(sprite.get("x"), sprite.get("y"), Backbone.Fruit.prototype.getAnimation(sprite.get("state")).velocity, sprite.get("yVelocity"), t));
            }
          });
          for (var i = 0; i < 10; i++) {
            var brk = true;
            for (var p = 0; p < projections.length; p++) {
              var targ = projections[p];
              if (proj.x < targ.x+targ.width && proj.x+proj.width > targ.x &&
                  proj.y < targ.y+targ.height && proj.y+proj.height > targ.y) {
                randomCalc();
                buildProj();
                brk = false;
                break;
              }
            }
            if (brk) break;
          }

          var fruit = new fruitClass({
            x: x,
            y: y,
            state: state,
            yVelocity: yVelocity
          });

          this.world.add(fruit);
        }

        this.heuristics._delayThrowRandom.call(this);
      },
      sirup: function(options) {
        options || (options = {});

        if (!options.skip) {
          this._sirupX || (this._sirupX = Backbone.WIDTH*0.10);
          this._sirupDir || (this._sirupDir = "right");

          var index = Math.floor((Backbone.fruitNames.length-1.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)];

          var fruit = new fruitClass({
            x: this._sirupX,
            y: -fruitClass.prototype.defaults.height,
            state: fruitClass.prototype.buildState("fall", "rain", this._sirupDir),
            yVelocity: -50*Backbone.RATIO
          });

          this.world.add(fruit);

          this._sirupX += Backbone.WIDTH*0.10 * (this._sirupDir == "right" ? 1 : -1);
          if (this._sirupX > Backbone.WIDTH*0.90 - fruit.get("width")) {
            this._sirupX = Backbone.WIDTH*0.90 - fruit.get("width");
            this._sirupDir = "left";
          } else if (this._sirupX < Backbone.WIDTH*0.10) {
            this._sirupX = Backbone.WIDTH*0.10;
            this._sirupDir = "right";
          }
        }

        var fruits = this.world.get("fruits"),
            delay = Math.max(100, 350 - fruits * 2);
        this._throwTime = _.now();
        this._throwDelay = delay;
      },
      rain: function(options) {
        options || (options = {});

        if (!options.skip) {
          var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              x = Backbone.WIDTH*0.10 + Math.round(Math.random() * (Backbone.WIDTH*0.80 - fruitClass.prototype.defaults.width)),
              dir = Math.random() < 0.5 ? "right" : "left";

          var fruit = new fruitClass({
            x: x,
            y: -fruitClass.prototype.defaults.height,
            state: fruitClass.prototype.buildState("fall", "rain", dir),
            yVelocity: -50*Backbone.RATIO
          });

          this.world.add(fruit);
        }

        this.heuristics._delayThrowRandom.call(this);
      },
      rainleft: function(options) {
        return this.heuristics._raindir.call(this, "left", options);
      },
      rainright: function(options) {
        return this.heuristics._raindir.call(this, "right", options);
      },
      up: function(options) {
        options || (options = {});

        if (!options.skip) {
          var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              x = Backbone.WIDTH*0.10 + Math.round(Math.random() * (Backbone.WIDTH*0.80 - fruitClass.prototype.defaults.width)),
              dir = Math.random() < 0.5 ? "right" : "left";

          var fruit = new fruitClass({
            x: x,
            y: Backbone.HEIGHT,
            state: fruitClass.prototype.buildState("fall", "rain", dir),
            yVelocity: -1180*Backbone.RATIO
          });

          this.world.add(fruit);
        }

        this.heuristics._delayThrowRandom.call(this);
      },

      // Private helpers
      _delayThrowRandom: function() {
        var fruits = this.world.get("fruits"),
            startDelay = Math.max(150, 400 - fruits),
            deltaDelay = Math.max(500, 1500 - fruits * 5),
            delay = Math.floor(startDelay + deltaDelay*Math.random());
        this._throwTime = _.now();
        this._throwDelay = delay;
      },
      _raindir: function(dir, options) {
        options || (options = {});

        if (!options.skip) {
          var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              x = Backbone.WIDTH*(dir == "left" ? 0.40 : 0.00) + Math.round(Math.random() * (Backbone.WIDTH*0.60 - fruitClass.prototype.defaults.width));

          var fruit = new fruitClass({
            x: x,
            y: -fruitClass.prototype.defaults.height,
            state: fruitClass.prototype.buildState("fall", "rain2", dir),
            yVelocity: -50*Backbone.RATIO
          });

          this.world.add(fruit);
        }

        this.heuristics._delayThrowRandom.call(this);
      }
    }
  });

}).call(this);