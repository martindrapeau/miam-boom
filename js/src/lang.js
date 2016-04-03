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
      touchToStart: "Touch to start",
      rotateYourScreen: "Rotate your screen",
      bestScore: "Best Score: {0}",
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
      errorWithMessage: "Error: {0}"
    }
  };
  
}).call(this);