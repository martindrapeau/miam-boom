(function() {


  Backbone.BigShareButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      name: "big-share-button",
      backgroundColor: "transparent",
      width: 180,
      height: 65,
      img: "#artifacts", imgUrl: "img/artifacts.png",
      imgX: 0, imgY: 250, imgWidth: 180, imgHeight: 70,
      text: window._lang.get("share"),
      textPadding: 0,
      textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
        font: "48px arcade",
      }),
      easingTime: 250
    })
  });

  Backbone.Panel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      x: 0,
      y: 0,
      width: 270,
      height: 270,
      img: "#artifacts", imgUrl: "img/artifacts.png",
      imgX: 720, imgY: 0, imgWidth: 270, imgHeight: 270,
      backgroundColor: "transparent",
      opacity: 1.0,
      text: "",
      easing: "easeInCubic",
      easingTime: 250
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);

      options || (options = {});
      this.bestScoreLabel = options.bestScoreLabel;

      this.shareButton = new Backbone.BigShareButton({
        x: Backbone.WIDTH*0.5 - Backbone.BigShareButton.prototype.defaults.width*0.5,
        y: this.getBottom() - Backbone.BigShareButton.prototype.defaults.height*1.4,
        opacity: this.get("opacity")
      });
    },
    onAttach: function() {
      Backbone.Label.prototype.onAttach.apply(this, arguments);
      this.engine.add(this.shareButton);
    },
    onDetach: function() {
      Backbone.Label.prototype.onDetach.apply(this, arguments);
      this.engine.remove(this.shareButton);
    },
    onUpdate: function(dt) {
      this.shareButton.set({opacity: this.get("opacity")});
      return true;
    },
    onDraw: function(context, options) {
      var hero = new Backbone[_.classify(this.bestScoreLabel.get("miamSprite"))],
          b = this.toJSON(),
          x = b.x,
          y = b.y,
          fruits = this.bestScoreLabel.get("fruits");
      
      // Miam
      var frame = hero.spriteSheet.frames[fruits ? 0 : 3];
      context.drawImage(
        hero.spriteSheet.img,
        frame.x, frame.y, frame.width, frame.height,
        x + b.width*0.05, y + b.height*0.10, frame.width*0.60, frame.height*0.60
      );

      // Titles
      b.textContextAttributes.fillStyle = "rgba(256, 256, 256, " + b.opacity + ")";
      b.textContextAttributes.textAlign = "left";
      b.textContextAttributes.textBaseline = "top";


      b.textContextAttributes.font = Math.floor(frame.height*0.15) + "px arcade";
      b.text = window._lang.get("iCaught");
      b.x = x + b.width*0.42;
      b.y = y + b.height*0.05;
      this.drawText(b, context, options);

      b.textContextAttributes.font = Math.floor(frame.height*0.3) + "px arcade";
      b.text = fruits;
      b.y += Math.floor(frame.height*0.17);
      this.drawText(b, context, options);

      b.textContextAttributes.font = Math.floor(frame.height*0.15) + "px arcade";
      b.text = window._lang.get(fruits > 1 ? "fruits" : "fruit") + "!";
      b.y += Math.floor(frame.height*0.33);
      this.drawText(b, context, options);

      return this;
    }
  });

  Backbone.ConfigPanel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Panel.prototype.defaults)
  });

}).call(this);