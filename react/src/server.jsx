import { renderToString } from 'react-dom/server';
import App, { PAGES } from './App.jsx';
import { SITE, SERVICES, PROJECTS } from './ui.jsx';
import { VIDEOS } from './Work.jsx';

export const render = props => renderToString(<App {...props} />);
export const pageMeta = name => PAGES[name][1];
export { SITE, SERVICES, PROJECTS, VIDEOS };
