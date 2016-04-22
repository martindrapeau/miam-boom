(function() {

  var sequenceDelay = 100,
      walkVelocity = 200,
      attackVelocity = 400,
      fallAcceleration = 1200,
      fallVelocity = 600,
      koDelay = 100,
      sequences = [0];
  
  var animations = {
    "idle-left": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: 0,
      scaleX: -1,
      scaleY: 1
    },
    "idle-right": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: 0,
      scaleX: 1,
      scaleY: 1
    },
    "walk-left": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: 0,
      scaleX: -1,
      scaleY: 1
    },
    "walk-right": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: 0,
      scaleX: 1,
      scaleY: 1
    },
    "fall-left": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: -walkVelocity,
      yVelocity: fallVelocity,
      yAcceleration: fallAcceleration,
      scaleX: -1,
      scaleY: 1
    },
    "fall-right": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: walkVelocity,
      yVelocity: fallVelocity,
      yAcceleration: fallAcceleration,
      scaleX: 1,
      scaleY: 1
    },
    "ko-left": {
      sequences: sequences,
      delay: koDelay,
      velocity: -walkVelocity*0.5,
      yVelocity: fallVelocity*1.25,
      yAcceleration: fallAcceleration*1.5,
      scaleX: 1,
      scaleY: 1
    },
    "ko-right": {
      sequences: sequences,
      delay: koDelay,
      velocity: walkVelocity*0.5,
      yVelocity: fallVelocity*1.25,
      yAcceleration: fallAcceleration*1.5,
      scaleX: -1,
      scaleY: 1
    }
  };

  animations["fall-rain-left"] = _.extend({}, animations["fall-left"], {velocity: 0, yVelocity: fallVelocity*0.75});
  animations["fall-rain-right"] = _.extend({}, animations["fall-right"], {velocity: 0, yVelocity: fallVelocity*0.75});

  animations["fall-rain2-left"] = _.extend({}, animations["fall-left"], {velocity: -walkVelocity*0.50, yVelocity: fallVelocity*0.75});
  animations["fall-rain2-right"] = _.extend({}, animations["fall-right"], {velocity: walkVelocity*0.50, yVelocity: fallVelocity*0.75});

  animations["fall-star-left"] = _.extend({}, animations["fall-left"], {velocity: -walkVelocity*0.10});
  animations["fall-star-right"] = _.extend({}, animations["fall-right"], {velocity: walkVelocity*0.10});

  Backbone.Fruit = Backbone.Character.extend({
    defaults: _.extend({}, Backbone.Character.prototype.defaults, {
      type: "fruit",
      name: undefined,
      spriteSheet: "fruits",
      width: 90,
      height: 90,
      state: "fall-left",
      paddingTop: 30,
      paddingBottom: 30,
      paddingLeft: 20,
      paddingRight: 20,
      collision: false,
      collideWith: [],
      health: 1,
      attackDamage: 1,
      aiDelay: 250,
      bounce: false,
      alwaysUpdate: true,
      ceiling: -100
    }),
    fallAcceleration: fallAcceleration,
    fallVelocity: fallVelocity,
    animations: animations,
    initialize: function() {
      Backbone.Character.prototype.initialize.apply(this, arguments);
      this.set("floor", Backbone.HEIGHT - Backbone.Floor.prototype.defaults.height + this.get("height")/2);
      this.on("change:state", this.onChangeState);
    },
    knockout: function(sprite, dir) {
      this.clearAnimation();
      
      _.defer(function() {
        this.world.remove(this, {eaten: true});
      }.bind(this));

      this.cancelUpdate = true;
      this.trigger("action", "knockout");
      return this;
    },
    onChangeState: function() {
      var cur = this.getStateInfo();
      if (cur.mov == "walk") {
        this.trigger("landed", this);
        this.onLand();
      }
    },
    onLand: function() {
      _.delay(function() {
        this.world.remove(this);
      }.bind(this));

      var name = this.get("explodeSprite");
      if (!name) return;

      var cls = _.classify(name);
      this.world.add(new Backbone[cls]({
        x: this.get("x") + this.get("width")/2 - Backbone[cls].prototype.defaults.width/2,
        y: this.get("y")
      }));
    }
  });

  function createFruit(name, sequences) {
    Backbone[_.classify(name)] = Backbone.Fruit.extend({
      defaults: _.extend({}, Backbone.Fruit.prototype.defaults, {
        name: name,
        explodeSprite: "splat-" + name
      }),
      animations: _.object(_.map(Backbone.Fruit.prototype.animations, function(animation, name) {
        return [name, _.extend({}, animation, {
          sequences: sequences
        })];
      }))
    });
  }

  createFruit("grapes", [0]);
  createFruit("lemon", [1]);
  createFruit("pineapple", [2]);
  createFruit("apple", [3]);
  createFruit("water-melon", [4]);
  createFruit("strwaberry", [5]);
  createFruit("cherries", [6]);
  createFruit("banana", [7]);

  Backbone.fruitNames = _.reduce(Backbone, function(names, prop) {
    if (typeof prop == "function" && prop.prototype && prop.prototype.defaults &&
        prop.prototype.defaults.type == "fruit" && prop.prototype.defaults.name) {
      names.push(prop.prototype.defaults.name);
    }
    return names;
  }, []);

}).call(this);