(function() {

  Backbone.Puff = Backbone.Ephemeral.extend({
    defaults: _.extend({}, Backbone.Ephemeral.prototype.defaults, {
      name: "puff",
      spriteSheet: "puff",
      width: 90,
      height: 90,
      zIndex: 1
    }),
    animations: {
      idle: {
        sequences: [0, 1, 2, 3, 4],
        delay: 100
      }
    }
  });

  Backbone.Star = Backbone.Fruit.extend({
    defaults: _.extend({}, Backbone.Fruit.prototype.defaults, {
      name: "star",
      explodeSprite: "puff",
      spriteSheet: "star"
    }),
    animations: _.object(_.map(Backbone.Fruit.prototype.animations, function(animation, name) {
      return [name, _.extend({}, animation, {
        sequences: [0]
      })];
    }))
  });

}).call(this);