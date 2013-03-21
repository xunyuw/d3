import "../core/identity";
import "../core/noop";
import "geo";
import "stream";
import "area";

d3.geo.bounds = d3_geo_bounds(d3_identity);

function d3_geo_bounds(projectStream) {
  var x0, y0, x1, y1, // bounds
      x_, // previous x-coordinate
      invert; // x1 < x0

  var bound = {
    point: point,
    lineStart: d3_noop,
    lineEnd: d3_noop,

    // While inside a polygon, ignore points in holes.
    polygonStart: function() {
      bound.point = ringPoint;
      bound.lineStart = ringStart;
      bound.lineEnd = ringEnd;
      d3_geo_areaSum = 0;
      d3_geo_area.polygonStart();
    },
    polygonEnd: function() {
      d3_geo_area.polygonEnd();
      bound.point = point;
      bound.lineStart = bound.lineEnd = d3_noop;
    }
  };

  function point(x, y) {
    if (!invert && (invert = Math.abs(x - x_) > 180)) {
      if (x < x0) x1 = x;
      else x0 = x;
    } else if (invert) {
      if (x1 < x && x < x0) {
        if (x - x1 > x - x0) x1 = x;
        else x0 = x;
      }
    } else {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
    }
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    x_ = x;
  }

  function ringPoint(x, y) {
    d3_geo_area.point(x, y);
    point(x, y);
  }

  function ringStart() {
    d3_geo_area.lineStart();
  }

  function ringEnd() {
    d3_geo_area.lineEnd();
    // Counter-clockwise exterior.
    if (Math.atan2(d3_geo_areaRingV, d3_geo_areaRingU) < 0) x0 = -(x1 = 180), y0 = -(y1 = 90), invert = false;
    // Ignore holes.
    bound.point = bound.lineEnd = d3_noop;
  }

  return function(feature) {
    y1 = x1 = -(x0 = y0 = Infinity);
    x_ = NaN;
    invert = false;
    d3.geo.stream(feature, projectStream(bound));
    return [[x0, y0], [x1, y1]];
  };
}
