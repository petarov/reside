// app.js

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

const Framework7 = require('framework7');
const Template7 = require('template7');
const $$ = Dom7;

const ResLoader = require('./resloader/resloader');
const Utils = require('./utils');

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

    // left panel view
    this.leftView = app.views.create('.view-left', {
      url: '/'
    });

    // main view
    this.mainView = app.views.create('.view-main', {
      url: '/'
    });

    // bind templates
    this._templates = {};
    this._templates.strings = Template7.compile($$('script#tpl-strings').html());

    this._app = app;
    this.attachListeners();
  }

  attachListeners() {
    $$('.menu-open').on('click', (e) => {
      dialog.showOpenDialog({
        title: 'Select a bundle file',
        properties: ['openFile'],
        filters: [
          {name: 'Properties', extensions: ['properties']},
          {name: 'All files', extensions: ['*']}
        ]
      }, (filePaths) => {
        const {dirname, name} = Utils.getBundleName(filePaths[0]);
        
        this._app.dialog.progress(); // open progress

        new ResLoader().path(dirname).name(name).load().then((result) => {
          this._app.dialog.close(); // close progress

          const { mapped, strings } = result;

          if (mapped.size > 0) {
            const html = this._templates.strings({ strings });
            $$('#nav-strings').html(html);
          } else {
            this._app.dialog.alert('No strings found in file!', 'Invalid bundle file');
          }

        }).catch((e) => {
          this._app.dialog.close(); // close progress
          console.error(e);
          this._app.dialog.alert('Failed loading file!');
        });
      });
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