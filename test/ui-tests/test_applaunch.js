// app launch test
const chai = require('chai'),
  chaiAsPromised = require('chai-as-promised');
const Application = require('spectron').Application;
const electronPath = require('electron');
const path = require('path');

chai.should();
chai.use(chaiAsPromised);

describe('Application launch', function () {
  this.timeout(10000);

  beforeEach(() => {
    this.app = new Application({
      chromeDriverArgs: ['remote-debugging-port=9222'],
      startTimeout: 10000,
      waitTimeout: 10000,
      quitTimeout: 5000,
      path: electronPath,
      args: [path.join(__dirname, '../..')]
    });
    console.log('Test App => ', this.app);
    return this.app.start();
  });

  beforeEach(() => {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
  });

  afterEach(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('should open a window', () => {
    return this.app.client
      // .waitUntilWindowLoaded(10000)
      .getWindowCount().should.eventually.have.at.least(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0);
  });

});