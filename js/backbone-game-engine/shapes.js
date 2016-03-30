(function() {

  /**
   *
   * Backbone Game Engine - An elementary HTML5 canvas game engine using Backbone.
   *
   * Copyright (c) 2014 Martin Drapeau
   * https://github.com/martindrapeau/backbone-game-engine
   *
   */
   
  function drawRoundRect(ctx, x, y, width, height, borderRadius, fill, stroke) {
    if (typeof stroke == "undefined" ) stroke = true;
    if (typeof borderRadius === "undefined") borderRadius = 5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + borderRadius, y);
    ctx.lineTo(x + width - borderRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
    ctx.lineTo(x + width, y + height - borderRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
    ctx.lineTo(x + borderRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
    ctx.lineTo(x, y + borderRadius);
    ctx.quadraticCurveTo(x, y, x + borderRadius, y);
    ctx.closePath();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRect(ctx, x, y, width, height, fill, stroke) {
    ctx.save();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, width, height);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.strokeRect(x, y, width, height);
    }
    ctx.restore();
  }

  function drawCircle(ctx, x, y, borderRadius, fill, stroke) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, borderRadius, 0, 2*Math.PI, false);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, fill, stroke, shadowBlur, shadowColor) {
    var rot=Math.PI/2*3;
    var x=cx;
    var y=cy;
    var step=Math.PI/spikes;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(cx,cy-outerRadius);
    for( i=0; i<spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius);

    if (shadowBlur && shadowColor) {
      ctx.shadowBlur = shadowBlur;
      ctx.shadowColor = shadowColor;
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeSyle = stroke;
      ctx.stroke();
    }
    ctx.closePath();

    ctx.restore();
  }

  _.extend(window, {
    drawRect: drawRect,
    drawRoundRect: drawRoundRect,
    drawCircle: drawCircle,
    drawStar: drawStar
  });

}).call(this);