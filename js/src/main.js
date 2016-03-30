window.START = function() {
  var COCOON = window.navigator.isCocoonJS || window.cordova || false,
      NW = window.process && window.process.versions['node-webkit'],
      CHROME_APP = !NW && window.chrome && window.chrome.app && window.chrome.app.runtime,
      ENV = COCOON || CHROME_APP || NW || window.location.hostname == "www.ludosquest.com" ? "prod" : "dev",
      MOBILE = "onorientationchange" in window ||
        window.navigator.msMaxTouchPoints ||
        window.navigator.isCocoonJS ||
        window.cordova;
  
  var canvas = document.getElementById("foreground"),
      context = canvas.getContext("2d");

  console.log("canvas.width=" + canvas.width + " canvas.height=" + canvas.height);
  console.log("window.innerWidth=" + window.innerWidth + " window.innerHeight=" + window.innerHeight);

  _.extend(Backbone, {
    ENV: ENV,
    COCOON: COCOON,
    NW: NW, 
    CHROME_APP: CHROME_APP,
    MOBILE: MOBILE,
    LSKEY_MUSIC: "ludosquest_music",
    LSKEY_SFX: "ludosquest_sfx",
    LSKEY_LANG: "ludosquest_lang",
    LSKEY_DEVICE_LANG: "ludosquest_device_lang",
    HEIGHT: canvas.height,
    WIDTH: canvas.width,
    OPEN_URL: window.openurl || undefined,
    ROOT_URL: ENV == "prod" ? "http://www.miamboom.com" : "",
    storage: CHROME_APP ? window.chrome.storage : window.localStorage
  });

  Backbone.Controller = Backbone.Model.extend({
    initialize: function(attributes, options) {
      options || (options = {});
      var controller = this;

      var lang = Backbone.storage[Backbone.LSKEY_LANG];
      if (lang) window._lang.setLocale(lang);

      // Create sound effects collection and attach them to existing sprite classes
      this.soundEffects = new Backbone.AudioCollection(Backbone.soundEffectDefinitions).attachToSpriteClasses();

      // Create our sprite sheets and attach them to existing sprite classes
      this.spriteSheets = new Backbone.SpriteSheetCollection(Backbone.spriteSheetDefinitions).attachToSpriteClasses();

      // Create the debug panel
      //this.debugPanel = ENV == "dev" ? new Backbone.DebugPanel({}, {color: "#fff"}) : null;

      // Our world
      this.world = new Backbone.World({
        state: "pause"
      });

      // The game engine
      var engine = this.engine = new Backbone.Engine({
        music: !!JSON.parse(Backbone.storage[Backbone.LSKEY_MUSIC] !== undefined ? Backbone.storage[Backbone.LSKEY_MUSIC] : "true"),
        sfx: !!JSON.parse(Backbone.storage[Backbone.LSKEY_SFX] !== undefined ? Backbone.storage[Backbone.LSKEY_SFX] : "true")
      }, {
        canvas: canvas,
        debugPanel: this.debugPanel
      });
      if (this.debugPanel) this.engine.add(this.debugPanel);

      this.listenTo(this.engine, "change:music", function() {
        Backbone.storage[Backbone.LSKEY_MUSIC] = JSON.stringify(this.engine.get("music"));
      });
      this.listenTo(this.engine, "change:sfx", function() {
        Backbone.storage[Backbone.LSKEY_SFX] = JSON.stringify(this.engine.get("sfx"));
      });

      this.soundEffects.each(function(audio) {
        audio.engine = engine;
        audio.trigger("attach");
      });

      window.addEventListener("resize", _.debounce(this.onResize.bind(this), 300));
      setTimeout(this.onResize.bind(this), 10);

      this.setup();
    },
    onResize: function() {
      canvas.height = Math.round(canvas.width * Math.max(window.innerHeight, window.innerWidth) / Math.min(window.innerHeight, window.innerWidth) );
      console.log("resize: canvas.width=" + canvas.width + " canvas.height=" + canvas.height);
      Backbone.HEIGHT = canvas.height;
      this.world.set({height: Backbone.HEIGHT});
      var hero = this.world.getHero();
      if (hero) hero.set({y: Backbone.HEIGHT - 50 - hero.get("height")});
    },
    setup: function() {

      this.engine.stop();
      this.world.set("state", "pause");

      this.world.set({
        backgroundColor: "#101066",
        width: Backbone.WIDTH,
        height: Backbone.HEIGHT,
        sprites: [{
          name: "miam",
          x: Backbone.WIDTH/2 - Backbone.Miam.prototype.defaults.width/2,
          y: Backbone.HEIGHT - 50 - Backbone.Miam.prototype.defaults.height,
          state: "idle"
        }]
      });
      this.world.spawnSprites();

      this.engine.reset();
      if (this.debugPanel) this.debugPanel.clear();

      this.engine.add(this.world);
      if (this.debugPanel) this.engine.add(this.debugPanel);
      this.engine.set("clearOnDraw", true);
      this.engine.start();

      this.world.set("state", "play");

      return this;
    },
    handleSetLanguage: function(language) {
      var deviceLang = Backbone.storage[Backbone.LSKEY_DEVICE_LANG],
          lang = window._lang.parseLocale(language);
      if (lang && deviceLang != lang) {
        window._lang.setLocale(lang);
        Backbone.storage[Backbone.LSKEY_DEVICE_LANG] = lang;
        this.titleScreenGui.setLanguage(lang);
      }
    }
  });
  
  var controller = new Backbone.Controller();

  // Expose things as globals - easier to debug
  _.extend(window, {
    canvas: canvas,
    context: context,
    controller: controller,
  });

};