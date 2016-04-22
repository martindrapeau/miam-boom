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

  // Default width is 320, as used on desktop. On mobile use 640.
  var ratio = MOBILE || window.innerHeight >= 960 ? 2 : 1,
      aspectRatio = Math.max(window.screen.width, window.screen.height) / Math.min(window.screen.width, window.screen.height);
  canvas.width = 320 * ratio;
  canvas.height = ratio * 568;
  console.log("canvas.width=" + canvas.width + " canvas.height=" + canvas.height);
  console.log("window.innerWidth=" + window.innerWidth + " window.innerHeight=" + window.innerHeight);


  // Globals are saved in the Backbone namespace
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
    LSKEY_MIAM: "miamboom_miam",
    HEIGHT: canvas.height,
    WIDTH: canvas.width,
    OPEN_URL: window.openurl || undefined,
    ROOT_URL: ENV == "prod" ? "http://www.miamboom.com" : "",
    RATIO: ratio,
    storage: CHROME_APP ? window.chrome.storage : window.localStorage
  });


  Backbone.Controller = Backbone.Model.extend({
    initialize: function(attributes, options) {
      options || (options = {});

      // Handle resizing
      window.addEventListener("resize", _.debounce(this.onResize.bind(this), 300));
      this.onResize();
      Backbone.adjustSizes();


      var lang = Backbone.storage[Backbone.LSKEY_LANG];
      if (lang) window._lang.setLocale(lang);

      // Create sound effects collection and attach them to existing sprite classes
      this.soundEffects = new Backbone.AudioCollection(Backbone.soundEffectDefinitions).attachToSpriteClasses();

      // Create our sprite sheets and attach them to existing sprite classes
      this.spriteSheets = new Backbone.SpriteSheetCollection(Backbone.spriteSheetDefinitions).attachToSpriteClasses();

      // Create the debug panel. Comment out not to have one.
      //this.debugPanel = ENV == "dev" ? new Backbone.DebugPanel({}, {color: "#fff"}) : null;

      // Our world
      this.world = new Backbone.World({
        state: "pause",
        backgroundColor: "rgba(0, 161, 203, 1)",
      });
      this.world.sprites.on("remove", this.onWorldSpriteRemoved, this);
      this.world.sprites.on("landed", this.onWorldSpriteLanded, this);


      // GUI
      this.aboutLabel = new Backbone.Label({
        x: Backbone.WIDTH/2 - Backbone.Label.prototype.defaults.width/2,
        y: 80,
        height: Backbone.Label.prototype.defaults.height/2,
        text: window._lang.get("about"),
        textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
          font: "16px arcade",
          fillStyle: "rgba(140, 140, 240, 1)"
        })
      });
      Backbone.adjustLabelSize(this.aboutLabel);

      this.scoreLabel = new Backbone.ScoreLabel({
        x: Backbone.WIDTH/2 - Backbone.ScoreLabel.prototype.defaults.width/2,
        y: Math.round(Backbone.HEIGHT*0.25)
      }, {
        world: this.world
      });
      Backbone.adjustLabelSize(this.scoreLabel);

      this.bestScoreLabel = new Backbone.BestScoreLabel({
        x: Backbone.WIDTH - 10 - Backbone.BestScoreLabel.prototype.defaults.width,
        y: 0,
        opacity: 0
      }, {
        world: this.world
      });
      Backbone.adjustLabelSize(this.bestScoreLabel);

      this.message = new Backbone.Message({
        x: Backbone.WIDTH/2 - Backbone.Message.prototype.defaults.width/2,
        y: Backbone.HEIGHT/2 - Backbone.Message.prototype.defaults.height
      }, {
        world: this.world,
        scoreLabel: this.scoreLabel,
        bestScoreLabel: this.bestScoreLabel
      });
      Backbone.adjustLabelSize(this.message);

      this.titleLabel = new Backbone.TitleLabel({
        x: Backbone.WIDTH/2 - Backbone.Label.prototype.defaults.width/2,
        y: Math.round(Backbone.HEIGHT*0.25),
      }, {
        world: this.world,
        message: this.message,
        bestScoreLabel: this.bestScoreLabel
      });
      Backbone.adjustLabelSize(this.titleLabel);

      this.miamButton = new Backbone.MiamButton({
        x: Backbone.WIDTH*0.1,
        y: Backbone.HEIGHT*0.08,
        opacity: 0
      }, {
        world: this.world
      });

      this.configButton = new Backbone.ConfigButton({
        x: Backbone.WIDTH*0.9 - Backbone.ConfigButton.prototype.defaults.width,
        y: Backbone.HEIGHT*0.08,
        opacity: 0
      }, {
        world: this.world
      });

      this.shareButton = new Backbone.ShareButton({
        x: Backbone.WIDTH*0.5 - Backbone.ShareButton.prototype.defaults.width*0.5,
        y: Backbone.HEIGHT*0.08,
        opacity: 0
      }, {
        world: this.world
      });

      this.panel = new Backbone.Panel({
        x: Backbone.WIDTH*0.5 - Backbone.Panel.prototype.defaults.width*0.5,
        y: Backbone.HEIGHT*0.10,
        opacity: 0
      }, {
        world: this.world,
        bestScoreLabel: this.bestScoreLabel
      });

      this.configPanel = new Backbone.ConfigPanel({
        x: Backbone.WIDTH*0.5 - Backbone.ConfigPanel.prototype.defaults.width*0.5,
        y: Backbone.HEIGHT*0.10,
        opacity: 0
      }, {
        world: this.world
      });


      // Fruit throwing AI
      this.ai = new Backbone.Ai({}, {
        world: this.world,
        message: this.message
      });


      // The game engine
      var engine = this.engine = new Backbone.Engine({
        music: !!JSON.parse(Backbone.storage[Backbone.LSKEY_MUSIC] !== undefined ? Backbone.storage[Backbone.LSKEY_MUSIC] : "true"),
        sfx: !!JSON.parse(Backbone.storage[Backbone.LSKEY_SFX] !== undefined ? Backbone.storage[Backbone.LSKEY_SFX] : "true"),
        tapMoveTolerance: 50,
        clearOnDraw: true
      }, {
        canvas: canvas,
        debugPanel: this.debugPanel
      });

      this.engine.add([this.ai, this.world, this.miamButton, this.shareButton, this.configButton, this.panel, this.configPanel]);
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


      // Game events
      this.listenTo(this.engine, "show-panel", function() {
        this.miamButton.hide();
        this.shareButton.hide();
        this.configButton.hide();
        this.panel.show();
      });
      this.listenTo(this.engine, "hide-panel", function() {
        this.panel.hide();
        this.miamButton.show();
        this.shareButton.show();
        this.configButton.show();
      });
      this.listenTo(this.engine, "show-config-panel", function() {
        this.miamButton.hide();
        this.shareButton.hide();
        this.configButton.hide();
        this.configPanel.show();
      });
      this.listenTo(this.engine, "hide-config-panel", function() {
        this.configPanel.hide();
        this.miamButton.show();
        this.shareButton.show();
        this.configButton.show();
      });
      this.listenTo(this.engine, "pulse-share-button", function() {
        this.shareButton.set({pulseDelay: 3000});
      });


      // Get things going
      this.onResize();
      this.setup({skip:true});
      this.pause({start:true});
    },
    setup: function(options) {
      this.engine.stop();
      this.world.set("state", "pause");

      this.world.set({
        width: Backbone.WIDTH,
        height: Backbone.HEIGHT,
        sprites: [{
          name: "floor",
          x: 0,
          y: Backbone.HEIGHT - Backbone.Floor.prototype.defaults.height
        }, {
          name: this.miamButton.get("miamSprite"),
          x: Backbone.WIDTH/2 - Backbone.Miam.prototype.defaults.width/2,
          y: Math.round(Backbone.HEIGHT*0.86) - Backbone.Miam.prototype.defaults.height
        }],
        fruits: 0,
        time: 15000
      });
      this.world.spawnSprites();
      this.world.getHero().debugPanel = this.debugPanel;
      this.world.add([this.scoreLabel, this.bestScoreLabel, this.titleLabel, this.aboutLabel, this.message]);

      if (this.debugPanel) this.debugPanel.clear();
      this.engine.start();

      function go() {
        this.world.set("state", "play");
        this.ai.start(options);
      }
      go.call(this);

      return this;
    },
    pause: function(options) {
      options || (options = {});

      this.world.set("state", "pause");

      if (options.start) {
        this.miamButton.hide();
        this.shareButton.hide();
        this.configButton.hide();
        this.titleLabel.show(options);
      }
      else {
        this.message.show(options);
      }

      this.listenTo(this.message, "change:state", function() {
        if (this.message.get("state") == "ready") {
          this.miamButton.show();
          this.configButton.show();
          this.shareButton.show();
          this.stopListening(this.message, "change:state");
          this.listenTo(this.engine, "touchstart", this.onTouchToStart);
        }
      }.bind(this));
    },
    onTouchToStart: function(e) {
      if (this.panel.get("opacity") && e) {
        if (!this.panel.overlaps({x: e.canvasX, y: e.canvasY})) this.engine.trigger("hide-panel");
        return;
      }
      if (this.configPanel.get("opacity") && e) {
        if (!this.configPanel.overlaps({x: e.canvasX, y: e.canvasY})) this.engine.trigger("hide-config-panel");
        return;
      }
      if (e && e.canvasY < this.message.get("y")) return;
      this.stopListening(this.engine, "touchstart", this.onTouchToStart);
      this.setup();
      this.message.hide();
      this.miamButton.hide();
      this.shareButton.hide();
      this.configButton.hide();
    },
    onWorldSpriteRemoved: function(sprite, world, options) {
      var name = sprite.get("name"),
          type = sprite.get("type"),
          hero = this.world.getHero();

      if (type != "fruit" || !hero || hero.isDisabled()) return;

      if (options && options.eaten) {
        if (name == "bomb") {
          hero.set("state", "dead");
          this.ai.stop();
          this.world.setTimeout(this.pause.bind(this), 1500);
        }
        else if (name == "star") {
          this.ai.bonus();
        }
        else {
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

      if (name != "bomb" && name != "star") {
        hero.set("state", "sad");
        this.ai.stop();
        this.panel.set({
          fruits: this.world.get("fruits"),
          miam: this.world.getHero().get("name")
        });
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
    },
    onResize: function() {
      // Adjust height
      canvas.height = Backbone.MOBILE ? Math.round(canvas.width * Math.max(window.innerHeight, window.innerWidth) / Math.min(window.innerHeight, window.innerWidth) ) : Math.min(window.innerHeight, canvas.width*1.775);
      console.log("resize: canvas.width=" + canvas.width + " canvas.height=" + canvas.height);
      Backbone.HEIGHT = canvas.height;

      if (this.world) {
        var controller = this;
        this.world.set({height: Backbone.HEIGHT});
        this.world.sprites.each(function(sprite) {
          var name = sprite.get("name");
          switch(name) {
            case controller.miamButton.get("miamSprite"):
              sprite.set({y: Math.round(Backbone.HEIGHT*0.86) - sprite.get("height")});
              break;
            case "floor":
              sprite.set({y: Backbone.HEIGHT - sprite.get("height")});
              break;
          }
        });
        this.world.requestBackgroundRedraw = true;

        this.aboutLabel.set("y", Backbone.HEIGHT - this.aboutLabel.get("height"));
        this.message.set("y", Math.round(3*(Backbone.HEIGHT - 100 - Backbone.Miam.prototype.defaults.height)/4));
        this.scoreLabel.set("y", Math.round(Backbone.HEIGHT*0.25));
        if (!this.titleLabel.isAnimated() && this.titleLabel.get("y") != 0) this.titleLabel.set("y", Math.round(Backbone.HEIGHT*0.22));
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
