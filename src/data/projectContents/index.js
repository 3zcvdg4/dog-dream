import project01 from './project-01.js';
import project02 from './project-02.js';
import project03 from './project-03.js';
import project04 from './project-04.js';
import project05 from './project-05.js';
import project06 from './project-06.js';
import project07 from './project-07.js';
import project08 from './project-08.js';
import project09 from './project-09.js';
import project10 from './project-10.js';
import project11 from './project-11.js';
import project12 from './project-12.js';

const projectContents = [
  project01,
  project02,
  project03,
  project04,
  project05,
  project06,
  project07,
  project08,
  project09,
  project10,
  project11,
  project12,
];

const contentById = Object.fromEntries(projectContents.map((content) => [content.id, content]));

export function getProjectContent(projectId) {
  return contentById[projectId] ?? null;
}

export default contentById;
