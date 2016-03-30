(function() {
  
	Backbone.Miam = Backbone.Sprite.extend({
    defaults: {
      type: "character",
      name: "miam",
      hero: true,
      spriteSheet: "miam",
      state: "idle",
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      static: false
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
    }
  });

}).call(this);