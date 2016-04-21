(function() {

  Backbone.MiamButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      name: "miam-button",
      backgroundColor: "transparent",
      width: 70,
      height: 70,
      img: "#artifacts", imgUrl: "img/artifacts.png",
      imgX: 0, imgY: 180, imgWidth: 70, imgHeight: 70,
      miamSprite: "miam",
      easingTime: 250
    }),
    miams: ["furry", "pinky", "garfield"],
    initialize: function(attributes, options) {
      Backbone.Button.prototype.initialize.apply(this, arguments);

      options || (options = {});
      this.world = options.world;

      var miam = JSON.parse(Backbone.storage[Backbone.LSKEY_MIAM] || JSON.stringify(this.miams[0]));
      this.set({miamSprite: miam});

      this.on("tap", this.onPressed);
    },
    onPressed: function(e) {
      var miam = this.get("miamSprite"),
          index = _.indexOf(this.miams, miam),
          nextMiam = index+1 >= this.miams.length ? this.miams[0] : this.miams[index+1];
      this.set({miamSprite: nextMiam});

      var hero = this.world.getHero();
      if (hero) {
        var cls = _.classify(nextMiam);
        this.world.add(new Backbone[cls]({
          name: nextMiam,
          x: hero.get("x"),
          y: hero.get("y")
        }));
        this.world.remove(hero);
      }

      Backbone.storage[Backbone.LSKEY_MIAM] = JSON.stringify(nextMiam);
    }
  });

  Backbone.ShareButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      name: "share-button",
      backgroundColor: "transparent",
      width: 70,
      height: 70,
      img: "#artifacts", imgUrl: "img/artifacts.png",
      imgX: 70, imgY: 180, imgWidth: 70, imgHeight: 70,
      text: "",
      textPadding: 0,
      textContextAttributes: _.extend({}, Backbone.Label.prototype.defaults.textContextAttributes, {
        font: "48px arcade",
      }),
      easingTime: 250,
      pulseDelay: 0
    }),
    initialize: function(attributes, options) {
      Backbone.Button.prototype.initialize.apply(this, arguments);

      this._lastPulseTime = 0;

      options || (options = {});
      this.world = options.world;

      this.on("tap", this.onPressed);
      this.on("show", this.onShowHide);
      this.on("hide", this.onShowHide);
    },
    onPressed: function(e) {
      this.engine.trigger("show-panel");
    },
    onShowHide: function() {
      this.set({pulseDelay: 0});
    },
    onUpdate: function(dt) {
      var pulseDelay = this.get("pulseDelay"),
          now = _.now();
      if (pulseDelay && now > this._lastPulseTime + pulseDelay && !this.isAnimated()) {
        this._lastPulseTime = now;
        _.defer(function() {
          this.growShrink(function() {
            this.growShrink();
          });
        }.bind(this));
      }
      return true;
    }
  });

  Backbone.ConfigButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      name: "config-button",
      backgroundColor: "transparent",
      width: 70,
      height: 70,
      img: "#artifacts", imgUrl: "img/artifacts.png",
      imgX: 140, imgY: 180, imgWidth: 70, imgHeight: 70,
      easingTime: 250
    }),
    initialize: function(attributes, options) {
      Backbone.Button.prototype.initialize.apply(this, arguments);

      options || (options = {});
      this.world = options.world;

      this.on("tap", this.onPressed);
    },
    onPressed: function(e) {
      this.engine.trigger("show-config-panel");
    }
  });

}).call(this);