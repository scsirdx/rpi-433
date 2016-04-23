var _               = require('underscore'),
    path            = require('path'),
    spawn           = require('child_process').spawn,
    exec            = require('child_process').exec,
    util            = require('util'),
    EventEmitter    = require('events').EventEmitter,
    lastCodeSent    = null,
    snifferInstance = null;

var scripts = {
  read: 'build/RFSniffer',
  emit: 'build/codesend',
};

var Sniffer = function(pin, debounceDelay) {

  EventEmitter.call(this);

  var self = this;
  var kill = spawn('killall', ['-9', 'RFSniffer']);
  var cmd = spawn(path.join(__dirname, scripts.read), [pin]);

  cmd.stdout.on('data', _.debounce(function (fullCode) {

    code = parseInt(fullCode.toString().split('@')[0]);
    pulse = parseInt(fullCode.toString().split('@')[1]);

    if(lastCodeSent == code) {
      lastCodeSent = null;
      return;
    }

    self.emit('codes', {code: code, pulse: pulse});
    self.emit(code);

  }, debounceDelay, true));

  cmd.stderr.on('data', function (error) {

    self.emit('error', error);

  });

};

util.inherits(Sniffer, EventEmitter);

module.exports = {

  sniffer: function (pin, debounceDelay) {

    pin = typeof pin !== 'undefined' ? pin : 2;
    debounceDelay = typeof debounceDelay !== 'undefined' ? debounceDelay : 500;

    return snifferInstance || (snifferInstance = new Sniffer(pin, debounceDelay));

  },

  sendCode: function (params) {
    
    var pin = typeof params.pin !== 'undefined' ? params.pin : 0;
    var code = params.code;
    var callback = typeof params.callback === 'function' ? params.callback : function() {};
    var pulse = params.pulse ? params.pulse : 353;

    lastCodeSent = code;

    exec(path.join(__dirname, scripts.emit)+' '+pin+' '+code+' '+pulse, function (error, stderr, stdout) {

      callback(error, stderr, stdout);

    });

  }

};
