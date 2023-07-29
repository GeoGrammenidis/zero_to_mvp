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

### Level 0

1. before implementing something more complex, updated the level_0.html so that it has ids and buttons
2. using those ids and buttons used "speechSynthesis" API. I kept it simple, just to make sure everything works as expected with this API.
3. added functionallities such as "pause, resume, cancel"
4. added some logs on events such as "onstart, onend, onpause, onerror".
5. added state to track the state.
6. to keep code readable, cleaned up the code a bit.
7. issue found on chrome:
   - "onwordboundary, onpause, onresume" don't work as they should.
   - pause boolean stays false even after pause function is called.
   - So for the state we won't rely on them. We can rey on the button click event for pause / resume.
8. an other issue was found. sometimes cancel button needs to be pressed, even if nothing is currently playing. So before playing anything new, it would be a good idea to preactively cancel. In future steps I will keep in mind that onerror will fire on cancel as well.
9. the widget state should be based on click events.
   - clicked while in data-state of the button is idle
     1. call cancel method from the `SpeechSynthesisUtterance` object. In case something is already playing it should stop. This is done to avoid a bug which sometimes requires to call the cancel method before the player is again available.
     2. handle the expected triggered error for this cancel method.
     3. update the text property from the `SpeechSynthesisUtterance` object
     4. call speak method from the `SpeechSynthesisUtterance` object.
     5. update buttons content & data-state to "playing"
     6. save button element in a elementPlaying variable.
   - clicked while in data-state of the button is playing
     1. call pause method from the `SpeechSynthesisUtterance` object.
     2. update buttons content & data-state to "paused"
   - clicked while in data-state of the button is "paused"
     1. call resume method from the `SpeechSynthesisUtterance` object.
     2. update buttons content & data-state to "playing"
   - on events onerror, onend,
     1. if elementPlaying isn't null then update the data-state from it to idle.
     2. save null in a elementPlaying variable.
   - on onstart if property pending from the `SpeechSynthesisUtterance` object is true throw an error for now. This happens probably because something else currently is using the speech API in the website. This case will be handled later.

## TODO list

- impliment something simple based on what I have studied for level zero.
- check and update [package.json](./package.json)
- don't forget to make a renderPlayer function to render the player as asked
- handle the case in which when onstart event is fired, property pending from the `SpeechSynthesisUtterance` object is true
