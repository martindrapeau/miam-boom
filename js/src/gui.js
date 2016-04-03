(function() {

  Backbone.Element.prototype.positionAndShowLinkEl = function(el, button, delay) {
    if (!el) return this;
    delay || (delay = button.get("easingTime"));

    if (el.linkElTimerId) {
      clearTimeout(el.linkElTimerId);
      el.linkElTimerId = undefined;
    }
    el.linkElTimerId = setTimeout(function() {
      this.positionLinkEl(el, button);
      el.style.display = "block";
    }.bind(this), delay);

    return this;
  };

  Backbone.Element.prototype.positionLinkEl = function(el, button) {
    if (!el) return this;
    el.style.left = parseInt(((this.engine.canvas.style.left || 0)+"").replace("px", ""), 10) + button.get("x") + "px";
    el.style.top = button.get("y") + "px";
    return this;
  };

  Backbone.Element.prototype.hideLinkEl = function(el, button) {
    if (!el) return this;

    if (el.linkElTimerId) {
      clearTimeout(el.linkElTimerId);
      el.linkElTimerId = undefined;
    }
    el.style.display = "none";

    return this;
  };
  
  Backbone.Label = Backbone.Element.extend({
    defaults: _.extend({}, Backbone.Element.prototype.defaults, {
      x: 432,
      y: 400,
      width: 80,
      height: 50,
      backgroundColor: "transparent",
      text: "",
      textPadding: 12,
      textContextAttributes: {
        fillStyle: "#FFFFFF",
        font: "30px arcade",
        textBaseline: "middle",
        fontWeight: "normal",
        textAlign: "center"
      },
      easing: "easeInCubic",
      easingTime: 400
    })
  });
  
  Backbone.LabelButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      x: 432,
      y: 400,
      width: 160,
      height: 100,
      backgroundColor: "transparent",
      text: "",
      textPadding: 12,
      textContextAttributes: {
        fillStyle: "#FFFFFF",
        font: "40px arcade",
        textBaseline: "middle",
        fontWeight: "normal",
        textAlign: "center"
      },
      easing: "easeInCubic",
      easingTime: 400
    })
  });

  Backbone.Scene = Backbone.Element.extend({
    defaults: _.extend({}, Backbone.Element.prototype.defaults, {
      x: 0,
      y: 0,
      width: 1024,
      height: 768,
      backgroundColor: "#000",
      opacity: 0,
      text: "",
      easing: "easeInCubic",
      easingTime: 400
    }),
    initialize: function(attributes, options) {
      Backbone.Element.prototype.initialize.apply(this, arguments);
      this.set({
        width: Backbone.WIDTH,
        height: Backbone.HEIGHT
      });
      options || (options = {});
      this.saved = options.saved;
      this.world = options.world;
      this.levels = options.levels;
      this.pauseButton = options.pauseButton;
      this.input = options.input;
      this.music = options.music;
      _.bindAll(this, "enter", "exit");
    },
    enter: function(callback) {
      this.set("opacity", 0);
      this.fadeIn(callback);
      return this;
    },
    exit: function(callback) {
      this.set("opacity", 1);
      this.fadeOut(callback);
      return this;
    }
  });

}).call(this);