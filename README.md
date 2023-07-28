# Zero to mvp project.

## How to run

To run the project

1. you need node install (suggested node version 18.17.#)
2. run `npm i`
3. run `npm run start`
4. navigate to the available local server and from there to any level you wish.

## How I worked

### Level -1

1. spent some time on understanding the project before starting working on it
   - carefully checked everything in it
   - created a mental model in my mind that could lead to a solution
   - inform the team about my first estimate time
2. created the project and initialized git
3. created a README file
4. npm:
   - tool used [nvm](https://github.com/nvm-sh/nvm)
   - npm version used: 9.6.7
   - node version used: v18.17.0, `lts/hydrogen`
   - created [package.json](./package.json) with `npm init`
   - package installed [http-server](https://www.npmjs.com/package/http-server) to server html static files with `npm i -D http-server`
   - created script in [package.json](./package.json) and a "How to run" in this README file.
5. downloaded resources for the project and added to the project ([level_1.html](./level_1.html), [level_2.html](./level_2.html), [level_3.html](./level_3.html))
6. studied [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#speech_synthesis)
7. created a homepage [homepage](./index.html) file, added a favicon & created [synthesys.js](./synthesis.js) file
8. created a TODO list
9. created a .gitignore file to ignore node_modules
10. initial commited my work, to start working on level zero (`git add .` & `git commit`)

## TODO list

- impliment something simple based on what I have studied for level zero.
- check and update [package.json](./package.json)
