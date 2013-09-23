# Rosetta

Rosetta is a CSS *pre-* preprocessor that allows you to share variables between your Javascript code and a CSS preprocessor such as [Stylus](http://learnboost.github.com/stylus/), [Sass](http://sass-lang.com/), or [LESS](http://lesscss.org/).

It works like this:

1. You define your shared variables in one or more `.rose` files.
2. Rosetta compiles your `.rose` files into a Javascript module and one or more Stylus/Sass/LESS files.

Rosetta supports the following export formats:
* **Javascript:** CommonJS module, RequireJS module, or flat JS file.
* **CSS:** Stylus, Sass/Scss, or LESS syntax.

Rosetta's export system is easily extensible; it is straightforward to add new export formats as desired.

## Example

Imagine you want to want to create a shared variable:

    $thumbnailSize = 250px

Rosetta allows you to use this variable in both your Javascript:
```js
var rosetta = require('./rosetta');
console.log('Thumbnail size is:', rosetta.thumbnailSize.val);
```

...and your CSS (in this case, a Stylus file):
```css
@import rosetta
.thumb {
  width: $thumbnailSize
  height: $thumbnailSize
}
```

## How to install

You can use Rosetta via the command-line, as a [Grunt](http://gruntjs.com) plugin, or as a Javascript library.

To install for use on the command-line:
```
$ sudo npm install -g rosetta
```

To install for Grunt or as a JS library:
```
$ npm install rosetta
```

See [How to run Rosetta](#howToRun) for instructions on how to invoke the compiler.

## File format

Rosetta uses the same variable declaration syntax as Stylus. It looks like this:
```
$myVar = 55px
```
Semicolons are optional.

You can use a variety of data types:
```
$number = 45px
$color = #00FF00
$rgb = rgba(255, 13, 17, 0.3)
$url = url('/penguins.png')
$string = 'hello, world'
$css = top left, center center
```

Variables can reference other variables and be combined using arithmetic expressions:
```
$foo = 35px
$bar = $foo + 5 // bar is 40px
$baz = foo * (bar - 45)
```

Finally, you can organize your variables into namespaces:
```
colors:
  $red = #990000
  $selection = #1122CC
  $highlight = #1199AA

  prompts:
    $text = #222
    $warn = #F0F
    $error = #F00

// You can 'add' to a namespace after the fact like this.
// This can even occur in a separate .rose file
colors.somethingElse:
  $foo = colors.prompts.$error  // fully-qualified references!
```

Rosetta can either dump each namespace to its own CSS file or concat them into a single large file.

## Accessing Rosetta variables

### Javascript
Rosetta creates a JS object whose structure reflects your namespace structure. Given a Rosetta file like this:
```
$numShapes = 5
animationDurations:
  $dialogAppear = 400ms
  $dialogDismiss = 200ms
```
...the vars can be accessed like this:
```js
// in this example, we're using the CommonJS output format
var rosetta = require('./rosetta');
...
rosetta.numShapes.val;    // 5
rosetta.animationDurations.dialogAppear.val;    // 400
rosetta.animationDurations.dialogAppear.unit;   // 'ms'
```

Every Rosetta variable has the following properties:
* `val` - The 'value' part of the variable. For numbers this means just the number part (e.g. `400` from `400px`). For colors, it will be a 24-bit number (e.g. 0xAC2B39). For URLs, it will be the URL itself. Strings and raw CSS are both just strings.
* `type` - One of `number`, `color`, `string`, `url`, or `css`.

Some datatypes have additional properties:

#### number
* `unit` - The unit associated with the number, e.g. `px` or `%`. `null` if no unit specified.

#### color
* `r` - Red (0-255)
* `g` - Green (0-255)
* `b` - Blue (0-255)
* `a` - Alpha (0-1)

### CSS
All your variables will be exported to the format you specified, e.g.
```
@highlight: #2211CC // Sass format
```

However, all variables declared inside of a namespace will also be exported with a fully-qualified name:
```
// defined in colors.dialog.$highlight
@highlight: #2211CC
@colors-dialog-highlight: #2211CC
```

This allows you to access the variable even if its shortname gets trampled by something else.

## <a name="howToRun"></a>How to run Rosetta

### Command-line

```
Usage: rosetta {OPTIONS} [files]

Example:
rosetta --jsout "lib/css.js" --cssout "stylus/{{ns}}.styl" rosetta/**/*.rose

Options:

  --jsOut          Write the JS module to this file.

  --cssOut         Write the CSS to this file. If the path contains the string
                   '{{ns}}', then a file will be created for every namespace in
                   your .rose files, replacing the {{ns}} with the name of each
                   of your namspaces.

  --jsFormat       The desired output format for the JS module. Supports
                   'commonjs', 'requirejs', and 'flat'. Default: 'commonjs'.

  --cssFormat      Desired output format for the CSS file(s). Should be one of
                   'stylus', 'sass', 'scss', or 'less'. Default: 'stylus'.

  --jsTemplate     A custom template that defines how the Javascript should be
                   formatted. This should be in the format of an Underscore.js
                   template, and must specify slots for variables named
                   'preamble' and 'blob'. For example:
                   $'<%= preamble %>\n var x = <%= blob %>;'
                   (the leading $ is required if you want bash to understand \n)

  --cssTemplate    A custom template that defines how a single CSS variable
                   should be formatted. This should be a string in the form of
                   an Underscore.js template, and must specify slots for
                   variables named 'k' (the name of the variable) and 'v' (the
                   value of the variable). For example:
                   '$<%= k %>: <%= v %>;'

  --version, -v    Print the current version to stdout.

  --help, -h       Show this message.

[files] can be a list of any number of files. Glob syntax is supported,
e.g. 'rosetta/**/*.rose' will resolve to all files that are contained in the
'rosetta' directory (or any of its subdirectories) and that end with '.rose'.
```

Note: Normally, rosetta will dump your CSS to a single file. However, if your `cssOut` path contains the string `{{ns}}`, then it will instead dump each namespace to its own file, replacing `{{ns}}` with the namespace's name. This allows you to `@include` these files individually, which can be nice if you have a lot of them, e.g.

```css
@import colors
@import colors/prompts
@import animation/prompts
```

### As a Grunt plugin

All options are the same as those for the command-line. At the very least, you should specify paths for `jsOut` and `cssOut`.

For example:
```js
module.exports = function(grunt) {
  grunt.initConfig({
    ...
    rosetta: {
      default: {
        src: ['rosetta/**/*.rose'],
        options: {
          jsFormat: 'requirejs',
          cssFormat: 'less',
          jsOut: 'lib/rosetta.js',
          cssOut: 'less/rosetta/{{ns}}.less',
        }
      }
    }
  });
  ...
  grunt.loadNpmTasks('rosetta');
};
```

### Javascript API

Example:
```js
rosetta.compile(['foo.rose', 'bar.rose'], {
  jsFormat: 'flat',
  cssFormat: 'less',
  jsOut: 'lib/rosetta.js',
  cssOut: 'less/rosetta.less'
}, function(err, outfiles) {
  if (err) {
    console.error(rosetta.formatError(err));
  } else {
    rosetta.writeFiles(outfiles, function(err) {
      if (err) throw err;
      console.log('Done!');
    }
  }
});
```

Rosetta exposes two functions: `compile` and `writeFiles`:

```js
rosetta.compile(sources, options, callback(err, outfiles));
```
...where `sources` is an array of paths and `options` is an hashmap of options (see below). `outfiles` will be an array of `{path, text}` objects, which you can pass directly to `rosetta.writeFile()`.

`options` are the same as those for the command-line API.

```js
rosetta.writeFiles([{path, text}], callback(err));
```
`writeFiles` will actually write all of the compiled files to disk, creating directories as necessary.

```js
rosetta.formatError(e)
```
Converts a Rosetta error object into human-readable error string, including a snipper of the code that generated the error. Most useful when printing errors from `rosetta.compile`.

## License

Licensed under the MIT license.
http://github.com/7sempra/rosetta/blob/master/LICENSE-MIT