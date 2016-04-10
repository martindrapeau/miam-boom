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
    })
  });

  Backbone.Panel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      x: 0,
      y: 0,
      width: 320,
      height: Backbone.HEIGHT/2,
      backgroundColor: "#000",
      opacity: 0.8,
      text: "",
      easing: "easeInCubic",
      easingTime: 400
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);
      this.set({
        y: -Backbone.HEIGHT/2,
        showX: 0,
        showY: 0,
        hideX: 0,
        hideY: -Backbone.HEIGHT/2,
        width: Backbone.WIDTH,
        height: Backbone.HEIGHT/2
      });
      options || (options = {});
      this.world = options.world;
      this.music = options.music;
      _.bindAll(this, "show", "hide");
    },
    show: function(callback) {
      this.moveTo(this.get("showX"), this.get("showY"), callback);
      return this;
    },
    hide: function(callback) {
      this.moveTo(this.get("hideX"), this.get("hideY"), callback);
      return this;
    },
    onRender: function(context, options) {

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
      options || (options = {});
      this.world = options.world;
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


  var deadKeys = ["avoidTheBombs", "ouchStartHurts", "burntToACrisp", "burned", "whatAPredicament"],
      readyKeys = ["touchToStart", "touchToTryAgain"],
      failKeys = ["pleaseCatchTheFruit", "notEvenOne", "fail", "aBabyCouldDoBetter"],
      improveKeys = ["notBad", "niceWork", "gettingBetter", "greatJob", "wayToGo"],
      beatBestKeys = ["newBest", "awesome", "unbelievable", "youAreIncredible"],
      regressKeys = ["betterNextTime", "practiceMakesPerfect", "needsImprovement", "workInProcess", "canYouDoBetter", ];
  function nextSkipFirst() {
    this.nextIndex || (this.nextIndex = 0);
    if (this.nextIndex >= this.length) this.nextIndex = 1;
    var result = this[this.nextIndex];
    this.nextIndex += 1;
    return result;
  }
  deadKeys.next = nextSkipFirst.bind(deadKeys);
  readyKeys.next = nextSkipFirst.bind(readyKeys);
  function next() {
    this.nextIndex || (this.nextIndex = 0);
    if (this.nextIndex >= this.length) this.nextIndex = 0;
    var result = this[this.nextIndex];
    this.nextIndex += 1;
    return result;
  }
  failKeys.next = nextSkipFirst.bind(failKeys);
  improveKeys.next = nextSkipFirst.bind(improveKeys);
  beatBestKeys.next = nextSkipFirst.bind(beatBestKeys);
  regressKeys.next = nextSkipFirst.bind(regressKeys);

  Backbone.StartLabel = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      state: "ready",
      easingTime: 250
    }),
    bestInSession: 0,
    start: function(options) {
      options || (options = {});
      this.set({
        ready: false,
        text: this.findBestLabel(),
        opacity: 1
      });
      this.fadeIn(function() {
        if (!options.start)
          this.wait(function() {
            this.fadeOut(this.ready);
          }, 1500);
      });
    },
    ready: function() {
      this.set({
        ready: true,
        text: window._lang.get(readyKeys.next())
      });
      this.fadeIn();
    },
    findBestLabel: function() {
      var best = this.bestScoreLabel.get("fruits"),
          score = this.fruitLabel.get("fruits"),
          last = this.fruitLabel.get("lastFruits"),
          key = "youDroppedAFruit",
          hero = this.world.getHero(),
          heroState = hero ? hero.get("state") : null;

      if (heroState == "idle") {
        key = readyKeys.next();
      }
      else if (heroState == "dead") {
        key = deadKeys.next();
      } else {
        if (score > best) {
          key = beatBestKeys.next();
        }
        else if (score == 0) {
          key = failKeys.next();
        }
        else if (score > this.bestInSession) {
          key = improveKeys.next();
        }
        else {
          key = regressKeys.next();
        }
      }

      this.bestInSession = Math.max(score, this.bestInSession);

      return window._lang.get(key);
    }
  });

}).call(this);