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
    this._templates = {
      labels: Template7.compile($$('script#tpl-labels').html()),
      translations: Template7.compile($$('script#tpl-translations').html())
    };

    this._bundles = null;
    this._app = app;
    this.attachMenuListeners();
  }

  attachMenuListeners() {
    /**
     * Menus
     */
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

          const { bundles, strings } = result;

          if (bundles.size > 0) {
            const html = this._templates.labels({ strings });
            $$('#nav-labels').html(html);
            this._bundles = bundles;
            this.attachTapListeners();
          } else {
            this._app.dialog.alert('No strings found in file!', 'Invalid bundle file');
          }

        }).catch((e) => {
          this._app.dialog.close(); // close progress
          console.error('Failed loading file!', e);
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

  attachTapListeners() {
    $$('.label').on('click', (e) => {
      const key = e.target.text;

      const html = this._templates.translations({
        key, 
        translations: Array.from(this._bundles.values()).map((v) => {
          return { 
            locale: v.locale.toUpperCase(),
            value: v.get(key)
          };
        })
      });
      $$('#edit-translations').html(html);
    });

  }

  get app() {
    return this._app;
  }

}

module.exports = ResideApp;