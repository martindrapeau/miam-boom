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
    LSKEY_MUSIC: "miamboom_music",
    LSKEY_SFX: "miamboom_sfx",
    LSKEY_LANG: "miamboom_lang",
    LSKEY_DEVICE_LANG: "miamboom_device_lang",
    LSKEY_BEST_SCORE: "miamboom_best_score",
    HEIGHT: canvas.height,
    WIDTH: canvas.width,
    OPEN_URL: window.openurl || undefined,
    ROOT_URL: ENV == "prod" ? "http://www.miamboom.com" : "",
    storage: CHROME_APP ? window.chrome.storage : window.localStorage
  });

  Backbone.Controller = Backbone.Model.extend({
    initialize: function(attributes, options) {
      options || (options = {});

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
      this.world.sprites.on("landed", this.onWorldSpriteLanded, this);


      // GUI
      this.titleLabel = new Backbone.Label({
        x: 0,
        y: 0,
        text: window._lang.get("title"),
        fruits: 0,
        textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
          font: "20px arcade",
          textAlign: "left"
        })
      });

      this.startLabel = new Backbone.Label({
        x: Backbone.WIDTH/2 - Backbone.Label.prototype.defaults.width/2,
        y: Backbone.HEIGHT/2 - Backbone.Label.prototype.defaults.height,
        text: window._lang.get("touchToStart")
      });

      this.aboutLabel = new Backbone.Label({
        x: Backbone.WIDTH/2 - Backbone.Label.prototype.defaults.width/2,
        y: 80,
        height: 30,
        text: window._lang.get("about"),
        textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
          font: "16px arcade",
          fillStyle: "#606099"
        })
      });

      this.fruitLabel = new Backbone.Label({
        x: Backbone.WIDTH/2 - Backbone.Label.prototype.defaults.width/2,
        y: 80,
        text: "",
        fruits: 0,
        textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
          font: "80px arcade"
        })
      });
      this.world.on("change:fruits", this.updateCurrentScore, this);

      var bestScore = JSON.parse(Backbone.storage[Backbone.LSKEY_BEST_SCORE] || "0");
      this.bestScoreLabel = new Backbone.Label({
        x: Backbone.WIDTH - 10 - Backbone.Label.prototype.defaults.width,
        y: 0,
        fruits: bestScore,
        text: bestScore > 0 ? window._lang.get("bestScore").replace("{0}", bestScore) : "",
        textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
          font: "16px arcade",
          textAlign: "right",
          fillStyle: "#D0D0D0"
        })
      });
      this.world.on("change:state", this.updateBestScore, this);

      this.rotateLabel = new Backbone.Label({
        x: Backbone.WIDTH/2 - Backbone.Label.prototype.defaults.width/2,
        y: Backbone.Label.prototype.defaults.height,
        text: window._lang.get("rotateYourScreen"),
        opacity: 0
      });


      // The game engine
      var engine = this.engine = new Backbone.Engine({
        music: !!JSON.parse(Backbone.storage[Backbone.LSKEY_MUSIC] !== undefined ? Backbone.storage[Backbone.LSKEY_MUSIC] : "true"),
        sfx: !!JSON.parse(Backbone.storage[Backbone.LSKEY_SFX] !== undefined ? Backbone.storage[Backbone.LSKEY_SFX] : "true"),
        tapMoveTolerance: 50
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


      // Get things going
      this.setup();
      this.pause();
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

      this.engine.add([this.world, this.fruitLabel, this.bestScoreLabel, this.rotateLabel, this.aboutLabel, this.titleLabel]);
      if (this.debugPanel) this.engine.add(this.debugPanel);
      this.engine.set("clearOnDraw", true);
      this.engine.start();

      this.world.set("state", "play");
      this.throwFruit({skip:true});

      return this;
    },
    pause: function() {
      this.world.clearTimeout(this.throwFruitTimeoutId);
      this.world.set("state", "pause");
      this.engine.add(this.startLabel);
      this.listenTo(this.engine, "tap", this.start);
    },
    start: function() {
      if (this.rotateLabel.get("opacity") == 1) return;
      this.stopListening(this.engine, "tap", this.start);
      this.setup();
    },
    throwFruit: function(options) {
      options || (options = {});
      var hero = this.world.getHero();

      if (hero && !hero.isDisabled() && !options.skip) {

        var index = Math.floor((Backbone.fruitNames.length-0.01)*Math.random()),
            fruitName = Backbone.fruitNames[index],
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
      }

      var fruits = this.world.get("fruits"),
          startDelay = Math.max(150, 350 - fruits * 2),
          deltaDelay = Math.max(500, 1500 - fruits * 20),
          delay = Math.floor(startDelay + deltaDelay*Math.random());
      console.log("throwFruit in", delay);
      this.throwFruitTimeoutId = this.world.setTimeout(this.throwFruit.bind(this), delay);
    },
    onWorldSpriteRemoved: function(sprite, world, options) {
      var name = sprite.get("name"),
          type = sprite.get("type"),
          hero = this.world.getHero();

      if (type != "fruit" || !hero || hero.isDisabled()) return;

      if (options && options.eaten) {
        if (name == "bomb") {
          hero.set("state", "dead");
          this.world.clearTimeout(this.throwFruitTimeoutId);
          this.world.setTimeout(this.pause.bind(this), 1500);
        } else {
          var fruits = this.world.get("fruits") + 1;
          this.world.set("fruits", fruits);
        }
      }
    },
    onWorldSpriteLanded: function(sprite) {
      var name = sprite.get("name"),
          type = sprite.get("type"),
          hero = this.world.getHero();

      if (type != "fruit" || !hero || hero.isDisabled()) return;

      if (name != "bomb") {
        hero.set("state", "sad");
        this.world.clearTimeout(this.throwFruitTimeoutId);
        this.world.setTimeout(this.pause.bind(this), 1500);
      }
    },
    updateCurrentScore: function() {
      var fruits = this.world.get("fruits");
      this.fruitLabel.set({
        fruits: fruits,
        text: fruits > 0 ? fruits : ""
      });
      return this;
    },
    updateBestScore: function() {
      var state = this.world.get("state"),
          newScore = this.world.get("fruits"),
          bestScore = this.bestScoreLabel.get("fruits");
      if (state == "pause" && newScore > bestScore) {
        this.bestScoreLabel.set({
          fruits: newScore,
          text: newScore > 0 ? window._lang.get("bestScore").replace("{0}", newScore) : ""
        });
        Backbone.storage[Backbone.LSKEY_BEST_SCORE] = JSON.stringify(newScore);
      }
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

      this.aboutLabel.set("y", Backbone.HEIGHT - this.aboutLabel.get("height"));
      this.startLabel.set("y", Math.roud(3*(Backbone.HEIGHT - 100 - Backbone.Miam.prototype.defaults.height)/4));

      var rotate = Backbone.MOBILE && window.innerHeight < window.innerWidth;
      this.rotateLabel.set("opacity", rotate ? 1 : 0);
      this.fruitLabel.set("opacity", rotate ? 0 : 1);
      this.fruitLabel.set("opacity", rotate ? 0 : 1);
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