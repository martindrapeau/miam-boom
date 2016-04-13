(function() {

  Backbone.Ai = Backbone.Model.extend({
    defaults: {
      name: "ai",
      state: "idle"
    },
    heuristics: {
      _delayRandom: function() {
        var fruits = this.world.get("fruits"),
            startDelay = Math.max(150, 350 - fruits * 2),
            deltaDelay = Math.max(500, 1500 - fruits * 20),
            delay = Math.floor(startDelay + deltaDelay*Math.random());
        this._throwTime = _.now();
        this._throwDelay = delay;
      },
      idle: function(options) {
        this.stop();
      },
      random: function(options) {
        options || (options = {});
        var hero = this.world.getHero();

        if (hero && !hero.isDisabled() && !options.skip) {

          var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              halfWidth = fruitClass.prototype.defaults.width/2,
              dir = Math.random() < 0.5 ? "right" : "left",
              x =  dir == "right" ? -halfWidth : Backbone.WIDTH-halfWidth,
              y = Math.round(Backbone.HEIGHT*0.18*Math.random()),
              yVelocity = Math.round(-500*Backbone.RATIO*Math.random());

          var fruit = new fruitClass({
            x: x,
            y: y,
            state: fruitClass.prototype.buildState("fall", dir),
            yVelocity: yVelocity
          });

          this.world.add(fruit);
        }

        this.heuristics._delayRandom.call(this);
      },
      sirup: function(options) {
        options || (options = {});
        var hero = this.world.getHero();

        if (hero && !hero.isDisabled() && !options.skip) {

          this._sirupX || (this._sirupX = Backbone.WIDTH*0.10);
          this._sirupDir || (this._sirupDir = "right");

          var index = Math.floor((Backbone.fruitNames.length-1.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)];

          var fruit = new fruitClass({
            x: this._sirupX,
            y: -fruitClass.prototype.defaults.height,
            state: fruitClass.prototype.buildState("fall", "rain", this._sirupDir),
            yVelocity: -100
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
        var hero = this.world.getHero();

        if (hero && !hero.isDisabled() && !options.skip) {

          var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              x = Backbone.WIDTH*0.10 + Math.round(Math.random() * (Backbone.WIDTH*0.80 - fruitClass.prototype.defaults.width)),
              dir = Math.random() < 0.5 ? "right" : "left";

          var fruit = new fruitClass({
            x: x,
            y: -fruitClass.prototype.defaults.height,
            state: fruitClass.prototype.buildState("fall", "rain", dir),
            yVelocity: -100
          });

          this.world.add(fruit);
        }

        this.heuristics._delayRandom.call(this);
      },
      rain2: function(options) {
        options || (options = {});
        var hero = this.world.getHero();

        if (hero && !hero.isDisabled() && !options.skip) {

          var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
              fruitName = Backbone.fruitNames[index],
              fruitClass = Backbone[_.classify(fruitName)],
              x = Backbone.WIDTH*0.10 + Math.round(Math.random() * (Backbone.WIDTH*0.80 - fruitClass.prototype.defaults.width)),
              dir = x < Backbone.WIDTH*0.50 ? "right" : "left",
              mov2 = Math.random() > 0.5 ? "rain" : "rain2";

          var fruit = new fruitClass({
            x: x,
            y: -fruitClass.prototype.defaults.height,
            state: fruitClass.prototype.buildState("fall", mov2, dir),
            yVelocity: -100
          });

          this.world.add(fruit);
        }

        this.heuristics._delayRandom.call(this);
      }
    },
    initialize: function(attributes, options) {
      this._throwTime = undefined;
      this._throwDelay = undefined;
      this.world = options.world;
      this.listenTo(this.world, "change:state", this.onWorldChangeState);
    },
    onWorldChangeState: function() {
      var state = this.world.get("state");
      if (state == "pause") this.stop();
      this._sirupX = this._sirupDir = undefined;
    },
    start: function(options) {
      this.set({state: "random"});
      this.throwFruit(options);
    },
    stop: function() {
      this.set({state: "idle"});
      this._throwDelay = undefined;
    },
    throwFruit: function(options) {
      var state = this.get("state"),
          fn = this.heuristics[state];
      if (typeof fn == "function") return fn.apply(this, arguments);
    },
    update: function(dt) {
      if (this._throwTime && this._throwDelay && _.now() > this._throwTime + this._throwDelay) this.throwFruit();
      return false;
    },
    draw: function() {}
  });

}).call(this);