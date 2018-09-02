"use strict";

var _interopRequireDefault = require("@gerhobbelt/babel-runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _xregexp = _interopRequireDefault(require("@gerhobbelt/xregexp"));

function evaluateArg(_ref) {
  var path = _ref.path,
      index = _ref.index,
      fallback = _ref.fallback,
      fallbackTrigger = _ref.fallbackTrigger;
  var args = path.get('arguments');

  if (args.length < index + 1) {
    return fallback;
  }

  var arg = args[index].evaluate();

  if (!arg.confident || typeof arg.value !== 'string') {
    return;
  }

  return arg.value !== fallbackTrigger ? arg.value : fallback;
}

function getPattern(path) {
  if (path.node.arguments.length === 0) {
    return '(?:)';
  }

  var firstArg = path.node.arguments[0];

  if (firstArg.type === 'TemplateLiteral' && firstArg.quasis.length === 1) {
    // TODO handle substitutions
    var raw = firstArg.quasis[0].value.raw; // Handle \\\\1 -> \\1. In templates \\1 should be used instead of
    // \1 since \1 is treated as an octal number, which is not allowed
    // in template strings. Copied from
    // https://github.com/DmitrySoshnikov/babel-plugin-transform-modern-regexp/blob/78274325c7d0da329f7057e8f094a1ccae06a968/index.js#L150-L153

    return raw.replace(/\\\\(\d+)/g, '\\$1');
  }

  return evaluateArg({
    path: path,
    index: 0,
    fallback: '(?:)',
    fallbackTrigger: ''
  });
}

function getFlags(path) {
  return evaluateArg({
    path: path,
    index: 1,
    fallback: ''
  });
}

function createRegExpLiteral(path, t) {
  var pattern = getPattern(path);
  var flags = getFlags(path);

  if (pattern == null || flags == null) {
    return;
  }

  var xregexp = new _xregexp.default(pattern, flags);
  return t.regExpLiteral(xregexp.source, xregexp.flags);
}

function maybeReplaceWithRegExpLiteral(path, t) {
  if (!t.isIdentifier(path.node.callee, {
    name: 'RegExp'
  })) {
    return;
  }

  var regExpLiteral = createRegExpLiteral(path, t);

  if (regExpLiteral) {
    path.replaceWith(regExpLiteral);
  }
}

function _default(_ref2) {
  var t = _ref2.types;
  return {
    visitor: {
      NewExpression: function NewExpression(path) {
        maybeReplaceWithRegExpLiteral(path, t);
      },
      CallExpression: function CallExpression(path) {
        // equivalent to `new RegExp()` according to §21.2.3
        maybeReplaceWithRegExpLiteral(path, t);
      },
      RegExpLiteral: function RegExpLiteral(path) {
        var node = path.node;
        var xregexp = (0, _xregexp.default)(node.pattern, node.flags);
        var source = xregexp.source,
            flags = xregexp.flags;

        if (source !== node.pattern || flags !== node.flags) {
          path.replaceWith(t.RegExpLiteral(source, flags));
        }
      },
      MemberExpression: function MemberExpression(path) {
        var _path$node = path.node,
            object = _path$node.object,
            property = _path$node.property;

        if (object.type === 'RegExpLiteral' && property.name === 'source') {
          path.replaceWith(t.StringLiteral(object.pattern));
        }
      }
    }
  };
}