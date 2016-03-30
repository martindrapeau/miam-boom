(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */
  /*
    Modal stuff:


    HTML
        <div id="modal-alert" class="modal" style="display:none;">
            <label class="message"></label>
            <div class="buttons">
                <button class="confirm">Ok</button>
            </div>
        </div>

        <div id="modal-confirm" class="modal" style="display:none;">
            <label class="message"></label>
            <div class="buttons">
                <button class="confirm">Ok</button>
                <button class="cancel">Ok</button>
            </div>
        </div>

        <div id="modal-prompt" class="modal" style="display:none;">
            <label class="message"></label>
            <div class="control-group">
                <input class="control" name="input" type="text" value="" />
            </div>
            <div class="buttons">
                <button class="confirm">Ok</button>
                <button class="cancel">Cancel</button>
            </div>
        </div>

    CSS
            input, button, textarea {
                font-family: "arcade", Verdana, Arial, Sans-Serif;
            }
            button {
                cursor: pointer;
            }
            .modal {
                position: fixed;
                top: 10%;
                width: 480px;
                left: 26%;
                background-color: rgba(28, 28, 28, 0.9);
                border-radius: 5px;
                text-align: center;
                color: white;
                padding: 30px 0;
            }
            .modal input[type=text],
            .modal input[type=number] {
                display: inline-block;
                background-color: transparent;
                color: white;
                font-size: 14px;
                margin: 10px 0;
                padding: 10px;
                border: 2px solid #999;
                border-radius: 5px;
                width: 76%;
            }
            .modal label {
                font-size: 18px;
                display: block;
            }
            .modal button {
                font-size: 14px;
                background-color: #ddd;
                color: #333;
                padding: 10px;
                margin: 20px 1%;
                border: none;
                border-radius: 5px;
                width: 38%;
            }
            .modal button:hover {
                background-color: #f0f0f0;
            }
            .modal button:active {
                color: #000;
                background-color: #999;
            }

   */

  Backbone.AlertView = Backbone.View.extend({
    events: {
      "click .confirm": "onConfirm"
    },
    initialize: function(options) {

    },
    onConfirm: function(e) {

    },
    close: function() {
      this.$el.hide();
    }
  });


  _.extend(Backbone, {
    alert: function(message) {
      window.alert(message);
    },
    confirm: function(message, callback, options) {
      if (window.Cocoon && window.Cocoon.Dialog) {
        window.Cocoon.Dialog.confirm(_.extend({
          message: message,
        }, options || {}), callback);
      } else {
        callback(window.confirm(message));
      }
    },
    prompt: function(message, callback, options) {
      options || (options = {});
      if (window.Cocoon && window.Cocoon.Dialog) {
        window.Cocoon.Dialog.prompt({ 
          title: options.title || "",
          message: message,
          text: options.name || "",
          type: Cocoon.Dialog.keyboardType.TEXT,
          confirmText: options.confirmText || "Ok",
          cancelText: options.cancelText || "Cancel"
        }, {
          success : function(text) {
            callback(text);
          },
          cancel : function() {
            callback();
          }
        });
      } else {
        callback(window.prompt(message));
      }
    }
  });

}).call(this);