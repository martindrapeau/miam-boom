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
      height: 70
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
      name: "bomb"
    }),
    animations: _.object(_.map(Backbone.Fruit.prototype.animations, function(animation, name) {
      return [name, _.extend({}, animation, {
        sequences: [8]
      })];
    })),
    onLand: function() {
      _.delay(function() {
        this.world.remove(this);
      }.bind(this));

      this.world.add(new Backbone.Boom({
        x: this.get("x") + this.get("width")/2 - Backbone.Boom.prototype.defaults.width/2,
        y: this.get("y") -10
      }));
    }
  });

  Backbone.fruitNames.push("bomb");

}).call(this);