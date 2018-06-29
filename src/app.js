// app.js

const { ipcRenderer } = require('electron');
const Framework7 = require('framework7');

const $$ = Dom7;

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

    this.attachListeners();
  }

  attachListeners() {
    $$('.menu-open').on('click', (e) => {
      // TEST
    });

    $$('.menu-quit').on('click', (e) => {
      const dialog = this._app.dialog.confirm('Are you sure?', 'Quit App', () => {
        ipcRenderer.sendSync('_quit');
      });
    });
  }

  get app() {
    return this._app;
  }

}

module.exports = ResideApp;