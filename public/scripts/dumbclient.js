define([
  'ball',
  'playermanager',
  './renderer',
  './controls',
  'socket.io',
  './core/config'
], function(Ball, PlayerManager, Renderer, Controls, io, Config) {
  var DumbClient = function() {
    this.ball = new Ball(this);
    this.playerManager = new PlayerManager(this);
    this.renderer = new Renderer(this);
    this.controls = new Controls(this);
    this.io = io;
  };

  DumbClient.prototype.handleJoinedRoom = function(msg) {
    msg.player.local = true;
    this.playerManager.loadPlayer(msg.player, true);
    this.loadState(msg.state);

    if (msg.player.side !== 'right') {
      this.renderer.setMessage('waiting for second player');
    }
  };

  // only called when key is 'up' or 'down'
  DumbClient.prototype.handleKeydown = function(key) {
    var dy = (key === 'up') ? -1 : 1;
    this.sendAction(dy);
    this.renderer.showKeys(this.controls.keysPressed);
  };

  DumbClient.prototype.handleKeyup = function(key) {
    if (!this.controls.keysPressed.up && !this.controls.keysPressed.down) {
      this.sendAction(0);
    }
    this.renderer.showKeys(this.controls.keysPressed);
  };

  DumbClient.prototype.loadState = function(state) {
    this.playerManager.setPlayers(state.players);
    this.ball.set(state.ball);
    this.renderer.render();
    if (state.started) {
      this.started = true;
      this.renderer.setMessage('START');
    }
  };

  DumbClient.prototype.init = function() {
    var self = this;
    this.socket = this.io('/dumbclient');
    this.controls.init(this.handleKeydown.bind(this), this.handleKeyup.bind(this));
    this.renderer.init();

    this.socket.on('joined_room', this.handleJoinedRoom.bind(this));
    this.socket.on('state', this.loadState.bind(this));
  };

  DumbClient.prototype.resetState = function(state) {
    this.loadState(state);
    this.turn = 0;
    this.tick = 0;
    this.sentMove = [];
    this.started = false;
  };

  DumbClient.prototype.sendAction = function(dy) {
    var self = this;
    setTimeout(function() {
      self.socket.emit('action', {
        dy: dy
      });
    }, Config.dumbclient.clientLatency);
  };

  return DumbClient;
});