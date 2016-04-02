(function() {
  
	Backbone.Miam = Backbone.Sprite.extend({
    defaults: {
      name: "miam",
      type: "miam",
      hero: true,
      spriteSheet: "miam",
      state: "idle",
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      velocity: 0,
      paddingLeft: 30,
      paddingRight: 60,
      paddingTop: 130,
      paddingBottom: 60,
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
      }
    },
    onAttach: function() {
      if (this.engine) {
        this.listenTo(this.engine, "touchstart", this.openMouth);
        this.listenTo(this.engine, "touchend", this.closeMouth);
      }
    },
    onDetach: function() {
      this.stopListening(this.engine);
    },
    openMouth: function() {
      this.set("state", "open");
    },
    closeMouth: function() {
      this.set("state", "idle");
    },
    isAttacking: function() {
      return this.get("state") == "open";
    },
    onUpdate: function(dt) {
      if (!this.world) return true;

      var state = this.get("state"),
          x = this.get("x"),
          y = this.get("y"),
          width = this.get("width"),
          minX = width/2,
          maxX = this.world.get("width") - width/2,
          attrs = {};

      if (state == "open") {

        // Move
        var centerX = Math.round(this.engine._currX);
        if (centerX < minX) centerX = minX;
        if (centerX > maxX) centerX = maxX;
        attrs.x = x = centerX - width/2;

        // Eat stuff
        var b = {
          x: x + this.get("paddingLeft"),
          y: y + this.get("paddingTop"),
          width: this.getWidth(true),
          height: this.getHeight(true)
        };
        var sprites = this.world.filterAt(b, undefined, "fruit");
        for (var i = 0; i < sprites.length; i++)
          sprites[i].trigger("hit", this, "top");

      }

      // Set modified attributes
      if (!_.isEmpty(attrs)) this.set(attrs);

      return true;
    }
  });

}).call(this);