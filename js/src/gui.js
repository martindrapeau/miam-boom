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
        font: "26px arcade",
        textBaseline: "middle",
        fontWeight: "normal",
        textAlign: "center"
      },
      easing: "easeInCubic",
      easingTime: 400
    }),
    initialize: function(attributes, options) {
      Backbone.Element.prototype.initialize.apply(this, arguments);
      options || (options = {});
      this.world = options.world;
      this.music = options.music;
    },
    show: function() {
      if (this.get("opacity") != 1) {
        this.fadeIn();
        this.trigger("show");
      }
    },
    hide: function() {
      if (this.get("opacity")) {
        this.fadeOut();
        this.trigger("hide");
      }
    }
  });

  Backbone.Button.prototype.show = Backbone.Label.prototype.show;
  Backbone.Button.prototype.hide = Backbone.Label.prototype.hide;

  Backbone.ScoreLabel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      name: "score",
      text: "",
      fruits: 0,
      textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
        font: "80px arcade"
      })
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);
      this.listenTo(this.world, "change:fruits", this.updateScore);
    },
    updateScore: function() {
      var fruits = this.world.get("fruits");
      this.set({
        fruits: fruits,
        text: fruits > 0 ? fruits : ""
      });
      return this;
    }
  });

  Backbone.BestScoreLabel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      name: "best-score",
        fruits: 0,
        miamSprite: "furry",
        date: undefined,
        text: "",
        textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
          font: "16px arcade",
          textAlign: "right"
        })
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);

      var record = JSON.parse(Backbone.storage[Backbone.LSKEY_BEST_SCORE] || "0");
      if (typeof record != "object") {
        record = {
          fruits: record,
          miamSprite: "furry",
          date: undefined
        };
      }
      this.set(record);
      this.set({
        text: record.fruits > 0 ? window._lang.get("bestScore").replace("{0}", record.fruits) : "",
        prevFruits: record.fruits
      });

      this.listenTo(this.world, "change:state", this.updateScore);
    },
    updateScore: function() {
      var state = this.world.get("state"),
          newScore = this.world.get("fruits"),
          bestScore = this.get("fruits");
      if (state == "pause" && newScore > bestScore) {
        this.set({
          fruits: newScore,
          prevFruits: bestScore,
          miamSprite: this.world.getHero().get("name"),
          date: new Date(),
          text: newScore > 0 ? window._lang.get("bestScore").replace("{0}", newScore) : ""
        });
        Backbone.storage[Backbone.LSKEY_BEST_SCORE] = JSON.stringify(this.pick(["fruits", "miamSprite", "date"]));
      }
      return this;
    }
  });

  Backbone.Scene = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      x: 0,
      y: 0,
      width: 640,
      height: 960,
      backgroundColor: "#000",
      opacity: 0,
      text: "",
      easing: "easeInCubic",
      easingTime: 400
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);
      this.set({
        width: Backbone.WIDTH,
        height: Backbone.HEIGHT
      });
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