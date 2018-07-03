// app.js

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

const Framework7 = require('framework7');
const Template7 = require('template7');
const $$ = Dom7;

const ResLoader = require('./resloader/resloader'),
  { NewlineMode } = require('./resloader/resbundle'),
  Utils = require('./utils'),
  Defs = require('./defs');


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

    });

    // left panel view
    this.leftView = app.views.create('.view-left', {
      el: '.view-left'
    });

    // main view
    // @see: http://forum.framework7.io/t/how-compose-views-and-pages-right/2937/2
    this.mainView = app.views.create('.view-main', {
      el: '.view-main',
      pageName: 'settings',
      //stackPages: true,
      routes: [
        {
          path: '/main/',
          pageName: 'main',
        },
        {
          path: '/settings/',
          pageName: 'settings',
        },
      ],
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
    this.editLabel(false);
  }

  attachMenuListeners() {
    /**
     * Menus
     */
    $$('.menu-open').on('click', (e) => {
      dialog.showOpenDialog({
        title: 'Select a bundle file',
        properties: ['openFile'],
        filters: Defs.SUPPORTED_EXTENSIONS,
      }, (filePaths) => {
        const {dirname, name} = Utils.getBundleName(filePaths[0]);
        
        this._app.dialog.progress(); // open progress

        new ResLoader().path(dirname).name(name).load().then((result) => {
          this._app.dialog.close(); // close progress

          const { bundles, strings } = result;

          if (bundles.size > 0) {
            this._labels = Object.keys(strings).map((key) => key);
            this._bundles = bundles;
            this.filterLabels();
            this.attachLabelListeners();
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

    $$('.menu-save').on('click', (e) => {
      // const dialog = this._app.dialog.confirm('Are you sure?', 'Quit App', () => {
      //   ipcRenderer.sendSync('_quit');
      // });
      if (this._bundles) {
        for (const bundle of this._bundles.values()) {
          bundle.save('', NewlineMode.LF);
        }
      }
    });

    $$('.menu-quit').on('click', (e) => {
      const dialog = this._app.dialog.confirm('Are you sure?', 'Quit App', () => {
        ipcRenderer.sendSync('_quit');
      });
    });
  }

  attachLabelListeners() {
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
          }, Defs.SEARCH_TIMEOUT);
        }
      }
    });
  }

  attachEditListeners() {
    $$('textarea.text-edit').on('keyup', function(e) {
      const bundleName = $$(e.target).data('bundle');
      const label = $$(e.target).data('label');
      // TODO format
      const bundle = this._bundles.get(bundleName);
      bundle.set(label, e.target.value);
    }.bind(this));
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
        translations: Array.from(this._bundles.entries()).map((v) => {
          return {
            bundle: v[0],
            locale: v[1].locale.toUpperCase(),
            value: v[1].get(label)
          };
        })
      });
      $$('#edit-translations').html(html);
      ResideApp.cssVisible('#edit-translations-buttons', true);
      this.attachEditListeners();
    } else {
      $$('#edit-translations').html('');
      ResideApp.cssVisible('#edit-translations-buttons', false);
    }
  }

  get app() {
    return this._app;
  }

  static cssVisible(id, visible) {
    $$(id).css('visibility', visible ? 'visible' : 'hidden');
  }
}

module.exports = ResideApp;