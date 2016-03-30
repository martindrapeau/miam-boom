(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */

  // Camera class
  // Ensures the hero is always in the viewport.
  // Properly pans the world.
  Backbone.Camera = Backbone.Model.extend({
    defaults: {
      left: 200,
      right: 400,
      top: 100,
      bottom: 100
    },
    initialize: function(attributes, options) {
      this.setOptions(options || {});
      this.bbox = {
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined
      };
      this.on("attach", this.onAttach, this);
      this.on("detach", this.onDetach, this);
    },
    onAttach: function() {
    },
    onDetach: function() {
      this.stopListening();
      if (this.shakeTimerId) this.world.clearTimeout(this.shakeTimerId);
    },
    setOptions: function(options) {
      options || (options = {});
      _.extend(this, options || {});

      this.stopListening();
      if (this.subject && this.world)
        this.listenTo(this.subject, "change:x change:y", this.maybePan);
    },
    getBbox: function() {
      this.bbox.x1 = this.world.get("x") + this.world.viewport.x + this.get("left");
      this.bbox.y1 = this.world.get("y") + this.world.viewport.y + this.get("top");
      this.bbox.x2 = this.world.get("x") + this.world.viewport.x + this.world.viewport.width - this.get("right");
      this.bbox.y2 = this.world.get("y") + this.world.viewport.y + this.world.viewport.height - this.get("bottom");
      return this.bbox;
    },
    maybePan: function() {
      if (!this.world || !this.subject) return this;
      var w = this.world.toShallowJSON(),
          worldX = w.x,
          worldY = w.y,
          worldWidth = w.width * w.tileWidth,
          worldHeight = w.height * w.tileHeight,
          viewportWidth = this.world.viewport.width,
          viewportHeight = this.world.viewport.height,
          subjectX = this.subject.get("x") + w.x,
          subjectY = this.subject.get("y") + w.y,
          subjectWidth = this.subject.get("width"),
          subjectHeight = this.subject.get("height"),
          left = this.get("left") + w.viewportLeft,
          right = w.viewportLeft + viewportWidth - this.get("right"),
          top = this.get("top") + w.viewportTop,
          bottom = w.viewportTop + viewportHeight - this.get("bottom");

      if (top > bottom) {
        var diff = bottom - top;
        top += Math.floor(diff * this.get("top")/this.world.viewport.height);
        bottom -= Math.ceil(diff * this.get("bottom")/this.world.viewport.height);
      }

      if (subjectX < left && w.x < 0) {
        // Pan right (to see more left)
        worldX = w.x + (left - subjectX);
        if  (worldX > 0) worldX = 0;
      } else if (subjectX > right && w.x + worldWidth > viewportWidth) {
        // Pan left (to see more right)
        worldX = w.x - (subjectX - right);
        if (worldX + worldWidth < viewportWidth)
            worldX = -worldWidth + viewportWidth;
      }

      if (subjectY < top && w.y < 0) {
        // Pan down (to see more up)
        worldY = w.y + (top - subjectY);
        if  (worldY > 0) worldY = 0;
      } else if (subjectY > bottom && w.y + worldHeight > viewportHeight) {
        // Pan up (to see more down)
        worldY = w.y - (subjectY - bottom);
        if (worldY + worldHeight < viewportHeight)
            worldY = -worldHeight + viewportHeight;
      }

      if (worldHeight + worldY < viewportHeight) {
        worldY = viewportHeight - worldHeight;
      }

      if (worldX != w.x ||  worldY != w.y)
        this.world.set({x: worldX, y: worldY});
    },
    shake: function() {
      if (!this.world && this.world.get("state") != "play") return this;

      var w = this.world.toShallowJSON(),
          worldX = w.x,
          worldY = w.y,
          worldWidth = w.width * w.tileWidth,
          worldHeight = w.height * w.tileHeight,
          viewportWidth = this.world.viewport.width,
          viewportHeight = this.world.viewport.height;
      this._preShakeX = worldX;
      this._preShFKey = worldY;

      worldY += 10;
      if (worldHeight + worldY < viewportHeight)
        worldY = viewportHeight - worldHeight;

      this.world.set({
        x: worldX,
        y: worldY
      });

      this.shakeTimerId = this.world.setTimeout(this.endShake.bind(this), 200);

      return this;
    },
    endShake: function() {
      if (!this.world) return this;

      this.world.set({
        x: this._preShakeX,
        y: this._preShFKey
      });
      this._preShakeX = undefined;
      this._preShFKey = undefined;

      return this;
    },
    update: function(dt) {
      return false;
    },
    draw: function(context) {
      var bbox = this.getBbox(),
          offsetX = this.world.get("x"),
          offsetY = this.world.get("y"),
          subjectWidth = this.subject.get("width"),
          subjectHeight = this.subject.get("height");
      drawRect(context, bbox.x1 - offsetX, bbox.y1 - offsetY, bbox.x2-bbox.x1+subjectWidth, bbox.y2-bbox.y1+subjectHeight, undefined, "#ffffff");
      //drawRect(context, this.world.viewport.x, this.world.viewport.y, this.world.viewport.width, this.world.viewport.height, undefined, "#ffffff");
      return this;
    }
  });

}).call(this);