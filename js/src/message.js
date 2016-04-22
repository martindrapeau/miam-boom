(function() {

  var deadKeys = ["avoidTheBombs", "ouchStartHurts", "burntToACrisp", "burned", "whatAPredicament"],
      readyKeys = ["touchToTryAgain"],
      failKeys = ["pleaseCatchTheFruit", "notEvenOne", "fail", "aBabyCouldDoBetter"],
      improveKeys = ["notBad", "niceWork", "gettingGood", "greatJob", "wayToGo", "youAreAChampion"],
      beatBestKeys = ["newBest", "awesome", "unbelievable", "youAreIncredible"],
      regressKeys = ["betterNextTime", "practiceMakesPerfect", "needsImprovement", "workInProcess", "canYouDoBetter"],
      below10Keys = ["tryToGetAbove10", "below10IsNotGreat", "notEven10"];

  function next() {
    this.nextIndex || (this.nextIndex = 0);
    if (this.nextIndex >= this.length) this.nextIndex = 0;
    var result = this[this.nextIndex];
    this.nextIndex += 1;
    return result;
  }
  deadKeys.next = next.bind(deadKeys);
  readyKeys.next = next.bind(readyKeys);
  failKeys.next = next.bind(failKeys);
  improveKeys.next = next.bind(improveKeys);
  beatBestKeys.next = next.bind(beatBestKeys);
  regressKeys.next = next.bind(regressKeys);
  below10Keys.next = next.bind(below10Keys);


  Backbone.Message = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      name: "message",
      state: "busy",
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
      this.readyCount = 0;
    },
    show: function(options) {
      options || (options = {});
      this.set({
        state: "busy",
        text: this.findBestLabel(options),
        opacity: 1
      });
      this.fadeIn(function() {
        if (options.start || options.interlude) this.set({state: "ready"});
        if (!options.start)
          this.wait(1500, function() {
            this.fadeOut(options.interlude ? undefined : this.ready);
          });
      });
      this.trigger("show");
    },
    ready: function() {
      var best = this.bestScoreLabel.get("prevFruits"),
          score = this.scoreLabel.get("fruits"),
          key = score > best ? "shareYourNewBest" : readyKeys.next();

      this.readyCount += 1;
      if (key != "shareYourNewBest" && score >= 10 && this.readyCount % 3 == 0) {
        key = "shareYourAchievement";
      }

      this.set({
        state: "ready",
        text: window._lang.get(key)
      });
      this.fadeIn(function() {
        if (key == "shareYourNewBest" || key == "shareYourAchievement")
          this.engine.trigger("pulse-share-button");
      }.bind(this));
    },
    findBestLabel: function(options) {
      options || (options = {});

      var best = this.bestScoreLabel.get("prevFruits"),
          score = this.scoreLabel.get("fruits"),
          key = "youDroppedAFruit",
          hero = this.world.getHero(),
          heroState = hero ? hero.get("state") : null;

      if (options.start) {
        key = "touchToStart";
      }
      else if (options.bonus) {
        key = "bonusRound";
      }
      else if (score > 10 && score > best) {
        key = beatBestKeys.next();
      }
      else if (heroState == "dead") {
        key = deadKeys.next();
      }
      else {
        if (score == 0) {
          key = failKeys.next();
        }
        else if (score >= 50 && score < 60) {
          key = "above50YourAnAce";
        }
        else if (score < 10) {
          key = below10Keys.next();
        }
        else if (options.interlude) {
          key = improveKeys.next();
        }
        /*else if (score > this.bestScoreInSession) {
          key = improveKeys.next();
        }*/
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