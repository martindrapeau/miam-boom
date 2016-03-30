(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */

  Backbone.Audio = Backbone.Model.extend({
    defaults: {
      id: undefined,
      type: "music", // music or sfx
      audio: undefined, // Element id to find audio in DOM
      audioUrl: undefined, // Path to image to load if DOM image element does not exist
      volume: 1.0, // Current volume between 0 and 1
      maxVolume: 1.0, // Maximum volume between 0 and 1. volume will never pass maxVolume.
      loop: false,
      easingTime: 250,
      easing: "linear",
      paused: true
    },
    initialize: function(attributes, options) {
      this.on("attach", this.onAttach, this);
      this.on("detach", this.onDetach, this);
      this.on("change:img", this.spawnAudio, this);
      this.spawnAudio();
      this.updateAudioProperties();
    },
    onAttach: function() {
      this.on("change:loop", this.updateAudioProperties, this);
      this.on("change:volume", this.updateAudioProperties, this);
      this.listenTo(this.engine, "suspend", this.onSuspend, this);
      this.listenTo(this.engine, "resume", this.onResume, this);
      this.listenTo(this.engine, "change:" + this.get("type"), this.onEngineStateChange, this);
      this.updateAudioProperties();
    },
    onDetach: function() {
      this.off("change:loop");
      this.off("change:volume");
      this.stopListening();
      this.pause();
    },
    onEnded: function() {
      this.set("paused", this.audio.paused);
    },
    onSuspend: function() {
      if (!this.audio) return;
      this._suspendedPaused = this.get("paused");
      if (!this.audio.paused) this.audio.pause();
    },
    onResume: function() {
      if (!this.audio) return;
      if (this._suspendedPaused === false && this.engine.get(this.get("type"))) this.audio.play();
      this._suspendedPaused = undefined;
    },
    onEngineStateChange: function() {
      var state = this.engine.get(this.get("type")),
          paused = this.get("paused");
      if (paused || this._suspendedPaused !== undefined) return;
      if (state)
        this.audio.play();
      else
        this.audio.pause();
    },
    spawnAudio: function() {
      if (this.audio) return this;

      var self = this,
          audio = this.get("audio"),
          url = this.get("audioUrl");

      if (typeof audio == "string") {
        var id = audio.replace("#", "");
        audio = document.getElementById(id);
        if (!audio) {
          if (typeof url != "string")
            throw "Invalid audio #" + id + " for " + this.get("id") + ". Cannot find element by id. No audioUrl specified.";
          _.loadAudio(url, function() {
            self.audio = this;
            self.trigger("spawnAudio");
            self.audio.addEventListener("ended", self.onEnded.bind(self));
          }, id);
          return this;
        }
      }

      if (typeof audio != "object" || !audio.src)
        throw "Invalid audio attribute for " + this.get("id") + ". Not a valid Audio object.";

      audio.addEventListener("ended", this.onEnded.bind(this));
      this.audio = audio;
      this.trigger("spawnAudio");
      return this;
    },
    updateAudioProperties: function() {
      if (!this.audio) return this;
      this.audio.loop = this.get("loop");
      this.audio.volume = Math.max(0, Math.min(this.get("maxVolume"), this.get("volume")));
      return this;
    },
    update: function(dt) {
      if (this._animation) this._animationUpdateFn(dt);
      return typeof this.onUpdate == "function" ? this.onUpdate(dt) : false;
    },
    draw: function(context) {
      return this;
    },
    play: function(start) {
      if (!this.audio) return this;
      if (start !== undefined) this.audio.currentTime = start;
      if (this.engine) {
        this.set("paused", false);
        if (this.engine.get(this.get("type"))) this.audio.play();
      }
      return this;
    },
    pause: function() {
      if (!this.audio) return this;
      this.audio.pause();
      this.set("paused", true);
      return this;
    },
    seek: function(time) {
      this.audio.currentTime = time;
      return this;
    },
    maxVolume: function() {
      this.set("volume", this.get("maxVolume"));
      return this;
    },
    clearAnimation: function() {
      this._animation = undefined;
      this._animationUpdateFn = undefined;
      this._startTime = undefined;
      this._startX = undefined;
      this._startY = undefined;
      this._targetX = undefined;
      this._targetY = undefined;
      this._callback = undefined;
    },
    fadeIn: function(callback) {
      this._animation = "fadeIn";
      this._startTime = _.now();
      this._callback = callback;
      this.set("volume", 0);
      this._animationUpdateFn = function(dt) {
        var now = _.now(),
            easingTime = this.get("easingTime"),
            easing = this.get("easing"),
            maxVolume = this.get("maxVolume");
        this.play();
        if (now < this._startTime + easingTime) {
          this.set("volume", maxVolume * Backbone.EasingFunctions[easing]((now - this._startTime) / easingTime));
        } else {
          if (typeof this._callback == "function") _.defer(this._callback.bind(this));
          this.set({volume: maxVolume});
          this.clearAnimation();
        }
      };
      return this;
    },
    fadeOut: function(callback) {
      this._animation = "fadeOut";
      this._startTime = _.now();
      this._callback = callback;
      this.set("volume", this.get("maxVolume"));
      this._animationUpdateFn = function(dt) {
        var now = _.now(),
            easingTime = this.get("easingTime"),
            easing = this.get("easing"),
            maxVolume = this.get("maxVolume");
        if (now < this._startTime + easingTime) {
          this.set("volume", maxVolume * (1 - Backbone.EasingFunctions[easing]((now - this._startTime) / easingTime)));
        } else {
          if (typeof this._callback == "function") _.defer(this._callback.bind(this));
          this.set({volume: 0});
          this.pause();
          this.clearAnimation();
        }
      };
      return this;
    }
  });

  Backbone.AudioCollection = Backbone.Collection.extend({
    model: Backbone.Audio,
    // Attaches sound effects to sprite classes.
    // Looks at model default attribute soundEffects - an array of audio ids.
    // Will create properties soundEffects on the sprite class.
    attachToSpriteClasses: function() {
      var collection = this;
      _.each(Backbone, function(cls) {
        if (_.isFunction(cls) && (cls.prototype instanceof Backbone.Sprite || cls.prototype instanceof Backbone.Element) &&
            cls.prototype.defaults && cls.prototype.defaults.soundEffects && cls.prototype.defaults.soundEffects.length &&
            !cls.prototype.hasOwnProperty("soundEffects")) {
          cls.prototype.soundEffects = {};
          for (var i = 0; i < cls.prototype.defaults.soundEffects.length; i++) {
            var name = typeof cls.prototype.defaults.soundEffects[i] == "object" ? cls.prototype.defaults.soundEffects[i].name : cls.prototype.defaults.soundEffects[i],
                id = typeof cls.prototype.defaults.soundEffects[i] == "object" ? cls.prototype.defaults.soundEffects[i].id : cls.prototype.defaults.soundEffects[i];
            cls.prototype.soundEffects[name] = collection.get(id);
          }
        }
      });
      return this;
    }
  });


}).call(this);