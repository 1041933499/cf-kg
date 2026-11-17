var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "node_modules/qrcode/lib/can-promise.js"(exports, module) {
    module.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports) {
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports.getSymbolSize = /* @__PURE__ */ __name(function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    }, "getSymbolSize");
    exports.getSymbolTotalCodewords = /* @__PURE__ */ __name(function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    }, "getSymbolTotalCodewords");
    exports.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports.setToSJISFunction = /* @__PURE__ */ __name(function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    }, "setToSJISFunction");
    exports.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports.toSJIS = /* @__PURE__ */ __name(function toSJIS(kanji) {
      return toSJISFunction(kanji);
    }, "toSJIS");
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
    exports.L = { bit: 1 };
    exports.M = { bit: 0 };
    exports.Q = { bit: 3 };
    exports.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports.L;
        case "m":
        case "medium":
          return exports.M;
        case "q":
        case "quartile":
          return exports.Q;
        case "h":
        case "high":
          return exports.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    __name(fromString, "fromString");
    exports.isValid = /* @__PURE__ */ __name(function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    }, "isValid");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    __name(BitBuffer, "BitBuffer");
    BitBuffer.prototype = {
      get: /* @__PURE__ */ __name(function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      }, "get"),
      put: /* @__PURE__ */ __name(function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      }, "put"),
      getLengthInBits: /* @__PURE__ */ __name(function() {
        return this.length;
      }, "getLengthInBits"),
      putBit: /* @__PURE__ */ __name(function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }, "putBit")
    };
    module.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    __name(BitMatrix, "BitMatrix");
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    exports.getRowColCoords = /* @__PURE__ */ __name(function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    }, "getRowColCoords");
    exports.getPositions = /* @__PURE__ */ __name(function getPositions(version) {
      const coords = [];
      const pos = exports.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports.getPositions = /* @__PURE__ */ __name(function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
    exports.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports.isValid = /* @__PURE__ */ __name(function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    }, "isValid");
    exports.from = /* @__PURE__ */ __name(function from(value) {
      return exports.isValid(value) ? parseInt(value, 10) : void 0;
    }, "from");
    exports.getPenaltyN1 = /* @__PURE__ */ __name(function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module2 = data.get(row, col);
          if (module2 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module2;
            sameCountCol = 1;
          }
          module2 = data.get(col, row);
          if (module2 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module2;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    }, "getPenaltyN1");
    exports.getPenaltyN2 = /* @__PURE__ */ __name(function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    }, "getPenaltyN2");
    exports.getPenaltyN3 = /* @__PURE__ */ __name(function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    }, "getPenaltyN3");
    exports.getPenaltyN4 = /* @__PURE__ */ __name(function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    }, "getPenaltyN4");
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    __name(getMaskAt, "getMaskAt");
    exports.applyMask = /* @__PURE__ */ __name(function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    }, "applyMask");
    exports.getBestMask = /* @__PURE__ */ __name(function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports.applyMask(p, data);
        const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
        exports.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    }, "getBestMask");
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports.getBlocksCount = /* @__PURE__ */ __name(function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getBlocksCount");
    exports.getTotalCodewordsCount = /* @__PURE__ */ __name(function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getTotalCodewordsCount");
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports) {
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (/* @__PURE__ */ __name(function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    }, "initTables"))();
    exports.log = /* @__PURE__ */ __name(function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    }, "log");
    exports.exp = /* @__PURE__ */ __name(function exp(n) {
      return EXP_TABLE[n];
    }, "exp");
    exports.mul = /* @__PURE__ */ __name(function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    }, "mul");
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports) {
    var GF = require_galois_field();
    exports.mul = /* @__PURE__ */ __name(function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    }, "mul");
    exports.mod = /* @__PURE__ */ __name(function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    }, "mod");
    exports.generateECPolynomial = /* @__PURE__ */ __name(function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    }, "generateECPolynomial");
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    __name(ReedSolomonEncoder, "ReedSolomonEncoder");
    ReedSolomonEncoder.prototype.initialize = /* @__PURE__ */ __name(function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    }, "initialize");
    ReedSolomonEncoder.prototype.encode = /* @__PURE__ */ __name(function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    }, "encode");
    module.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports) {
    exports.isValid = /* @__PURE__ */ __name(function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    }, "isValid");
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports) {
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports.KANJI = new RegExp(kanji, "g");
    exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports.BYTE = new RegExp(byte, "g");
    exports.NUMERIC = new RegExp(numeric, "g");
    exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports.testKanji = /* @__PURE__ */ __name(function testKanji(str) {
      return TEST_KANJI.test(str);
    }, "testKanji");
    exports.testNumeric = /* @__PURE__ */ __name(function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    }, "testNumeric");
    exports.testAlphanumeric = /* @__PURE__ */ __name(function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    }, "testAlphanumeric");
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports) {
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports.MIXED = {
      bit: -1
    };
    exports.getCharCountIndicator = /* @__PURE__ */ __name(function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    }, "getCharCountIndicator");
    exports.getBestModeForData = /* @__PURE__ */ __name(function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports.KANJI;
      else return exports.BYTE;
    }, "getBestModeForData");
    exports.toString = /* @__PURE__ */ __name(function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    }, "toString");
    exports.isValid = /* @__PURE__ */ __name(function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    }, "isValid");
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports.NUMERIC;
        case "alphanumeric":
          return exports.ALPHANUMERIC;
        case "kanji":
          return exports.KANJI;
        case "byte":
          return exports.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    __name(fromString, "fromString");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports) {
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForDataLength, "getBestVersionForDataLength");
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    __name(getReservedBitsCount, "getReservedBitsCount");
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    __name(getTotalBitsFromDataArray, "getTotalBitsFromDataArray");
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForMixedData, "getBestVersionForMixedData");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    }, "from");
    exports.getCapacity = /* @__PURE__ */ __name(function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    }, "getCapacity");
    exports.getBestVersionForData = /* @__PURE__ */ __name(function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    }, "getBestVersionForData");
    exports.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports) {
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    __name(NumericData, "NumericData");
    NumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    }, "getBitsLength");
    NumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    NumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    NumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    }, "write");
    module.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    __name(AlphanumericData, "AlphanumericData");
    AlphanumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    }, "getBitsLength");
    AlphanumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    AlphanumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    AlphanumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    }, "write");
    module.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    __name(ByteData, "ByteData");
    ByteData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 8;
    }, "getBitsLength");
    ByteData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    ByteData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    }, "getBitsLength");
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    __name(KanjiData, "KanjiData");
    KanjiData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 13;
    }, "getBitsLength");
    KanjiData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    KanjiData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    }, "getBitsLength");
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports, module) {
    "use strict";
    var dijkstra = {
      single_source_shortest_paths: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open = dijkstra.PriorityQueue.make();
        open.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open.empty()) {
          closest = open.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      }, "single_source_shortest_paths"),
      extract_shortest_path_from_predecessor_list: /* @__PURE__ */ __name(function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      }, "extract_shortest_path_from_predecessor_list"),
      find_path: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      }, "find_path"),
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: /* @__PURE__ */ __name(function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        }, "make"),
        default_sorter: /* @__PURE__ */ __name(function(a, b) {
          return a.cost - b.cost;
        }, "default_sorter"),
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: /* @__PURE__ */ __name(function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        }, "push"),
        /**
         * Return the highest priority element in the queue.
         */
        pop: /* @__PURE__ */ __name(function() {
          return this.queue.shift();
        }, "pop"),
        empty: /* @__PURE__ */ __name(function() {
          return this.queue.length === 0;
        }, "empty")
      }
    };
    if (typeof module !== "undefined") {
      module.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports) {
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    __name(getStringByteLength, "getStringByteLength");
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    __name(getSegments, "getSegments");
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    __name(getSegmentsFromString, "getSegmentsFromString");
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    __name(getSegmentBitsLength, "getSegmentBitsLength");
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    __name(mergeSegments, "mergeSegments");
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    __name(buildNodes, "buildNodes");
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    __name(buildGraph, "buildGraph");
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    __name(buildSingleSegment, "buildSingleSegment");
    exports.fromArray = /* @__PURE__ */ __name(function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    }, "fromArray");
    exports.fromString = /* @__PURE__ */ __name(function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports.fromArray(mergeSegments(optimizedSegs));
    }, "fromString");
    exports.rawSplit = /* @__PURE__ */ __name(function rawSplit(data) {
      return exports.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    }, "rawSplit");
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports) {
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupFinderPattern, "setupFinderPattern");
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    __name(setupTimingPattern, "setupTimingPattern");
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupAlignmentPattern, "setupAlignmentPattern");
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    __name(setupVersionInfo, "setupVersionInfo");
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    __name(setupFormatInfo, "setupFormatInfo");
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    __name(setupData, "setupData");
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    __name(createData, "createData");
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    __name(createCodewords, "createCodewords");
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    __name(createSymbol, "createSymbol");
    exports.create = /* @__PURE__ */ __name(function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    }, "create");
  }
});

// node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "node_modules/qrcode/lib/renderer/utils.js"(exports) {
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    __name(hex2rgba, "hex2rgba");
    exports.getOptions = /* @__PURE__ */ __name(function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width,
        scale: width ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    }, "getOptions");
    exports.getScale = /* @__PURE__ */ __name(function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    }, "getScale");
    exports.getImageWidth = /* @__PURE__ */ __name(function getImageWidth(qrSize, opts) {
      const scale = exports.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    }, "getImageWidth");
    exports.qrToImageData = /* @__PURE__ */ __name(function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    }, "qrToImageData");
  }
});

// node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "node_modules/qrcode/lib/renderer/canvas.js"(exports) {
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    __name(clearCanvas, "clearCanvas");
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    __name(getCanvasElement, "getCanvasElement");
    exports.render = /* @__PURE__ */ __name(function render(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    }, "render");
    exports.renderToDataURL = /* @__PURE__ */ __name(function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    }, "renderToDataURL");
  }
});

// node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    __name(getColorAttrib, "getColorAttrib");
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    __name(svgCmd, "svgCmd");
    function qrToPath(data, size, margin) {
      let path = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path;
    }
    __name(qrToPath, "qrToPath");
    exports.render = /* @__PURE__ */ __name(function render(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    }, "render");
  }
});

// node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "node_modules/qrcode/lib/browser.js"(exports) {
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    __name(renderCanvas, "renderCanvas");
    exports.create = QRCode2.create;
    exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// src/qr-render.js
var qr_render_exports = {};
__export(qr_render_exports, {
  toSvg: () => toSvg
});
async function toSvg(text) {
  const svg = await import_qrcode.default.toString(text, {
    type: "svg",
    margin: 2,
    width: 220,
    errorCorrectionLevel: "M"
  });
  return svg;
}
var import_qrcode;
var init_qr_render = __esm({
  "src/qr-render.js"() {
    import_qrcode = __toESM(require_browser());
    __name(toSvg, "toSvg");
  }
});

// src/kugou/crypto.js
import { createHash, createCipheriv, createDecipheriv, publicEncrypt, constants } from "node:crypto";

// src/kugou/config.js
var LITE = {
  isLite: true,
  appid: 3116,
  // liteAppid
  clientver: 11436,
  // liteClientver
  androidSignSalt: "LnT6xpN3khm36zse0QzvmgTZ3waWdRSA",
  signKeySalt: "185672dd44712f60bb1736df5a377e82",
  // publicLiteRasKey
  publicRsaB64: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDECi0Np2UR87scwrvTr72L6oO01rBbbBPriSDFPxr3Z5syug0O24QyQO8bg27+0+4kBzTBTBOZ/WWU0WryL1JSXRTXLgFVxtzIY41Pe7lPOgsfTCn5kZcvKhYKJesKnnJDNr5/abvTGf+rHG3YRwsCHcQ08/q6ifSioBszvb3QiwIDAQAB",
  loginTokenAes: { key: "c24f74ca2820225badc01946dba4fdf7", iv: "adc01946dba4fdf7" },
  loginByTokenPath: "/v4/login_by_token"
};
var DEFAULT_PLATFORM = {
  isLite: false,
  appid: 1005,
  // config.json appid
  clientver: 20489,
  // config.json clientver
  androidSignSalt: "OIlwieks28dk2k092lksi2UIkp",
  signKeySalt: "57ae12eb6890223e355ccfcb74edf70d",
  // publicRasKey
  publicRsaB64: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIAG7QOELSYoIJvTFJhMpe1s/gbjDJX51HBNnEl5HXqTW6lQ7LC8jr9fWZTwusknp+sVGzwd40MwP6U5yDE27M/X1+UR4tvOGOqp94TJtQ1EPnWGWXngpeIW5GxoQGao1rmYWAu6oi1z9XkChrsUdC6DJE5E221wf/4WLFxwAtRQIDAQAB",
  loginTokenAes: { key: "90b8382a1bb4ccdcf063102053fd75b8", iv: "f063102053fd75b8" },
  loginByTokenPath: "/v5/login_by_token"
};
var IS_LITE = false;
var P = IS_LITE ? LITE : DEFAULT_PLATFORM;
var CONFIG = {
  srcappid: 2919,
  appid: P.appid,
  clientver: P.clientver,
  isLite: P.isLite
};
var ANDROID_SIGN_SALT = P.androidSignSalt;
var WEB_SIGN_SALT = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt";
var SIGN_KEY_SALT = P.signKeySalt;
var LOGIN_TOKEN_AES = P.loginTokenAes;
var LOGIN_BY_TOKEN_PATH = P.loginByTokenPath;
function toPem(body) {
  const lines = body.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----
${lines.join("\n")}
-----END PUBLIC KEY-----`;
}
__name(toPem, "toPem");
var PUBLIC_RSA_KEY = toPem(P.publicRsaB64);
var GATEWAY = "https://gateway.kugou.com";
var DEFAULT_UA = "Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi";

// src/kugou/crypto.js
function randomString(len = 16) {
  const keyString = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += keyString[Math.ceil((keyString.length - 1) * Math.random())];
  }
  return out;
}
__name(randomString, "randomString");
function cryptoMd5(data) {
  const input = typeof data === "object" ? JSON.stringify(data) : data;
  return createHash("md5").update(input).digest("hex");
}
__name(cryptoMd5, "cryptoMd5");
function cryptoAesEncrypt(data, opt) {
  if (typeof data === "object") data = JSON.stringify(data);
  const buffer = Buffer.from(data, "utf8");
  let key, iv, tempKey = "";
  if (opt?.key && opt?.iv) {
    key = opt.key;
    iv = opt.iv;
  } else {
    tempKey = opt?.key || randomString(16).toLowerCase();
    key = cryptoMd5(tempKey).substring(0, 32);
    iv = key.substring(key.length - 16, key.length);
  }
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const dest = Buffer.concat([cipher.update(buffer), cipher.final()]);
  if (opt?.key && opt?.iv) return dest.toString("hex");
  return { str: dest.toString("hex"), key: tempKey };
}
__name(cryptoAesEncrypt, "cryptoAesEncrypt");
function cryptoAesDecrypt(data, key, iv) {
  if (!iv) key = cryptoMd5(key).substring(0, 32);
  iv = iv || key.substring(key.length - 16, key.length);
  const cipher = createDecipheriv("aes-256-cbc", key, iv);
  const dest = Buffer.concat([cipher.update(Buffer.from(data, "hex")), cipher.final()]);
  try {
    return JSON.parse(dest.toString("utf8"));
  } catch (e) {
    return dest.toString("utf8");
  }
}
__name(cryptoAesDecrypt, "cryptoAesDecrypt");
function cryptoRSAEncrypt(data, publicKey) {
  if (typeof data === "object") data = JSON.stringify(data);
  const buffer = Buffer.from(data, "utf8");
  const _buffer = Buffer.concat([buffer, Buffer.alloc(128 - buffer.length)]);
  return publicEncrypt(
    { key: publicKey || PUBLIC_RSA_KEY, padding: constants.RSA_NO_PADDING },
    _buffer
  ).toString("hex");
}
__name(cryptoRSAEncrypt, "cryptoRSAEncrypt");

// src/kugou/helper.js
function signatureWebParams(params) {
  const paramsString = Object.keys(params).map((key) => `${key}=${params[key]}`).sort().join("");
  return cryptoMd5(`${WEB_SIGN_SALT}${paramsString}${WEB_SIGN_SALT}`);
}
__name(signatureWebParams, "signatureWebParams");
function signatureAndroidParams(params, data) {
  const paramsString = Object.keys(params).sort().map(
    (key) => `${key}=${typeof params[key] === "object" ? JSON.stringify(params[key]) : params[key]}`
  ).join("");
  return cryptoMd5(`${ANDROID_SIGN_SALT}${paramsString}${data || ""}${ANDROID_SIGN_SALT}`);
}
__name(signatureAndroidParams, "signatureAndroidParams");

// src/kugou/request.js
function createRequest(options) {
  return (async () => {
    const dfid = options?.cookie?.dfid || "-";
    const mid = `${cryptoMd5(dfid)}${cryptoMd5(dfid).slice(0, 7)}`;
    const uuid = cryptoMd5(`${dfid}${mid}`);
    const token = options?.cookie?.token || "";
    const userid = options?.cookie?.userid || 0;
    const clienttime = Math.floor(Date.now() / 1e3);
    const ip = options?.realIP || options?.ip || "";
    const defaultParams = {
      dfid,
      mid,
      uuid,
      appid: CONFIG.appid,
      clientver: CONFIG.clientver,
      userid,
      clienttime
    };
    if (token) defaultParams["token"] = token;
    const params = options?.clearDefaultParams ? options?.params || {} : Object.assign({}, defaultParams, options?.params || {});
    const headers = { dfid, clienttime: params.clienttime, mid };
    if (ip) {
      headers["X-Real-IP"] = ip;
      headers["X-Forwarded-For"] = ip;
    }
    const data = typeof options?.data === "object" ? JSON.stringify(options?.data) : options?.data || "";
    if (!params["signature"] && !options.notSignature) {
      switch (options?.encryptType) {
        case "web":
          params["signature"] = signatureWebParams(params);
          break;
        case "android":
        default:
          params["signature"] = signatureAndroidParams(params, data);
          break;
      }
    }
    const baseURL = options?.baseURL || GATEWAY;
    const reqHeaders = Object.assign(
      { "User-Agent": DEFAULT_UA },
      options?.headers || {},
      headers,
      { clienttime: params.clienttime }
    );
    let finalUrl = `${baseURL}${options.url}`;
    let searchParams;
    if (baseURL.includes("openapicdn")) {
      searchParams = "";
      finalUrl += `?${Object.keys(params).map((key) => `${key}=${params[key]}`).join("&")}`;
    } else {
      const sp = new URLSearchParams();
      for (const key of Object.keys(params)) {
        sp.append(key, String(params[key]));
      }
      searchParams = sp.toString();
      if (searchParams) {
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + searchParams;
      }
    }
    const answer = { status: 500, body: {}, cookie: [], headers: {} };
    try {
      const init = {
        method: options.method,
        headers: reqHeaders
      };
      if (options.data !== void 0 && options.method === "POST") {
        if (typeof options.data === "object") {
          init.body = JSON.stringify(options.data);
          if (!reqHeaders["content-type"] && !reqHeaders["Content-Type"]) {
            reqHeaders["content-type"] = "application/json;charset=utf-8";
          }
        } else {
          init.body = options.data;
        }
      }
      const response = await fetch(finalUrl, init);
      const text = await response.text();
      const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
      answer.cookie = setCookies.map((x) => parseCookieString(x));
      if (response.headers.get("ssa-code")) {
        answer.headers["ssa-code"] = response.headers.get("ssa-code");
      }
      try {
        answer.body = JSON.parse(text);
      } catch (error) {
        answer.body = text;
      }
      const body = answer.body;
      if (body?.status === 0 || body?.error_code && body.error_code !== 0) {
        answer.status = 502;
        throw answer;
      }
      answer.status = 200;
      return answer;
    } catch (e) {
      if (e && e.status === 502 && e.body !== void 0) throw e;
      const responseBody = e?.body;
      const responseSummary = responseBody && typeof responseBody === "object" ? {
        status: responseBody.status,
        code: responseBody.code,
        error_code: responseBody.error_code,
        errcode: responseBody.errcode,
        msg: responseBody.msg || responseBody.message || responseBody.error
      } : {};
      const err = { status: 502, body: {}, cookie: [], headers: {} };
      err.body = {
        status: 0,
        msg: responseSummary.msg || e?.message || "request failed",
        code: e?.code,
        httpStatus: e?.response?.status,
        ...responseSummary
      };
      throw err;
    }
  })();
}
__name(createRequest, "createRequest");
function parseCookieString(cookie) {
  const t = cookie.replace(/\s*(Domain|domain|path|expires)=[^(;|$)]+;*/g, "");
  return t.replace(/;HttpOnly/g, "");
}
__name(parseCookieString, "parseCookieString");

// src/kugou/endpoints.js
function cookieObj(user) {
  return { token: user.token, userid: user.userid };
}
__name(cookieObj, "cookieObj");
async function userDetail(user) {
  const clienttime_ms = Math.floor(Date.now() / 1e3);
  const pk = cryptoRSAEncrypt({
    token: user.token,
    clienttime: clienttime_ms
  }).toUpperCase();
  return createRequest({
    url: "/v3/get_my_info",
    method: "POST",
    data: { visit_time: clienttime_ms, usertype: 1, p: pk, userid: Number(user.userid) },
    params: { plat: 1 },
    encryptType: "android",
    cookie: cookieObj(user),
    headers: { "x-router": "usercenter.kugou.com" }
  });
}
__name(userDetail, "userDetail");
async function loginByToken(user) {
  const dateNow = Date.now();
  const encrypt = cryptoAesEncrypt(
    { clienttime: Math.floor(dateNow / 1e3), token: user.token },
    { key: LOGIN_TOKEN_AES.key, iv: LOGIN_TOKEN_AES.iv }
  );
  const encryptParams = cryptoAesEncrypt({});
  const pk = cryptoRSAEncrypt({ clienttime_ms: dateNow, key: encryptParams.key });
  const dataMap = {
    dfid: "-",
    p3: encrypt,
    plat: 1,
    t1: 0,
    t2: 0,
    t3: "MCwwLDAsMCwwLDAsMCwwLDA=",
    pk,
    params: encryptParams.str,
    userid: user.userid,
    clienttime_ms: dateNow
  };
  const res = await createRequest({
    baseURL: "http://login.user.kugou.com",
    url: LOGIN_BY_TOKEN_PATH,
    method: "POST",
    data: dataMap,
    cookie: cookieObj(user),
    encryptType: "android",
    headers: { "x-router": "login.user.kugou.com" }
  });
  const body = res.body;
  if (body?.status && body.status === 1) {
    if (body?.data?.secu_params) {
      const getToken = cryptoAesDecrypt(body.data.secu_params, encryptParams.key);
      if (typeof getToken === "object") {
        res.body.data = { ...body.data, ...getToken };
      } else {
        res.body.data["token"] = getToken;
      }
    }
    res.cookie.push(`token=${res.body.data["token"]}`);
    res.cookie.push(`userid=${res.body.data?.userid || 0}`);
  }
  return res;
}
__name(loginByToken, "loginByToken");
function youthListenSong(user) {
  return createRequest({
    url: "/youth/v2/report/listen_song",
    method: "POST",
    data: { mixsongid: 666075191 },
    params: { clientver: 10566 },
    encryptType: "android",
    cookie: cookieObj(user),
    headers: {
      "user-agent": "Android13-1070-10566-201-0-ReportPlaySongToServerProtocol-wifi",
      "content-type": "application/json; charset=utf-8"
    }
  });
}
__name(youthListenSong, "youthListenSong");
function youthVip(user) {
  const time = Date.now();
  return createRequest({
    url: "/youth/v1/ad/play_report",
    method: "POST",
    data: { ad_id: 12307537187, play_end: time, play_start: time - 3e4 },
    encryptType: "android",
    cookie: cookieObj(user)
  });
}
__name(youthVip, "youthVip");
function userVipDetail(user) {
  return createRequest({
    baseURL: "https://kugouvip.kugou.com",
    url: "/v1/get_union_vip",
    method: "GET",
    params: { busi_type: "concept" },
    encryptType: "android",
    cookie: cookieObj(user)
  });
}
__name(userVipDetail, "userVipDetail");
function qrKey() {
  return createRequest({
    baseURL: "https://login-user.kugou.com",
    url: "/v2/qrcode",
    method: "GET",
    params: {
      appid: 1001,
      type: 1,
      plat: 4,
      qrcode_txt: `https://h5.kugou.com/apps/loginQRCode/html/index.html?appid=${CONFIG.appid}&`,
      srcappid: CONFIG.srcappid
    },
    encryptType: "web",
    cookie: {}
  });
}
__name(qrKey, "qrKey");
function qrCheck(key) {
  return createRequest({
    baseURL: "https://login-user.kugou.com",
    url: "/v2/get_userinfo_qrcode",
    method: "GET",
    params: { plat: 4, appid: CONFIG.appid, srcappid: CONFIG.srcappid, qrcode: key },
    encryptType: "web",
    cookie: {}
  });
}
__name(qrCheck, "qrCheck");

// src/checkin.js
var delay = /* @__PURE__ */ __name((ms) => new Promise((r) => setTimeout(r, ms)), "delay");
function beijingDate(d = /* @__PURE__ */ new Date()) {
  const t = new Date(d.getTime() + 8 * 60 * 60 * 1e3);
  const DD = String(t.getUTCDate()).padStart(2, "0");
  const MM = String(t.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = t.getUTCFullYear();
  return `${yyyy}-${MM}-${DD}`;
}
__name(beijingDate, "beijingDate");
function maskDisplayName(name) {
  const s = String(name ?? "");
  if (s.length === 0) return "";
  if (s.length === 1) return `${s[0]}********`;
  if (s.length === 2) return `${s[0]}********${s[1]}`;
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
}
__name(maskDisplayName, "maskDisplayName");
function maskIdentifier(value) {
  const s = String(value ?? "");
  if (s.length <= 2) return "*".repeat(s.length);
  if (s.length <= 6) return `${s[0]}***${s[s.length - 1]}`;
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
}
__name(maskIdentifier, "maskIdentifier");
function summarizeResponse(resp) {
  const b = resp?.body ?? resp;
  if (!b || typeof b !== "object") return { raw: String(b).slice(0, 200) };
  return {
    status: b.status,
    error_code: b.error_code,
    code: b.code,
    msg: b.msg || b.message || b.error
  };
}
__name(summarizeResponse, "summarizeResponse");
async function checkinOne(user, isSunday) {
  const safeUserId = maskIdentifier(user.userid);
  const logs = [];
  const log = /* @__PURE__ */ __name((level, msg) => logs.push({ level, msg, t: Date.now() }), "log");
  let userDetailRes;
  try {
    userDetailRes = await userDetail(user);
  } catch (e) {
    log("error", `token \u9A8C\u8BC1\u8BF7\u6C42\u5931\u8D25: ${e?.body?.msg || e?.message || e}`);
    return {
      result: {
        nickname: safeUserId,
        status: "\u5931\u8D25",
        listen: "\u672A\u77E5",
        vipClaim: "0/0",
        vipExpiry: "\u672A\u77E5",
        error: "token \u9A8C\u8BC1\u8BF7\u6C42\u5931\u8D25",
        logs
      },
      user,
      needRefresh: false
    };
  }
  if (userDetailRes?.body?.data?.nickname == null) {
    log("error", `token \u8FC7\u671F\u6216\u8D26\u53F7\u4E0D\u5B58\u5728, userid: ${safeUserId}`);
    return {
      result: {
        nickname: safeUserId,
        status: "\u5931\u8D25",
        listen: "\u8D26\u53F7\u4E0D\u5B58\u5728",
        vipClaim: "0/8",
        vipExpiry: "\u672A\u77E5",
        error: "token\u8FC7\u671F\u6216\u8D26\u53F7\u4E0D\u5B58\u5728",
        logs
      },
      user,
      needRefresh: false
    };
  }
  const safeNickname = maskDisplayName(userDetailRes.body.data.nickname);
  log("info", `\u8D26\u53F7 ${safeNickname} \u5F00\u59CB\u9886\u53D6VIP...`);
  let needRefresh = false;
  if (isSunday) {
    try {
      const refreshToken = await loginByToken(user);
      if (refreshToken?.body?.status == 1) {
        if (refreshToken?.body?.data?.token !== user.token) {
          needRefresh = true;
          log("warn", `\u8D26\u53F7 ${safeNickname} \u9700\u8981\u5237\u65B0token`);
          user = { ...user, token: refreshToken.body.data.token };
        }
      }
    } catch (e) {
      log("warn", `token \u5237\u65B0\u5931\u8D25\uFF08\u4E0D\u5F71\u54CD\u672C\u6B21\u7B7E\u5230\uFF09: ${e?.body?.msg || e?.message || e}`);
    }
  }
  log("info", "\u5F00\u59CB\u542C\u6B4C\u9886\u53D6VIP...");
  let listenStatus = "\u672A\u77E5";
  try {
    const listen = await youthListenSong(user);
    if (listen.body.status === 1) {
      log("success", "\u542C\u6B4C\u9886\u53D6\u6210\u529F");
      listenStatus = "\u6210\u529F";
    } else if (listen.body.error_code === 130012) {
      log("success", "\u4ECA\u65E5\u5DF2\u9886\u53D6");
      listenStatus = "\u4ECA\u65E5\u5DF2\u9886\u53D6";
    } else {
      log("error", `\u542C\u6B4C\u9886\u53D6\u5931\u8D25: ${JSON.stringify(summarizeResponse(listen))}`);
      listenStatus = "\u5931\u8D25";
    }
  } catch (e) {
    if (e?.body?.error_code === 130012) {
      log("success", "\u4ECA\u65E5\u5DF2\u9886\u53D6");
      listenStatus = "\u4ECA\u65E5\u5DF2\u9886\u53D6";
    } else {
      log("error", `\u542C\u6B4C\u9886\u53D6\u5F02\u5E38: ${JSON.stringify(e?.body || e?.message || e)}`);
      listenStatus = "\u5931\u8D25";
    }
  }
  log("info", "\u5F00\u59CB\u9886\u53D6VIP(\u5E7F\u544A)...");
  let claimCount = 0;
  let claimTotal = 0;
  let adFailed = false;
  for (let i = 1; i <= 8; i++) {
    try {
      const ad = await youthVip(user);
      claimTotal = i;
      if (ad.body.status === 1) {
        log("success", `\u7B2C${i}\u6B21\u9886\u53D6\u6210\u529F`);
        claimCount++;
        if (i !== 8) await delay(30 * 1e3);
      } else if (ad.body.error_code === 30002) {
        log("info", "\u4ECA\u5929\u6B21\u6570\u5DF2\u7528\u5149");
        break;
      } else {
        log("error", `\u7B2C${i}\u6B21\u9886\u53D6\u5931\u8D25: ${JSON.stringify(summarizeResponse(ad))}`);
        adFailed = true;
        break;
      }
    } catch (e) {
      if (e?.body?.error_code === 30002) {
        log("info", "\u4ECA\u5929\u6B21\u6570\u5DF2\u7528\u5149");
        break;
      }
      log("error", `\u7B2C${i}\u6B21\u9886\u53D6\u5F02\u5E38: ${JSON.stringify(e?.body || e?.message || e)}`);
      adFailed = true;
      break;
    }
  }
  let vipExpiry = "\u672A\u77E5";
  let vipDetailFailed = false;
  try {
    const vip_details = await userVipDetail(user);
    if (vip_details.body.status === 1 && Array.isArray(vip_details.body.data?.busi_vip) && vip_details.body.data.busi_vip.length > 0) {
      vipExpiry = vip_details.body.data.busi_vip[0].vip_end_time;
      log("info", `VIP\u5230\u671F\u65F6\u95F4\uFF1A${vipExpiry}`);
    } else {
      log("error", "\u83B7\u53D6VIP\u8BE6\u60C5\u5931\u8D25");
      vipDetailFailed = true;
    }
  } catch (e) {
    log("error", `\u83B7\u53D6VIP\u8BE6\u60C5\u5F02\u5E38: ${JSON.stringify(e?.body || e?.message || e)}`);
    vipDetailFailed = true;
  }
  const hasError = listenStatus === "\u5931\u8D25" || adFailed || vipDetailFailed;
  return {
    result: {
      nickname: safeNickname,
      status: hasError ? claimCount > 0 || listenStatus === "\u6210\u529F" ? "\u90E8\u5206\u5931\u8D25" : "\u5931\u8D25" : "\u6210\u529F",
      listen: listenStatus,
      vipClaim: `${claimCount}/${claimTotal}`,
      vipExpiry,
      error: hasError ? "\u8BE6\u89C1\u65E5\u5FD7" : "",
      logs
    },
    user,
    needRefresh
  };
}
__name(checkinOne, "checkinOne");
async function runCheckin(users, onLog = () => {
}) {
  const now = /* @__PURE__ */ new Date();
  const today = beijingDate(now);
  const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1e3);
  const isSunday = beijingNow.getUTCDay() === 0;
  onLog(`\u65E5\u671F: ${today}\uFF08\u5317\u4EAC\u65F6\u95F4\uFF09${isSunday ? "\uFF0C\u5468\u65E5\u5C06\u5237\u65B0 token" : ""}`);
  onLog(`\u8D26\u53F7\u6570: ${users.length}`);
  const results = [];
  const refreshedUsers = [...users];
  let anyRefresh = false;
  const CONCURRENCY = 3;
  let index = 0;
  async function worker() {
    while (index < users.length) {
      const i = index++;
      const user = users[i];
      try {
        const r = await checkinOne(user, isSunday);
        results[i] = r.result;
        if (r.needRefresh) {
          anyRefresh = true;
          refreshedUsers[i] = r.user;
        } else {
          refreshedUsers[i] = r.user;
        }
        onLog(
          `[${r.result.status}] ${r.result.nickname} \u542C\u6B4C:${r.result.listen} \u5E7F\u544A:${r.result.vipClaim} \u5230\u671F:${r.result.vipExpiry}`
        );
      } catch (e) {
        const safeId = maskIdentifier(user.userid);
        results[i] = {
          nickname: safeId,
          status: "\u5931\u8D25",
          listen: "\u5F02\u5E38",
          vipClaim: "0/8",
          vipExpiry: "\u672A\u77E5",
          error: String(e?.message || e),
          logs: [{ level: "error", msg: String(e?.message || e), t: Date.now() }]
        };
        onLog(`[\u5931\u8D25] ${safeId} \u5904\u7406\u5F02\u5E38: ${e?.message || e}`);
      }
    }
  }
  __name(worker, "worker");
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, users.length) }, worker));
  const successCount = results.filter((r) => r.status === "\u6210\u529F").length;
  const failCount = results.length - successCount;
  onLog(`\u5B8C\u6210: \u6210\u529F ${successCount} / \u5931\u8D25 ${failCount}`);
  return {
    date: today,
    results,
    needRefresh: anyRefresh,
    refreshedUsers,
    summary: {
      total: results.length,
      success: successCount,
      fail: failCount
    }
  };
}
__name(runCheckin, "runCheckin");

// src/store.js
var KEY_USERINFO = "userinfo";
var KEY_STATE = "state";
async function getUsers(kv) {
  const raw = await kv.get(KEY_USERINFO);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
__name(getUsers, "getUsers");
async function saveUsers(kv, users) {
  await kv.put(KEY_USERINFO, JSON.stringify(users));
}
__name(saveUsers, "saveUsers");
async function upsertUser(kv, { userid, token, nickname }) {
  const users = await getUsers(kv);
  const idx = users.findIndex((u) => String(u.userid) === String(userid));
  if (idx >= 0) {
    users[idx] = { ...users[idx], token, ...nickname ? { nickname } : {} };
  } else {
    users.push({
      userid: String(userid),
      token,
      nickname: nickname || "",
      addedAt: Date.now()
    });
  }
  await saveUsers(kv, users);
  return users;
}
__name(upsertUser, "upsertUser");
async function removeUser(kv, userid) {
  const users = await getUsers(kv);
  const next = users.filter((u) => String(u.userid) !== String(userid));
  if (next.length === users.length) return false;
  await saveUsers(kv, next);
  return true;
}
__name(removeUser, "removeUser");
async function getState(kv) {
  const raw = await kv.get(KEY_STATE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(getState, "getState");
async function saveState(kv, state) {
  await kv.put(KEY_STATE, JSON.stringify(state));
}
__name(saveState, "saveState");

// src/pages.js
function statusPage(state, accounts) {
  const accountCount = accounts.length;
  const rows = (state?.results || []).map((r) => {
    const statusColor = r.status === "\u6210\u529F" ? "#3fb950" : r.status === "\u90E8\u5206\u5931\u8D25" ? "#d29922" : "#f85149";
    return `<tr>
        <td>${escapeHtml(r.nickname)}</td>
        <td style="color:${statusColor}">${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.listen)}</td>
        <td>${escapeHtml(r.vipClaim)}</td>
        <td>${escapeHtml(r.vipExpiry)}</td>
      </tr>`;
  }).join("");
  const noAccounts = accountCount === 0;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>\u9177\u72D7\u6982\u5FF5\u7248\u81EA\u52A8\u7B7E\u5230</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:20px}
.container{max-width:860px;margin:0 auto}
h1{color:#58a6ff;font-size:22px;margin-bottom:6px}
.sub{color:#8b949e;font-size:13px;margin-bottom:20px}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin-bottom:16px}
.card h2{font-size:15px;color:#e6edf3;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #21262d}
th{color:#8b949e;font-weight:600}
.meta{display:flex;gap:24px;flex-wrap:wrap;color:#8b949e;font-size:13px;margin-bottom:12px}
.meta b{color:#e6edf3}
button{background:#238636;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:14px;cursor:pointer;font-weight:600}
button:hover{background:#2ea043}
button:disabled{background:#21262d;color:#484f58;cursor:not-allowed}
button.secondary{background:#21262d;color:#c9d1d9}
button.secondary:hover{background:#30363d}
button.danger{background:#21262d;color:#f85149;border:1px solid #f8514933;padding:5px 14px;font-size:13px}
button.danger:hover{background:#f85149;color:#fff;border-color:#f85149}
button.danger:disabled{background:#21262d;color:#484f58;border-color:#30363d;cursor:not-allowed}
tr.removing{opacity:.4}
input{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:9px 12px;color:#e6edf3;font-size:14px;width:220px}
input:focus{outline:none;border-color:#58a6ff}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.notice{background:#1f6feb22;border:1px solid #1f6feb66;border-radius:8px;padding:12px 14px;font-size:13px;color:#a5d6ff;margin-bottom:16px}
.warn{background:#d2992222;border-color:#d2992266;color:#e3b341}
#log{background:#010409;border:1px solid #30363d;border-radius:8px;padding:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;height:260px;overflow-y:auto;white-space:pre-wrap;color:#c9d1d9;display:none}
.footer{color:#484f58;font-size:12px;text-align:center;margin-top:24px}
</style>
</head>
<body>
<div class="container">
  <h1>\u{1F3B5} \u9177\u72D7\u6982\u5FF5\u7248\u81EA\u52A8\u7B7E\u5230</h1>
  <p class="sub">\u6BCF\u5929\u5317\u4EAC\u65F6\u95F4 01:10 \u81EA\u52A8\u9886\u53D6 VIP\uFF08\u57FA\u4E8E kgcheckin \u79FB\u690D\u81F3 Cloudflare Workers\uFF09</p>

  ${noAccounts ? `<div class="notice warn">\u5C1A\u672A\u914D\u7F6E\u8D26\u53F7\uFF0C\u8BF7\u5148<a href="/login" style="color:#58a6ff">\u626B\u7801\u767B\u5F55</a>\u3002</div>` : ""}

  <div class="card">
    <h2>\u6700\u8FD1\u4E00\u6B21\u7B7E\u5230</h2>
    ${state ? `<div class="meta">
             <span>\u65E5\u671F: <b>${escapeHtml(state.date)}</b></span>
             <span>\u6210\u529F: <b style="color:#3fb950">${state.summary?.success ?? 0}</b></span>
             <span>\u5931\u8D25: <b style="color:#f85149">${state.summary?.fail ?? 0}</b></span>
             <span>\u8D26\u53F7\u6570: <b>${state.summary?.total ?? 0}</b></span>
           </div>
           <table>
             <tr><th>\u8D26\u53F7</th><th>\u72B6\u6001</th><th>\u542C\u6B4C\u9886\u53D6</th><th>\u5E7F\u544A\u9886\u53D6</th><th>VIP\u5230\u671F</th></tr>
             ${rows}
           </table>` : `<p style="color:#8b949e;font-size:13px">\u6682\u65E0\u8BB0\u5F55\uFF0C\u7B49\u5F85\u9996\u6B21\u5B9A\u65F6\u6267\u884C\u6216\u624B\u52A8\u89E6\u53D1\u3002</p>`}
  </div>

  <div class="card">
    <h2>\u8D26\u53F7\u7BA1\u7406 <span style="color:#8b949e;font-weight:400;font-size:13px">\u5171 ${accountCount} \u4E2A</span></h2>
    ${accountCount === 0 ? `<p style="color:#8b949e;font-size:13px">\u6682\u65E0\u8D26\u53F7\uFF0C<a href="/login" style="color:#58a6ff">\u626B\u7801\u767B\u5F55</a>\u6DFB\u52A0\u3002</p>` : `<table id="acctTable">
             <tr><th>\u6635\u79F0</th><th>VIP\u5230\u671F</th><th>\u4E0A\u6B21\u72B6\u6001</th><th>\u6DFB\u52A0\u65F6\u95F4</th><th style="text-align:right">\u64CD\u4F5C</th></tr>
             ${accounts.map(
    (a) => `<tr data-id="${escapeHtml(a.id)}">
                   <td>${escapeHtml(a.nickname)}</td>
                   <td>${escapeHtml(a.vipExpiry || "\u2014")}</td>
                   <td>${escapeHtml(a.lastStatus || "\u2014")}</td>
                   <td>${a.addedAt ? escapeHtml(formatTime(a.addedAt)) : "\u2014"}</td>
                   <td style="text-align:right">
                     <button class="danger" data-del="${escapeHtml(a.id)}" data-name="${escapeHtml(a.nickname)}">\u5220\u9664</button>
                   </td>
                 </tr>`
  ).join("")}
           </table>
           <p style="color:#484f58;font-size:12px;margin-top:10px">\u5220\u9664\u540E\u9700\u91CD\u65B0\u626B\u7801\u767B\u5F55\u624D\u80FD\u7EE7\u7EED\u7B7E\u5230\uFF1Btoken \u4F1A\u7ACB\u5373\u4ECE\u5B58\u50A8\u4E2D\u79FB\u9664\u3002</p>`}
  </div>

  <div class="card">
    <h2>\u64CD\u4F5C</h2>
    <div class="row" style="margin-bottom:12px">
      <button id="runBtn" ${noAccounts ? "disabled" : ""}>\u7ACB\u5373\u7B7E\u5230</button>
      <a href="/login"><button class="secondary">\u626B\u7801\u767B\u5F55 / \u6DFB\u52A0\u8D26\u53F7</button></a>
      <button class="secondary" id="refreshBtn">\u5237\u65B0\u72B6\u6001</button>
    </div>
    <div id="log"></div>
  </div>

  <p class="footer">kgcheckin-cloudflare \xB7 \u4EC5\u4F9B\u4E2A\u4EBA\u5B66\u4E60\u4F7F\u7528</p>
</div>
<script>
const logEl = document.getElementById('log');
function appendLog(text) {
  logEl.style.display = 'block';
  logEl.textContent += text + '\\n';
  logEl.scrollTop = logEl.scrollHeight;
}
document.getElementById('refreshBtn').onclick = () => location.reload();

// \u8D26\u53F7\u5220\u9664
document.querySelectorAll('[data-del]').forEach(function(btn) {
  btn.onclick = async function() {
    const id = this.dataset.del;
    const name = this.dataset.name || '\u8BE5\u8D26\u53F7';
    if (!confirm('\u786E\u8BA4\u5220\u9664\u8D26\u53F7\u300C' + name + '\u300D\uFF1F\\n\u5220\u9664\u540E token \u7ACB\u5373\u4ECE\u5B58\u50A8\u79FB\u9664\uFF0C\u9700\u91CD\u65B0\u626B\u7801\u767B\u5F55\u3002')) return;
    this.disabled = true;
    this.textContent = '\u5220\u9664\u4E2D...';
    const tr = this.closest('tr');
    try {
      const resp = await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: id })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || '\u5220\u9664\u5931\u8D25');
      tr.classList.add('removing');
      const remaining = typeof data.remaining === 'number' ? data.remaining : null;
      if (remaining === 0) {
        location.reload();
        return;
      }
      tr.remove();
      const cnt = document.querySelector('#acctTable') ? document.querySelectorAll('#acctTable tr[data-id]').length : 0;
      const head = document.querySelector('.card h2 span');
      if (head && cnt) head.textContent = '\u5171 ' + cnt + ' \u4E2A';
      if (cnt === 0) location.reload();
    } catch (e) {
      this.disabled = false;
      this.textContent = '\u5220\u9664';
      alert('\u5220\u9664\u5931\u8D25: ' + e.message);
    }
  };
});
document.getElementById('runBtn').onclick = async function() {
  this.disabled = true;
  logEl.style.display = 'block';
  logEl.textContent = '';
  appendLog('\u89E6\u53D1\u7B7E\u5230\uFF0C\u7B49\u5F85\u54CD\u5E94\uFF08\u591A\u8D26\u53F7\u7EA6\u9700 1-4 \u5206\u949F\uFF09...');
  try {
    const resp = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    });
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      appendLog(decoder.decode(value, { stream: true }));
    }
    appendLog('--- \u5B8C\u6210\uFF0C3 \u79D2\u540E\u5237\u65B0\u72B6\u6001 ---');
    setTimeout(() => location.reload(), 3000);
  } catch (e) {
    appendLog('\u8BF7\u6C42\u5931\u8D25: ' + e.message);
    this.disabled = false;
  }
};
<\/script>
</body>
</html>`;
}
__name(statusPage, "statusPage");
function loginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>\u626B\u7801\u767B\u5F55 - \u9177\u72D7\u6982\u5FF5\u7248\u7B7E\u5230</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:20px;display:flex;justify-content:center}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;max-width:420px;width:100%;margin-top:40px;text-align:center}
h1{color:#58a6ff;font-size:20px;margin-bottom:8px}
p{color:#8b949e;font-size:13px;margin-bottom:16px}
.qrbox{background:#fff;border-radius:12px;padding:16px;display:inline-block;min-height:220px;min-width:220px;display:flex;align-items:center;justify-content:center}
.qrbox img{width:200px;height:200px;display:block}
.qrbox .placeholder{color:#555;font-size:13px}
.status{margin-top:14px;font-size:14px;font-weight:600;min-height:20px}
.ok{color:#3fb950}.err{color:#f85149}.muted{color:#8b949e}
button{background:#238636;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;cursor:pointer;font-weight:600;margin-top:14px}
button:hover{background:#2ea043}
a{color:#58a6ff;font-size:13px}
</style>
</head>
<body>
<div class="card">
  <h1>\u{1F4F1} \u626B\u7801\u767B\u5F55</h1>
  <p>\u4F7F\u7528\u300C\u9177\u72D7\u97F3\u4E50 APP\u300D\u626B\u63CF\u4E8C\u7EF4\u7801<br/>\u4E8C\u7EF4\u7801\u6709\u6548\u671F\u7EA6 2 \u5206\u949F</p>
  <div class="qrbox" id="qrbox"><span class="placeholder">\u6B63\u5728\u751F\u6210\u4E8C\u7EF4\u7801...</span></div>
  <div class="status muted" id="status"></div>
  <div><button id="genBtn">\u91CD\u65B0\u751F\u6210</button></div>
  <p style="margin-top:18px"><a href="/">\u2190 \u8FD4\u56DE\u72B6\u6001\u9875</a></p>
</div>
<script>
let polling = null;
let currentKey = '';
const statusEl = document.getElementById('status');
const qrbox = document.getElementById('qrbox');

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status ' + (cls || 'muted');
}

// \u6781\u7B80\u4E8C\u7EF4\u7801\u6E32\u67D3\uFF1A\u8C03\u7528\u540E\u7AEF\u8FD4\u56DE\u7684 SVG
async function gen() {
  if (polling) clearInterval(polling);
  currentKey = '';
  qrbox.innerHTML = '<span class="placeholder">\u751F\u6210\u4E2D...</span>';
  setStatus('\u6B63\u5728\u5411\u9177\u72D7\u7533\u8BF7\u4E8C\u7EF4\u7801...', 'muted');
  try {
    const resp = await fetch('/api/qr', { method: 'POST' });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || '\u751F\u6210\u5931\u8D25');
    currentKey = data.key;
    qrbox.innerHTML = data.svg;
    setStatus('\u8BF7\u7528\u9177\u72D7\u97F3\u4E50 APP \u626B\u7801', 'muted');
    poll();
  } catch (e) {
    qrbox.innerHTML = '<span class="placeholder">\u751F\u6210\u5931\u8D25</span>';
    setStatus('\u4E8C\u7EF4\u7801\u751F\u6210\u5931\u8D25: ' + e.message, 'err');
  }
}

async function poll() {
  let elapsed = 0;
  polling = setInterval(async () => {
    elapsed += 2;
    if (!currentKey) return;
    try {
      const resp = await fetch('/api/qr/status?key=' + encodeURIComponent(currentKey));
      const data = await resp.json();
      if (data.status === 4) {
        clearInterval(polling);
        setStatus('\u2705 \u767B\u5F55\u6210\u529F\uFF01\u8D26\u53F7\u5DF2\u4FDD\u5B58\uFF0C3 \u79D2\u540E\u8FD4\u56DE...', 'ok');
        setTimeout(() => location.href = '/', 3000);
      } else if (data.status === 0) {
        clearInterval(polling);
        setStatus('\u274C \u4E8C\u7EF4\u7801\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u70B9\u51FB\u91CD\u65B0\u751F\u6210', 'err');
      } else if (data.status === 2) {
        setStatus('\u5DF2\u626B\u7801\uFF0C\u8BF7\u5728\u624B\u673A\u4E0A\u70B9\u51FB\u786E\u8BA4...', 'muted');
      } else {
        setStatus('\u7B49\u5F85\u626B\u7801... (' + elapsed + 's)', 'muted');
      }
      if (elapsed > 115) {
        clearInterval(polling);
        setStatus('\u274C \u4E8C\u7EF4\u7801\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u70B9\u51FB\u91CD\u65B0\u751F\u6210', 'err');
      }
    } catch (e) {
      setStatus('\u8F6E\u8BE2\u5931\u8D25\uFF0C\u91CD\u8BD5\u4E2D...', 'err');
    }
  }, 2000);
}

document.getElementById('genBtn').onclick = gen;
gen();
<\/script>
</body>
</html>`;
}
__name(loginPage, "loginPage");
function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeHtml, "escapeHtml");
function formatTime(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "\u2014";
    const p = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "p");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return "\u2014";
  }
}
__name(formatTime, "formatTime");

// src/index.js
var QR_TTL = 120;
var index_default = {
  /**
   * 定时签到 —— cron: 10 17 * * * (UTC) = 北京时间 01:10
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(env));
  },
  /**
   * HTTP 路由
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      switch (path) {
        case "/":
          return html(await renderStatus(env));
        case "/login":
          return html(loginPage());
        case "/api/qr":
          if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
          return handleQrGen(env);
        case "/api/qr/status":
          return handleQrStatus(request, env);
        case "/api/checkin":
          if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
          return handleManualCheckin(request, env);
        case "/api/state":
          return json({ state: await getState(env.KG_KV) });
        case "/api/accounts":
          if (request.method === "GET") return handleAccountsList(env);
          if (request.method === "DELETE") return handleAccountDelete(request, env);
          return json({ ok: false, error: "method not allowed" }, 405);
        case "/probe":
          return json(runProbe());
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (e) {
      console.error("unhandled error:", e);
      return json({ ok: false, error: String(e?.message || e) }, 500);
    }
  }
};
async function runScheduled(env) {
  const users = await getUsers(env.KG_KV);
  if (users.length === 0) {
    console.log("no accounts configured, skip");
    return;
  }
  const logs = [];
  const report = await runCheckin(users, (m) => {
    logs.push(m);
    console.log(m);
  });
  if (report.needRefresh) {
    await env.KG_KV.put("userinfo", JSON.stringify(report.refreshedUsers));
    logs.push("token \u5DF2\u5237\u65B0\u5E76\u5199\u56DE\u5B58\u50A8");
  }
  await saveState(env.KG_KV, {
    date: report.date,
    results: report.results,
    summary: report.summary,
    logs,
    finishedAt: Date.now(),
    trigger: "cron"
  });
}
__name(runScheduled, "runScheduled");
async function renderStatus(env) {
  const state = await getState(env.KG_KV);
  const accounts = await buildAccounts(env);
  return statusPage(state, accounts);
}
__name(renderStatus, "renderStatus");
async function handleQrGen(env) {
  try {
    const res = await qrKey();
    const key = res.body?.data?.qrcode;
    if (!key) {
      return json({ ok: false, error: `\u83B7\u53D6\u4E8C\u7EF4\u7801\u5931\u8D25: ${JSON.stringify(res.body)?.slice(0, 300)}` });
    }
    const svg = await renderQrSvg(`https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=${key}`);
    await env.KG_KV.put(`qr:${key}`, JSON.stringify({ created: Date.now() }), {
      expirationTtl: QR_TTL
    });
    return json({ ok: true, key, svg });
  } catch (e) {
    return json({ ok: false, error: String(e?.body?.msg || e?.message || e) });
  }
}
__name(handleQrGen, "handleQrGen");
async function handleQrStatus(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return json({ status: -1, error: "missing key" });
  const rec = await env.KG_KV.get(`qr:${key}`);
  if (!rec) return json({ status: 0 });
  try {
    const res = await qrCheck(key);
    const status = Number(res.body?.data?.status ?? 1);
    if (status === 4) {
      const userid = res.body?.data?.userid;
      const token = res.body?.data?.token;
      if (userid && token) {
        let nickname = "";
        try {
          const detail = await userDetail({ userid, token });
          nickname = detail?.body?.data?.nickname || "";
        } catch {
        }
        await upsertUser(env.KG_KV, { userid, token, nickname });
        await env.KG_KV.delete(`qr:${key}`);
        return json({ status: 4, nickname });
      }
      return json({ status: -1, error: "\u767B\u5F55\u6210\u529F\u4F46\u7F3A\u5C11 token" });
    }
    return json({ status });
  } catch (e) {
    return json({ status: -1, error: String(e?.body?.msg || e?.message || e) });
  }
}
__name(handleQrStatus, "handleQrStatus");
async function renderQrSvg(text) {
  const { toSvg: toSvg2 } = await Promise.resolve().then(() => (init_qr_render(), qr_render_exports));
  return toSvg2(text);
}
__name(renderQrSvg, "renderQrSvg");
function opaqueId(userid) {
  return cryptoMd5(`kg:${userid}`).slice(0, 8);
}
__name(opaqueId, "opaqueId");
async function buildAccounts(env) {
  const users = await getUsers(env.KG_KV);
  const state = await getState(env.KG_KV);
  const byNickname = /* @__PURE__ */ new Map();
  for (const r of state?.results || []) {
    if (r.nickname) byNickname.set(r.nickname, r);
  }
  return users.map((u) => {
    const maskedNickname = u.nickname ? maskDisplayName2(u.nickname) : "";
    const r = maskedNickname ? byNickname.get(maskedNickname) : null;
    return {
      id: opaqueId(u.userid),
      nickname: maskedNickname || maskIdentifier2(u.userid),
      addedAt: u.addedAt || null,
      vipExpiry: r?.vipExpiry || "",
      lastStatus: r?.status || ""
    };
  });
}
__name(buildAccounts, "buildAccounts");
async function handleAccountsList(env) {
  const accounts = await buildAccounts(env);
  return json({ ok: true, count: accounts.length, accounts });
}
__name(handleAccountsList, "handleAccountsList");
async function handleAccountDelete(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON" }, 400);
  }
  const id = String(body.id || "").trim();
  if (!id) return json({ ok: false, error: "\u7F3A\u5C11 id" }, 400);
  const users = await getUsers(env.KG_KV);
  const target = users.find((u) => opaqueId(u.userid) === id);
  if (!target) return json({ ok: false, error: "\u8D26\u53F7\u4E0D\u5B58\u5728\uFF08\u53EF\u80FD\u5DF2\u5220\u9664\uFF09" }, 404);
  await removeUser(env.KG_KV, target.userid);
  const remaining = (await getUsers(env.KG_KV)).length;
  if (remaining === 0) await env.KG_KV.delete("state");
  console.log(`account deleted: ${maskIdentifier2(target.userid)}, remaining=${remaining}`);
  return json({ ok: true, remaining });
}
__name(handleAccountDelete, "handleAccountDelete");
function maskDisplayName2(name) {
  const s = String(name ?? "");
  if (s.length === 0) return "";
  if (s.length === 1) return `${s[0]}********`;
  if (s.length === 2) return `${s[0]}********${s[1]}`;
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
}
__name(maskDisplayName2, "maskDisplayName");
function maskIdentifier2(value) {
  const s = String(value ?? "");
  if (s.length === 0) return "";
  if (s.length <= 2) return "*".repeat(s.length);
  if (s.length <= 6) return `${s[0]}***${s[s.length - 1]}`;
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
}
__name(maskIdentifier2, "maskIdentifier");
async function handleManualCheckin(request, env) {
  const users = await getUsers(env.KG_KV);
  if (users.length === 0) {
    return json({ ok: false, error: "\u672A\u914D\u7F6E\u8D26\u53F7\uFF0C\u8BF7\u5148\u626B\u7801\u767B\u5F55" }, 400);
  }
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const ctx2 = {
    async run() {
      try {
        const logs = [];
        const report = await runCheckin(users, (m) => {
          logs.push(m);
          writer.write(encoder.encode(m + "\n"));
        });
        if (report.needRefresh) {
          await env.KG_KV.put("userinfo", JSON.stringify(report.refreshedUsers));
          logs.push("token \u5DF2\u5237\u65B0\u5E76\u5199\u56DE\u5B58\u50A8");
          writer.write(encoder.encode("token \u5DF2\u5237\u65B0\u5E76\u5199\u56DE\u5B58\u50A8\n"));
        }
        const state = {
          date: report.date,
          results: report.results,
          summary: report.summary,
          logs,
          finishedAt: Date.now(),
          trigger: "manual"
        };
        await saveState(env.KG_KV, state);
        writer.write(
          encoder.encode(
            `
=== \u5B8C\u6210\uFF1A\u6210\u529F ${report.summary.success} / \u5931\u8D25 ${report.summary.fail} ===
`
          )
        );
      } catch (e) {
        writer.write(encoder.encode(`\u5F02\u5E38\u4E2D\u6B62: ${e?.message || e}
`));
      } finally {
        try {
          await writer.close();
        } catch {
        }
      }
    }
  };
  ctx2.run();
  return new Response(readable, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
__name(handleManualCheckin, "handleManualCheckin");
function runProbe() {
  const out = { ok: true, tests: {} };
  try {
    const h = cryptoMd5("1234567890");
    out.tests.md5 = h === "e807f1fcf82d132f9bb018ca6738a19f" ? "ok" : `fail: ${h}`;
    if (out.tests.md5 !== "ok") out.ok = false;
  } catch (e) {
    out.tests.md5 = `error: ${e.message}`;
    out.ok = false;
  }
  try {
    const enc = cryptoAesEncrypt("hello kg", { key: "c24f74ca2820225badc01946dba4fdf7", iv: "adc01946dba4fdf7" });
    const dec = cryptoAesDecrypt(enc, "c24f74ca2820225badc01946dba4fdf7", "adc01946dba4fdf7");
    out.tests.aes = dec === "hello kg" ? "ok" : `fail: ${dec}`;
    if (out.tests.aes !== "ok") out.ok = false;
  } catch (e) {
    out.tests.aes = `error: ${e.message}`;
    out.ok = false;
  }
  try {
    const pk = cryptoRSAEncrypt({ token: "abc", clienttime: 17e8 });
    out.tests.rsa = /^[0-9a-f]{256}$/.test(pk) ? "ok" : `fail: len=${pk.length}`;
    if (out.tests.rsa !== "ok") out.ok = false;
  } catch (e) {
    out.tests.rsa = `error: ${e.message}`;
    out.ok = false;
  }
  out.date = beijingDate();
  return out;
}
__name(runProbe, "runProbe");
function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}
__name(html, "html");
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
__name(json, "json");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
