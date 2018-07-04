// app.js
"use strict";

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

const Framework7 = require('framework7');
const Template7 = require('template7');
const $$ = Dom7;

const { ResLoader, NewlineMode } = require('./resloader');
const Defs = require('./defs'),
  {Utils, Storage} = require('./utils');

const ID = {
  search: 'input[type="search"]',
  cfgEncoding: 'input[name="encoding"]',
  cfgNewlines: 'input[name="newlines"]'
};

class ResideApp {

  constructor() {
  }

  init() {
    this.storage = new Storage(Defs.CONFIG_NAME);

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

    $$(document).on('page:afterin', '.page[data-name="settings"]', function (e) {
      // bring back what was saved
      const saveEncoding = this.storage.settings('saveEncoding');
      $$(`${ID.cfgEncoding}[value='${saveEncoding}']`).prop('checked', true);
      const saveNewlines = this.storage.settings('saveNewlines');
      $$(`${ID.cfgNewlines}[value='${saveNewlines}']`).prop('checked', true);

      this.attachSettingsListeners();
    }.bind(this));

    // bind templates
    this._templates = {
      labels: Template7.compile($$('script#tpl-labels').html()),
      translations: Template7.compile($$('script#tpl-translations').html()),
      translationsActions: Template7.compile($$('script#tpl-translations-actions').html())
    };

    this._bundles = null;
    this._app = app;
    this._searchTimeout = null;
    this.attachMenuListeners();
    this.editLabel(false);
  }

  attachSettingsListeners() {
    const showToast = () => {
      this._app.toast.create({
        text: 'Settings saved.', closeTimeout: Defs.TOAST_SHORT,
      }).open();
    };
    $$(ID.cfgEncoding).on('click', (e) => {
      this.storage.settings('saveEncoding', e.target.value);
      showToast();
    });
    $$(ID.cfgNewlines).on('click', (e) => {
      this.storage.settings('saveNewlines', e.target.value);
      showToast();
    });
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
            this.filterLabels(false);
            // notify user
            this._app.toast.create({
              text: `Loaded ${bundles.size} files for ${name}.`, 
              closeTimeout: Defs.TOAST_NORMAL,
            }).open();
          } else {
            // notify user
            this._app.dialog.alert('No strings found in file!', 'Invalid bundle file');
          }
        }).catch((e) => {
          this._app.dialog.close(); // close progress
          console.error('Failed loading file!', e);
          // notify user
          this._app.dialog.alert('Failed loading file!');
        });
      });
    });

    $$('.menu-save').on('click', (e) => {
      this._app.dialog.confirm(
        'Are you sure?', 'Save File', () => this.saveBundles());
    });

    $$('.menu-save-as').on('click', (e) => {
      if (this._bundles) {
        this._app.dialog.prompt('Enter a bundle name', 'Save File As', (value) => {
          if (value) {
            this.saveBundles(value);
          }
        });
      }
    });

    $$('.menu-quit').on('click', (e) => {
      const dialog = this._app.dialog.confirm('Are you sure?', 'Quit App', () => {
        ipcRenderer.sendSync('_quit');
      });
    });
  }

  attachLabelListeners() {
    $$('.label').on('click', (e) => {
      const text = $$(e.target).text() || $$(e.target).find('.item-title').text();
      this.editLabel(text);
    });

    $$(ID.search).on('keyup', (e) => {
      if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (!this._searchTimeout) {
          this._searchTimeout = setTimeout(() => {
            // cancel timer
            clearTimeout(this._searchTimeout);
            this._searchTimeout = null;
            // apply filter
            this.filterLabels($$(ID.search).val());
          }, Defs.SEARCH_TIMEOUT);
        }
      }
    });
  }

  attachEditListeners() {
    $$('textarea.text-edit').on('keyup', function(e) {
      const bundleName = $$(e.target).data('bundle');
      const label = $$(e.target).data('label');
      const bundle = this._bundles.get(bundleName);
      bundle.set(label, e.target.value);
    }.bind(this));

    $$('.action-clone').on('click', (e) => {
      const label = $$(e.target).data('label');
      const newLabel = label + '_COPY';
      // add to all bundles
      for (const bundle of this._bundles.values()) {
        bundle.set(newLabel, '');
      }
      // notify user
      this._app.toast.create({
        text: `Cloned ${label} to ${newLabel}.`,
        closeTimeout: Defs.TOAST_NORMAL,
      }).open();
      // update index
      this._labels.splice(
        this._labels.findIndex((v) => v === label), 0, newLabel);
      this.filterLabels(false);
      // edit new element
      this.editLabel(newLabel);
    });

    $$('.action-delete').on('click', (e) => {
      const label = $$(e.target).data('label');
      const dialog = this._app.dialog.confirm(`Delete ${label}?`, 
      `Delete translation`, () => {
        // hide edit translation pane
        this.editLabel(false);
        // remove from all bundles
        for (const bundle of this._bundles.values()) {
          bundle.remove(label);
        }
        // notify user
        this._app.toast.create({
          text: `Removed ${label} translation.`,
          closeTimeout: Defs.TOAST_NORMAL,
        }).open();
        // update index
        this._labels.splice(this._labels.findIndex((v) => v === label), 1);
        this.filterLabels(false);
      });
    });
  }

  filterLabels(expr) {
    let labels = this._labels;

    if (expr) {
      labels = this._labels.filter((v) => v.startsWith(expr));
    } else {
      $$(ID.search).val('');
    }

    this._app.virtualList.destroy('#nav-labels');
    this._app.virtualList.create({
      el: '#nav-labels',
      items: labels,
      itemTemplate: this._templates.labels,
    });

    this.attachLabelListeners();
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
      $$('#edit-translations-actions').html(
        this._templates.translationsActions({label}));

      ResideApp.cssVisible('#edit-translations-actions', true);

      this.attachEditListeners();
    } else {
      $$('#edit-translations').html('');
      ResideApp.cssVisible('#edit-translations-actions', false);
    }
  }

  saveBundles(bundleName) {
    if (this._bundles) {
      let newlineMode;
      switch (this.storage.settings('saveNewlines')) {
        case 'crlf': newlineMode = NewlineMode.CRLF; break;
        case 'br': newlineMode = NewlineMode.BR; break;
        default:
        case 'lf': newlineMode = NewlineMode.LF; break;
      }

      const encoding = this.storage.settings('saveEncoding');
      for (const bundle of this._bundles.values()) {
        bundle.save({ bundleName, newlineMode, encoding });
      }
    }
  }

  static cssVisible(id, visible) {
    $$(id).css('visibility', visible ? 'visible' : 'hidden');
  }
}

module.exports = ResideApp;