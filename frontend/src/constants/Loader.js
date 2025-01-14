import React from 'react';
import loaderStyles from '../styles/components/loader.module.css';

const Loader = () => {
  return (
    <div className={loaderStyles.loader}>
      <span className={loaderStyles.loaderText}>loading</span>
        <span className={loaderStyles.load}></span>
    </div>
  );
};

export default Loader;
