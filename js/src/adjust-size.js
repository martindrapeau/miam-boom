(function() {

  // Everything was defined for a width of 320.
  // These functions size up to 640 dynamically.
  // TODO: The classes and instances should probably have functions of their own
  // to properly resize.

  function adjustDefaultsToRatio(cls, options) {
    options || (options = {});
    options.ratio || (options.ratio = Backbone.RATIO);

    var keys = ["width", "height", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "textPadding", "img", "imgUrl", "imgX", "imgY", "imgWidth", "imgHeight"];
    if (!cls.prototype._originalRatioValues) cls.prototype._originalRatioValues = _.pick(cls.prototype.defaults, keys);

    var attrs = _.clone(cls.prototype._originalRatioValues);
    for (var i = 0; i < keys.length; i++)
      if (cls.prototype.defaults[keys[i]]) {
        if (keys[i] == "img") {
          if (options.ratio > 1)
            cls.prototype.defaults[keys[i]] += options.ratio;
        }
        else if (keys[i] == "imgUrl") {
          if (options.ratio > 1)
            cls.prototype.defaults[keys[i]] = cls.prototype.defaults[keys[i]].replace(".png", options.ratio + ".png");
        }
        else {
          cls.prototype.defaults[keys[i]] *= options.ratio;
        }
      }
    cls.prototype.defaults.ratio = options.ratio;
  };

  function adjustSpriteSheetToRatio(o, options) {
    options || (options = {});
    options.ratio || (options.ratio = Backbone.RATIO);

    _.extend(o, {
      ratio: options.ratio,
      x: o.x * options.ratio,
      y: o.y * options.ratio,
      tileWidth: o.tileWidth * options.ratio,
      tileHeight: o.tileHeight * options.ratio
    });
    if (options.ratio != 1)
      o.imgUrl = o.imgUrl.replace(".png", options.ratio + ".png");
  }

  Backbone.adjustLabelSize = function(sprite, options) {
    options || (options = {});
    options.ratio || (options.ratio = Backbone.RATIO);

    var textContextAttributes = sprite.get("textContextAttributes");
    if (!textContextAttributes) return;

    var fontRe = /(\d+)px/;
    textContextAttributes._font = textContextAttributes._font || textContextAttributes.font;
    var matches = textContextAttributes.font.match(fontRe);
    if (matches.length == 2)
      textContextAttributes.font = textContextAttributes._font.replace(fontRe, matches[1]*options.ratio+"px");
  }

  Backbone.adjustSizes = function() {
    var allFruitNames = _.union(Backbone.fruitNames, ["Star"]);
    var classes = _.union(
      [
        "Miam", "Furry", "Pinky", "Garfield",
        "Boom", "Fruit", "Splat", "Puff",
        "Floor",
        "Label", "TitleLabel", "ScoreLabel", "BestScoreLabel", "Message",
        "MiamButton", "ShareButton", "ConfigButton",
        "Scene", "Panel", "ConfigPanel", "BigShareButton"
      ],
      _.map(allFruitNames, function(fruitName) {return _.classify(fruitName); }),
      _.map(allFruitNames, function(fruitName) {return _.classify(Backbone[_.classify(fruitName)].prototype.defaults.explodeSprite); })
    );
    _.each(classes, function(className) {
      adjustDefaultsToRatio(Backbone[className]);
    });

    Backbone.Floor.prototype.defaults.height = Math.round(Backbone.HEIGHT*0.22);

    var keys = ["velocity", "yVelocity", "yAcceleration"];
    _.each(allFruitNames, function(fruitName) {
      var className = _.classify(fruitName);
      _.each(Backbone[className].prototype.animations, function(animation) {
        _.each(keys, function(key) {
          if (animation[key]) {
            animation["_"+key] = animation["_"+key] || animation[key];
            animation[key] = animation["_"+key] * Backbone.RATIO;
          }
        });
      });
    });

    _.each(Backbone.spriteSheetDefinitions, function(o) {
      adjustSpriteSheetToRatio(o);
    });

    Backbone.World.prototype.defaults.tileWidth *= Backbone.RATIO;
    Backbone.World.prototype.defaults.tileHeight *= Backbone.RATIO;
  }

}).call(this);