import React from 'react';
import loaderStyles from '../styles/components/loader.module.css';

const Loader = () => {
  return (
    <div class={loaderStyles.loader}>
      <span class={loaderStyles.loaderText}>loading</span>
        <span class={loaderStyles.load}></span>
    </div>
  );
};

export default Loader;
