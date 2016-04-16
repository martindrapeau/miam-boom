(function() {

  var fontRe = /(\d+)px/;
  function getFontSize(font) {
    var matches = font.match(fontRe);
    return matches.length == 2 ? parseInt(matches[1], 10) : null;
  }
  function sizeFont(font, size) {
    var matches = font.match(fontRe);
    return matches.length == 2 ? font.replace(fontRe, size+"px") : null;
  }

  Backbone.TitleLabel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      name: "title",
      text: window._lang.get("title"),
      fruits: 0,
      textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
        font: "36px arcade"
      }),
      opacity: 0,
      easingTime: 250
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);

      options || (options = {});
      this.message = options.message;
      this.bestScoreLabel = options.bestScoreLabel;
    },
    show: function(options) {
      this.message.set({opacity: 0});

      this.wait(1000, function() {
        this.intro(function() {
          this.wait(500, function() {
            this.retract(36*Backbone.RATIO, 0, 18*Backbone.RATIO);
            if (this.world.get("state") == "pause") {
              this.message.show(options);
              this.bestScoreLabel.show(options);
            }
          });
        });
      });
    },
    intro: function(callback) {
      this._animation = "intro";
      this._startTime = _.now();
      this._callback = callback;
      this.set({scale: 0, opacity: 1});
      this._animationUpdateFn = function(dt) {
        var now = _.now(),
            easing = "easeOutQuint",
            easingTime = 1000;
        if (now < this._startTime + easingTime) {
          var scale = 0.4+Backbone.EasingFunctions[easing]((now - this._startTime) / easingTime);
          if (scale >= 1.2) scale = 1.0 + (1.4-scale);
          this.set("scale", scale);
        } else {
          if (typeof this._callback == "function") _.defer(this._callback.bind(this));
          this.set({scale: 1.0}, {silent: true});
          this.clearAnimation();
        }
      };
      return this;
    },
    retract: function(x, y, fontSize, callback) {
      this._animation = "retract";
      this._startTime = _.now();
      this._callback = callback;

      var textContextAttributes = this.get("textContextAttributes");
      this._startFont = textContextAttributes ? this.get("textContextAttributes").font : null;
      this._startFontSize = getFontSize(this._startFont);
      this._targetFont = this._startFontSize ? this._startFont.replace(fontRe, fontSize+"px") : null;
      this._deltaFontSize = this._startFontSize != null && fontSize != null ? fontSize - this._startFontSize : 0;

      this._startX = this.get("x");
      this._startY = this.get("y");
      this._targetX = x;
      this._targetY = y;

      this._animationUpdateFn = function(dt) {
        var now = _.now(),
            easing = "easeOutQuint",
            easingTime = 1000,
            textContextAttributes = this.get("textContextAttributes");

        if (now < this._startTime + easingTime) {
          var factor = Backbone.EasingFunctions[easing]((now - this._startTime) / easingTime);
          this.set({
            x: this._startX + factor * (this._targetX - this._startX),
            y: this._startY + factor * (this._targetY - this._startY)
          });
          if (this._startFontSize) textContextAttributes.font = sizeFont(this._startFont, Math.floor(this._startFontSize + this._deltaFontSize*factor));
          this.textMetrics = undefined;
        } else {
          if (typeof this._callback == "function") _.defer(this._callback.bind(this));
          this.set({x: this._targetX, y: this._targetY}, {silent: true});
          if (this._targetFont) textContextAttributes.font = this._targetFont;
          this.clearAnimation();
        }
      };

      return this;
    }
  });

}).call(this);