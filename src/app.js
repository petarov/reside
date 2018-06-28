// app.js

const Framework7 = require('framework7');

class ResideApp {

  constructor() {

  }

  init() {
    const app = new Framework7({
      root: '#app',
      name: 'Reside',
      id: 'net.vexelon.reside.desktop',

      panel: {
        swipe: 'left',
        leftBreakpoint: 960,
      },

      routes: [
        {
          path: '/about/',
          url: 'about.html',
        },
      ],

    });

    // Init/Create left panel view
    this.leftView = app.views.create('.view-left', {
      url: '/'
    });

    // Init/Create main view
    this.mainView = app.views.create('.view-main', {
      url: '/'
    });

    this._app = app;
  }

  get app() {
    return this._app;
  }

}

module.exports = ResideApp;