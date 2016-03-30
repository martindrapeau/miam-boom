(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */

  // Backbone.World is Backbone model which contains a collection of sprites.
  Backbone.World = Backbone.Model.extend({
    defaults: {
      name: "",
      x: 0,
      y: 0,
      tileWidth: 32,
      tileHeight: 32,
      width: 30,
      height: 17,
      viewportTop: 0, viewportRight: 0, viewportBottom: 0, viewportLeft: 0,
      backgroundColor: "rgba(66, 66, 255, 1)",
      backgroundImage: undefined,
      backgroundImageX: 0,
      backgroundImageY: 0,
      backgroundImageWidth: 0,
      backgroundImageHeight: 0,
      backgroundImageStretch: false,
      sprites: [], // Copy for persistence only. Use the direct member sprites which is a collection.
      state: "play", // play or pause
      time: 0, // Time played in ms
      previewWidth: 320,
      previewHeight: 225
    },
    shallowAttributes: [
      "x", "y", "width", "height", "tileWidth", "tileHeight", "backgroundColor",
      "viewportLeft", "viewportRight", "viewportTop", "viewportBottom"
    ],
    viewport: {x: 0, y: 0, width: 0, height: 0},
    spriteOptions: {offsetX: 0, offsetY: 0},
    initialize: function(attributes, options) {
      options || (options = {});
      this.input = options.input;
      this.camera = options.camera;
      this.debugPanel = options.debugPanel;
      
      _.bindAll(this,
        "wrapTime",
        "save", "getWorldIndex", "getWorldCol", "getWorldRow", "cloneAtPosition",
        "spawnSprites", "height", "width", "add", "remove", "setTimeout", "clearTimeout", "getHumanTime",
        "serializeSprites", "snapshotPreview", "serializePreview"
      );

      this._times = {};
      this.wrapTime("filterAt");
      this.wrapTime("findAt");
      this.wrapTime("findCollisions");
      this.wrapTime("draw");
      this.wrapTime("update");
      this.wrapTime("drawDynamicSprites");
      this.wrapTime("drawStaticSprites");

      this.sprites = new Backbone.Collection();
      this.quadTree = QuadTree(0, 0, this.width(), this.height());
      this.setupSpriteLayers();
      this.spawnSprites();

      this.on("change:backgroundImage", this.spawnBackgroundImage);
      this.spawnBackgroundImage();

      this.on("attach", this.onAttach, this);
      this.on("detach", this.onDetach, this);

      this.on("change:state", this.onStateChange, this);
      this.onStateChange();
    },
    reportTimes: function(fn) {
      var total = this.attributes.time;
      function reportTime(time, fn) {
        console.log(fn + ": " + Math.round(time*10000/total)/100 + "% " + time + "ms");
      }
      _.each(this._times, reportTime);
      reportTime(total, "total");

      // Report collision detection as % of update
      var time = this._times["findAt"] + this._times["filterAt"] + this._times["findCollisions"];
      console.log("collision/update: " + Math.round(time*10000/this._times["update"])/100 + "% " + time + "ms");
    },
    wrapTime: function(fn) {
      var world = this,
          origFn = this[fn];
      this._times[fn] = 0;
      this[fn] = function() {
        var now = _.now(),
            result = origFn.apply(world, arguments);
        if (world.attributes.state == "play") world._times[fn] += _.now() - now;
        return result;
      }
    },
    height: function() {
      return this.get("height") * this.get("tileHeight");
    },
    width: function() {
      return this.get("width") * this.get("tileWidth");
    },
    toShallowJSON: function() {
      return _.pick(this.attributes, this.shallowAttributes);
    },
    onAttach: function() {
      var engine = this.engine;
      this.on("change:viewportLeft change:viewportRight change:viewportTop change:viewportBottom", this.updateViewport);
      this.updateViewport();
      this.sprites.each(function(sprite) {
        sprite.engine = engine;
        sprite.trigger("attach", engine);
      });
      this.listenTo(this.engine, "tap", this.onTap);
      this.listenTo(this.engine, "key", this.onKey);
      this.listenTo(this.engine, "suspend", this.onSuspend);
      this.listenTo(this.engine, "resume", this.onResume);
      if (this.camera) this.camera.maybePan();
    },
    onDetach: function() {
      this.stopListening(this.engine);
      if (this.camera) this.camera.setOptions({subject: undefined});
      this.sprites.each(function(sprite) {
        sprite.engine = undefined;
        sprite.trigger("detach");
      });
      this.clearAllTimeouts();
      this.off("change:viewportLeft change:viewportRight change:viewportTop change:viewportBottom", this.updateViewport);
    },
    onStateChange: function() {
      var state = this.get("state"),
          now = _.now();

      if (state == "pause") {
        this.accumTime += (now - (this.startTime || now));
        this.set("time", this.accumTime);
        if (this.attributes.time) this.reportTimes();
      } else if (state == "play") {
        this.startTime = now;
      }
    },
    onSuspend: function() {
      var now = _.now();
      this.accumTime += (now - (this.startTime || now));
      this.set("time", this.accumTime);
      if (this.attributes.time) this.reportTimes();
    },
    onResume: function() {
      this.startTime = _.now();
    },
    getHumanTime: function() {
      return _.ms2time(this.attributes.time);
    },
    updateViewport: function() {
      this.viewport.width = this.engine.canvas.width - this.attributes.viewportLeft - this.attributes.viewportRight;
      this.viewport.height = this.engine.canvas.height - this.attributes.viewportTop - this.attributes.viewportBottom;
      this.spriteOptions.viewportLeft = this.attributes.viewportLeft;
      this.spriteOptions.viewportRight = this.attributes.viewportRight;
      this.spriteOptions.viewportTop = this.attributes.viewportTop;
      this.spriteOptions.viewportBottom = this.attributes.viewportBottom;
      this.backgroundCanvas.width = this.engine.canvas.width;
      this.backgroundCanvas.height = this.engine.canvas.height;
    },
    onTap: function(e) {
      if (this.attributes.state != "play") return;
      e.world = this;
      e.worldX = e.canvasX - this.attributes.x;
      e.worldY = e.canvasY - this.attributes.y;
      this.trigger("tap", e);
    },
    onKey: function(e) {
      if (this.attributes.state != "play") return;
      e.world = this;
      this.trigger("key", e);
    },

    // Empties the World in one shot. No events get trigerred on removed sprites.
    // Triggers an empty event before so sprites can catch it to cleanup.
    empty: function(options) {
      options || (options = {});
      if (!options.silent) this.trigger("empty");

      this.clearAllTimeouts();

      this.sprites.reset(null, {silent: true});
      this.quadTree.clear();
      this.dynamicSprites.reset(null, {silent: true});
      this.dynamicSprites.lookup = {};
      this.staticSprites.reset(null, {silent: true});
      this.staticSprites.lookup = {};

      return this;
    },

    // Split static sprites (background tiles) from dynamic ones (animated or moving).
    // Draw static on a background and seldomly redraw.
    // Dynamic ones are redrawn every animation frame.
    // Maintain shadow collections to quickly access the two types.
    setupSpriteLayers: function() {
      var world = this,
          staticSprites = this.staticSprites = new Backbone.Collection(),
          dynamicSprites = this.dynamicSprites = new Backbone.Collection();
      staticSprites.lookup = {};
      staticSprites.maxSpriteWidth = staticSprites.maxSpriteHeight = 0;
      dynamicSprites.lookup = {};
      dynamicSprites.maxSpriteWidth = dynamicSprites.maxSpriteHeight = 0;

      this.quadTree.clear();

      function addQto(sprite) {
        sprite._qto || (sprite._qto = {});
        sprite._qto.id = sprite.id;
        sprite._qto.x = sprite.getLeft();
        sprite._qto.y = sprite.getTop();
        sprite._qto.w = sprite.getRight() - sprite._qto.x;
        sprite._qto.h = sprite.getBottom() - sprite._qto.y;
        world.quadTree.put(sprite._qto);
      }
      function removeQto(sprite) {
        world.quadTree.remove(sprite._qto, "id");
        sprite._qto.id = undefined;
        sprite._qto.x = undefined;
        sprite._qto.y = undefined;
        sprite._qto.w = undefined;
        sprite._qto.h = undefined;
      }

      function add(sprite, collection) {
        collection.add(sprite);
        index = world.getWorldIndex(sprite);
        collection.lookup[index] || (collection.lookup[index] = []);
        collection.lookup[index].push(sprite);
        sprite.set("lookupIndex", index);
        collection.maxSpriteWidth = Math.max(collection.maxSpriteWidth, sprite.attributes.width);
        collection.maxSpriteHeight = Math.max(collection.maxSpriteHeight, sprite.attributes.width);
        addQto(sprite);
      }

      function update(sprite, collection) {
        var oldIndex = sprite.attributes.lookupIndex,
            newIndex = world.getWorldIndex(sprite);
        removeQto(sprite);
        addQto(sprite);
        if (oldIndex == newIndex) return;
        if (oldIndex !== undefined && collection.lookup[oldIndex]) {
          var pos = _.indexOf(collection.lookup[oldIndex], sprite);
          if (pos >= 0) collection.lookup[oldIndex].splice(pos, 1);
        }
        collection.lookup[newIndex] || (collection.lookup[newIndex] = []);
        collection.lookup[newIndex].push(sprite);
        sprite.set("lookupIndex", newIndex);
        collection.maxSpriteWidth = Math.max(collection.maxSpriteWidth, sprite.attributes.width);
        collection.maxSpriteHeight = Math.max(collection.maxSpriteHeight, sprite.attributes.width);
      }

      function remove(sprite, collection) {
        var oldIndex = sprite.attributes.lookupIndex;
        if (oldIndex !== undefined && collection.lookup[oldIndex]) {
          var pos = _.indexOf(collection.lookup[oldIndex], sprite);
          if (pos >= 0) collection.lookup[oldIndex].splice(pos, 1);
        }
        sprite.unset("lookupIndex");
        collection.remove(sprite);
        removeQto(sprite);
      }

      this.listenTo(this.dynamicSprites, "change:x change:y", function(sprite) {
        update(sprite, dynamicSprites);
      });

      this.listenTo(this.sprites, "add", function(sprite) {
        if (sprite.get("static"))
          add(sprite, staticSprites);
        else
          add(sprite, dynamicSprites);
        world.requestBackgroundRedraw = true;
      });

      this.listenTo(this.sprites, "remove", function(sprite) {
        if (sprite.get("static"))
          remove(sprite, staticSprites);
        else
          remove(sprite, dynamicSprites);
        world.requestBackgroundRedraw = true;
      });

      this.backgroundCanvas = document.createElement("canvas");
      this.backgroundCanvas.screencanvas = false;
      this.backgroundCanvas.style.display = "none";
      document.body.appendChild(this.backgroundCanvas);
      this.backgroundContext = this.backgroundCanvas.getContext("2d");

      this.previewCanvas = document.createElement("canvas");
      this.previewCanvas.screencanvas = false;
      this.previewCanvas.style.display = "none";
      this.previewCanvas.width = this.get("previewWidth");
      this.previewCanvas.height = this.get("previewHeight");
      document.body.appendChild(this.previewCanvas);
      this.previewContext = this.previewCanvas.getContext("2d");
      drawRect(this.previewContext,
        0, 0, this.previewCanvas.width, this.previewCanvas.height,
        this.attributes.backgroundColor
      );

      this.on("change", function() {
        this.requestBackgroundRedraw = true;
      });
      return this;
    },

    spawnBackgroundImage: function() {
      this.backgroundImage = undefined;
      var id = this.get("backgroundImage");
      if (!id) return;

      id = id.replace("#", "");
      var img = document.getElementById(id);

      if (!img)
        throw "Invalid img #" + id + " for world backgroundImage. Cannot find element by id.";

      this.backgroundImage = img;
      this.set({
        backgroundImageWidth: this.get("backgroundImageWidth") || img.width,
        backgroundImageHeight: this.get("backgroundImageHeight") || img.height
      });
      //console.log("backgroundImage", img.width, img.height, this.get("backgroundImageWidth"), this.get("backgroundImageHeight"));
      return this;
    },
    reset: function(options) {
      options || (options = {});

      this.clearAllTimeouts();
      this.remove(this.sprites.models);

      this.clear(_.extend(options, {silent: true}));
      this.set(this.defaults, options);
      
      return this;
    },
    spawnSprites: function() {
      this.clearAllTimeouts();
      this.remove(this.sprites.models);

      var sprites = this.get("sprites"),
          options = {
            input: this.input
          };
      for (var i = 0; i < sprites.length; i++) {
        var s = sprites[i].attributes ? sprites[i].attributes : sprites[i],
            cls = _.classify(s.name),
            col = this.getWorldCol(s.x),
            row = this.getWorldRow(s.y);

        var newSprite = new Backbone[cls](_.extend(s,
          {
            col: col,
            row: row
          }
        ), options);

        newSprite = this.add(newSprite);

        if (newSprite.get("hero")) {
          this._heroId = newSprite.id;
          if (this.camera) this.camera.setOptions({world: this, subject: newSprite});
        }
      }

      this.requestBackgroundRedraw = true;

      this.accumTime = this.get("time");

      return this;
    },

    // When saving, persist the sprite collection in the model attribute sprites.
    serializeSprites: function() {
      return this.sprites.reduce(function(sprites, sprite) {
        var s = sprite.toSave.apply(sprite);
        if (!_.isEmpty(s)) sprites.push(s);
        return sprites;
      }, []);
    },
    // TO DO: Passing image is a hack. In Cocoon we cannot drawImage with screencanvas
    // as the source. So instead we save a snapshot. Handles retina screens too.
    snapshotPreview: function(image) {
      if (!this.engine || !this.viewport || !this.viewport.width) return null;

      var x = this.attributes.viewportLeft,
          y = this.attributes.viewportTop,
          ratio = this.previewCanvas.height / this.previewCanvas.width,
          width = this.viewport.width,
          height = Math.round(width * ratio);

      if (height > this.viewport.height) {
        height = this.viewport.height;
        width = Math.round(height / ratio);
        x += Math.floor((this.viewport.width - width) / 2);
      } else {
        y += this.viewport.height - height;
      }

      if (image) {
        x = Math.round(x * image.width/this.engine.canvas.width);
        y = Math.round(y * image.height/this.engine.canvas.height);
        width = Math.round(width * image.width/this.engine.canvas.width);
        height = Math.round(height * image.height/this.engine.canvas.height);
      }

      this.previewContext.drawImage(
        image || this.engine.canvas,
        x, y, width, height,
        0, 0, this.previewCanvas.width, this.previewCanvas.height
      );
      return this;
    },
    serializePreview: function() {
      return this.previewCanvas.toDataURL();
    },
    save: function() {
      this.set({
        sprites: this.serializeSprites(),
        preview: this.snapshotPreview().serializePreview()
      }, {silent: true});
      return Backbone.Model.prototype.save.apply(this, arguments);
    },

    // Resize the world
    resize: function(width, height) {
      var deltaY = (height - this.attributes.height) * this.attributes.tileHeight;

      if (deltaY == 0) {
        this.set({width: width});
        return;
      }

      // When resizing height, add/remove tiles above requiring translation.
      var sprites = this.sprites.map(function(sprite) {
        var s = sprite.toSave.apply(sprite);
        s.y += deltaY;
        return s;
      });

      this.set({
        y: this.attributes.y - deltaY,
        width: width,
        height: height,
        sprites: sprites
      }, {silent: true});

      this.spawnSprites();

      return this;
    },

    timeouts: {},
    setTimeout: function(callback, delay) {
      var timerId = _.uniqueId();
      this.timeouts[timerId] = {
        expires: Date.now() + delay,
        callback: callback
      };
      return timerId;
    },
    clearTimeout: function(timerId) {
      if (this.timeouts[timerId] != undefined)
        delete this.timeouts[timerId];
    },
    clearAllTimeouts: function() {
      for (var i=0; i<this.timeouts.length; i++)
        delete this.timeouts[i];
    },
    handleTimeouts: function() {
      var now = Date.now(),
          timerIds = _.keys(this.timeouts),
          timerId, timeout;
      for (var i=0; i<timerIds.length; i++) {
        timerId = timerIds[i];
        timeout = this.timeouts[timerId];
        if (now > timeout.expires) {
          timeout.callback();
          delete this.timeouts[timerId];
        }
      }
    },

    getViewportCoords: function(sprite) {
      return {
        x: -this.attributes.x + this.attributes.viewportLeft,
        y: -this.attributes.y + this.attributes.viewportTop,
        width: this.viewport.width,
        height: this.viewport.height
      };
    },
    update: function(dt) {
      if (!this.engine) return false;

      var start =_.now(),
          sprite, count = 0,
          minX = -this.attributes.x + this.attributes.viewportLeft - this.attributes.tileWidth*3,
          maxX = -this.attributes.x + this.engine.canvas.width - this.attributes.viewportRight + this.attributes.tileWidth*3,
          minY = -this.attributes.y + this.attributes.viewportTop - this.attributes.tileHeight*3,
          maxY = -this.attributes.y + this.engine.canvas.height - this.attributes.viewportBottom + this.attributes.tileHeight*3;

      // Background
      if (this.requestBackgroundRedraw) {
        this.requestBackgroundRedraw = false;
        this.drawBackground = true;
      }

      // Foreground
      for (var i = 0; i < this.dynamicSprites.models.length; i++) {
        var sprite = this.dynamicSprites.models[i];
        if (sprite.attributes.alwaysUpdate ||
            (sprite.attributes.x + sprite.attributes.width >= minX && sprite.attributes.x <= maxX &&
            sprite.attributes.y + sprite.attributes.height >= minY && sprite.attributes.y <= maxY)) {
          sprite._draw = sprite.update(dt);
          count++;
        }
      }

      if (this.debugPanel)
        this.debugPanel.set({
          drawBackground: this.drawBackground,
          updateCount: count,
          updateTime: _.now()-start
        });

      this.drawBackground = this.drawBackground || this.lastX != this.attributes.x || this.lastY || this.attributes.y;
      this.lastX = this.attributes.x; this.lastY = this.attributes.y;

      if (this.attributes.state == "play") {
        this.handleTimeouts();
        this.set({time: this.accumTime + (start - this.startTime)}, {silent: true});
      }

      return true;
    },
    draw: function(context) {
      if (this._pan && this._pan.startTime)
        this._animatePan(context);

      if (this.drawBackground) {
        this.drawStaticSprites(this.backgroundContext);
        this.drawBackground = false;
      }
      this.drawDynamicSprites(context);
      return this;
    },
    drawStaticSprites: function(context) {
      var start =_.now(),
          sprite, index, count = 0,
          tileX1 = this.getWorldCol(-this.attributes.x + this.attributes.viewportLeft - this.staticSprites.maxSpriteWidth/2),
          tileX2 = this.getWorldCol(-this.attributes.x + context.canvas.width - this.attributes.viewportRight + this.staticSprites.maxSpriteWidth/2),
          tileY1 = this.getWorldRow(-this.attributes.y + this.attributes.viewportTop - this.staticSprites.maxSpriteHeight/2),
          tileY2 = this.getWorldRow(-this.attributes.y + context.canvas.height - this.attributes.viewportBottom + this.staticSprites.maxSpriteHeight/2);
      this.spriteOptions.offsetX = this.attributes.x;
      this.spriteOptions.offsetY = this.attributes.y;

      if (this.attributes.backgroundColor == "pattern") {
        this.backgroundPattern || (this.backgroundPattern = context.createPattern(this.backgroundImage, "repeat"));
        drawRect(
          context,
          0, 0, context.canvas.width, context.canvas.height,
          this.backgroundPattern
        );

      } else {
        drawRect(
          context,
          0, 0, context.canvas.width, context.canvas.height,
          this.attributes.backgroundColor
        );

        if (this.backgroundImage) {
          var img = this.backgroundImage,
              width = this.get("backgroundImageWidth"),
              height = this.get("backgroundImageHeight"),
              stretch = this.get("backgroundImageStretch");
          if (context.canvas.width < width) width = context.canvas.width;
          if (context.canvas.height < height) height = context.canvas.height;
          context.drawImage(
            img,
            this.get("backgroundImageX"), this.get("backgroundImageY"),
            width, height,
            0, 0, stretch ? context.canvas.width : width, stretch ? context.canvas.height : height
          );
        }
      }


      var secondPass = [];
      for (var col = tileX1; col <= tileX2; col++)
        for (var row = tileY1; row <= tileY2; row++) {
          index = col * this.attributes.height + row;
          if (this.staticSprites.lookup[index])
            for (var s = 0; s < this.staticSprites.lookup[index].length; s++) {
              sprite = this.staticSprites.lookup[index][s];
              if (!sprite.attributes.zIndex) {
                sprite.draw.call(sprite, context, this.spriteOptions);
                count++;
              }  else {
                secondPass.push(sprite);
              }
            }
        }
      for (var s = 0; s < secondPass.length; s++) {
        sprite = secondPass[s];
        sprite.draw.call(sprite, context, this.spriteOptions);
      }

      if (this.debugPanel) this.debugPanel.set({
        staticDrwan: count,
        staticDrawTime: _.now()-start
      });

      return this;
    },
    drawDynamicSprites: function(context) {
      var start =_.now(),
          sprite, index, count = 0,
          clip = this.attributes.viewportLeft || this.attributes.viewportRight || this.attributes.viewportTop || this.attributes.viewportBottom,
          tileX1 = this.getWorldCol(-this.attributes.x + this.attributes.viewportLeft - this.attributes.tileWidth*3),
          tileX2 = this.getWorldCol(-this.attributes.x + context.canvas.width - this.attributes.viewportRight + this.attributes.tileWidth*3),
          tileY1 = this.getWorldRow(-this.attributes.y + this.attributes.viewportTop - this.attributes.tileHeight*3),
          tileY2 = this.getWorldRow(-this.attributes.y + context.canvas.height - this.attributes.viewportBottom + this.attributes.tileHeight*3);
      this.spriteOptions.offsetX = this.attributes.x;
      this.spriteOptions.offsetY = this.attributes.y;


      if (clip) {
        context.save();
        context.rect(
          this.attributes.viewportLeft,
          this.attributes.viewportTop,
          context.canvas.width - this.attributes.viewportRight,
          context.canvas.height - this.attributes.viewportBottom);
        context.clip();
      }

      context.drawImage(this.backgroundCanvas,
        this.attributes.viewportLeft, this.attributes.viewportTop, this.viewport.width, this.viewport.height,
        this.attributes.viewportLeft, this.attributes.viewportTop, this.viewport.width, this.viewport.height);

      var secondPass = [];
      for (var col = tileX1; col <= tileX2; col++)
        for (var row = tileY1; row <= tileY2; row++) {
          index = col * this.attributes.height + row;
          if (this.dynamicSprites.lookup[index])
            for (var s = 0; s < this.dynamicSprites.lookup[index].length; s++) {
              sprite = this.dynamicSprites.lookup[index][s];
              if (sprite._draw) {
                if (!sprite.attributes.zIndex) {
                  sprite.draw.call(sprite, context, this.spriteOptions);
                  count++;
                }  else {
                  secondPass.push(sprite);
                }
              }
            }
        }
      for (var s = 0; s < secondPass.length; s++) {
        sprite = secondPass[s];
        if (sprite._draw)
          sprite.draw.call(sprite, context, this.spriteOptions);
      }

      if (clip) context.restore();

      if (this.debugPanel) this.debugPanel.set({
        dynamicDrawn: count,
        dynamicDrawTime: _.now()-start
      });
      
      return this;
    },

    // Sprites are ided (and ordered) by columns. This allows for
    // fast column drawing without lookup.
    getWorldIndex: function(object) {
      if (!_.isObject(object)) return null;
      var x = object.attributes ? (object.get("x") + object.get("width")/2) : (object.x || 0),
          y = object.attributes ? (object.get("y") + object.get("height")/2) : (object.y || 0),
          col = Math.floor(x / this.get("tileWidth")),
          row = Math.floor(y / this.get("tileHeight"));
      return col * this.get("height") + row;
    },
    isWorldIndexInBoundingBox: function(index, topLeft, bottomRight) {
      if (index < topLeft || index > bottomRight) return false;
      if (index % this.attributes.height < topLeft % this.attributes.height) return false;
      if (index % this.attributes.height > bottomRight % this.attributes.height) return false;
      return true;
    },
    getWorldCol: function(x) {
      return Math.floor(x / this.get("tileWidth"));
    },
    getWorldRow: function(y) {
      return Math.floor(y / this.get("tileHeight"));
    },
    findAt: function(x, y, type, exclude, collision) {
      return this._findOrFilter("find", x, y, type, exclude, collision);
    },
    filterAt: function(x, y, type, exclude, collision) {
      return this._findOrFilter("filter", x, y, type, exclude, collision);
    },
    _findOrFilter: function(fn, x, y, type, exclude, collision) {
      var id = exclude && exclude.id ? exclude.id : null,
          o = _.isObject(x) ? x: {x: x, y: y, width: 0, height: 0},
          types = !_.isEmpty(type) && typeof type == "object" && type.length != undefined ? " " + type.join(" ") : " " + (type || ""),
          col = this.getWorldCol(o.x),
          row = this.getWorldRow(o.y),
          index, c, r, s,
          result = [];
      o.w = o.width;
      o.h = o.height;

      function test(sprite) {
        return (sprite && sprite.id && sprite.id != id) &&
          (!id || sprite.get("parentId") != id) &&
          (!type || types.indexOf(" "+sprite.get("type")) >= 0) &&
          (collision === undefined || sprite.attributes.collision === collision) &&
          sprite.overlaps.call(sprite, o);
      }

      if (type == "tile") {
        index = this.getWorldIndex(o);
        var sprite = index ? this.sprites.get(index) : null;
        if (sprite && test(sprite))
          return fn == "find" ? sprite : [sprite];
        return fn == "find" ? null : result;
      }

      var matches = this.quadTree.get(o),
          sprite, i;
      for (i = 0; i < matches.length; i++) {
        sprite = this.sprites.get(matches[i].id);
        if (test(sprite)) result.push(sprite);
      }

      return fn == "find" ? result[0] || null : result;
    },
    // Detects collisions on sprites for a set of named coordinates. Works on moving
    // and static sprites.
    // Map is a map of objects describing the locations to look at, and the result.
    // Each map item is an object with:
    //  - x, y: The lookup coordinate.
    //  - width, height: Optional. If specified and non-zero, defines an area to lookup (not just a point).
    //  - dir: The lookout direction; top, right, bottom or left.
    //  - sprites: array of detected colliding sprites. Reset/initialized to [] every call.
    //  - sprite: The closest sprite based on the lookout direction.
    // Returns the number of found collisions.
    findCollisions: function(map, type, exclude, collision) {
      if (_.size(map) == 0) return 0;

      var id = exclude && exclude.id ? exclude.id : null,
          types = !_.isEmpty(type) && typeof type == "object" && type.length != undefined ? " " + type.join(" ") : " " + (type || ""),
          minX, minY, maxX, maxY,
          m, c, r, index, s,
          count = 0;

      for (m in map)
        if (map.hasOwnProperty(m)) {
          map[m].width || (map[m].width = 0);
          map[m].height || (map[m].height = 0);
          if (minX == undefined || map[m].x < minX) minX = map[m].x;
          if (maxX == undefined || map[m].x + map[m].width > maxX) maxX = map[m].x + map[m].width;
          if (minY == undefined || map[m].y < minY) minY = map[m].y;
          if (maxY == undefined || map[m].y + map[m].height > maxY) maxY = map[m].y + map[m].height;
          map[m].sprites = [];
          map[m].sprite = null;
        }

      function doIt(sprite) {
        if (sprite && sprite.id && sprite.id != id &&
            (!id || sprite.get("parentId") != id) &&
            (!type || types.indexOf(" "+sprite.get("type")) >= 0) &&
            (collision === undefined || sprite.attributes.collision === collision))
          for (m in map)
            if (map.hasOwnProperty(m) &&
                sprite.overlaps.call(sprite, map[m])) {
              map[m].sprites.push(sprite);
              if (!map[m].sprite) map[m].sprite = sprite;
              count++;
            }
      }

      function findClosestSprites() {
        for (m in map)
          if (map.hasOwnProperty(m) && map[m].sprites.length > 0)
            if (map[m].sprites.length == 1)
              map[m].sprite = map[m].sprites[0];
            else
              for (s = 0; s < map[m].sprites.length; s++)
                switch (map[m].dir) {
                  case "left":
                    c = map[m].sprites[s].getRight(true);
                    if (c > map[m].x) map[m].sprite = map[m].sprites[s];
                    break;
                  case "right":
                    c = map[m].sprites[s].getLeft(true);
                    if (c < map[m].x) map[m].sprite = map[m].sprites[s];
                    break;
                  case "top":
                    c = map[m].sprites[s].getBottom(true);
                    if (c > map[m].y) map[m].sprite = map[m].sprites[s];
                    break;
                  case "bottom":
                    c = map[m].sprites[s].getTop(true);
                    if (c < map[m].y) map[m].sprite = map[m].sprites[s];
                    break;
                }
      }

      var matches = this.quadTree.get({x: minX, y: minY, w: maxX-minX, h: maxY-minY}),
          sprite, i;
      for (i = 0; i < matches.length; i++)
        doIt(this.sprites.get(matches[i].id));

      findClosestSprites();
      return count;
    },
    // Static tiles lookup.
    // Note: Will not detect moving sprites!
    // DEPRECATED: Use findAt instead
    findCollidingAt:function(x, y) {
      return this.findAt(x, y, "tile", null, true);
    },
    add: function(models, options) {
      if (_.isArray(models))
        for (var i = 0; i < models.length; i++) {
          if (models[i].attributes)
            models[i].set("id", this.buildId(models[i]));
          else
            models[i].id = this.buildId(models[i]);
        }
      else {
        if (models.attributes)
          models.set("id", this.buildId(models));
        else
          models.id = this.buildId(models);
      }

      models = this.sprites.add.call(this.sprites, models, options);

      if (_.isArray(models))
        for (var i = 0; i < models.length; i++) {
          models[i].engine = this.engine;
          if (!options || !options.silent) models[i].trigger("attach");
        }
      else {
        models.engine = this.engine;
        if (!options || !options.silent) models.trigger("attach");
      }

      if (_.isArray(models)) {
        for (var i = 0; i < models.length; i++) {
          models[i].world = this;
          if (!options || !options.silent)
            models[i].trigger("addWorld", models[i], this, options);
        }
      } else {
        models.world = this;
        if (!options || !options.silent)
          models.trigger("addWorld", models, this, options);
      }

      return models;
    },
    remove: function(models, options) {
      if (_.isArray(models))
        for (var i = 0; i < models.length; i++) {
          models[i].engine = undefined;
          if (!options || !options.silent) models[i].trigger("detach");
        }
      else {
        models.engine = undefined;
        if (!options || !options.silent) models.trigger("detach");
      }
      models = this.sprites.remove.apply(this.sprites, arguments);
      if (_.isArray(models)) {
        for (var i = 0; i < models.length; i++)
          if (models[i].world === this) {
            if (!options || !options.silent)
              models[i].trigger("removeWorld", models[i], this, options);
            models[i].world = undefined;
          }
      } else if (models && models.world === this) {
        if (!options || !options.silent)
          models.trigger("removeWorld", models, this, options);
        models.world = undefined;
      }
      return models;
    },
    getHero: function() {
      var hero = this.sprites.get(this._heroId);
      if (!hero) {
        hero = this.sprites.findWhere({hero:true});
        if (hero) this._heroId = hero.id;
      }
      return hero;
    },
    cloneAtPosition: function(sprite, x, y, options) {
      options || (options = {});
      options.world = this;
      options.input = this.input;

      var w = this.toShallowJSON(),
          spriteName = sprite ? sprite.get("name") : "",
          existings = _.filter(this.filterAt(x, y), function(s) {
            return s.get("type") != "barrier";
          }),
          existing = _.find(existings, function(s) {
            return s.get("name") == spriteName;
          }) || existings.pop(),
          existingName = existing ? existing.get("name") : null;
      if (!sprite && !existing) return null;

      if (!sprite && existing) {
        this.remove(existing);
        return null;
      }
      
      if (existing) {
        if (spriteName == existingName) {

          if (_.isBoolean(existing.get("mirrored"))) {
            if (existing.get("mirrored") == true) {
              this.remove(existing);
              return null;
            }
            existing.set("mirrored", true);
            return existing;
          }

          if (!existing.getStateInfo) {
            this.remove(existing);
            return null;
          }

          // Toggle if same sprite - either turn around or remove
          var cur = existing.getStateInfo(),
              removeOnDir = _.isFunction(existing.rotateDirection) ? "top" : (sprite.defaults.state.indexOf("right") != -1 ? "left" : "right");
          if (!cur.dir || cur.dir == removeOnDir) {
            this.remove(existing);
            return null;
          }
          if (_.isFunction(existing.rotateDirection))
            existing.rotateDirection();
          else if (cur.opo && _.isFunction(existing.toggleDirection))
            existing.toggleDirection(cur.opo);
          return existing;

        } else {

          // Replace existing
          this.remove(existing);
        }
      }

      var col = this.getWorldCol(x),
          row = this.getWorldRow(y - sprite.get("height") + w.tileHeight),
          cls = _.classify(spriteName);

      var newSprite = new Backbone[cls](_.extend({}, sprite.toJSON(), {
        x: col * w.tileWidth,
        y: row * w.tileHeight
      }), options);

      // A hero is a singleton
      var isHero = newSprite.get("hero");
      if (isHero) {
        var oldHeros = this.sprites.where({hero: true});
        if (oldHeros.length) this.remove(oldHeros);
        this._heroId = newSprite.id;
      }

      this.add(newSprite, options);

      if (isHero && this.camera)
        this.camera.setOptions({world: this, subject: newSprite});

      return newSprite;
    },
    buildIdFromName: function(name) {
      var re = new RegExp("^" + name + "\\." + "\\d+$"),
          numbers = this.dynamicSprites.reduce(function(numbers, sprite) {
            if (sprite.id && sprite.id.length && sprite.id.match(re))
              numbers.push(parseInt(sprite.id.replace(name + ".", "")));
            return numbers;
          }, [0]);
      return name + "." + (_.max(numbers) + 1);
    },
    buildId: function(sprite) {
      var attributes = sprite.attributes || sprite;
      if (!attributes.static)
        return this.buildIdFromName(attributes.name);

      return this.getWorldCol(attributes.x) * this.attributes.height +
        this.getWorldRow(attributes.y);
    },
    clearBeyondWorldBoundaries: function() {
      var minX = 0,
          minY = 0,
          maxX = this.attributes.width * this.attributes.tileWidth,
          maxY = this.attributes.height * this.attributes.tileHeight,
          toRemove = this.sprites.reduce(function(result, sprite) {
            if (sprite.attributes.x + sprite.attributes.width < minX ||
                sprite.attributes.y + sprite.attributes.height < minY ||
                sprite.attributes.x > maxX ||
                sprite.attributes.y > maxY)
              result.push(sprite);
            return result;
          });

      this.sprites.remove(toRemove);

      return this;
    },
    pan: function(targetX, targetY, callback, easing, easingTime) {
      //if (this.get("state") == "play") throw "Cannot pan world in play.";
      this._pan || (this._pan = {});
      this._pan.startTime = _.now();
      this._pan.startX = this.get("x");
      this._pan.startY = this.get("y");
      this._pan.targetX = targetX;
      this._pan.targetY = targetY;
      this._pan.easing = easing || "easeOutQuint";
      this._pan.easingTime = easingTime || 1000;
      this._pan.callback = callback;
      return this;
    },
    _animatePan: function() {
      var now = _.now();

      if (now < this._pan.startTime + this._pan.easingTime) {
        var factor = Backbone.EasingFunctions[this._pan.easing]((now - this._pan.startTime) / this._pan.easingTime);
        this.set({
          x: this._pan.startX + factor * (this._pan.targetX - this._pan.startX),
          y: this._pan.startY + factor * (this._pan.targetY - this._pan.startY)
        });
      } else {
        this._endPan(true);
      }
    },
    _endPan: function(trigger) {
      if (trigger && typeof this._pan.callback == "function")
        _.defer(this._pan.callback.bind(this));
      if (this._pan.targetX || this._pan.targetY)
        this.set({x: this._pan.targetX, y: this._pan.targetY});
      this._pan.startTime = undefined;
      this._pan.startX = undefined;
      this._pan.startY = undefined;
      this._pan.targetX = undefined;
      this._pan.targetY = undefined;
      this._pan.callback = undefined;
      return this;
    }
  });

}).call(this);
