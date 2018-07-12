Reside [![Build Status](https://travis-ci.org/petarov/reside.svg?branch=master)](https://travis-ci.org/petarov/reside)
====================

![Residé Himself](src/assets/icons/png/cat-vampire-icon-96x96.png)

A [Java-ResourceBundle](https://docs.oracle.com/javase/7/docs/api/java/util/ResourceBundle.html) files GUI editor app for the desktop.

![Reside App Screenshot](https://i.imgur.com/sZsJLgf.png)

# Eh, what?

Reside is an app that allows for editing or creating new [PropertyResourceBundle](https://docs.oracle.com/javase/7/docs/api/java/util/PropertyResourceBundle.html) files that are normally used to localize Java applications. Those are simply key/value text files that may also be viewed in an text editor or in an IDE, which brings us to the next question.

# Why?

IDEs like IntelliJ already provide mature and reliable resource bundles [editor UI](https://www.jetbrains.com/help/idea/resource-bundle-editor.html), so this tool does not offer anything new for developers. However, it is not just developers that need to edit and maintain locale-specific data. Other members on your team that do not have or need access to an IDE may benefit from using this app. 

Here's an outline of what Reside can do:

  - Edit all available bundle locale files simultaneously.
  - Add new locales to loaded bundle files.
  - Search for labels, texts in all loaded bundle files.
  - Support for saving the files as either `utf8` or `latin1` encoded. Choosing the latter will automatically escape all `ucs2` characters, .e.g, `\u00e4`.
  - Select whether to use `LF`, `CRLF` or html `<br>` for new lines in translations.

# Development

To install dependencies run:
  
    yarn install

To run a dev build:

    yarn start

To run a release preview:

    yarn demo

# Sponsors

<a href="https://midpoints.de/">![midpoints GmbH](https://midpoints.de/web/web.nsf/midpoints263x90.png)</a>

# License

[MIT License](LICENSE.md)

Logo and icons [license](src/assets/icons/README.md).
