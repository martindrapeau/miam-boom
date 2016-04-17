(function() {

  Backbone.MiamButton = Backbone.Button.extend({
    defaults: _.extend({}, Backbone.Button.prototype.defaults, {
      name: "miam-button",
      backgroundColor: "transparent",
      width: 70,
      height: 70,
      img: "#miam", imgUrl: "img/miam.png",
      imgX: 0, imgY: 540, imgWidth: 70, imgHeight: 70,
      miamSprite: "miam",
      easingTime: 250
    }),
    miams: [{
      name: "miam",
      imgX: 70
    }, {
      name: "miam2",
      imgX: 140
    }, {
      name: "garfield",
      imgX: 0
    }],
    initialize: function(attributes, options) {
      Backbone.Button.prototype.initialize.apply(this, arguments);

      options || (options = {});
      this.world = options.world;

      _.each(this.miams, function(o) {
        o.imgX *= Backbone.RATIO;
      });

      var def = this.getMiamDef(JSON.parse(Backbone.storage[Backbone.LSKEY_MIAM] || JSON.stringify(this.miams[0].name)));
      this.set({
        miamSprite: def.name,
        imgX: def.imgX
      });

      this.on('tap', this.onPressed);
    },
    getMiamDef: function(name) {
      name || (name = this.get("miamSprite"));
      var names = _.map(this.miams, function(o) {return o.name;}),
          index = _.indexOf(names, name);
      return this.miams[index];
    },
    getNextMiamDef: function(name) {
      name || (name = this.get("miamSprite"));
      var names = _.map(this.miams, function(o) {return o.name;}),
          index = _.indexOf(names, name),
          next = index + 1 >= names.length ? 0 : index + 1;
      return this.miams[next];
    },
    onPressed: function(e) {
      var def = this.getNextMiamDef();
      this.set({
        miamSprite: def.name,
        imgX: def.imgX
      });

      var hero = this.world.getHero();
      if (hero) {
        var cls = _.classify(def.name);
        this.world.add(new Backbone[cls]({
          name: def.name,
          x: hero.get("x"),
          y: hero.get("y")
        }));
        this.world.remove(hero);
      }

      Backbone.storage[Backbone.LSKEY_MIAM] = JSON.stringify(def.name);
    }
  });

}).call(this);