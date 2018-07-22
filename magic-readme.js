const path = require('path');
const markdownMagic = require('markdown-magic');

const config = {
  transforms: {
    SUBPACKAGELIST: require('markdown-magic-subpackage-list')
  }
};

const callback = function(updatedContent, outputConfig) {
};

const markdownPath = path.join(__dirname, 'README.md');
markdownMagic(markdownPath, config, callback);
