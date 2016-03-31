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
      velocity: -walkVelocity,
      scaleX: -1,
      scaleY: 1
    },
    "walk-right": {
      sequences: sequences,
      delay: sequenceDelay,
      velocity: walkVelocity,
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

  Backbone.Fruit = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      type: "fruit",
      spriteSheet: "fruits",
      width: 70,
      height: 70,
      state: "fall-left",
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 4,
      paddingRight: 4,
      collision: true,
      collideWith: ["character", "barrier"],
      health: 1,
      attackDamage: 1,
      aiDelay: 250,
      bounce: true
    }),
    animations: animations,
    onUpdate: undefined,
    hit: function(sprite, dir, dir2) {
      var cur = this.getStateInfo(),
          opo = _.opo(dir);

      if (this._handlingSpriteHit || cur.mov == "ko" || cur.mov2 == "hurt") return this;
      this._handlingSpriteHit = sprite;

      if (sprite.get("name") == "floor") {
        this.cancelUpdate = true;
        var attackDamage = sprite.get("attackDamage") || 0;
        this.set({health: Math.max(this.get("health") - attackDamage, 0)}, {sprite: sprite, dir: dir, dir2: dir2});
        this.trigger("action", "hit");
      } else if (sprite.get("hero")) {
        this.cancelUpdate = true;
        this.trigger("action", "eaten");
      }

      sprite.trigger("hit", this, opo);

      this._handlingSpriteHit = undefined;
      return this;
    }
  });

  function createFruit(name, sequences) {
    Backbone[_.classify(name)] = Backbone.Fruit.extend({
      defaults: _.extend({}, Backbone.Fruit.prototype.defaults, {
        name: name
      }),
      animations: _.map(Backbone.Fruit.prototype.animations, function(animation) {
        return _.extend({}, animation, {
          sequences: sequences
        });
      })
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