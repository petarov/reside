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
    this._searchTimeout = null;
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
            const labels = Object.keys(strings).map((key) => key);
            this._labels = labels;
            this._bundles = bundles;
            this.filterLabels();
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
    const searchId = 'input[type="search"]';

    $$('.label').on('click', (e) => {
      this.editLabel(e.target.text);
    });

    $$(searchId).on('keyup', (e) => {
      if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (!this._searchTimeout) {
          this._searchTimeout = setTimeout(() => {
            // cancel timer
            clearTimeout(this._searchTimeout);
            this._searchTimeout = null;
            // apply filter
            this.filterLabels($$(searchId).val());
          }, 1100);
        }
      }
    });

  }

  filterLabels(expr) {
    if (expr) {
      const filtered = this._labels.filter((v) => v.startsWith(expr));
      const html = this._templates.labels({ labels: filtered });
      $$('#nav-labels').html(html);
    } else {
      // no filter -> just show all labels
      $$('#nav-labels').html(this._templates.labels({ labels: this._labels }));
    }
  }

  editLabel(label) {
    let html;
    if (label) {
      html = this._templates.translations({
        label,
        translations: Array.from(this._bundles.values()).map((v) => {
          return {
            locale: v.locale.toUpperCase(),
            value: v.get(label)
          };
        })
      });
    } else {
      $$('#edit-translations').html('');
    }
  }

  get app() {
    return this._app;
  }

}

module.exports = ResideApp;