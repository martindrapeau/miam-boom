(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */

  var opacity = 0.5;

  Backbone.InputButton = Backbone.Element.extend({
    defaults: _.extend({}, Backbone.Element.prototype.defaults, {
      // Relative position references
      left: undefined,
      right: undefined,
      top: undefined,
      bottom: undefined,
      backgroundColor: "transparent",
      pressed: false
    }),
    onAttach: function() {
      Backbone.Element.prototype.onAttach.apply(this, arguments);
      this.stopListening();
      this.calculatePosition();
    },
    onDetach: function() {
      Backbone.Element.prototype.onDetach.apply(this, arguments);
      this.set("pressed", false);
    },
    calculatePosition: function() {
      // Set x and y based on relative position references
      if (!this.engine) return this;
      var canvas = this.engine.canvas,
          attrs = {};

      if (this.attributes.left !== undefined)
        attrs.x = this.attributes.left;
      else if (this.attributes.right !== undefined)
        attrs.x = canvas.width - this.attributes.right - this.attributes.width;
      else
        throw "InputButton " + this.id + " missing left or right attributes.";

      if (this.attributes.top !== undefined)
        attrs.y = this.attributes.top;
      else if (this.attributes.bottom !== undefined)
        attrs.y = canvas.height - this.attributes.bottom - this.attributes.height;
      else
        throw "InputButton " + this.id + " missing top or bottom attributes.";

      this.set(attrs);
      return this;
    }
  });

  Backbone.LeftInputButton = Backbone.InputButton.extend({
    onDraw: function(context) {
      var x = this.get("x"),
          y = this.get("y"),
          width = this.get("width"),
          height = this.get("height"),
          pressed = this.get("pressed");
      //drawRect(context, x, y, width, height, "rgba(64, 64, 64, 0.5)");
      context.save();
      context.globalAlpha = opacity;
      context.beginPath();
      context.moveTo(x+130, y+20);
      context.lineTo(x+40, y+80);
      context.lineTo(x+130, y+140);
      context.lineTo(x+100, y+80);
      context.lineTo(x+130, y+20);
      context.lineJoin = 'bevel';
      context.fillStyle = pressed ? "#00FF00" : "#009900";
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#111';
      context.stroke();
      context.restore();
      return this;
    }
  });

  Backbone.RightInputButton = Backbone.InputButton.extend({
    onDraw: function(context) {
      var x = this.get("x"),
          y = this.get("y"),
          width = this.get("width"),
          height = this.get("height"),
          pressed = this.get("pressed");
      //drawRect(context, x, y, width, height, "rgba(128, 128, 128, 0.5)");
      context.save();
      context.globalAlpha = opacity;
      context.beginPath();
      context.moveTo(x+30, y+20);
      context.lineTo(x+120, y+80);
      context.lineTo(x+30, y+140);
      context.lineTo(x+60, y+80);
      context.lineTo(x+30, y+20);
      context.lineJoin = 'bevel';
      context.fillStyle = pressed ? "#00FF00" : "#009900";
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#111';
      context.stroke();
      context.restore();
      return this;
    }
  });

  Backbone.AInputButton = Backbone.InputButton.extend({
    onDraw: function(context) {
      var x = this.get("x"),
          y = this.get("y"),
          width = this.get("width"),
          height = this.get("height"),
          pressed = this.get("pressed");
      //drawRect(context, x, y, width, height, "rgba(255, 255, 255, 0.5)");
      context.save();
      context.globalAlpha = opacity;
      context.beginPath();
      context.arc(x+80, y+80, 60, 0, 2*Math.PI, false);
      context.fillStyle = "#111";
      context.fill();
      context.beginPath();
      context.arc(x+80, y+80, 55, 0, 2*Math.PI, false);
      context.fillStyle = pressed ? "#0000FF" : "#000099";
      context.fill();

      context.font = "bold 60px sans-serif";
      context.textBaseline = "middle";
      context.fontWeight = "normal";
      context.textAlign = "center";
      context.fillStyle = "#0000CC";
      context.fillText("X", x+80, y+82);
      context.fillStyle = "#111";
      context.fillText("X", x+80, y+80);

      context.restore();
      return this;
    }
  });

  Backbone.BInputButton = Backbone.InputButton.extend({
    onDraw: function(context) {
      var x = this.get("x"),
          y = this.get("y"),
          width = this.get("width"),
          height = this.get("height"),
          pressed = this.get("pressed");
      //drawRect(context, x, y, width, height, "rgba(192, 192, 192, 0.5)");
      context.save();
      context.globalAlpha = opacity;
      context.beginPath();
      context.arc(x+80, y+80, 60, 0, 2*Math.PI, false);
      context.fillStyle = "#111";
      context.fill();
      context.beginPath();
      context.arc(x+80, y+80, 55, 0, 2*Math.PI, false);
      context.fillStyle = pressed ? "#FF0000" : "#990000";
      context.fill();

      context.font = "bold 60px sans-serif";
      context.textBaseline = "middle";
      context.fontWeight = "normal";
      context.textAlign = "center";
      context.fillStyle = "#CC0000";
      context.fillText("Z", x+80, y+82);
      context.fillStyle = "#111";
      context.fillText("Z", x+80, y+80);

      context.restore();
      return this;
    }
  });


  // Input class; a Backbone Model which captures input events
  // and stores them as model attributes with true if pressed.
  // Supports keyboard, and a drawn touchpad activated by touch
  // or mouse events.
  Backbone.Input = Backbone.Model.extend({
    defaults: {
      // Supported buttons
      left: false, // Left button pressed?
      right: false, // Right button pressed?
      up: false,
      down: false,
      buttonA: false, // A button pressed? (X on keyboard)
      buttonB: false, // B button pressed? (Z on keyboard)

      // Touch pad
      drawTouchpad: "auto", // Boolean to draw. Set to auto to draw only for touch devices.
      touchEnabled: false // Touch device? Automatically determined. Do not set.
    },
    buttons: [{
      id: "left", name: "left-input-button",
      left: 0, bottom: 0, width: 160, height: 160
    },  {
      id: "right", name: "right-input-button",
      left: 160, bottom: 0, width: 160, height: 160
    },  {
      id: "buttonA", name: "a-input-button",
      right: 0, bottom: 0, width: 160, height: 160
    },  {
      id: "buttonB", name: "b-input-button",
      right: 160, bottom: 0, width: 160, height: 160
    }],
    initialize: function(attributes, options) {
      options || (options = {});
      this._ongoingTouches = [];

      _.bindAll(this, "rightPressed", "leftPressed", "buttonBPressed", "buttonAPressed");

      for (var i = 0; i < this.buttons.length; i++) {
        var config = this.buttons[i],
            cls = _.classify(config.name);
        config.instance = new Backbone[cls](config);
      }

      // Handle touch events
      var touchEnabled =
        "onorientationchange" in window ||
        window.navigator.msMaxTouchPoints ||
        window.navigator.isCocoonJS;
      this.set({touchEnabled: touchEnabled});

      // Debug panel
      var debugPanel = this.debugPanel = options.debugPanel;
      if (debugPanel) {
        this.on("change:pressed", function() {
          debugPanel.set({pressed: this.get("pressed")});
        });
        this.on("change:touched", function() {
          debugPanel.set({touched: this.get("touched")});
        });
        this.on("change:clicked", function() {
          debugPanel.set({clicked: this.get("clicked")});
        });
      }

      if (touchEnabled) {
        // Prevent touch scroll
        $(document).bind("touchmove.InputTouchScroll", function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        });

        // Prevent links from opening popup after a while
        document.documentElement.style.webkitTouchCallout = "none";
      }

      this.on("attach", this.onAttach, this);
      this.on("detach", this.onDetach, this);
    },
    onAttach: function() {
      this.onDetach();
      // Handle keyboard input
      $(document).on("keydown.Input", this.onKeydown.bind(this));
      $(document).on("keyup.Input", this.onKeyup.bind(this));

      if (this.engine.get("gamepadSupported")) {
        this.listenTo(this.engine, "gamepadbuttondown", this.onGamepadButtonDown);
        this.listenTo(this.engine, "gamepadbuttonup", this.onGamepadButtonUp);
        this.listenTo(this.engine, "gamepadaxemove", this.onGamepadAxeMove);
      }
      
      if (this.hasTouchpad()) {
        if (this.get("touchEnabled")) {
          if (window.navigator.msMaxTouchPoints) {
            $(document).on("pointerdown.InputTouchpad", this.onTouchStart.bind(this));
            $(document).on("pointermove.InputTouchpad", this.onTouchMove.bind(this));
            $(document).on("pointerup.InputTouchpad", this.onTouchEnd.bind(this));
            $(document).on("pointercancel.InputTouchpad", this.onTouchEnd.bind(this));
          } else {
            $(document).on("touchstart.InputTouchpad", this.onTouchStart.bind(this));
            $(document).on("touchmove.InputTouchpad", this.onTouchMove.bind(this));
            $(document).on("touchend.InputTouchpad", this.onTouchEnd.bind(this));
            $(document).on("touchleave.InputTouchpad", this.onTouchEnd.bind(this));
            $(document).on("touchcancel.InputTouchpad", this.onTouchEnd.bind(this));
          }
        } else {
          // Fallback to handling mouse events
          $(document).on("mousedown.InputTouchpad", this.onMouseDown.bind(this));
          $(document).on("mousemove.InputTouchpad", this.onMouseDown.bind(this));
          $(document).on("mouseup.InputTouchpad", this.onMouseUp.bind(this));
        }
        for (var i = 0; i < this.buttons.length; i++) {
          this.buttons[i].instance.engine = this.engine;
          this.buttons[i].instance.trigger("attach");
        }
      }
    },
    onDetach: function() {
      this.stopListening();
      $(document).off(".Input");
      this._ongoingTouches = [];
      this._gamepadLastLR = 0;
      this._gamepadLastUD = 0;
      this.set({
        left: false,
        right: false,
        up: false,
        down: false,
        buttonA: false,
        buttonB: false
      });
      if (this.hasTouchpad()) {
        $(document).off(".InputTouchpad");
        for (var i = 0; i < this.buttons.length; i++) {
          this.buttons[i].instance.trigger("detach");
          this.buttons[i].instance.engine = undefined;
        }
      }
    },
    hasTouchpad: function() {
      var drawTouchpad = this.get("drawTouchpad");
      if (_.isBoolean(drawTouchpad)) return drawTouchpad;
      if (drawTouchpad == "auto" && this.get("touchEnabled")) return true;
      return false;
    },
    update: function(dt) {
      return true;
    },
    draw: function(context, options) {
      if (this.hasTouchpad()) {
        for (var i = 0; i < this.buttons.length; i++)
          this.buttons[i].instance.draw(context);
      }

      return this;
    },

    // Keyboard events
    onKeydown: function(e) {
      var buttonId = this.keyCodeToButtonId(e.keyCode),
          attrs = {};
      attrs[e.keyCode] = true;
      if (buttonId) {
        attrs[buttonId] = true;
        if (this.hasTouchpad())
          for (var i = 0; i < this.buttons.length; i++)
            if (this.buttons[i].instance.id == buttonId)
              this.buttons[i].instance.set("pressed", true);
      }
      this.set(attrs);
    },
    onKeyup: function(e) {
      var buttonId = this.keyCodeToButtonId(e.keyCode),
          attrs = {};
      attrs[e.keyCode] = false;
      if (buttonId) {
        attrs[buttonId] = false;
        if (this.hasTouchpad())
          for (var i = 0; i < this.buttons.length; i++)
            if (this.buttons[i].instance.id == buttonId)
              this.buttons[i].instance.set("pressed", false);
      }
      this.set(attrs);
    },

    // Touch events
    detectTouched: function() {
      var attrs = {};

      for (var i = 0; i < this.buttons.length; i++) {
        var button = this.buttons[i].instance,
            touched = false;
        for (var t = 0; t < this._ongoingTouches.length; t++) {
          touched = button.overlaps(
            this._ongoingTouches[t].pageX - this.engine.canvas.offsetLeft,
            this._ongoingTouches[t].pageY - this.engine.canvas.offsetTop
          );
          if (touched) break;
        }
        attrs[button.id] = touched;
        button.set("pressed", touched);
      }

      this.set(attrs);

      return this;
    },
    onTouchStart: function(e) {
      var touches = e.changedTouches || [{
          identifier: e.pointerId,
          pageX: e.pageX,
          pageY: e.pageY
        }];

      for (var i = 0; i < touches.length; i++)
        this._ongoingTouches.push(this._copyTouch(touches[i]));
      this.detectTouched();
    },
    onTouchMove: function(e) {
      var touches = e.changedTouches || [{
          identifier: e.pointerId,
          pageX: e.pageX,
          pageY: e.pageY
        }];

      for (var i = 0; i < touches.length; i++) {
        var idx = this._ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) this._ongoingTouches.splice(idx, 1, this._copyTouch(touches[i]));
      }

      this.detectTouched();
    },
    onTouchEnd: function(e) {
      var touches = e.changedTouches || [{
          identifier: e.pointerId,
          pageX: e.pageX,
          pageY: e.pageY
        }];

      for (var i=0; i < touches.length; i++) {
        var idx = this._ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) this._ongoingTouches.splice(idx, 1);
      }

      this.detectTouched();
    },

    // Mouse events
    onMouseDown: function(e) {
      if (!e.which) return;

      var x = e.pageX - this.engine.canvas.offsetLeft,
          y = e.pageY - this.engine.canvas.offsetTop,
          attrs = {};

      for (var i = 0; i < this.buttons.length; i++) {
        var button = this.buttons[i].instance,
            clicked = button.overlaps(x, y);
        attrs[button.id] = clicked;
        button.set("pressed", clicked);
      }

      this.set(attrs);
    },
    onMouseUp: function(e) {
      for (var i = 0; i < this.buttons.length; i++) {
        var button = this.buttons[i].instance;
        if (this.get(button.id)) {
          this.set(button.id, false);
          button.set("pressed", false);
        }
      }
    },

    // Gamepad
    // Translate gamepad button presses and axe move to keyboard events
    onGamepadButtonDown: function(e) {
      if (e.button == 1 || e.button == 2)
        this.onKeydown({keyCode: 32});
      else if (e.button == 0 || e.button == 3)
        this.onKeydown({keyCode: 67});
    },
    onGamepadButtonUp: function(e) {
      if (e.button == 1 || e.button == 2)
        this.onKeyup({keyCode: 32});
      else if (e.button == 0 || e.button == 3)
        this.onKeyup({keyCode: 67});
    },
    onGamepadAxeMove: function(e) {
      var v = Math.round(e.value);

      if (e.axe == 0 && v != this._gamepadLastLR) {
        if (this._gamepadLastLR != 0)
          this.onKeyup({keyCode: this._gamepadLastLR == -1 ? 37 : 39});
        if (v != 0)
          this.onKeydown({keyCode: v == -1 ? 37 : 39});
        this._gamepadLastLR = v;
      }

      if (e.axe == 1 && v != this._gamepadLastUD) {
        if (this._gamepadLastUD != 0)
          this.onKeyup({keyCode: this._gamepadLastUD == -1 ? 38 : 40});
        if (v != 0)
          this.onKeydown({keyCode: v == -1 ? 38 : 40});
        this._gamepadLastUD = v;
      }
    },

    // Button helpers
    rightPressed: function() {
      return !!this.get("right");
    },
    leftPressed: function() {
      return !!this.get("left");
    },
    upPressed: function() {
      return !!this.get("up");
    },
    downPressed: function() {
      return !!this.get("down");
    },
    buttonBPressed: function() {
      return !!this.get("buttonB");
    },
    buttonAPressed: function() {
      return !!this.get("buttonA");
    },
    keyCodeToButtonId: function(keyCode) {
      switch (keyCode) {
        case 39:
        return "right";
        case 37:
        return "left";
        case 38:
        return "up";
        case 40:
        return "down";
        case 67:
        case 86:
        case 88:
        case 99:
        case 108:
        case 122:
        return "buttonB";
        case 32:
        return "buttonA";
      }
      return null;
    },
    // Touch event helpers.
    // Source: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events
    _copyTouch: function(touch) {
      return {
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY
      };
    },
    _ongoingTouchIndexById: function(idToFind) {
      for (var i = 0; i < this._ongoingTouches.length; i++) {
        var id = this._ongoingTouches[i].identifier;
        if (id == idToFind) return i;
      }
      return -1;
    }
  });

}).call(this);