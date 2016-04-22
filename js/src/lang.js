(function() {

  window._lang = {
    default: "en",
    get: function(key, lang) {
      lang || (lang = window._lang.default);
      return window._lang[lang][key];
    },
    parseLocale: function(locale) {
      var lang = locale.slice(0, 2);
      if (_.isObject(window._lang[lang])) return lang;
      return undefined;
    },
    setLocale: function(locale) {
      var lang = window._lang.parseLocale(locale);
      if (lang) window._lang.default = lang;
      return window._lang.default;
    },
    rotate: function() {
      var langs = _.filter(_.keys(window._lang), function(prop) {
            return prop.length == 2;
          }),
          index = _.indexOf(langs, window._lang.default) + 1;
      if (index >= langs.length) index = 0;
      window._lang.default = langs[index];
      return window._lang.default;
    },
    en: {
      languageName: "English", 
      title: "Miam Boom!",
      avoidTheBombs: "Avoid the bombs!",
      readyToEatFruit: "Ready to eat fruit?",
      touchToStart: "Touch to start",
      touchToTryAgain: "Touch to try again",
      youDroppedAFruit: "You dropped a fruit",
      tryAgain: "Try again",
      niceWork: "Nice work!",
      gettingGood: "Getting good!",
      greatJob: "Great job!",
      wayToGo: "Way to go!",
      youAreAChampion: "You are a champion!",
      youCanDoBetter: "You can do better!",
      newBest: "New best!",
      awesome: "Awesome!",
      unbelievable: "Unbelievable!",
      notBad: "Not Bad!",
      youAreIncredible: "You are incredible!",
      shareYourNewBest: "Share your new best",
      shareYourAchievement: "Share your achievement",
      betterNextTime: "Better luck next time",
      practiceMakesPerfect: "Practice makes perfect!",
      aBabyCouldDoBetter: "A baby could do better!",
      needsImprovement: "Needs improvement!",
      canYouDoBetter: "Can you do better?",
      workInProcess: "Work in progress",
      ouchStartHurts: "Ouch that hurts!",
      burntToACrisp: "Burnt to a crisp!",
      burned: "Burned!",
      whatAPredicament: "What a predicament!",
      pleaseCatchTheFruit: "Please catch the fruit",
      notEvenOne: "Not even one?",
      fail: "Fail!",
      tryToGetAbove10: "Try to get above 10",
      below10IsNotGreat: "Below 10 is not great",
      notEven10: "Not even 10! Come on...",
      above50YourAnAce: "50+ you're an ace!",
      rotateYourScreen: "Rotate your screen",
      bestScore: "Best: {0}",
      about: "By Émilia, Ludovic & Martin",
      loading: "Loading...",
      newGame: "New game",
      continue: "Continue",
      level: "Level",
      levelNo: "Level {0}",
      levels: "Levels",
      exit: "Exit",
      yes: "Yes",
      no: "No",
      cancel: "Cancel",
      pause: "Pause",
      rip: "R.I.P.",
      levelComplete: "Complete!",
      storyAndCoding: "Story & Coding",
      graphics: "Graphics",
      musicAndSoundEffects: "Music & Sound Effects",
      builtWith: "Built with Backbone Game Engine",
      highScore: "High Score",
      levelEditor: "Level Editor",
      whatIsYourName: "Your Name?",
      enterYourName: "Enter your name.",
      success: "Success!",
      pleaseWait: "Please wait...",
      error: "Error",
      errorWithMessage: "Error: {0}",
      notYetImplemented: "Not yet implemented",
      share: "Share",
      iCaught: "I caught",
      fruits: "fruits",
      fruit: "fruit",
      bonusRound: "Bonus round!"
    }
  };
  
}).call(this);