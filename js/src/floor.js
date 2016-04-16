(function() {

  Backbone.Floor = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      name: "floor",
      type: "floor",
      state: "idle",
      collision: true,
      static: true,
      width: 320,
      height: 128,
      paddingTop: 20,
      backgroundColor: "rgba(17, 63, 140, 1)",
      scale: 1
    }),
    draw: function(context, options) {
      var b = this.toJSON();

      options || (options = {});
      b.x += options.offsetX || 0;
      b.y += options.offsetY || 0;

      context.save();
      var offsetX = (1-b.scale) * b.width/2,
          offsetY = (1-b.scale) * b.height/2;

      if (b.backgroundColor && b.backgroundColor != "transparent")
          drawRect(context, b.x+offsetX, b.y+offsetY, b.width*b.scale, b.height*b.scale, b.backgroundColor, false);

      if (typeof this.onDraw == "function")
        this.onDraw(context, options);

      context.restore();

      return this;
    }
  });

}).call(this);