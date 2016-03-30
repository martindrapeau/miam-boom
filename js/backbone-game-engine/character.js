(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */

  var sequenceDelay = 300,
      walkVelocity = 50,
      fallAcceleration = 1200,
      fallVelocity = 600;

  var animations = {
    "idle-left": {
      sequences: [0],
      delay: sequenceDelay,
      velocity: 0,
      scaleX: 1,
      scaleY: 1
    },
    "idle-right": {
      sequences: [0],
      delay: sequenceDelay,
      velocity: 0,
      scaleX: -1,
      scaleY: 1
    },
    "walk-left": {
      sequences: [1, 0],
      delay: sequenceDelay,
      velocity: -walkVelocity,
      scaleX: 1,
      scaleY: 1
    },
    "walk-right": {
      sequences: [1, 0],
      delay: sequenceDelay,
      velocity: walkVelocity,
      scaleX: -1,
      scaleY: 1
    },
    "fall-left": {
      sequences: [0],
      delay: sequenceDelay,
      velocity: -walkVelocity,
      yVelocity: fallVelocity,
      yAcceleration: fallAcceleration,
      scaleX: 1,
      scaleY: 1
    },
    "fall-right": {
      sequences: [0],
      delay: sequenceDelay,
      velocity: walkVelocity,
      yVelocity: fallVelocity,
      yAcceleration: fallAcceleration,
      scaleX: -1,
      scaleY: 1
    },
    "ko-left": {
      sequences: [0],
      delay: sequenceDelay,
      velocity: -walkVelocity,
      yVelocity: fallVelocity,
      yAcceleration: fallAcceleration,
      scaleX: 1,
      scaleY: -1
    },
    "ko-right": {
      sequences: [0],
      delay: sequenceDelay,
      velocity: walkVelocity,
      yVelocity: fallVelocity,
      yAcceleration: fallAcceleration,
      scaleX: -1,
      scaleY: -1
    }
  };

  var hurtAnimation = {
        sequences: [0],
        delay: 300,
        yVelocity: fallVelocity,
        yAcceleration: fallAcceleration
      };
  animations["idle-hurt-left"] = _.extend({}, animations["idle-left"], hurtAnimation);
  animations["idle-hurt-right"] = _.extend({}, animations["idle-right"], hurtAnimation);
  animations["walk-hurt-left"] = _.extend({}, animations["walk-left"], hurtAnimation);
  animations["walk-hurt-right"] = _.extend({}, animations["walk-right"], hurtAnimation);
  animations["fall-hurt-left"] = _.extend({}, animations["fall-left"], hurtAnimation);
  animations["fall-hurt-right"] = _.extend({}, animations["fall-right"], hurtAnimation);


  Backbone.Character = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      name: "character",
      type: "character",
      width: 32,
      height: 32,
      worldMargin: 32,
      zIndex: 1,
      spriteSheet: undefined,
      state: "walk-left",
      velocity: 0,
      yVelocity: 0,
      relativeVelocity: 0,
      relativeYVelocity: 0,
      collision: true,
      collideWith: undefined,
      static: false,
      visible: true,
      suspended: false,
      health: 1,
      attackDamage: 1,
      dead: false,
      ignorePhysics: false,
      floor: null,
      ceiling: 0,
      aiDelay: 1000
    }),
    animations: animations,
    initialize: function(attributes, options) {
      Backbone.Sprite.prototype.initialize.apply(this, arguments);
      options || (options = {});

      this._lastAiEvent = 0;
      this._forceAiEvent = false;

      this.on("hit", this.hit, this);
      this.on("change:health", this.onHealthChange, this);
      this.on("beforeFall", this.onBeforeFall, this);
    },
    onAttach: function() {
      Backbone.Sprite.prototype.onAttach.apply(this, arguments);
    },
    onDetach: function() {
      Backbone.Sprite.prototype.onDetach.apply(this, arguments);
    },
    onBeforeFall: function() {
      return this;
    },
    onHealthChange: function(model, health, options) {
      if (this.get("dead")) return this;

      options || (options = {});
      var cur = this.getStateInfo(),
          dir = options.dir || cur.dir;

      if (health == 0)
        return this.knockout(options.sprite || null, dir, options.dir2 || null);
      else if (health < this.previous("health")) 
        return this.hurt(options.sprite || null, dir, options.dir2 || null);
      
      this._lastAiEvent = _.now();

      return this;
    },
    knockout: function(sprite, dir) {
      var opo = dir == "left" ? "right" : "left",
          state = this.buildState("ko", opo);
      this.clearAnimation();
      this.set({
        state: state,
        velocity: this.animations[state].velocity,
        yVelocity: -this.animations[state].yVelocity,
        sequenceIndex: 0,
        dead: true,
        collision: false,
        ignorePhysics: true
      });
      this.cancelUpdate = true;
      this.trigger("action", "knockout");
      return this;
    },
    hurt: function(sprite, dir) {
      dir = dir == "left" ? "right" : "left";
      this.clearAnimation();
      this.set({
        state: this.buildState("fall", "hurt", dir),
        velocity: this.animations["ko-"+dir].velocity,
        yVelocity: -this.animations["ko-"+dir].yVelocity,
        sequenceIndex: 0
      });
      return this;
    },
    hit: function(sprite, dir, dir2) {
      var cur = this.getStateInfo(),
          opo = _.opo(dir);

      if (this._handlingSpriteHit || cur.mov == "ko" || cur.mov2 == "hurt") return this;
      this._handlingSpriteHit = sprite;

      if ((sprite.get("hero") || sprite.get("type") == "projectile") && sprite.isAttacking(this)) {
        this.cancelUpdate = true;
        var attackDamage = sprite.get("attackDamage") || 0;
        this.set({health: Math.max(this.get("health") - attackDamage, 0)}, {sprite: sprite, dir: dir, dir2: dir2});
        this.trigger("action", sprite.get("name").indexOf("fire") != -1 ? "hit-fire" : "hit");
      } else if (cur.dir == dir && cur.mov2 == null) {
        this.cancelUpdate = true;
        this.set("state", this.buildState(cur.mov, cur.opo));
      }

      sprite.trigger("hit", this, opo);

      this._handlingSpriteHit = undefined;
      return this;
    },
    startNewAnimation: function(state, attrs, done) {
      var animation = this.getAnimation(state),
          delay = animation.delay || 0;

      if (!animation || !animation.sequences.length || !delay)
        throw "No animation to animate";

      var now = _.now();
      this.set(_.extend({
        state: state,
        sequenceIndex: 0
      }, attrs));

      this.lastSequenceChangeTime = now;
      this.animationStartTime = now;
      this.animationEndTimeLimit = now + animation.sequences.length * delay;
      this.whenAnimationEnds = done;

      return this;
    },
    clearAnimation: function() {
      this.animationStartTime = undefined;
      this.animationEndTimeLimit = undefined;
      this.whenAnimationEnds = undefined;
    },
    updateSequenceIndex: function(dt) {
      var sequenceIndex = this.get("sequenceIndex"),
          animation = this.getAnimation(),
          delay = animation.delay || 0,
          now = _.now(),
          triggerAnimationEnd = false;

      if (!animation.sequences) {
        sequenceIndex = 0;
        this.lastSequenceChangeTime = now;
      } else if (this.animationStartTime) {
        sequenceIndex = Math.round(animation.sequences.length*(now - this.animationStartTime)/(animation.sequences.length * delay));
        if (sequenceIndex >= animation.sequences.length) {
          sequenceIndex = 0;
          triggerAnimationEnd = true;
        }
        this.lastSequenceChangeTime = now;
      } else if (sequenceIndex >= animation.sequences.length) {
        sequenceIndex = 0;
        this.lastSequenceChangeTime = now;
        triggerAnimationEnd = true;
      } else if (delay && now > this.lastSequenceChangeTime + delay) {
        sequenceIndex = sequenceIndex < animation.sequences.length-1 ? sequenceIndex + 1 : 0;
        this.lastSequenceChangeTime = now;
        if (sequenceIndex == 0) triggerAnimationEnd = true;
      }

      if (triggerAnimationEnd && typeof this.whenAnimationEnds == "function") {
        _.defer(this.whenAnimationEnds.bind(this));
        this.clearAnimation();
      }

      return sequenceIndex;
    },
    ai: function(dt) {
      return this;
    },
    handleAi: function() {
      var now = _.now();
      if (this._forceAiEvent || now > this._lastAiEvent + this.get("aiDelay")) {
        if (this.world.get("state") == "play") this.ai(now - this._lastAiEvent);
        this._lastAiEvent = now;
        this._forceAiEvent = false;
      }
      return this;
    },
    update: function(dt) {
      // Movements are only possible inside a world
      if (!this.world) return true;
      this.cancelUpdate = false;

      if (this.world.get("state") == "play" && !this.get("suspended")) this.handleAi();
      if (this.cancelUpdate) return true;

      // Velocity and state
      var self = this,
          dead = this.get("dead"),
          velocity = this.get("velocity") || 0,
          yVelocity = this.get("yVelocity") || 0,
          x = this.get("x"),
          y = this.get("y"),
          state = this.get("state"),
          cur = this.getStateInfo(),
          animation = this.getAnimation(),
          aiDelay = this.get("aiDelay"),
          attrs = {};

      attrs.sequenceIndex = this.updateSequenceIndex();
      // No sequence change - stay on last one
      if ((dead || cur.mov2 == "hurt") &&
          this.get("sequenceIndex") == animation.sequences.length-1) {
        attrs.sequenceIndex = animation.sequences.length-1;
      }

      if (velocity != animation.velocity) velocity = animation.velocity || 0;

      if (cur.mov == "fall" || cur.mov == "ko" || cur.mov2 == "hurt") {
        if (yVelocity < animation.yVelocity)
          yVelocity += animation.yAcceleration * (dt/1000);

        if (yVelocity >= animation.yVelocity)
          yVelocity = animation.yVelocity;
        attrs.yVelocity = yVelocity;
      } else if (yVelocity != 0) {
        console.log("Crap - yVelocity is " + yVelocity + " yet cur.mov is " + cur.mov);
        attrs.yVelocity = yVelocity = 0;
      }


      // Collision detection
      var collision = this.get("collision"),
          ignorePhysics = this.get("ignorePhysics"),
          tileWidth = this.get("width"),
          tileHeight = this.get("height"),
          worldMargin = this.get("worldMargin"),
          paddingLeft = this.get("paddingLeft"),
          paddingRight = this.get("paddingRight"),
          paddingBottom = this.get("paddingBottom"),
          paddingTop = this.get("paddingTop"),
          charWidth = tileWidth - paddingLeft - paddingRight,
          charHeight = tileHeight - paddingTop - paddingBottom,
          charLeftX = Math.round(x + velocity * (dt/1000)) + paddingLeft,
          charRightX = charLeftX + charWidth,
          bottomWorld = this.world.height() + tileHeight,
          bottomY = _.minNotNull([
            this.get("floor"),
            bottomWorld
          ]);
      attrs.relativeVelocity = attrs.relativeYVelocity = 0;

      var charBottomY, charTopY, sprite, i, type;
      function updateTopBottom() {
        charBottomY = Math.round(y + yVelocity * (dt/1000)) + tileHeight - paddingBottom,
        charTopY = charBottomY - charHeight,
        self.buildCollisionMap(charTopY, charRightX, charBottomY, charLeftX);
        if (!ignorePhysics)
          self.world.findCollisions(self.collisionMap, self.get("collideWith"), self, true);
      }
      updateTopBottom();

      for (i = 0; i < this.collisionMap.bottom.sprites.length; i++) {
        sprite = this.collisionMap.bottom.sprites[i];
        type = sprite.get("type")
        if (type == "tile" || type == "platform" || type == "breakable-tile")
          bottomY = Math.min(bottomY, sprite.getTop(true));
        attrs.relativeVelocity = sprite.get("relativeVelocity") || attrs.relativeVelocity;
        attrs.relativeYVelocity = sprite.get("relativeYVelocity") || attrs.relativeYVelocity;
      }

      if (yVelocity >= 0) {
        // Walking or Falling...
        if (charBottomY >= bottomY) {
          if (charBottomY >= bottomWorld) {
            this.world.remove(this);
            return false;
          }

          if (collision) {
            for (i = 0; i < this.collisionMap.bottom.sprites.length; i++)
              if (cur.mov != "ko")
                this.collisionMap.bottom.sprites[i].trigger("hit", this, "top");
            if (this.cancelUpdate) return this;
          }

          // Stop falling because obstacle below
          if (this.get("yVelocity") != 0) this.trigger("action", "land");
          attrs.yVelocity = yVelocity = 0;
          attrs.y = y = bottomY - tileHeight + paddingBottom;
          if (cur.mov == "fall") {
            attrs.state = this.buildState("walk", cur.dir);
          } else if (cur.mov == "ko") {
            attrs.velocity = velocity = 0;
          }
          updateTopBottom();

        } else if (cur.mov != "fall" && cur.mov != "ko" && charBottomY < bottomY) {
          // Start falling if no obstacle below
          attrs.state = this.buildState("fall", cur.mov2, cur.dir);

          if (cur.mov == "walk" && velocity != 0) {
            this.trigger("beforeFall");
            if (this.cancelUpdate) return true;
          }
        }

      } else if (yVelocity < 0) {
        // Jumping
        var topY = Math.max(-400,  this.get("ceiling"));
        for (i = 0; i < this.collisionMap.top.sprites.length; i++) {
          sprite = this.collisionMap.top.sprites[i];
          if (sprite.get("type") == "tile")
            topY = Math.max(topY, sprite.getBottom(true));
        }
        if (charTopY < topY) {
          if (this.get("yVelocity") != 0) this.trigger("action", "land");
          attrs.yVelocity = yVelocity = 0;
          charTopY = topY;
          charBottomY = topY + charHeight;
          attrs.y = y = charBottomY - tileHeight;
          updateTopBottom();
        }

      }

      // When not in play mode, do not allow horizontal displacements or animations
      if (this.world.get("state") != "play" || this.get("suspended")) {
        attrs.velocity = velocity = 0;
        attrs.sequenceIndex = this.get("sequenceIndex");

      } else {
        
        // Walls and other obstacles
        if (velocity <= 0) {
          // Turn around if obstacle left
          var worldLeft = -worldMargin,
              leftX = worldLeft,
              leftCharacter;
          if (cur.mov != "idle" && !(dead && yVelocity == 0))
            for (i = 0; i < this.collisionMap.left.sprites.length; i++) {
              sprite = this.collisionMap.left.sprites[i];
              leftX = Math.max(leftX, sprite.getRight(true));
              if (sprite.get("type") == "character" &&
                  (!leftCharacter || sprite.getRight(true) > leftCharacter.getRight(true)))
                leftCharacter = sprite;
            }

          if (charLeftX <= leftX) {
            var newX = leftX - paddingLeft;
            if (charLeftX <= worldLeft) {
              this.world.remove(this);
              return false;
            }
            if (collision && leftCharacter && cur.mov2 != "hurt") {
              leftCharacter.trigger("hit", this, "right", cur.mov2);
              if (this.cancelUpdate) return true;
            }
            this.trigger("beforeTurn", sprite, leftX, newX);
            if (this.cancelUpdate) return true;
            if (!this.ignoreTurn) {
              attrs.velocity = velocity = velocity * (cur.mov != "ko" ? -1 : 0);
              attrs.state = this.buildState(cur.mov, cur.mov2, cur.opo);
              attrs.x = x = newX;
              this._forceAiEvent = true;
              this.ignoreTurn = undefined;
            }
          }
        }

        if (velocity >= 0) {
          // Turn around if obstacle to the right
          var worldRight = this.world.width() + worldMargin,
              rightX = worldRight,
              rightCharacter;
          if (cur.mov != "idle" && !(dead && yVelocity == 0))
            for (i = 0; i < this.collisionMap.right.sprites.length; i++) {
              sprite = this.collisionMap.right.sprites[i];
              rightX = Math.min(rightX, sprite.getLeft(true));
              if (sprite.get("type") == "character" &&
                  (!rightCharacter || sprite.getLeft(true) < rightCharacter.getLeft(true)))
                rightCharacter = sprite;
            }

          if (charRightX >= rightX) {
            var newX = rightX - charWidth - paddingLeft;
            if (charRightX >= worldRight) {
              this.world.remove(this);
              return false;
            }
            if (collision && rightCharacter && cur.mov2 != "hurt") {
              rightCharacter.trigger("hit", this, "left", cur.mov2);
              if (this.cancelUpdate) return true;
            }
            this.trigger("beforeTurn", sprite, rightX, newX);
            if (this.cancelUpdate) return true;
            if (!this.ignoreTurn) {
              attrs.velocity = velocity = velocity * (cur.mov != "ko" ? -1 : 0);
              attrs.state = this.buildState(cur.mov, cur.mov2, cur.opo);
              attrs.x = x = newX;
              this._forceAiEvent = true;
              this.ignoreTurn = undefined;
            }
          }
        }
      }

      if (velocity || attrs.relativeVelocity) attrs.x = x = x + Math.round((velocity + attrs.relativeVelocity) * (dt/1000));
      if (yVelocity || attrs.relativeYVelocity) attrs.y = y = y + Math.round((yVelocity + attrs.relativeYVelocity) * (dt/1000));

      // Set modified attributes
      if (!_.isEmpty(attrs)) this.set(attrs);

      if (typeof this.onUpdate == "function") return this.onUpdate(dt);
      return true;
    },
    toggleDirection: function(dirIntent) {
      var cur = this.getStateInfo();
      this.set({state: this.buildState(cur.mov, cur.mov2, dirIntent)});
      return this;
    },
    getStateInfo: function(state) {
      var state = state || this.get("state"),
      pieces = state.split("-");
      if (pieces.length < 2) return {
        state: state,
        mov: state
      };

      var stateInfo = {};
      stateInfo.mov = pieces[0];
      stateInfo.mov2 = pieces.length == 3 ? pieces[1] : null;
      stateInfo.dir = pieces.length == 3 ? pieces[2] : pieces[1];
      stateInfo.opo = _.opo(stateInfo.dir);
      return stateInfo;
    },
    isAttacking: function(sprite) {
      if (this.cancelUpdate) return false;
      var cur = this.getStateInfo();
      return cur.mov2 == "attack";
    },
    buildState: function(piece1, piece2, piece3) {
      var state = "";
      if (piece1) state += piece1;
      if (piece2) state += (state.length ? "-" : "") + piece2;
      if (piece3) state += (state.length ? "-" : "") + piece3;
      return state;
    },
    buildCollisionMap: function(top, right, bottom, left) {
      this.collisionMap || (this.collisionMap = {
        right: {x: 0, y: 0, width: 0, height: 0, dir: "right", sprites: [], sprite: null},
        left: {x: 0, y: 0, width: 0, height: 0, dir: "left", sprites: [], sprite: null},
        bottom: {x: 0, y: 0, width: 0, height: 0, dir: "bottom", sprites: [], sprite: null},
        top: {x: 0, y: 0, width: 0, height: 0, dir: "top", sprites: [], sprite: null}
      });

      var width = right - left,
          height = bottom - top;
      this.collisionMap.left.x = left;
      this.collisionMap.right.x = right;
      this.collisionMap.left.y = this.collisionMap.right.y = top + height*0.20;
      this.collisionMap.top.x = this.collisionMap.bottom.x = left + width*0.20;
      this.collisionMap.top.y = top;
      this.collisionMap.bottom.y = bottom;
      this.collisionMap.left.height = this.collisionMap.right.height = height*0.60;
      this.collisionMap.left.width = this.collisionMap.right.width = 0;
      this.collisionMap.top.width = this.collisionMap.bottom.width = width*0.60;
      this.collisionMap.top.height = this.collisionMap.bottom.height = 0;

      for (var m in this.collisionMap)
        if (this.collisionMap.hasOwnProperty(m)) {
          this.collisionMap[m].sprites.length = 0;
          this.collisionMap[m].sprite = null;
        }
    }
  });

}).call(this);