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
      this.world.sprites.on("remove", this.onWorldSpriteRemoved, this);

      this.startButton = new Backbone.LabelButton({
        x: Backbone.WIDTH/2 - Backbone.LabelButton.prototype.defaults.width/2,
        y: 100,
        text: "START"
      });
      this.startButton.on("tap", this.start, this);

      this.pauseButton = new Backbone.LabelButton({
        x: 10,
        y: 0,
        width: 80,
        height: 50,
        text: "PAUSE",
        textContextAttributes: _.extend({}, Backbone.LabelButton.prototype.defaults.textContextAttributes, {
          font: "20px arcade"
        })
      });
      this.pauseButton.on("tap", this.pause, this);

      this.fruitLabel = new Backbone.Label({
        x: Backbone.WIDTH - 10 - Backbone.Label.prototype.defaults.width,
        y: 0,
        text: 0
      });
      this.world.on("change:fruits", function() {
        this.fruitLabel.set("text", this.world.get("fruits"));
      }, this);

      // Lots of fruits and bombs, but only one clock
      this.fruitNames = _.without(Backbone.fruitNames, "clock");
      this.fruitNames = this.fruitNames.concat(this.fruitNames).concat(this.fruitNames).concat(Backbone.fruitNames);

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
      this.pause();
    },
    onResize: function() {
      canvas.height = Backbone.MOBILE ? Math.round(canvas.width * Math.max(window.innerHeight, window.innerWidth) / Math.min(window.innerHeight, window.innerWidth) ) : Math.min(window.innerHeight, 568);
      console.log("resize: canvas.width=" + canvas.width + " canvas.height=" + canvas.height);
      Backbone.HEIGHT = canvas.height;
      this.world.set({height: Backbone.HEIGHT});

      this.world.sprites.each(function(sprite) {
        var name = sprite.get("name");
        switch(name) {
          case "miam":
            sprite.set({y: Backbone.HEIGHT - 100 - sprite.get("height")});
            break;
          case "floor":
            sprite.set({y: Backbone.HEIGHT - sprite.get("height")});
            break;
        }
      });
    },
    setup: function() {

      this.engine.stop();
      this.world.set("state", "pause");

      this.world.set({
        backgroundColor: "#101066",
        width: Backbone.WIDTH,
        height: Backbone.HEIGHT,
        sprites: [{
          name: "floor",
          x: 0,
          y: Backbone.HEIGHT - Backbone.Floor.prototype.defaults.height
        }, {
          name: "miam",
          x: Backbone.WIDTH/2 - Backbone.Miam.prototype.defaults.width/2,
          y: Backbone.HEIGHT - 100 - Backbone.Miam.prototype.defaults.height
        }],
        fruits: 0,
        time: 15000
      });
      this.world.spawnSprites();
      this.world.getHero().debugPanel = this.debugPanel;

      this.engine.reset();
      if (this.debugPanel) this.debugPanel.clear();

      this.engine.add([this.world, this.fruitLabel]);
      if (this.debugPanel) this.engine.add(this.debugPanel);
      this.engine.set("clearOnDraw", true);
      this.engine.start();

      this.world.set("state", "play");

      this.listenTo(this.engine, "touchstart", this.throwFruit);
      this.listenTo(this.engine, "touchend", this.throwFruit);

      return this;
    },
    pause: function() {
      this.world.set("state", "pause");
      this.stopListening(this.engine, "touchstart");
      this.stopListening(this.engine, "touchend");
      this.engine.remove(this.pauseButton);
      this.engine.add(this.startButton);
    },
    start: function() {
      this.setup();
      this.engine.add(this.pauseButton);
    },
    throwFruit: function(e) {
      if (e.canvasY < Backbone.HEIGHT/3) return;

      var hero = this.world.getHero();
      if (!hero || hero.isDisabled()) return;

      var index = Math.floor((this.fruitNames.length-0.01)*Math.random()),
          fruitName = this.fruitNames[index],
          fruitClass = Backbone[_.classify(fruitName)],
          halfWidth = fruitClass.prototype.defaults.width/2,
          dir = Math.random() < 0.5 ? "right" : "left",
          x =  dir == "right" ? -halfWidth : Backbone.WIDTH-halfWidth,
          y = Math.round(100*Math.random()),
          yVelocity = Math.round(-500*Math.random());

      var fruit = new fruitClass({
        x: x,
        y: y,
        state: fruitClass.prototype.buildState("fall", dir),
        yVelocity: yVelocity
      });

      this.world.add(fruit);
    },
    onWorldSpriteRemoved: function(sprite, world, options) {
      var name = sprite.get("name"),
          type = sprite.get("type"),
          hero = this.world.getHero();

      if (type != "fruit" || !hero || hero.isDisabled()) return;

      if (options && options.eaten) {
        if (name == "bomb") {
          hero.set("state", "dead");
          this.world.setTimeout(this.pause.bind(this), 1500);
          return;
        }

        var fruits = this.world.get("fruits") + 1;
        this.world.set("fruits", fruits);
        this.fruitLabel.set("text", fruits);
        return;
      }

      if (name != "bomb" && name != "clock") {
        hero.set("state", "sad");
        this.world.setTimeout(this.pause.bind(this), 1500);
      }

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