import Parser from 'html-react-parser';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Liquid } from 'liquidjs';

let engine;

const handleize = text => text.toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-');

const getEngine = (root = '/snippets') => {
  if (!engine) {
    engine = new Liquid({
      extname: '.liquid',
      root,
    });

    // reginster Shopify tags and filters
    engine.registerTag('form', {
      parse: () => {},
      render: () => '<form>',
    });
    
    engine.registerTag('endform', {
      parse: () => {},
      render: () => '</form>',
    });

    engine.registerFilter('handle', handleize)

    engine.registerFilter('handleize', handleize);

    engine.registerFilter('format_address', address => `
      <span>
        ${address.name}<br />
        ${address.address1}<br />
        ${address.address2}<br />
        ${address.city}, ${address.province_code} ${address.zip}
      </span>
    `);

    engine.registerFilter('image_url', (image) => {
      if (typeof image === 'string') {
        return image
      }
      return image && image.src || ''
    });

    engine.registerFilter(
      'money_without_trailing_zeros',
      v => `$${(v * 0.01).toFixed(2).replace('.00', '')}`,
    );
  }

  return engine;
};

class LiquidWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      html: '',
    };
  }

  async renderHtml() {
    const { template, fixture } = this.props;
    try {
      const engine = getEngine();
      const html = await engine.parseAndRender(
        template,
        fixture,
      );
      this.setState({ html });
    } catch (err) {
      console.error(err);
    }
  }

  async componentDidMount() {
    this.renderHtml();
  }

  async componentDidUpdate(prevProps, prevState) {
    if (JSON.stringify(prevProps.fixture) !== JSON.stringify(this.props.fixture)) {
      this.renderHtml();
    }
    if (prevState.html !== this.state.html) {
      this.props.init();
    }
  }

  render() {
    return Parser(this.state.html);
  }
}

LiquidWrapper.propTypes = {
  fixture: PropTypes.object,
  init: PropTypes.func,
  template: PropTypes.string.isRequired,
};

LiquidWrapper.defaultProps = {
  fixture: {},
  init: () => {},
};

export default LiquidWrapper;
