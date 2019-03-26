// @flow

import type { Element } from 'react';
import React, { useState, useEffect } from 'react';

type props = {|
  src: string,
  children: any => Element<any>
|};

const Loader = ({ src, children }:props) => {
  const [ data, setData ] = useState({});
  useEffect(() => {
    const fetcher = async () => {
      const response = await fetch(src);
      const json = await response.json();
      setData(json);
    }
    fetcher();
  }, [ src ]);

  return children(data);
};

export default Loader;