define([
	'goo/entities/EntityUtils',
	'js/Player'
], function (
	EntityUtils,
	Player
) {
	function Game(goo) {
		this.goo = goo;
		this._players = {};
		this._spaceship = null;
		this._camera = null;
		this._light = null;
	}


	/**
	 * Prepares the scene before starting the game loop.
	 *
	 * @param  {object} configs
	 *         The project configs.
	 *
	 * @return {object}
	 *         The config object passed as a parameter.
	 */
	Game.prototype.initScene = function (configs) {
		var world = this.goo.world;

		// Make sure the world has been processed so that we can select the
		// entities.
		world.processEntityChanges();

		// Get some entities that we are interested in.
		this._spaceship = world.by.name("spaceship").toArray()[0];
		this._camera = world.by.name("camera").toArray()[0];
		this._light = world.by.name("light_1").toArray()[0];

		// Remove the spaceship from the world because we only need it to create
		// clones. We won't actually control it or display it.
		this._spaceship.removeFromWorld();

		return configs;
	};


	/**
	 * Called when the game receives a command from a player.
	 *
	 * @param  {*} data
	 *         The data received from the server.
	 */
	Game.prototype.onCommand = function (data) {
		var player = this.getPlayerById(data ? data.playerId : null);
		if (!player)
			return;

		// Make sure we actually have a command to apply.
		var command = data.command;
		if (!command || !command.type)
			return;

		player.applyCommand(command);
	};


	/**
	 * Called when a player is added to the game.
	 *
	 * @param  {object} data
	 *         The data received from the server which indicates which player
	 *         was added.
	 */
	Game.prototype.onPlayerConnected = function (data) {
		this.addPlayer(data ? data.playerId : null);
	};


	/**
	 * Called when a player is removed from the game.
	 *
	 * @param  {object} data
	 *         The data received from the server which indicates which player
	 *         was removed.
	 */
	Game.prototype.onPlayerDisconnected = function (data) {
		this.removePlayerById(data ? data.playerId : null);
	};


	/**
	 * Adds a new player with the specified identifier.
	 *
	 * @param {string} id
	 *        The identifier of the new player.
	 */
	Game.prototype.addPlayer = function (id) {
		if (!id || typeof id !== 'string')
			return;

		var world = this.goo.world;
		var entity = EntityUtils.clone(world, this._spaceship, function (e) {
			return e;
		});

		var player = new Player(id, entity);
		player.game = this;
		this._players[id] = player;

		// Add the player entity to the world to display it.
		world.addEntity(entity);

		console.log('Player was added: ' + id);
	};


	/**
	 * Removes the specified player from the game.
	 *
	 * @param  {Player} player
	 *         The player which is to be removed.
	 */
	Game.prototype.removePlayer = function (player) {
		if (!player || !player.id)
			return;

		player.game = null;
		player.destroy();
		delete this._players[player.id];

		console.log('Player was removed: ' + player.id);
	};


	/**
	 * Removes the player with the specifed identifier from the game.
	 *
	 * @param  {string} id
	 *         The identifier of the player which is to be removed.
	 */
	Game.prototype.removePlayerById = function (id) {
		var player = this.getPlayerById(id);
		if (!player)
			return;

		this.removePlayer(player);
	};


	/**
	 * Gets whether the game has the specified player.
	 *
	 * @param  {Player}  player
	 *         The player whose existence is to be checked.
	 *
	 * @return {boolean}
	 *         True if the game has the specified player and false otherwise.
	 */
	Game.prototype.hasPlayer = function (player) {
		return player && player.id && this.hasPlayerById(player.id);
	};


	/**
	 * Gets whether the game has a player with the specified identifier.
	 *
	 * @param  {string}  id
	 *         The identifier of the player whose existence is to be checked.
	 *
	 * @return {boolean}
	 *         True if the game has the specified player and false otherwise.
	 */
	Game.prototype.hasPlayerById = function (id) {
		return !!this._players[id];
	};


	/**
	 * Gets the player with the specified identifier.
	 *
	 * @param  {string} id
	 *         The identifier of the player which is to be retrieved.
	 *
	 * @return {Player}
	 */
	Game.prototype.getPlayerById = function (id) {
		return typeof id === 'string' ? this._players[id] : null;
	};


	/**
	 * Gets the game world bounds.
	 *
	 * @return {object}
	 */
	Game.prototype.updateBounds = function () {
		var camera = this._camera.cameraComponent.camera;
		var w = window.clientWidth || window.innerWidth;
		var h = window.clientHeight || window.innerHeight;
		var distance = this._camera.transformComponent.transform.translation[1];

		var topLeft = camera.getWorldPosition(0, 0, w, h, distance);
		var bottomRight = camera.getWorldPosition(w, h, w, h, distance);

		this.bounds = {
			minX: topLeft[0],
			maxX: bottomRight[0],
			minY: topLeft[2] - 20,
			maxY: bottomRight[2] + 20
		};
	};

	//--------------------------------------------------------------------------

	return Game;
});