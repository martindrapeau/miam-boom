(function() {

  Backbone.Splat = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      type: "splat",
      spriteSheet: "splat",
      zIndex: 1
    }),
    animations: {
      idle: {
        sequences: undefined,
        delay: 50
      }
    }
  });

  function createSplat(name, sequences) {
    Backbone[_.classify(name)] = Backbone.Splat.extend({
      defaults: _.extend({}, Backbone.Splat.prototype.defaults, {
        name: name
      }),
      animations: _.object(_.map(Backbone.Splat.prototype.animations, function(animation, name) {
        return [name, _.extend({}, animation, {
          sequences: sequences
        })];
      }))
    });
  }

  createSplat("splat-water-melon", [5]);
  createSplat("splat-orange", [0]);
  createSplat("splat-strawberry", [3]);
  createSplat("splat-apple", [3]);
  createSplat("splat-pineapple", [0]);
  createSplat("splat-grapes", [1]);
  createSplat("splat-pear", [0]);
  createSplat("splat-banana", [4]);

}).call(this);