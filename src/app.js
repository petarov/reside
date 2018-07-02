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

    // Init/Create left panel view
    this.leftView = app.views.create('.view-left', {
      url: '/'
    });

    // Init/Create main view
    this.mainView = app.views.create('.view-main', {
      url: '/'
    });

    var translationsTemplate = $$('script#tpl-translations').html();
    this._compiledTranslationsTemplate = Template7.compile(translationsTemplate);

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
        console.log(filePaths);
        const components = Utils.getBundleName(filePaths[0]);
        console.log(components);
        new ResLoader()
          .path(components.dirname)
          .name(components.name)
          .load().then((mapped) => {
            if (mapped.size > 0) {
              const html = this._compiledTranslationsTemplate(
                { strings: mapped.get('TestBundle_de.properties').strings });
              $$('#nav-trans').html(html);
            } else {
              this._app.dialog.alert('No keys found in file!', 'Invalid bundle');
            }
          }).catch((e) => {
            console.error(e);
            this._app.dialog.alert('Failed loading file!');
          });
      });
      // const html = this._compiledTranslationsTemplate({strings: 
      //   {
      //     'Trans1': 'value1',
      //     'Trans2': 'value2'
      //   }
      // });
      // $$('#nav-trans').html(html);
      // console.log(html);
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