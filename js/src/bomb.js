(function() {

  Backbone.Ephemeral = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      type: "decoration",
      state: "idle",
      collision: false,
      static: false,
      persist: false,
      alwaysUpdate: true
    }),
    update: function(dt) {
      var animation = this.getAnimation(),
          removeAfter = this.attributes.sequenceIndex == animation.sequences.length-1;

      Backbone.Sprite.prototype.update.apply(this, arguments);

      if (removeAfter)
        _.defer(function() {
          if (this.world) this.world.remove(this);
          this.set({sequenceIndex: 0}, {silent:true});
        }.bind(this));

      return true;
    }
  });

  Backbone.Boom = Backbone.Ephemeral.extend({
    defaults: _.extend({}, Backbone.Ephemeral.prototype.defaults, {
      name: "boom",
      spriteSheet: "boom",
      width: 120,
      height: 70,
      zIndex: 1
    }),
    animations: {
      idle: {
        sequences: [0, 0, 0, 0, 0],
        delay: 100
      }
    }
  });

  Backbone.Bomb = Backbone.Fruit.extend({
    defaults: _.extend({}, Backbone.Fruit.prototype.defaults, {
      name: "bomb",
      explodeSprite: "boom"
    }),
    animations: _.object(_.map(Backbone.Fruit.prototype.animations, function(animation, name) {
      return [name, _.extend({}, animation, {
        sequences: [8]
      })];
    }))
  });

  Backbone.fruitNames.push("bomb");

}).call(this);