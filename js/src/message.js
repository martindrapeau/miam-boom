(function() {

  var deadKeys = ["avoidTheBombs", "ouchStartHurts", "burntToACrisp", "burned", "whatAPredicament"],
      readyKeys = ["touchToStart", "touchToTryAgain"],
      failKeys = ["pleaseCatchTheFruit", "notEvenOne", "fail", "aBabyCouldDoBetter"],
      improveKeys = ["notBad", "niceWork", "gettingBetter", "greatJob", "wayToGo"],
      beatBestKeys = ["newBest", "awesome", "unbelievable", "youAreIncredible"],
      regressKeys = ["betterNextTime", "practiceMakesPerfect", "needsImprovement", "workInProcess", "canYouDoBetter"],
      below10Keys = ["tryToGetAbove10", "below10IsNotGreat", "notEven10"];

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
  failKeys.next = next.bind(failKeys);
  improveKeys.next = next.bind(improveKeys);
  beatBestKeys.next = next.bind(beatBestKeys);
  regressKeys.next = next.bind(regressKeys);
  below10Keys.next = next.bind(below10Keys);


  Backbone.Message = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      name: "message",
      state: "ready",
      easingTime: 250,
      text: window._lang.get("touchToStart"),
      textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes)
    }),
    initialize: function(attributes, options) {
      Backbone.Label.prototype.initialize.apply(this, arguments);

      options || (options = {});
      this.scoreLabel = options.scoreLabel;
      this.bestScoreLabel = options.bestScoreLabel;
      this.bestScoreInSession = 0;
      this.lastScore = 0;
    },
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
          score = this.scoreLabel.get("fruits"),
          key = "youDroppedAFruit",
          hero = this.world.getHero(),
          heroState = hero ? hero.get("state") : null;

      if (heroState == "idle") {
        key = readyKeys.next();
      }
      else if (heroState == "dead") {
        key = deadKeys.next();
      }
      else {
        if (score > best) {
          key = beatBestKeys.next();
        }
        else if (score == 0) {
          key = failKeys.next();
        }
        else if (score >= 50 && score < 60) {
          key = "above50YourAnAce";
        }
        else if (score > this.bestScoreInSession) {
          key = improveKeys.next();
        }
        else if (score < 10) {
          key = below10Keys.next();
        }
        else {
          key = regressKeys.next();
        }
      }

      this.lastScore = score;
      this.bestScoreInSession = Math.max(score, this.bestScoreInSession);

      return window._lang.get(key);
    }
  });

}).call(this);