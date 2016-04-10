(function() {

  var deadKeys = ["avoidTheBombs", "ouchStartHurts", "burntToACrisp", "burned", "whatAPredicament"],
      readyKeys = ["touchToStart", "touchToTryAgain"],
      failKeys = ["pleaseCatchTheFruit", "notEvenOne", "fail", "aBabyCouldDoBetter"],
      improveKeys = ["notBad", "niceWork", "gettingBetter", "greatJob", "wayToGo"],
      beatBestKeys = ["newBest", "awesome", "unbelievable", "youAreIncredible"],
      regressKeys = ["betterNextTime", "practiceMakesPerfect", "needsImprovement", "workInProcess", "canYouDoBetter"];

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


  Backbone.Message = Backbone.Label.extend({
    defaults: _.extend({}, Backbone.Label.prototype.defaults, {
      name: "message",
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