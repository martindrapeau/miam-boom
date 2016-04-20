(function() {


  Backbone.BigShareButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      name: "share-button",
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
      imgX: 270, imgY: 180, imgWidth: 270, imgHeight: 270,
      backgroundColor: "transparent",
      opacity: 1.0,
      text: "",
      easing: "easeInCubic",
      easingTime: 250,
      fruits: 0,
      miam: "furry"
    }),
    onDraw: function(context, options) {
      var hero = this.world.getHero(),
          b = this.toJSON(),
          x = b.x,
          y = b.y,
          fruits = this.world.get("fruits");
      
      // Miam
      var frame = hero.spriteSheet.frames[fruits ? 0 : 3];
      context.drawImage(
        hero.spriteSheet.img,
        frame.x, frame.y, frame.width, frame.height,
        x + b.width*0.05, y + b.height*0.10, frame.width*0.65, frame.height*0.65
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
      b.y += Math.floor(frame.height*0.15);
      this.drawText(b, context, options);

      b.textContextAttributes.font = Math.floor(frame.height*0.15) + "px arcade";
      b.text = window._lang.get(fruits > 1 ? "fruits" : "fruit") + "!";
      b.y += Math.floor(frame.height*0.33);
      this.drawText(b, context, options);

      return this;
    }
  });

}).call(this);