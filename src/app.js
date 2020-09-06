// app.js
"use strict";

const { ipcRenderer, shell } = require('electron');
const { app, dialog } = require('electron').remote;
const path = require('path');

const Framework7 = require('framework7'),
  Template7 = require('template7');
const $$ = Dom7;

const { ResLoader, ResBundle, NewlineMode } = require('./resloader');
const Defs = require('./defs'),
  {Utils, Storage} = require('./utils');

const ID = {
  labelsCount: '.chip-num-translations',
  searchForm: 'form.searchbar',
  search: 'input[type="search"]',
  export: 'button.action-export',
  exportAs: 'input[type="radio"][name="export_as"]:checked',
  cfgEncoding: 'input[name="encoding"]',
  cfgNewlines: 'input[name="newlines"]',
  cfgSearchIn: 'input[name="search_in"]',
  cfgSearchCaseSens: 'input[name="search_casesens"]',
  cfgFilterLabels: 'input[name="filter_labels"]',
  cfgNewOptions: 'input[name="new_options"]',
};

class ResideApp {

  init() {
    this.storage = new Storage(app, Defs.CONFIG_NAME);

    const f7App = new Framework7({
      root: '#app',
      name: Defs.APP_NAME,
      id: 'net.vexelon.reside.desktop',
      panel: {
        swipe: 'left',
        leftBreakpoint: 960,
      },
    });

    // left panel view
    this.leftView = f7App.views.create('.view-left', {
      el: '.view-left'
    });

    // main view
    // @see: http://forum.framework7.io/t/how-compose-views-and-pages-right/2937/2
    this.mainView = f7App.views.create('.view-main', {
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
      locales: Template7.compile($$('script#tpl-locales-chips').html()),
      translations: Template7.compile($$('script#tpl-translations').html()),
      translationsActions: Template7.compile($$('script#tpl-translations-actions').html()),
      duplicateLabels: Template7.compile($$('script#tpl-duplicate-labels').html())
    };

    // bind search bar
    this._searchBar = f7App.searchbar.create({
      el: '.searchbar',
      inputEl: ID.search,
      disableButton: false,
      // searchContainer: '.virtual-list',
      // searchItem: 'div',
      // searchIn: '.item-title',
      customSearch: true,
      on: {
        search: (sb, q, pq) => {
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

    this.displayLabels(false);
    $$('.app-version').text(`v${app.getVersion()}`);

    this._bundles = null;
    this._app = f7App;
    this.virtualList = null;
    this.attachMenuListeners();
    this.editLabel(false);

    /**
     * Menu actions
     */
    ipcRenderer.on('_about', () => {
      this._app.popup.create({
        el: '.popup-about',
        on: {
          open: () => {
            $$('.about-version').text(`v${app.getVersion()}`);
            $$('.about-link-repo').on('click', () => shell.openExternal('https://git.io/fNGBO'));
            $$('.about-link-icon').on('click', () => shell.openExternal('http://www.iconka.com'));
          }
        }
      }).open();
    });
    ipcRenderer.on('_settings', () => {
      this.mainView.router.navigate('/settings/');
    });
    ipcRenderer.on('_askquit', () => this.askQuit());
  }

  displayLabels(visible) {
    ResideApp.cssVisible(visible, '#add-label', '#title-labels', '.searchbar', 
      '.label-options', '.chip-labels', '.chip-locales');
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
      const newFileFn = function () {
        dialog.showSaveDialog({
          title: 'Save new bundle file as',
          defaultPath: 'NewBundle_en.properties',
          filters: Defs.SUPPORTED_EXTENSIONS,
        }, (filePath) => {
          if (filePath) {
            this.newBundles(filePath)
          }
        });
      }.bind(this);

      if (this._bundles) {
        const popup = this._app.popup.create({
          el: '.popup-new-options',
          on: {
            open: () => {
              $$(ID.cfgNewOptions).once('click', (e) => {
                if ('file' === e.target.value) {
                  this._app.dialog.confirm('Are your sure? Unsaved changes will be lost.',
                    'New File', (value) => newFileFn());
                } else {
                  this._app.dialog.prompt('Enter a locale name', 'Add New Locale', (value) => {
                    if (value) {
                      this.newLocale(value);
                    } else {
                      // notify user
                      this._app.dialog.alert('Locale not specified!');
                    }
                  });
                }
                popup.close();
              });
            }
          }
        }).open();
      } else {
        newFileFn();
      }
    });

    $$('.menu-open').on('click', (e) => {
      const openFileFn = function() {
        dialog.showOpenDialog({
          title: 'Select a bundle file',
          properties: ['openFile'],
          filters: Defs.SUPPORTED_EXTENSIONS,
        }, (filePaths) => {
          if (filePaths) {
            this.openBundles(filePaths[0]);
          }
        });
      }.bind(this);

      if (this._bundles) {
        this._app.dialog.confirm('Are your sure? Unsaved changes will be lost.', 
          'Open File', (value) => openFileFn());
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

    $$('.menu-export').on('click', (e) => {
      if (this._bundles) {
        const popup = this._app.popup.create({
          el: '.popup-export',
          on: {
            open: () => {
              let exportType;
              $$(ID.export).once('click', (e) => {
                const exportType = $$(ID.exportAs).val();
                popup.close();
                this._app.dialog.prompt('Enter an export name', 'Export As', (value) => {
                  if (value) {
                    this.exportBundles(exportType, value);
                  } else {
                    // notify user
                    this._app.dialog.alert('Export name not specified!');
                  }
                });
              });
            }
          }
        }).open();
      }
    });

    $$('.menu-quit').on('click', () => this.askQuit());

    $$('.menu-search').on('click', (e) => {
      this._app.popup.create({
        el: '.popup-search-options',
        on: {
          open: () => {
            // bring back what was saved
            const content = this.storage.search('content');
            $$(`${ID.cfgSearchIn}[value='${content}']`).prop('checked', true);
            const caseSensitive = this.storage.search('caseSensitive');
            $$(`${ID.cfgSearchCaseSens}[value='${caseSensitive}']`).prop('checked', true);

            const showToast = () => {
              this._app.toast.create({
                text: 'Search settings saved.', closeTimeout: Defs.TOAST_SHORT,
              }).open();
            };
            $$(ID.cfgSearchIn).on('click', (e) => {
              this.storage.search('content', e.target.value);
              showToast();
            });
            $$(ID.cfgSearchCaseSens).on('click', (e) => {
              this.storage.search('caseSensitive', e.target.value);
              showToast();
            });
          },
          close: () => this.filterLabels(this._searchBar.query)
        }
      }).open();
    });

    $$('.menu-filter').on('click', (e) => {
      const popup = this._app.popup.create({
        el: '.popup-filter-options',
        on: {
          open: () => {
            // bring back what was saved
            const labels = this.storage.filter('labels');
            $$(`${ID.cfgFilterLabels}[value='${labels}']`).prop('checked', true);

            const showToast = () => {
              this._app.toast.create({
                text: 'Filter settings saved.', closeTimeout: Defs.TOAST_SHORT,
              }).open();
            };
            $$(ID.cfgFilterLabels).on('click', (e) => {
              this.storage.filter('labels', e.target.value);
              showToast();
              popup.close();
            });
          },
          close: () => this.filterLabels(this._searchBar.query)
        }
      }).open();
    });

  }

  attachLabelListeners() {
    $$('.virtual-list').on('click', 'a.label', (e) => {
      const target = $$(e.target);
      const text = target.text() || target.find('.item-title').text();
      this.editLabel(text);
    });

    if (!this._addLabelHandler) {
      this._addLabelHandler = (e) => {
        Utils.doAsync(() => {
          this._app.dialog.prompt('Enter a label name', 'Add Label', (label) => {
            if (label && !Utils.isComment(label)) {
              this.addLabel(label.trim());
            } else {
              // notify user
              this._app.dialog.alert('Invalid or empty label name!');
            }
          });
        });
      };
    }
    $$('#add-label').off('click', this._addLabelHandler);
    $$('#add-label').on('click', this._addLabelHandler);

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
      this._app.dialog.confirm(`Delete ${label} and translations?`,
        `Delete Label`, () => this.deleteLabel(label));
    });
  }

  filterLabels(expr) {
    let labels;

    if (expr) {
      let searchFn;

      const isCaseSens = 'yes' === this.storage.search('caseSensitive');
      if (!isCaseSens) {
        expr = expr.toLowerCase();
        searchFn = (v) => v.toLowerCase().indexOf(expr) > -1;
      } else {
        searchFn = (v) => v.indexOf(expr) > -1;
      }

      const isLabelsOnly = 'labels' === this.storage.search('content');

      labels = this._labels.filter((v) => {
        let result = searchFn(v);
        if (!isLabelsOnly && !result) {
          for (const bundle of this._bundles.values()) {
            const translation = bundle.get(v);
            if (translation && searchFn(translation)) {
              return true;
            }
          }
        }
        return result;
      });

    } else {
      $$(ID.search).val('');

      const filterType = this.storage.filter('labels');

      if ('all' === filterType) {
        labels = this._labels;
      } else if ('leastone' === filterType) {
        labels = this._labels.filter((v) => {
          for (const bundle of this._bundles.values()) {
            const translation = bundle.get(v);
            if (!translation || !translation.trim()) {
              return true;
            }
          }
          return false;
        });
      } else if ('onlydups' === filterType) {
        labels = this._labels.filter((v) => {
          return v in this._duplicates;
        });
        // sort just so that duplicates are right below the original label
        labels.sort();
      }
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

    $$(ID.labelsCount).text(labels.length);
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

  newLocale(locale) {
    if (locale.length > 5) {
      // notify user
      this._app.dialog.alert('Invalid locale name! Use either (locale) or (locale_Country) format, e.g., `en` or `en_US`.');
      return;
    }

    const { dirname, name } = Utils.getBundleName(
      this._bundles.values().next().value.filepath);

    const newBundleFilePath = Utils.getBundleFilePath(dirname, name, locale);
    const newBundleFileName = Utils.getBundleName(newBundleFilePath).filename;

    const bundle = new ResBundle(newBundleFilePath, newBundleFileName, locale);
    this._bundles.set(bundle.filename, bundle);

    this.updateLocaleChips();
  }

  newBundles(bundleFilePath) {
    const { dirname, name, locale } = Utils.getBundleName(bundleFilePath);
    if (!name) {
      // notify user
      this._app.dialog.alert('File name not specified!');
      return;
    } else if (!locale) {
      // notify user
      this._app.dialog.alert('File name does not specify a locale!');
      return;
    }

    const bundle = new ResBundle(bundleFilePath, name, locale);
    this._labels = [];
    this._duplicates = {};
    this._bundles = new Map();
    this._bundles.set(bundle.filename, bundle);

    this.editLabel(false);
    this.filterLabels(false);
    // allow search and adding new labels
    this.displayLabels(true);
    this.updateLocaleChips();
    // notify user
    $$('#nav-title').text(name);
    this._app.toast.create({
      text: `New ${bundle.filename} opened.`,
      closeTimeout: Defs.TOAST_NORMAL,
    }).open();
  }

  openBundles(bundleFilePath) {
    const { dirname, name } = Utils.getBundleName(bundleFilePath);

    this._app.dialog.progress(); // open progress

    new ResLoader().path(dirname).name(name).load().then((result) => {
      this._app.dialog.close(); // close progress

      const { bundles, index, duplicates } = result;

      if (bundles.size > 0) {
        this._labels = Object.keys(index).map((key) => key);
        this._duplicates = duplicates;
        this._bundles = bundles;
        this.editLabel(false);
        this.filterLabels(false);
        // allow search and adding new labels
        this.displayLabels(true);
        this.updateLocaleChips();
        // notify user
        $$('#nav-title').text(name);
        this._app.toast.create({
          text: `Loaded ${bundles.size} file(s) for ${name}.`,
          closeTimeout: Defs.TOAST_NORMAL,
        }).open();
        // notify user about duplicates
        if (Object.keys(this._duplicates).length > 0) {
          Utils.doAsync(() => this.showDuplicates());
        }
      } else {
        // disallow search and adding new labels
        this.displayLabels(false);
        // notify user
        this._app.dialog.alert('No strings found in file(s)!', 'Invalid bundle(s)');
      }
    }).catch((e) => {
      this._app.dialog.close(); // close progress
      console.error('Failed loading file!', e);
      // disallow search and adding new labels
      this.displayLabels(false);
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

        savedNames.push(bundle.filename);
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

  exportBundles(exportType, bundleName) {
    if (this._bundles) {
      if (exportType === 'json_files') {
        Utils.exportBundlesToJson(this._bundles, bundleName).then(filePath => {
          // notify user
          this._app.toast.create({
            text: `Exported to ${filePath}.`,
            closeTimeout: Defs.TOAST_NORMAL,
          }).open();
        }).catch(e => {
          console.error('JSON Export failed!', e);
        });
      } else if (exportType === 'xlsx_files') {
        Utils.exportBundlesToXLSX(this._bundles, bundleName).then(filePath => {
          // notify user
          this._app.toast.create({
            text: `Exported to ${filePath}.`,
            closeTimeout: Defs.TOAST_NORMAL,
          }).open();
        }).catch(e => {
          console.error('XLSX Export failed!', e);
        });
      } else {
        // notify user
        this._app.dialog.alert(`Unknow export type ${exportType}!`);
      }
    } else {
      // notify user
      this._app.dialog.alert('Nothing to export!');
    }
  }

  askQuit() {
    this._app.dialog.confirm('Are you sure?', `Quit ${Defs.APP_NAME}`,
      () => ipcRenderer.sendSync('_quit'));
  }

  updateLocaleChips() {
    const obj = { locales: [] };
    for (const bundle of this._bundles.values()) {
      obj.locales.push(bundle.locale);
    }
    const html = this._templates.locales(obj);
    $$('#chip-locales').html(html);
  }

  updateBounds(bounds) {
    console.log('New window bounds', bounds);
    this.storage.mainWindow('bounds', bounds);
  }

  showDuplicates() {
    this._app.popup.create({
      el: '.popup-duplicates',
      on: {
        open: () => {
          $$('#duplicate-labels').html(
            this._templates.duplicateLabels({ duplicates: this._duplicates }));
        }
      }
    }).open();
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