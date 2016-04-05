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

  var hurtAnimation = {
    sequences: sequences,
    delay: 300,
    yVelocity: fallVelocity,
    yAcceleration: fallAcceleration
  };
  animations["idle-hurt-left"] = _.extend({}, animations["idle-left"], hurtAnimation);
  animations["idle-hurt-right"] = _.extend({}, animations["idle-right"], hurtAnimation);
  animations["walk-hurt-left"] = _.extend({}, animations["walk-left"], hurtAnimation);
  animations["walk-hurt-right"] = _.extend({}, animations["walk-right"], hurtAnimation);
  animations["fall-hurt-left"] = _.extend({}, animations["fall-left"], hurtAnimation);
  animations["fall-hurt-right"] = _.extend({}, animations["fall-right"], hurtAnimation);

  var attackAnimation = {
    sequences: sequences
  };
  animations["idle-attack-left"] = _.extend({}, animations["idle-left"], attackAnimation);
  animations["idle-attack-right"] = _.extend({}, animations["idle-right"], attackAnimation);
  animations["walk-attack-left"] = _.extend({velocity: -attackVelocity}, animations["walk-left"], attackAnimation);
  animations["walk-attack-right"] = _.extend({velocity: attackVelocity}, animations["walk-right"], attackAnimation);
  animations["fall-attack-left"] = _.extend({velocity: -attackVelocity}, animations["fall-left"], attackAnimation);
  animations["fall-attack-right"] = _.extend({velocity: attackVelocity}, animations["fall-right"], attackAnimation);

  Backbone.Fruit = Backbone.Character.extend({
    defaults: _.extend({}, Backbone.Character.prototype.defaults, {
      type: "fruit",
      name: undefined,
      spriteSheet: "fruits",
      width: 70,
      height: 70,
      state: "fall-left",
      paddingTop: 20,
      paddingBottom: 20,
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
    animations: animations,
    initialize: function() {
      Backbone.Character.prototype.initialize.apply(this, arguments);
      this.set("floor", Backbone.HEIGHT - 80);
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

      var cls = _.classify(this.get("explodeSprite"));

      this.world.add(new Backbone[cls]({
        x: this.get("x") + this.get("width")/2 - Backbone.Boom.prototype.defaults.width/2,
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

  createFruit("water-melon", [0]);
  createFruit("orange", [1]);
  createFruit("strawberry", [2]);
  createFruit("apple", [3]);
  createFruit("pineapple", [4]);
  createFruit("grapes", [5]);
  createFruit("pear", [6]);
  createFruit("banana", [7]);

  Backbone.fruitNames = _.reduce(Backbone, function(names, prop) {
    if (typeof prop == "function" && prop.prototype && prop.prototype.defaults &&
        prop.prototype.defaults.type == "fruit" && prop.prototype.defaults.name) {
      names.push(prop.prototype.defaults.name);
    }
    return names;
  }, []);

}).call(this);