(function() {

  Backbone.Splat = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      type: "splat",
      spriteSheet: "splat",
      width: 90,
      height: 90,
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

  createSplat("splat-grapes", [3]);
  createSplat("splat-lemon", [1]);
  createSplat("splat-pineapple", [4]);
  createSplat("splat-apple", [0]);
  createSplat("splat-water-melon", [0]);
  createSplat("splat-strwaberry", [0]);
  createSplat("splat-cherries", [0]);
  createSplat("splat-banana", [1]);

}).call(this);