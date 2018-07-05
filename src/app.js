// app.js
"use strict";

const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

// const util = require('util');
// const setTimeoutPromise = util.promisify(setTimeout);

const Framework7 = require('framework7'),
  Template7 = require('template7');
const $$ = Dom7;

const { ResLoader, NewlineMode } = require('./resloader');
const Defs = require('./defs'),
  {Utils, Storage} = require('./utils');

const ID = {
  searchForm: 'form.searchbar',
  search: 'input[type="search"]',
  cfgEncoding: 'input[name="encoding"]',
  cfgNewlines: 'input[name="newlines"]'
};

class ResideApp {

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

    // bind search bar
    this._searchBar = app.searchbar.create({
      el: '.searchbar',
      inputEl: ID.search,
      disableButton: false,
      // searchContainer: '.virtual-list',
      // searchItem: 'div',
      // searchIn: '.item-title',
      customSearch: true,
      on: {
        search: (sb, q, pq) => {
          console.log(q);
          if (!this._searchTimeout) {
            this._searchTimeout = setTimeout(() => {
              // cancel timer
              clearTimeout(this._searchTimeout);
              this._searchTimeout = null;
              // apply filter
              this.filterLabels(this._searchBar.query);
            }, Defs.SEARCH_TIMEOUT);
          }
        }
      }
    });
    this._searchBar.disable();
    this._searchTimeout = null;

    ResideApp.cssVisible(false, '#add-label', '#title-labels', '.searchbar');

    this._bundles = null;
    this._app = app;
    this.virtualList = null;
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
    $$('.menu-new').on('click', (e) => {
      // TODO
    });

    $$('.menu-open').on('click', (e) => {
      const openFileFn = function() {
        dialog.showOpenDialog({
          title: 'Select a bundle file',
          properties: ['openFile'],
          filters: Defs.SUPPORTED_EXTENSIONS,
        }, (filePaths) => {
          this.openBundles(filePaths[0]);
        });
      }.bind(this);

      if (this._bundles) {
        this._app.dialog.confirm('Are your sure? Unsaved changes will be lost.', 
        'Open File', (value) => {
          openFileFn();
        });
      } else {
        openFileFn();
      }
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
          } else {
            // notify user
            this._app.dialog.alert('Name not specified!');
          }
        });
      }
    });

    $$('.menu-quit').on('click', (e) => {
      this._app.dialog.confirm('Are you sure?', 'Quit App', 
        () => ipcRenderer.sendSync('_quit'));
    });
  }

  attachLabelListeners() {
    $$('.virtual-list').on('click', 'a.label', (e) => {
      const target = $$(e.target);
      const text = target.text() || target.find('.item-title').text();
      this.editLabel(text);
    });

    this._searchBar.enable();
  }

  attachEditListeners() {
    $$('textarea.text-edit').on('keyup', function(e) {
      const bundleName = $$(e.target).data('bundle');
      const label = $$(e.target).data('label');
      const bundle = this._bundles.get(bundleName);
      bundle.set(label, e.target.value);
    }.bind(this));

    $$('.action-clone').on('click', 
      (e) => this.cloneLabel($$(e.target).data('label')));

    $$('.action-delete').on('click', (e) => {
      const label = $$(e.target).data('label');
      const dialog = this._app.dialog.confirm(`Delete ${label} and translations?`, 
        `Delete Label`, () => this.deleteLabel(label));
    });

    $$('#add-label').on('click', (e) => {
      this._app.dialog.prompt('Enter a label name', 'Add Label', (label) => {
        if (label && !Utils.isComment(label)) {
          this.addLabel(label.trim());
        } else {
          // notify user
          this._app.dialog.alert('Invalid or empty label name!');
        }
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

    if (this.virtualList) {
      this.virtualList.replaceAllItems(labels);
    } else {
      // this._app.virtualList.destroy('#nav-labels');
      this.virtualList = this._app.virtualList.create({
        el: '#nav-labels',
        items: labels,
        itemTemplate: this._templates.labels,
      });
    }

    ResideApp.cssHidden(labels.length === 0, '.my-searchbar-not-found');

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

      ResideApp.cssVisible(true, '#edit-translations-actions');
      // ResideApp.cssVisible(true, '#add-label');

      this.attachEditListeners();
    } else {
      $$('#edit-translations').html('');
      ResideApp.cssVisible(false, '#edit-translations-actions');
      // ResideApp.cssVisible(false, '#add-label');
    }
  }

  addLabel(label) {
    // add to all bundles
    for (const bundle of this._bundles.values()) {
      bundle.set(label, '');
    }
    // notify user
    this._app.toast.create({
      text: `Added new ${label} label.`,
      closeTimeout: Defs.TOAST_NORMAL,
    }).open();
    // update index
    this._labels.push(label);
    this.filterLabels(false);
    // edit new element
    setTimeout(() => {
      this.editLabel(label);
    }, 250);
  }

  deleteLabel(label) {
    // hide edit translation pane
    this.editLabel(false);
    // remove from all bundles
    for (const bundle of this._bundles.values()) {
      bundle.remove(label);
    }
    // notify user
    this._app.toast.create({
      text: `Removed ${label} label.`,
      closeTimeout: Defs.TOAST_NORMAL,
    }).open();
    // update index
    this._labels.splice(this._labels.findIndex((v) => v === label), 1);
    this.filterLabels(false);
  }

  cloneLabel(label) {
    const newLabel = label + '_COPY';
    // add to all bundles
    for (const bundle of this._bundles.values()) {
      bundle.set(newLabel, '');
    }
    // notify user
    this._app.toast.create({
      text: `Cloned ${label} to ${newLabel} label.`,
      closeTimeout: Defs.TOAST_NORMAL,
    }).open();
    // update index
    this._labels.splice(
      this._labels.findIndex((v) => v === label), 0, newLabel);
    this.filterLabels(false);
    // edit new element
    this.editLabel(newLabel);
  }

  openBundles(bundleFilePath) {
    const { dirname, name } = Utils.getBundleName(bundleFilePath);

    this._app.dialog.progress(); // open progress

    new ResLoader().path(dirname).name(name).load().then((result) => {
      this._app.dialog.close(); // close progress

      const { bundles, index } = result;

      if (bundles.size > 0) {
        this._labels = Object.keys(index).map((key) => key);
        this._bundles = bundles;
        this.editLabel(false);
        this.filterLabels(false);
        // allow search and adding new labels
        ResideApp.cssVisible(true, '#add-label', '#title-labels', '.searchbar');
        // notify user
        $$('#nav-title').text(name);
        this._app.toast.create({
          text: `Loaded ${bundles.size} file(s) for ${name}.`,
          closeTimeout: Defs.TOAST_NORMAL,
        }).open();
      } else {
        // disallow search and adding new labels
        ResideApp.cssVisible(false, '#add-label', '#title-labels', '.searchbar');
        // notify user
        this._app.dialog.alert('No strings found in file!', 'Invalid bundle file');
      }
    }).catch((e) => {
      this._app.dialog.close(); // close progress
      console.error('Failed loading file!', e);
      // disallow search and adding new labels
      ResideApp.cssVisible(false, '#add-label', '#title-labels', '.searchbar');
      // notify user
      this._app.dialog.alert('Failed loading file!');
    });
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

      const savedNames = [];
      const encoding = this.storage.settings('saveEncoding');

      for (const bundle of this._bundles.values()) {
        if (bundleName) {
          const { newName } = bundle.rename(bundleName);
          bundle.save({ newlineMode, encoding });
          // notify user
          $$('#nav-title').text(newName);
        } else {
          bundle.save({ newlineMode, encoding });
        }

        savedNames.push(bundle.name);
      }

      // notify user
      this._app.toast.create({
        text: `Saved ${savedNames} files.`,
        closeTimeout: Defs.TOAST_NORMAL,
      }).open();
    } else {
      // notify user
      this._app.dialog.alert('Nothing to save!');
    }
  }

  static cssVisible(visible, ...ids) {
    for (const id of ids) {
      $$(id).css('visibility', visible ? 'visible' : 'hidden');
    }
  }

  static cssHidden(hidden, ...ids) {
    for (const id of ids) {
      $$(id).css('display', hidden ? 'block' : 'none');
    }
  }
}

module.exports = ResideApp;