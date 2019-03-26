// @flow

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import ReactJson from 'react-json-view'

import Config from './config';
import Loader from './loader';
import style from './index.css';

const ENDPOINT = `${Config.api}/json/session`;
const POLL_INTERVAL = 10 * 1000;

const PathProvider = ({ children }) => {
  const [ data, setData ] = useState({ time: Date.now() });
  const reload = () => setData({ time: Date.now() });
  return children(`${ENDPOINT}?t=${data.time}`, reload);
};

const Timer = ({ interval, callback }) => {
  useEffect(() => {
    const timer = setInterval(callback, interval);
    return () => clearInterval(timer);
  });
  return null;
}

const Index = () => (
  <PathProvider>
    {(path, reload) => (
      <section>
        <Timer interval={POLL_INTERVAL} callback={reload} />
        <button onClick={reload}>RELOAD</button>
        <Loader src={path}>
          {data => <ReactJson src={data} />}
        </Loader>
      </section>
    )}
  </PathProvider>
);

const root = document.getElementById("index");
root && ReactDOM.render(<Index />, root);