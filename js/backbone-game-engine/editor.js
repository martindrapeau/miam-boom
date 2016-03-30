(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */

  var hashImage = new Image();
  hashImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAIaGhr1jDA+iHPjxo1GsACMA2IzInNAAgBZrQz8XWrrxQAAAABJRU5ErkJggg==";


  var drawSpriteFn = function(context, options) {
    options || (options = {});
    var animation = this.getAnimation(),
        sequenceIndex = this.get("sequenceIndex") || 0;
    if (!animation || animation.sequences.length == 0) return;
    if (sequenceIndex >= animation.sequences.length) sequenceIndex = 0;

    var sequence = animation.sequences[sequenceIndex]
        frameIndex = _.isNumber(sequence) ? sequence : sequence.frame,
        frame = this.spriteSheet.frames[frameIndex];

    var width = this.attributes.editorTileSize,
        height = this.attributes.editorTileSize;
    if (this.attributes.width > this.attributes.height) {
      height = this.attributes.height * this.attributes.editorTileSize / this.attributes.width;
    } else if (this.attributes.height > this.attributes.width && this.attributes.height > this.attributes.editorTileSize) {
      width = this.attributes.width * this.attributes.editorTileSize / this.attributes.height;
    }

    var x = this.get("x") + (options.offsetX || 0),
        y = this.get("y") + (options.offsetY || 0),
        collision = this.get("collision");

    context.drawImage(
      this.spriteSheet.img,
      frame.x, frame.y, frame.width, frame.height,
      x, y, width, height
    );

    options.tileWidth = width;
    options.tileHeight = height;

    if (typeof this.onDraw == "function") this.onDraw(context, options);

    if (!collision && this.get("type") == "tile") {
      if (!this.hashPattern)
        this.hashPattern = context.createPattern(hashImage, 'repeat');
      drawRect(context, x, y, width, height, this.hashPattern);
    }

    return this;
  };

  // World Editor
  // Allows the user to place tiles and characters in the World.
  Backbone.WorldEditor = Backbone.Element.extend({
    defaults: _.extend({}, Backbone.Element.prototype.defaults, {
      x: 136,
      y: 550,
      width: 820,
      height: 140,
      tileWidth: 32,
      tileHeight: 32,
      padding: 1,
      backgroundColor: "transparent",
      selectColor: "#f00",
      selected: undefined,
      spriteNames: [],
      page: 0,
      pages: 1,
      easingTime: 500,
      easing: "easeInQuad",
      soundEffects: []
    }),
    initialize: function(attributes, options) {
      Backbone.Element.prototype.initialize.apply(this, arguments);
      options || (options = {});

      if (!attributes || !attributes.spriteNames) throw "Missing attribute spriteNames";

      var defs = [];
      if (attributes.spriteNames.length && typeof attributes.spriteNames[0] == "object") {
        for (var page = 0; page < attributes.spriteNames.length; page++)
          for (var s = 0; s < attributes.spriteNames[page].length; s++)
            defs.push({name: attributes.spriteNames[page][s], page: page});
        this.set("pages", attributes.spriteNames.length);
      } else {
        defs = _.map(attributes.spriteNames, function(name) {
          return {name: name, page: 0};
        });
      }
      this.sprites = new Backbone.SpriteCollection(defs);
      this.sprites.each(function(sprite) {
        sprite.draw = drawSpriteFn;
      });

      this.world = options.world;
      if (!this.world && !_.isFunction(this.world.add))
        throw "Missing or invalid world option.";

      var x = this.get("x"),
          y = this.get("y"),
          padding = this.get("padding"),
          tileSize = this.get("tileWidth");

      this.prevPageButton = new Backbone.Button({
        name: "prev",
        x: x + 2*padding,
        y: y + (tileSize + 2*padding),
        width: tileSize,
        height: tileSize,
        backgroundColor: "transparent"
      });
      this.prevPageButton.draw = function(context, options) {
        options || (options = {});
        var b = this.toJSON();
        if (b.opacity == 0) return this;

        var x = b.x + (options.offsetX || 0) + tileSize/2,
            y = b.y + (options.offsetY || 0) + tileSize/2,
            w = b.scale*(tileSize - 8),
            h = b.scale*(tileSize*3/4 - 8),
            pressed = b.scale != 1;
        context.beginPath();
        context.moveTo(x, y - h/2);
        context.lineTo(x + w/2, y + h/2);
        context.lineTo(x - w/2, y + h/2);
        context.closePath();
        context.fillStyle = pressed ? "#00FF00" : "#009900";
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = '#494';
        context.stroke();
        return this;
      };
      this.prevPageButton.on("tap", this.prevPage, this);
      
      this.nextPageButton = new Backbone.Button({
        name: "next",
        x: x + 2*padding,
        y: y + 2*(tileSize + 2*padding),
        width: tileSize,
        height: tileSize,
        backgroundColor: "transparent"
      });
      this.nextPageButton.draw = function(context, options) {
        options || (options = {});
        var b = this.toJSON();
        if (b.opacity == 0) return this;

        var x = b.x + (options.offsetX || 0) + tileSize/2,
            y = b.y + (options.offsetY || 0) + tileSize/2,
            w = b.scale*(tileSize - 8),
            h = b.scale*(tileSize*3/4 - 8),
            pressed = b.scale != 1;
        context.beginPath();
        context.moveTo(x, y + h/2);
        context.lineTo(x + w/2, y - h/2);
        context.lineTo(x - w/2, y - h/2);
        context.closePath();
        context.fillStyle = pressed ? "#00FF00" : "#009900";
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = '#494';
        context.stroke();
        return this;
      };
      this.nextPageButton.on("tap", this.nextPage, this);

      this.debugPanel = options.debugPanel;

      _.bindAll(this, "onDragStart", "onDrag", "onDragEnd", "getSelectedSprite", "onMouseMove");

      var editor = this;
      this.on("change:page", function() {
        editor.set("selected", undefined);
      });
    },
    onAttach: function() {
      Backbone.Element.prototype.onAttach.apply(this, arguments);
      var world = this.world,
          engine = this.engine;

      this.bindEvents();

      this.sprites.each(function(sprite) {
        if (sprite.attributes.type == "tile" || sprite.attributes.type == "character") {
          sprite.engine = engine;
          sprite.trigger("attach", engine);
        }
      });

      if (this.get("pages") > 1) {
        this.prevPageButton.engine = this.nextPageButton.engine = engine;
        this.prevPageButton.trigger("attach");
        this.nextPageButton.trigger("attach");
      }

      this.positionSprites();
    },
    bindEvents: function() {
      this.listenTo(this.engine, "tap", this.onTap);
      this.listenTo(this.engine, "dragstart", this.onDragStart);
      this.listenTo(this.engine, "dragmove", this.onDrag);
      this.listenTo(this.engine, "dragend", this.onDragEnd);
      $(document).on("mousemove.Edit", this.onMouseMove);
      return this;
    },
    onDetach: function() {
      Backbone.Element.prototype.onDetach.apply(this, arguments);

      this.unbindEvents();

      this.sprites.each(function(sprite) {
        if (sprite.attributes.type == "tile" || sprite.attributes.type == "character") {
          sprite.engine = undefined;
          sprite.trigger("detach");
        }
      });

      this.prevPageButton.trigger("detach");
      this.nextPageButton.trigger("detach");
    },
    unbindEvents: function() {
      this.stopListening(this.engine);
      $(document).off(".Edit");
      return this;
    },
    changePage: function() {
      var page = this.get("page") + 1;
      if (page >= this.get("pages")) page = 0;
      this.set("page", page);
    },
    nextPage: function() {
      var page = this.get("page") + 1;
      if (page >= this.get("pages")) page = 0;
      this.set("page", page);
    },
    prevPage: function() {
      var page = this.get("page") - 1;
      if (page < 0) page = this.get("pages") - 1;
      this.set("page", page);
    },
    calculateTileSize: function(sprite, page) {
      var count = this.sprites.where({page: page}).length,
          padding = 2*this.get("padding"),
          tileSize = this.get("tileWidth"),
          maxTileSize = this.get("height") - padding*4,
          editorWidth = this.get("width");
      if (count*(tileSize + 2*padding) >= editorWidth) return tileSize;
      return Math.min(sprite.get("width"), maxTileSize, Math.floor((editorWidth - count*2*padding - tileSize+2*padding)/count));
    },
    positionSprites: function() {
      var editor = this,
          sp = this.toJSON(),
          x = sp.tileWidth + 4*sp.padding,
          y = 2*sp.padding,
          page = 0;

      this.sprites.each(function(sprite) {
        if (sprite.attributes.page > page) {
          page = sprite.attributes.page;
          x = sp.tileWidth + 4*sp.padding;
          y = 2*sp.padding;
        }

        var editorTileSize = editor.calculateTileSize(sprite, page);
        sprite.set({
          x: x,
          y: y,
          editorTileSize: editorTileSize
        });
        x += editorTileSize + 2*sp.padding;

        if (x >= sp.width - 2) {
          x = sp.tileWidth + 4*sp.padding;
          y += editorTileSize + 2*sp.padding;
        }
      });

      return this;
    },

    update: function(dt) {
      if (!this.world || this.world.get("state") != "pause") return false;
      
      if (this._animation) this._animationUpdateFn(dt);

      for (var i = 0; i < this.sprites.models.length; i++)
        this.sprites.models[i].update(dt);

      var x = this.get("x"),
          y = this.get("y"),
          padding = this.get("padding"),
          tileSize = this.get("tileWidth");

      this.prevPageButton.set({
        x: x + 2*padding,
        y: y + (tileSize + 2*padding)
      });
      this.prevPageButton.update(dt);

      this.nextPageButton.set({
        x: x + 2*padding,
        y: y + 2*(tileSize + 2*padding)
      });
      this.nextPageButton.update(dt);

      if (typeof this.onUpdate == "function") this.onUpdate(dt);
      return true;
    },
    draw: function(context, options) {
      options || (options = {});
      drawRect(context,
        this.get("x") + (options.offsetX || 0), this.get("y") + (options.offsetY || 0),
        canvas.width, this.get("height"),
        "rgba(40, 40, 40, 1)", false
      );
      return Backbone.Element.prototype.draw.apply(this, arguments);
    },
    onDraw: function(context, options) {
      var sp = this.toJSON();

      // Highlight selected sprite
      var st = this.sprites.findWhere({name: sp.selected}),
          sx = st ? sp.x + st.get("x") - 2 : sp.x,
          sy = st ? sp.y + st.get("y") - 2 : sp.y,
          sw = (st ? st.get("editorTileSize") : sp.tileWidth) + 4,
          sh = (st ? st.get("editorTileSize") : sp.tileHeight) + 4;
      drawRect(context, sx, sy, sw, sh, sp.selectColor);

      // Draw sprites
      sp.offsetX = sp.x;
      sp.offsetY = sp.y;
      this.sprites.each(function(sprite) {
        if (sprite.attributes.page == sp.page) sprite.draw(context, sp);
      });

      if (!this._animation) {
        // Draw world border
        var worldLeft = this.world.get("x"),
            worldTop = this.world.get("y"),
            worldRight = worldLeft + this.world.width()
            worldBottom = worldTop + this.world.height(),
            strokeStyle = "rgba(255,165,0,0.5)"
        if (worldLeft > -5) {
          context.save();
          context.beginPath();
          context.lineWidth = 5 + worldLeft;
          context.strokeStyle = strokeStyle;
          context.moveTo(this.world.attributes.viewportLeft + context.lineWidth/2, this.world.attributes.viewportTop);
          context.lineTo(this.world.attributes.viewportLeft + context.lineWidth/2, this.world.attributes.viewportTop + this.world.viewport.height);
          context.stroke();
          context.restore();
        }
        if (worldTop > -5) {
          context.save();
          context.beginPath();
          context.lineWidth = 5 + worldTop;
          context.strokeStyle = strokeStyle;
          context.moveTo(this.world.attributes.viewportLeft, this.world.attributes.viewportTop + context.lineWidth/2);
          context.lineTo(this.world.attributes.viewportLeft + this.world.viewport.width, this.world.attributes.viewportTop + context.lineWidth/2);
          context.stroke();
          context.restore();
        }
        if (worldBottom < this.world.viewport.height + 5) {
          context.save();
          context.beginPath();
          context.lineWidth = this.world.viewport.height + 5 - worldBottom;
          context.strokeStyle = strokeStyle;
          context.moveTo(this.world.attributes.viewportLeft, this.world.attributes.viewportTop + this.world.viewport.height - context.lineWidth/2);
          context.lineTo(this.world.attributes.viewportLeft + this.world.viewport.width, this.world.attributes.viewportTop + this.world.viewport.height - context.lineWidth/2);
          context.stroke();
          context.restore();
        }
        if (worldRight < this.world.viewport.width + 5) {
          context.save();
          context.beginPath();
          context.lineWidth = this.world.viewport.width + 5 - worldRight;
          context.strokeStyle = strokeStyle;
          context.moveTo(this.world.attributes.viewportLeft + this.world.viewport.width - context.lineWidth/2, this.world.attributes.viewportTop);
          context.lineTo(this.world.attributes.viewportLeft + this.world.viewport.width - context.lineWidth/2, this.world.attributes.viewportTop + this.world.viewport.height);
          context.stroke();
          context.restore();
        }

        // Highlight tile position (on desktop)
        if (this.mx != undefined && this.my != undefined) {
          var tileWidth = this.world.get("tileWidth"),
              tileHeight = this.world.get("tileHeight"),
              x = this.mx + this.world.get("x") - this.mx % tileWidth,
              y = this.my + this.world.get("y") - this.my % tileHeight;

          context.save();
          context.rect(
            this.world.get("viewportLeft"),
            this.world.get("viewportTop"),
            context.canvas.width - this.world.get("viewportRight"),
            context.canvas.height - this.world.get("viewportBottom")
          );
          context.clip();

          context.beginPath();
          context.strokeStyle = "#FF0000";
          context.setLineDash([5, 2]);
          context.rect(x, y, tileWidth, tileHeight);
          context.stroke();

          if (st) {
            var stWidth = st.getWidth(true),
                stHeight = st.getHeight(true);
            context.beginPath();
            context.strokeStyle = "#00FF00";
            context.setLineDash([6,3]);
            context.rect(x + (st.get("paddingLeft") || 0), y - stHeight + tileWidth - (st.get("paddingBottom") || 0), stWidth, stHeight);
            context.stroke();
          }

          context.restore();
        }

      }

      if (this.get("pages") > 1) {
        this.prevPageButton.draw(context);
        this.nextPageButton.draw(context);
      }
    },

    getSelectedSprite: function() {
      var selected = this.get("selected");
      if (!selected) return null
      return this.sprites.findWhere({name: selected});
    },
    onTap: function(e) {
      if (e.target != this.engine.canvas || e.canvasHandled ||
          !this.world || this.world.get("state") != "pause") return;
      
      var editor = this,
          sp = this.toJSON(),
          x = e.canvasX,
          y = e.canvasY;

      // Sprite selection?
      if (x >= sp.x && y >= sp.y && x <= sp.x + sp.width && y <= sp.y + sp.height) {
        editor.set({selected: null});
        this.sprites.each(function(sprite) {
          var s = sprite.toJSON();
          if (s.page == sp.page && x >= sp.x+s.x && y >= sp.y+s.y && x <= sp.x+s.x + s.editorTileSize && y <= sp.y+s.y + s.editorTileSize) {
            editor.set({selected: s.name});
            editor.trigger("action", "select-sprite");
            return false;
          }
        });
        return;
      }

      // Sprite placement
      if (y < sp.y) {
        var sprite = this.getSelectedSprite();
        x -= this.world.get("x");
        y -= this.world.get("y");
        this.world.cloneAtPosition(sprite, x, y);
        this.trigger("action", "place-sprite");
      }
    },

    // Pan the world
    onDragStart: function(e) {
      if (!this.world || this.world.get("state") != "pause") return false;
      var world = this.world,
          sp = this.toJSON(),
          x = e.canvasX,
          y = e.canvasY;
      if (x >= sp.x && y >= sp.y && x <= sp.x + sp.width && y <= sp.y + sp.height) return;
      world.startDragWorldX = world.get("x");
      world.startDragWorldY = world.get("y");
    },
    onDrag: function (e) {
      if (!this.world || this.world.get("state") != "pause") return false;
      var world = this.world;
      if (!_.isNumber(world.startDragWorldX) || !_.isNumber(world.startDragWorldX)) return false;
      var x = world.startDragWorldX + e.canvasDeltaX,
          y = world.startDragWorldY + e.canvasDeltaY;
      if (x > 0) {
        x = 0;
      } else {
        var min = -(world.get("width") * world.get("tileWidth") - world.engine.canvas.width);
        if (x < min) x = min;
      }
      if (y > 0) {
        y = 0;
      } else {
        var min = -(world.get("height") * world.get("tileHeight") - world.engine.canvas.height + world.get("viewportBottom"));
        if (min > 0) min = 0;
        if (y < min) y = min;
      }
      world.set({x: x, y: y});
    },
    onDragEnd: function(e) {
      if (!this.world || this.world.get("state") != "pause") return false;
      var world = this.world;
      world.startDragWorldX = undefined;
      world.startDragWorldY = undefined;
    },

    onMouseMove: function(e) {
      if (!this.world || this.world.get("state") != "pause") return false;
      var mx = this.mx = e.pageX - this.world.get("x") - this.engine.canvas.offsetLeft + this.engine.canvas.scrollLeft,
          my = this.my = e.pageY - this.world.get("y") - this.engine.canvas.offsetTop + this.engine.canvas.scrollTop,
          id = this.world.getWorldIndex({x: mx, y: my}),
          sprites = this.world.filterAt(mx, my),
          nameOrIds = _.map(sprites, function(sprite) {
            if (sprite.get("type") == "tile") return sprite.get("name")
            return sprite.get("id");
          });

      if (this.debugPanel)
        this.debugPanel.set({sprites: nameOrIds, mx: mx, my: my});
    }

  });

}).call(this);