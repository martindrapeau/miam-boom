(function() {
  
	Backbone.Miam = Backbone.Sprite.extend({
    defaults: {
      name: "miam",
      type: "miam",
      hero: true,
      state: "idle",
      x: 0,
      y: 0,
      width: 180,
      height: 180,
      paddingLeft: 60,
      paddingRight: 60,
      paddingTop: 80,
      paddingBottom: 90,
      attackDamage: 1
    },
    animations: {
      idle: {
        sequences: [0],
        delay: 50
      },
      open: {
        sequences: [1],
        delay: 50
      },
      dead: {
        sequences: [2],
        delay: 50
      },
      sad: {
        sequences: [3],
        delay: 50
      }
    },
    onAttach: function() {
      if (this.engine) {
        this.listenTo(this.engine, "touchstart", this.openMouth);
        this.listenTo(this.engine, "touchend", this.closeMouth);
        if (this.engine._touchStartTime) this.set("state", "open");
      }
    },
    onDetach: function() {
      this.stopListening(this.engine);
    },
    openMouth: function(e) {
      if (this.isDisabled() || e.canvasY < Backbone.HEIGHT/3) return;
      if (!this.world || this.world.get("state") != "play") return true;
      this.set("state", "open");
    },
    closeMouth: function(e) {
      if (this.isDisabled()) return;
      if (!this.world || this.world.get("state") != "play") return true;
      this.set("state", "idle");
    },
    isDisabled: function() {
      var state = this.get("state");
      return state == "dead" || state == "sad";
    },
    isAttacking: function() {
      return this.get("state") == "open";
    },
    onUpdate: function(dt) {
      if (!this.world || this.world.get("state") != "play") return true;

      var state = this.get("state"),
          x = this.get("x"),
          y = this.get("y"),
          width = this.get("width"),
          minX = width/2,
          maxX = this.world.get("width") - width/2,
          attrs = {};

      if (state == "open") {

        // Move
        if (this.engine._currY > Backbone.HEIGHT/3) {
          var centerX = Math.round(this.engine._currX);
          if (centerX < minX) centerX = minX;
          if (centerX > maxX) centerX = maxX;
          attrs.x = x = centerX - width/2;
        }

        // Eat stuff
        var b = {
          x: this.getLeft(true),
          y: this.getTop(true),
          width: this.getWidth(true),
          height: this.getHeight(true)
        };
        var sprites = this.world.filterAt(b, undefined, "fruit");
        for (var i = 0; i < sprites.length; i++) {
          if (sprites[i].get("yVelocity") > 0)
            sprites[i].trigger("hit", this, "top");
        }

      }

      // Set modified attributes
      if (!_.isEmpty(attrs)) this.set(attrs);

      return true;
    }
  });

  Backbone.Furry = Backbone.Miam.extend({
    defaults: _.extend({}, Backbone.Miam.prototype.defaults, {
      spriteSheet: "furry"
    })
  });

  Backbone.Pinky = Backbone.Miam.extend({
    defaults: _.extend({}, Backbone.Miam.prototype.defaults, {
      spriteSheet: "pinky",
      paddingTop: 45,
      paddingBottom: 130
    })
  });

  Backbone.Garfield = Backbone.Miam.extend({
    defaults: _.extend({}, Backbone.Miam.prototype.defaults, {
      spriteSheet: "garfield",
      paddingTop: 45,
      paddingBottom: 130
    })
  });

}).call(this);