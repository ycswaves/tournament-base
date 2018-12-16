(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  var Match = /** @class */ (function () {
      function Match() {
      }
      Match.prototype.getWinner = function () {
          return 'winner is A';
      };
      return Match;
  }());

  (function () {
      var match = new Match();
      console.log(match.getWinner());
  })();

})));
//# sourceMappingURL=index.js.map
