(function() {

  Backbone.Ai = Backbone.Model.extend({
    defaults: {
      name: "ai",
      state: "idle"
    },
    initialize: function(attributes, options) {
      this.world = options.world;
      this.listenTo(this.world, "change:state", this.onChangeState);
    },
    onChangeState: function() {
      var state = this.world.get("state");
      if (state == "pause") this.stop();
    },
    stop: function() {
      this.world.clearTimeout(this.throwFruitTimeoutId);
    },
    update: function(dt) {
      return false;
    },
    throwFruit: function(options) {
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

      var fruits = this.world.get("fruits"),
          startDelay = Math.max(150, 350 - fruits * 2),
          deltaDelay = Math.max(500, 1500 - fruits * 20),
          delay = Math.floor(startDelay + deltaDelay*Math.random());
      this.throwFruitTimeoutId = this.world.setTimeout(this.throwFruit.bind(this), delay);
    },
    draw: function() {},
    onDraw: function() {}
  });

}).call(this);