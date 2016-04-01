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
      var state = this.get("state");

      if (state == "open") {
        var b = {
          x: this.get("x") + this.get("paddingLeft"),
          y: this.get("y") + this.get("paddingTop"),
          width: this.getWidth(true),
          height: this.getHeight(true)
        };
        var sprites = this.world.filterAt(b, undefined, "fruit");
        for (var i = 0; i < sprites.length; i++)
          sprites[i].trigger("hit", this, "top");
      }

      return true;
    }
  });

}).call(this);