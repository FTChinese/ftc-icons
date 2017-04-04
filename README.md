This repository is used as template partials to be included directly in HTML. To use icon images on `src` or background, use the [fticons](https://github.com/Financial-Times/fticons).

## Install
```
bower install ftc-icons
```

## Usage

Configure the search path of your template engine. Take `nunjucks` for example:

```js
const nunjucks = require('nunjucks');
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(
    [
      'views',
      'bower_components/ftc-icons'
    ],
    {
      watch: false,
      noCache: true
    }
  ),
  {
    autoescape: false,
  }
);
```

In you html:

```html
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
{% include "partials/arrow-up.svg" %}
</svg>
<svg class="arrow-up">
	<use xlink:href="#o-icons__arrow-up" />
</svg>
```

The result html after rendered:

```html
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
<symbol id="o-icons__arrow-up" viewBox="0 0 1024 1024"><path d="M264.8 604.7l61.8 61.8L512 481.1l185.4 185.4 61.8-61.8L512 357.5z"/></symbol>
</svg>
<svg class="arrow-up">
	<use xlink:href="#o-icons__arrow-up" />
</svg>
```

Each symbol has an `id` in the form `o-icons__{{icon-name}}`.

In css, you can style it to any color you want:

```css
.arrow-up {
  fill: #eb198d;
}
```

See [<symbol>](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol) docs and its usage as an icon [SVG `symbol` a Good Choice for Icons](https://css-tricks.com/svg-symbol-good-choice-icons/)

